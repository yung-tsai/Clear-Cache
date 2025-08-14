// Auto-tagging utility for analyzing content and suggesting tags
export class AutoTagger {
  private static tagPatterns = {
    emotions: {
      happy: ['happy', 'joy', 'excited', 'wonderful', 'great', 'amazing', 'fantastic', 'love', 'smile', 'laugh'],
      sad: ['sad', 'down', 'depressed', 'upset', 'cry', 'tears', 'disappointed', 'lonely', 'hurt'],
      stressed: ['stressed', 'pressure', 'overwhelmed', 'anxious', 'worried', 'tension', 'deadline', 'rush'],
      grateful: ['grateful', 'thankful', 'appreciate', 'blessed', 'fortunate', 'lucky'],
      angry: ['angry', 'mad', 'frustrated', 'annoyed', 'irritated', 'furious'],
      peaceful: ['peaceful', 'calm', 'serene', 'quiet', 'meditation', 'zen', 'tranquil']
    },
    activities: {
      work: ['work', 'job', 'office', 'meeting', 'project', 'boss', 'colleague', 'presentation', 'deadline'],
      travel: ['travel', 'trip', 'vacation', 'flight', 'hotel', 'airport', 'journey', 'explore'],
      exercise: ['gym', 'workout', 'run', 'running', 'exercise', 'fitness', 'yoga', 'walk', 'bike', 'swim'],
      food: ['dinner', 'lunch', 'breakfast', 'restaurant', 'cook', 'recipe', 'meal', 'eat', 'delicious'],
      family: ['family', 'mom', 'dad', 'parent', 'child', 'brother', 'sister', 'grandmother', 'grandfather'],
      friends: ['friend', 'buddy', 'hangout', 'party', 'social', 'gathering'],
      learning: ['learn', 'study', 'book', 'read', 'course', 'school', 'education', 'skill', 'practice'],
      nature: ['nature', 'outdoor', 'park', 'tree', 'flower', 'garden', 'hiking', 'beach', 'mountain']
    },
    time: {
      morning: ['morning', 'breakfast', 'dawn', 'early', 'sunrise', 'am'],
      evening: ['evening', 'dinner', 'sunset', 'night', 'pm'],
      weekend: ['weekend', 'saturday', 'sunday'],
      season: ['spring', 'summer', 'fall', 'autumn', 'winter']
    }
  };

  static analyzeTags(content: string, title: string): string[] {
    const text = (content + ' ' + title).toLowerCase();
    const suggestedTags: Set<string> = new Set();

    // Check each category and pattern
    Object.entries(this.tagPatterns).forEach(([category, tags]) => {
      Object.entries(tags).forEach(([tag, keywords]) => {
        const keywordMatches = keywords.some(keyword => 
          text.includes(keyword.toLowerCase())
        );
        
        if (keywordMatches) {
          suggestedTags.add(tag);
        }
      });
    });

    // Extract potential custom tags from common patterns
    const words = text.split(/\s+/).filter(word => word.length > 3);
    const commonWords = ['the', 'and', 'for', 'with', 'this', 'that', 'have', 'been', 'will', 'from', 'they', 'were', 'said', 'each', 'which', 'their', 'time', 'into', 'than', 'only', 'could', 'other', 'after', 'first', 'well', 'also'];
    
    words.forEach(word => {
      if (!commonWords.includes(word) && word.length > 4) {
        // Check if this might be a place name or proper noun (capitalized in original)
        const originalText = content + ' ' + title;
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        const match = originalText.match(regex);
        if (match && match[0][0] === match[0][0].toUpperCase()) {
          suggestedTags.add(word.toLowerCase());
        }
      }
    });

    return Array.from(suggestedTags).slice(0, 5); // Limit to 5 suggestions
  }

  static analyzeContentForPrompts(entries: Array<{content: string, mood?: string | null, journalDate: string}>): string[] {
    if (entries.length === 0) return [];

    const recentEntries = entries
      .sort((a, b) => new Date(b.journalDate).getTime() - new Date(a.journalDate).getTime())
      .slice(0, 5);

    const prompts: string[] = [];
    const allText = recentEntries.map(e => e.content.toLowerCase()).join(' ');
    const recentMoods = recentEntries.map(e => e.mood).filter(Boolean);

    // Mood-based prompts
    if (recentMoods.includes('sad') || recentMoods.includes('anxious')) {
      prompts.push("What's one small thing that brought you comfort today?");
      prompts.push("Write about a challenge you overcame recently and how it made you stronger.");
    }

    if (recentMoods.includes('happy') || recentMoods.includes('excited')) {
      prompts.push("What made today special? How can you create more moments like this?");
      prompts.push("Describe the feeling of joy you experienced recently in vivid detail.");
    }

    // Content-based prompts
    if (allText.includes('work') || allText.includes('job')) {
      prompts.push("How has your work impacted your personal growth this week?");
    }

    if (allText.includes('family') || allText.includes('friend')) {
      prompts.push("Write about a relationship that has shaped who you are today.");
    }

    // Time-based prompts
    const daysSinceLastEntry = recentEntries.length > 1 
      ? Math.floor((new Date().getTime() - new Date(recentEntries[1].journalDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (daysSinceLastEntry > 3) {
      prompts.push("What has changed in your life since your last journal entry?");
    }

    // Generic fallbacks
    const genericPrompts = [
      "What lesson did you learn about yourself this week?",
      "Describe a moment when you felt truly present and mindful.",
      "What would you tell your past self if you could go back one year?",
      "Write about something you're looking forward to.",
      "What habit would you like to develop, and why is it important to you?"
    ];

    if (prompts.length === 0) {
      prompts.push(...genericPrompts.slice(0, 2));
    }

    return prompts.slice(0, 3);
  }
}