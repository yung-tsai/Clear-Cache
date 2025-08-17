import { useState } from "react";
import MacWindow from "./MacWindow";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

function countTags(html: string) {
  if (!html) return 0;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.querySelectorAll('[data-tag], [data-emotion]').length;
}

interface ReleaseFolderProps {
  onOpenRelease: (entryId: string) => void;
}

export default function ReleaseFolder({ onOpenRelease }: ReleaseFolderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 120, y: 100 });
  const [isDragging, setIsDragging] = useState(false);

  // Simple drag state tracking
  const [dragState, setDragState] = useState({
    dragging: false,
    startX: 0,
    startY: 0,
    startPos: { x: 0, y: 0 }
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    const startDragState = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPos: position
    };
    
    setDragState(startDragState);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startDragState.startX;
      const deltaY = moveEvent.clientY - startDragState.startY;
      
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 80, startDragState.startPos.x + deltaX)),
        y: Math.max(0, Math.min(window.innerHeight - 80, startDragState.startPos.y + deltaY))
      });
    };

    const handleMouseUp = () => {
      setDragState(prev => ({ ...prev, dragging: false }));
      setTimeout(() => setIsDragging(false), 100); // Delay to prevent click from firing
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsOpen(true);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['/api/journal-entries'],
    queryFn: () => apiRequest('GET', '/api/journal-entries').then(r => r.json()),
    staleTime: 0,
  });

  const entries = Array.isArray(data) ? data : [];
  const rows = entries
    .map((e: any) => ({ id: e.id, title: e.title || '(untitled)', count: countTags(e.content || '') }))
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <>
      <div
        className="desktop-icon"
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: '80px',
          height: '80px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          zIndex: 100,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        data-testid="release-folder"
      >
        <div style={{ fontSize: '32px', marginBottom: '4px' }}>📁</div>
        <div style={{ 
          fontSize: '10px', 
          fontFamily: 'ChicagoFLF, Geneva, Arial, sans-serif',
          color: '#000',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '1px 3px',
          borderRadius: '2px'
        }}>
          Release
        </div>
      </div>

      {isOpen && (
        <MacWindow
          title="Release Folder"
          position={{ x: 150, y: 120 }}
          size={{ width: 400, height: 300 }}
          zIndex={1000}
          onClose={() => setIsOpen(false)}
          onFocus={() => {}}
          onPositionChange={() => {}}
          onSizeChange={() => {}}
        >
          <div className="p-2 text-xs" style={{ fontFamily: 'ChicagoFLF, Geneva, Arial, sans-serif' }}>
            <div className="mb-2 font-bold">Release items by entry</div>
            {isLoading ? (
              <div>Loading…</div>
            ) : rows.length === 0 ? (
              <div>No tagged text found.</div>
            ) : (
              <ul className="space-y-1">
                {rows.map(r => (
                  <li key={r.id}>
                    <button
                      className="block w-full text-left p-1 border border-gray-400 bg-white hover:bg-gray-100"
                      onClick={() => {
                        onOpenRelease(r.id);
                        setIsOpen(false);
                      }}
                      style={{ fontFamily: 'ChicagoFLF, Geneva, Arial, sans-serif', fontSize: '9px' }}
                    >
                      {r.title} ({r.count} tagged)
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </MacWindow>
      )}
    </>
  );
}