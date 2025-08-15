import { useRef, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useMacSounds } from "@/hooks/useMacSounds";
import StressLevelPopover from "./StressLevelPopover";
import type { CatharsisItem } from "@shared/schema";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCatharsisUpdate?: (items: CatharsisItem[]) => void;
  catharsisItems?: CatharsisItem[];
  placeholder?: string;
  readOnly?: boolean;
  'data-testid'?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange,
  onCatharsisUpdate,
  catharsisItems = [],
  placeholder, 
  readOnly, 
  'data-testid': testId 
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
        setPopoverPosition({
          x: rect.left + 20,
          y: rect.top - 10
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
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<u>$1</u>')
      .replace(/\[highlight-yellow\](.*?)\[\/highlight-yellow\]/g, '<span class="highlight-yellow">$1</span>')
      .replace(/\[highlight-pink\](.*?)\[\/highlight-pink\]/g, '<span class="highlight-pink">$1</span>')
      .replace(/\[highlight-green\](.*?)\[\/highlight-green\]/g, '<span class="highlight-green">$1</span>')
      .replace(/\[highlight-blue\](.*?)\[\/highlight-blue\]/g, '<span class="highlight-blue">$1</span>')
      .replace(/\[stress-angry\](.*?)\[\/stress-angry\]/g, '<span class="stress-highlight stress-angry">$1</span>')
      .replace(/\[stress-sad\](.*?)\[\/stress-sad\]/g, '<span class="stress-highlight stress-sad">$1</span>')
      .replace(/\[stress-anxious\](.*?)\[\/stress-anxious\]/g, '<span class="stress-highlight stress-anxious">$1</span>')
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
    <div className="rich-text-editor">
      <div className="editor-header">
        <div className="catharsis-info">
          <Heart size={12} />
          <span>Select text to tag stress levels for catharsis</span>
        </div>
      </div>
      <textarea
        ref={editorRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={handleTextSelection}
        placeholder={placeholder}
        className="rich-text-input"
        data-testid={testId}
      />
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