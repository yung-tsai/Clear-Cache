import { useCallback } from "react";
import { useSoundSettings } from "./useSoundSettings";

type SoundType = 'click' | 'type' | 'startup' | 'disk' | 'error' | 'beep' | 'windowOpen' | 'windowClose' | 'trash' | 'menuDrop' | 'alert' | 'success';

export function useMacSounds() {
  const { enabled } = useSoundSettings();

  const playSound = useCallback((type: SoundType) => {
    if (!enabled) return;

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
      } else if (type === 'startup') {
        // Classic Mac startup chime
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Ascending chord progression
        oscillator.frequency.setValueAtTime(261.63, audioContext.currentTime); // C4
        oscillator.frequency.setValueAtTime(329.63, audioContext.currentTime + 0.2); // E4
        oscillator.frequency.setValueAtTime(392.00, audioContext.currentTime + 0.4); // G4
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.6); // C5
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1.0);
      } else if (type === 'disk') {
        // Floppy disk insert sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();
        
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(150, audioContext.currentTime + 0.15);
        
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(300, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
      } else if (type === 'error') {
        // System error beep
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (type === 'beep') {
        // Simple system beep
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } else if (type === 'windowOpen') {
        // Window opening sound - ascending notes
        const notes = [440, 523.25, 659.25]; // A4, C5, E5
        notes.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.08);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + index * 0.08);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.08 + 0.15);
          
          oscillator.start(audioContext.currentTime + index * 0.08);
          oscillator.stop(audioContext.currentTime + index * 0.08 + 0.15);
        });
      } else if (type === 'windowClose') {
        // Window closing sound - descending notes
        const notes = [659.25, 523.25, 440]; // E5, C5, A4
        notes.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.06);
          gainNode.gain.setValueAtTime(0.08, audioContext.currentTime + index * 0.06);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.06 + 0.12);
          
          oscillator.start(audioContext.currentTime + index * 0.06);
          oscillator.stop(audioContext.currentTime + index * 0.06 + 0.12);
        });
      } else if (type === 'trash') {
        // Trash sound - paper crumpling effect
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();
        
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(1000, audioContext.currentTime);
        filterNode.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (type === 'menuDrop') {
        // Menu dropdown sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime + 0.05); // D5
        
        gainNode.gain.setValueAtTime(0.06, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } else if (type === 'alert') {
        // Alert beep - more urgent
        [0, 0.15, 0.3].forEach((delay) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime + delay);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + delay);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.1);
          
          oscillator.start(audioContext.currentTime + delay);
          oscillator.stop(audioContext.currentTime + delay + 0.1);
        });
      } else if (type === 'success') {
        // Success chime - ascending chord
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + index * 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.3);
          
          oscillator.start(audioContext.currentTime + index * 0.1);
          oscillator.stop(audioContext.currentTime + index * 0.1 + 0.3);
        });
      }
    } catch (error) {
      // Silently fail if Web Audio API is not available
      console.warn('Web Audio API not available');
    }
  }, [enabled]);

  return {
    playSound
  };
}
