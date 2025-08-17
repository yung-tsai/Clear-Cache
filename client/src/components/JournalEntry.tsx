import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { JournalEntry as JournalEntryType, InsertJournalEntry, CatharsisItem } from "@shared/schema";
import { useMacSounds } from "@/hooks/useMacSounds";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import RichTextEditorLexical, { RichTextEditorHandle } from "@/components/RichTextEditorLexical";
import RetroJournalEditor, { RetroJournalEditorHandle } from "@/components/RetroJournalEditor";
import MoodSelector from "@/components/MoodSelector";
import CatharsisWindow from "@/components/CatharsisWindow";
import { Mic, MicOff, Save, X, Calendar, Clock, Trash2, Edit2, Heart } from "lucide-react";

// Extract tags from saved HTML (both new [data-tag] and old [data-emotion])
function extractReleaseItemsFromHtml(html: string) {
  const out: Array<{ id: string; text: string; stressLevel: 'tag'; createdAt: string }> = [];
  if (!html) return out;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const nodes = Array.from(doc.querySelectorAll('[data-tag], [data-emotion]')) as HTMLElement[];
  const now = new Date().toISOString();
  nodes.forEach((el, idx) => {
    const text = (el.textContent || '').trim();
    if (!text) return;
    out.push({
      id: `release-${Date.now()}-${idx}`,
      text,
      stressLevel: 'tag',
      createdAt: now,
    });
  });
  return out;
}

interface JournalEntryProps {
  entryId?: string;
  readOnly?: boolean;
  onSave?: () => void;
  onClose?: () => void;
  onOpenReleaseWindow?: (entryId: string, items: any[]) => void;
}

