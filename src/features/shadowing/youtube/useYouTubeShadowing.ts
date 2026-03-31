"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type FormEvent,
} from "react";
import type { YouTubeEvent } from "react-youtube";
import useSoniox from "@/hooks/useSoniox";
import { useTTSSettings } from "../shared/useTTSSettings";
import type { YTPlayer, ShadowTurn, Sentence } from "../shared/types";
import { extractVideoId, extractReview, newId } from "../shared/utils";
import { DEFAULT_SPEED } from "@/features/shadowing/shared/constants";

export function useYouTubeShadowing() {
  // ── Video ────────────────────────────────────────────────────────────────
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const playerRef = useRef<YTPlayer | null>(null);

  // ── Script / sentences ───────────────────────────────────────────────────
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptError, setScriptError] = useState("");
  const [importingTranscript, setImportingTranscript] = useState(false);
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(-1);
  const activeSentenceIdxRef = useRef(-1);
  const sentenceRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // ── TTS (self-contained) ─────────────────────────────────────────────────
  const tts = useTTSSettings({ provider: "google", speed: DEFAULT_SPEED });

  // ── Recording ────────────────────────────────────────────────────────────
  const {
    start: startSoniox,
    stop: stopSoniox,
    isRecording,
    transcript,
    partial,
    error: sonioxError,
  } = useSoniox({ source: "mic" });
  const startRef = useRef(startSoniox);
  const stopRef = useRef(stopSoniox);
  useEffect(() => {
    startRef.current = startSoniox;
    stopRef.current = stopSoniox;
  }, [startSoniox, stopSoniox]);
  useEffect(() => () => stopRef.current(), []);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const blobUrlsRef = useRef<string[]>([]);
  const pendingTurnIdRef = useRef<string | null>(null);
  const recordingForIdxRef = useRef<number | null>(null);
  useEffect(
    () => () => blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u)),
    [],
  );

  // ── Coaching turns ───────────────────────────────────────────────────────
  const [turns, setTurns] = useState<ShadowTurn[]>([]);
  const [coachLoading, setCoachLoading] = useState(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  // ── Video sync ────────────────────────────────────────────────────────────
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

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeSentenceIdx < 0) return;

    const el = sentenceRefs.current[activeSentenceIdx];
    if (!el) return;

    const findScrollableParent = (node: Element | null): Element | null => {
      while (node) {
        const style = getComputedStyle(node as Element);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          (node as HTMLElement).scrollHeight >
            (node as HTMLElement).clientHeight
        )
          return node as Element;
        if (
          (overflowX === "auto" || overflowX === "scroll") &&
          (node as HTMLElement).scrollWidth > (node as HTMLElement).clientWidth
        )
          return node as Element;
        node = node.parentElement;
      }
      return null;
    };

    const scrollIfNeeded = (target: Element) => {
      const scroller =
        findScrollableParent(target) ||
        document.scrollingElement ||
        document.documentElement;
      if (!scroller) return;

      const targetRect = target.getBoundingClientRect();
      const parentRect = (scroller as Element).getBoundingClientRect
        ? (scroller as Element).getBoundingClientRect()
        : {
            top: 0,
            bottom: window.innerHeight,
            left: 0,
            right: window.innerWidth,
          };

      const verticallyOut =
        targetRect.top < parentRect.top ||
        targetRect.bottom > parentRect.bottom;
      const horizontallyOut =
        targetRect.left < parentRect.left ||
        targetRect.right > parentRect.right;

      if (verticallyOut)
        target.scrollIntoView({ behavior: "smooth", block: "nearest" });
      else if (horizontallyOut)
        target.scrollIntoView({ behavior: "smooth", inline: "center" });
    };

    scrollIfNeeded(el);
  }, [activeSentenceIdx]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (
        document.activeElement as HTMLElement
      )?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      const player = playerRef.current;

      const goTo = (idx: number) => {
        if (idx < 0 || idx >= sentences.length) return;
        player?.seekTo(sentences[idx].startMs / 1000, true);
        player?.playVideo();
        const clamped = Math.max(0, Math.min(sentences.length - 1, idx));
        activeSentenceIdxRef.current = clamped;
        setActiveSentenceIdx(clamped);
      };

      switch (e.key) {
        case " ":
          e.preventDefault();
          player?.getPlayerState() === 1
            ? player?.pauseVideo()
            : player?.playVideo();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) goTo(activeSentenceIdxRef.current - 1);
          else player?.seekTo((player?.getCurrentTime() ?? 0) - 5, true);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) goTo(activeSentenceIdxRef.current + 1);
          else player?.seekTo((player?.getCurrentTime() ?? 0) + 5, true);
          break;
        case "ArrowUp":
          e.preventDefault();
          // Record
          if (isRecording) stopRef.current();
          else startRecordingAction();
          break;
        case "ArrowDown":
          e.preventDefault();
          // Listen again
          if (
            activeSentenceIdxRef.current >= 0 &&
            sentences[activeSentenceIdxRef.current]
          ) {
            void tts.speak(sentences[activeSentenceIdxRef.current].text);
          }
          break;
        case "r":
        case "R":
          e.preventDefault();
          if (isRecording) stopRef.current();
          else startRecordingAction();
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences, isRecording, tts.speak]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const submitTranscript = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const id = newId();
      pendingTurnIdRef.current = id;
      const sentenceIdx = recordingForIdxRef.current ?? undefined;
      recordingForIdxRef.current = null;
      if (mediaRecorderRef.current?.state === "recording")
        mediaRecorderRef.current.stop();

      setTurns((prev) => [
        ...prev,
        {
          id,
          text: trimmed,
          sentenceIdx,
          feedback: null,
          review: null,
          timestamp: Date.now(),
        },
      ]);
      setCoachLoading(true);
      historyRef.current.push({ role: "user", content: trimmed });

      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: trimmed,
            history: historyRef.current.slice(-6),
            topic: videoTitle || "English shadowing",
          }),
        });
        const data = (await res.json()) as { reply?: string; error?: string };
        const reply = data.reply ?? "";
        const review = extractReview(reply);
        const feedbackText = reply.replace(/```review[\s\S]*?```/gi, "").trim();
        historyRef.current.push({ role: "assistant", content: reply });
        setTurns((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, feedback: feedbackText, review } : t,
          ),
        );
      } catch {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, feedback: "Could not get feedback." } : t,
          ),
        );
      } finally {
        setCoachLoading(false);
      }
    },
    [videoTitle],
  );

  function startRecordingAction() {
    audioChunksRef.current = [];
    recordingForIdxRef.current =
      activeSentenceIdxRef.current >= 0 ? activeSentenceIdxRef.current : null;
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
          if (tid)
            setTurns((prev) =>
              prev.map((t) => (t.id === tid ? { ...t, audioUrl: url } : t)),
            );
        };
        mr.start(250);
        mediaRecorderRef.current = mr;
      })
      .catch(() => {});
    startRef.current({ source: "mic" });
  }

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
    sentenceRefs.current = [];
  }

  function handlePlayerReady(event: YouTubeEvent) {
    playerRef.current = event.target as unknown as YTPlayer;
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
      const raw = await res.json().catch(() => null);
      console.log("transcript response", res, raw);

      if (!res.ok) {
        setScriptError(raw?.error ?? "Failed to fetch script.");
        return;
      }

      // Prefer `sentences` but fall back to `segments` if present
      let sentencesData: Sentence[] | undefined = raw?.sentences;
      if (!sentencesData && Array.isArray(raw?.segments)) {
        const parseTimestampToMs = (ts?: string | number): number => {
          if (ts == null) return 0;
          if (typeof ts === "number") return Math.round(ts * 1000);
          const s = String(ts).trim();
          if (!s) return 0;
          if (!s.includes(":")) {
            const f = parseFloat(s);
            return Number.isFinite(f) ? Math.round(f * 1000) : 0;
          }
          const parts = s.split(":").map((p) => parseFloat(p) || 0);
          let ms = 0;
          let multiplier = 1;
          for (let i = parts.length - 1; i >= 0; i--) {
            ms += parts[i] * multiplier * 1000;
            multiplier *= 60;
          }
          return Math.round(ms);
        };

        const starts = raw.segments.map((seg: any) =>
          parseTimestampToMs(
            seg.timestamp ?? seg.time ?? seg.t ?? seg.start ?? seg.ts,
          ),
        );
        sentencesData = raw.segments.map((seg: any, i: number) => {
          const startMs = starts[i] ?? 0;
          const endMs = i < starts.length - 1 ? starts[i + 1] : startMs + 3000;
          return { text: String(seg.text ?? "").trim(), startMs, endMs };
        });
      }

      if (
        !sentencesData ||
        !Array.isArray(sentencesData) ||
        sentencesData.length === 0
      ) {
        setScriptError(raw?.error ?? "Failed to fetch script.");
        return;
      }

      console.log(
        "parsed sentences count",
        sentencesData.length,
        "segments/captions:",
        raw?.segments?.length ?? raw?.captions?.length ?? 0,
      );
      console.log("sample sentences", sentencesData.slice(0, 5));

      setSentences(sentencesData);
      sentenceRefs.current = [];
    } finally {
      setScriptLoading(false);
    }
  }

  // Import transcript pasted from tactiq.io tools (simple parser)
  function parseTimestampToMs(ts: string): number {
    // expected: HH:MM:SS.mmm or H:MM:SS.mmm
    const m = ts.match(/(\d+):(\d{2}):(\d{2})\.(\d{1,3})/);
    if (!m) return 0;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const sec = parseInt(m[3], 10);
    let ms = parseInt(m[4].padEnd(3, "0"), 10);
    return ((h * 60 + min) * 60 + sec) * 1000 + ms;
  }

  async function handleImportTranscript(
    raw: string,
    opts?: { useAI?: boolean; model?: string },
  ) {
    if (!raw) return;
    const useAI = Boolean(opts?.useAI);
    setScriptError("");
    if (useAI) setImportingTranscript(true);
    else setScriptLoading(true);

    const localParse = () => {
      const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const items: { startMs: number; text: string }[] = [];
      const tsRe = /^(\d{1,2}:\d{2}:\d{2}\.\d{1,3})\s+(.*)$/;
      for (const line of lines) {
        if (line.startsWith("#")) continue;
        const m = line.match(tsRe);
        if (m) {
          const startMs = parseTimestampToMs(m[1]);
          const text = m[2].trim();
          items.push({ startMs, text });
        } else {
          if (items.length > 0) items[items.length - 1].text += " " + line;
        }
      }

      if (!items.length) return null;

      const sentencesData: Sentence[] = items.map((it, i) => {
        const startMs = it.startMs;
        const endMs =
          i < items.length - 1 ? items[i + 1].startMs : startMs + 3000;
        return { text: it.text.trim(), startMs, endMs };
      });

      return sentencesData;
    };

    // If explicit AI import requested, call server-side cleaner and fail if it errors
    if (useAI) {
      try {
        const body: any = { raw };
        if (opts?.model) body.model = opts.model;
        const res = await fetch("/api/transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const json = await res.json().catch(() => null);
        if (res.ok && json && Array.isArray(json.segments)) {
          const segs: any[] = json.segments;
          const starts = segs.map((s) => Number(s.start ?? s.timestamp ?? 0));
          const sentencesData: Sentence[] = segs.map((s: any, i: number) => {
            const start = Number(s.start ?? s.timestamp ?? 0);
            const startMs = Math.round(start * 1000);
            const endMs =
              i < starts.length - 1
                ? Math.round((starts[i + 1] ?? start) * 1000)
                : startMs + 3000;
            return {
              text: String(s.text ?? s.caption ?? "").trim(),
              startMs,
              endMs,
            };
          });

          if (sentencesData.length > 0) {
            setSentences(sentencesData);
            sentenceRefs.current = [];
            setImportingTranscript(false);
            return;
          }
        }

        // If AI returned nothing usable, show error
        setScriptError(json?.error ?? "AI import failed");
        setImportingTranscript(false);
        return;
      } catch (e: any) {
        setScriptError(String(e?.message ?? e));
        setImportingTranscript(false);
        return;
      }
    }

    // fallback: local parsing
    const fallback = localParse();
    if (fallback && fallback.length) {
      setSentences(fallback);
      sentenceRefs.current = [];
      setScriptError("");
    } else {
      setScriptError("Could not parse pasted transcript");
    }

    setScriptLoading(false);
  }

  function goToSentence(idx: number) {
    if (idx < 0 || idx >= sentences.length) return;
    playerRef.current?.seekTo(sentences[idx].startMs / 1000, true);
    playerRef.current?.playVideo();
    activeSentenceIdxRef.current = idx;
    setActiveSentenceIdx(idx);
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const scores = turns
    .map((t) => t.review?.score)
    .filter((s): s is number => typeof s === "number");
  const overallScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  const activeSentenceText = sentences[activeSentenceIdx]?.text ?? "";
  const lastAudioUrl = (() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i];
      if (t.sentenceIdx === activeSentenceIdx && t.audioUrl) return t.audioUrl;
    }
    return null;
  })();

  return {
    urlInput,
    setUrlInput,
    urlError,
    videoId,
    playerRef,
    sentences,
    scriptLoading,
    scriptError,
    activeSentenceIdx,
    sentenceRefs,
    tts,
    isRecording,
    sonioxError,
    turns,
    coachLoading,
    overallScore,
    activeSentenceText,
    lastAudioUrl,
    handleLoadVideo,
    handlePlayerReady,
    handleFetchScript,
    handleImportTranscript,
    goToSentence,
    importingTranscript,
    onToggleRecording: () => {
      if (isRecording) {
        stopRef.current();
        const text = (transcript || partial).trim();
        if (text) void submitTranscript(text);
      } else {
        startRecordingAction();
      }
    },
    onListenSentence: () => {
      if (activeSentenceIdx >= 0 && sentences[activeSentenceIdx]) {
        void tts.speak(sentences[activeSentenceIdx].text);
      }
    },
    onClearSession: () => {
      setTurns([]);
      historyRef.current = [];
    },
  };
}
