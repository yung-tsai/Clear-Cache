import { type JournalEntry, type InsertJournalEntry, type CatharsisItem } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getJournalEntry(id: string): Promise<JournalEntry | undefined>;
  getAllJournalEntries(): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: string, entry: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: string): Promise<boolean>;
  searchJournalEntries(query: string): Promise<JournalEntry[]>;
}

export class MemStorage implements IStorage {
  private entries: Map<string, JournalEntry>;

  constructor() {
    this.entries = new Map();
    this.addMockEntries();
  }

  private addMockEntries() {
    // Create mock entries with different moods and dates
    const mockEntries = [
      {
        title: "Beautiful Morning",
        content: "Woke up to sunshine streaming through my window. The birds were singing and I felt ready to take on the world. Coffee tastes extra good today!",
        mood: "happy",
        journalDate: "2025-01-15",
        tags: ["morning", "sunshine", "coffee"],
        catharsis: []
      },
      {
        title: "Challenging Day at Work",
        content: "Had a difficult presentation today. My boss wasn't happy with the results and I'm feeling pretty stressed about the feedback. Need to work on improving.",
        mood: "anxious",
        journalDate: "2025-01-16",
        tags: ["work", "stress", "feedback"],
        catharsis: []
      },
      {
        title: "Peaceful Evening",
        content: "Spent the evening reading a good book by the fireplace. Sometimes the simple pleasures are the best. Feeling very zen right now.",
        mood: "peaceful",
        journalDate: "2025-01-17",
        tags: ["reading", "relaxation", "evening"],
        catharsis: []
      },
      {
        title: "Exciting News!",
        content: "Got the promotion I've been working towards! I can barely contain my excitement. All those late nights were worth it. Time to celebrate!",
        mood: "excited",
        journalDate: "2025-01-18",
        tags: ["promotion", "work", "celebration"],
        catharsis: []
      },
      {
        title: "Rainy Day Blues",
        content: "It's been raining all day and I'm feeling a bit down. Sometimes the weather really affects my mood. Maybe I should plan something fun for tomorrow.",
        mood: "sad",
        journalDate: "2025-01-19",
        tags: ["weather", "rain", "mood"],
        catharsis: []
      },
      {
        title: "Gratitude Practice",
        content: "Taking time to appreciate all the good things in my life today. Family, health, a roof over my head - there's so much to be thankful for.",
        mood: "grateful",
        journalDate: "2025-01-20",
        tags: ["gratitude", "family", "health"],
        catharsis: []
      },
      {
        title: "Meditation Session",
        content: "Had a wonderful 20-minute meditation this morning. Feeling centered and calm. It's amazing how much clarity comes from just sitting quietly.",
        mood: "calm",
        journalDate: "2025-01-21",
        tags: ["meditation", "mindfulness", "morning"],
        catharsis: []
      },
      {
        title: "Traffic Frustration",
        content: "Got stuck in traffic for over an hour today because of construction. Was running late for an important meeting. Really need to work on my patience.",
        mood: "angry",
        journalDate: "2025-01-22",
        tags: ["traffic", "late", "frustration"],
        catharsis: []
      },
      {
        title: "Weekend Adventure",
        content: "Went hiking with friends today! The views from the summit were absolutely breathtaking. Feeling energized and connected to nature.",
        mood: "excited",
        journalDate: "2025-01-25",
        tags: ["hiking", "friends", "nature"],
        catharsis: []
      },
      {
        title: "Quiet Sunday",
        content: "A perfectly peaceful Sunday at home. Made pancakes, did some gardening, and caught up on my favorite TV show. Simple pleasures bring such joy.",
        mood: "peaceful",
        journalDate: "2025-01-26",
        tags: ["Sunday", "home", "gardening"],
        catharsis: []
      },
      {
        title: "Learning Something New",
        content: "Started learning to play guitar today! My fingers are sore but I'm so excited to be picking up a new skill. Music has always been a dream of mine.",
        mood: "happy",
        journalDate: "2025-01-27",
        tags: ["guitar", "learning", "music"],
        catharsis: []
      },
      {
        title: "Family Dinner",
        content: "Had dinner with my parents tonight. So grateful for these moments together. Mom made my favorite meal and we talked for hours about everything and nothing.",
        mood: "grateful",
        journalDate: "2025-01-28",
        tags: ["family", "dinner", "parents"],
        catharsis: []
      }
    ];

    mockEntries.forEach((mockEntry, index) => {
      const id = `mock-${index + 1}`;
      const baseDate = new Date(mockEntry.journalDate);
      const entry: JournalEntry = {
        id,
        title: mockEntry.title,
        content: mockEntry.content,
        tags: mockEntry.tags,
        mood: mockEntry.mood,
        weather: null,
        temperature: null,
        location: null,
        voiceMemo: null,
        voiceMemos: [],
        journalDate: mockEntry.journalDate,
        catharsis: mockEntry.catharsis || [],
        createdAt: baseDate,
        updatedAt: baseDate
      };
      this.entries.set(id, entry);
    });
  }

  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    return this.entries.get(id);
  }

  async getAllJournalEntries(): Promise<JournalEntry[]> {
    return Array.from(this.entries.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const id = randomUUID();
    const now = new Date();
    const entry: JournalEntry = { 
      ...insertEntry, 
      id, 
      createdAt: now,
      updatedAt: now,
      tags: insertEntry.tags || [],
      mood: insertEntry.mood || null,
      weather: insertEntry.weather || null,
      temperature: insertEntry.temperature || null,
      location: insertEntry.location || null,
      voiceMemo: insertEntry.voiceMemo || null,
      voiceMemos: insertEntry.voiceMemos || [],
      catharsis: insertEntry.catharsis || [],
      journalDate: insertEntry.journalDate,
    };
    this.entries.set(id, entry);
    return entry;
  }

  async updateJournalEntry(id: string, updateData: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const entry = this.entries.get(id);
    if (!entry) return undefined;
    
    const updatedEntry: JournalEntry = {
      ...entry,
      ...updateData,
      updatedAt: new Date()
    };
    this.entries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteJournalEntry(id: string): Promise<boolean> {
    return this.entries.delete(id);
  }

  async searchJournalEntries(query: string): Promise<JournalEntry[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.entries.values())
      .filter(entry => 
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.content.toLowerCase().includes(lowerQuery) ||
        (entry.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();
