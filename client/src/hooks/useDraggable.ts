import { useRef, useCallback, useState } from "react";

interface UseDraggableOptions {
  onDrag?: (position: { x: number; y: number }) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function useDraggable({ onDrag, onDragStart, onDragEnd }: UseDraggableOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0
  });

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    
    const titleBar = ref.current.querySelector('.mac-window-title-bar');
    if (!titleBar || !titleBar.contains(e.target as Node)) return;
    
    e.preventDefault();
    setIsDragging(true);
    onDragStart?.();
    
    const rect = ref.current.getBoundingClientRect();
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top
    };
  }, [onDragStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging || !ref.current) return;
    
    const deltaX = e.clientX - dragStateRef.current.startX;
    const deltaY = e.clientY - dragStateRef.current.startY;
    
    const newLeft = Math.max(0, Math.min(
      dragStateRef.current.startLeft + deltaX,
      window.innerWidth - ref.current.offsetWidth
    ));
    
    const newTop = Math.max(20, Math.min(
      dragStateRef.current.startTop + deltaY,
      window.innerHeight - ref.current.offsetHeight
    ));
    
    onDrag?.({ x: newLeft, y: newTop });
  }, [onDrag]);

  const handleMouseUp = useCallback(() => {
    if (dragStateRef.current.isDragging) {
      setIsDragging(false);
      dragStateRef.current.isDragging = false;
      onDragEnd?.();
    }
  }, [onDragEnd]);

  // Attach event listeners
  const attachListeners = useCallback((element: HTMLDivElement) => {
    element.addEventListener('mousedown', handleMouseDown as EventListener);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      element.removeEventListener('mousedown', handleMouseDown as EventListener);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  const setRef = useCallback((element: HTMLDivElement | null) => {
    if (ref.current) {
      // Clean up previous listeners
      ref.current.removeEventListener('mousedown', handleMouseDown as EventListener);
    }
    
    (ref as any).current = element;
    
    if (element) {
      attachListeners(element);
    }
  }, [attachListeners, handleMouseDown]);

  return {
    ref: setRef,
    isDragging
  };
}
