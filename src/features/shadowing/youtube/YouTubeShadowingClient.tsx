"use client";

import {
  FileText,
  Keyboard,
  Loader2,
  Mic,
  ArrowLeft,
  ArrowRight,
  Play,
  RefreshCw,
  Square,
  Star,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import { useState } from "react";
import YouTube, { type YouTubeEvent } from "react-youtube";
import { useYouTubeShadowing } from "./useYouTubeShadowing";
import { TTSSettingsPanel } from "../shared/TTSSettingsPanel";
import { VideoPanel } from "@/views/shadowing/VideoPanel";
import { AudioReplay } from "@/views/shadowing/AudioReplay";

export default function YouTubeShadowingClient() {
  const s = useYouTubeShadowing();
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            YouTube Shadowing
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Shadow native speakers from YouTube videos sentence by sentence.
          </p>
        </div>
        <span className="text-xs text-gray-500 mt-2">
          Shift+←/→ • Space to play/pause • R to record
        </span>
      </div>

      {/* URL form */}
      <form onSubmit={s.handleLoadVideo} className="flex gap-2 items-start">
        <div className="flex-1">
          <input
            value={s.urlInput}
            onChange={(e) => s.setUrlInput(e.target.value)}
            placeholder="Paste a YouTube URL…"
            className={clsx(
              "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors",
              s.urlError
                ? "border-red-400 bg-red-50 focus:border-red-500"
                : "border-gray-200  focus:border-indigo-400",
            )}
          />
          {s.urlError && (
            <p className="text-xs text-red-500 mt-1 pl-1">{s.urlError}</p>
          )}
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          Load
        </button>
      </form>

      {/* Main grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
        {/* Left: Video */}
        <div className="lg:col-span-3">
          <VideoPanel
            videoId={s.videoId}
            playerRef={s.playerRef}
            onPlayerReady={s.handlePlayerReady}
          />
        </div>

        {/* Right: Script + Practice */}
        <div
          className="flex flex-col  border border-gray-200 rounded-2xl shadow-sm overflow-hidden lg:col-span-2"
          style={{ minHeight: "600px" }}
        >
          {/* ── Script section ── */}
          <div
            className="flex flex-col border-b border-gray-100"
            style={{ flex: "3 1 0", minHeight: 0, overflow: "hidden" }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0 relative">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-indigo-500" />
                <span className="text-sm font-semibold text-gray-800">
                  Script
                </span>
                {s.sentences.length > 0 && (
                  <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {s.sentences.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {s.overallScore !== null && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 rounded-full">
                    <Star
                      size={10}
                      className="fill-amber-500 text-amber-500 shrink-0"
                    />
                    {s.overallScore}/10
                  </span>
                )}
                <TTSSettingsPanel
                  provider={s.tts.provider}
                  accent={s.tts.accent}
                  speed={s.tts.speed}
                  onProviderChange={s.tts.setProvider}
                  onAccentChange={s.tts.setAccent}
                  onSpeedChange={s.tts.setSpeed}
                />
                {s.turns.length > 0 && (
                  <button
                    onClick={s.onClearSession}
                    title="Clear session"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Fetch / sentence list */}
            <div className="px-4 py-2 shrink-0">
              <button
                onClick={() => {
                  const base = "https://tactiq.io/tools/run/youtube_transcript";
                  const ytUrl = s.videoId
                    ? `https://youtu.be/${s.videoId}`
                    : undefined;
                  const target = ytUrl
                    ? `${base}?yt=${encodeURIComponent(ytUrl)}`
                    : "https://tactiq.io/tools/youtube-transcript";
                  window.open(target, "_blank", "noopener,noreferrer");
                }}
                disabled={s.scriptLoading || s.importingTranscript}
                className="w-full py-1.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-40"
              >
                {s.scriptLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : s.sentences.length > 0 ? (
                  <RefreshCw size={13} />
                ) : (
                  <FileText size={13} />
                )}
                {s.scriptLoading
                  ? "Fetching…"
                  : s.sentences.length > 0
                    ? "Refresh Script"
                    : "Get Script"}
              </button>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => setShowPaste((v) => !v)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  {showPaste ? "Hide paste" : "Paste transcript"}
                </button>
              </div>
              {showPaste && (
                <div className="mt-2">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste tactiq.io transcript here..."
                    className="w-full h-28 p-2 text-sm border border-gray-200 rounded-lg"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        s.handleImportTranscript(pasteText, { useAI: false });
                        setPasteText("");
                        setShowPaste(false);
                      }}
                      disabled={s.importingTranscript}
                      className="py-1 px-3 bg-gray-100 text-sm rounded-lg"
                    >
                      Import (local)
                    </button>
                    <button
                      onClick={() => {
                        s.handleImportTranscript(pasteText, { useAI: true });
                        setPasteText("");
                        setShowPaste(false);
                      }}
                      disabled={s.importingTranscript}
                      className="py-1 px-3 bg-indigo-600 text-white rounded-lg text-sm"
                    >
                      {s.importingTranscript ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 size={12} className="animate-spin" />
                          Importing…
                        </span>
                      ) : (
                        "Import with AI"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setPasteText("");
                        setShowPaste(false);
                      }}
                      className="py-1 px-3 bg-gray-100 text-sm rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-y-auto flex-1 px-3 pb-2">
              {s.scriptError && (
                <div className="mx-1 my-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                  {s.scriptError}
                </div>
              )}
              {s.sentences.length === 0 && !s.scriptLoading && (
                <div className="flex flex-col items-center justify-center h-24 text-center text-gray-400 gap-2">
                  <FileText size={28} strokeWidth={1} />
                  <p className="text-xs">
                    {s.videoId
                      ? 'Click "Get Script" to fetch captions.'
                      : "Load a video to get started."}
                  </p>
                </div>
              )}
              {s.sentences.length > 0 && (
                <>
                  <p className="text-[10px] text-gray-500 px-1 pb-1.5">
                    Shift+←/→ to navigate
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-4 px-1">
                    {s.sentences.map((_, i) => (
                      <button
                        key={i}
                        ref={(el) => {
                          s.sentenceRefs.current[i] = el;
                        }}
                        onClick={() => s.goToSentence(i)}
                        disabled={s.importingTranscript}
                        className={clsx(
                          "shrink-0 w-8 h-8 text-xs font-semibold rounded-lg border transition-all",
                          i === s.activeSentenceIdx
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : " text-gray-500 border-gray-200 hover:border-indigo-400 hover:text-indigo-600",
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <div className="mx-1 rounded-xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                    {s.activeSentenceIdx < 0 || s.activeSentenceIdx >= s.sentences.length ? (
                      <p className="text-center text-sm text-gray-500">
                        Select a sentence above.
                      </p>
                    ) : (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-600 font-semibold">
                          Sentence {s.activeSentenceIdx + 1}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-indigo-900">
                          {s.sentences[s.activeSentenceIdx]?.text ?? ""}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Practice section ── */}
          <div
            className="flex flex-col"
            style={{ flex: "2 1 0", minHeight: 0, overflow: "hidden" }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Mic
                  size={11}
                  className={s.isRecording ? "text-red-500" : ""}
                />{" "}
                Practice
              </span>
              {s.sonioxError && (
                <span className="text-[10px] text-red-500 truncate max-w-[200px]">
                  {s.sonioxError}
                </span>
              )}
            </div>

            <div className="flex-1 px-4 py-4 space-y-4 overflow-auto">
              {s.activeSentenceIdx < 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <p className="text-sm">Choose a sentence above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={s.onListenSentence}
                      disabled={
                        s.importingTranscript || s.tts.loading || s.tts.playing
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50"
                    >
                      <Play size={12} /> Listen
                    </button>
                    <button
                      onClick={s.onToggleRecording}
                      disabled={s.importingTranscript}
                      className={clsx(
                        "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all",
                        s.isRecording
                          ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                          : " text-gray-700 border-gray-200 hover:bg-gray-50",
                      )}
                    >
                      {s.isRecording ? (
                        <>
                          <Square size={11} /> Stop
                        </>
                      ) : (
                        <>
                          <Mic size={12} /> Record
                        </>
                      )}
                    </button>
                  </div>

                  {s.lastAudioUrl && <AudioReplay url={s.lastAudioUrl} />}

                  {s.turns
                    .filter((t) => t.sentenceIdx === s.activeSentenceIdx)
                    .slice(-3)
                    .map((turn) => (
                      <div
                        key={turn.id}
                        className="rounded-xl border border-gray-200  p-3 space-y-1.5"
                      >
                        <p className="text-xs text-gray-500 italic">
                          "{turn.text}"
                        </p>
                        {turn.feedback && (
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {turn.feedback}
                          </p>
                        )}
                        {turn.review?.score !== undefined && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Star
                              size={9}
                              className="fill-amber-500 text-amber-500"
                            />
                            {turn.review.score}/10
                          </span>
                        )}
                      </div>
                    ))}
                  {s.coachLoading && (
                    <p className="text-xs text-indigo-500 animate-pulse">
                      Getting AI feedback…
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
