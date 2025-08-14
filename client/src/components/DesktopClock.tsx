import { useState, useEffect, useRef } from "react";

export default function DesktopClock() {
  const [time, setTime] = useState(new Date());
  const [position, setPosition] = useState({ x: 20, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ startX: 0, startY: 0, startLeft: 0, startTop: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!dragRef.current || !dragRef.current.contains(e.target as Node)) return;
      
      e.preventDefault();
      setIsDragging(true);
      
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startLeft: position.x,
        startTop: position.y
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragState.current.startX;
      const deltaY = e.clientY - dragState.current.startY;
      
      const newX = Math.max(0, Math.min(dragState.current.startLeft + deltaX, window.innerWidth - 120));
      const newY = Math.max(0, Math.min(dragState.current.startTop + deltaY, window.innerHeight - 60));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      ref={dragRef}
      className="desktop-clock" 
      data-testid="desktop-clock"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none'
      }}
    >
      <div className="clock-time">{formatTime(time)}</div>
      <div className="clock-date">{formatDate(time)}</div>
    </div>
  );
}