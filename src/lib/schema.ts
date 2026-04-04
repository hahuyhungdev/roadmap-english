import {
  pgTable,
  text,
  timestamp,
  real,
  jsonb,
  serial,
  varchar,
  index,
  integer,
} from "drizzle-orm/pg-core";

// ─── Shadowing Sessions ──────────────────────────────────────────────────────
// Core table: each row represents one shadowing practice session
export const shadowingSessions = pgTable(
  "shadowing_sessions",
  {
    id: serial("id").primaryKey(),
    mode: varchar("mode", { length: 20 }).notNull(), // "youtube" | "script"
    title: varchar("title", { length: 500 }).notNull(),
    // YouTube-specific
    videoId: varchar("video_id", { length: 20 }),
    videoUrl: text("video_url"),
    // Script-specific
    scriptText: text("script_text"),
    // Shared state
    sentences: jsonb("sentences"), // Sentence[] JSON — null until processed
    ttsVoice: varchar("tts_voice", { length: 100 }).default(
      "en-US-Chirp3-HD-Fenrir",
    ),
    ttsSpeed: real("tts_speed").default(0.85),
    activeSentenceIdx: integer("active_sentence_idx").default(0),
    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("ss_created_idx").on(table.createdAt)],
);

// ─── TTS Audio Cache ─────────────────────────────────────────────────────────
// Stores base64-encoded TTS audio to avoid re-generating the same audio
export const ttsCache = pgTable(
  "tts_cache",
  {
    id: serial("id").primaryKey(),
    textHash: varchar("text_hash", { length: 64 }).notNull(), // SHA-256 of text+voice+speed
    text: text("text").notNull(),
    voice: varchar("voice", { length: 100 }).notNull(),
    speed: real("speed").notNull().default(1.0),
    audioBase64: text("audio_base64").notNull(),
    mimeType: varchar("mime_type", { length: 50 })
      .notNull()
      .default("audio/mpeg"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("tts_cache_hash_idx").on(table.textHash)],
);

// ─── YouTube Transcript Cache ────────────────────────────────────────────────
// Caches fetched/cleaned YouTube transcripts so we don't re-fetch
export const youtubeTranscripts = pgTable(
  "youtube_transcripts",
  {
    id: serial("id").primaryKey(),
    videoId: varchar("video_id", { length: 20 }).notNull().unique(),
    videoTitle: varchar("video_title", { length: 500 }),
    sentences: jsonb("sentences"), // nullable; legacy merged sentences (unused)
    rawSegments: jsonb("raw_segments"), // raw Supadata chunks { text, start, duration }[]
    source: varchar("source", { length: 50 }).default("supadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("yt_video_id_idx").on(table.videoId)],
);

// ─── Script Sessions Cache ──────────────────────────────────────────────────
// Stores parsed script sessions so user can resume
export const scriptSessions = pgTable("script_sessions", {
  id: serial("id").primaryKey(),
  scriptHash: varchar("script_hash", { length: 64 }).notNull(), // SHA-256 of script text
  scriptPreview: varchar("script_preview", { length: 500 }), // first N chars
  sentences: jsonb("sentences").notNull(), // Sentence[] JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── English Sessions (Curriculum Backup) ────────────────────────────────────
// Mirrors the content/*.md files so the curriculum is recoverable from DB
export const englishSessions = pgTable("english_sessions", {
  slug: varchar("slug", { length: 100 }).primaryKey(), // e.g. "session-01"
  sessionNumber: integer("session_number").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  topic: varchar("topic", { length: 500 }).notNull(),
  phase: varchar("phase", { length: 200 }).notNull(),
  level: varchar("level", { length: 50 }),
  description: text("description"),
  contentMd: text("content_md").notNull(), // full markdown body (without frontmatter)
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});

// ─── Lesson Progress ──────────────────────────────────────────────────────────
// Tracks which sessions the user has marked as done.
// Single-user personal app: no user_id needed.
export const lessonProgress = pgTable("lesson_progress", {
  sessionSlug: varchar("session_slug", { length: 100 }).primaryKey(),
  done: text("done").notNull().default("false"), // "true" | "false" (avoids boolean DDL quirks)
  doneAt: timestamp("done_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
