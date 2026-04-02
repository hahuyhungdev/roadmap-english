export const SHORTCUTS: [string, string][] = [
  ["Space / S", "Repeat active sentence"],
  ["A / ←", "Previous sentence"],
  ["D / →", "Next sentence"],
  ["R", "Toggle recording"],
  ["?", "Show / hide shortcuts"],
  ["Esc", "Close shortcuts / settings"],
];

export const YOUTUBE_SHORTCUTS: [string, string][] = [
  ["Space", "Play / Pause video"],
  ["← →", "Seek ±5 seconds"],
  ["Shift + ←", "Prev sentence"],
  ["Shift + →", "Next sentence"],
  ["[", "Set loop point A"],
  ["]", "Set loop point B"],
  ["L", "Toggle A-B loop"],
  ["R", "Toggle recording"],
  ["?", "Show / hide shortcuts"],
  ["Esc", "Close shortcuts / settings"],
];

export const TTS_PROVIDERS = [
  { value: "edge", label: "Edge (Browser Native)" },
  { value: "google", label: "Google Cloud TTS" },
];

export const TTS_ACCENTS = {
  edge: [
    {
      value: "microsoft-brian-us",
      label: "Brian — Deep Male",
      lang: "en-US",
    },
    {
      value: "microsoft-andrew-us",
      label: "Andrew — Natural Male",
      lang: "en-US",
    },
    {
      value: "microsoft-guy-us",
      label: "Guy — Broadcast Male",
      lang: "en-US",
    },
    {
      value: "microsoft-eric-us",
      label: "Eric — Steady Male",
      lang: "en-US",
    },
  ],
  google: [
    // Chirp3-HD Male Voices — Optimized for shadowing
    { value: "en-US-Chirp3-HD-Charon", label: "Charon — Deep, Calm (Best)" },
    { value: "en-US-Chirp3-HD-Puck", label: "Puck — Lively, Energetic" },
    {
      value: "en-US-Chirp3-HD-Fenrir",
      label: "Fenrir — Authoritative, Strong",
    },
    { value: "en-US-Chirp3-HD-Orus", label: "Orus — Neutral, Clear" },
    // Fallback: Neural2 voices (older, lower quality)
    { value: "en-US-Neural2-J", label: "Neural2 — Male (Legacy)" },
    { value: "en-US-Neural2-C", label: "Neural2 — Female (Legacy)" },
  ],
};

export const GOOGLE_ACCENTS = TTS_ACCENTS.google;

export const EDGE_ACCENTS = TTS_ACCENTS.edge;

export const DEFAULT_VOICE_BY_PROVIDER: Record<'edge' | 'google', string> = {
  edge: "microsoft-brian-us",
  google: "en-US-Chirp3-HD-Charon",
};

export const DEFAULT_SPEED = 0.85;
export const TTS_SPEEDS = [
  { value: 0.75, label: "0.75x" },
  { value: DEFAULT_SPEED, label: "0.85x" },
  { value: 1.0, label: "1.0x" },
  { value: 1.15, label: "1.15x" },
];
