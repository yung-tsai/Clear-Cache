import { type JournalEntry, type InsertJournalEntry } from "@shared/schema";
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
      updatedAt: now
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
        entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();
