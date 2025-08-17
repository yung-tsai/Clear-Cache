import React, { forwardRef, useImperativeHandle } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import Placeholder from "@tiptap/extension-placeholder";
import { Mark, mergeAttributes, Extension } from "@tiptap/core";

export type RetroJournalEditorHandle = {
  focus: () => void;
  insertParagraph: () => void;
  insertText: (text: string) => void;
  getHTML: () => string;
};

type Props = {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
};

/* Inline emotion mark: <span data-emotion="angry|sad|anxious|relieved">…</span> */
const Emotion = Mark.create({
  name: "emotion",
  addAttributes() {
    return {
      type: {
        default: null,
        renderHTML: (attrs: any) => ({ "data-emotion": attrs.type || null }),
        parseHTML: (el: HTMLElement) => el.getAttribute("data-emotion"),
      },
    };
  },
  parseHTML() { 
    return [{ tag: "span[data-emotion]" }]; 
  },
  renderHTML({ HTMLAttributes }) { 
    return ["span", mergeAttributes(HTMLAttributes), 0]; 
  },
});

/* Add Mod-U shortcut for underline */
const UnderlineShortcuts = Extension.create({
  name: "underlineShortcuts",
  addKeyboardShortcuts() {
    return { 
      "Mod-u": () => this.editor.commands.toggleUnderline() 
    };
  },
});

const RetroJournalEditor = forwardRef<RetroJournalEditorHandle, Props>(
({ value = "<p></p>", onChange, placeholder = "Start writing your journal…", className }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      UnderlineShortcuts,
      Heading.configure({ levels: [1, 2, 3] }),
      Placeholder.configure({ placeholder }),
      Emotion,
    ],
    content: value?.trim() ? value : "<p></p>",
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  useImperativeHandle(ref, () => ({
    focus: () => { editor?.commands.focus(); },
    insertParagraph: () => { editor?.chain().focus().insertContent("<p></p>").run(); },
    insertText: (text: string) => { editor?.chain().focus().insertContent(text).run(); },
    getHTML: () => editor?.getHTML() ?? "",
  }), [editor]);

  if (!editor) return null;

  return (
    <div className={`retro-editor-shell ${className ?? ""}`}>
      {/* Simple toolbar */}
      <div className="retro-toolbar">
        <button 
          className={editor.isActive("bold") ? "active" : ""} 
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl/Cmd+B)"
        >
          B
        </button>
        <button 
          className={editor.isActive("italic") ? "active" : ""} 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl/Cmd+I)"
        >
          I
        </button>
        <button 
          className={editor.isActive("underline") ? "active" : ""} 
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl/Cmd+U)"
        >
          U
        </button>
        <div className="separator" />
        <button 
          className={editor.isActive("bulletList") ? "active" : ""} 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          •
        </button>
      </div>

      <div className="editor-surface">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

export default RetroJournalEditor;