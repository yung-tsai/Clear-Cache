import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import MenuBar from "@/components/MenuBar";
import MacWindow from "@/components/MacWindow";
import JournalEntry from "@/components/JournalEntry";
import SearchWindow from "@/components/SearchWindow";
import GratitudePrompts from "@/components/GratitudePrompts";
import MoodTrendsWindow from "@/components/MoodTrendsWindow";
import DesktopWeatherWidget from "@/components/DesktopWeatherWidget";
import DesktopClock from "@/components/DesktopClock";

import TrashIcon from "@/components/TrashIcon";
import CatharsisFolder from "@/components/CatharsisFolder";
import { useMacSounds } from "@/hooks/useMacSounds";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function Journal() {
  const [windows, setWindows] = useState<Array<{
    id: string;
    type: 'main' | 'entry' | 'search' | 'view' | 'gratitude' | 'trends';
    title: string;
    component: React.ReactNode;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zIndex: number;
    entryId?: string;
  }>>([
    {
      id: 'main',
      type: 'main',
      title: 'MacJournal II',
      component: <MainContent onNewEntry={handleNewEntry} onSearchEntries={handleSearchEntries} />,
      position: { x: window.innerWidth ? (window.innerWidth - 500) / 2 : 200, y: window.innerHeight ? (window.innerHeight - 320) / 2 : 150 },
      size: { width: 500, height: 320 },
      zIndex: 1
    }
  ]);

  // Window size persistence
  const getStoredSize = (windowType: string, defaultSize: { width: number; height: number }) => {
    try {
      const stored = localStorage.getItem(`macjournal-window-size-${windowType}`);
      return stored ? JSON.parse(stored) : defaultSize;
    } catch {
      return defaultSize;
    }
  };

  const saveWindowSize = (windowType: string, size: { width: number; height: number }) => {
    try {
      localStorage.setItem(`macjournal-window-size-${windowType}`, JSON.stringify(size));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Z-order array: window IDs from back to front (last = topmost)
  const [zStack, setZStack] = useState<string[]>(['main']);
  const [draggedEntry, setDraggedEntry] = useState<string | null>(null);
  const [currentBackground, setCurrentBackground] = useState('classic');
  const { playSound, soundEnabled, toggleSound } = useMacSounds();

  // Base z-index for the lowest window in the stack
  const BASE_Z = 1000;

  // Ensure window portal root exists
  const portalEl = useMemo(() => {
    let el = document.getElementById("window-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "window-root";
      el.style.position = "fixed";
      el.style.inset = "0";
      el.style.zIndex = "2147483000"; // Near-max to avoid stacking context traps
      el.style.pointerEvents = "none"; // Allow clicks through to desktop
      document.body.appendChild(el);
    }
    return el;
  }, []);

  // Play startup sound when app loads
  useEffect(() => {
    // Small delay to let the page fully load
    const timer = setTimeout(() => {
      playSound('startup');
    }, 500);
    return () => clearTimeout(timer);
  }, [playSound]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onNewEntry: handleNewEntry,
    onSearchEntries: handleSearchEntries
  });

  // Keep windows in bounds when browser resizes
  useEffect(() => {
    const onResize = () => {
      setWindows(ws => ws.map(w => {
        const maxX = Math.max(0, window.innerWidth  - w.size.width);
        const maxY = Math.max(0, window.innerHeight - w.size.height);
        return { 
          ...w, 
          position: { 
            x: Math.min(w.position.x, maxX), 
            y: Math.min(w.position.y, maxY) 
          } 
        };
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Helper functions for z-order management
  const bringToFront = (windowId: string) => {
    setZStack(prev => [...prev.filter(id => id !== windowId), windowId]);
  };

  const openWindow = (newWindow: any) => {
    setWindows(prev => {
      // Remove any existing window with same ID (for singleton windows like search)
      const without = prev.filter(w => w.id !== newWindow.id);
      return [...without, newWindow];
    });
    // Put window on top immediately
    setZStack(prev => [...prev.filter(id => id !== newWindow.id), newWindow.id]);
  };

  function handleNewEntry() {
    playSound('windowOpen');
    const windowId = `entry-${Date.now()}`;
    const newWindow = {
      id: windowId,
      type: 'entry' as const,
      title: 'New Journal Entry',
      component: <JournalEntry onSave={handleSaveEntry} onClose={() => closeWindow(windowId)} />,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      size: getStoredSize('entry', { width: 700, height: 600 }),
      zIndex: 0 // Will be computed from z-order
    };
    openWindow(newWindow);
  }

  function handleSearchEntries() {
    playSound('click');
    const searchWindow = {
      id: 'search',
      type: 'search' as const,
      title: 'Search Entries',
      component: <SearchWindow onViewEntry={handleViewEntry} onDragStart={setDraggedEntry} />,
      position: { x: 150 + Math.random() * 200, y: 150 + Math.random() * 100 },
      size: getStoredSize('search', { width: 600, height: 400 }),
      zIndex: 0 // Will be computed from z-order
    };
    openWindow(searchWindow);
  }

  function handleShowGratitudePrompts() {
    playSound('click');
    const gratitudeWindow = {
      id: 'gratitude',
      type: 'gratitude' as const,
      title: 'Gratitude Prompts',
      component: (
        <GratitudePrompts 
          onCreateEntry={(title, content) => {
            closeWindow('gratitude');
            // Create a new journal entry with the gratitude content
            const windowId = `entry-${Date.now()}`;
            const newWindow = {
              id: windowId,
              type: 'entry' as const,
              title: 'New Gratitude Entry',
              component: (
                <JournalEntry 
                  onSave={handleSaveEntry} 
                  onClose={() => closeWindow(windowId)}
                />
              ),
              position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
              size: { width: 500, height: 400 },
              zIndex: 0 // Will be computed from z-order
            };
            openWindow(newWindow);
            
            // Pre-fill the entry with gratitude content
            setTimeout(() => {
              const titleInput = document.querySelector('[data-testid="input-title"]') as HTMLInputElement;
              const contentTextarea = document.querySelector('[data-testid="textarea-content"]') as HTMLTextAreaElement;
              if (titleInput) titleInput.value = title;
              if (contentTextarea) contentTextarea.value = content;
            }, 100);
          }}
          onClose={() => closeWindow('gratitude')}
        />
      ),
      position: { x: 200 + Math.random() * 150, y: 150 + Math.random() * 100 },
      size: { width: 450, height: 500 },
      zIndex: 0 // Will be computed from z-order
    };
    openWindow(gratitudeWindow);
  }

  function handleShowMoodTrends() {
    playSound('click');
    const trendsWindow = {
      id: 'trends',
      type: 'trends' as const,
      title: 'Mood Trends',
      component: <MoodTrendsWindow onClose={() => closeWindow('trends')} />,
      position: { x: 180 + Math.random() * 150, y: 120 + Math.random() * 100 },
      size: { width: 500, height: 450 },
      zIndex: 0 // Will be computed from z-order
    };
    openWindow(trendsWindow);
  }

  function handleViewEntry(entryId: string, title: string) {
    playSound('click');
    const windowId = `view-${entryId}`;
    const viewWindow = {
      id: windowId,
      type: 'view' as const,
      title: `View: ${title}`,
      component: <JournalEntry entryId={entryId} readOnly={false} onClose={() => closeWindow(windowId)} />,
      position: { x: 120 + Math.random() * 250, y: 120 + Math.random() * 150 },
      size: { width: 700, height: 600 },
      zIndex: 0, // Will be computed from z-order
      entryId
    };
    openWindow(viewWindow);
  }

  function handleSaveEntry() {
    // Refresh search window if open
    setWindows(prev => prev.map(w => 
      w.type === 'search' 
        ? { ...w, component: <SearchWindow onViewEntry={handleViewEntry} onDragStart={setDraggedEntry} /> }
        : w
    ));
  }

  function closeWindow(windowId: string) {
    playSound('click');
    setWindows(prev => prev.filter(w => w.id !== windowId));
    setZStack(prev => prev.filter(id => id !== windowId));
  }

  function updateWindowPosition(windowId: string, position: { x: number; y: number }) {
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, position }
        : w
    ));
  }

  function updateWindowSize(windowId: string, size: { width: number; height: number }) {
    setWindows(prev => prev.map(w => {
      if (w.id === windowId) {
        // Save size to localStorage for this window type
        saveWindowSize(w.type, size);
        return { ...w, size };
      }
      return w;
    }));
  }

  function handleTrashDrop() {
    if (draggedEntry) {
      // This will be handled by the SearchWindow component
      setDraggedEntry(null);
    }
  }

  // Compute window ordering by z-stack position
  const orderedWindows = useMemo(() => {
    const stackIndex = new Map(zStack.map((id, i) => [id, i]));
    // Sort by position in zStack; unknown ids go to back
    return [...windows].sort((a, b) => (stackIndex.get(a.id) ?? -1) - (stackIndex.get(b.id) ?? -1));
  }, [windows, zStack]);

  // Render windows in their own portal layer
  const windowLayer = (
    <div
      id="window-layer"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000, // Near-max to avoid stacking context traps
        pointerEvents: "none" // Allow clicks through to desktop
      }}
    >
      {orderedWindows.map((window, i) => {
        const computedZIndex = BASE_Z + i; // Strictly increasing z-index
        return (
          <div
            key={window.id}
            style={{
              position: "absolute",
              left: window.position.x,
              top: window.position.y,
              width: window.size.width,
              height: window.size.height,
              zIndex: computedZIndex,
              pointerEvents: "auto" // Re-enable pointer events on windows
            }}
            onMouseDownCapture={() => bringToFront(window.id)} // Capture ensures it fires even if inner elements stopPropagation
          >
            <MacWindow
              title={window.title}
              position={window.position}
              size={window.size}
              zIndex={computedZIndex}
              onClose={() => closeWindow(window.id)}
              onFocus={() => bringToFront(window.id)}
              onPositionChange={(position) => updateWindowPosition(window.id, position)}
              onSizeChange={(size) => updateWindowSize(window.id, size)}
              data-testid={`window-${window.type}-${window.id}`}
            >
              {window.component}
            </MacWindow>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="h-screen w-screen overflow-hidden">
        <MenuBar 
          onNewEntry={handleNewEntry}
          onSearchEntries={handleSearchEntries}
          onShowGratitudePrompts={handleShowGratitudePrompts}
          onShowMoodTrends={handleShowMoodTrends}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onChangeBackground={setCurrentBackground}
          currentBackground={currentBackground}
        />
        
        <div className={`desktop background-${currentBackground}`}>
          {/* Desktop Widgets */}
          <DesktopClock />
          <DesktopWeatherWidget />
          
          <TrashIcon 
            onDrop={handleTrashDrop}
            draggedEntry={draggedEntry}
            data-testid="trash-icon"
          />
          
          <CatharsisFolder onPlaySound={(soundName) => playSound(soundName as any)} />
        </div>
      </div>
      
      {/* Render windows in portal to avoid stacking context issues */}
      {createPortal(windowLayer, portalEl)}
    </>
  );
}

function MainContent({ onNewEntry, onSearchEntries }: { 
  onNewEntry: () => void; 
  onSearchEntries: () => void; 
}) {
  return (
    <div className="text-center p-10">
      <h2 className="text-lg font-bold mb-4">Welcome to MacJournal II</h2>
      <p className="mb-2">A classic Macintosh-style journal application</p>
      <p className="text-xs text-gray-600 mb-6">Click File → New Entry to start writing</p>
      
      <div className="space-x-2">
        <button 
          className="mac-button"
          onClick={onNewEntry}
          data-testid="button-new-entry"
        >
          New Entry
        </button>
        <button 
          className="mac-button"
          onClick={onSearchEntries}
          data-testid="button-search-entries"
        >
          Search Entries
        </button>
      </div>
    </div>
  );
}
