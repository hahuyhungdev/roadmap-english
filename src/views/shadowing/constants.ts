export const SHORTCUTS: [string, string][] = [
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

export const TTS_VOICES = [
  { value: "en-US-Neural2-F", label: "Female (Neural2-F)" },
  { value: "en-US-Neural2-C", label: "Female (Neural2-C)" },
  { value: "en-US-Neural2-J", label: "Male (Neural2-J)" },
  { value: "en-US-Neural2-A", label: "Male (Neural2-A)" },
  { value: "en-US-Neural2-D", label: "Male (Neural2-D)" },
];

export const TTS_SPEEDS = [
  { value: 0.6, label: "0.6x — Very slow" },
  { value: 0.75, label: "0.75x — Slow" },
  { value: 0.9, label: "0.9x — Normal-" },
  { value: 1.0, label: "1.0x — Normal" },
  { value: 1.15, label: "1.15x — Fast" },
];
