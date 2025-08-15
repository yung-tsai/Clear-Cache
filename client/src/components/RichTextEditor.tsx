import { useRef, useEffect } from "react";
import { useMacSounds } from "@/hooks/useMacSounds";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  'data-testid'?: string;
  'data-entry-id'?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  readOnly, 
  'data-testid': testId,
  'data-entry-id': entryId
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const { playSound } = useMacSounds();

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    playSound('type');
    const text = (e.target as HTMLDivElement).textContent || '';
    onChange(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') {
      playSound('type');
    }
  };

  // Convert markdown-like syntax to HTML for display
  const convertToHtml = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<u>$1</u>')
      .replace(/\[highlight-yellow\](.*?)\[\/highlight-yellow\]/g, '<span class="highlight-yellow">$1</span>')
      .replace(/\[highlight-pink\](.*?)\[\/highlight-pink\]/g, '<span class="highlight-pink">$1</span>')
      .replace(/\[highlight-green\](.*?)\[\/highlight-green\]/g, '<span class="highlight-green">$1</span>')
      .replace(/\[highlight-blue\](.*?)\[\/highlight-blue\]/g, '<span class="highlight-blue">$1</span>')
      .replace(/\n/g, '<br>');
  };

  useEffect(() => {
    if (editorRef.current && entryId) {
      // Initialize stress relief system on this editor
      const stressSystem = (window as any).stressReliefInstance;
      if (stressSystem) {
        editorRef.current.setAttribute('data-entry-id', entryId);
        stressSystem.srInitEditor(editorRef.current);
      }
    }
  }, [entryId]);

  useEffect(() => {
    if (editorRef.current && value && !readOnly) {
      // Update content while preserving stress relief highlights
      if ((editorRef.current.textContent || '') !== value) {
        editorRef.current.textContent = value;
      }
    }
  }, [value, readOnly]);

  if (readOnly) {
    return (
      <div 
        className="rich-text-editor"
        dangerouslySetInnerHTML={{ __html: convertToHtml(value) }}
        data-testid={testId}
      />
    );
  }

  return (
    <div
      ref={editorRef}
      className="mac-textarea flex-1 min-h-[150px]"
      contentEditable={!readOnly}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-testid={testId}
      data-editor="true"
      data-entry-id={entryId}
      style={{ 
        whiteSpace: 'pre-wrap',
        outline: 'none'
      }}
      suppressContentEditableWarning={true}
    >
      {value}
    </div>
  );
}