"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { YouTubeEvent } from "react-youtube";
import type { YTPlayer, Sentence, SessionOpts } from "../shared/types";

// ─── Hook ─────────────────────────────────────────────────────────────────
export function useYouTubeShadowing(opts?: SessionOpts) {
  const [videoId, setVideoId] = useState<string | null>(
    opts?.initialVideoId ?? null,
  );
  const playerRef = useRef<YTPlayer | null>(null);

  // ── Sentences ──────────────────────────────────────────────────────────
  const [sentences, setSentences] = useState<Sentence[]>(
    opts?.initialSentences ?? [],
  );
  const [scriptError, setScriptError] = useState("");
  const [improvingTranscript, setImprovingTranscript] = useState(false);

  // ── Active sentence ─────────────────────────────────────────────────────
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(-1);
  const activeSentenceIdxRef = useRef(-1);
  const sentenceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sentenceListRef = useRef<HTMLDivElement | null>(null);

  // ── Recording ──────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [audioByIdx, setAudioByIdx] = useState<Record<number, string>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const blobUrlsRef = useRef<string[]>([]);
  const recordingForIdxRef = useRef<number | null>(null);
  useEffect(
    () => () => blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u)),
    [],
  );

  // ── Playback settings ──────────────────────────────────────────────────
  const [playbackSpeed, _setPlaybackSpeed] = useState(1);
  const playbackSpeedRef = useRef(1);
  const [pauseEachSentence, _setPauseEachSentence] = useState(false);
  const pauseEachSentenceRef = useRef(false);
  const pausedAtBoundaryRef = useRef(false);
  // Blocks polling from snapping back to old position while seek propagates
  const seekingUntilRef = useRef<number>(0);

  function setPlaybackSpeed(speed: number) {
    playbackSpeedRef.current = speed;
    _setPlaybackSpeed(speed);
    playerRef.current?.setPlaybackRate(speed);
  }

  function setPauseEachSentence(val: boolean) {
    pauseEachSentenceRef.current = val;
    _setPauseEachSentence(val);
  }

  // ── Session callbacks ──────────────────────────────────────────────────
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const notifySentences = useCallback((data: Sentence[]) => {
    setSentences(data);
    if (data.length > 0) {
      optsRef.current?.onSentencesChange?.(data);
      optsRef.current?.onScriptTextChange?.(data.map((s) => s.text).join("\n"));
    }
  }, []);

  // ── Video sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sentences.length) return;
    const timer = setInterval(() => {
      // Frozen while paused at boundary — only user action (keys / click) can unfreeze.
      if (pausedAtBoundaryRef.current) return;
      // Frozen briefly after a manual seek so the player time can propagate.
      if (Date.now() < seekingUntilRef.current) return;

      const ms = (playerRef.current?.getCurrentTime() ?? 0) * 1000;
      let idx = -1;
      for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].startMs <= ms) idx = i;
        else break;
      }
      if (idx !== activeSentenceIdxRef.current) {
        if (
          pauseEachSentenceRef.current &&
          idx > activeSentenceIdxRef.current &&
          activeSentenceIdxRef.current >= 0
        ) {
          // Pause at end of current sentence. UI stays on current sentence.
          // User can: Space = replay, → = next, ← = prev.
          playerRef.current?.pauseVideo();
          pausedAtBoundaryRef.current = true;
          return;
        }
        activeSentenceIdxRef.current = idx;
        setActiveSentenceIdx(idx);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [sentences]);

  // ── Auto-scroll sentence pills (always pin active to top of container) ──
  useEffect(() => {
    if (activeSentenceIdx < 0) return;
    const container = sentenceListRef.current;
    const el = sentenceRefs.current[activeSentenceIdx];
    if (!container || !el) return;
    const elTop = el.offsetTop - container.offsetTop;
    container.scrollTo({ top: elTop - 8, behavior: "smooth" });
  }, [activeSentenceIdx]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (
        document.activeElement as HTMLElement
      )?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      const player = playerRef.current;

      const goTo = (idx: number) => {
        if (idx < 0 || idx >= sentences.length) return;
        pausedAtBoundaryRef.current = false;
        seekingUntilRef.current = Date.now() + 700;
        player?.seekTo(sentences[idx].startMs / 1000, true);
        player?.playVideo();
        activeSentenceIdxRef.current = idx;
        setActiveSentenceIdx(idx);
      };

      switch (e.key) {
        case " ":
        case "ArrowDown":
          e.preventDefault();
          if (pausedAtBoundaryRef.current) {
            // Replay current sentence from the start
            const cur = activeSentenceIdxRef.current;
            if (cur >= 0 && cur < sentences.length) {
              player?.seekTo(sentences[cur].startMs / 1000, true);
            }
            pausedAtBoundaryRef.current = false;
            player?.playVideo();
          } else {
            player?.getPlayerState() === 1
              ? player?.pauseVideo()
              : player?.playVideo();
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey || pauseEachSentenceRef.current)
            goTo(activeSentenceIdxRef.current - 1);
          else player?.seekTo((player?.getCurrentTime() ?? 0) - 5, true);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey || pauseEachSentenceRef.current)
            goTo(activeSentenceIdxRef.current + 1);
          else player?.seekTo((player?.getCurrentTime() ?? 0) + 5, true);
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [sentences]);

  function handlePlayerReady(event: YouTubeEvent) {
    playerRef.current = event.target as unknown as YTPlayer;
    playerRef.current?.setPlaybackRate(playbackSpeedRef.current);
  }

  async function handleImproveWithAI() {
    if (!sentences.length) return;
    setImprovingTranscript(true);
    setScriptError("");
    try {
      const CHUNK = 25;
      const improved: Sentence[] = [];
      for (let start = 0; start < sentences.length; start += CHUNK) {
        const chunk = sentences.slice(start, start + CHUNK);
        const raw = chunk.map((s) => s.text).join("\n");
        const res = await fetch("/api/transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(json?.segments)) {
          setScriptError(json?.error ?? "AI improvement failed");
          return;
        }
        const segs = json.segments as any[];
        const rangeStart = chunk[0].startMs;
        const rangeEnd = chunk[chunk.length - 1].endMs;
        const range = rangeEnd - rangeStart;
        segs.forEach((seg, i) => {
          improved.push({
            text: String(seg.text ?? seg.caption ?? "").trim(),
            startMs: Math.round(rangeStart + (i / segs.length) * range),
            endMs: Math.round(rangeStart + ((i + 1) / segs.length) * range),
          });
        });
      }
      notifySentences(improved);
      sentenceRefs.current = [];
      setActiveSentenceIdx(-1);
      activeSentenceIdxRef.current = -1;
    } catch (e: any) {
      setScriptError(String(e?.message ?? e));
    } finally {
      setImprovingTranscript(false);
    }
  }

  function goToSentence(idx: number) {
    if (idx < 0 || idx >= sentences.length) return;
    pausedAtBoundaryRef.current = false;
    seekingUntilRef.current = Date.now() + 700;
    playerRef.current?.seekTo(sentences[idx].startMs / 1000, true);
    playerRef.current?.playVideo();
    activeSentenceIdxRef.current = idx;
    setActiveSentenceIdx(idx);
  }

  function replaceSentences(nextSentences: Sentence[]) {
    notifySentences(nextSentences);
    sentenceRefs.current = [];
    setActiveSentenceIdx(-1);
    activeSentenceIdxRef.current = -1;
  }

  // Preview-only re-segment — updates state locally without persisting to DB.
  function previewSentences(nextSentences: Sentence[]) {
    setSentences(nextSentences);
    sentenceRefs.current = [];
    setActiveSentenceIdx(-1);
    activeSentenceIdxRef.current = -1;
  }

  function applyVietnameseTranslations(viByIdx: Record<number, string>) {
    if (!sentences.length) return;

    let changed = false;
    const next = sentences.map((sentence, idx) => {
      const viText = viByIdx[idx]?.trim();
      if (!viText || viText === sentence.viText) return sentence;
      changed = true;
      return { ...sentence, viText };
    });

    if (!changed) return;

    setSentences(next);
    optsRef.current?.onSentencesChange?.(next);
    optsRef.current?.onScriptTextChange?.(next.map((s) => s.text).join("\n"));
  }

  function onToggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
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
        mr.onstart = () => setIsRecording(true);
        mr.onstop = () => {
          setIsRecording(false);
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          blobUrlsRef.current.push(url);
          const idx = recordingForIdxRef.current;
          if (idx !== null) {
            setAudioByIdx((prev) => ({ ...prev, [idx]: url }));
          }
        };
        mr.start(250);
        mediaRecorderRef.current = mr;
      })
      .catch(() => {});
  }

  return {
    videoId,
    playerRef,
    sentences,
    scriptError,
    improvingTranscript,
    activeSentenceIdx,
    sentenceRefs,
    sentenceListRef,
    isRecording,
    playbackSpeed,
    pauseEachSentence,
    setPlaybackSpeed,
    setPauseEachSentence,
    lastAudioUrl:
      activeSentenceIdx >= 0 ? (audioByIdx[activeSentenceIdx] ?? null) : null,
    handlePlayerReady,
    handleImproveWithAI,
    goToSentence,
    replaceSentences,
    previewSentences,
    applyVietnameseTranslations,
    onToggleRecording,
  };
}
