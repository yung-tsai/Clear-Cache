import { ReactNode, useMemo, useRef } from "react";
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
  // All hooks must be at the top level and in consistent order
  const { playSound } = useMacSounds();
  const winRef = useRef<HTMLDivElement>(null);
  
  // Keep the window fully inside viewport
  const clamp = useMemo(() => {
    return ({ x, y }: { x: number; y: number }) => {
      const maxX = Math.max(0, window.innerWidth  - size.width);
      const maxY = Math.max(0, window.innerHeight - size.height);
      return { x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) };
    };
  }, [size.width, size.height]);

  const drag = useDraggable({
    getElement: () => winRef.current,
    onDrag: (p) => onPositionChange(clamp(p)),
    onDragStart: () => { onFocus(); playSound('click'); },
    clamp,
  });

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

  function handleResize(e: React.MouseEvent, direction: string) {
    if (!onSizeChange) return;
    e.preventDefault(); 
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.width;
    const startH = size.height;
    const startXPos = position.x;
    const startYPos = position.y;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      let newW = startW;
      let newH = startH;
      let newX = startXPos;
      let newY = startYPos;

      if (direction.includes('e')) newW = Math.max(320, startW + dx);
      if (direction.includes('s')) newH = Math.max(220, startH + dy);
      if (direction.includes('w')) { newW = Math.max(320, startW - dx); newX = startXPos + (startW - newW); }
      if (direction.includes('n')) { newH = Math.max(220, startH - dy); newY = startYPos + (startH - newH); }

      // clamp to viewport
      const maxX = Math.max(0, window.innerWidth  - newW);
      const maxY = Math.max(0, window.innerHeight - newH);
      newX = Math.min(Math.max(0, newX), maxX);
      newY = Math.min(Math.max(0, newY), maxY);

      onSizeChange!({ width: newW, height: newH });
      onPositionChange({ x: newX, y: newY });
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return (
    <div
      ref={winRef}
      className={`mac-window ${drag.isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',                 // fixed so math matches clientX/Y
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex,
        transform: drag.isDragging ? 'translateZ(0)' : 'none', // GPU acceleration when dragging
        transition: drag.isDragging ? 'none' : 'opacity 0.1s ease' // disable transitions during drag
      }}
      onMouseDownCapture={onFocus}         // bring to front before any drag
      data-testid={testId}
    >
      <div
        className="mac-window-title-bar"
        onPointerDown={drag.onPointerDown} // drag from titlebar only
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
      >
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
