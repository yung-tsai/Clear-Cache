import React from 'react';

interface FormattedTextDisplayProps {
  content: string;
  className?: string;
  'data-testid'?: string;
}

export default function FormattedTextDisplay({ content, className = '', 'data-testid': testId }: FormattedTextDisplayProps) {
  // Convert markdown-style formatting to HTML for proper display
  const convertToHtml = (text: string) => {
    if (!text) return '';
    
    return text
      // Convert headings (must be at start of line)
      .replace(/^### (.+)$/gm, '<h3 class="formatted-h3">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="formatted-h2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="formatted-h1">$1</h1>')
      // Convert bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="formatted-bold">$1</strong>')
      // Convert italic text (single asterisk)
      .replace(/\*([^*]+)\*/g, '<em class="formatted-italic">$1</em>')
      // Convert underlined text
      .replace(/_([^_]+)_/g, '<u class="formatted-underline">$1</u>')
      // Convert stress highlighting
      .replace(/\[stress-angry\]([^[]+)\[\/stress-angry\]/g, '<span class="stress-highlight stress-angry">$1</span>')
      .replace(/\[stress-sad\]([^[]+)\[\/stress-sad\]/g, '<span class="stress-highlight stress-sad">$1</span>')
      .replace(/\[stress-anxious\]([^[]+)\[\/stress-anxious\]/g, '<span class="stress-highlight stress-anxious">$1</span>')
      // Convert line breaks
      .replace(/\n/g, '<br>');
  };

  const htmlContent = convertToHtml(content);

  return (
    <div
      className={`formatted-text-display ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      data-testid={testId}
    />
  );
}