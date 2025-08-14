interface MoodSelectorProps {
  selectedMood?: string | null;
  onMoodChange: (mood: string | null) => void;
}

const moods = [
  { value: 'happy', emoji: '😊', label: 'Happy', color: '#FFD700' },
  { value: 'sad', emoji: '😢', label: 'Sad', color: '#87CEEB' },
  { value: 'excited', emoji: '🤩', label: 'Excited', color: '#FF6347' },
  { value: 'calm', emoji: '😌', label: 'Calm', color: '#98FB98' },
  { value: 'anxious', emoji: '😰', label: 'Anxious', color: '#DDA0DD' },
  { value: 'grateful', emoji: '🙏', label: 'Grateful', color: '#F0E68C' },
  { value: 'angry', emoji: '😠', label: 'Angry', color: '#FF4500' },
  { value: 'peaceful', emoji: '🕊️', label: 'Peaceful', color: '#E6E6FA' },
];

export default function MoodSelector({ selectedMood, onMoodChange }: MoodSelectorProps) {
  return (
    <div className="mac-toolbar-group">
      <div className="text-xs font-bold mb-1" style={{ fontFamily: '"Press Start 2P", Monaco, monospace' }}>
        Mood:
      </div>
      <div className="flex flex-wrap gap-1">
        {moods.map((mood) => (
          <button
            key={mood.value}
            type="button"
            data-testid={`mood-${mood.value}`}
            onClick={() => onMoodChange(selectedMood === mood.value ? null : mood.value)}
            className={`
              px-2 py-1 text-xs rounded-none border border-black
              ${selectedMood === mood.value 
                ? 'bg-black text-white' 
                : 'bg-white text-black hover:bg-gray-200'
              }
            `}
            style={{
              fontFamily: '"Press Start 2P", Monaco, monospace',
              fontSize: '6px',
              minHeight: '18px',
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
            title={mood.label}
          >
            <span style={{ fontSize: '8px' }}>{mood.emoji}</span>
            <span className="ml-1">{mood.label.toUpperCase()}</span>
          </button>
        ))}
        {selectedMood && (
          <button
            type="button"
            data-testid="mood-clear"
            onClick={() => onMoodChange(null)}
            className="px-2 py-1 text-xs bg-white text-black border border-black hover:bg-gray-200"
            style={{
              fontFamily: '"Press Start 2P", Monaco, monospace',
              fontSize: '6px',
              minHeight: '18px'
            }}
            title="Clear mood"
          >
            CLEAR
          </button>
        )}
      </div>
    </div>
  );
}