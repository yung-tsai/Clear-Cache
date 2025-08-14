import { useState, useCallback, useEffect } from "react";
import { useMacSounds } from "@/hooks/useMacSounds";
import { AutoTagger } from "@/components/AutoTagger";
import { useQuery } from "@tanstack/react-query";

interface GratitudePromptsProps {
  onCreateEntry: (title: string, content: string) => void;
  onClose: () => void;
}

const GRATITUDE_PROMPTS = [
  "What made you smile today?",
  "Who in your life are you most thankful for right now?",
  "What simple pleasure brought you joy recently?",
  "What challenge turned out to be a blessing in disguise?",
  "What skill or ability are you grateful to have?",
  "What beautiful thing did you notice in nature today?",
  "What act of kindness touched your heart recently?",
  "What comfort in your life do you sometimes take for granted?",
  "What memory from this week fills you with warmth?",
  "What opportunity are you excited about?",
  "What part of your daily routine brings you peace?",
  "What lesson have you learned that you're thankful for?",
  "What creative expression brings you fulfillment?",
  "What aspect of your health are you grateful for?",
  "What small victory deserves celebration?",
  "What tradition or ritual enriches your life?",
  "What book, song, or piece of art has moved you lately?",
  "What quality in yourself are you learning to appreciate?",
  "What unexpected joy surprised you recently?",
  "What support system are you thankful to have?"
];

export default function GratitudePrompts({ onCreateEntry, onClose }: GratitudePromptsProps) {
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [personalizedPrompts, setPersonalizedPrompts] = useState<string[]>([]);
  const [response, setResponse] = useState("");
  const { playSound } = useMacSounds();
  
  // Fetch journal entries to create personalized prompts
  const { data: entries } = useQuery<any[]>({ 
    queryKey: ['/api/journal-entries'],
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (entries && entries.length > 0) {
      const contextualPrompts = AutoTagger.analyzeContentForPrompts(entries);
      const allPrompts = [...GRATITUDE_PROMPTS, ...contextualPrompts];
      setPersonalizedPrompts(allPrompts);
      setCurrentPrompt(allPrompts[Math.floor(Math.random() * allPrompts.length)]);
    } else {
      setPersonalizedPrompts(GRATITUDE_PROMPTS);
      setCurrentPrompt(GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)]);
    }
  }, [entries]);

  const getNewPrompt = useCallback(() => {
    playSound('click');
    let newPrompt;
    do {
      newPrompt = personalizedPrompts[Math.floor(Math.random() * personalizedPrompts.length)];
    } while (newPrompt === currentPrompt && personalizedPrompts.length > 1);
    setCurrentPrompt(newPrompt);
    setResponse("");
  }, [currentPrompt, personalizedPrompts, playSound]);

  const handleSave = useCallback(() => {
    if (!response.trim()) return;
    
    playSound('click');
    const title = `Gratitude - ${new Date().toLocaleDateString()}`;
    const content = `**Prompt:** ${currentPrompt}\n\n**Response:** ${response}`;
    onCreateEntry(title, content);
    onClose();
  }, [response, currentPrompt, onCreateEntry, onClose, playSound]);

  const handleCancel = useCallback(() => {
    playSound('click');
    onClose();
  }, [onClose, playSound]);

  return (
    <div className="gratitude-prompts">
      <div className="gratitude-header">
        <h3>Daily Gratitude</h3>
        <div className="gratitude-icon">✨</div>
      </div>
      
      <div className="prompt-section">
        <div className="prompt-label">Today's Prompt:</div>
        <div className="prompt-text" data-testid="gratitude-prompt">
          {currentPrompt}
        </div>
        <button 
          onClick={getNewPrompt}
          className="mac-button new-prompt-btn"
          data-testid="button-new-prompt"
        >
          Get New Prompt
        </button>
      </div>

      <div className="response-section">
        <div className="response-label">Your Response:</div>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Take a moment to reflect on this prompt..."
          className="gratitude-textarea"
          rows={6}
          data-testid="textarea-gratitude-response"
        />
      </div>

      <div className="gratitude-actions">
        <button
          onClick={handleSave}
          disabled={!response.trim()}
          className="mac-button save-btn"
          data-testid="button-save-gratitude"
        >
          Save as Journal Entry
        </button>
        <button
          onClick={handleCancel}
          className="mac-button cancel-btn"
          data-testid="button-cancel-gratitude"
        >
          Cancel
        </button>
      </div>

      <div className="gratitude-footer">
        <div className="gratitude-quote">
          "Gratitude turns what we have into enough." 
        </div>
      </div>
    </div>
  );
}