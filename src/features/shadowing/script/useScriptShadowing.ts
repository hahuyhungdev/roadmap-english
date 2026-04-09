"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
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

  // ── Sentence splitting controls ───────────────────────────────────────────
  const [minSentenceLength, setMinSentenceLength] = useState(50);
  const [maxSentenceLength, setMaxSentenceLength] = useState(120);
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

  // Refs for keyboard handler — avoids stale closures without re-registering listener
  const activeSentenceIdxRef = useRef(activeSentenceIdx);
  activeSentenceIdxRef.current = activeSentenceIdx;
  const sentencesRef = useRef(sentences);
  sentencesRef.current = sentences;
  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;

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
  const prevActiveSentenceIdxRef = useRef(activeSentenceIdx);

  const clearRecordedVoiceForSentence = useEffectEvent(
    (sentenceIdx: number) => {
      if (sentenceIdx < 0) return;

      const revoked = new Set<string>();

      setTurns((prev) => {
        let changed = false;
        const next = prev.map((t) => {
          if (t.sentenceIdx !== sentenceIdx || !t.audioUrl) return t;
          changed = true;
          revoked.add(t.audioUrl);
          return { ...t, audioUrl: undefined };
        });
        return changed ? next : prev;
      });

      if (revoked.size > 0) {
        revoked.forEach((url) => URL.revokeObjectURL(url));
        blobUrlsRef.current = blobUrlsRef.current.filter(
          (u) => !revoked.has(u),
        );
      }
    },
  );

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

  // Clear recording for the sentence being left so old user voice does not
  // overlap with sentence TTS when navigating back later.
  useEffect(() => {
    const prevIdx = prevActiveSentenceIdxRef.current;
    if (prevIdx >= 0 && prevIdx !== activeSentenceIdx) {
      clearRecordedVoiceForSentence(prevIdx);
    }
    prevActiveSentenceIdxRef.current = activeSentenceIdx;
  }, [activeSentenceIdx, clearRecordedVoiceForSentence]);

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

  const stopRecordingAndSubmitAction = useEffectEvent(() => {
    stopRef.current();
    const text = (transcriptRef.current || partialRef.current).trim();
    if (text) submitTranscript(text);
  });

  // FIX #2 — useEffectEvent keeps this stable while always having access to latest activeSentenceIdx
  const startRecordingAction = useEffectEvent(() => {
    if (activeSentenceIdx >= 0) {
      // Starting a new take should immediately discard the previous take.
      clearRecordedVoiceForSentence(activeSentenceIdx);
    }

    audioChunksRef.current = [];
    recordingForIdxRef.current =
      activeSentenceIdx >= 0 ? activeSentenceIdx : null;

    // Priority order: opus (best quality) → mp4/aac (iOS Safari) → ogg → browser default
    const MIME_PRIORITY = [
      "audio/webm;codecs=opus",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/webm",
    ];
    const mimeType =
      MIME_PRIORITY.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          // Disable all DSP processing — we want the raw mic signal.
          // AGC / noise-suppression / echo-cancel change the voice character
          // and are designed for calls, not shadowing playback.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          // 48kHz is Edge/Chrome's native WebRTC rate on Windows — avoids
          // an extra resampling pass that degrades audio quality.
          sampleRate: 48000,
          channelCount: 1,
        },
      })
      .then((stream) => {
        const mr = new MediaRecorder(
          stream,
          mimeType ? { mimeType, audioBitsPerSecond: 128_000 } : undefined,
        );

        mr.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mr.onstop = () => {
          // Don't stop stream tracks here — Soniox may still need them.
          // Tracks are stopped when Soniox stop() is called.

          // Use the actual recorded mimeType so the blob plays correctly on all
          // platforms (especially iOS which only supports audio/mp4, not webm).
          const blobType = mimeType || "audio/webm";
          const blob = new Blob(audioChunksRef.current, { type: blobType });

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

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────────────
  // Stable ref to tts methods so the keyboard handler below never needs
  // tts in its deps (tts object changes on every status update).
  const ttsRef = useRef(tts);
  ttsRef.current = tts;

  // Empty deps → listener registered exactly ONCE. All mutable values read
  // via refs so they are always up-to-date without causing re-registration.
  const handleKey = useCallback((e: KeyboardEvent) => {
    const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;

    const curIdx = activeSentenceIdxRef.current;
    const sents = sentencesRef.current;
    const code = e.code;
    const key = e.key.toLowerCase();

    const goTo = (idx: number) => {
      if (idx >= 0 && idx < sents.length) {
        ttsRef.current.stop();
        setActiveSentenceIdx(idx);
      }
    };

    if (code === "Space" || key === "s") {
      e.preventDefault();
      if (curIdx >= 0 && sents[curIdx]) {
        hearingSentenceIdx.current = curIdx;
        void ttsRef.current.speak(sents[curIdx].text);
      }
      return;
    }

    if (code === "ArrowUp") {
      e.preventDefault();
      if (isRecordingRef.current) stopRecordingAndSubmitAction();
      else startRecordingAction();
      return;
    }

    if (code === "ArrowDown") {
      e.preventDefault();
      if (curIdx >= 0 && sents[curIdx]) {
        hearingSentenceIdx.current = curIdx;
        void ttsRef.current.speak(sents[curIdx].text);
      }
      return;
    }

    if (key === "r") {
      e.preventDefault();
      if (isRecordingRef.current) stopRecordingAndSubmitAction();
      else startRecordingAction();
      return;
    }

    if (e.repeat) return;

    const wantsNext =
      code === "ArrowRight" ||
      code === "KeyD" ||
      key === "d" ||
      e.keyCode === 68;
    const wantsPrev =
      code === "ArrowLeft" ||
      code === "KeyA" ||
      key === "a" ||
      e.keyCode === 65;

    if (wantsNext && !wantsPrev) {
      e.preventDefault();
      goTo(curIdx + 1);
      return;
    }

    if (wantsPrev && !wantsNext) {
      e.preventDefault();
      goTo(curIdx - 1);
      return;
    }

    if (wantsNext && wantsPrev) {
      e.preventDefault();
      // Resolve ambiguous key/code combinations by favoring semantic key first.
      if (key === "d" || code === "ArrowRight") {
        goTo(curIdx + 1);
      } else {
        goTo(curIdx - 1);
      }
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — all values accessed via refs

  // Register keyboard listener exactly once
  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  function applyScriptSentences(scriptText: string, nextSentences: Sentence[]) {
    if (!scriptText.trim()) {
      setScriptError("Please paste a script or text");
      return;
    }
    if (!Array.isArray(nextSentences) || nextSentences.length === 0) {
      setScriptError("Could not extract sentences");
      return;
    }

    setScriptError("");
    setScriptInput(scriptText);
    setSentences(nextSentences);
    optsRef.current?.onSentencesChange?.(nextSentences);
    optsRef.current?.onScriptTextChange?.(scriptText);
    setActiveSentenceIdx(0);
    sentenceRefs.current = [];

    // Clear previous session
    setTurns([]);
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];
    pendingTurnIdRef.current = null;

    // Cache script in DB (fire and forget)
    fetch("/api/shadowing/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script: scriptText, sentences: nextSentences }),
    }).catch(() => {});
  }

  function buildScriptPreview(
    e?: FormEvent,
    customScript?: string,
    customMin?: number,
    customMax?: number,
  ) {
    e?.preventDefault();
    setScriptError("");
    const textToProcess =
      customScript !== undefined ? customScript : scriptInput;
    const trimmed = textToProcess.trim();
    if (!trimmed) {
      setScriptError("Please paste a script or text");
      return null;
    }

    const minLen = customMin !== undefined ? customMin : minSentenceLength;
    const maxLen = customMax !== undefined ? customMax : maxSentenceLength;

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

    const speakerRegex = /^(?:[-*]\s*)?([A-Za-z][A-Za-z' -]{0,29}):\s*(.+)$/;
    const nonSpeakerLabelRegex =
      /^(version\s*\d+|balanced\s*answer|sample\s*answer|answer|question|q\.?|a\.?|situation|task|action|result|star|strengths?|weakness(?:es)?|experience|background|summary|conclusion|intro(?:duction)?)$/i;
    const speakers: Record<string, string[]> = {};
    let explicitSpeakerLineCount = 0;
    // First pass: explicit "Name: text" style
    for (const line of lines) {
      const m = line.match(speakerRegex);
      if (m) {
        const who = m[1].trim();
        const text = m[2].trim();
        if (nonSpeakerLabelRegex.test(who)) continue;
        explicitSpeakerLineCount++;
        speakers[who] = speakers[who] || [];
        speakers[who].push(text);
      }
    }

    // Only treat as real speaker dialogue when it clearly looks like one.
    // This avoids dropping content for normal notes that contain labels like
    // "Version 1:" or "Balanced Answer:".
    const explicitSpeakerNames = Object.keys(speakers);
    const repeatedSpeakerCount = explicitSpeakerNames.filter(
      (name) => (speakers[name]?.length ?? 0) >= 2,
    ).length;
    const looksLikeDialogue =
      explicitSpeakerNames.length >= 2 &&
      explicitSpeakerLineCount >= 4 &&
      repeatedSpeakerCount >= 1;
    if (!looksLikeDialogue) {
      for (const key of explicitSpeakerNames) delete speakers[key];
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
        result = splitScriptIntoSentences(allText, minLen, maxLen);
      } else {
        speakerNames.sort((a, b) => speakers[b].length - speakers[a].length);
        const main = speakerNames[0];
        const mainText = speakers[main].join("\n\n");
        result = splitScriptIntoSentences(mainText, minLen, maxLen);
      }
    } else {
      result = splitScriptIntoSentences(trimmed, minLen, maxLen);
    }

    if (result.length === 0) {
      setScriptError("Could not extract sentences");
      return null;
    }

    return {
      scriptText: trimmed,
      sentences: result,
    };
  }

  // Keep default behavior for existing callers: process + apply immediately.
  function handleLoadScript(e?: FormEvent) {
    const preview = buildScriptPreview(e);
    if (!preview) return;
    applyScriptSentences(preview.scriptText, preview.sentences);
  }

  const onUpdateSentenceText = (idx: number, nextText: string) => {
    const trimmed = nextText.trim();
    if (!trimmed) return;

    const prev = sentencesRef.current;
    if (idx < 0 || idx >= prev.length) return;

    const next = [...prev];
    next[idx] = { ...next[idx], text: trimmed };

    setSentences(next);
    optsRef.current?.onSentencesChange?.(next);
    optsRef.current?.onScriptTextChange?.(next.map((s) => s.text).join("\n"));
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeSentenceText = sentences[activeSentenceIdx]?.text ?? "";

  // Estimate remaining time by looking at your actual average speed per sentence in this session.
  // We use your recorded turns array: time difference between first turn and last turn
  // divided by how many sentences you've worked heavily on.
  // Fallback defaults to a generous 1.5 minutes (90,000ms) per sentence if no data yet.
  const estimatedRemainingMs = (() => {
    if (activeSentenceIdx < 0 || sentences.length === 0) return 0;

    const remainingCount = Math.max(
      0,
      sentences.length - (activeSentenceIdx + 1),
    );
    if (remainingCount === 0) return 0;

    const DEFAULT_MS_PER_SENTENCE = 90000; // 1.5 minutes per sentence

    let avgMsPerSentence = DEFAULT_MS_PER_SENTENCE;

    if (turns.length > 1) {
      const firstTurnMs = turns[0].timestamp;
      const lastTurnMs = turns[turns.length - 1].timestamp;
      const elapsedMs = Math.max(0, lastTurnMs - firstTurnMs);

      // Unique sentences practiced so far based on turns
      const practicedIdxs = new Set(
        turns.map((t) => t.sentenceIdx).filter((idx) => idx !== undefined),
      );

      if (practicedIdxs.size > 0 && elapsedMs > 0) {
        // Average time spent *per practiced sentence*
        const actualAvg = elapsedMs / practicedIdxs.size;

        // Clamp the actual average to keep estimations sane between 30s and 5m per sentence
        avgMsPerSentence = Math.min(300000, Math.max(30000, actualAvg));
      }
    }

    return Math.round(avgMsPerSentence * remainingCount);
  })();

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
    buildScriptPreview,
    applyScriptSentences,
    handleLoadScript,
    onUpdateSentenceText,
    // TTS (whole object — consumer destructures what it needs)
    tts,
    // Playback options
    autoPronounceSentence,
    setAutoPronounceSentence,
    loopSentence,
    setLoopSentence,
    // Sentence splitting
    minSentenceLength,
    setMinSentenceLength,
    maxSentenceLength,
    setMaxSentenceLength,
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
    estimatedRemainingMs,
    lastAudioUrl,
    onListenSentence: () => {
      if (activeSentenceIdx >= 0 && sentences[activeSentenceIdx]) {
        hearingSentenceIdx.current = activeSentenceIdx;
        void tts.speak(sentences[activeSentenceIdx].text);
      }
    },
    onPrev: () => {
      if (activeSentenceIdx > 0) {
        tts.stop();
        setActiveSentenceIdx((i) => i - 1);
      }
    },
    onNext: () => {
      if (activeSentenceIdx < sentences.length - 1) {
        tts.stop();
        setActiveSentenceIdx((i) => i + 1);
      }
    },
  };
}
