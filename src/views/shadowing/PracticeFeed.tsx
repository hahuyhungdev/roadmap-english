"use client";

import { ArrowLeft, ArrowRight, Mic, Play, Square } from "lucide-react";
import { AudioReplay } from "./AudioReplay";

interface PracticeFeedProps {
  activeSentenceIdx: number;
  activeSentenceText: string | null;
  activeSentenceAudioUrl: string | null;
  isRecording: boolean;
  sonioxError?: string;
  onListenOriginal: () => void;
  onListenAIVoice: () => void;
  onToggleRecording: () => void;
  onPrevSentence: () => void;
  onNextSentence: () => void;
}

export function PracticeFeed({
  activeSentenceIdx,
  activeSentenceText,
  activeSentenceAudioUrl,
  isRecording,
  sonioxError,
  onListenOriginal,
  onListenAIVoice,
  onToggleRecording,
  onPrevSentence,
  onNextSentence,
}: PracticeFeedProps) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <Mic size={11} className={isRecording ? "text-red-500" : ""} />
          Practice
        </span>
        {sonioxError && (
          <span className="text-[10px] text-red-500 truncate max-w-[200px]">
            {sonioxError}
          </span>
        )}
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 overflow-auto">
        {activeSentenceIdx < 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 gap-2">
            <p className="text-sm font-semibold">Choose a sentence above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Navigation */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPrevSentence}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg  hover:bg-gray-100 transition-all"
              >
                <ArrowLeft size={12} /> Previous
              </button>
              <button
                type="button"
                onClick={onNextSentence}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg  hover:bg-gray-100 transition-all"
              >
                Next <ArrowRight size={12} />
              </button>
            </div>

            {/* Main Record/Replay flow */}
            {isRecording ? (
              <button
                type="button"
                onClick={onToggleRecording}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all"
              >
                <Square size={16} className="fill-current" />
                Stop recording
              </button>
            ) : activeSentenceAudioUrl ? (
              <div className="flex items-center gap-2">
                <AudioReplay url={activeSentenceAudioUrl} />

                <button
                  type="button"
                  onClick={onToggleRecording}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold border border-indigo-200 bg-indigo-100 text-indigo-900 hover:bg-indigo-200 transition-all"
                >
                  <Square size={12} />
                  Record again
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onToggleRecording}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border border-indigo-200 bg-indigo-100 text-indigo-900 hover:bg-indigo-200 transition-all"
              >
                <Square size={16} />
                Start recording
              </button>
            )}

            {/* Listen options - compact */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onListenOriginal}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-all"
              >
                <Play size={12} /> YouTube
              </button>
              <button
                type="button"
                onClick={onListenAIVoice}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-all"
              >
                <Play size={12} /> AI voice
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
