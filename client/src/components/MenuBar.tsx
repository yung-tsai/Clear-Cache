import { useState, useRef, useEffect } from "react";

interface MenuBarProps {
  onNewEntry: () => void;
  onSearchEntries: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function MenuBar({ 
  onNewEntry, 
  onSearchEntries, 
  soundEnabled, 
  onToggleSound 
}: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileMenuClick = () => {
    setActiveMenu(activeMenu === 'file' ? null : 'file');
  };

  return (
    <div className="mac-menu-bar">
      <div 
        ref={fileMenuRef}
        className={`mac-menu-item ${activeMenu === 'file' ? 'active' : ''}`}
        onClick={handleFileMenuClick}
        data-testid="menu-file"
      >
        File
        {activeMenu === 'file' && (
          <div className="mac-dropdown" style={{ display: 'block' }}>
            <div 
              className="mac-dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                onNewEntry();
                setActiveMenu(null);
              }}
              data-testid="menu-new-entry"
            >
              New Entry
            </div>
            <div 
              className="mac-dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                onSearchEntries();
                setActiveMenu(null);
              }}
              data-testid="menu-search-entries"
            >
              Search Entries
            </div>
          </div>
        )}
      </div>
      
      <div className="mac-menu-item" data-testid="menu-edit">Edit</div>
      <div className="mac-menu-item" data-testid="menu-view">View</div>
      <div className="mac-menu-item" data-testid="menu-special">Special</div>
      
      <div 
        className="sound-toggle"
        onClick={onToggleSound}
        data-testid="button-toggle-sound"
      >
        <span>{soundEnabled ? '🔊' : '🔇'}</span>
        <span>Sound {soundEnabled ? 'ON' : 'OFF'}</span>
      </div>
    </div>
  );
}
