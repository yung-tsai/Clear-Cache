import {useMemo} from "react";
import {LexicalComposer} from "@lexical/react/LexicalComposer";
import {RichTextPlugin} from "@lexical/react/LexicalRichTextPlugin";
import {HistoryPlugin} from "@lexical/react/LexicalHistoryPlugin";
import {ContentEditable} from "@lexical/react/LexicalContentEditable";
import {OnChangePlugin} from "@lexical/react/LexicalOnChangePlugin";
import {LexicalErrorBoundary} from "@lexical/react/LexicalErrorBoundary";
import {HeadingNode, $createHeadingNode} from "@lexical/rich-text";
import {FORMAT_TEXT_COMMAND, $getSelection, $isRangeSelection} from "lexical";
import {$setBlocksType} from "@lexical/selection";
import { $generateHtmlFromNodes } from "@lexical/html";

type Props = {
  value?: string;                    // initial HTML (optional)
  onChange?: (html: string) => void; // returns HTML on changes
  placeholder?: string;
  readOnly?: boolean;
};

export default function RichTextEditorLexical({value = "", onChange, placeholder, readOnly}: Props) {
  const initialConfig = useMemo(() => ({
    namespace: "retro-journal",
    editable: !readOnly,
    nodes: [HeadingNode],
    onError: (e: any) => console.error(e),
    theme: {
      paragraph: "rte-p",
      text: { bold: "rte-bold", italic: "rte-italic", underline: "rte-underline" },
      heading: { h1: "rte-h rte-h1", h2: "rte-h rte-h2", h3: "rte-h rte-h3" },
    },
    editorState: (editor: any) => {
      if (!value) return;
      // naive HTML import: put raw HTML in the editor
      const div = document.createElement("div");
      div.innerHTML = value;
      editor.update(() => {
        const root = (editor as any).getRootElement?.();
      });
    },
  }), [value, readOnly]);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      {!readOnly && <Toolbar/>}
      <RichTextPlugin
        contentEditable={<ContentEditable className="rte-editable" />}
        placeholder={<div className="rte-placeholder">{placeholder || "Start typing…"}</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <OnChangePlugin onChange={(editorState, editor) => {
        editorState.read(() => {
          const html = $generateHtmlFromNodes(editor);
          onChange?.(html);
        });
      }}/>
    </LexicalComposer>
  );
}

function Toolbar() {
  const setHeading = (level: 1|2|3|"p") => {
    (window as any).$lexicalEditor?.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (level === "p") {
          $setBlocksType(selection, () => document.createElement("p") as any);
        } else {
          // use HeadingNode from @lexical/rich-text
          $setBlocksType(selection, () => $createHeadingNode(("h"+level) as any));
        }
      }
    });
  };
  const toggle = (cmd: "bold"|"italic"|"underline") =>
    (window as any).$lexicalEditor?.dispatchCommand(FORMAT_TEXT_COMMAND, cmd);

  return (
    <div className="rte-toolbar">
      <button type="button" onClick={() => toggle("bold")}>B</button>
      <button type="button" onClick={() => toggle("italic")}>I</button>
      <button type="button" onClick={() => toggle("underline")}>U</button>
      <select defaultValue="p" onChange={(e) => setHeading(e.target.value as any)}>
        <option value="p">Normal</option>
        <option value="1">H1</option>
        <option value="2">H2</option>
        <option value="3">H3</option>
      </select>
    </div>
  );
}