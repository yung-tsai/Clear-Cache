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
import { $createListNode, $createListItemNode } from "@lexical/list";
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
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
      <KeyboardShortcutsPlugin />
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

// Keyboard shortcuts plugin for Bold/Italic/Underline and List creation
function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Cmd/Ctrl shortcuts
      if (event.metaKey || event.ctrlKey) {
        switch (event.key.toLowerCase()) {
          case 'b':
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
            break;
          case 'i':
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
            break;
          case 'u':
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
            break;
        }
      }
      
      // Handle "- " (dash + space) for bullet lists
      if (event.key === ' ') {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const textContent = anchorNode.getTextContent();
            
            // Check if the line starts with "- " (dash + space)
            if (textContent === '- ' && selection.anchor.offset === 2) {
              event.preventDefault();
              
              // Create bullet list
              const listNode = $createListNode("bullet");
              const listItemNode = $createListItemNode();
              listNode.append(listItemNode);
              
              const element = anchorNode.getTopLevelElementOrThrow();
              element.replace(listNode);
              
              // Clear the "- " text and focus the list item
              listItemNode.select();
            }
          }
        });
      }
    };

    const editorElement = editor.getElementByKey("root");
    if (editorElement) {
      editorElement.addEventListener('keydown', handleKeyDown);
      return () => {
        editorElement.removeEventListener('keydown', handleKeyDown);
      };
    }
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