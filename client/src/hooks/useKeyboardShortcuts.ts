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
            // Cmd+N: New Entry - prevent browser's new window
            event.preventDefault();
            event.stopPropagation();
            playSound('beep');
            onNewEntry();
            break;
          case 'f':
            // Cmd+F: Search Entries - prevent browser's find dialog
            event.preventDefault();
            event.stopPropagation();
            playSound('beep');
            onSearchEntries();
            break;
          case 's':
            // Cmd+S: Save - prevent browser's save dialog
            event.preventDefault();
            event.stopPropagation();
            if (onSave) {
              playSound('disk');
              onSave();
            }
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