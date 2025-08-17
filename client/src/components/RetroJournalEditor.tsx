import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
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

/** Single generic tag mark -> <span data-tag="1">…</span> */
const TagMark = Mark.create({
  name: "tag",
  inclusive: true,
  group: "inline",
  inline: true,
  spanning: true,
  parseHTML() { 
    return [{ tag: 'span[data-tag]' }, { tag: 'span[data-emotion]' }]; 
  },
  renderHTML({ HTMLAttributes }) {
    // Normalize old data-emotion into data-tag on render
    const attrs = { ...HTMLAttributes };
    if (!attrs['data-tag']) attrs['data-tag'] = '1';
    delete (attrs as any)['data-emotion'];
    return ['span', mergeAttributes(attrs), 0];
  },
});

/** Ctrl/Cmd+U shortcut for underline */
const UnderlineShortcuts = Extension.create({
  name: "underlineShortcuts",
  addKeyboardShortcuts() {
    return { "Mod-u": () => this.editor.commands.toggleUnderline() };
  },
});

const RetroJournalEditor = forwardRef<RetroJournalEditorHandle, Props>(
({ value = "<p></p>", onChange, placeholder = "Start writing your journal…", className }, ref) => {
  const [showTagPopup, setShowTagPopup] = useState(false);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [hoverEl, setHoverEl] = useState<HTMLElement | null>(null);

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
      TagMark,
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

  // Hover delete functionality for tagged spans
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;

    const onOver = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement;
      const el = t?.closest?.('span[data-tag], span[data-emotion]') as HTMLElement | null;
      if (el) {
        setHoverEl(el);
        setHoverRect(el.getBoundingClientRect());
      } else {
        setHoverEl(null);
        setHoverRect(null);
      }
    };
    
    const onScroll = () => {
      if (hoverEl) setHoverRect(hoverEl.getBoundingClientRect());
    };

    dom.addEventListener('mousemove', onOver);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      dom.removeEventListener('mousemove', onOver);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [editor, hoverEl]);

  const addTag = () => {
    if (!editor) return;
    editor.chain().focus().setMark("tag", { 'data-tag': '1' }).run();
    setShowTagPopup(false);
  };

  const removeTag = () => {
    if (!editor) return;
    editor.chain().focus().unsetMark("tag").run();
    setShowTagPopup(false);
  };

  const removeThisTag = () => {
    if (!editor || !hoverEl) return;
    const view = editor.view;
    try {
      const from = view.posAtDOM(hoverEl, 0);
      const to = view.posAtDOM(hoverEl, hoverEl.childNodes.length);
      editor.chain().setTextSelection({ from, to }).unsetMark('tag').run();
      setHoverEl(null);
      setHoverRect(null);
    } catch { /* ignore */ }
  };

  if (!editor) return null;

  return (
    <div className={`retro-editor-shell ${className ?? ""}`}>
      {/* Enhanced toolbar with tag functionality */}
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
        
        {/* Tag controls */}
        <div className="emotion-controls">
          <button 
            className={editor.isActive("tag") ? "active" : ""} 
            onClick={() => setShowTagPopup(!showTagPopup)}
            title="Tag selected text"
          >
            🏷️ Tag
          </button>
          {showTagPopup && (
            <div className="emotion-popup" onClick={(e) => e.stopPropagation()}>
              <button onClick={(e) => { e.stopPropagation(); addTag(); }}>Add Tag</button>
              <button onClick={(e) => { e.stopPropagation(); removeTag(); }} className="clear-emotion">Remove Tag</button>
            </div>
          )}
        </div>
      </div>

      {/* Hover delete popover */}
      {hoverRect && (
        <div
          className="tag-popover"
          style={{
            position: 'fixed',
            top: Math.max(8, hoverRect.top - 28),
            left: hoverRect.left,
            zIndex: 99999,
          }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <button type="button" className="tag-popover-btn" onClick={removeThisTag} title="Remove tag">🗑️ Remove</button>
        </div>
      )}

      <div className="editor-surface">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

export default RetroJournalEditor;