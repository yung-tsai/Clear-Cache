import { useMemo, useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListNode, ListItemNode } from "@lexical/list";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import {
  KEY_DOWN_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  $createParagraphNode,
  $getRoot,
} from "lexical";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";

type Props = {
  initialHTML?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
};

export default function RichTextEditorLexical({
  initialHTML = "",
  onChange,
  placeholder = "Start typing…",
  readOnly,
}: Props) {
  const initialConfig = useMemo(
    () => ({
      namespace: "retro-journal",
      editable: !readOnly,
      nodes: [ListNode, ListItemNode],
      theme: {
        paragraph: "rte-p",
        text: {
          bold: "rte-bold",
          italic: "rte-italic",
          underline: "rte-underline",
        },
        list: {
          ul: "rte-ul",
          ol: "rte-ol",
          listitem: "rte-li",
        },
      },
      onError: (e: unknown) => console.error(e),
    }),
    [readOnly]
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      {!readOnly && <Toolbar />}
      <RichTextPlugin
        contentEditable={<ContentEditable className="rte-editable" />}
        placeholder={<div className="rte-placeholder">{placeholder}</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <ListPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <HotkeysPlugin />
      <LoadInitialOnce html={initialHTML} />
      <OnChangePlugin
        onChange={(editorState, editor) => {
          editorState.read(() => {
            const html = $generateHtmlFromNodes(editor);
            onChange?.(html);
          });
        }}
      />
    </LexicalComposer>
  );
}

function LoadInitialOnce({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    if (!html) return;

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      // If import produced no blocks, ensure at least one paragraph
      if (nodes.length === 0) {
        root.append($createParagraphNode());
      } else {
        root.append(...nodes);
      }
    });
  }, [editor, html]);

  return null;
}

// Only keep Cmd/Ctrl+B/I/U hotkeys - markdown shortcuts handle lists
function HotkeysPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        if (event.metaKey || event.ctrlKey) {
          const k = event.key.toLowerCase();
          if (k === "b" || k === "i" || k === "u") {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, k as "bold"|"italic"|"underline");
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}

function Toolbar() {
  return (
    <div className="rte-toolbar" style={{ display: 'none' }}>
      {/* Clean toolbar - functionality moved to keyboard shortcuts */}
    </div>
  );
}