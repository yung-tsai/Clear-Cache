import { useState, useCallback } from "react";

type SoundType = 'click' | 'type';

export function useMacSounds() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playSound = useCallback((type: SoundType) => {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (type === 'click') {
        // Mac-style click sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } else if (type === 'type') {
        // Mac keyboard typing sound - more mechanical
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();
        
        oscillator1.connect(filterNode);
        oscillator2.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Two frequencies for a more mechanical keyboard sound
        oscillator1.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator2.frequency.setValueAtTime(880, audioContext.currentTime);
        
        filterNode.type = 'bandpass';
        filterNode.frequency.setValueAtTime(1000, audioContext.currentTime);
        filterNode.Q.setValueAtTime(5, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
        
        oscillator1.start(audioContext.currentTime);
        oscillator2.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.08);
        oscillator2.stop(audioContext.currentTime + 0.08);
      }
    } catch (error) {
      // Silently fail if Web Audio API is not available
      console.warn('Web Audio API not available');
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return {
    soundEnabled,
    playSound,
    toggleSound
  };
}
