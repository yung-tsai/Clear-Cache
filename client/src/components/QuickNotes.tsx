import { useState, useRef } from "react";
import { useMacSounds } from "@/hooks/useMacSounds";

export default function QuickNotes() {
  const [notes, setNotes] = useState<string[]>(() => {
    const saved = localStorage.getItem('mac-journal-quick-notes');
    return saved ? JSON.parse(saved) : [''];
  });
  const [activeNote, setActiveNote] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { playSound } = useMacSounds();

  const saveNotes = (newNotes: string[]) => {
    localStorage.setItem('mac-journal-quick-notes', JSON.stringify(newNotes));
    setNotes(newNotes);
  };

  const updateNote = (index: number, content: string) => {
    const newNotes = [...notes];
    newNotes[index] = content;
    saveNotes(newNotes);
  };

  const addNote = () => {
    playSound('click');
    const newNotes = [...notes, ''];
    saveNotes(newNotes);
    setActiveNote(newNotes.length - 1);
  };

  const deleteNote = (index: number) => {
    playSound('click');
    if (notes.length === 1) {
      saveNotes(['']);
      setActiveNote(0);
    } else {
      const newNotes = notes.filter((_, i) => i !== index);
      saveNotes(newNotes);
      setActiveNote(Math.min(activeNote, newNotes.length - 1));
    }
  };

  return (
    <div className="quick-notes" data-testid="quick-notes">
      <div className="quick-notes-header">
        <span className="notes-title">Quick Notes</span>
        <button 
          className="add-note-btn"
          onClick={addNote}
          data-testid="button-add-note"
        >
          +
        </button>
      </div>
      
      <div className="notes-tabs">
        {notes.map((_, index) => (
          <button
            key={index}
            className={`note-tab ${index === activeNote ? 'active' : ''}`}
            onClick={() => {
              playSound('click');
              setActiveNote(index);
            }}
            data-testid={`note-tab-${index}`}
          >
            {index + 1}
            {notes.length > 1 && (
              <span 
                className="delete-tab"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(index);
                }}
              >
                ×
              </span>
            )}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        className="note-content"
        value={notes[activeNote] || ''}
        onChange={(e) => updateNote(activeNote, e.target.value)}
        placeholder="Jot down quick thoughts..."
        data-testid="textarea-note-content"
      />
    </div>
  );
}