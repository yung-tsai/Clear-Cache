import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { JournalEntry } from "@shared/schema";
import { useMacSounds } from "@/hooks/useMacSounds";

interface SearchWindowProps {
  onViewEntry: (entryId: string, title: string) => void;
  onDragStart: (entryId: string) => void;
}

export default function SearchWindow({ onViewEntry, onDragStart }: SearchWindowProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { playSound } = useMacSounds();

  // Convert markdown-like syntax to HTML for display
  const convertToHtml = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<u>$1</u>')
      .replace(/\[highlight-yellow\](.*?)\[\/highlight-yellow\]/g, '<span class="highlight-yellow">$1</span>')
      .replace(/\[highlight-pink\](.*?)\[\/highlight-pink\]/g, '<span class="highlight-pink">$1</span>')
      .replace(/\[highlight-green\](.*?)\[\/highlight-green\]/g, '<span class="highlight-green">$1</span>')
      .replace(/\[highlight-blue\](.*?)\[\/highlight-blue\]/g, '<span class="highlight-blue">$1</span>')
      .replace(/\n/g, '<br>');
  };

  // Fetch all entries
  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['/api/journal-entries']
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await apiRequest('DELETE', `/api/journal-entries/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] });
    }
  });

  // Filter entries based on search query
  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDragStart = (e: React.DragEvent, entryId: string) => {
    playSound('click');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', entryId);
    onDragStart(entryId);
  };

  const handleEntryClick = (entry: JournalEntry) => {
    playSound('click');
    onViewEntry(entry.id, entry.title);
  };

  const handleDeleteEntry = async (entryId: string, entryTitle: string) => {
    if (confirm(`Delete "${entryTitle}" permanently?`)) {
      await deleteMutation.mutate(entryId);
      playSound('click');
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading entries...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <label className="min-w-[50px] font-bold text-xs">Search:</label>
        <input
          type="text"
          className="mac-input flex-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search titles, content, or tags..."
          data-testid="input-search"
        />
      </div>
      
      <div className="search-results flex-1">
        {filteredEntries.length === 0 ? (
          <div className="p-5 text-center">
            {entries.length === 0 ? 'No entries found. Create your first entry!' : 'No matching entries found.'}
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div
              key={entry.id}
              className="search-item"
              draggable
              onDragStart={(e) => handleDragStart(e, entry.id)}
              onClick={() => handleEntryClick(entry)}
              data-testid={`search-item-${entry.id}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-xs text-gray-600 mb-1" style={{ fontFamily: '"Press Start 2P", Monaco, monospace', fontSize: '6px' }}>
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                  <div className="font-bold text-xs" style={{ fontFamily: '"Press Start 2P", Monaco, monospace', fontSize: '8px' }}>
                    {entry.title}
                  </div>
                </div>
                <button
                  className="ml-2 text-xs hover:bg-red-200 px-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEntry(entry.id, entry.title);
                  }}
                  data-testid={`button-delete-${entry.id}`}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-600">
        <div>Found {filteredEntries.length} of {entries.length} entries</div>
        <div>Tip: Drag entries to the trash to delete them</div>
      </div>
    </div>
  );
}
