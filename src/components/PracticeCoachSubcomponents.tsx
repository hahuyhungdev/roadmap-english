"use client";

import { type FC, type ReactNode } from "react";
import { Mic, RotateCcw, Volume2, Play, Square } from "lucide-react";
import type { Turn } from "../hooks/useCoachSession";

// ============ STATUS BAR COMPONENT ============
export const StatusBar: FC<{
  isRecording: boolean;
  isPlaying: boolean;
  canSend: boolean;
  draftText: string;
  onStart: () => void;
  onStop: () => void;
  onSend: () => void;
}> = ({ isRecording, isPlaying, canSend, draftText, onStart, onStop, onSend }) => {
  return (
    <div className="px-3 py-2 border-t border-gray-100 shrink-0 space-y-2">
      {draftText ? (
        <div className="text-xs text-gray-500 text-right italic truncate">
          Draft: {draftText}
        </div>
      ) : null}
      {isRecording ? (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-500 text-center">
            🎤 Listening...
            {isPlaying && " • 🔊 Playing..."}
          </div>
          <button
            onClick={onStop}
            className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Square size={12} />
            Stop
          </button>
        </div>
      ) : canSend ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={onSend}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play size={14} />
            Send Transcript
          </button>
          <button
            onClick={onStart}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play size={14} />
            Record Again
          </button>
        </div>
      ) : (
        <button
          onClick={onStart}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Play size={14} />
          Start Practice
        </button>
      )}
    </div>
  );
};

// ============ CONTROL BUTTONS COMPONENT ============
export const ControlButtons: FC<{
  onClear: () => void;
  onCollapse: () => void;
}> = ({ onClear, onCollapse }) => {
  return (
    <div className="flex items-center gap-0.5 shrink-0 ml-2">
      <button
        onClick={onClear}
        title="Clear conversation"
        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <RotateCcw size={13} />
      </button>
      <button
        onClick={onCollapse}
        title="Close"
        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span className="text-lg">✕</span>
      </button>
    </div>
  );
};

// ============ HEADER COMPONENT ============
export const PracticeCoachHeader: FC<{
  lessonTitle?: string;
  isRecording: boolean;
  isPlaying: boolean;
  onClear: () => void;
  onCollapse: () => void;
}> = ({ lessonTitle, isRecording, isPlaying, onClear, onCollapse }) => {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-linear-to-r from-indigo-50 to-blue-50 rounded-t-xl shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1">
          <Mic size={14} className="text-indigo-600 shrink-0" />
          {isRecording && (
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
        <span className="text-sm font-semibold text-gray-800">
          Practice Coach
        </span>
        {lessonTitle && (
          <span className="text-xs text-indigo-400 truncate">
            · {lessonTitle}
          </span>
        )}
        {isPlaying && (
          <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium shrink-0">
            <Volume2 size={11} className="animate-pulse" />
          </span>
        )}
      </div>
      <ControlButtons onClear={onClear} onCollapse={onCollapse} />
    </div>
  );
};

// ============ CONVERSATION AREA COMPONENT ============
export const ConversationArea: FC<{
  turns: Turn[];
  transcript: string;
  partial: string;
  loading: boolean;
  isRecording: boolean;
  lessonTitle?: string;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}> = ({ turns, transcript, partial, loading, isRecording, lessonTitle, bottomRef }) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
      {turns.length === 0 && !partial && !loading && (
        <p className="text-xs text-gray-400 text-center py-12 leading-relaxed">
          {isRecording ? (
            <>
              🎤 Listening...
              <br />
              Speak naturally in English
              {lessonTitle && (
                <>
                  <br />
                  <span className="text-indigo-400">Topic: {lessonTitle}</span>
                </>
              )}
            </>
          ) : (
            <>
              👋 Welcome to Practice Coach!
              <br />
              Click "Start Practice" below to begin
              {lessonTitle && (
                <>
                  <br />
                  <span className="text-indigo-400">Topic: {lessonTitle}</span>
                </>
              )}
            </>
          )}
        </p>
      )}

      {turns.map((turn) => (
        <div
          key={turn.id}
          className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {turn.role === "user" ? (
            <div className="max-w-[82%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-3 py-2">
              <p className="text-xs leading-relaxed">{turn.text}</p>
            </div>
          ) : (
            <div className="max-w-[90%] space-y-1.5">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2">
                <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {turn.text || (turn.text === "" ? "..." : "")}
                </p>
              </div>
              {turn.review && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 space-y-2">
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
                    <div className="flex flex-wrap gap-1">
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


      {/* Typing indicator */}
      {loading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
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

// ============ ERROR BAR COMPONENT ============
export const ErrorBar: FC<{ error?: string }> = ({ error }) => {
  if (!error) return null;
  return (
    <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100 shrink-0">
      {error}
    </div>
  );
};

// ============ EXPANDED PANEL COMPONENT ============
export const ExpandedPanel: FC<{
  children: ReactNode;
}> = ({ children }) => {
  return (
    <div
      className="fixed top-12 right-4 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-40 flex flex-col"
      style={{ maxHeight: "calc(100vh - 2rem)" }}
    >
      {children}
    </div>
  );
};

// ============ COLLAPSED FAB COMPONENT ============
export const CollapsedFAB: FC<{ onExpand: () => void }> = ({ onExpand }) => {
  return (
    <div className="fixed top-12 right-4 z-50">
      <button
        onClick={onExpand}
        className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        title="Open Practice Coach"
      >
        <Mic size={20} />
      </button>
    </div>
  );
};
