import { useRef, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useMacSounds } from "@/hooks/useMacSounds";
import StressLevelPopover from "./StressLevelPopover";
import FormattedTextDisplay from "./FormattedTextDisplay";
import type { CatharsisItem } from "@shared/schema";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCatharsisUpdate?: (items: CatharsisItem[]) => void;
  catharsisItems?: CatharsisItem[];
  placeholder?: string;
  readOnly?: boolean;
  'data-testid'?: string;
  onFormat?: (command: 'bold' | 'italic' | 'underline' | 'h1' | 'h2' | 'h3') => void;
}

export default function RichTextEditor({ 
  value, 
  onChange,
  onCatharsisUpdate,
  catharsisItems = [],
  placeholder, 
  readOnly, 
  'data-testid': testId,
  onFormat
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { playSound } = useMacSounds();
  const [showStressPopover, setShowStressPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  // Shared font configuration to prevent fallback drift
  const sharedFont = {
    font: `normal normal 400 var(--rte-size)/var(--rte-line) ChicagoFLFExact, Geneva, Arial, sans-serif`,
    letterSpacing: 0 as any,
    whiteSpace: 'pre-wrap' as const,
    overflowWrap: 'break-word' as const,
    WebkitFontSmoothing: 'none' as const,
    fontKerning: 'none' as const,
    textRendering: 'optimizeSpeed' as const,
    WebkitTextSizeAdjust: '100%' as const,
  } as const;

  // Scroll synchronization to prevent jumps when content overflows
  const onScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (previewRef.current) {
      previewRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    playSound('type');
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') {
      playSound('type');
    }

    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;
    const currentValue = textarea.value;
    
    // Handle keyboard shortcuts
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          if (onFormat) {
            onFormat('bold');
          } else {
            applyFormatting('**', '**', 'bold text');
          }
          return;
        case 'i':
          e.preventDefault();
          if (onFormat) {
            onFormat('italic');
          } else {
            applyFormatting('*', '*', 'italic text');
          }
          return;
        case 'u':
          e.preventDefault();
          if (onFormat) {
            onFormat('underline');
          } else {
            applyFormatting('_', '_', 'underlined text');
          }
          return;
      }
    }

    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const lineStart = currentValue.lastIndexOf('\n', selectionStart - 1) + 1;
      const lineContent = currentValue.substring(lineStart, selectionStart);
      
      if (e.shiftKey) {
        // Shift+Tab: Remove indentation
        if (lineContent.startsWith('  ')) {
          const newValue = currentValue.substring(0, lineStart) + 
                          lineContent.substring(2) + 
                          currentValue.substring(selectionStart);
          onChange(newValue);
          setTimeout(() => {
            textarea.setSelectionRange(selectionStart - 2, selectionEnd - 2);
          }, 0);
        }
      } else {
        // Tab: Add indentation
        const newValue = currentValue.substring(0, lineStart) + 
                        '  ' + lineContent + 
                        currentValue.substring(selectionStart);
        onChange(newValue);
        setTimeout(() => {
          textarea.setSelectionRange(selectionStart + 2, selectionEnd + 2);
        }, 0);
      }
      return;
    }

    // Handle Enter for auto-formatting
    if (e.key === 'Enter') {
      const lineStart = currentValue.lastIndexOf('\n', selectionStart - 1) + 1;
      const lineContent = currentValue.substring(lineStart, selectionStart);
      
      // Check for bullet point continuation
      const bulletMatch = lineContent.match(/^(\s*)-\s(.*)$/);
      const numberedMatch = lineContent.match(/^(\s*)(\d+)\.\s(.*)$/);
      
      if (bulletMatch) {
        e.preventDefault();
        const indent = bulletMatch[1];
        const content = bulletMatch[2];
        
        if (content.trim() === '') {
          // Empty bullet point - remove it and unindent
          const newValue = currentValue.substring(0, lineStart) + 
                          currentValue.substring(selectionStart);
          onChange(newValue);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
        } else {
          // Continue bullet list
          const newBullet = `\n${indent}- `;
          const newValue = currentValue.substring(0, selectionStart) + 
                          newBullet + 
                          currentValue.substring(selectionEnd);
          onChange(newValue);
          setTimeout(() => {
            textarea.setSelectionRange(selectionStart + newBullet.length, selectionStart + newBullet.length);
          }, 0);
        }
        return;
      }
      
      if (numberedMatch) {
        e.preventDefault();
        const indent = numberedMatch[1];
        const currentNum = parseInt(numberedMatch[2]);
        const content = numberedMatch[3];
        
        if (content.trim() === '') {
          // Empty numbered item - remove it
          const newValue = currentValue.substring(0, lineStart) + 
                          currentValue.substring(selectionStart);
          onChange(newValue);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
        } else {
          // Continue numbered list
          const nextNum = currentNum + 1;
          const newNumbered = `\n${indent}${nextNum}. `;
          const newValue = currentValue.substring(0, selectionStart) + 
                          newNumbered + 
                          currentValue.substring(selectionEnd);
          onChange(newValue);
          setTimeout(() => {
            textarea.setSelectionRange(selectionStart + newNumbered.length, selectionStart + newNumbered.length);
          }, 0);
        }
        return;
      }
    }

    // Handle Space for auto-formatting
    if (e.key === ' ') {
      const lineStart = currentValue.lastIndexOf('\n', selectionStart - 1) + 1;
      const lineContent = currentValue.substring(lineStart, selectionStart);
      
      // Auto-bullet point: "- " -> bullet
      if (lineContent === '-') {
        e.preventDefault();
        const newValue = currentValue.substring(0, lineStart) + 
                        '- ' + 
                        currentValue.substring(selectionStart);
        onChange(newValue);
        setTimeout(() => {
          textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
        }, 0);
        return;
      }
      
      // Auto-numbered list: "1. " -> numbered
      const numberedPattern = /^(\d+)\.$/;
      if (numberedPattern.test(lineContent)) {
        e.preventDefault();
        const newValue = currentValue.substring(0, lineStart) + 
                        lineContent + ' ' + 
                        currentValue.substring(selectionStart);
        onChange(newValue);
        setTimeout(() => {
          textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
        }, 0);
        return;
      }
      
      // Auto-heading: "# " -> H1, "## " -> H2, "### " -> H3
      const headingPattern = /^(#{1,3})$/;
      if (headingPattern.test(lineContent)) {
        e.preventDefault();
        const newValue = currentValue.substring(0, lineStart) + 
                        lineContent + ' ' + 
                        currentValue.substring(selectionStart);
        onChange(newValue);
        setTimeout(() => {
          textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
        }, 0);
        return;
      }
    }
  };

  const applyFormatting = (prefix: string, suffix: string, placeholder: string) => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const { selectionStart, selectionEnd } = textarea;
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    let newText: string;
    let newCursorPos: number;
    
    if (selectedText) {
      // Text is selected, wrap it
      newText = value.substring(0, selectionStart) + 
               prefix + selectedText + suffix + 
               value.substring(selectionEnd);
      newCursorPos = selectionEnd + prefix.length + suffix.length;
    } else {
      // No selection, insert placeholder
      newText = value.substring(0, selectionStart) + 
               prefix + placeholder + suffix + 
               value.substring(selectionStart);
      newCursorPos = selectionStart + prefix.length + placeholder.length;
    }
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      } else {
        textarea.setSelectionRange(selectionStart + prefix.length, newCursorPos - suffix.length);
      }
    }, 0);
  };

  const handleTextSelection = () => {
    // Disable catharsis popup - it interferes with text formatting
    return;
  };

  const handleStressSelection = (stressLevel: 'angry' | 'sad' | 'anxious') => {
    if (!selectionRange) return;
    
    const newCatharsisItem: CatharsisItem = {
      id: `catharsis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: selectedText,
      stressLevel,
      createdAt: new Date().toISOString()
    };
    
    const updatedItems = [...catharsisItems, newCatharsisItem];
    onCatharsisUpdate?.(updatedItems);
    
    // Add stress highlighting to the text
    const stressColor = getStressColor(stressLevel);
    const before = value.substring(0, selectionRange.start);
    const selected = value.substring(selectionRange.start, selectionRange.end);
    const after = value.substring(selectionRange.end);
    
    const newValue = `${before}[stress-${stressLevel}]${selected}[/stress-${stressLevel}]${after}`;
    onChange(newValue);
    
    setShowStressPopover(false);
    setSelectedText("");
    setSelectionRange(null);
    playSound('success');
  };

  const getStressColor = (level: 'angry' | 'sad' | 'anxious') => {
    switch (level) {
      case 'angry': return '#ff4444';
      case 'sad': return '#4444ff';
      case 'anxious': return '#ffaa00';
      default: return '#666';
    }
  };

  // Runtime line-height calibrator to handle browser/zoom differences
  useEffect(() => {
    const ta = editorRef.current;
    if (!ta) return;
    
    const probe = document.createElement('div');
    Object.assign(probe.style, {
      position: 'absolute',
      visibility: 'hidden',
      inset: '0',
      padding: '0',
      margin: '0',
      border: 'none',
      boxSizing: 'border-box',
      font: `normal normal 400 var(--rte-size)/var(--rte-line) ChicagoFLFExact, Geneva, Arial, sans-serif`,
      whiteSpace: 'pre-wrap',
    } as CSSStyleDeclaration);
    probe.textContent = 'X\nX';
    ta.parentElement!.appendChild(probe);

    const taLH = parseFloat(getComputedStyle(ta).lineHeight);
    const pvLH = parseFloat(getComputedStyle(probe).lineHeight);

    if (Number.isFinite(taLH) && Number.isFinite(pvLH) && taLH !== pvLH) {
      document.documentElement.style.setProperty('--rte-line', `${taLH}px`);
    }
    probe.remove();
  }, []);

  // Small helper: escape only risky HTML chars, not brackets
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Convert markdown-like syntax to HTML for display
  const convertToHtml = (raw: string) => {
    // 1) normalize line endings
    let text = raw.replace(/\r\n?|\r/g, "\n");

    // 2) escape HTML (leave [] alone so our custom tags remain matchable)
    text = escapeHtml(text);

    // 3) headings (do first; use multiline anchors)
    text = text
      .replace(/^###[ \t]+(.+)$/gm, "<h3>$1</h3>")
      .replace(/^##[ \t]+(.+)$/gm, "<h2>$1</h2>")
      .replace(/^#[ \t]+(.+)$/gm, "<h1>$1</h1>");

    // 4) stress tags (single grouped rule)
    text = text.replace(
      /\[stress-(angry|sad|anxious)\]([\s\S]*?)\[\/stress-\1\]/g,
      '<span class="stress-highlight stress-$1">$2</span>'
    );

    // 5) strong before em — prevent ** from being eaten by *
    //    Disallow leading/trailing spaces inside the markers to reduce weird matches
    text = text.replace(
      /(?<!\*)\*\*(?!\s)([\s\S]*?)(?<!\s)\*\*(?!\*)/g,
      "<strong>$1</strong>"
    );

    // 6) italic with single * (but not **, and not "* " or " *")
    text = text.replace(
      /(?<!\*)\*(?![\*\s])([\s\S]*?)(?<!\s)\*(?!\*)/g,
      "<em>$1</em>"
    );

    // 7) underline with single _ (avoid __, avoid snake_case)
    //    Require non-word boundary around underscores to skip identifiers
    text = text.replace(
      /(?<![\w_])_(?![_\s])([\s\S]*?)(?<!\s)_(?![\w_])/g,
      "<u>$1</u>"
    );

    // 8) done — keep \n, rely on white-space: pre-wrap
    return text;
  };

  // Preserve trailing blank line visually to match textarea
  const previewValue = value.endsWith('\n') ? value + '\u200B' : value;

  if (readOnly) {
    return (
      <FormattedTextDisplay
        content={value}
        data-testid={testId}
      />
    );
  }

  return (
    <div className="rich-text-editor">

      
      {/* Container with border/padding - both layers get identical content boxes */}
      <div
        className="editor-container"
        style={{
          position: 'relative',
          // Single source of truth for all metrics
          ['--rte-size' as any]: '12px',
          ['--rte-line' as any]: '12px', // pixel line-height matches font size
          ['--rte-pad' as any]: '12px',
          boxSizing: 'border-box',
          border: '1px solid var(--mac-black)',
          padding: 'var(--rte-pad)',
        }}
      >
        <textarea
          ref={editorRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onMouseUp={handleTextSelection}
          onScroll={onScroll}
          placeholder={`${placeholder}

Try these formatting options:
- Bullet points (- + space)
- 1. Numbered lists (1. + space)
- # Headings (# + space for H1, ## for H2, ### for H3)
- **Bold** (Ctrl+B)
- *Italic* (Ctrl+I)  
- _Underline_ (Ctrl+U)
- Use Tab to indent nested items`}
          className="rich-text-input-overlay"
          data-testid={testId}
          style={{
            ...sharedFont,
            position: 'absolute',
            inset: 0,
            padding: 0,
            margin: 0,
            border: 'none',
            boxSizing: 'border-box',
            color: 'transparent',
            background: 'transparent',
            caretColor: 'black',
            zIndex: 2,
            resize: 'none',
            outline: 'none',
            tabSize: 2,
            display: 'block',
            transform: 'translateZ(0)', // nudges Chrome to consistent raster
          }}
          spellCheck={false}
        />
        <FormattedTextDisplay
          ref={previewRef}
          content={previewValue}
          className="live-preview-overlay"
          style={{
            ...sharedFont,
            position: 'absolute',
            inset: 0,
            padding: 0,
            margin: 0,
            border: 'none',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            zIndex: 1,
            background: 'transparent',
            display: 'block',
            transform: 'translateZ(0)',
          }}
        />
      </div>
      {showStressPopover && (
        <StressLevelPopover
          position={popoverPosition}
          selectedText={selectedText}
          onSelect={handleStressSelection}
          onCancel={() => {
            setShowStressPopover(false);
            setSelectedText("");
            setSelectionRange(null);
          }}
        />
      )}
    </div>
  );
}