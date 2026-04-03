"use client";

import {
  BarChart3,
  Clock3,
  Gauge,
  FileText,
  Loader2,
  Mic,
  Square,
} from "lucide-react";
import clsx from "clsx";
import { useState } from "react";
import { useYouTubeShadowing } from "./useYouTubeShadowing";
import { VideoPanel } from "../shared/VideoPanel";
import { AudioReplay } from "../shared/AudioReplay";
import type { Sentence } from "../shared/types";
import { fmtTime } from "../shared/utils";
import {
  buildSentencesFromTranscriptChunks,
  type SentencePacePreset,
} from "./transcriptTimeline";

interface Props {
  sessionId?: number;
  initialVideoId?: string;
  initialSentences?: Sentence[];
  initialActiveSentenceIdx?: number;
  onSentencesChange?: (sentences: Sentence[]) => void;
  onActiveSentenceChange?: (idx: number) => void;
  onVideoChange?: (videoId: string) => void;
  onScriptTextChange?: (scriptText: string) => void;
}

export default function YouTubeShadowingClient(props: Props) {
  const s = useYouTubeShadowing({
    sessionId: props.sessionId,
    initialVideoId: props.initialVideoId,
    initialSentences: props.initialSentences,
    initialActiveSentenceIdx: props.initialActiveSentenceIdx,
    onSentencesChange: props.onSentencesChange,
    onActiveSentenceChange: props.onActiveSentenceChange,
    onVideoChange: props.onVideoChange,
    onScriptTextChange: props.onScriptTextChange,
  });
  const [retimePace, setRetimePace] = useState<SentencePacePreset>("balanced");
  const [retiming, setRetiming] = useState(false);
  const busy = s.improvingTranscript;
  const progressPct =
    s.sentences.length > 0 && s.activeSentenceIdx >= 0
      ? Math.round(((s.activeSentenceIdx + 1) / s.sentences.length) * 100)
      : 0;

  function handleRetiming() {
    if (!s.sentences.length || retiming) return;
    setRetiming(true);
    try {
      const chunks = s.sentences.map((sentence) => ({
        text: sentence.text,
        start: sentence.startMs / 1000,
        duration: Math.max(0.1, (sentence.endMs - sentence.startMs) / 1000),
      }));
      const retimed = buildSentencesFromTranscriptChunks(chunks, {
        pace: retimePace,
      });
      if (retimed.length > 0) {
        s.replaceSentences(retimed);
      }
    } finally {
      setRetiming(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">YouTube Shadowing</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Shadow native speakers sentence by sentence.
          </p>
        </div>
        <span className="text-[11px] text-gray-400">
          Shift+←/→ • ↓ pause • Space play/pause
        </span>
      </div>

      {/* Progress */}
      {s.sentences.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="inline-flex items-center gap-1 text-gray-500">
              <BarChart3 size={13} /> Session Progress
            </span>
            <span className="font-semibold text-indigo-600">
              {s.activeSentenceIdx + 1 > 0 ? s.activeSentenceIdx + 1 : 0}/
              {s.sentences.length} ({progressPct}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
        {/* Left: preview + sentence list */}
        <div className="lg:col-span-7 space-y-4">
          <VideoPanel
            videoId={s.videoId}
            playerRef={s.playerRef}
            onPlayerReady={s.handlePlayerReady}
          />

          <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-indigo-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Sentence List
                </span>
                {s.sentences.length > 0 && (
                  <span className="text-[11px] text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
                    {s.sentences.length}
                  </span>
                )}
              </div>
              {s.sentences.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={retimePace}
                    onChange={(e) =>
                      setRetimePace(e.target.value as SentencePacePreset)
                    }
                    className="h-7 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-600 outline-none"
                    title="Sentence pace"
                  >
                    <option value="short">Short</option>
                    <option value="balanced">Balanced</option>
                    <option value="long">Long</option>
                  </select>
                  <button
                    onClick={handleRetiming}
                    disabled={busy || retiming}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 border border-indigo-200 rounded-lg bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 transition-colors"
                    title="Rebuild sentence timing"
                  >
                    {retiming ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Gauge size={11} />
                    )}
                    Re-timing
                  </button>
                </div>
              )}
            </div>

            {s.sentences.length === 0 ? (
              <div className="flex items-center justify-center h-24 px-4 text-xs text-gray-400 text-center">
                Transcript is being prepared when creating the session.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto px-3 py-3 space-y-2">
                {s.sentences.map((sentence, i) => (
                  <button
                    key={i}
                    ref={(el) => {
                      s.sentenceRefs.current[i] = el;
                    }}
                    onClick={() => s.goToSentence(i)}
                    disabled={busy}
                    className={clsx(
                      "w-full text-left rounded-xl border px-3 py-2.5 transition-all",
                      i === s.activeSentenceIdx
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-gray-500">
                        #{i + 1}
                      </div>
                      <div className="text-[11px] text-gray-400 inline-flex items-center gap-1">
                        <Clock3 size={11} />
                        {fmtTime(sentence.startMs)}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-800 leading-relaxed">
                      {sentence.text}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: current sentence + actions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 shadow-sm p-4 space-y-3 min-h-60">
            {s.activeSentenceIdx >= 0 &&
            s.activeSentenceIdx < s.sentences.length ? (
              <>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">
                    Current Sentence {s.activeSentenceIdx + 1}
                  </p>
                  <p className="mt-1.5 text-lg leading-relaxed text-indigo-900 font-medium">
                    {s.sentences[s.activeSentenceIdx]?.text}
                  </p>
                </div>

                <button
                  onClick={s.onToggleRecording}
                  className={clsx(
                    "w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl border transition-all",
                    s.isRecording
                      ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                  )}
                >
                  {s.isRecording ? (
                    <>
                      <Square size={13} /> Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic size={13} /> Record My Voice
                    </>
                  )}
                </button>

                {s.lastAudioUrl && <AudioReplay url={s.lastAudioUrl} />}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-center px-3">
                <p className="text-sm text-indigo-500">
                  Pick a sentence from the left panel to focus your shadowing
                  practice.
                </p>
              </div>
            )}
          </div>

          {s.scriptError && (
            <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
              {s.scriptError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
