import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { JournalEntry as JournalEntryType, InsertJournalEntry } from "@shared/schema";
import { useMacSounds } from "@/hooks/useMacSounds";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import RichTextEditor from "@/components/RichTextEditor";
import MoodSelector from "@/components/MoodSelector";
import { Mic, MicOff, Save, X, Calendar, Clock, Tag, Trash2, Edit2 } from "lucide-react";

import { AutoTagger } from "@/components/AutoTagger";

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
  const [tags, setTags] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [journalDate, setJournalDate] = useState(""); // Will be set based on existing entry or today's date
  const [saveStatus, setSaveStatus] = useState("");
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
      setSaveStatus("Entry Updated!");
      setTimeout(() => setSaveStatus(""), 2000);
      onSave?.();
    }
  });

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setTags((entry.tags || []).join(', '));
      setMood(entry.mood || null);
      setJournalDate(entry.journalDate);
    } else {
      // For new entries, set today's date
      setJournalDate(new Date().toISOString().split('T')[0]);
    }
  }, [entry]);

  // Auto-generate tag suggestions when content or title changes
  useEffect(() => {
    if (title || content) {
      const suggestions = AutoTagger.analyzeTags(content, title);
      setSuggestedTags(suggestions);
    }
  }, [title, content]);

  const addSuggestedTag = (tag: string) => {
    playSound('click');
    const currentTags = tags.split(',').map(t => t.trim()).filter(t => t);
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ');
      setTags(newTags);
    }
  };

  // Voice-to-text functionality using Web Speech API
  const recognitionRef = useRef<any>(null);
  
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
          if (content.trim()) {
            setContent(content + '\n\n' + errorText);
          } else {
            setContent(errorText);
          }
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false; // Only get final results for faster processing
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;
        
        let finalTranscript = '';
        
        recognition.onstart = () => {
          setIsRecording(true);
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
          
          if (finalTranscript.trim()) {
            // Append the transcription to existing content immediately
            if (content.trim()) {
              setContent(content + '\n\n' + finalTranscript.trim());
            } else {
              setContent(finalTranscript.trim());
            }
          }
          
          playSound('click');
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          playSound('click');
          
          if (event.error === 'no-speech') {
            const message = "No speech detected. Please try again.";
            if (content.trim()) {
              setContent(content + '\n\n' + message);
            } else {
              setContent(message);
            }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');

    const entryData: InsertJournalEntry = {
      title,
      content,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      mood,
      journalDate
    };

    if (currentEntryId) {
      updateMutation.mutate(entryData);
    } else {
      createMutation.mutate(entryData);
    }
  };

  const formatText = (command: string) => {
    playSound('click');
    // Get the textarea element from the RichTextEditor
    const textarea = document.querySelector('[data-testid="textarea-content"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      
      if (selectedText) {
        let formattedText = selectedText;
        switch (command) {
          case 'bold':
            formattedText = `**${selectedText}**`;
            break;
          case 'italic':
            formattedText = `*${selectedText}*`;
            break;
          case 'underline':
            formattedText = `_${selectedText}_`;
            break;
        }
        
        const newContent = content.substring(0, start) + formattedText + content.substring(end);
        setContent(newContent);
        
        // Reset cursor position
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
        }, 0);
      }
    }
  };

  const highlightText = (color: string) => {
    playSound('click');
    const textarea = document.querySelector('[data-testid="textarea-content"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      
      if (selectedText) {
        const highlightedText = `[highlight-${color}]${selectedText}[/highlight-${color}]`;
        const newContent = content.substring(0, start) + highlightedText + content.substring(end);
        setContent(newContent);
        
        // Reset cursor position
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + highlightedText.length, start + highlightedText.length);
        }, 0);
      }
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
      
      <div className="flex items-center gap-2">
        <label className="min-w-[40px] font-bold text-xs">Tags:</label>
        <input
          type="text"
          className="mac-input flex-1"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Separate with commas"
          readOnly={readOnly}
          data-testid="input-tags"
        />
        {/* Auto-generated tag suggestions */}
        {!readOnly && suggestedTags.length > 0 && (
          <div className="tag-suggestions">
            <span className="tag-suggestions-label">Suggested tags:</span>
            <div className="suggested-tags">
              {suggestedTags.map((tag, index) => {
                const currentTags = tags.split(',').map(t => t.trim()).filter(t => t);
                const isAdded = currentTags.includes(tag);
                return (
                  <span
                    key={index}
                    className={`suggested-tag ${isAdded ? 'added' : ''}`}
                    onClick={() => !isAdded && addSuggestedTag(tag)}
                    data-testid={`suggested-tag-${index}`}
                  >
                    {tag} {isAdded && '✓'}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Mood Section */}
      <div className="mb-2">
        <MoodSelector 
          selectedMood={mood}
          onMoodChange={setMood}
        />
      </div>


      
      {!readOnly && (
        <div className="mac-toolbar">
          <button
            type="button"
            className="mac-toolbar-btn"
            onClick={() => formatText('bold')}
            data-testid="button-bold"
          >
            <b>B</b>
          </button>
          <button
            type="button"
            className="mac-toolbar-btn"
            onClick={() => formatText('italic')}
            data-testid="button-italic"
          >
            <i>I</i>
          </button>
          <button
            type="button"
            className="mac-toolbar-btn"
            onClick={() => formatText('underline')}
            data-testid="button-underline"
          >
            <u>U</u>
          </button>
          
          <div className="color-picker">
            <div
              className="color-swatch highlight-yellow"
              onClick={() => highlightText('yellow')}
              title="Yellow"
              data-testid="color-yellow"
            />
            <div
              className="color-swatch highlight-pink"
              onClick={() => highlightText('pink')}
              title="Pink"
              data-testid="color-pink"
            />
            <div
              className="color-swatch highlight-green"
              onClick={() => highlightText('green')}
              title="Green"
              data-testid="color-green"
            />
            <div
              className="color-swatch highlight-blue"
              onClick={() => highlightText('blue')}
              title="Blue"
              data-testid="color-blue"
            />
          </div>
        </div>
      )}
      
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Start writing your journal entry..."
        readOnly={readOnly}
        data-testid="textarea-content"
      />
      
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
          <div className="flex flex-wrap gap-1">
            {tags.split(',').map(tag => tag.trim()).filter(tag => tag).map((tag, index) => (
              <span key={index} className="mac-tag" data-testid={`tag-${index}`}>
                {tag}
              </span>
            ))}
          </div>
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
    </form>
  );
}
