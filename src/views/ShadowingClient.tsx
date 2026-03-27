"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type FormEvent,
} from "react";
import YouTube, { type YouTubeEvent } from "react-youtube";
import {
  Volume2,
  VolumeX,
  Mic,
  Square,
  Trash2,
  Loader2,
  SkipBack,
  SkipForward,
  Repeat2,
  BookmarkPlus,
  BookmarkX,
  ChevronRight,
  Lightbulb,
  PlayCircle,
  FileText,
  Keyboard,
  X,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import useSoniox from "@/hooks/useSoniox";
import { useTTS } from "@/hooks/useTTS";

// ─── Types ────────────────────────────────────────────────────────────────────

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  setPlaybackRate(rate: number): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
}
type SpeakingReview = {
  original_transcript: string;
  corrected_version: string;
  explanation: string;
  better_alternatives: string[];
};
type ShadowTurn = {
  id: string;
  text: string;
  feedback: string | null;
  review: SpeakingReview | null;
  timestamp: number;
};
type Sentence = { text: string; startMs: number; endMs: number };
type RightTab = "script" | "tts" | "practice";

// ─── Constants ────────────────────────────────────────────────────────────────

const SHORTCUTS: [string, string][] = [
  ["Space", "Play / Pause video"],
  ["← →", "Seek ±5 seconds"],
  ["Shift + ←", "Prev sentence"],
  ["Shift + →", "Next sentence"],
  ["[", "Set loop point A"],
  ["]", "Set loop point B"],
  ["L", "Toggle A-B loop"],
  ["R", "Toggle recording"],
  ["?", "Show / hide shortcuts"],
  ["Esc", "Close shortcuts panel"],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractVideoId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
  );
  return m ? m[1] : null;
}
function extractReview(raw: string): SpeakingReview | null {
  try {
    const m = raw.match(/```review\s*([\s\S]*?)\s*```/i);
    if (!m) return null;
    return JSON.parse(m[1].trim()) as SpeakingReview;
  } catch {
    return null;
  }
}
function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
let _tid = 0;
const newId = () => `t-${++_tid}-${Date.now()}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: SpeakingReview }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100/40 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Lightbulb size={11} /> Review &amp; Corrections
        </span>
        <ChevronRight
          size={12}
          className={clsx(
            "text-indigo-400 transition-transform",
            open && "rotate-90",
          )}
        />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-red-500 font-semibold mb-1">
                You said
              </p>
              <p className="text-xs text-gray-700 bg-white rounded-lg px-2.5 py-1.5 border border-red-100 leading-relaxed">
                {review.original_transcript}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-green-600 font-semibold mb-1">
                Better version
              </p>
              <p className="text-xs text-gray-800 bg-white rounded-lg px-2.5 py-1.5 border border-green-100 font-medium leading-relaxed">
                {review.corrected_version}
              </p>
            </div>
          </div>
          {review.explanation && (
            <p className="text-xs text-gray-600 leading-relaxed">
              {review.explanation}
            </p>
          )}
          {review.better_alternatives?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Alternatives
              </p>
              <div className="flex flex-wrap gap-1.5">
                {review.better_alternatives.map((alt, i) => (
                  <span
                    key={i}
                    className="text-xs bg-white border border-indigo-100 text-indigo-700 rounded-full px-2 py-0.5"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-indigo-500" />
            <h3 className="font-bold text-gray-900">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <kbd className="shrink-0 min-w-[100px] text-center px-2 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono font-semibold text-gray-700">
                {key}
              </kbd>
              <span className="text-sm text-gray-600">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Active when not focused on an input field
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ShadowingClient() {
  // ── Video ──
  const [urlInput, setUrlInput] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [urlError, setUrlError] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const playerRef = useRef<YTPlayer | null>(null);

  // ── A-B loop ──
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const loopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Script ──
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptError, setScriptError] = useState("");
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(-1);
  const activeSentenceIdxRef = useRef(-1);
  const sentenceItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // ── TTS ──
  const [ttsText, setTtsText] = useState("");
  const [ttsVoice, setTtsVoice] = useState("en-US-Neural2-F");
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const {
    speak,
    stop: stopTTS,
    loading: ttsLoading,
    playing: ttsPlaying,
  } = useTTS();

  // ── Shadow practice ──
  const [turns, setTurns] = useState<ShadowTurn[]>([]);
  const [coachLoading, setCoachLoading] = useState(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const turnsBottomRef = useRef<HTMLDivElement | null>(null);

  // ── UI ──
  const [rightTab, setRightTab] = useState<RightTab>("script");
  const [showShortcuts, setShowShortcuts] = useState(false);

  // ── Soniox ──
  const handleSilence = useCallback(
    async (transcript: string) => {
      const text = transcript.trim();
      if (!text) return;
      const id = newId();
      setTurns((p) => [
        ...p,
        { id, text, feedback: null, review: null, timestamp: Date.now() },
      ]);
      setCoachLoading(true);
      historyRef.current.push({ role: "user", content: text });
      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: text,
            history: historyRef.current.slice(-6),
            topic: videoTitle || "English shadowing practice",
          }),
        });
        const data = (await res.json()) as { reply?: string; error?: string };
        const reply = data.reply ?? "";
        const review = extractReview(reply);
        const feedbackText = reply.replace(/```review[\s\S]*?```/gi, "").trim();
        historyRef.current.push({ role: "assistant", content: reply });
        setTurns((p) =>
          p.map((t) =>
            t.id === id ? { ...t, feedback: feedbackText, review } : t,
          ),
        );
      } catch {
        setTurns((p) =>
          p.map((t) =>
            t.id === id ? { ...t, feedback: "⚠ Failed to get feedback." } : t,
          ),
        );
      } finally {
        setCoachLoading(false);
      }
    },
    [videoTitle],
  );

  const {
    start: startSoniox,
    stop: stopSoniox,
    isRecording,
    partial,
    error: sonioxError,
  } = useSoniox({
    onSilence: handleSilence,
    silenceMs: 2000,
    silenceThreshold: -50,
    source: "mic",
  });
  const startRef = useRef(startSoniox);
  const stopRef = useRef(stopSoniox);
  useEffect(() => {
    startRef.current = startSoniox;
    stopRef.current = stopSoniox;
  });
  useEffect(() => () => stopRef.current(), []);

  // ── A-B loop interval ──
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
  }, [loopEnabled, loopA, loopB]);

  // ── Active sentence poll ──
  useEffect(() => {
    if (!sentences.length) return;
    const timer = setInterval(() => {
      const ms = (playerRef.current?.getCurrentTime() ?? 0) * 1000;
      let idx = -1;
      for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].startMs <= ms) idx = i;
        else break;
      }
      if (idx !== activeSentenceIdxRef.current) {
        activeSentenceIdxRef.current = idx;
        setActiveSentenceIdx(idx);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [sentences]);

  // ── Auto-scroll active sentence ──
  useEffect(() => {
    if (activeSentenceIdx >= 0 && rightTab === "script") {
      sentenceItemRefs.current[activeSentenceIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeSentenceIdx, rightTab]);

  // ── Auto-scroll turns ──
  useEffect(() => {
    setTimeout(
      () => turnsBottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }, [turns]);

  // ── Keyboard shortcuts (ref pattern — always fresh, no stale closures) ──
  const keyHandlerRef = useRef<(e: globalThis.KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandlerRef.current = (e: globalThis.KeyboardEvent) => {
      const tag = (
        document.activeElement as HTMLElement
      )?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      const player = playerRef.current;
      switch (e.key) {
        case " ":
          e.preventDefault();
          if (player)
            player.getPlayerState() === 1
              ? player.pauseVideo()
              : player.playVideo();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) {
            const prev = Math.max(0, activeSentenceIdxRef.current - 1);
            if (sentences[prev]) {
              player?.seekTo(sentences[prev].startMs / 1000, true);
              player?.playVideo();
              setActiveSentenceIdx(prev);
              activeSentenceIdxRef.current = prev;
            }
          } else {
            player?.seekTo((player.getCurrentTime() ?? 0) - 5, true);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) {
            const next = Math.min(
              sentences.length - 1,
              activeSentenceIdxRef.current + 1,
            );
            if (sentences[next]) {
              player?.seekTo(sentences[next].startMs / 1000, true);
              player?.playVideo();
              setActiveSentenceIdx(next);
              activeSentenceIdxRef.current = next;
            }
          } else {
            player?.seekTo((player.getCurrentTime() ?? 0) + 5, true);
          }
          break;
        case "[":
          e.preventDefault();
          {
            const t = player?.getCurrentTime() ?? 0;
            setLoopA(Math.floor(t * 10) / 10);
            setLoopEnabled(false);
          }
          break;
        case "]":
          e.preventDefault();
          {
            const t = player?.getCurrentTime() ?? 0;
            setLoopB(Math.floor(t * 10) / 10);
          }
          break;
        case "l":
        case "L":
          e.preventDefault();
          setLoopEnabled((v) => {
            if (!v && loopA !== null && loopB !== null && loopA < loopB) {
              player?.seekTo(loopA, true);
              return true;
            }
            return loopA !== null && loopB !== null && loopA < loopB
              ? !v
              : false;
          });
          break;
        case "r":
        case "R":
          e.preventDefault();
          if (isRecording) stopRef.current();
          else {
            startRef.current({ source: "mic" });
            setRightTab("practice");
          }
          break;
        case "?":
          setShowShortcuts((v) => !v);
          break;
        case "Escape":
          setShowShortcuts(false);
          break;
      }
    };
  }); // no deps — always fresh

  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleLoadVideo(e?: FormEvent) {
    e?.preventDefault();
    setUrlError("");
    const id = extractVideoId(urlInput.trim());
    if (!id) {
      setUrlError("Invalid YouTube URL");
      return;
    }
    setVideoId(id);
    setVideoTitle("");
    setLoopA(null);
    setLoopB(null);
    setLoopEnabled(false);
    setSentences([]);
    setScriptError("");
    setActiveSentenceIdx(-1);
    activeSentenceIdxRef.current = -1;
    sentenceItemRefs.current = [];
  }

  function handlePlayerReady(event: YouTubeEvent) {
    playerRef.current = event.target as unknown as YTPlayer;
    playerRef.current.setPlaybackRate(playbackRate);
    const title = (event.target as { videoTitle?: string }).videoTitle ?? "";
    if (title) setVideoTitle(title);
  }

  async function handleFetchScript() {
    if (!videoId) return;
    setScriptLoading(true);
    setScriptError("");
    setSentences([]);
    try {
      const res = await fetch(
        `/api/transcript?url=${encodeURIComponent(`https://youtube.com/watch?v=${videoId}`)}`,
      );
      const data = (await res.json()) as {
        sentences?: Sentence[];
        error?: string;
      };
      if (!res.ok || !data.sentences) {
        setScriptError(data.error ?? "Failed to fetch script.");
        return;
      }
      setSentences(data.sentences);
      sentenceItemRefs.current = [];
    } finally {
      setScriptLoading(false);
    }
  }

  function goToSentenceIdx(idx: number) {
    if (idx < 0 || idx >= sentences.length) return;
    const s = sentences[idx];
    playerRef.current?.seekTo(s.startMs / 1000, true);
    playerRef.current?.playVideo();
    setActiveSentenceIdx(idx);
    activeSentenceIdxRef.current = idx;
  }

  function handleSentenceHear(idx: number) {
    const s = sentences[idx];
    setTtsText(s.text);
    setRightTab("tts");
    void speak(s.text, ttsVoice, ttsSpeed);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shadowing Lab</h1>
          <p className="text-sm text-gray-500 mt-1">
            Shadow native speakers, practice sentences with TTS, and get AI
            feedback.
          </p>
        </div>
        <button
          onClick={() => setShowShortcuts(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all shrink-0 mt-1"
        >
          <Keyboard size={13} /> Shortcuts (?)
        </button>
      </div>

      {/* URL form */}
      <form onSubmit={handleLoadVideo} className="flex gap-2 items-start">
        <div className="flex-1">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste a YouTube URL…  e.g. https://youtube.com/watch?v=dQw4w9WgXcQ"
            className={clsx(
              "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors",
              urlError
                ? "border-red-300 bg-red-50 focus:border-red-400"
                : "border-gray-200 bg-white focus:border-indigo-300",
            )}
          />
          {urlError && (
            <p className="text-xs text-red-500 mt-1 pl-1">{urlError}</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Video + Controls */}
        <div className="lg:col-span-3 space-y-4">
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
                  onReady={handlePlayerReady}
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

          {videoId && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-4">
              {/* Speed */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Playback Speed
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[0.5, 0.75, 1.0, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setPlaybackRate(rate);
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
                      {d < 0 ? (
                        <SkipBack size={13} />
                      ) : (
                        <SkipForward size={13} />
                      )}
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
                        <span className="font-mono">
                          {fmtTime(loopA * 1000)}
                        </span>
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
                        <span className="font-mono">
                          {fmtTime(loopB * 1000)}
                        </span>
                      </span>
                    ) : (
                      "Set B"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (loopA === null || loopB === null || loopA >= loopB)
                        return;
                      setLoopEnabled((v) => {
                        if (!v) playerRef.current?.seekTo(loopA, true);
                        return !v;
                      });
                    }}
                    disabled={
                      loopA === null || loopB === null || loopA >= loopB
                    }
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

        {/* Right: Tabbed panel */}
        <div className="lg:col-span-2 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100 shrink-0">
            {[
              { id: "script" as RightTab, label: "Script", Icon: FileText },
              { id: "tts" as RightTab, label: "TTS", Icon: Volume2 },
              { id: "practice" as RightTab, label: "Practice", Icon: Mic },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setRightTab(id)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2",
                  rightTab === id
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/40"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                )}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Script tab ── */}
          {rightTab === "script" && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="px-4 py-3 border-b border-gray-100 shrink-0">
                {!videoId ? (
                  <p className="text-xs text-gray-400 text-center py-1">
                    Load a video first, then fetch its script.
                  </p>
                ) : (
                  <button
                    onClick={handleFetchScript}
                    disabled={scriptLoading}
                    className="w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50"
                  >
                    {scriptLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : sentences.length > 0 ? (
                      <RefreshCw size={14} />
                    ) : (
                      <FileText size={14} />
                    )}
                    {scriptLoading
                      ? "Fetching script…"
                      : sentences.length > 0
                        ? "Refresh Script"
                        : "Get Script"}
                  </button>
                )}
              </div>
              <div
                className="overflow-y-auto flex-1 px-3 py-2"
                style={{ minHeight: "200px", maxHeight: "520px" }}
              >
                {scriptError && (
                  <div className="mx-1 my-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                    {scriptError}
                  </div>
                )}
                {!scriptError && sentences.length === 0 && !scriptLoading && (
                  <div className="flex flex-col items-center justify-center h-32 text-center text-gray-300 gap-2">
                    <FileText size={32} strokeWidth={1} />
                    <p className="text-xs">
                      {videoId
                        ? 'Click "Get Script" to fetch captions.'
                        : "Load a video above to get started."}
                    </p>
                  </div>
                )}
                {sentences.length > 0 && (
                  <div className="space-y-0.5 py-1">
                    <p className="text-[10px] text-gray-400 px-1 pb-2">
                      {sentences.length} sentences · Shift+← → to navigate
                    </p>
                    {sentences.map((s, i) => (
                      <button
                        key={i}
                        ref={(el) => {
                          sentenceItemRefs.current[i] = el;
                        }}
                        onClick={() => {
                          goToSentenceIdx(i);
                          setTtsText(s.text);
                        }}
                        className={clsx(
                          "w-full text-left px-3 py-2.5 rounded-xl border transition-all group",
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
                        <div className="flex gap-1.5 mt-1.5 pl-12 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSentenceHear(i);
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <Volume2 size={9} /> Hear
                          </span>
                          <span
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToSentenceIdx(i);
                              setRightTab("practice");
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                            <Mic size={9} /> Shadow
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TTS tab ── */}
          {rightTab === "tts" && (
            <div className="flex-1 p-4 space-y-3">
              <p className="text-xs text-gray-400">
                Type or paste a phrase. Click "Hear" on a sentence to pre-fill.
              </p>
              <textarea
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    void speak(ttsText, ttsVoice, ttsSpeed);
                  }
                }}
                placeholder="Type a phrase or sentence to practice…"
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none outline-none focus:border-indigo-300 transition-colors placeholder:text-gray-300"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                    Voice
                  </p>
                  <select
                    value={ttsVoice}
                    onChange={(e) => setTtsVoice(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-300 bg-white"
                  >
                    <option value="en-US-Neural2-F">Female (Neural2-F)</option>
                    <option value="en-US-Neural2-C">Female (Neural2-C)</option>
                    <option value="en-US-Neural2-J">Male (Neural2-J)</option>
                    <option value="en-US-Neural2-A">Male (Neural2-A)</option>
                    <option value="en-US-Neural2-D">Male (Neural2-D)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                    Speed
                  </p>
                  <select
                    value={ttsSpeed}
                    onChange={(e) => setTtsSpeed(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-300 bg-white"
                  >
                    <option value={0.6}>0.6× — Very slow</option>
                    <option value={0.75}>0.75× — Slow</option>
                    <option value={0.9}>0.9× — Normal−</option>
                    <option value={1.0}>1.0× — Normal</option>
                    <option value={1.15}>1.15× — Fast</option>
                  </select>
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (ttsPlaying) stopTTS();
                  else void speak(ttsText, ttsVoice, ttsSpeed);
                }}
              >
                <button
                  type="submit"
                  disabled={!ttsText.trim() || ttsLoading}
                  className={clsx(
                    "w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                    ttsPlaying
                      ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed",
                  )}
                >
                  {ttsLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : ttsPlaying ? (
                    <VolumeX size={14} />
                  ) : (
                    <Volume2 size={14} />
                  )}
                  {ttsLoading
                    ? "Loading…"
                    : ttsPlaying
                      ? "Stop"
                      : "Speak  (⌘↵)"}
                </button>
              </form>
            </div>
          )}

          {/* ── Practice tab ── */}
          {rightTab === "practice" && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                <p className="text-xs text-gray-500">
                  Record yourself — get AI feedback.
                </p>
                {turns.length > 0 && (
                  <button
                    onClick={() => {
                      setTurns([]);
                      historyRef.current = [];
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div
                className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
                style={{ minHeight: "200px", maxHeight: "420px" }}
              >
                {turns.length === 0 && !isRecording && (
                  <div className="flex flex-col items-center justify-center h-28 text-center text-gray-300 gap-2">
                    <Mic size={32} strokeWidth={1} />
                    <p className="text-xs">
                      Press record, say a sentence to shadow, and get AI
                      feedback.
                    </p>
                  </div>
                )}
                {turns.map((turn) => (
                  <div key={turn.id} className="space-y-1">
                    <div className="flex justify-end">
                      <div className="max-w-[88%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-sm leading-relaxed">
                        {turn.text}
                      </div>
                    </div>
                    {turn.feedback === null && coachLoading ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 pl-1">
                        <Loader2 size={11} className="animate-spin" /> Thinking…
                      </div>
                    ) : turn.feedback ? (
                      <div className="max-w-[92%]">
                        <div className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 leading-relaxed whitespace-pre-wrap">
                          {turn.feedback}
                        </div>
                        {turn.review && <ReviewCard review={turn.review} />}
                      </div>
                    ) : null}
                  </div>
                ))}
                {isRecording && partial && (
                  <div className="flex justify-end">
                    <div className="max-w-[88%] bg-indigo-100 text-indigo-700 rounded-2xl rounded-tr-sm px-3 py-2 text-sm italic opacity-70">
                      {partial}…
                    </div>
                  </div>
                )}
                <div ref={turnsBottomRef} />
              </div>
              {sonioxError && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 shrink-0">
                  {sonioxError}
                </div>
              )}
              <div className="px-4 py-3 border-t border-gray-100 shrink-0">
                <button
                  onClick={() => {
                    if (isRecording) stopRef.current();
                    else startRef.current({ source: "mic" });
                  }}
                  className={clsx(
                    "w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                    isRecording
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white",
                  )}
                >
                  {isRecording ? (
                    <>
                      <Square size={14} className="fill-white" /> Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic size={14} /> Start Recording (R)
                    </>
                  )}
                </button>
                {isRecording && (
                  <p className="text-center text-xs text-gray-400 mt-1.5">
                    🎙 Listening — auto-submits after silence…
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
