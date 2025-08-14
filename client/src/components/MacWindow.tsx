import { ReactNode, useState, useEffect } from "react";
import { useDraggable } from "@/hooks/useDraggable";
import { useMacSounds } from "@/hooks/useMacSounds";

interface MacWindowProps {
  title: string;
  children: ReactNode;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  onClose: () => void;
  onFocus: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  isOpen?: boolean;
  isFocused?: boolean;
  'data-testid'?: string;
}

export default function MacWindow({
  title,
  children,
  position,
  size,
  zIndex,
  onClose,
  onFocus,
  onPositionChange,
  onSizeChange,
  isOpen = true,
  isFocused = false,
  'data-testid': testId
}: MacWindowProps) {
  const { playSound } = useMacSounds();
  const [animationState, setAnimationState] = useState<'entering' | 'visible' | 'exiting' | 'minimizing' | 'restoring'>('entering');
  
  // Handle window open/close animations
  useEffect(() => {
    if (isOpen) {
      setAnimationState('entering');
      const timer = setTimeout(() => setAnimationState('visible'), 400);
      return () => clearTimeout(timer);
    } else {
      setAnimationState('exiting');
    }
  }, [isOpen]);
  
  // Handle window opening animation
  useEffect(() => {
    if (animationState === 'entering') {
      playSound('click');
    }
  }, [animationState, playSound]);
  
  const { ref, isDragging } = useDraggable({
    onDrag: onPositionChange,
    onDragStart: () => {
      onFocus();
      playSound('click');
    }
  });

  const handleMouseDown = () => {
    onFocus();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playSound('click');
    setAnimationState('exiting');
    setTimeout(() => {
      onClose();
    }, 300); // Match the animation duration
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playSound('click');
    setAnimationState('minimizing');
    setTimeout(() => {
      // Can be used for minimize functionality later
      setAnimationState('visible');
    }, 500);
  };

  const handleResize = (e: React.MouseEvent) => {
    if (!onSizeChange) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newWidth = Math.max(300, startWidth + deltaX);
      const newHeight = Math.max(200, startHeight + deltaY);
      
      onSizeChange({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={ref}
      className={`mac-window ${animationState} ${isDragging ? 'dragging' : ''} ${isFocused ? 'focused' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex
      }}
      onMouseDown={handleMouseDown}
      data-testid={testId}
    >
      <div className="mac-window-title-bar">
        <div className="mac-window-title">{title}</div>
        <div className="mac-window-controls">
          <button 
            className="mac-window-control"
            onClick={handleMinimize}
            onMouseDown={(e) => e.stopPropagation()}
            data-testid="button-minimize"
          >
            -
          </button>
          <button 
            className="mac-window-control"
            onClick={handleClose}
            onMouseDown={(e) => e.stopPropagation()}
            data-testid="button-close"
          >
            ×
          </button>
        </div>
      </div>
      <div className="mac-window-content">
        {children}
      </div>
      {onSizeChange && (
        <div 
          className="mac-window-resize-handle"
          onMouseDown={handleResize}
          data-testid="resize-handle"
        />
      )}
    </div>
  );
}
