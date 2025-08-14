import { useState } from "react";
import MenuBar from "@/components/MenuBar";
import MacWindow from "@/components/MacWindow";
import JournalEntry from "@/components/JournalEntry";
import SearchWindow from "@/components/SearchWindow";
import TrashIcon from "@/components/TrashIcon";
import { useMacSounds } from "@/hooks/useMacSounds";

export default function Journal() {
  const [windows, setWindows] = useState<Array<{
    id: string;
    type: 'main' | 'entry' | 'search' | 'view';
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
      position: { x: 50, y: 50 },
      size: { width: 400, height: 300 },
      zIndex: 100
    }
  ]);

  const [nextZIndex, setNextZIndex] = useState(101);
  const [draggedEntry, setDraggedEntry] = useState<string | null>(null);
  const { playSound, soundEnabled, toggleSound } = useMacSounds();

  function handleNewEntry() {
    playSound('click');
    const newWindow = {
      id: `entry-${Date.now()}`,
      type: 'entry' as const,
      title: 'New Journal Entry',
      component: <JournalEntry onSave={handleSaveEntry} onClose={() => closeWindow(`entry-${Date.now()}`)} />,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      size: { width: 500, height: 400 },
      zIndex: nextZIndex
    };
    setWindows(prev => [...prev, newWindow]);
    setNextZIndex(prev => prev + 1);
  }

  function handleSearchEntries() {
    playSound('click');
    const searchWindow = {
      id: 'search',
      type: 'search' as const,
      title: 'Search Entries',
      component: <SearchWindow onViewEntry={handleViewEntry} onDragStart={setDraggedEntry} />,
      position: { x: 150 + Math.random() * 200, y: 150 + Math.random() * 100 },
      size: { width: 600, height: 400 },
      zIndex: nextZIndex
    };
    setWindows(prev => [...prev.filter(w => w.type !== 'search'), searchWindow]);
    setNextZIndex(prev => prev + 1);
  }

  function handleViewEntry(entryId: string, title: string) {
    playSound('click');
    const viewWindow = {
      id: `view-${entryId}`,
      type: 'view' as const,
      title: title,
      component: <JournalEntry entryId={entryId} readOnly onClose={() => closeWindow(`view-${entryId}`)} />,
      position: { x: 120 + Math.random() * 250, y: 120 + Math.random() * 150 },
      size: { width: 500, height: 400 },
      zIndex: nextZIndex,
      entryId
    };
    setWindows(prev => [...prev.filter(w => w.entryId !== entryId), viewWindow]);
    setNextZIndex(prev => prev + 1);
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
  }

  function bringToFront(windowId: string) {
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, zIndex: nextZIndex }
        : w
    ));
    setNextZIndex(prev => prev + 1);
  }

  function updateWindowPosition(windowId: string, position: { x: number; y: number }) {
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, position }
        : w
    ));
  }

  function handleTrashDrop() {
    if (draggedEntry) {
      // This will be handled by the SearchWindow component
      setDraggedEntry(null);
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <MenuBar 
        onNewEntry={handleNewEntry}
        onSearchEntries={handleSearchEntries}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
      
      <div className="desktop">
        {windows.map(window => (
          <MacWindow
            key={window.id}
            title={window.title}
            position={window.position}
            size={window.size}
            zIndex={window.zIndex}
            onClose={() => closeWindow(window.id)}
            onFocus={() => bringToFront(window.id)}
            onPositionChange={(position) => updateWindowPosition(window.id, position)}
            data-testid={`window-${window.type}-${window.id}`}
          >
            {window.component}
          </MacWindow>
        ))}
        
        <TrashIcon 
          onDrop={handleTrashDrop}
          draggedEntry={draggedEntry}
          data-testid="trash-icon"
        />
      </div>
    </div>
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
