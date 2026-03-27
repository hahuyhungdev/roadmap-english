"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type FormEvent,
} from "react";
import { type YouTubeEvent } from "react-youtube";
import { Keyboard } from "lucide-react";
import useSoniox from "@/hooks/useSoniox";
import { useTTS } from "@/hooks/useTTS";

import type { YTPlayer, ShadowTurn, Sentence } from "./shadowing/types";
import { extractVideoId, extractReview, newId } from "./shadowing/utils";
import { ShortcutsModal } from "./shadowing/ShortcutsModal";
import { VideoPanel } from "./shadowing/VideoPanel";
import { ScriptPanel } from "./shadowing/ScriptPanel";
import { PracticeFeed } from "./shadowing/PracticeFeed";

export default function ShadowingClient() {
  // ── Video ──────────────────────────────────────────────────────────────────
  const [urlInput, setUrlInput] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [urlError, setUrlError] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const playerRef = useRef<YTPlayer | null>(null);

  // ── Script ─────────────────────────────────────────────────────────────────
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptError, setScriptError] = useState("");
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(-1);
  const activeSentenceIdxRef = useRef(-1);
  const sentenceItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [recordingForIdx, setRecordingForIdx] = useState<number | null>(null);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const [ttsVoice, setTtsVoice] = useState("en-US-Neural2-F");
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [hearingIdx, setHearingIdx] = useState<number | null>(null);
  const { speak, stop: stopTTS, loading: ttsLoading, playing: ttsPlaying } =
    useTTS();

  // Clear hearingIdx when TTS stops naturally
  useEffect(() => {
    if (!ttsPlaying) setHearingIdx(null);
  }, [ttsPlaying]);

  // ── Audio recording for replay ─────────────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pendingTurnIdRef = useRef<string | null>(null);
  const blobUrlsRef = useRef<string[]>([]);
  useEffect(
    () => () => blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u)),
    [],
  );

  // ── Practice ───────────────────────────────────────────────────────────────
  const [turns, setTurns] = useState<ShadowTurn[]>([]);
  const [coachLoading, setCoachLoading] = useState(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTtsSettings, setShowTtsSettings] = useState(false);

  // ── Overall score ──────────────────────────────────────────────────────────
  const scores = turns
    .map((t) => t.review?.score)
    .filter((s): s is number => typeof s === "number");
  const overallScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

  // ── Soniox silence callback ────────────────────────────────────────────────
  const handleSilence = useCallback(
    async (transcript: string) => {
      const text = transcript.trim();
      if (!text) return;
      const id = newId();
      pendingTurnIdRef.current = id;
      setRecordingForIdx(null);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
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
            t.id === id
              ? { ...t, feedback: "Could not get feedback. Try again." }
              : t,
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

  // ── Start recording: Soniox/Web Speech + MediaRecorder ────────────────────
  function startRecording() {
    audioChunksRef.current = [];
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";
        const mr = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : undefined,
        );
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mr.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          blobUrlsRef.current.push(url);
          const tid = pendingTurnIdRef.current;
          if (tid) {
            setTurns((p) =>
              p.map((t) => (t.id === tid ? { ...t, audioUrl: url } : t)),
            );
          }
        };
        mr.start(250);
        mediaRecorderRef.current = mr;
      })
      .catch(() => {
        // mic permission denied — STT will still work, just no audio replay
      });
    startRef.current({ source: "mic" });
  }

  // ── Active sentence poll ───────────────────────────────────────────────────
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

  // ── Auto-scroll active sentence ────────────────────────────────────────────
  useEffect(() => {
    if (activeSentenceIdx >= 0) {
      sentenceItemRefs.current[activeSentenceIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeSentenceIdx]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  const keyHandlerRef = useRef<(e: globalThis.KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandlerRef.current = (e: globalThis.KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
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
        case "r":
        case "R":
          e.preventDefault();
          if (isRecording) stopRef.current();
          else startRecording();
          break;
        case "?":
          setShowShortcuts((v) => !v);
          break;
        case "Escape":
          setShowShortcuts(false);
          setShowTtsSettings(false);
          break;
      }
    };
  }); // no deps — always fresh

  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ── Video handlers ─────────────────────────────────────────────────────────
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

  // Bug fix: each sentence has its own hearing state
  function handleSentenceHear(idx: number) {
    if (hearingIdx === idx && ttsPlaying) {
      stopTTS();
      setHearingIdx(null);
    } else {
      if (ttsPlaying) stopTTS();
      setHearingIdx(idx);
      void speak(sentences[idx].text, ttsVoice, ttsSpeed);
    }
  }

  function handleSentenceShadow(idx: number) {
    goToSentenceIdx(idx);
    setRecordingForIdx(idx);
    startRecording();
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
            Shadow native speakers sentence by sentence and get AI feedback.
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
            placeholder="Paste a YouTube URL…"
            className={
              urlError
                ? "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors border-red-300 bg-red-50 focus:border-red-400"
                : "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors border-gray-200 bg-white focus:border-indigo-300"
            }
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
        <div className="lg:col-span-3">
          <VideoPanel
            videoId={videoId}
            playerRef={playerRef}
            onPlayerReady={handlePlayerReady}
            playbackRate={playbackRate}
            onPlaybackRateChange={setPlaybackRate}
          />
        </div>

        {/* Right: Script + Practice */}
        <div
          className="lg:col-span-2 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
          style={{ minHeight: "600px" }}
        >
          {/* Script section */}
          <div
            className="flex flex-col border-b border-gray-100"
            style={{ flex: "3 1 0", minHeight: 0, overflow: "hidden" }}
          >
            <ScriptPanel
              videoId={videoId}
              sentences={sentences}
              activeSentenceIdx={activeSentenceIdx}
              sentenceItemRefs={sentenceItemRefs}
              scriptLoading={scriptLoading}
              scriptError={scriptError}
              hearingIdx={hearingIdx}
              ttsLoading={ttsLoading}
              ttsPlaying={ttsPlaying}
              isRecording={isRecording}
              recordingForIdx={recordingForIdx}
              showTtsSettings={showTtsSettings}
              ttsVoice={ttsVoice}
              ttsSpeed={ttsSpeed}
              overallScore={overallScore}
              hasTurns={turns.length > 0}
              onFetchScript={handleFetchScript}
              onJumpToSentence={goToSentenceIdx}
              onHear={handleSentenceHear}
              onShadow={handleSentenceShadow}
              onStopRecording={() => stopRef.current()}
              onToggleTtsSettings={() => setShowTtsSettings((v) => !v)}
              onClearSession={() => {
                setTurns([]);
                historyRef.current = [];
              }}
              onSetTtsVoice={setTtsVoice}
              onSetTtsSpeed={setTtsSpeed}
            />
          </div>

          {/* Practice feed section */}
          <div
            className="flex flex-col"
            style={{ flex: "2 1 0", minHeight: 0, overflow: "hidden" }}
          >
            <PracticeFeed
              turns={turns}
              isRecording={isRecording}
              partial={partial}
              coachLoading={coachLoading}
              sonioxError={sonioxError}
              onToggleRecording={() => {
                if (isRecording) stopRef.current();
                else startRecording();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
