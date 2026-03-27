"use client";

import {
  FileText,
  Loader2,
  Mic,
  RefreshCw,
  Settings2,
  Star,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import clsx from "clsx";
import type { Sentence } from "./types";
import { TTS_VOICES, TTS_SPEEDS } from "./constants";
import { fmtTime } from "./utils";

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
  ttsVoice: string;
  ttsSpeed: number;
  // Score
  overallScore: number | null;
  hasTurns: boolean;
  // Callbacks
  onFetchScript: () => void;
  onJumpToSentence: (idx: number) => void;
  onHear: (idx: number) => void;
  onShadow: (idx: number) => void;
  onStopRecording: () => void;
  onToggleTtsSettings: () => void;
  onClearSession: () => void;
  onSetTtsVoice: (v: string) => void;
  onSetTtsSpeed: (s: number) => void;
}

export function ScriptPanel({
  videoId,
  sentences,
  activeSentenceIdx,
  sentenceItemRefs,
  scriptLoading,
  scriptError,
  hearingIdx,
  ttsLoading,
  ttsPlaying,
  isRecording,
  recordingForIdx,
  showTtsSettings,
  ttsVoice,
  ttsSpeed,
  overallScore,
  hasTurns,
  onFetchScript,
  onJumpToSentence,
  onHear,
  onShadow,
  onStopRecording,
  onToggleTtsSettings,
  onClearSession,
  onSetTtsVoice,
  onSetTtsSpeed,
}: ScriptPanelProps) {
  return (
    <>
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">Script</span>
          {sentences.length > 0 && (
            <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {sentences.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {overallScore !== null && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 rounded-full">
              <Star
                size={10}
                className="fill-amber-400 text-amber-400 shrink-0"
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
                : "text-gray-400 hover:text-indigo-600 hover:bg-gray-100",
            )}
          >
            <Settings2 size={14} />
          </button>
          {hasTurns && (
            <button
              onClick={onClearSession}
              title="Clear session"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* TTS settings drawer */}
      {showTtsSettings && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 shrink-0">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Voice Settings
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 block mb-1">
                Voice
              </label>
              <select
                value={ttsVoice}
                onChange={(e) => onSetTtsVoice(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-300 bg-white"
              >
                {TTS_VOICES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
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
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-300 bg-white"
              >
                {TTS_SPEEDS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Fetch button */}
      <div className="px-4 py-2 shrink-0">
        {!videoId ? (
          <p className="text-xs text-gray-400 text-center py-1">
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
          <div className="flex flex-col items-center justify-center h-24 text-center text-gray-300 gap-2">
            <FileText size={28} strokeWidth={1} />
            <p className="text-xs">
              {videoId
                ? 'Click "Get Script" to fetch captions.'
                : "Load a video to get started."}
            </p>
          </div>
        )}
        {sentences.length > 0 && (
          <div className="space-y-0.5 py-1">
            <p className="text-[10px] text-gray-400 px-1 pb-1.5">
              Shift+&#x2190;&#x2192; to navigate
            </p>
            {sentences.map((s, i) => {
              // Bug fix: each row has its own playing/loading state
              const isThisHearing = hearingIdx === i && ttsPlaying;
              const isThisLoading = hearingIdx === i && ttsLoading;
              const isThisRecording = isRecording && recordingForIdx === i;

              return (
                <button
                  key={i}
                  ref={(el) => {
                    sentenceItemRefs.current[i] = el;
                  }}
                  onClick={() => onJumpToSentence(i)}
                  className={clsx(
                    "w-full text-left px-3 py-2 rounded-xl border transition-all",
                    i === activeSentenceIdx
                      ? "border-indigo-300 bg-indigo-50 shadow-sm"
                      : "border-transparent hover:border-gray-200 hover:bg-gray-50",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 font-mono text-[10px] text-gray-400 mt-0.5 w-10">
                      {fmtTime(s.startMs)}
                    </span>
                    <p
                      className={clsx(
                        "flex-1 text-xs leading-relaxed",
                        i === activeSentenceIdx
                          ? "text-indigo-900 font-medium"
                          : "text-gray-700",
                      )}
                    >
                      {s.text}
                    </p>
                  </div>

                  {/* Hear + Shadow pills */}
                  <div className="flex gap-1.5 mt-1.5 pl-12">
                    {/* Hear pill — active only for this sentence */}
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onHear(i);
                      }}
                      className={clsx(
                        "flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border cursor-pointer transition-colors",
                        isThisHearing
                          ? "text-red-500 bg-red-50 border-red-100 hover:bg-red-100"
                          : "text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100",
                      )}
                    >
                      {isThisLoading ? (
                        <Loader2 size={9} className="animate-spin" />
                      ) : isThisHearing ? (
                        <VolumeX size={9} />
                      ) : (
                        <Volume2 size={9} />
                      )}
                      {isThisHearing ? "Stop" : "Hear"}
                    </span>

                    {/* Shadow pill */}
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isThisRecording) onStopRecording();
                        else if (!isRecording) onShadow(i);
                      }}
                      className={clsx(
                        "flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border cursor-pointer transition-colors",
                        isThisRecording
                          ? "text-red-600 bg-red-50 border-red-200 hover:bg-red-100"
                          : isRecording
                            ? "text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed"
                            : "text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100",
                      )}
                    >
                      {isThisRecording ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Mic size={9} /> Shadow
                        </>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
