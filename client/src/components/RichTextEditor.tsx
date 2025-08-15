import { useRef, useEffect } from "react";
import { useMacSounds } from "@/hooks/useMacSounds";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  'data-testid'?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  readOnly, 
  'data-testid': testId 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { playSound } = useMacSounds();

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    playSound('type');
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    <textarea
      ref={editorRef}
      className="mac-textarea flex-1 min-h-[150px]"
      value={value}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      readOnly={readOnly}
      data-testid={testId}
    />
  );
}