import React from 'react';

interface FormattedTextDisplayProps {
  content: string;
  className?: string;
  'data-testid'?: string;
  style?: React.CSSProperties;
}

const FormattedTextDisplay = React.forwardRef<HTMLDivElement, FormattedTextDisplayProps>(
  ({ content, className = '', 'data-testid': testId, style }, ref) => {
    // Small helper: escape only risky HTML chars, not brackets
    const escapeHtml = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Convert markdown-style formatting to HTML for proper display
    const convertToHtml = (text: string) => {
      if (!text) return '';
      
      // 1) normalize line endings
      let result = text.replace(/\r\n?|\r/g, "\n");

      // 2) escape HTML (leave [] alone so our custom tags remain matchable)
      result = escapeHtml(result);

      // 3) headings (do first; use multiline anchors)
      result = result
        .replace(/^###[ \t]+(.+)$/gm, '<h3 class="formatted-h3">$1</h3>')
        .replace(/^##[ \t]+(.+)$/gm, '<h2 class="formatted-h2">$1</h2>')
        .replace(/^#[ \t]+(.+)$/gm, '<h1 class="formatted-h1">$1</h1>');

      // Convert bullet points to actual bullets
      result = result.replace(/^- (.+)$/gm, '• $1');
      
      // Convert numbered lists 
      result = result.replace(/^(\d+)\. (.+)$/gm, '$1. $2');

      // 4) stress tags (single grouped rule)
      result = result.replace(
        /\[stress-(angry|sad|anxious)\]([\s\S]*?)\[\/stress-\1\]/g,
        '<span class="stress-highlight stress-$1">$2</span>'
      );

      // 5) strong before em — prevent ** from being eaten by *
      //    Disallow leading/trailing spaces inside the markers to reduce weird matches
      result = result.replace(
        /(?<!\*)\*\*(?!\s)([\s\S]*?)(?<!\s)\*\*(?!\*)/g,
        '<strong class="formatted-bold">$1</strong>'
      );

      // 6) italic with single * (but not **, and not "* " or " *")
      result = result.replace(
        /(?<!\*)\*(?![\*\s])([\s\S]*?)(?<!\s)\*(?!\*)/g,
        '<em class="formatted-italic">$1</em>'
      );

      // 7) underline with single _ (avoid __, avoid snake_case)
      //    Require non-word boundary around underscores to skip identifiers
      result = result.replace(
        /(?<![\w_])_(?![_\s])([\s\S]*?)(?<!\s)_(?![\w_])/g,
        '<u class="formatted-underline">$1</u>'
      );

      // 8) done — keep \n, rely on white-space: pre-wrap (no <br> insertion)
      return result;
    };

    const htmlContent = convertToHtml(content);

    return (
      <div
        ref={ref}
        className={`formatted-text-display ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        data-testid={testId}
        style={{
          fontFamily: 'ChicagoFLFExact, Geneva, Arial, sans-serif',
          fontSize: '12px',
          lineHeight: '12px',
          fontWeight: 'normal',
          color: 'black',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          WebkitFontSmoothing: 'none',
          fontKerning: 'none',
          textRendering: 'optimizeSpeed',
          WebkitTextSizeAdjust: '100%',
          ...style
        }}
      />
    );
  }
);

FormattedTextDisplay.displayName = 'FormattedTextDisplay';

export default FormattedTextDisplay;