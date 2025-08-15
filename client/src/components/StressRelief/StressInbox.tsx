import { useState, useEffect } from "react";

interface QueueItem {
  id: string;
  highlightId: string;
  entryId: string;
  emotion: string;
  state: 'queued' | 'done';
}

interface StressInboxProps {
  onClose: () => void;
}

export default function StressInbox({ onClose }: StressInboxProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    loadQueue();
    
    // Listen for queue updates
    const handleQueueUpdate = () => {
      loadQueue();
    };
    
    document.addEventListener('sr-queue-updated', handleQueueUpdate);
    return () => document.removeEventListener('sr-queue-updated', handleQueueUpdate);
  }, []);

  useEffect(() => {
    // Show sidebar if there are queued items
    const queuedItems = queue.filter(item => item.state === 'queued');
    setIsVisible(queuedItems.length > 0);
  }, [queue]);

  const loadQueue = () => {
    const stored = localStorage.getItem('sr_queue');
    if (stored) {
      setQueue(JSON.parse(stored));
    }
  };

  const handleItemClick = (item: QueueItem) => {
    // Scroll to the highlight in the entry
    const highlightEl = document.querySelector(`[data-id="${item.highlightId}"]`);
    if (highlightEl) {
      highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Briefly highlight the item
      highlightEl.classList.add('sr-flash');
      setTimeout(() => {
        highlightEl.classList.remove('sr-flash');
      }, 2000);
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

  const queuedItems = queue.filter(item => item.state === 'queued');
  const processedItems = queue.filter(item => item.state === 'done');

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className="fixed right-0 top-0 h-full w-80 bg-gray-200 border-l border-black z-50 overflow-y-auto"
        style={{
          fontFamily: '"ChicagoFLF", Monaco, monospace',
          fontSize: '9px'
        }}
      >
        {/* Header */}
        <div className="mac-window-title-bar p-2 border-b border-black">
          <span>Stress Inbox</span>
          <button 
            onClick={onClose}
            className="float-right text-black hover:bg-black hover:text-white px-2"
          >
            ×
          </button>
        </div>

        {/* Queued Items */}
        {queuedItems.length > 0 && (
          <div className="p-3 border-b border-gray-400">
            <h3 className="font-bold mb-2 text-black">
              To Process ({queuedItems.length})
            </h3>
            
            {queuedItems.map(item => (
              <div
                key={item.id}
                className="mb-2 p-2 bg-white border border-black cursor-pointer hover:bg-gray-100"
                onClick={() => handleItemClick(item)}
                data-testid={`stress-inbox-item-${item.id}`}
              >
                <div className="flex items-center justify-between">
                  <span 
                    className="inline-block w-3 h-3 mr-2 rounded-sm"
                    style={{ backgroundColor: getEmotionColor(item.emotion) }}
                  />
                  <span className="flex-1 capitalize">{item.emotion}</span>
                  <span className="text-xs text-gray-600">Entry</span>
                </div>
                
                <div className="mt-1 text-xs text-gray-500">
                  Click to view in context
                </div>
              </div>
            ))}
            
            {queuedItems.length > 0 && (
              <button
                className="mac-button w-full mt-2"
                onClick={() => {
                  const stressSystem = (window as any).stressReliefInstance;
                  if (stressSystem) {
                    stressSystem.showPostEntryRitual();
                  }
                }}
                data-testid="process-all-button"
              >
                Process All ({queuedItems.length})
              </button>
            )}
          </div>
        )}

        {/* Recently Processed */}
        {processedItems.length > 0 && (
          <div className="p-3">
            <h3 className="font-bold mb-2 text-black">
              Recently Processed ({processedItems.length})
            </h3>
            
            {processedItems.slice(0, 5).map(item => (
              <div
                key={item.id}
                className="mb-2 p-2 bg-gray-100 border border-gray-400 opacity-70"
                data-testid={`processed-item-${item.id}`}
              >
                <div className="flex items-center justify-between">
                  <span 
                    className="inline-block w-3 h-3 mr-2 rounded-sm"
                    style={{ backgroundColor: getEmotionColor(item.emotion) }}
                  />
                  <span className="flex-1 capitalize">{item.emotion}</span>
                  <span className="text-xs text-green-600">✓</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {queuedItems.length === 0 && processedItems.length === 0 && (
          <div className="p-3 text-center text-gray-500">
            <p className="mb-2">No emotional tags yet</p>
            <p className="text-xs">
              Tag stressful text while writing to process it later
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gray-300 border-t border-black text-xs text-center">
          Weekly Trash Day helps you process old emotions
        </div>
      </div>

      {/* Flash effect styles */}
      <style>{`
        .sr-flash {
          animation: flashHighlight 2s ease-in-out;
        }
        
        @keyframes flashHighlight {
          0%, 100% { background-color: inherit; }
          50% { background-color: rgba(255, 255, 0, 0.8) !important; }
        }
      `}</style>
    </>
  );
}