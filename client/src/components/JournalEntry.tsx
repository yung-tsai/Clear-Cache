import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { JournalEntry as JournalEntryType, InsertJournalEntry } from "@shared/schema";
import { useMacSounds } from "@/hooks/useMacSounds";
import RichTextEditor from "@/components/RichTextEditor";

interface JournalEntryProps {
  entryId?: string;
  readOnly?: boolean;
  onSave?: () => void;
  onClose?: () => void;
}

export default function JournalEntry({ entryId, readOnly, onSave, onClose }: JournalEntryProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const queryClient = useQueryClient();
  const { playSound } = useMacSounds();

  // Fetch existing entry if entryId is provided
  const { data: entry, isLoading } = useQuery<JournalEntryType>({
    queryKey: ['/api/journal-entries', entryId],
    enabled: !!entryId
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertJournalEntry) => {
      const response = await apiRequest('POST', '/api/journal-entries', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] });
      setSaveStatus("Entry Saved!");
      setTimeout(() => setSaveStatus(""), 2000);
      onSave?.();
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertJournalEntry>) => {
      const response = await apiRequest('PATCH', `/api/journal-entries/${entryId}`, data);
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
    }
  }, [entry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');

    const entryData: InsertJournalEntry = {
      title,
      content,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    if (entryId) {
      updateMutation.mutate(entryData);
    } else {
      createMutation.mutate(entryData);
    }
  };

  const formatText = (command: string) => {
    playSound('click');
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
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
        
        document.execCommand('insertText', false, formattedText);
      }
    }
  };

  const highlightText = (color: string) => {
    playSound('click');
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        const highlightedText = `[highlight-${color}]${selectedText}[/highlight-${color}]`;
        document.execCommand('insertText', false, highlightedText);
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
        <div className="flex flex-wrap gap-1">
          {tags.split(',').map(tag => tag.trim()).filter(tag => tag).map((tag, index) => (
            <span key={index} className="mac-tag" data-testid={`tag-${index}`}>
              {tag}
            </span>
          ))}
        </div>
        
        {!readOnly && (
          <div className="flex items-center gap-2">
            {saveStatus && <span className="text-xs">{saveStatus}</span>}
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
