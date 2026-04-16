"use client";

import { type FC, type ReactNode } from "react";
import {
  Mic,
  Square,
  Send,
  RotateCcw,
  Volume2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import type { Turn } from "../../types/coach";
import { formatTime } from "../../utils/time";

// ============ STATUS BAR ============
export const StatusBar: FC<{
  isRecording: boolean;
  isPlaying: boolean;
  loading: boolean;
  canSend: boolean;
  recordingSeconds: number;
  onStart: () => void;
  onStop: () => void;
  onSend: () => void;
}> = ({
  isRecording,
  isPlaying,
  loading,
  canSend,
  recordingSeconds,
  onStart,
  onStop,
  onSend,
}) => {
  const busy = loading || isPlaying;

  return (
    <div className="px-4 py-3 border-t border-gray-100 shrink-0">
      {/* Status line — fixed height to avoid layout shift */}
      <div className="h-5 flex items-center justify-center gap-2 text-xs text-gray-500 mb-2">
        {busy ? (
          loading ? (
            <>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
              <span>Coach is thinking…</span>
            </>
          ) : (
            <>
              <Volume2 size={14} className="text-emerald-500 animate-pulse" />
              <span>Coach is speaking…</span>
            </>
          )
        ) : isRecording ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="font-mono text-gray-600">
              {formatTime(recordingSeconds)}
            </span>
            <span className="text-gray-400">Listening…</span>
          </>
        ) : null}
      </div>

      {/* Action buttons — fixed height row */}
      <div className="flex gap-2 h-11">
        {busy ? (
          <div className="flex-1" />
        ) : isRecording ? (
          <>
            <button
              onClick={onStop}
              className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Square size={12} />
              Stop
            </button>
            {canSend ? (
              <button
                onClick={onSend}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Send size={14} />
                Send
              </button>
            ) : (
              <div className="flex-1 py-2.5 text-gray-400 text-sm text-center rounded-xl border border-dashed border-gray-200 flex items-center justify-center">
                Speak to send…
              </div>
            )}
          </>
        ) : canSend ? (
          <>
            <button
              onClick={onStart}
              className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Mic size={14} />
            </button>
            <button
              onClick={onSend}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Send size={14} />
              Send
            </button>
          </>
        ) : (
          <button
            onClick={onStart}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Mic size={16} />
            Start Speaking
          </button>
        )}
      </div>
    </div>
  );
};

