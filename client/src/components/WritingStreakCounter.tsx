import { useQuery } from "@tanstack/react-query";

export default function WritingStreakCounter() {
  const { data: entries } = useQuery<any[]>({ 
    queryKey: ['/api/journal-entries'],
    staleTime: 5 * 60 * 1000
  });

  const calculateStreak = () => {
    if (!entries || entries.length === 0) return 0;

    const sortedEntries = entries
      .sort((a, b) => new Date(b.journalDate).getTime() - new Date(a.journalDate).getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.journalDate);
      entryDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else if (diffDays === streak + 1 && streak === 0) {
        // If today's entry is missing but yesterday's exists, start from 0
        break;
      } else {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();
  const totalEntries = entries?.length || 0;

  return (
    <div className="writing-streak-counter" data-testid="writing-streak-counter">
      <div className="streak-header">Writing Streak</div>
      <div className="streak-number">{streak}</div>
      <div className="streak-unit">days</div>
      <div className="streak-total">{totalEntries} total entries</div>
    </div>
  );
}