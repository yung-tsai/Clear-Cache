import React from 'react';

interface FormattedTextDisplayProps {
  content: string;
  className?: string;
  'data-testid'?: string;
  style?: React.CSSProperties;
}

const FormattedTextDisplay = React.forwardRef<HTMLDivElement, FormattedTextDisplayProps>(
  ({ content, className = '', 'data-testid': testId, style }, ref) => {
    // Check if content is already HTML (from Lexical) or needs markdown conversion
    const isLexicalHtml = content.includes('<p') || content.includes('<h1') || content.includes('<strong') || content.includes('<em');
    
    let displayContent: string;
    
    if (isLexicalHtml) {
      // Content is already HTML from Lexical editor - render directly
      displayContent = content;
    } else {
      // Legacy markdown-style content - convert to HTML
      const escapeHtml = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const convertToHtml = (text: string) => {
        if (!text) return '';
        
        let result = text.replace(/\r\n?|\r/g, "\n");
        result = escapeHtml(result);

        // Convert headings
        result = result
          .replace(/^###[ \t]+(.+)$/gm, '<h3>$1</h3>')
          .replace(/^##[ \t]+(.+)$/gm, '<h2>$1</h2>')
          .replace(/^#[ \t]+(.+)$/gm, '<h1>$1</h1>');

        // Convert bullet points and lists
        result = result.replace(/^- (.+)$/gm, '• $1');
        result = result.replace(/^(\d+)\. (.+)$/gm, '$1. $2');

        // Convert stress tags
        result = result.replace(
          /\[stress-(angry|sad|anxious)\]([\s\S]*?)\[\/stress-\1\]/g,
          '<span class="stress-highlight stress-$1">$2</span>'
        );

        // Convert formatting
        result = result.replace(
          /(?<!\*)\*\*(?!\s)([\s\S]*?)(?<!\s)\*\*(?!\*)/g,
          '<strong>$1</strong>'
        );
        result = result.replace(
          /(?<!\*)\*(?![\*\s])([\s\S]*?)(?<!\s)\*(?!\*)/g,
          '<em>$1</em>'
        );
        result = result.replace(
          /(?<![\w_])_(?![_\s])([\s\S]*?)(?<!\s)_(?![\w_])/g,
          '<u>$1</u>'
        );

        return result;
      };

      displayContent = convertToHtml(content);
    }

    return (
      <div
        ref={ref}
        className={`rte-view ${className}`}
        dangerouslySetInnerHTML={{ __html: displayContent }}
        data-testid={testId}
        style={{
          minHeight: '260px',
          padding: '12px',
          border: '1px solid var(--mac-black)',
          background: 'transparent',
          ...style
        }}
      />
    );
  }
);

FormattedTextDisplay.displayName = 'FormattedTextDisplay';

export default FormattedTextDisplay;