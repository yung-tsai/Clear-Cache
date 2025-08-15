import { useState } from "react";
import MacWindow from "./MacWindow";
import { Button } from "./ui/button";
import { Trash2, Scissors } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { JournalEntry, CatharsisItem } from "@shared/schema";

interface CatharsisFolderProps {
  onPlaySound?: (soundName: string) => void;
}

export default function CatharsisFolder({ onPlaySound }: CatharsisFolderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 120, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const queryClient = useQueryClient();

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
    setDragState({
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPos: position
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragState.dragging) return;
      
      const deltaX = moveEvent.clientX - dragState.startX;
      const deltaY = moveEvent.clientY - dragState.startY;
      
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 80, dragState.startPos.x + deltaX)),
        y: Math.max(0, Math.min(window.innerHeight - 80, dragState.startPos.y + deltaY))
      });
    };

    const handleMouseUp = () => {
      setDragState(prev => ({ ...prev, dragging: false }));
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Get all journal entries to find catharsis items
  const { data: entries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal-entries"],
  });

  // Extract all catharsis items that haven't been disposed of
  const pendingCatharsisItems = entries.flatMap(entry => 
    (entry.catharsis || []).map(item => ({
      ...item,
      entryId: entry.id,
      entryTitle: entry.title,
      entryDate: entry.journalDate
    }))
  );

  // Mutation to remove catharsis item (trash it)
  const removeCatharsisMutation = useMutation({
    mutationFn: async ({ entryId, catharsisId }: { entryId: string; catharsisId: string }) => {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) throw new Error("Entry not found");
      
      const updatedCatharsis = entry.catharsis?.filter(item => item.id !== catharsisId) || [];
      
      return apiRequest(`/api/journal-entries/${entryId}`, "PATCH", { catharsis: updatedCatharsis });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      onPlaySound?.("trash");
    }
  });

  const handleFolderClick = () => {
    if (!isDragging) {
      setIsOpen(true);
      onPlaySound?.("windowOpen");
    }
  };

  const handleTrashItem = (entryId: string, catharsisId: string) => {
    removeCatharsisMutation.mutate({ entryId, catharsisId });
  };

  const handleShredItem = (entryId: string, catharsisId: string) => {
    // For shredding, we also remove the item but with a different sound
    removeCatharsisMutation.mutate({ entryId, catharsisId });
    onPlaySound?.("alert"); // Different sound for shredding
  };

  const getStressLevelColor = (level: string) => {
    switch (level) {
      case "angry": return "text-red-600 bg-red-100";
      case "sad": return "text-blue-600 bg-blue-100";
      case "anxious": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <>
      {/* Folder Icon */}
      <div
        className="fixed z-50 cursor-pointer select-none"
        style={{
          left: position.x,
          top: position.y,
          transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          transition: isDragging ? 'none' : 'transform 0.1s ease'
        }}
        onMouseDown={handleMouseDown}
        onClick={!isDragging ? handleFolderClick : undefined}
      >
        <div className="flex flex-col items-center">
          {/* Folder Icon SVG */}
          <div className="w-16 h-16 mb-1">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              {/* Classic Mac folder style - more geometric and pixelated */}
              <rect x="8" y="20" width="48" height="28" fill="#C0C0C0" stroke="#808080" strokeWidth="1"/>
              <rect x="8" y="16" width="20" height="8" fill="#C0C0C0" stroke="#808080" strokeWidth="1"/>
              <rect x="28" y="16" width="4" height="4" fill="#C0C0C0" stroke="#808080" strokeWidth="1"/>
              <rect x="32" y="20" width="24" height="4" fill="#C0C0C0" stroke="#808080" strokeWidth="1"/>
              
              {/* Classic Mac folder tab pattern */}
              <rect x="10" y="18" width="16" height="2" fill="#A0A0A0"/>
              <rect x="30" y="18" width="2" height="2" fill="#A0A0A0"/>
              
              {/* Shadow/depth lines */}
              <line x1="56" y1="20" x2="56" y2="48" stroke="#808080" strokeWidth="1"/>
              <line x1="8" y1="48" x2="56" y2="48" stroke="#808080" strokeWidth="1"/>
              
              {/* Heart icon to indicate catharsis */}
              <rect x="30" y="30" width="2" height="2" fill="#FF0000"/>
              <rect x="32" y="30" width="2" height="2" fill="#FF0000"/>
              <rect x="28" y="32" width="2" height="2" fill="#FF0000"/>
              <rect x="30" y="32" width="4" height="2" fill="#FF0000"/>
              <rect x="34" y="32" width="2" height="2" fill="#FF0000"/>
              <rect x="30" y="34" width="4" height="2" fill="#FF0000"/>
              <rect x="32" y="36" width="2" height="2" fill="#FF0000"/>
            </svg>
          </div>
          
          {/* Label */}
          <div className="text-xs text-black bg-white px-1 rounded border border-gray-400 shadow-sm">
            Catharsis
          </div>
          
          {/* Badge showing count */}
          {pendingCatharsisItems.length > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingCatharsisItems.length}
            </div>
          )}
        </div>
      </div>

      {/* Catharsis Window */}
      {isOpen && (
        <div className="fixed z-50 inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div 
            className="bg-gray-100 border border-gray-400 rounded shadow-lg"
            style={{ width: 600, height: 400 }}
          >
            {/* Title Bar */}
            <div className="bg-gradient-to-b from-gray-300 to-gray-400 border-b border-gray-400 px-3 py-2 flex justify-between items-center">
              <span className="text-sm font-medium">Catharsis Items</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onPlaySound?.("windowClose");
                }}
                className="w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full border border-red-700"
                data-testid="button-close-catharsis"
              />
            </div>
          <div className="h-full flex flex-col bg-gray-100">
            <div className="flex-1 overflow-y-auto p-4">
              {pendingCatharsisItems.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <div className="text-6xl mb-4">🕊️</div>
                  <p className="text-lg">No pending catharsis items</p>
                  <p className="text-sm mt-2">All your stress has been released!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    {pendingCatharsisItems.length} item{pendingCatharsisItems.length !== 1 ? 's' : ''} awaiting release
                  </div>
                  
                  {pendingCatharsisItems.map((item) => (
                    <div
                      key={`${item.entryId}-${item.id}`}
                      className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 mb-1">
                            From: "{item.entryTitle}" ({item.entryDate})
                          </div>
                          <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getStressLevelColor(item.stressLevel)}`}>
                            {item.stressLevel.toUpperCase()}: "{item.text}"
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTrashItem(item.entryId, item.id)}
                            disabled={removeCatharsisMutation.isPending}
                            className="text-gray-600 hover:text-red-600"
                            data-testid={`button-trash-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShredItem(item.entryId, item.id)}
                            disabled={removeCatharsisMutation.isPending}
                            className="text-gray-600 hover:text-orange-600"
                            data-testid={`button-shred-${item.id}`}
                          >
                            <Scissors className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Created: {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
}