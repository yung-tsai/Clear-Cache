import { ReactNode } from "react";
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
  'data-testid': testId
}: MacWindowProps) {
  const { playSound } = useMacSounds();
  
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
    playSound('windowClose');
    onClose();
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playSound('click');
    // TODO: Implement minimize functionality
  };

  const handleResize = (e: React.MouseEvent, direction: string) => {
    if (!onSizeChange) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    const startPosX = position.x;
    const startPosY = position.y;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosX;
      let newY = startPosY;
      
      // Handle different resize directions
      if (direction.includes('e')) {
        newWidth = Math.max(400, startWidth + deltaX);
      }
      if (direction.includes('w')) {
        newWidth = Math.max(400, startWidth - deltaX);
        newX = startPosX + (startWidth - newWidth);
      }
      if (direction.includes('s')) {
        newHeight = Math.max(300, startHeight + deltaY);
      }
      if (direction.includes('n')) {
        newHeight = Math.max(300, startHeight - deltaY);
        newY = startPosY + (startHeight - newHeight);
      }
      
      onSizeChange({ width: newWidth, height: newHeight });
      if (newX !== startPosX || newY !== startPosY) {
        onPositionChange({ x: newX, y: newY });
      }
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
      className={`mac-window ${isDragging ? 'dragging' : ''}`}
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
        <>
          {/* Corner handles - invisible but functional */}
          <div className="mac-window-resize-handle nw" onMouseDown={(e) => handleResize(e, 'nw')} data-testid="resize-nw" />
          <div className="mac-window-resize-handle ne" onMouseDown={(e) => handleResize(e, 'ne')} data-testid="resize-ne" />
          <div className="mac-window-resize-handle sw" onMouseDown={(e) => handleResize(e, 'sw')} data-testid="resize-sw" />
          <div className="mac-window-resize-handle se" onMouseDown={(e) => handleResize(e, 'se')} data-testid="resize-se" />
          
          {/* Edge handles - invisible but functional */}
          <div className="mac-window-resize-handle n" onMouseDown={(e) => handleResize(e, 'n')} data-testid="resize-n" />
          <div className="mac-window-resize-handle s" onMouseDown={(e) => handleResize(e, 's')} data-testid="resize-s" />
          <div className="mac-window-resize-handle e" onMouseDown={(e) => handleResize(e, 'e')} data-testid="resize-e" />
          <div className="mac-window-resize-handle w" onMouseDown={(e) => handleResize(e, 'w')} data-testid="resize-w" />
        </>
      )}
    </div>
  );
}
