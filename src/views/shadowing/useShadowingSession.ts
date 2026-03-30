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
import { useTTS } from "@/hooks/useTTS";
import type { YTPlayer, ShadowTurn, Sentence } from "./types";
import {
  extractVideoId,
  extractReview,
  newId,
  splitScriptIntoSentences,
} from "./utils";
import { DEFAULT_SPEED } from "@/features/shadowing/shared/constants";

export function useShadowingSession() {
  const [mode, setMode] = useState<"youtube" | "script">("youtube");
  const [urlInput, setUrlInput] = useState("");
  const [scriptInput, setScriptInput] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [urlError, setUrlError] = useState("");
  const playerRef = useRef<YTPlayer | null>(null);

  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptError, setScriptError] = useState("");
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(-1);
  const activeSentenceIdxRef = useRef(-1);
  const sentenceItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [recordingForIdx, setRecordingForIdx] = useState<number | null>(null);

  const [ttsVoice, setTtsVoice] = useState("en-US-Neural2-F");
  const [ttsSpeed, setTtsSpeed] = useState(DEFAULT_SPEED);
  const [hearingIdx, setHearingIdx] = useState<number | null>(null);

  // Change default TTS voice and speed when switching modes
  useEffect(() => {
    if (mode === "script") {
      setTtsVoice("edge-native");
      setTtsSpeed(DEFAULT_SPEED);
    } else {
      setTtsVoice("en-US-Neural2-F");
      setTtsSpeed(DEFAULT_SPEED);
    }
  }, [mode]);
  const {
    speak,
    stop: stopTTS,
    loading: ttsLoading,
    playing: ttsPlaying,
  } = useTTS();

  // Initialize speech recognition early so isRecording is available
  const {
    start: startSoniox,
    stop: stopSoniox,
    isRecording,
    transcript,
    partial,
    error: sonioxError,
  } = useSoniox({
    source: "mic",
  });

  // Script mode specific settings
  const [autoPronounceSentence, setAutoPronounceSentence] = useState(false);
  const [loopSentence, setLoopSentence] = useState(false);
  const loopCountRef = useRef(0);
  const loopTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!ttsPlaying) setHearingIdx(null);
  }, [ttsPlaying]);

  // Auto-pronounce sentence when active changes (Script mode only)
  useEffect(() => {
    if (
      mode === "script" &&
      autoPronounceSentence &&
      activeSentenceIdx >= 0 &&
      sentences[activeSentenceIdx] &&
      !ttsPlaying &&
      !isRecording
    ) {
      const handleAutoSpeak = async () => {
        const delay = mode === "script" ? 300 : 0;
        await new Promise((r) => setTimeout(r, delay));
        if (activeSentenceIdx >= 0 && sentences[activeSentenceIdx]) {
          setHearingIdx(activeSentenceIdx);
          // Initialize loop counter if looping is enabled
          if (loopSentence) {
            loopCountRef.current = 2; // Will play 2 more times after this first play
          }
          await speak(sentences[activeSentenceIdx].text, ttsVoice, ttsSpeed);
        }
      };
      handleAutoSpeak().catch(() => {});
    }
  }, [
    activeSentenceIdx,
    mode,
    autoPronounceSentence,
    sentences,
    ttsPlaying,
    isRecording,
    ttsVoice,
    ttsSpeed,
    loopSentence,
    speak,
  ]);

  // Loop sentence playback (Script mode only)
  // When loopSentence is enabled and a sentence is being heard, replay it 2 more times
  useEffect(() => {
    if (
      mode === "script" &&
      loopSentence &&
      hearingIdx !== null &&
      hearingIdx >= 0 &&
      !ttsPlaying &&
      sentences[hearingIdx]
    ) {
      const loopRemaining = loopCountRef.current;
      if (loopRemaining > 0) {
        loopTimerRef.current = setTimeout(() => {
          loopCountRef.current = loopRemaining - 1;
          setHearingIdx(hearingIdx); // Trigger re-play
          speak(sentences[hearingIdx].text, ttsVoice, ttsSpeed).catch(() => {});
        }, 3000); // 3 seconds delay
      }
    }

    return () => {
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    };
  }, [
    hearingIdx,
    mode,
    loopSentence,
    sentences,
    ttsPlaying,
    ttsVoice,
    ttsSpeed,
    speak,
  ]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pendingTurnIdRef = useRef<string | null>(null);
  const blobUrlsRef = useRef<string[]>([]);
  useEffect(
    () => () => blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u)),
    [],
  );

  const [turns, setTurns] = useState<ShadowTurn[]>([]);
  const [coachLoading, setCoachLoading] = useState(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTtsSettings, setShowTtsSettings] = useState(false);

  const scores = turns
    .map((t) => t.review?.score)
    .filter((s): s is number => typeof s === "number");
  const overallScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

  const submitTranscript = useCallback(
    async (transcript: string) => {
      const text = transcript.trim();
      if (!text) return;
      const id = newId();
      pendingTurnIdRef.current = id;
      const currentSentenceIdx = recordingForIdx ?? undefined;
      setRecordingForIdx(null);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setTurns((prev) => [
        ...prev,
        {
          id,
          text,
          sentenceIdx: currentSentenceIdx,
          feedback: null,
          review: null,
          timestamp: Date.now(),
        },
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
        setTurns((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, feedback: feedbackText, review } : t,
          ),
        );
      } catch {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, feedback: "Could not get feedback. Try again." }
              : t,
          ),
        );
      } finally {
        setCoachLoading(false);
      }
    },
    [videoTitle, recordingForIdx],
  );

  const startRef = useRef(startSoniox);
  const stopRef = useRef(stopSoniox);

  useEffect(() => {
    startRef.current = startSoniox;
    stopRef.current = stopSoniox;
  }, [startSoniox, stopSoniox]);

  useEffect(() => () => stopRef.current(), []);

  async function finishRecording() {
    stopRef.current();
    const finalText = (transcript || partial).trim();
    if (finalText) {
      await submitTranscript(finalText);
    }
  }

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
          const blob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          const url = URL.createObjectURL(blob);
          blobUrlsRef.current.push(url);
          const tid = pendingTurnIdRef.current;
          if (tid) {
            setTurns((prev) =>
              prev.map((t) => (t.id === tid ? { ...t, audioUrl: url } : t)),
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

  // Video sync effect - only run in YouTube mode
  useEffect(() => {
    if (mode !== "youtube" || !sentences.length) return;
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
  }, [sentences, mode]);

  useEffect(() => {
    if (activeSentenceIdx >= 0) {
      sentenceItemRefs.current[activeSentenceIdx]?.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });
    }
  }, [activeSentenceIdx]);

  const keyHandlerRef = useRef<(e: globalThis.KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandlerRef.current = (e: globalThis.KeyboardEvent) => {
      const tag = (
        document.activeElement as HTMLElement
      )?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      const player = playerRef.current;

      // Helper: go to sentence in both modes
      const goToSentence = (idx: number) => {
        if (idx < 0 || idx >= sentences.length) return;
        if (mode === "youtube" && player) {
          player.seekTo(sentences[idx].startMs / 1000, true);
          player.playVideo();
        }
        setActiveSentenceIdx(idx);
        activeSentenceIdxRef.current = idx;
      };

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (mode === "youtube" && player) {
            // YouTube: play/pause video
            player.getPlayerState() === 1
              ? player.pauseVideo()
              : player.playVideo();
          } else if (mode === "script") {
            // Script: repeat sentence
            if (activeSentenceIdx >= 0) {
              setHearingIdx(activeSentenceIdx);
              void speak(sentences[activeSentenceIdx].text, ttsVoice, ttsSpeed);
            }
          }
          break;

        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          if (mode === "youtube" && e.shiftKey) {
            const prev = Math.max(0, activeSentenceIdxRef.current - 1);
            if (sentences[prev]) {
              goToSentence(prev);
            }
          } else if (mode === "script") {
            const prev = Math.max(0, activeSentenceIdxRef.current - 1);
            goToSentence(prev);
          } else if (mode === "youtube" && !e.shiftKey) {
            // YouTube: seek -5s
            player?.seekTo((player.getCurrentTime() ?? 0) - 5, true);
          }
          break;

        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          if (mode === "youtube" && e.shiftKey) {
            const next = Math.min(
              sentences.length - 1,
              activeSentenceIdxRef.current + 1,
            );
            if (sentences[next]) {
              goToSentence(next);
            }
          } else if (mode === "script") {
            const next = Math.min(
              sentences.length - 1,
              activeSentenceIdxRef.current + 1,
            );
            goToSentence(next);
          } else if (mode === "youtube" && !e.shiftKey) {
            // YouTube: seek +5s
            player?.seekTo((player.getCurrentTime() ?? 0) + 5, true);
          }
          break;

        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          if (mode === "youtube") {
            // YouTube: play/pause
            if (player) {
              player.getPlayerState() === 1
                ? player.pauseVideo()
                : player.playVideo();
            }
          } else if (mode === "script") {
            // Script: repeat sentence
            if (activeSentenceIdx >= 0) {
              setHearingIdx(activeSentenceIdx);
              void speak(sentences[activeSentenceIdx].text, ttsVoice, ttsSpeed);
            }
          }
          break;

        case "r":
        case "R":
          e.preventDefault();
          if (isRecording) stopRef.current();
          else startRecording();
          break;

        case "?":
          setShowShortcuts((value) => !value);
          break;

        case "Escape":
          setShowShortcuts(false);
          setShowTtsSettings(false);
          break;
      }
    };
  }, [
    mode,
    sentences,
    activeSentenceIdx,
    isRecording,
    speak,
    ttsVoice,
    ttsSpeed,
    startRecording,
  ]);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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

  function handleLoadScript(e?: FormEvent) {
    e?.preventDefault();
    setUrlError("");
    setScriptError("");
    const trimmed = scriptInput.trim();
    if (!trimmed) {
      setScriptError("Please paste a script or text");
      return;
    }
    try {
      const sentences = splitScriptIntoSentences(trimmed);
      if (sentences.length === 0) {
        setScriptError("Could not extract sentences from the script");
        return;
      }
      setSentences(sentences);
      setVideoTitle("Script Practice");
      setActiveSentenceIdx(0);
      activeSentenceIdxRef.current = 0;
      sentenceItemRefs.current = [];
    } catch (err) {
      setScriptError(
        `Error processing script: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
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
    const sentence = sentences[idx];
    playerRef.current?.seekTo(sentence.startMs / 1000, true);
    playerRef.current?.playVideo();
    setActiveSentenceIdx(idx);
    activeSentenceIdxRef.current = idx;
  }

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

  function onClearSession() {
    setTurns([]);
    historyRef.current = [];
  }

  function onToggleRecording() {
    if (isRecording) {
      void finishRecording();
    } else {
      if (activeSentenceIdx >= 0) {
        setRecordingForIdx(activeSentenceIdx);
      }
      startRecording();
    }
  }

  function onListenAIVoice() {
    if (activeSentenceIdx >= 0) {
      handleSentenceHear(activeSentenceIdx);
    }
  }

  function onListenOriginal() {
    if (activeSentenceIdx >= 0) {
      goToSentenceIdx(activeSentenceIdx);
    }
  }

  function onPrevSentence() {
    if (activeSentenceIdx > 0) {
      goToSentenceIdx(activeSentenceIdx - 1);
    }
  }

  function onNextSentence() {
    if (activeSentenceIdx < sentences.length - 1) {
      goToSentenceIdx(activeSentenceIdx + 1);
    }
  }

  const activeSentenceText =
    activeSentenceIdx >= 0 ? (sentences[activeSentenceIdx]?.text ?? "") : "";

  const activeSentenceAudioUrl = (() => {
    if (activeSentenceIdx < 0) return null;
    for (let i = turns.length - 1; i >= 0; i -= 1) {
      const turn = turns[i];
      if (turn.sentenceIdx === activeSentenceIdx && turn.audioUrl) {
        return turn.audioUrl;
      }
    }
    return null;
  })();

  return {
    mode,
    setMode,
    urlInput,
    setUrlInput,
    scriptInput,
    setScriptInput,
    videoId,
    videoTitle,
    urlError,
    playerRef,
    sentences,
    scriptLoading,
    scriptError,
    activeSentenceIdx,
    sentenceItemRefs,
    recordingForIdx,
    activeSentenceText,
    ttsVoice,
    setTtsVoice,
    ttsSpeed,
    setTtsSpeed,
    hearingIdx,
    ttsLoading,
    ttsPlaying,
    isRecording,
    transcript,
    partial,
    sonioxError,
    turns,
    coachLoading,
    showShortcuts,
    setShowShortcuts,
    showTtsSettings,
    setShowTtsSettings,
    overallScore,
    hasTurns: turns.length > 0,
    activeSentenceAudioUrl,
    autoPronounceSentence,
    setAutoPronounceSentence,
    loopSentence,
    setLoopSentence,
    handleLoadVideo,
    handleLoadScript,
    handlePlayerReady,
    handleFetchScript,
    goToSentenceIdx,
    onToggleRecording,
    onListenOriginal,
    onListenAIVoice,
    onPrevSentence,
    onNextSentence,
    onClearSession,
  };
}
