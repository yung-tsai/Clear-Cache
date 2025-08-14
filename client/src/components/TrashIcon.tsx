import { useState } from "react";
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
  const queryClient = useQueryClient();
  const { playSound } = useMacSounds();

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
        await deleteMutation.mutate(entryId);
        playSound('click');
        onDrop();
      }
    }
  };

  return (
    <div
      className={`mac-trash ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={testId}
    >
      <div>🗑️</div>
      <div>Trash</div>
    </div>
  );
}
