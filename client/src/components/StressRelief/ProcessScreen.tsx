import { useState, useEffect } from "react";

interface Highlight {
  id: string;
  entryId: string;
  type: 'range' | 'block';
  emotion: string;
  intent?: string | null;
  state: 'new' | 'processed';
  action?: string | null;
  createdAt: number;
  processedAt?: number | null;
}

interface ProcessScreenProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function ProcessScreen({ onClose, onComplete }: ProcessScreenProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [undoStack, setUndoStack] = useState<Array<{id: string, previousState: any}>>([]);

  useEffect(() => {
    loadNewHighlights();
  }, []);

  const loadNewHighlights = () => {
    const stored = localStorage.getItem('sr_highlights');
    if (stored) {
      const allHighlights = JSON.parse(stored);
      const newHighlights = allHighlights.filter((h: Highlight) => h.state === 'new');
      setHighlights(newHighlights);
    }
  };

  const groupByEmotion = (highlights: Highlight[]) => {
    return highlights.reduce((groups, highlight) => {
      const emotion = highlight.emotion;
      if (!groups[emotion]) {
        groups[emotion] = [];
      }
      groups[emotion].push(highlight);
      return groups;
    }, {} as Record<string, Highlight[]>);
  };

  const handleProcessAction = (highlightId: string, action: 'shred' | 'trash' | 'stamp') => {
    const stressSystem = (window as any).stressReliefInstance;
    if (stressSystem) {
      // Store undo information
      const highlight = highlights.find(h => h.id === highlightId);
      if (highlight) {
        setUndoStack(prev => [...prev, {
          id: highlightId,
          previousState: { ...highlight }
        }]);
      }

      stressSystem.srProcessAction(highlightId, action);
      
      // Update local state
      setHighlights(prev => prev.filter(h => h.id !== highlightId));
      setProcessedCount(prev => prev + 1);
    }
  };

  const handleUndo = (highlightId: string) => {
    const undoItem = undoStack.find(u => u.id === highlightId);
    if (!undoItem) return;

    // Restore highlight state
    const stored = localStorage.getItem('sr_highlights');
    if (stored) {
      const allHighlights = JSON.parse(stored);
      const highlightIndex = allHighlights.findIndex((h: Highlight) => h.id === highlightId);
      
      if (highlightIndex !== -1) {
        allHighlights[highlightIndex] = undoItem.previousState;
        localStorage.setItem('sr_highlights', JSON.stringify(allHighlights));
        
        // Restore visual state
        const highlightEl = document.querySelector(`[data-id="${highlightId}"]`);
        if (highlightEl) {
          highlightEl.classList.remove('sr-shredded', 'sr-trashed', 'sr-stamped');
        }
        
        // Update queue
        const queueStored = localStorage.getItem('sr_queue');
        if (queueStored) {
          const queue = JSON.parse(queueStored);
          const queueItem = queue.find((q: any) => q.highlightId === highlightId);
          if (queueItem) {
            queueItem.state = 'queued';
            localStorage.setItem('sr_queue', JSON.stringify(queue));
          }
        }
        
        // Update local state
        setHighlights(prev => [...prev, undoItem.previousState]);
        setProcessedCount(prev => prev - 1);
        setUndoStack(prev => prev.filter(u => u.id !== highlightId));
      }
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      stress: '#ff4444',
      anger: '#ff6600',
      sad: '#4444ff',
      anxious: '#ffaa00',
      highlight: '#ffff00'
    };
    return colors[emotion] || '#888888';
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      shred: '✂️',
      trash: '🗑️',
      stamp: '💾'
    };
    return icons[action] || '⚡';
  };

  const groupedHighlights = groupByEmotion(highlights);
  const totalHighlights = highlights.length;
  const remainingCount = totalHighlights - processedCount;

  const handleComplete = () => {
    // Play completion chime
    const stressSystem = (window as any).stressReliefInstance;
    if (stressSystem && stressSystem.playCompletionChime) {
      stressSystem.playCompletionChime();
    }
    
    // Mark trash day as completed
    localStorage.setItem('sr_lastReview', Date.now().toString());
    
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div 
        className="mac-window bg-gray-200 w-[600px] max-h-[80vh] overflow-y-auto"
        style={{
          fontFamily: '"ChicagoFLF", Monaco, monospace',
          fontSize: '9px'
        }}
      >
        {/* Header */}
        <div className="mac-window-title-bar p-3 border-b border-black">
          <div className="flex justify-between items-center">
            <span>Process Emotional Tags</span>
            <button 
              onClick={onClose}
              className="px-2 py-1 hover:bg-black hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-600">
            {remainingCount} of {totalHighlights + processedCount} items remaining
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {Object.keys(groupedHighlights).length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎉</div>
              <p className="mb-2">All emotions processed!</p>
              <p className="text-xs text-gray-600 mb-4">
                You've worked through your tagged feelings.
              </p>
              <button
                className="mac-button"
                onClick={handleComplete}
                data-testid="complete-processing-button"
              >
                Complete Session
              </button>
            </div>
          ) : (
            Object.entries(groupedHighlights).map(([emotion, emotionHighlights]) => (
              <div key={emotion} className="mb-6">
                <h3 
                  className="font-bold mb-3 pb-1 border-b flex items-center"
                  style={{ color: getEmotionColor(emotion) }}
                >
                  <span 
                    className="inline-block w-4 h-4 mr-2 rounded-sm"
                    style={{ backgroundColor: getEmotionColor(emotion) }}
                  />
                  {emotion.toUpperCase()} ({emotionHighlights.length})
                </h3>
                
                {emotionHighlights.map(highlight => (
                  <div
                    key={highlight.id}
                    className="mb-3 p-3 bg-white border border-black"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-600 mb-1">
                          Entry: {highlight.entryId.replace('entry_', '')}
                        </div>
                        <div className="text-xs">
                          Type: {highlight.type === 'range' ? 'Text Selection' : 'Full Paragraph'}
                        </div>
                      </div>
                      
                      {highlight.intent && (
                        <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                          Intent: {highlight.intent}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <button
                        className="mac-button text-xs px-3 py-1"
                        onClick={() => handleProcessAction(highlight.id, 'shred')}
                        title="Blur and hide this content"
                        data-testid={`shred-${highlight.id}`}
                      >
                        ✂️ Shred
                      </button>
                      
                      <button
                        className="mac-button text-xs px-3 py-1"
                        onClick={() => handleProcessAction(highlight.id, 'trash')}
                        title="Collapse and remove this content"
                        data-testid={`trash-${highlight.id}`}
                      >
                        🗑️ Trash
                      </button>
                      
                      <button
                        className="mac-button text-xs px-3 py-1"
                        onClick={() => handleProcessAction(highlight.id, 'stamp')}
                        title="Mark as processed with VOID stamp"
                        data-testid={`stamp-${highlight.id}`}
                      >
                        💾 Stamp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}

          {/* Recently Processed with Undo */}
          {undoStack.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-400">
              <h4 className="font-bold mb-2">Recently Processed</h4>
              {undoStack.slice(-3).map(undoItem => (
                <div
                  key={undoItem.id}
                  className="mb-2 p-2 bg-gray-100 border border-gray-400 flex justify-between items-center"
                >
                  <span className="text-xs opacity-70">
                    {getActionIcon(undoItem.previousState.action)} {undoItem.previousState.emotion}
                  </span>
                  <button
                    className="mac-button text-xs px-2 py-1"
                    onClick={() => handleUndo(undoItem.id)}
                    data-testid={`undo-${undoItem.id}`}
                  >
                    Undo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-300 border-t border-black text-center">
          <div className="text-xs text-gray-600 mb-2">
            Processing helps release emotional tension
          </div>
          {remainingCount === 0 && (
            <button
              className="mac-button"
              onClick={handleComplete}
              data-testid="finish-session-button"
            >
              Finish Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}