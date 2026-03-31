"use client";

import clsx from "clsx";
import {
  FileText,
  Loader2,
  RefreshCw,
  Settings2,
  Star,
  Trash2,
} from "lucide-react";
import {
  TTS_ACCENTS,
  TTS_PROVIDERS,
  TTS_SPEEDS,
} from "@/features/shadowing/shared/constants";
import { SentenceCard } from "./SentenceCard";
import type { Sentence } from "./types";

export interface ScriptPanelProps {
  videoId: string | null;
  sentences: Sentence[];
  activeSentenceIdx: number;
  sentenceItemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  scriptLoading: boolean;
  scriptError: string;
  // TTS state — per-sentence tracking
  hearingIdx: number | null;
  ttsLoading: boolean;
  ttsPlaying: boolean;
  // Recording state
  isRecording: boolean;
  recordingForIdx: number | null;
  // Settings
  showTtsSettings: boolean;
  ttsProvider: string;
  ttsAccent: string;
  ttsVoice: string;
  ttsSpeed: number;
  autoPronounceSentence: boolean;
  loopSentence: boolean;
  // Score
  overallScore: number | null;
  hasTurns: boolean;
  // Callbacks
  onFetchScript: () => void;
  onJumpToSentence: (idx: number) => void;
  onToggleTtsSettings: () => void;
  onClearSession: () => void;
  onSetTtsProvider: (p: string) => void;
  onSetTtsAccent: (a: string) => void;
  onSetTtsVoice: (v: string) => void;
  onSetTtsSpeed: (s: number) => void;
  onSetAutoPronounceSentence: (v: boolean) => void;
  onSetLoopSentence: (v: boolean) => void;
}

export function ScriptPanel({
  videoId,
  sentences,
  activeSentenceIdx,
  sentenceItemRefs,
  scriptLoading,
  scriptError,

  showTtsSettings,
  ttsProvider,
  ttsAccent,

  ttsSpeed,
  autoPronounceSentence,
  loopSentence,
  overallScore,
  hasTurns,
  onFetchScript,
  onJumpToSentence,
  onToggleTtsSettings,
  onClearSession,
  onSetTtsProvider,
  onSetTtsAccent,

  onSetTtsSpeed,
  onSetAutoPronounceSentence,
  onSetLoopSentence,
}: ScriptPanelProps) {
  return (
    <>
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">Script</span>
          {sentences.length > 0 && (
            <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {sentences.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {overallScore !== null && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 rounded-full">
              <Star
                size={10}
                className="fill-amber-500 text-amber-500 shrink-0"
              />
              {overallScore}/10
            </span>
          )}
          <button
            onClick={onToggleTtsSettings}
            title="Voice settings"
            className={clsx(
              "w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
              showTtsSettings
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-500 hover:text-indigo-600 hover:bg-gray-100",
            )}
          >
            <Settings2 size={14} />
          </button>
          {hasTurns && (
            <button
              onClick={onClearSession}
              title="Clear session"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* TTS settings drawer */}
      {showTtsSettings && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 shrink-0">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Voice Settings
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 block mb-1">
                Provider
              </label>
              <select
                value={ttsProvider}
                onChange={(e) => {
                  onSetTtsProvider(e.target.value);
                  // Reset accent to first available accent for the provider
                  const accents =
                    TTS_ACCENTS[e.target.value as keyof typeof TTS_ACCENTS];
                  if (accents && accents.length > 0) {
                    onSetTtsAccent(accents[0].value);
                  }
                }}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400 "
              >
                {TTS_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 block mb-1">
                Accent
              </label>
              <select
                value={ttsAccent}
                onChange={(e) => onSetTtsAccent(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400 "
              >
                {(
                  TTS_ACCENTS[ttsProvider as keyof typeof TTS_ACCENTS] || []
                ).map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 block mb-1">
                Speed
              </label>
              <select
                value={ttsSpeed}
                onChange={(e) => onSetTtsSpeed(Number(e.target.value))}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400 "
              >
                {TTS_SPEEDS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Playback Options
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPronounceSentence}
                onChange={(e) => onSetAutoPronounceSentence(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-400 accent-indigo-600"
              />
              <span className="text-xs text-gray-600">
                Auto-pronounce each sentence
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={loopSentence}
                onChange={(e) => onSetLoopSentence(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-400 accent-indigo-600"
              />
              <span className="text-xs text-gray-600">
                Loop sentence (3x, 3s apart)
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Fetch button */}
      <div className="px-4 py-2 shrink-0">
        {!videoId ? (
          <p className="text-xs text-gray-500 text-center py-1">
            Load a video first to fetch its script.
          </p>
        ) : (
          <button
            onClick={onFetchScript}
            disabled={scriptLoading}
            className="w-full py-1.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50"
          >
            {scriptLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : sentences.length > 0 ? (
              <RefreshCw size={13} />
            ) : (
              <FileText size={13} />
            )}
            {scriptLoading
              ? "Fetching…"
              : sentences.length > 0
                ? "Refresh Script"
                : "Get Script"}
          </button>
        )}
      </div>

      {/* Sentence list */}
      <div className="overflow-y-auto flex-1 px-3 pb-2">
        {scriptError && (
          <div className="mx-1 my-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
            {scriptError}
          </div>
        )}
        {!scriptError && sentences.length === 0 && !scriptLoading && (
          <div className="flex flex-col items-center justify-center h-24 text-center text-gray-400 gap-2">
            <FileText size={28} strokeWidth={1} />
            <p className="text-xs">
              {videoId
                ? 'Click "Get Script" to fetch captions.'
                : "Load a video to get started."}
            </p>
          </div>
        )}
        {sentences.length > 0 && (
          <>
            <p className="text-[10px] text-gray-500 px-1 pb-1.5">
              Shift+&#x2190;&#x2192; to navigate
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-4 px-1">
              {sentences.map((_, i) => (
                <SentenceCard
                  key={i}
                  idx={i}
                  active={i === activeSentenceIdx}
                  onClick={onJumpToSentence}
                  setRef={(el) => {
                    sentenceItemRefs.current[i] = el;
                  }}
                />
              ))}
            </div>

            <div className="mx-1 rounded-xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
              {activeSentenceIdx < 0 ? (
                <div className="text-center text-sm text-gray-500">
                  Select a sentence index above to see its content.
                </div>
              ) : (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-600 font-semibold">
                    Sentence {activeSentenceIdx + 1}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-indigo-900">
                    {sentences[activeSentenceIdx].text}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
