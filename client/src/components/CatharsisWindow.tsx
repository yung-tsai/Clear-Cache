import { useState } from "react";
import { Trash2, Scissors } from "lucide-react";
import { useMacSounds } from "@/hooks/useMacSounds";
import type { CatharsisItem } from "@shared/schema";

interface CatharsisWindowProps {
  catharsisItems: CatharsisItem[];
  onItemShredded: (itemId: string) => void;
  onItemTrashed: (itemId: string) => void;
  onClose: () => void;
}

export default function CatharsisWindow({
  catharsisItems,
  onItemShredded,
  onItemTrashed,
  onClose
}: CatharsisWindowProps) {
  const { playSound } = useMacSounds();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [shredderItem, setShredderItem] = useState<string | null>(null);
  const [isShredding, setIsShredding] = useState(false);
  const [showShredConfirm, setShowShredConfirm] = useState<string | null>(null);

  const getStressColor = (level: 'angry' | 'sad' | 'anxious') => {
    switch (level) {
      case 'angry': return '#ff4444';
      case 'sad': return '#4444ff';
      case 'anxious': return '#ffaa00';
      default: return '#666';
    }
  };

  const getStressEmoji = (level: 'angry' | 'sad' | 'anxious') => {
    switch (level) {
      case 'angry': return '😠';
      case 'sad': return '😢';
      case 'anxious': return '😰';
      default: return '😐';
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.setData('text/plain', itemId);
    playSound('click');
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleTrashDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId) {
      playSound('trash');
      onItemTrashed(itemId);
    }
  };

  const handleShredClick = (itemId: string) => {
    setShowShredConfirm(itemId);
    playSound('click');
  };

  const confirmShred = (itemId: string) => {
    setShowShredConfirm(null);
    setShredderItem(itemId);
    setIsShredding(true);
    
    // Play shredder sound
    playShredderSound();
    
    // Animate for 3 seconds then remove
    setTimeout(() => {
      setIsShredding(false);
      setShredderItem(null);
      onItemShredded(itemId);
    }, 3000);
  };

  const playShredderSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create white noise for shredder sound
      const bufferSize = audioContext.sampleRate * 3; // 3 seconds
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const whiteNoise = audioContext.createBufferSource();
      whiteNoise.buffer = buffer;
      
      const gainNode = audioContext.createGain();
      const filterNode = audioContext.createBiquadFilter();
      
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(800, audioContext.currentTime);
      
      whiteNoise.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);
      
      whiteNoise.start(audioContext.currentTime);
      whiteNoise.stop(audioContext.currentTime + 3);
    } catch (error) {
      console.warn('Web Audio API not available');
    }
  };

  return (
    <div className="catharsis-window">
      <div className="mac-window-title-bar">
        <div className="mac-window-controls">
          <button 
            className="mac-close-btn" 
            onClick={onClose}
            data-testid="close-catharsis"
          >
            ×
          </button>
        </div>
        <div className="mac-window-title">Catharsis - Release Your Stress</div>
      </div>
      
      <div className="catharsis-content">
        <div className="catharsis-header">
          <p className="catharsis-instructions">
            Drag items to the trash or click "Shred" to release negative emotions.
          </p>
        </div>

        {catharsisItems.length === 0 ? (
          <div className="catharsis-empty">
            <p>No stressful thoughts captured yet.</p>
            <p>Highlight text in your journal to add them here.</p>
          </div>
        ) : (
          <div className="catharsis-list">
            {catharsisItems.map((item) => (
              <div
                key={item.id}
                className={`catharsis-item ${draggedItem === item.id ? 'dragging' : ''} ${shredderItem === item.id ? 'shredding' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragEnd={handleDragEnd}
                style={{ borderLeft: `4px solid ${getStressColor(item.stressLevel)}` }}
                data-testid={`catharsis-item-${item.id}`}
              >
                <div className="catharsis-item-header">
                  <span className="stress-emoji">{getStressEmoji(item.stressLevel)}</span>
                  <span className="stress-level">{item.stressLevel.toUpperCase()}</span>
                  <button
                    className="shred-btn"
                    onClick={() => handleShredClick(item.id)}
                    data-testid={`shred-btn-${item.id}`}
                  >
                    <Scissors size={12} />
                    Shred
                  </button>
                </div>
                <div className="catharsis-text">{item.text}</div>
                {isShredding && shredderItem === item.id && (
                  <div className="shredder-animation">
                    <div className="shredder-lines"></div>
                    <div className="shredder-text">SHREDDING...</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="catharsis-footer">
          <div
            className="trash-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleTrashDrop}
            data-testid="catharsis-trash-zone"
          >
            <Trash2 size={24} />
            <span>Drop here to trash</span>
          </div>
        </div>
      </div>

      {showShredConfirm && (
        <div className="shred-confirm-overlay">
          <div className="shred-confirm-modal">
            <h3>Shred this stress?</h3>
            <p>This will permanently destroy this negative thought.</p>
            <div className="shred-confirm-buttons">
              <button
                className="mac-button confirm-shred"
                onClick={() => confirmShred(showShredConfirm)}
                data-testid="confirm-shred"
              >
                Yes, Shred It
              </button>
              <button
                className="mac-button cancel-shred"
                onClick={() => setShowShredConfirm(null)}
                data-testid="cancel-shred"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}