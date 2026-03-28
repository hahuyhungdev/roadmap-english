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
import { extractVideoId, extractReview, newId } from "./utils";

export function useShadowingSession() {
  const [urlInput, setUrlInput] = useState("");
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
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [hearingIdx, setHearingIdx] = useState<number | null>(null);
  const { speak, stop: stopTTS, loading: ttsLoading, playing: ttsPlaying } =
    useTTS();

  useEffect(() => {
    if (!ttsPlaying) setHearingIdx(null);
  }, [ttsPlaying]);

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
        const mimeType = MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus",
        )
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
        case "ArrowDown":
          e.preventDefault();
          if (player) {
            player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo();
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
  });

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
    activeSentenceIdx >= 0 ? sentences[activeSentenceIdx]?.text ?? "" : "";

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
    urlInput,
    setUrlInput,
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
    handleLoadVideo,
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
