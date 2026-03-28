export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  setPlaybackRate(rate: number): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
}

export type SpeakingReview = {
  original_transcript: string;
  corrected_version: string;
  explanation: string;
  better_alternatives: string[];
  score?: number;
};

export type ShadowTurn = {
  id: string;
  text: string;
  sentenceIdx?: number;
  feedback: string | null;
  review: SpeakingReview | null;
  audioUrl?: string;
  timestamp: number;
};

export type Sentence = { text: string; startMs: number; endMs: number };
