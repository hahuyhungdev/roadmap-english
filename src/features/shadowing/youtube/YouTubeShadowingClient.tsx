"use client";

import {
  BarChart3,
  Clock3,
  Gauge,
  Languages,
  FileText,
  Loader2,
  Mic,
  Square,
  Settings2,
} from "lucide-react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
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

function extractVietnameseMap(sentences: Sentence[]): Record<number, string> {
  const result: Record<number, string> = {};
  sentences.forEach((sentence, idx) => {
    const viText = sentence.viText?.trim();
    if (viText) result[idx] = viText;
  });
  return result;
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
  const [showSettings, setShowSettings] = useState(false);
  const [translatingVi, setTranslatingVi] = useState(false);
  const [showVietnamese, setShowVietnamese] = useState(false);
  const [viByIdx, setViByIdx] = useState<Record<number, string>>(() =>
    extractVietnameseMap(props.initialSentences ?? []),
  );
  const [translateError, setTranslateError] = useState("");
  const busy = s.improvingTranscript;
  const translatedCount = Object.keys(viByIdx).length;
  const hasFullTranslation =
    s.sentences.length > 0 && translatedCount >= s.sentences.length;
  const progressPct =
    s.sentences.length > 0 && s.activeSentenceIdx >= 0
      ? Math.round(((s.activeSentenceIdx + 1) / s.sentences.length) * 100)
      : 0;

  useEffect(() => {
    const persistedMap = extractVietnameseMap(s.sentences);
    if (!Object.keys(persistedMap).length) return;
    setViByIdx((prev) => ({ ...persistedMap, ...prev }));
  }, [s.sentences]);

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

  async function handleTranslateToVietnamese() {
    if (!s.sentences.length || translatingVi) return;
    setTranslatingVi(true);
    setTranslateError("");
    try {
      const MAX_SENTENCES_PER_BATCH = 80;
      const MAX_CHARS_PER_BATCH = 7000;

      const batches: { startIdx: number; items: string[] }[] = [];
      let current: string[] = [];
      let currentChars = 0;
      let batchStart = 0;

      s.sentences.forEach((sentence, idx) => {
        const text = sentence.text;
        const nextChars = currentChars + text.length;
        const shouldSplit =
          current.length >= MAX_SENTENCES_PER_BATCH ||
          (current.length > 0 && nextChars > MAX_CHARS_PER_BATCH);

        if (shouldSplit) {
          batches.push({ startIdx: batchStart, items: current });
          current = [text];
          currentChars = text.length;
          batchStart = idx;
          return;
        }

        if (current.length === 0) batchStart = idx;
        current.push(text);
        currentChars = nextChars;
      });

      if (current.length > 0) {
        batches.push({ startIdx: batchStart, items: current });
      }

      const next: Record<number, string> = {};

      for (const batch of batches) {
        const res = await fetch("/api/shadowing/youtube/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sentences: batch.items,
            targetLanguage: "vi",
          }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(json?.translatedSentences)) {
          throw new Error(json?.error ?? "Translation failed");
        }

        for (const item of json.translatedSentences as Array<any>) {
          const localIdx = Number(item?.index);
          const globalIdx = batch.startIdx + localIdx;
          const vi = String(item?.vi ?? "").trim();
          if (Number.isFinite(globalIdx) && vi) next[globalIdx] = vi;
        }
      }

      const merged = { ...viByIdx, ...next };
      setViByIdx(merged);
      s.applyVietnameseTranslations(merged);
      setShowVietnamese(true);
    } catch (e: any) {
      setTranslateError(String(e?.message ?? e));
    } finally {
      setTranslatingVi(false);
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

      {/* Main resizable split */}
      <PanelGroup orientation="horizontal" className="gap-0">
        {/* Left: preview + sentence list */}
        <Panel defaultSize="58%" minSize="25%">
          <div className="pr-2 space-y-4">
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
                  {!hasFullTranslation && (
                    <button
                      onClick={handleTranslateToVietnamese}
                      disabled={translatingVi || !s.sentences.length}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 rounded-lg bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                      title="Translate EN transcript to Vietnamese"
                    >
                      {translatingVi ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Languages size={11} />
                      )}
                      Translate VI
                    </button>
                  )}
                  {!!Object.keys(viByIdx).length && (
                    <button
                      onClick={() => setShowVietnamese((v) => !v)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                      title="Toggle Vietnamese line"
                    >
                      {showVietnamese ? "Hide VI" : "Show VI"}
                    </button>
                  )}
                  <button
                    onClick={() => setShowSettings((v) => !v)}
                    className={clsx(
                      "p-1.5 rounded-lg border transition-colors",
                      showSettings
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                        : "bg-white border-gray-200 text-gray-500 hover:text-gray-700",
                    )}
                    title="Playback settings"
                  >
                    <Settings2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Settings panel */}
            {showSettings && s.sentences.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-indigo-50/60 border-b border-indigo-100 text-xs">
                {/* Speed */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Speed</span>
                  <div className="flex gap-1">
                    {[0.5, 0.75, 1, 1.25, 1.5].map((sp) => (
                      <button
                        key={sp}
                        onClick={() => s.setPlaybackSpeed(sp)}
                        className={clsx(
                          "px-2 py-0.5 rounded-md font-semibold transition-colors",
                          s.playbackSpeed === sp
                            ? "bg-indigo-600 text-white"
                            : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300",
                        )}
                      >
                        {sp}x
                      </button>
                    ))}
                  </div>
                </div>
                {/* Pause each sentence */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => s.setPauseEachSentence(!s.pauseEachSentence)}
                    className={clsx(
                      "relative w-8 h-4 rounded-full transition-colors",
                      s.pauseEachSentence ? "bg-indigo-600" : "bg-gray-300",
                    )}
                  >
                    <span
                      className={clsx(
                        "absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all",
                        s.pauseEachSentence ? "left-4" : "left-0.5",
                      )}
                    />
                  </div>
                  <span className="text-gray-600 font-medium">
                    Pause after each sentence
                  </span>
                </label>
              </div>
            )}

            {s.sentences.length === 0 ? (
              <div className="flex items-center justify-center h-24 px-4 text-xs text-gray-400 text-center">
                Transcript is being prepared when creating the session.
              </div>
            ) : (
              <div ref={s.sentenceListRef} className="max-h-80 overflow-y-auto px-3 py-3 space-y-2">
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
                    {showVietnamese && viByIdx[i] && (
                      <p className="mt-1 text-[12px] text-emerald-700 leading-relaxed">
                        {viByIdx[i]}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {translateError && (
            <div className="mx-3 mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
              {translateError}
            </div>
          )}
          </div>
        </Panel>

        {/* Drag handle */}
        <PanelResizeHandle className="group w-2 flex items-center justify-center cursor-col-resize">
          <div className="w-0.5 h-16 rounded-full bg-gray-200 group-hover:bg-indigo-400 group-active:bg-indigo-500 transition-colors" />
        </PanelResizeHandle>

        {/* Right: current sentence + actions */}
        <Panel defaultSize="42%" minSize="20%">
          <div className="pl-2 space-y-4">
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
                  {showVietnamese && viByIdx[s.activeSentenceIdx] && (
                    <p className="mt-2 text-sm leading-relaxed text-emerald-700">
                      {viByIdx[s.activeSentenceIdx]}
                    </p>
                  )}
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
        </Panel>
      </PanelGroup>
    </div>
  );
}
