import { useState, useRef, useEffect } from "react";
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
  const [htmlContent, setHtmlContent] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const { playSound } = useMacSounds();

  // Convert markdown-like syntax to HTML for display
  const convertToHtml = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<span class="bold">$1</span>')
      .replace(/\*(.*?)\*/g, '<span class="italic">$1</span>')
      .replace(/_(.*?)_/g, '<span class="underline">$1</span>')
      .replace(/\[highlight-yellow\](.*?)\[\/highlight-yellow\]/g, '<span class="highlight-yellow">$1</span>')
      .replace(/\[highlight-pink\](.*?)\[\/highlight-pink\]/g, '<span class="highlight-pink">$1</span>')
      .replace(/\[highlight-green\](.*?)\[\/highlight-green\]/g, '<span class="highlight-green">$1</span>')
      .replace(/\[highlight-blue\](.*?)\[\/highlight-blue\]/g, '<span class="highlight-blue">$1</span>')
      .replace(/\n/g, '<br>');
  };

  // Convert HTML back to markdown-like syntax
  const convertFromHtml = (html: string) => {
    return html
      .replace(/<span class="bold">(.*?)<\/span>/g, '**$1**')
      .replace(/<span class="italic">(.*?)<\/span>/g, '*$1*')
      .replace(/<span class="underline">(.*?)<\/span>/g, '_$1_')
      .replace(/<span class="highlight-yellow">(.*?)<\/span>/g, '[highlight-yellow]$1[/highlight-yellow]')
      .replace(/<span class="highlight-pink">(.*?)<\/span>/g, '[highlight-pink]$1[/highlight-pink]')
      .replace(/<span class="highlight-green">(.*?)<\/span>/g, '[highlight-green]$1[/highlight-green]')
      .replace(/<span class="highlight-blue">(.*?)<\/span>/g, '[highlight-blue]$1[/highlight-blue]')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<div>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/^\n/, ''); // Remove leading newline
  };

  useEffect(() => {
    const html = convertToHtml(value);
    setHtmlContent(html);
  }, [value]);

  const handleInput = () => {
    playSound('type');
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const plainText = convertFromHtml(html);
      onChange(plainText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter key to create proper line breaks
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br><br>');
      playSound('type');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  if (readOnly) {
    return (
      <div 
        className="rich-text-editor"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        data-testid={testId}
      />
    );
  }

  return (
    <div
      ref={editorRef}
      className="rich-text-editor flex-1"
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      dangerouslySetInnerHTML={{ __html: htmlContent || (placeholder ? `<span style="color: #999;">${placeholder}</span>` : '') }}
      data-testid={testId}
    />
  );
}