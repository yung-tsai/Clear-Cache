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
  const { playSound } = useMacSounds();
  const [showStressPopover, setShowStressPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

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
    if (!editorRef.current || readOnly) return;
    
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 2) {
      const range = editorRef.current.selectionStart;
      const endRange = editorRef.current.selectionEnd;
      
      if (range !== endRange) {
        const rect = editorRef.current.getBoundingClientRect();
        setSelectedText(selectedText);
        setSelectionRange({ start: range, end: endRange });
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        setPopoverPosition({
          x: rect.left + scrollLeft + 20,
          y: rect.top + scrollTop - 10
        });
        setShowStressPopover(true);
      }
    }
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

  // Convert markdown-like syntax to HTML for display
  const convertToHtml = (text: string) => {
    return text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<u>$1</u>')
      .replace(/\[stress-angry\](.*?)\[\/stress-angry\]/g, '<span class="stress-highlight stress-angry">$1</span>')
      .replace(/\[stress-sad\](.*?)\[\/stress-sad\]/g, '<span class="stress-highlight stress-sad">$1</span>')
      .replace(/\[stress-anxious\](.*?)\[\/stress-anxious\]/g, '<span class="stress-highlight stress-anxious">$1</span>')
      .replace(/\n/g, '<br>');
  };

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

      
      {/* Live preview overlay */}
      <div className="editor-container">
        <textarea
          ref={editorRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onMouseUp={handleTextSelection}
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
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            padding: '12px',
            margin: 0,
            border: '1px solid var(--mac-black)',
            fontFamily: 'Chicago, ChicagoFLF, Geneva, Arial, sans-serif',
            fontSize: '12px',
            lineHeight: '1.4',
            color: 'transparent',
            backgroundColor: 'transparent',
            caretColor: 'black',
            zIndex: 2,
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}
        />
        <FormattedTextDisplay
          content={value || ''}
          className="live-preview-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            padding: '12px',
            margin: 0,
            border: '1px solid transparent',
            fontFamily: 'Chicago, ChicagoFLF, Geneva, Arial, sans-serif',
            fontSize: '12px',
            lineHeight: '1.4',
            pointerEvents: 'none',
            zIndex: 1,
            background: 'transparent',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'hidden',
            minHeight: 'auto',
            boxSizing: 'border-box'
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