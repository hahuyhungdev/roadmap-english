"use client";

import {
  useState,
  useRef,
  useEffect,
  useEffectEvent,
  type FormEvent,
} from "react";
import useSoniox from "@/hooks/useSoniox";
import { useTTSSettings } from "../shared/useTTSSettings";
import type { ShadowTurn, Sentence, SessionOpts } from "../shared/types";
import { newId, splitScriptIntoSentences } from "../shared/utils";
import {
  DEFAULT_SPEED,
  DEFAULT_VOICE_BY_PROVIDER,
} from "@/features/shadowing/shared/constants";

export function useScriptShadowing(opts?: SessionOpts) {
  // ── Script / sentences ────────────────────────────────────────────────────
  const [scriptInput, setScriptInput] = useState(opts?.initialScriptText ?? "");
  const [scriptError, setScriptError] = useState("");
  const [sentences, setSentences] = useState<Sentence[]>(
    opts?.initialSentences ?? [],
  );
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(
    opts?.initialActiveSentenceIdx ?? -1,
  );
  const sentenceRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // ── TTS ───────────────────────────────────────────────────────────────────
  const tts = useTTSSettings({
    provider: "google",
    accent: DEFAULT_VOICE_BY_PROVIDER.google,
    speed: DEFAULT_SPEED,
  });

  // ── Playback options ──────────────────────────────────────────────────────
  const [autoPronounceSentence, setAutoPronounceSentence] = useState(true);
  const [loopSentence, setLoopSentence] = useState(true);
  const loopCountRef = useRef(0);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hearingSentenceIdx = useRef(-1);

  // ── Recording ─────────────────────────────────────────────────────────────
  const {
    start: startSoniox,
    stop: stopSoniox,
    isRecording,
    transcript,
    partial,
    error: sonioxError,
  } = useSoniox({ source: "mic" });

  // FIX #10 — sync refs inline, not inside a useEffect (no one-render lag)
  const startRef = useRef(startSoniox);
  const stopRef = useRef(stopSoniox);
  startRef.current = startSoniox;
  stopRef.current = stopSoniox;

  // FIX #1 — keep latest transcript/partial in refs so onToggleRecording
  //          always reads the finalised value, not a stale closure snapshot.
  const transcriptRef = useRef(transcript);
  const partialRef = useRef(partial);
  transcriptRef.current = transcript;
  partialRef.current = partial;

  // Stop recording on unmount
  useEffect(() => () => stopRef.current(), []);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const blobUrlsRef = useRef<string[]>([]);
  const pendingTurnIdRef = useRef<string | null>(null);
  const recordingForIdxRef = useRef<number | null>(null);

  // Revoke all blob URLs on unmount
  useEffect(
    () => () => blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u)),
    [],
  );

  // ── Coaching turns ────────────────────────────────────────────────────────
  const [turns, setTurns] = useState<ShadowTurn[]>([]);

  // ── Session persistence ───────────────────────────────────────────────────
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (activeSentenceIdx >= 0)
      optsRef.current?.onActiveSentenceChange?.(activeSentenceIdx);
  }, [activeSentenceIdx]);

  // ── Auto-scroll active sentence into view ─────────────────────────────────
  useEffect(() => {
    if (activeSentenceIdx >= 0) {
      sentenceRefs.current[activeSentenceIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
      // Pre-buffer next 3 sentences for instant playback.
      // Use tts.preBuffer (stable useCallback) NOT tts object — the tts object
      // changes on every status update which would cause this effect to re-run
      // and fire duplicate PUT /api/tts calls on every idle→loading→playing→idle cycle.
      const upcoming = sentences
        .slice(activeSentenceIdx + 1, activeSentenceIdx + 4)
        .map((s) => s.text);
      if (upcoming.length > 0) tts.preBuffer(upcoming);
    }
  }, [activeSentenceIdx, sentences, tts.preBuffer]);

  // ── Clear hearingIdx only when loop is completely done ──────────────────
  // (Don't clear on every TTS finish — that breaks the loop effect! Only clear
  //  when loopSentence is disabled or loopCount reaches 0)
  useEffect(() => {
    if (!loopSentence && loopCountRef.current === 0) {
      hearingSentenceIdx.current = -1;
    }
  }, [loopSentence]);

  // Also clear when user changes sentences
  useEffect(() => {
    if (activeSentenceIdx !== hearingSentenceIdx.current) {
      hearingSentenceIdx.current = -1;
    }
  }, [activeSentenceIdx]);

  // ── Reset loop count when loopSentence toggles (FIX #6) ──────────────────
  useEffect(() => {
    loopCountRef.current = loopSentence ? 2 : 0;
  }, [loopSentence]);

  // ── Auto-pronounce on sentence change ────────────────────────────────────
  useEffect(() => {
    if (
      !autoPronounceSentence ||
      activeSentenceIdx < 0 ||
      !sentences[activeSentenceIdx] ||
      tts.playing ||
      isRecording
    )
      return;

    const text = sentences[activeSentenceIdx].text;
    const timer = setTimeout(async () => {
      hearingSentenceIdx.current = activeSentenceIdx;
      // loopSentence is intentionally NOT in deps; read from ref to avoid
      // restarting the effect when it toggles mid-sentence.
      if (loopSentence) loopCountRef.current = 2;
      await tts.speak(text);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSentenceIdx, autoPronounceSentence]);

  // ── Loop playback (FIX #4 — removed `tts` object dep; FIX #5 — mounted guard) ──
  useEffect(() => {
    if (!loopSentence || tts.playing || hearingSentenceIdx.current < 0) return;

    const remaining = loopCountRef.current;
    if (remaining <= 0) return;

    const text = sentences[hearingSentenceIdx.current]?.text;
    if (!text) return;

    let mounted = true;

    loopTimerRef.current = setTimeout(async () => {
      loopCountRef.current = remaining - 1;
      if (mounted) await tts.speak(text);
    }, 3000);

    return () => {
      mounted = false;
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    };
    // FIX #4 — depend on tts.speak (stable callback) instead of entire tts object
  }, [loopSentence, sentences, tts.playing, tts.speak]);

  // ── Actions ───────────────────────────────────────────────────────────────

  // Create a turn when recording stops — no AI, just tracks text + audio URL.
  const submitTranscript = useEffectEvent((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const id = newId();
    pendingTurnIdRef.current = id;
    const sentenceIdx = recordingForIdxRef.current ?? undefined;
    recordingForIdxRef.current = null;

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

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
  });

  // FIX #2 — useEffectEvent keeps this stable while always having access to latest activeSentenceIdx
  const startRecordingAction = useEffectEvent(() => {
    audioChunksRef.current = [];
    recordingForIdxRef.current =
      activeSentenceIdx >= 0 ? activeSentenceIdx : null;

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
          // Don't stop stream tracks here — Soniox may still need them.
          // Tracks are stopped when Soniox stop() is called.
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

          const url = URL.createObjectURL(blob);
          blobUrlsRef.current.push(url);

          const tid = pendingTurnIdRef.current;
          if (tid) {
            setTurns((prev) =>
              prev.map((t) => (t.id === tid ? { ...t, audioUrl: url } : t)),
            );
          }
        };

        // FIX #3 — release mic if MediaRecorder.start() throws
        try {
          mr.start(250);
          mediaRecorderRef.current = mr;
        } catch (err) {
          stream.getTracks().forEach((t) => t.stop());
          console.error("[recording] MediaRecorder.start failed:", err);
          return;
        }

        // Share the same mic stream with Soniox STT (avoids opening a 2nd mic)
        startRef.current({ source: "mic", stream });
      })
      .catch(() => {});
  });

  // ── Keyboard shortcuts (FIX #11 — useEffectEvent always has latest activeSentenceIdx) ────────
  const handleKey = useEffectEvent((e: KeyboardEvent) => {
    const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    const goTo = (idx: number) => {
      if (idx >= 0 && idx < sentences.length) setActiveSentenceIdx(idx);
    };

    switch (e.key) {
      case " ":
      case "s":
      case "S":
        e.preventDefault();
        if (activeSentenceIdx >= 0 && sentences[activeSentenceIdx]) {
          hearingSentenceIdx.current = activeSentenceIdx;
          void tts.speak(sentences[activeSentenceIdx].text);
        }
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        e.preventDefault();
        goTo(activeSentenceIdx - 1);
        break;
      case "ArrowRight":
      case "d":
      case "D":
        e.preventDefault();
        goTo(activeSentenceIdx + 1);
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
        if (activeSentenceIdx >= 0 && sentences[activeSentenceIdx]) {
          hearingSentenceIdx.current = activeSentenceIdx;
          void tts.speak(sentences[activeSentenceIdx].text);
        }
        break;
      case "r":
      case "R":
        e.preventDefault();
        if (isRecording) stopRef.current();
        else startRecordingAction();
        break;
    }
  });

  // Register keyboard listener (stable because handleKey is useEffectEvent)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKey(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  // FIX #9 — loading a new script clears the previous session completely
  function handleLoadScript(e?: FormEvent) {
    e?.preventDefault();
    setScriptError("");
    const trimmed = scriptInput.trim();
    if (!trimmed) {
      setScriptError("Please paste a script or text");
      return;
    }
    // If the script looks like dialogue/markdown with speaker prefixes
    // (e.g. "John: Hello" or "- John: Hello"), prefer extracting only
    // the main character's lines to practice with. Otherwise fall back to
    // generic sentence splitting.
    let result: ReturnType<typeof splitScriptIntoSentences> = [];

    // Split into raw lines to detect speaker patterns and blockquote dialogues
    const lines = trimmed
      .split(/\r?\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    const speakerRegex = /^(?:[-*]\s*)?([A-Za-z0-9 _'"-]{1,40}):\s*(.+)$/;
    const speakers: Record<string, string[]> = {};
    // First pass: explicit "Name: text" style
    for (const line of lines) {
      const m = line.match(speakerRegex);
      if (m) {
        const who = m[1].trim();
        const text = m[2].trim();
        speakers[who] = speakers[who] || [];
        speakers[who].push(text);
      }
    }

    // If no explicit speaker prefixes, detect blockquote-style dialogues
    let usedBlockquotes = false;
    if (Object.keys(speakers).length === 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const bq = line.match(/^[>]+\s*(.+)$/);
        if (bq) {
          usedBlockquotes = true;
          let whoKey = "QUOTE";
          let headingLine: string | null = null;
          for (let j = i - 1; j >= 0; j--) {
            const hd = lines[j].match(/^#{1,6}\s*(.+)$/);
            if (hd) {
              let content = hd[1].trim();
              content = content.replace(/^[-*\s]+/, "");
              content = content.replace(/^[^a-zA-Z0-9]+/, "");
              content = content.replace(/^\d+[\.\)\-:]*\s*/, "");
              content = content.replace(/[!?\.\s]+$/, "").trim();
              whoKey = content || "QUOTE";
              headingLine = content;
              break;
            }
          }

          speakers[whoKey] = speakers[whoKey] || [];
          if (headingLine && speakers[whoKey].length === 0) {
            speakers[whoKey].push(headingLine);
          }
          speakers[whoKey].push(bq[1].trim());
        }
      }
    }

    if (Object.keys(speakers).length === 0) {
      speakers["MAIN"] = [trimmed];
    }

    const speakerNames = Object.keys(speakers);
    if (speakerNames.length > 0) {
      if (usedBlockquotes && speakerNames.length > 1) {
        const allText = speakerNames
          .map((k) => speakers[k].join("\n\n"))
          .join("\n\n");
        result = splitScriptIntoSentences(allText);
      } else {
        speakerNames.sort((a, b) => speakers[b].length - speakers[a].length);
        const main = speakerNames[0];
        const mainText = speakers[main].join("\n\n");
        result = splitScriptIntoSentences(mainText);
      }
    } else {
      result = splitScriptIntoSentences(trimmed);
    }

    if (result.length === 0) {
      setScriptError("Could not extract sentences");
      return;
    }
    setSentences(result);
    optsRef.current?.onSentencesChange?.(result);
    optsRef.current?.onScriptTextChange?.(trimmed);
    setActiveSentenceIdx(0);
    sentenceRefs.current = [];
    // Clear previous session
    setTurns([]);

    // Cache script in DB (fire and forget)
    fetch("/api/shadowing/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script: trimmed, sentences: result }),
    }).catch(() => {});
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeSentenceText = sentences[activeSentenceIdx]?.text ?? "";

  const lastAudioUrl = (() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i];
      if (t.sentenceIdx === activeSentenceIdx && t.audioUrl) return t.audioUrl;
    }
    return null;
  })();

  return {
    // Script
    scriptInput,
    setScriptInput,
    scriptError,
    sentences,
    activeSentenceIdx,
    setActiveSentenceIdx,
    sentenceRefs,
    handleLoadScript,
    // TTS (whole object — consumer destructures what it needs)
    tts,
    // Playback options
    autoPronounceSentence,
    setAutoPronounceSentence,
    loopSentence,
    setLoopSentence,
    // Recording
    isRecording,
    sonioxError,
    transcript,
    partial,
    onToggleRecording: () => {
      if (isRecording) {
        stopRef.current();
        // Read from refs to avoid stale closure values
        const text = (transcriptRef.current || partialRef.current).trim();
        if (text) submitTranscript(text);
      } else {
        startRecordingAction();
      }
    },
    // Coaching
    turns,
    onClearSession: () => {
      setTurns([]);
    },
    // Derived
    activeSentenceText,
    lastAudioUrl,
    onListenSentence: () => {
      if (activeSentenceIdx >= 0 && sentences[activeSentenceIdx]) {
        hearingSentenceIdx.current = activeSentenceIdx;
        void tts.speak(sentences[activeSentenceIdx].text);
      }
    },
    onPrev: () => {
      if (activeSentenceIdx > 0) setActiveSentenceIdx((i) => i - 1);
    },
    onNext: () => {
      if (activeSentenceIdx < sentences.length - 1)
        setActiveSentenceIdx((i) => i + 1);
    },
  };
}
