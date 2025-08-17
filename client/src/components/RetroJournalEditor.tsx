import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";
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

/* Removed UnderlineShortcuts to fix duplicate extension warning */

const RetroJournalEditor = forwardRef<RetroJournalEditorHandle, Props>(
({ value = "<p></p>", onChange, placeholder = "Start writing your journal…", className }, ref) => {
  const [showEmoPopup, setShowEmoPopup] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        heading: false,
        bold: true,
        italic: true,
      }),
      Underline.extend({
        addKeyboardShortcuts() {
          return {
            'Mod-u': () => this.editor.commands.toggleUnderline(),
          }
        }
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      Placeholder.configure({ placeholder }),
      Emotion,
    ],
    content: value?.trim() ? value : "<p></p>",
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  // Update content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value?.trim() ? value : "<p></p>", false);
    }
  }, [editor, value]);

  useImperativeHandle(ref, () => ({
    focus: () => { editor?.commands.focus(); },
    insertParagraph: () => { editor?.chain().focus().insertContent("<p></p>").run(); },
    insertText: (text: string) => { editor?.chain().focus().insertContent(text).run(); },
    getHTML: () => editor?.getHTML() ?? "",
  }), [editor]);

  if (!editor) return null;

  const addEmotionTag = (type: string) => {
    editor.chain().focus().setMark("emotion", { type }).run();
    setShowEmoPopup(false);
  };

  const removeEmotionTag = () => {
    editor.chain().focus().unsetMark("emotion").run();
    setShowEmoPopup(false);
  };

  return (
    <div className={`retro-editor-shell ${className ?? ""}`}>
      {/* Enhanced toolbar with emotion tagging */}
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
          title="Bullet List (- + space)"
        >
          •
        </button>
        <button 
          className={editor.isActive("orderedList") ? "active" : ""} 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List (1. + space)"
        >
          1.
        </button>
        <div className="separator" />
        
        {/* Heading dropdown */}
        <select 
          className="heading-select" 
          value={
            editor.isActive("heading", { level: 1 }) ? "1" :
            editor.isActive("heading", { level: 2 }) ? "2" :
            editor.isActive("heading", { level: 3 }) ? "3" : "p"
          }
          onChange={(e) => {
            const value = e.target.value;
            if (value === "p") {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().setHeading({ level: Number(value) as 1|2|3 }).run();
            }
          }}
        >
          <option value="p">Normal</option>
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option value="3">H3</option>
        </select>

        <div className="separator" />
        
        {/* Emotion tagging */}
        <div className="emotion-controls">
          <button 
            className={editor.isActive("emotion") ? "active" : ""} 
            onClick={() => setShowEmoPopup(!showEmoPopup)}
            title="Tag emotions in your text"
          >
            🙂 Tag
          </button>
          {showEmoPopup && (
            <div className="emotion-popup" onClick={(e) => e.stopPropagation()}>
              <button onClick={(e) => { e.stopPropagation(); addEmotionTag("angry"); }}>😠 Angry</button>
              <button onClick={(e) => { e.stopPropagation(); addEmotionTag("sad"); }}>😢 Sad</button>
              <button onClick={(e) => { e.stopPropagation(); addEmotionTag("anxious"); }}>😰 Anxious</button>
              <button onClick={(e) => { e.stopPropagation(); addEmotionTag("relieved"); }}>😌 Relieved</button>
              <button onClick={(e) => { e.stopPropagation(); removeEmotionTag(); }} className="clear-emotion">Clear</button>
            </div>
          )}
        </div>
      </div>

      <div className="editor-surface">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

export default RetroJournalEditor;