export default function JournalEntry({ entryId, readOnly, onSave, onClose, onOpenReleaseWindow }: JournalEntryProps) {
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
    enabled: !!currentEntryId,
    refetchOnMount: true
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertJournalEntry) => {
      const response = await apiRequest('POST', '/api/journal-entries', data);
      return response.json();
    },
    onSuccess: (newEntry) => {
      // Improved query invalidation to catch all journal-entry queries
      queryClient.invalidateQueries({
        predicate: q =>
          Array.isArray(q.queryKey) &&
          String(q.queryKey[0]).startsWith('/api/journal-entries'),
      });

      // Optimistic cache merge for main list
      queryClient.setQueryData(['/api/journal-entries'], (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          const exists = old.some((e: any) => e.id === newEntry.id);
          return exists ? old : [newEntry, ...old];
        }
        return old;
      });

      playSound('success');
      setSaveStatus("Entry Saved!");
      setTimeout(() => setSaveStatus(""), 2000);
      
      // Update the current entry ID so subsequent saves will update instead of create
      if (newEntry?.id) {
        setCurrentEntryId(newEntry.id);
      }

      // Extract tags and open Release window if any
      const releaseItems = extractReleaseItemsFromHtml(content);
      if (releaseItems.length > 0 && onOpenReleaseWindow) {
        onOpenReleaseWindow(newEntry?.id ?? currentEntryId!, releaseItems);
      }
      
      onSave?.();
      // Auto-close window after saving
      setTimeout(() => onClose?.(), 1000);
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
      // Improved query invalidation to catch all journal-entry queries
      queryClient.invalidateQueries({
        predicate: q =>
          Array.isArray(q.queryKey) &&
          String(q.queryKey[0]).startsWith('/api/journal-entries'),
      });

      playSound('success');
      setSaveStatus("Entry Updated!");
      setTimeout(() => setSaveStatus(""), 2000);

      // Extract tags and open Release window if any
      const releaseItems = extractReleaseItemsFromHtml(content);
      if (releaseItems.length > 0 && onOpenReleaseWindow) {
        onOpenReleaseWindow(currentEntryId!, releaseItems);
      }

      onSave?.();
      // Auto-close window after updating
      setTimeout(() => onClose?.(), 1000);
    }
  });

  useEffect(() => {
    if (entry) {
      console.log('Loading entry data:', entry); // Debug log
      setTitle(entry.title || "");
      setContent(entry.content || "");
      setMood(entry.mood || null);
      setJournalDate(entry.journalDate || new Date().toISOString().split('T')[0]);
      setCatharsisItems(entry.catharsis || []);
    } else if (!currentEntryId) {
      // For new entries, set default date
      setJournalDate(new Date().toISOString().split('T')[0]);
    }
  }, [entry, currentEntryId]);



  // Voice-to-text functionality using Web Speech API
  const recognitionRef = useRef<any>(null);
  const editorRef = useRef<RetroJournalEditorHandle>(null);

  // Normalize dictation text (turns words into punctuation/newlines)
  function normalizeDictation(input: string): string {
    let s = input;

    // Multi-word phrases first
    s = s.replace(/\b(new\s+paragraph|paragraph\s+break)\b/gi, '\n\n');
    s = s.replace(/\b(new\s+line|line\s+break)\b/gi, '\n');

    s = s.replace(/\b(open\s+quote|open\s+quotation\s+mark)\b/gi, '"');
    s = s.replace(/\b(close\s+quote|close\s+quotation\s+mark)\b/gi, '"');
    s = s.replace(/\b(open\s+single\s+quote)\b/gi, "'");
    s = s.replace(/\b(close\s+single\s+quote)\b/gi, "'");

    s = s.replace(/\b(ex(?:c|cl)lamation\s+(?:point|mark))\b/gi, '!');
    s = s.replace(/\b(question\s+mark)\b/gi, '?');
    s = s.replace(/\b(dot\s+dot\s+dot|ellipsis)\b/gi, '...');

    // Single words
    s = s.replace(/\b(period|full\s*stop)\b/gi, '.');
    s = s.replace(/\b(comma)\b/gi, ',');
    s = s.replace(/\b(colon)\b/gi, ':');
    s = s.replace(/\b(semicolon)\b/gi, ';');
    s = s.replace(/\b(dash|hyphen)\b/gi, ' - ');
    s = s.replace(/\b(ampersand)\b/gi, '&');
    s = s.replace(/\b(percent\s+sign|percent)\b/gi, '%');
    s = s.replace(/\b(quote)\b/gi, '"'); // optional catch-all

    // Spacing tidy-up
    s = s.replace(/\s+([,.;:!?...])/g, '$1');                        // no space before punct
    s = s.replace(/([,;:])([^\s""')\]}])/g, '$1 $2');              // space after , ; :
    s = s.replace(/([.?!...])(?!\s|$|["')\]}])/g, '$1 ');            // space after end marks
    s = s.replace(/\s*-\s*/g, ' - ');                              // normalize dash spacing

    return s.trim();
  }

  // Optional: capitalize sentence starts
  function smartCapitalize(s: string): string {
    return s.replace(/(^|[.?!...]\s+)([a-z])/g, (_m, pre, ch) => pre + ch.toUpperCase());
  }
  
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
          let text = finalTranscript.trim();
          if (text) {
            text = normalizeDictation(text);
            text = smartCapitalize(text);

            // Insert respecting paragraphs/newlines
            const paras = text.split(/\n\n/);
            paras.forEach((p, pi) => {
              const lines = p.split(/\n/);
              lines.forEach((line, li) => {
                if (line) editorRef.current?.insertText(line);
                if (li < lines.length - 1) editorRef.current?.insertParagraph(); // new line
              });
              if (pi < paras.length - 1) editorRef.current?.insertParagraph();   // new paragraph
            });
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

    // Extract tags from current content
    const releaseItems = extractReleaseItemsFromHtml(content);

    const entryData: InsertJournalEntry = {
      title,
      content, // full HTML with <span data-tag>
      tags: [],
      mood,
      journalDate,
      catharsis: releaseItems, // store for Release
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
        {/* Flip this to false to revert to Lexical instantly */}
        {true ? (
          <RetroJournalEditor
            ref={editorRef}
            value={content || "<p></p>"}
            onChange={setContent}
            placeholder="Start writing your journal entry..."
          />
        ) : (
          <RichTextEditorLexical
            key={currentEntryId ?? "new"}
            initialHTML={entry?.content ?? ""}
            onChange={setContent}
            placeholder="Start writing your journal entry..."
            readOnly={readOnly}
            ref={editorRef as any}
          />
        )}
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
          
          {/* Catharsis Button - REMOVED as requested */}
          {false && !readOnly && (
            <button
              type="button"
              className="mac-button catharsis-btn"
              onClick={() => setShowCatharsisWindow(true)}
              title="Open Release Window"
              data-testid="button-catharsis"
            >
              <Heart size={14} />
              Release ({catharsisItems.length})
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
