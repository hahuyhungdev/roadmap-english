"use client";

import {
  FileText,
  Loader2,
  Mic,
  Sparkles,
  Square,
  ArrowRight,
} from "lucide-react";
import clsx from "clsx";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useYouTubeShadowing } from "./useYouTubeShadowing";
import { VideoPanel } from "../shared/VideoPanel";
import { AudioReplay } from "../shared/AudioReplay";
import type { Sentence } from "../shared/types";

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
  const router = useRouter();
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
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [openingScript, setOpeningScript] = useState(false);
  const busy = s.importingTranscript || s.improvingTranscript;

  async function handleOpenInScript() {
    if (!s.sentences.length || openingScript) return;
    setOpeningScript(true);
    try {
      const scriptText = s.sentences.map((sen) => sen.text).join(" ");
      const res = await fetch("/api/shadowing/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "script",
          title: `Script — ${s.videoId ?? "YouTube"}`,
          scriptText,
          sentences: s.sentences,
        }),
      });
      const data = await res.json();
      if (data.session?.id) {
        router.push(`/shadowing/${data.session.id}`);
      }
    } catch {
      // ignore
    } finally {
      setOpeningScript(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">YouTube Shadowing</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Shadow native speakers sentence by sentence.
          </p>
        </div>
        <span className="text-[11px] text-gray-400">
          Shift+←/→ • Space play/pause
        </span>
      </div>

      {/* URL form */}
      <form onSubmit={s.handleLoadVideo} className="flex gap-2">
        <input
          value={s.urlInput}
          onChange={(e) => s.setUrlInput(e.target.value)}
          placeholder="Paste a YouTube URL…"
          className={clsx(
            "flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors",
            s.urlError
              ? "border-red-400 bg-red-50 focus:border-red-500"
              : "border-gray-200 focus:border-indigo-400",
          )}
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Load
        </button>
      </form>
      {s.urlError && (
        <p className="text-xs text-red-500 -mt-2 pl-1">{s.urlError}</p>
      )}

      {/* Main grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
        {/* Left: Video */}
        <div className="lg:col-span-3">
          <VideoPanel
            videoId={s.videoId}
            playerRef={s.playerRef}
            onPlayerReady={s.handlePlayerReady}
          />
        </div>

        {/* Right: Script + Practice */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          {/* Script card */}
          <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Script header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-indigo-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Script
                </span>
                {s.sentences.length > 0 && (
                  <span className="text-[11px] text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
                    {s.sentences.length}
                  </span>
                )}
              </div>
              {s.sentences.length > 0 && (
                <button
                  onClick={handleOpenInScript}
                  disabled={openingScript || busy}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 border border-indigo-200 rounded-lg bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 transition-colors"
                  title="Create a new Script Shadowing session with this transcript"
                >
                  {openingScript ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <ArrowRight size={11} />
                  )}
                  Script Mode
                </button>
              )}
              {s.sentences.length > 0 && (
                <button
                  onClick={s.handleImproveWithAI}
                  disabled={busy}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-violet-600 border border-violet-200 rounded-lg bg-violet-50 hover:bg-violet-100 disabled:opacity-40 transition-colors"
                >
                  {s.improvingTranscript ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Sparkles size={11} />
                  )}
                  Improve with AI
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="px-4 pt-3 pb-2 space-y-2">
              <button
                onClick={s.handleImportFromYouTube}
                disabled={!s.videoId || busy}
                className="w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-40"
              >
                {s.importingTranscript ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ArrowRight size={13} />
                )}
                Get Transcript (Supadata)
              </button>
              <button
                onClick={() => setShowPaste((v) => !v)}
                className="w-full text-xs text-gray-500 hover:text-indigo-600 transition-colors py-0.5"
              >
                {showPaste
                  ? "▲ Hide paste area"
                  : "▼ Paste transcript manually (fallback)"}
              </button>
            </div>

            {/* Paste area */}
            {showPaste && (
              <div className="px-4 pb-3 space-y-2">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste transcript here (from any source)…"
                  className="w-full h-28 p-2.5 text-sm border border-gray-200 rounded-xl resize-none outline-none focus:border-indigo-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!pasteText.trim()) return;
                      const useAI = window.confirm(
                        "Improve with AI?\n\nAI will re-split sentences more naturally.\nOK = use AI  •  Cancel = keep as-is",
                      );
                      s.handleImportTranscript(pasteText, { useAI });
                      setPasteText("");
                      setShowPaste(false);
                    }}
                    disabled={busy || !pasteText.trim()}
                    className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    {s.importingTranscript ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />{" "}
                        Importing…
                      </>
                    ) : (
                      "Import"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setPasteText("");
                      setShowPaste(false);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {s.scriptError && (
              <div className="mx-4 mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                {s.scriptError}
              </div>
            )}

            {/* Sentence pills */}
            {s.sentences.length === 0 ? (
              <div className="flex items-center justify-center h-14 pb-4">
                <p className="text-xs text-gray-400 text-center">
                  {s.videoId
                    ? "Fetch transcript with Supadata, or paste manually below."
                    : "Load a video URL above to get started."}
                </p>
              </div>
            ) : (
              <div className="px-4 pb-3">
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {s.sentences.map((_, i) => (
                    <button
                      key={i}
                      ref={(el) => {
                        s.sentenceRefs.current[i] = el;
                      }}
                      onClick={() => s.goToSentence(i)}
                      disabled={busy}
                      className={clsx(
                        "shrink-0 w-8 h-8 text-xs font-semibold rounded-lg border transition-all",
                        i === s.activeSentenceIdx
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "text-gray-500 border-gray-200 hover:border-indigo-400 hover:text-indigo-600",
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Practice card — shown only when a sentence is active */}
          {s.activeSentenceIdx >= 0 &&
            s.activeSentenceIdx < s.sentences.length && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 shadow-sm p-4 space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">
                    Sentence {s.activeSentenceIdx + 1}
                  </p>
                  <p className="mt-1.5 text-base leading-relaxed text-indigo-900 font-medium">
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
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
