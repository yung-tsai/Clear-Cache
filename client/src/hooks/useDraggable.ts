import { useCallback, useRef, useState } from "react";

type Pos = { x: number; y: number };

export function useDraggable(opts: {
  getElement: () => HTMLElement | null;    // window element (not the titlebar)
  onDrag: (pos: Pos) => void;              // pass clamped left/top to parent
  onDragStart?: () => void;
  onDragEnd?: () => void;
  clamp?: (pos: Pos) => Pos;               // optional bounds clamp
  scale?: number;                          // desktop zoom (default 1)
}) {
  const { getElement, onDrag, onDragStart, onDragEnd, clamp, scale = 1 } = opts;
  const [isDragging, setIsDragging] = useState(false);
  const start = useRef({ dx: 0, dy: 0 });
  const ptrId = useRef<number | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = getElement();
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // distance between pointer and window's top-left (account for zoom)
    start.current.dx = (e.clientX - rect.left) / scale;
    start.current.dy = (e.clientY - rect.top) / scale;

    ptrId.current = e.pointerId;
    el.setPointerCapture(e.pointerId);
    setIsDragging(true);
    onDragStart?.();

    // prevent accidental text selection while dragging
    (document.body.style as any).userSelect = "none";
  }, [getElement, onDragStart, scale]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const el = getElement();
    if (!el) return;

    let x = e.clientX / scale - start.current.dx;
    let y = e.clientY / scale - start.current.dy;

    const next = clamp ? clamp({ x, y }) : { x, y };
    onDrag({ x: Math.round(next.x), y: Math.round(next.y) });
  }, [isDragging, getElement, clamp, onDrag, scale]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const el = getElement();
    if (el && ptrId.current != null) el.releasePointerCapture(ptrId.current);
    ptrId.current = null;
    setIsDragging(false);
    onDragEnd?.();
    (document.body.style as any).userSelect = "";
  }, [isDragging, onDragEnd, getElement]);

  return { onPointerDown, onPointerMove, onPointerUp, isDragging };
}