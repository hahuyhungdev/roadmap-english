// ─── Speaking Coach Types ──────────────────────────────────────────────────

export type ConversationTurn = {
  id: string;
  role: "user" | "coach";
  /** Raw transcript (user) or raw reply (coach) */
  text: string;
  /** Parsed review block from coach JSON (user turns only) */
  review: SpeakingReview | null;
  /** ISO timestamp */
  timestamp: number;
};

export interface SpeakingReview {
  original_transcript: string;
  corrected_version: string;
  explanation: string;
  better_alternatives: string[];
}

export interface CoachingMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ─── Soniox streaming states ────────────────────────────────────────────────

export type SonioxStatus =
  | "idle"
  | "connecting"
  | "speaking"   // user is speaking
  | "processing" // silence detected, finalizing
  | "error";

export interface UseVoicePracticeOptions {
  /** Custom system prompt. Omit for the default English Speaking Coach. */
  systemPrompt?: string;
  /** Called with parsed review after each coach response. */
  onReview?: (review: SpeakingReview) => void;
  /** Minimum silence duration (ms) before triggering end-of-speech (default 800). */
  silenceThresholdMs?: number;
  /** Minimum audio level to consider "speaking" (0–1, default 0.02). */
  energyThreshold?: number;
}

export interface UseVoicePracticeReturn {
  // State
  status: SonioxStatus;
  error: string | null;
  transcript: string;       // live interim transcript
  turns: ConversationTurn[];
  isAiResponding: boolean;

  // Controls
  startPractice: () => Promise<void>;
  stopPractice: () => void;
  clearHistory: () => void;
}