// ============ HEADER ============
export const PracticeCoachHeader: FC<{
  lessonTitle?: string;
  isRecording: boolean;
  isPlaying: boolean;
  autoContinue: boolean;
  onToggleAutoContinue: () => void;
  onClear: () => void;
  onCollapse: () => void;
}> = ({
  lessonTitle,
  isRecording,
  isPlaying,
  autoContinue,
  onToggleAutoContinue,
  onClear,
  onCollapse,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative w-8 h-8 shrink-0">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <Mic size={14} className="text-indigo-600" />
          </div>
          {isRecording && (
            <span className="absolute inset-0 bg-red-400/20 rounded-full animate-ping" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">
              Practice Coach
            </h3>
            {isPlaying && (
              <Volume2
                size={12}
                className="text-emerald-500 animate-pulse shrink-0"
              />
            )}
          </div>
          {lessonTitle && (
            <p className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">
              {lessonTitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0 ml-2">
        <button
          onClick={onToggleAutoContinue}
          title={
            autoContinue
              ? "Auto-continue ON — mic restarts after coach responds"
              : "Auto-continue OFF — mic stops after each turn"
          }
          className={`p-1.5 rounded-lg transition-colors ${
            autoContinue
              ? "text-indigo-600 bg-indigo-50"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <RefreshCw size={13} />
        </button>
        <button
          onClick={onClear}
          title="Clear conversation"
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={onCollapse}
          title="Minimize"
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
        >
          <ChevronDown size={15} />
        </button>
      </div>
    </div>
  );
};

// ============ CONVERSATION AREA ============
export const ConversationArea: FC<{
  turns: Turn[];
  transcript: string;
  partial: string;
  loading: boolean;
  isRecording: boolean;
  lessonTitle?: string;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}> = ({
  turns,
  transcript,
  partial,
  loading,
  isRecording,
  lessonTitle,
  bottomRef,
}) => {
  const liveText = (transcript || partial).trim();

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
      {/* Empty state */}
      {turns.length === 0 && !liveText && !loading && (
        <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-8">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <Mic size={20} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isRecording ? "Listening…" : "Ready to practice"}
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-[220px] leading-relaxed">
              {isRecording
                ? "Speak naturally in English — your coach will give instant feedback"
                : 'Tap "Start Speaking" to begin your practice session'}
            </p>
          </div>
          {lessonTitle && (
            <span className="text-[11px] px-3 py-1 bg-indigo-50 text-indigo-500 rounded-full">
              {lessonTitle}
            </span>
          )}
          {!isRecording && (
            <div className="mt-2">
              <p className="text-[10px] text-gray-400 mb-1.5">
                Try talking about:
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {[
                  "Explain the main concept",
                  "Give a real-world example",
                  "Summarize what you learned",
                ].map((hint) => (
                  <span
                    key={hint}
                    className="text-[10px] px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full border border-gray-100"
                  >
                    {hint}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conversation turns */}
      {turns.map((turn) => (
        <div
          key={turn.id}
          className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {turn.role === "user" ? (
            <div className="max-w-[82%] bg-indigo-600 text-white rounded-2xl rounded-br-md px-3.5 py-2.5">
              <p className="text-[13px] leading-relaxed">{turn.text}</p>
            </div>
          ) : (
            <div className="max-w-[90%] space-y-1.5">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-sm">
                <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {turn.text || "…"}
                </p>
              </div>
              {turn.review && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-3 py-2.5 space-y-2">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                    Feedback
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 line-through leading-relaxed">
                      {turn.review.original_transcript}
                    </p>
                    <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                      ✓ {turn.review.corrected_version}
                    </p>
                  </div>
                  {turn.review.explanation && (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {turn.review.explanation}
                    </p>
                  )}
                  {turn.review.better_alternatives?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {turn.review.better_alternatives.map(
                        (alt: string, i: number) => (
                          <span
                            key={i}
                            className="text-[11px] bg-white border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full"
                          >
                            {alt}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Live transcript while recording */}
      {isRecording && liveText && (
        <div className="flex justify-end">
          <div className="max-w-[82%] bg-indigo-100 text-indigo-800 rounded-2xl rounded-br-md px-3.5 py-2.5 border border-indigo-200/60">
            <p className="text-[13px] leading-relaxed italic">
              {liveText}
              <span className="inline-block w-0.5 h-3.5 bg-indigo-400 animate-pulse ml-0.5 align-text-bottom rounded-full" />
            </p>
          </div>
        </div>
      )}

      {/* Typing indicator */}
      {loading && (
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

// ============ ERROR BAR ============
export const ErrorBar: FC<{ error?: string }> = ({ error }) => {
  if (!error) return null;
  return (
    <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100 shrink-0">
      {error}
    </div>
  );
};

// ============ EXPANDED PANEL ============
export const ExpandedPanel: FC<{
  children: ReactNode;
}> = ({ children }) => {
  return (
    <div
      className="bg-gray-50 fixed top-12 right-4 w-[400px] border border-gray-200 rounded-2xl shadow-2xl shadow-gray-300/40 z-40 flex flex-col overflow-hidden"
      style={{ maxHeight: "calc(100vh - 4rem)" }}
    >
      {children}
    </div>
  );
};

// ============ COLLAPSED FAB ============
export const CollapsedFAB: FC<{
  onExpand: () => void;
  turnCount: number;
}> = ({ onExpand, turnCount }) => {
  return (
    <div className="fixed top-12 right-4 z-50">
      <button
        onClick={onExpand}
        className="relative p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
        title="Open Practice Coach"
      >
        <Mic size={20} />
        {turnCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
            {turnCount > 9 ? "9+" : turnCount}
          </span>
        )}
      </button>
    </div>
  );
};
