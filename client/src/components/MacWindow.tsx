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

  const handleClose = () => {
    playSound('click');
    onClose();
  };

  const handleMinimize = () => {
    playSound('click');
    // TODO: Implement minimize functionality
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
            data-testid="button-minimize"
          >
            -
          </button>
          <button 
            className="mac-window-control"
            onClick={handleClose}
            data-testid="button-close"
          >
            ×
          </button>
        </div>
      </div>
      <div className="mac-window-content">
        {children}
      </div>
    </div>
  );
}
