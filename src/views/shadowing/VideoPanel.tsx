"use client";

import { useEffect, useRef, useState } from "react";
import YouTube, { type YouTubeEvent } from "react-youtube";
import {
  SkipBack,
  SkipForward,
  Repeat2,
  BookmarkPlus,
  BookmarkX,
  PlayCircle,
} from "lucide-react";
import clsx from "clsx";
import type { YTPlayer } from "./types";
import { fmtTime } from "./utils";

interface VideoPanelProps {
  videoId: string | null;
  playerRef: React.MutableRefObject<YTPlayer | null>;
  onPlayerReady: (event: YouTubeEvent) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
}

export function VideoPanel({
  videoId,
  playerRef,
  onPlayerReady,
  playbackRate,
  onPlaybackRateChange,
}: VideoPanelProps) {
  // ── A-B loop (self-contained) ──
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const loopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loopTimerRef.current) clearInterval(loopTimerRef.current);
    if (loopEnabled && loopA !== null && loopB !== null) {
      loopTimerRef.current = setInterval(() => {
        const t = playerRef.current?.getCurrentTime() ?? 0;
        if (t >= loopB) playerRef.current?.seekTo(loopA, true);
      }, 150);
    }
    return () => {
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
    };
  }, [loopEnabled, loopA, loopB, playerRef]);

  // Reset loop state when video changes
  useEffect(() => {
    setLoopA(null);
    setLoopB(null);
    setLoopEnabled(false);
  }, [videoId]);

  return (
    <div className="space-y-4">
      {/* Video embed */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {videoId ? (
          <div className="aspect-video w-full">
            <YouTube
              videoId={videoId}
              opts={{
                width: "100%",
                height: "100%",
                playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
              }}
              onReady={onPlayerReady}
              className="w-full h-full"
              iframeClassName="w-full h-full"
            />
          </div>
        ) : (
          <div className="aspect-video w-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-3">
            <PlayCircle size={48} strokeWidth={1} />
            <p className="text-sm">Enter a YouTube URL above to start</p>
          </div>
        )}
      </div>

      {/* Controls */}
      {videoId && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-4">
          {/* Playback speed */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Playback Speed
            </p>
            <div className="flex gap-2 flex-wrap">
              {[0.5, 0.75, 1.0, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => {
                    onPlaybackRateChange(rate);
                    playerRef.current?.setPlaybackRate(rate);
                  }}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    playbackRate === rate
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600",
                  )}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Seek */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Seek
              </p>
              <span className="text-[10px] text-gray-400">← → keys</span>
            </div>
            <div className="flex gap-2">
              {([-10, -5, 5, 10] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    const c = playerRef.current?.getCurrentTime() ?? 0;
                    playerRef.current?.seekTo(c + d, true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all"
                >
                  {d < 0 ? <SkipBack size={13} /> : <SkipForward size={13} />}
                  {Math.abs(d)}s
                </button>
              ))}
            </div>
          </div>

          {/* A-B Loop */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                A-B Loop
              </p>
              <span className="text-[10px] text-gray-400">[ ] L keys</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const t = playerRef.current?.getCurrentTime() ?? 0;
                  setLoopA(Math.floor(t * 10) / 10);
                  setLoopEnabled(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-600"
              >
                <BookmarkPlus size={13} />
                {loopA !== null ? (
                  <span>
                    A:{" "}
                    <span className="font-mono">{fmtTime(loopA * 1000)}</span>
                  </span>
                ) : (
                  "Set A"
                )}
              </button>
              <button
                onClick={() => {
                  const t = playerRef.current?.getCurrentTime() ?? 0;
                  setLoopB(Math.floor(t * 10) / 10);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-600"
              >
                <BookmarkPlus size={13} />
                {loopB !== null ? (
                  <span>
                    B:{" "}
                    <span className="font-mono">{fmtTime(loopB * 1000)}</span>
                  </span>
                ) : (
                  "Set B"
                )}
              </button>
              <button
                onClick={() => {
                  if (loopA === null || loopB === null || loopA >= loopB)
                    return;
                  if (!loopEnabled) playerRef.current?.seekTo(loopA, true);
                  setLoopEnabled((v) => !v);
                }}
                disabled={loopA === null || loopB === null || loopA >= loopB}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all",
                  loopEnabled
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                <Repeat2 size={13} />
                {loopEnabled ? "Looping" : "Loop"}
              </button>
              {(loopA !== null || loopB !== null) && (
                <button
                  onClick={() => {
                    setLoopEnabled(false);
                    setLoopA(null);
                    setLoopB(null);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-lg transition-all"
                >
                  <BookmarkX size={13} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
