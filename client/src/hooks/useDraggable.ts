import { useRef, useState, useEffect, useCallback } from "react";

type Point = { x: number; y: number };
type Opts = {
  onDrag: (p: Point) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  /** CSS selector for the element that can start a drag */
  dragHandleSelector?: string; // default: ".mac-window-title-bar"
};

export function useDraggable({
  onDrag,
  onDragStart,
  onDragEnd,
  dragHandleSelector = ".mac-window-title-bar",
}: Opts) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isDragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const node = ref.current;
      if (!node) return;

      // start only when the mousedown happens on/inside the handle
      const target = e.target as HTMLElement;
      if (dragHandleSelector && !target.closest(dragHandleSelector)) return;

      const rect = node.getBoundingClientRect();
      offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      setDragging(true);
      onDragStart?.();
      e.preventDefault();
    },
    [dragHandleSelector, onDragStart]
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.addEventListener("mousedown", handleMouseDown);
    return () => node.removeEventListener("mousedown", handleMouseDown);
  }, [handleMouseDown]);

  useEffect(() => {
    if (!isDragging) return;

    const move = (e: MouseEvent) => {
      onDrag({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
      });
    };
    const up = () => {
      setDragging(false);
      onDragEnd?.();
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
  }, [isDragging, onDrag, onDragEnd]);

  return { ref, isDragging };
}