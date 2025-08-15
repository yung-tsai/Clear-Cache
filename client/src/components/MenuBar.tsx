import { useState, useRef, useEffect } from "react";

interface MenuBarProps {
  onNewEntry: () => void;
  onSearchEntries: () => void;
  onShowGratitudePrompts: () => void;
  onShowMoodTrends: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeBackground: (background: string) => void;
  currentBackground: string;
}

export default function MenuBar({ 
  onNewEntry, 
  onSearchEntries, 
  onShowGratitudePrompts,
  onShowMoodTrends,
  soundEnabled, 
  onToggleSound,
  onChangeBackground,
  currentBackground
}: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const specialMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node) &&
          viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node) &&
          specialMenuRef.current && !specialMenuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileMenuClick = () => {
    playSound('menuDrop');
    setActiveMenu(activeMenu === 'file' ? null : 'file');
  };

  const handleViewMenuClick = () => {
    playSound('menuDrop');
    setActiveMenu(activeMenu === 'view' ? null : 'view');
  };

  const handleSpecialMenuClick = () => {
    playSound('menuDrop');
    setActiveMenu(activeMenu === 'special' ? null : 'special');
  };

  const backgrounds = [
    { name: 'Classic Mac', value: 'classic', description: 'Traditional gray desktop' },
    { name: 'Blue Sky', value: 'blue-sky', description: 'Peaceful blue gradient' },
    { name: 'Forest Green', value: 'forest', description: 'Calming green tones' },
    { name: 'Sunset Orange', value: 'sunset', description: 'Warm orange gradient' },
    { name: 'Deep Purple', value: 'purple', description: 'Rich purple tones' },
    { name: 'Ocean Waves', value: 'ocean', description: 'Blue wave pattern' },
    { name: 'Flying Toasters', value: 'toasters', description: 'Classic Mac screensaver' },
    { name: 'Starfield', value: 'starfield', description: 'Moving stars screensaver' },
    { name: 'Maze', value: 'maze', description: 'Classic 3D maze screensaver' },
    { name: 'Aqua Bubbles', value: 'bubbles', description: 'Floating bubbles screensaver' }
  ];

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
      
      <div 
        ref={viewMenuRef}
        className={`mac-menu-item ${activeMenu === 'view' ? 'active' : ''}`}
        onClick={handleViewMenuClick}
        data-testid="menu-view"
      >
        View
        {activeMenu === 'view' && (
          <div className="mac-dropdown" style={{ display: 'block' }}>
            <div className="mac-dropdown-section">
              <div className="mac-dropdown-header">Background</div>
              {backgrounds.map((bg) => (
                <div 
                  key={bg.value}
                  className={`mac-dropdown-item ${currentBackground === bg.value ? 'checked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeBackground(bg.value);
                    setActiveMenu(null);
                  }}
                  data-testid={`background-${bg.value}`}
                >
                  {currentBackground === bg.value && '✓ '}
                  {bg.name}
                  <div className="mac-dropdown-description">{bg.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div 
        ref={specialMenuRef}
        className={`mac-menu-item ${activeMenu === 'special' ? 'active' : ''}`}
        onClick={handleSpecialMenuClick}
        data-testid="menu-special"
      >
        Special
        {activeMenu === 'special' && (
          <div className="mac-dropdown" style={{ display: 'block' }}>
            <div 
              className="mac-dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                onShowGratitudePrompts();
                setActiveMenu(null);
              }}
              data-testid="menu-gratitude-prompts"
            >
              Gratitude Prompts
            </div>
            <div 
              className="mac-dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                onShowMoodTrends();
                setActiveMenu(null);
              }}
              data-testid="menu-mood-trends"
            >
              Mood Trends
            </div>
          </div>
        )}
      </div>
      
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
