import { useMemo, useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, $createHeadingNode } from "@lexical/rich-text";
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getRoot,
} from "lexical";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";

type Props = {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
};

export default function RichTextEditorLexical({
  value = "",
  onChange,
  placeholder = "Start typing…",
  readOnly,
}: Props) {
  const initialConfig = useMemo(
    () => ({
      namespace: "retro-journal",
      editable: !readOnly,
      nodes: [HeadingNode],
      theme: {
        paragraph: "rte-p",
        text: {
          bold: "rte-bold",
          italic: "rte-italic",
          underline: "rte-underline",
        },
        heading: {
          h1: "rte-h rte-h1",
          h2: "rte-h rte-h2",
          h3: "rte-h rte-h3",
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
      <LoadInitialContent value={value} />
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

function LoadInitialContent({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!value) return;
    
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(value, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    });
  }, [editor, value]);

  return null;
}

function Toolbar() {
  const [editor] = useLexicalComposerContext();

  const toggle = (cmd: "bold" | "italic" | "underline") =>
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, cmd);

  const setBlock = (tag: "p" | "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getTopLevelElementOrThrow();
        
        if (tag === "p") {
          element.replace($createParagraphNode());
        } else {
          element.replace($createHeadingNode(tag));
        }
      }
    });
  };

  return (
    <div className="rte-toolbar">
      <button 
        type="button" 
        className="mac-toolbar-btn"
        onClick={() => toggle("bold")}
        data-testid="button-bold"
      >
        <b>B</b>
      </button>
      <button 
        type="button" 
        className="mac-toolbar-btn"
        onClick={() => toggle("italic")}
        data-testid="button-italic"
      >
        <i>I</i>
      </button>
      <button 
        type="button" 
        className="mac-toolbar-btn"
        onClick={() => toggle("underline")}
        data-testid="button-underline"
      >
        <u>U</u>
      </button>
      <select
        className="mac-input text-xs"
        defaultValue="p"
        onChange={(e) => {
          if (e.target.value !== "p") {
            setBlock(e.target.value as "p" | "h1" | "h2" | "h3");
            e.target.value = "p"; // Reset to normal
          }
        }}
        data-testid="select-text-format"
        style={{ fontFamily: 'Monaco, monospace', fontSize: '10px', width: '80px', height: '24px' }}
      >
        <option value="p">Normal</option>
        <option value="h1">H1</option>
        <option value="h2">H2</option>
        <option value="h3">H3</option>
      </select>
    </div>
  );
}