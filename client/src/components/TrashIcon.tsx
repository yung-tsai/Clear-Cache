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
      className={`mac-trash ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={testId}
    >
      <div className="mac-window-title-bar" style={{ padding: '2px', textAlign: 'center' }}>
        <div>🗑️</div>
        <div style={{ fontSize: '6px', fontFamily: '"Press Start 2P", Monaco, monospace' }}>TRASH</div>
      </div>
    </div>
  );
}
