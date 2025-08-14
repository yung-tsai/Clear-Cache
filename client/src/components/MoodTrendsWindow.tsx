import { useQuery } from "@tanstack/react-query";
import MoodTrendChart from "./MoodTrendChart";
import { JournalEntry } from "@shared/schema";

interface MoodTrendsWindowProps {
  onClose: () => void;
}

export default function MoodTrendsWindow({ onClose }: MoodTrendsWindowProps) {
  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['/api/journal-entries'],
  });

  if (isLoading) {
    return (
      <div className="mood-trends-window">
        <div className="loading-state">Loading mood data...</div>
      </div>
    );
  }

  return (
    <div className="mood-trends-window">
      <div className="window-header">
        <h2>Mood Analysis</h2>
        <button 
          onClick={onClose}
          className="close-btn"
          data-testid="button-close-mood-trends"
        >
          ×
        </button>
      </div>
      
      <div className="trends-content">
        <MoodTrendChart entries={entries} />
        
        <div className="mood-summary">
          <div className="summary-title">Recent Mood Summary</div>
          <div className="summary-stats">
            {(() => {
              const recentEntries = entries
                .filter(e => e.mood)
                .slice(0, 10);
              
              if (recentEntries.length === 0) {
                return <div>No mood data available yet. Start tracking your mood in journal entries!</div>;
              }
              
              const moodCounts = recentEntries.reduce((acc, entry) => {
                const mood = entry.mood!;
                acc[mood] = (acc[mood] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              
              const mostCommon = Object.entries(moodCounts)
                .sort(([,a], [,b]) => b - a)[0];
              
              return (
                <div>
                  <div>Recent entries: {recentEntries.length}</div>
                  <div>Most common mood: {mostCommon?.[0] || 'None'} ({mostCommon?.[1] || 0} times)</div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}