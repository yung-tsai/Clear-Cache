import { useState, useEffect, useRef } from "react";
import { useMacSounds } from "@/hooks/useMacSounds";

interface StressLevelPopoverProps {
  position: { x: number; y: number };
  selectedText: string;
  onSelect: (stressLevel: 'angry' | 'sad' | 'anxious') => void;
  onCancel: () => void;
}

export default function StressLevelPopover({
  position,
  selectedText,
  onSelect,
  onCancel
}: StressLevelPopoverProps) {
  const { playSound } = useMacSounds();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onCancel]);

  const handleSelect = (level: 'angry' | 'sad' | 'anxious') => {
    playSound('click');
    onSelect(level);
  };

  const stressOptions = [
    { level: 'angry' as const, emoji: '😠', color: '#ff4444', label: 'Angry' },
    { level: 'sad' as const, emoji: '😢', color: '#4444ff', label: 'Sad' },
    { level: 'anxious' as const, emoji: '😰', color: '#ffaa00', label: 'Anxious' }
  ];

  return (
    <div
      ref={popoverRef}
      className="stress-popover"
      style={{
        position: 'fixed',
        left: Math.max(10, Math.min(position.x, window.innerWidth - 300)),
        top: Math.max(10, position.y - 120),
        zIndex: 1000
      }}
      data-testid="stress-level-popover"
    >
      <div className="stress-popover-header">
        <div className="selected-text">"{selectedText.slice(0, 30)}..."</div>
        <div className="stress-question">How does this make you feel?</div>
      </div>
      <div className="stress-options">
        {stressOptions.map((option) => (
          <button
            key={option.level}
            className="stress-option"
            onClick={() => handleSelect(option.level)}
            style={{ borderLeft: `4px solid ${option.color}` }}
            data-testid={`stress-option-${option.level}`}
          >
            <span className="stress-emoji">{option.emoji}</span>
            <span className="stress-label">{option.label}</span>
          </button>
        ))}
      </div>
      <div className="stress-popover-footer">
        <button
          className="mac-button cancel-btn"
          onClick={onCancel}
          data-testid="cancel-stress-selection"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}