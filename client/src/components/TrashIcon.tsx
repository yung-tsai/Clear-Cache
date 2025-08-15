import { useState } from "react";
import { useDraggable } from "@/hooks/useDraggable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useMacSounds } from "@/hooks/useMacSounds";

interface TrashIconProps {
  onDrop: () => void;
  draggedEntry: string | null;
  'data-testid'?: string;
}

export default function TrashIcon({ onDrop, draggedEntry, 'data-testid': testId }: TrashIconProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [position, setPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth - 80 : 20, 
    y: typeof window !== 'undefined' ? window.innerHeight - 120 : 20 
  });
  const queryClient = useQueryClient();
  const { playSound } = useMacSounds();

  const { ref, isDragging } = useDraggable({
    onDrag: (newPosition) => setPosition(newPosition)
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await apiRequest('DELETE', `/api/journal-entries/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] });
    }
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const entryId = e.dataTransfer.getData('text/plain') || draggedEntry;
    if (entryId) {
      if (confirm('Delete this journal entry permanently?')) {
        playSound('trash');
        await deleteMutation.mutate(entryId);
        onDrop();
      }
    }
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'pointer',
        zIndex: 50
      }}
      className="select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={testId}
    >
      <div className="flex flex-col items-center">
        {/* Macintosh II style trash can icon */}
        <div className="w-12 h-12 mb-1">
          <svg viewBox="0 0 48 48" className="w-full h-full">
            {/* Trash can body */}
            <rect x="12" y="18" width="24" height="24" fill="#C0C0C0" stroke="#808080" strokeWidth="1"/>
            
            {/* Trash can lid */}
            <rect x="10" y="14" width="28" height="4" fill="#C0C0C0" stroke="#808080" strokeWidth="1"/>
            
            {/* Handle */}
            <rect x="18" y="10" width="12" height="4" fill="none" stroke="#808080" strokeWidth="1"/>
            
            {/* Vertical lines on can */}
            <line x1="18" y1="22" x2="18" y2="38" stroke="#808080" strokeWidth="1"/>
            <line x1="24" y1="22" x2="24" y2="38" stroke="#808080" strokeWidth="1"/>
            <line x1="30" y1="22" x2="30" y2="38" stroke="#808080" strokeWidth="1"/>
            
            {/* Shadow */}
            <rect x="36" y="18" width="2" height="24" fill="#808080"/>
            <rect x="12" y="42" width="24" height="2" fill="#808080"/>
            
            {isDragOver && (
              <>
                {/* Highlight when dragging over */}
                <rect x="10" y="12" width="28" height="32" fill="none" stroke="#FF0000" strokeWidth="2"/>
              </>
            )}
          </svg>
        </div>
        
        {/* Label */}
        <div className="text-xs text-black bg-white px-1 rounded border border-gray-400 shadow-sm">
          Trash
        </div>
      </div>
    </div>
  );
}
