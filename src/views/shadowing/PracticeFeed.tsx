"use client";

import { useRef, useEffect } from "react";
import { Loader2, Mic, Square, Star } from "lucide-react";
import clsx from "clsx";
import type { ShadowTurn } from "./types";
import { AudioReplay } from "./AudioReplay";
import { ReviewCard } from "./ReviewCard";

interface PracticeFeedProps {
  turns: ShadowTurn[];
  isRecording: boolean;
  transcript: string;
  partial: string;
  coachLoading: boolean;
  sonioxError: string | undefined;
  onToggleRecording: () => void;
}

export function PracticeFeed({
  turns,
  isRecording,
  transcript,
  partial,
  coachLoading,
  sonioxError,
  onToggleRecording,
}: PracticeFeedProps) {
  const turnsBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to newest turn
  useEffect(() => {
    setTimeout(
      () => turnsBottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }, [turns]);

  return (
    <>
      {/* Feed header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <Mic size={11} className={isRecording ? "text-red-500" : ""} />
          Practice
          {isRecording && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          )}
        </span>
        {sonioxError && (
          <span className="text-[10px] text-red-500 truncate max-w-[200px]">
            {sonioxError}
          </span>
        )}
      </div>

      {/* Turns list */}
      <div className="overflow-y-auto flex-1 px-4 py-2 space-y-3">
        {turns.length === 0 && !isRecording && (
          <div className="flex flex-col items-center justify-center h-16 text-center text-gray-300 gap-1.5">
            <Mic size={22} strokeWidth={1} />
            <p className="text-xs">
              Click &quot;Shadow&quot; on a sentence to start
            </p>
          </div>
        )}

        {turns.map((turn) => (
          <div key={turn.id} className="space-y-1">
            {/* User bubble + score badge + audio replay */}
            <div className="flex items-start justify-end gap-2">
              {turn.audioUrl && <AudioReplay url={turn.audioUrl} />}
              <div className="flex flex-col items-end gap-1 max-w-[82%]">
                <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-xs leading-relaxed">
                  {turn.text}
                </div>
                {turn.review?.score !== undefined && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 rounded-full shrink-0">
                    <Star size={9} className="fill-amber-400 text-amber-400" />
                    {turn.review.score}/10
                  </span>
                )}
              </div>
            </div>

            {/* AI feedback */}
            {turn.feedback === null && coachLoading ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 pl-1">
                <Loader2 size={11} className="animate-spin" /> Thinking…
              </div>
            ) : turn.feedback ? (
              <div className="max-w-[92%]">
                <div className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 leading-relaxed whitespace-pre-wrap">
                  {turn.feedback}
                </div>
                {turn.review && <ReviewCard review={turn.review} />}
              </div>
            ) : null}
          </div>
        ))}

        {/* Live transcript preview while recording */}
        {isRecording && (transcript || partial) && (
          <div className="flex justify-end">
            <div className="max-w-[82%] bg-indigo-100 text-indigo-700 rounded-2xl rounded-tr-sm px-3 py-2 text-xs italic opacity-70">
              {transcript ? `${transcript}${partial ? ` ${partial}` : ""}` : partial}
              {partial && "…"}
            </div>
          </div>
        )}
        <div ref={turnsBottomRef} />
      </div>

      {/* Record toggle button */}
      <div className="px-4 py-3 border-t border-gray-100 shrink-0">
        <button
          onClick={onToggleRecording}
          className={clsx(
            "w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
            isRecording
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white",
          )}
        >
          {isRecording ? (
            <>
              <Square size={13} className="fill-white" /> Stop Recording
            </>
          ) : (
            <>
              <Mic size={13} /> Record (R)
            </>
          )}
        </button>
        {isRecording && (
          <p className="text-center text-[11px] text-gray-400 mt-1.5">
            Recording continues until you stop it.
          </p>
        )}
      </div>
    </>
  );
}
