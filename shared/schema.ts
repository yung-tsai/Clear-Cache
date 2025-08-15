import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export interface CatharsisItem {
  id: string;
  text: string;
  stressLevel: 'angry' | 'sad' | 'anxious';
  createdAt: string;
}

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array().default([]).notNull(),
  mood: text("mood"), // happy, sad, excited, calm, anxious, grateful, angry, peaceful
  weather: text("weather"), // sunny, cloudy, rainy, snowy, stormy
  temperature: integer("temperature"), // in fahrenheit
  location: text("location"), // city name for weather
  journalDate: text("journal_date").notNull(), // user-selected date for the entry (YYYY-MM-DD format)
  voiceMemo: text("voice_memo"), // base64 encoded audio data
  voiceMemos: text("voice_memos").array().default([]).notNull(), // array of voice memo objects as JSON strings
  catharsis: text("catharsis").$type<CatharsisItem[]>().default('[]'), // cathartic emotional releases
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).pick({
  title: true,
  content: true,
  tags: true,
  mood: true,
  weather: true,
  temperature: true,
  location: true,
  journalDate: true,
  voiceMemo: true,
  voiceMemos: true,
  catharsis: true,
}).extend({
  catharsis: z.array(z.object({
    id: z.string(),
    text: z.string(),
    stressLevel: z.enum(['angry', 'sad', 'anxious']),
    createdAt: z.string(),
  })).optional(),
});

export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
