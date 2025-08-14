import { useEffect } from "react";
import { useMacSounds } from "./useMacSounds";

interface KeyboardShortcutsProps {
  onNewEntry: () => void;
  onSearchEntries: () => void;
  onSave?: () => void;
}

export function useKeyboardShortcuts({ onNewEntry, onSearchEntries, onSave }: KeyboardShortcutsProps) {
  const { playSound } = useMacSounds();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Mac-style keyboard shortcuts (Cmd key on Mac, Ctrl on PC)
      const isCmd = event.metaKey || event.ctrlKey;
      
      if (isCmd) {
        switch (event.key.toLowerCase()) {
          case 'n':
            // Cmd+N: New Entry
            event.preventDefault();
            playSound('beep');
            onNewEntry();
            break;
          case 'f':
            // Cmd+F: Search Entries
            event.preventDefault();
            playSound('beep');
            onSearchEntries();
            break;
          case 's':
            // Cmd+S: Save (if save function is provided)
            if (onSave) {
              event.preventDefault();
              playSound('disk');
              onSave();
            }
            break;
          case 'w':
            // Cmd+W: Close window (let browser handle this naturally)
            playSound('click');
            break;
        }
      }

      // Escape key to close modals/dialogs
      if (event.key === 'Escape') {
        playSound('click');
        // Let individual components handle escape
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNewEntry, onSearchEntries, onSave, playSound]);
}