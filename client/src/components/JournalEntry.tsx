import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { JournalEntry as JournalEntryType, InsertJournalEntry, CatharsisItem } from "@shared/schema";
import { useMacSounds } from "@/hooks/useMacSounds";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import RichTextEditorLexical, { RichTextEditorHandle } from "@/components/RichTextEditorLexical";
import MoodSelector from "@/components/MoodSelector";
import CatharsisWindow from "@/components/CatharsisWindow";
import { Mic, MicOff, Save, X, Calendar, Clock, Trash2, Edit2, Heart } from "lucide-react";

interface JournalEntryProps {
  entryId?: string;
  readOnly?: boolean;
  onSave?: () => void;
  onClose?: () => void;
}

export default function JournalEntry({ entryId, readOnly, onSave, onClose }: JournalEntryProps) {
  // Track the current entry ID (either passed in or created)
  const [currentEntryId, setCurrentEntryId] = useState<string | undefined>(entryId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [journalDate, setJournalDate] = useState(""); // Will be set based on existing entry or today's date
  const [saveStatus, setSaveStatus] = useState("");
  const [catharsisItems, setCatharsisItems] = useState<CatharsisItem[]>([]);
  const [showCatharsisWindow, setShowCatharsisWindow] = useState(false);
  const queryClient = useQueryClient();
  const { playSound } = useMacSounds();

  // Update currentEntryId when entryId prop changes
  useEffect(() => {
    setCurrentEntryId(entryId);
  }, [entryId]);

  // Fetch existing entry if entryId is provided
  const { data: entry, isLoading } = useQuery<JournalEntryType>({
    queryKey: ['/api/journal-entries', currentEntryId],
    enabled: !!currentEntryId
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertJournalEntry) => {
      const response = await apiRequest('POST', '/api/journal-entries', data);
      return response.json();
    },
    onSuccess: (newEntry) => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] });
      playSound('success');
      setSaveStatus("Entry Saved!");
      setTimeout(() => setSaveStatus(""), 2000);
      
      // Update the current entry ID so subsequent saves will update instead of create
      if (newEntry?.id) {
        setCurrentEntryId(newEntry.id);
      }
      
      onSave?.();
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertJournalEntry>) => {
      if (!currentEntryId) {
        throw new Error('No entry ID found for update');
      }
      const response = await apiRequest('PATCH', `/api/journal-entries/${currentEntryId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] });
      playSound('success');
      setSaveStatus("Entry Updated!");
      setTimeout(() => setSaveStatus(""), 2000);
      onSave?.();
    }
  });

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setMood(entry.mood || null);
      setJournalDate(entry.journalDate);
      setCatharsisItems(entry.catharsis || []);
    } else {
      // For new entries, set today's date
      setJournalDate(new Date().toISOString().split('T')[0]);
    }
  }, [entry]);



  // Voice-to-text functionality using Web Speech API
  const recognitionRef = useRef<any>(null);
  const editorRef = useRef<RichTextEditorHandle>(null);
  
  const toggleVoiceRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      playSound('click');
    } else {
      // Start recording with Web Speech API
      try {
        playSound('click');
        
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
          const errorText = "Speech recognition not supported in this browser. Please type your entry manually.";
          editorRef.current?.insertParagraph();
          editorRef.current?.insertText(errorText);
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;
        
        let finalTranscript = '';
        
        recognition.onstart = () => {
          setIsRecording(true);
          editorRef.current?.focus(); // put caret in the editor
        };
        
        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
          }
        };
        
        recognition.onend = () => {
          setIsRecording(false);
          const text = finalTranscript.trim();
          if (text) {
            // Insert the transcript into the editor directly
            editorRef.current?.insertParagraph();
            editorRef.current?.insertText(text);
          }
          playSound('click');
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          playSound('click');
          
          if (event.error === 'no-speech') {
            const message = "No speech detected. Please try again.";
            editorRef.current?.insertParagraph();
            editorRef.current?.insertText(message);
          }
        };
        
        recognition.start();

      } catch (error) {
        console.error('Error with speech recognition:', error);
        playSound('click');
        setIsRecording(false);
      }
    }
  };

  // Set up keyboard shortcuts for this entry window
  useKeyboardShortcuts({
    onNewEntry: () => {}, // No action for new entry within an entry window
    onSearchEntries: () => {}, // No action for search within an entry window
    onSave: !readOnly ? () => {
      const e = new Event('submit') as any;
      handleSubmit(e);
    } : undefined
  });

  const handleCatharsisUpdate = (items: CatharsisItem[]) => {
    setCatharsisItems(items);
  };

  const handleCatharsisItemShredded = (itemId: string) => {
    const updatedItems = catharsisItems.filter(item => item.id !== itemId);
    setCatharsisItems(updatedItems);
    playSound('success');
  };

  const handleCatharsisItemTrashed = (itemId: string) => {
    const updatedItems = catharsisItems.filter(item => item.id !== itemId);
    setCatharsisItems(updatedItems);
    playSound('trash');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');

    const entryData: InsertJournalEntry = {
      title,
      content,
      tags: [],
      mood,
      journalDate,
      catharsis: catharsisItems
    };

    if (currentEntryId) {
      updateMutation.mutate(entryData);
    } else {
      createMutation.mutate(entryData);
    }
  };





  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <form className="flex flex-col h-full gap-2" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <label className="min-w-[40px] font-bold text-xs">Title:</label>
        <input
          type="text"
          className="mac-input flex-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          readOnly={readOnly}
          data-testid="input-title"
        />
      </div>
      

      



      

      
      <div className="flex-1 min-h-0 mb-4">
        <RichTextEditorLexical
          key={currentEntryId ?? "new"}
          initialHTML={entry?.content ?? ""}
          onChange={setContent}
          placeholder="Start writing your journal entry..."
          readOnly={readOnly}
          ref={editorRef}
        />
      </div>
      
      <div className="flex justify-between items-center border-t border-gray-400 pt-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold">Date:</label>
            <input
              type="date"
              className="mac-input text-xs"
              value={journalDate}
              onChange={(e) => setJournalDate(e.target.value)}
              readOnly={readOnly}
              data-testid="input-journal-date"
              style={{ fontFamily: 'Monaco, monospace', fontSize: '10px', width: '120px' }}
            />
          </div>

        </div>
        
        <div className="flex items-center gap-4">
          {/* Mood Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold">Mood:</label>
            <select
              className="mac-input text-xs"
              value={mood || ''}
              onChange={(e) => setMood(e.target.value || null)}
              disabled={readOnly}
              data-testid="select-mood"
              style={{ fontFamily: 'Monaco, monospace', fontSize: '10px', width: '100px' }}
            >
              <option value="">None</option>
              <option value="happy">😊 Happy</option>
              <option value="sad">😢 Sad</option>
              <option value="excited">🤩 Excited</option>
              <option value="calm">😌 Calm</option>
              <option value="anxious">😰 Anxious</option>
              <option value="grateful">🙏 Grateful</option>
              <option value="angry">😠 Angry</option>
              <option value="peaceful">🕊️ Peaceful</option>
            </select>
          </div>
          
          {/* Catharsis Button */}
          {!readOnly && (
            <button
              type="button"
              className="mac-button catharsis-btn"
              onClick={() => setShowCatharsisWindow(true)}
              title="Open Catharsis Window"
              data-testid="button-catharsis"
            >
              <Heart size={14} />
              Catharsis ({catharsisItems.length})
            </button>
          )}
        </div>
        
        {!readOnly && (
          <div className="flex items-center gap-2">
            {saveStatus && <span className="text-xs">{saveStatus}</span>}
            
            {/* Voice to Text Button */}
            <button
              type="button"
              className={`mac-button voice-to-text-btn ${isRecording ? 'recording' : ''}`}
              onClick={toggleVoiceRecording}
              disabled={false}
              data-testid="button-voice-to-text"
              title={isRecording ? 'Stop recording' : 'Record voice to text'}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
            
            <button
              type="submit"
              className="mac-button"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Entry'}
            </button>
            <button
              type="button"
              className="w-4 h-4 border border-black bg-gray-300 cursor-pointer flex items-center justify-center text-xs hover:bg-gray-400"
              onClick={onClose}
              title="Close"
              data-testid="button-delete"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
      
      {showCatharsisWindow && (
        <CatharsisWindow
          catharsisItems={catharsisItems}
          onItemShredded={handleCatharsisItemShredded}
          onItemTrashed={handleCatharsisItemTrashed}
          onClose={() => setShowCatharsisWindow(false)}
        />
      )}
    </form>
  );
}
