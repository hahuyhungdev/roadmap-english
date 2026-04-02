"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { TTSProvider, TTSSettings } from "../shared/types";
import { DEFAULT_SPEED, EDGE_ACCENTS } from "../shared/constants";

// ─── Types ────────────────────────────────────────────────────────────────────
type TTSStatus = "idle" | "loading" | "playing";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLangFromVoiceId(voiceId: string): string {
  return EDGE_ACCENTS.find((a) => a.value === voiceId)?.lang ?? "en-US";
}

// Blocklist for old, robotic voices
const BLOCKLIST = ["David", "Zira", "Hedda", "Helena"];

// Robustly wait for voices to be loaded
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    speechSynthesis.addEventListener(
      "voiceschanged",
      () => resolve(speechSynthesis.getVoices()),
      { once: true },
    );
  });
}

// Find voice matching accent ID, fall back to any neural voice
async function getVoiceForAccent(
  accentId: string,
  lang = "en-US",
): Promise<SpeechSynthesisVoice | null> {
  let voices = await loadVoices();
  // "microsoft-andrew-us" → "andrew"; "microsoft-brian-us" → "brian"
  const parts = accentId.toLowerCase().split("-");
  const namePart = parts[1]; // the voice name segment

  // Try up to 6 times (Chromium loads voices asynchronously)
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 500));
      voices = await loadVoices();
    }

    if (namePart) {
      const specific = voices.find(
        (v) =>
          v.name.toLowerCase().includes(namePart) && v.lang.startsWith(lang),
      );
      if (specific) return specific;
    }

    // Fallback: any natural/neural/online voice for the lang
    const fallback = voices.find(
      (v) =>
        v.lang.startsWith(lang) &&
        (v.name.toLowerCase().includes("natural") ||
          v.name.toLowerCase().includes("neural") ||
          v.name.toLowerCase().includes("online")) &&
        !BLOCKLIST.some((name) => v.name.includes(name)),
    );
    if (fallback) return fallback;
  }
  return null;
}

// Chunk text for Edge TTS bug (~300 chars limit)
function chunkText(text: string, maxLength: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

function speakChunk(
  text: string,
  voice: SpeechSynthesisVoice,
  rate: number,
  lang: string,
  signal?: AbortSignal,
  onBoundary?: (absCharIndex: number) => void,
  chunkOffset = 0,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = lang;
    utterance.rate = rate;

    // Word-boundary tracking for text highlighting
    utterance.onboundary = (e) => {
      if (e.name === "word") onBoundary?.(chunkOffset + e.charIndex);
    };

    // Keep-alive only for long utterances — the pause/resume hack on short
    // sentences causes micro-stutters and is completely unnecessary.
    const estimatedMs = (text.split(/\s+/).length * 400) / (rate || 1);
    let keepAliveId: ReturnType<typeof setInterval> | null = null;
    if (estimatedMs > 8000) {
      keepAliveId = setInterval(() => {
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
          speechSynthesis.pause();
          speechSynthesis.resume();
        }
      }, 10000);
    }

    const cleanup = () => {
      if (keepAliveId) {
        clearInterval(keepAliveId);
        keepAliveId = null;
      }
      utterance.onboundary = null;
    };

    utterance.onend = () => {
      cleanup();
      resolve();
    };
    utterance.onerror = (e) => {
      cleanup();
      if (e.error === "interrupted" || signal?.aborted) {
        resolve();
        return;
      }
      reject(e);
    };

    // Abort listener: cancel speech when the speak() session is stopped
    signal?.addEventListener(
      "abort",
      () => {
        cleanup();
        window.speechSynthesis?.cancel();
        resolve();
      },
      { once: true },
    );

    speechSynthesis.speak(utterance);
  });
}

// ─── Audio pre-buffer cache (in-memory) ───────────────────────────────────
// Stores pre-fetched audio blobs so TTS playback is instant
const audioBufferCache = new Map<string, string>(); // key -> base64 audio
// Tracks keys currently being pre-buffered to avoid duplicate PUT requests
const preBufferInFlight = new Set<string>();

function makeCacheKey(text: string, voice: string, speed: number) {
  return `${text}|${voice}|${speed}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTTSSettings(defaults?: Partial<TTSSettings>) {
  const [provider, setProvider] = useState<TTSProvider>(
    defaults?.provider ?? "edge",
  );
  const [accent, setAccent] = useState(
    defaults?.accent ?? "microsoft-andrew-us",
  );
  const [speed, setSpeed] = useState(defaults?.speed ?? DEFAULT_SPEED);
  const [status, setStatus] = useState<TTSStatus>("idle");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  // Index of the character currently being spoken (-1 = not speaking).
  // Populated by SpeechSynthesisUtterance.onboundary for word highlight.
  const [speakingCharIndex, setSpeakingCharIndex] = useState(-1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const speakAbortRef = useRef<AbortController | null>(null);
  const lastSpeakRef = useRef<{ text: string; at: number } | null>(null);
  // Pre-resolved voice — avoids async lookup latency on every speak() call
  const voiceCacheRef = useRef<SpeechSynthesisVoice | null>(null);

  // Keep latest state in refs for stable callbacks
  const providerRef = useRef(provider);
  const accentRef = useRef(accent);
  const speedRef = useRef(speed);
  const statusRef = useRef<TTSStatus>("idle");

  useEffect(() => {
    providerRef.current = provider;
  }, [provider]);
  useEffect(() => {
    accentRef.current = accent;
  }, [accent]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // ── Load browser voices ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => setVoices(speechSynthesis.getVoices());
    load();
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);
  // ── Pre-resolve voice when accent changes ─────────────────────────────────
  // Avoids the 0–3 s async voice lookup on the first speak() call.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const lang = getLangFromVoiceId(accent);
    voiceCacheRef.current = null; // clear stale cache when accent changes
    getVoiceForAccent(accent, lang)
      .then((v) => {
        voiceCacheRef.current = v;
      })
      .catch(() => {});
  }, [accent]);
  // ── Cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      speakAbortRef.current?.abort();
      abortRef.current?.abort();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── stop() ──────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    // Abort any in-flight speak() (including Edge chunk loop)
    speakAbortRef.current?.abort();
    speakAbortRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      // Detach handlers before clearing src — setting src="" fires onerror
      // which would otherwise reject the in-flight playBase64Audio Promise.
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setSpeakingCharIndex(-1);
    setStatus("idle");
  }, []);

  // ── speak() ─────────────────────────────────────────────────────────────
  const speak = useCallback(
    async (text: string, onEnd?: () => void) => {
      try {
        const trimmed = text.trim();
        if (!trimmed) return;
        if (statusRef.current === "loading") return;

        // Debounce — same text within 250ms
        const now = Date.now();
        const last = lastSpeakRef.current;
        if (last && last.text === trimmed && now - last.at < 250) return;
        lastSpeakRef.current = { text: trimmed, at: now };

        stop();

        // Create a new abort controller for this speak session
        const speakAc = new AbortController();
        speakAbortRef.current = speakAc;

        if (providerRef.current === "edge") {
          setStatus("loading");
          const lang = getLangFromVoiceId(accentRef.current);
          // Use pre-cached voice to avoid async lookup lag on every speak();
          // fall back to async resolution if cache is empty (first call or accent change).
          const voice =
            voiceCacheRef.current ??
            (await getVoiceForAccent(accentRef.current, lang));
          if (voice) voiceCacheRef.current = voice; // keep cache warm

          if (!voice || speakAc.signal.aborted) {
            setStatus("idle");
            setSpeakingCharIndex(-1);
            if (!voice)
              console.warn(
                "[useTTSSettings] No voice found for",
                accentRef.current,
                lang,
              );
            return;
          }
          setStatus("playing");
          const chunks = chunkText(trimmed, 250);
          let charOffset = 0;
          for (const chunk of chunks) {
            if (speakAc.signal.aborted) break;
            await speakChunk(
              chunk,
              voice,
              speedRef.current,
              lang,
              speakAc.signal,
              (idx) => setSpeakingCharIndex(idx),
              charOffset,
            );
            charOffset += chunk.length + 1; // +1 for the space between chunks
          }
          if (!speakAc.signal.aborted) {
            setSpeakingCharIndex(-1);
            setStatus("idle");
            onEnd?.();
          }
          return;
        }

        // ── Google TTS (with pre-buffer cache) ──────────────────────────
        if (providerRef.current === "google") {
          if (speakAc.signal.aborted) return;

          const cacheKey = makeCacheKey(
            trimmed,
            accentRef.current,
            speedRef.current,
          );
          const cachedBase64 = audioBufferCache.get(cacheKey);

          if (cachedBase64) {
            // Instant playback from pre-buffer
            setStatus("playing");
            await playBase64Audio(
              cachedBase64,
              trimmed,
              blobUrlRef,
              audioRef,
              () => {
                if (!speakAc.signal.aborted) {
                  setSpeakingCharIndex(-1);
                  setStatus("idle");
                  onEnd?.();
                }
              },
              (idx) => setSpeakingCharIndex(idx),
            );
            return;
          }

          setStatus("loading");
          const abortController = new AbortController();
          abortRef.current = abortController;
          // Also abort fetch if speak is cancelled
          speakAc.signal.addEventListener(
            "abort",
            () => abortController.abort(),
            { once: true },
          );

          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: trimmed,
              voice: accentRef.current,
              speed: speedRef.current,
            }),
            signal: abortController.signal,
          });

          if (!res.ok) throw new Error(`TTS fetch failed: ${res.status}`);

          const data = await res.json();
          if (!data.audioContent)
            throw new Error("No audioContent in response");

          // Cache for instant replay
          audioBufferCache.set(cacheKey, data.audioContent);

          setStatus("playing");
          await playBase64Audio(
            data.audioContent,
            trimmed,
            blobUrlRef,
            audioRef,
            () => {
              if (!speakAc.signal.aborted) {
                setSpeakingCharIndex(-1);
                setStatus("idle");
                onEnd?.();
              }
            },
            (idx) => setSpeakingCharIndex(idx),
          );
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("[useTTSSettings] speak error:", err);
        }
        setStatus("idle");
      }
    },
    [stop],
  );

  // ── Pre-buffer upcoming sentences ───────────────────────────────────────
  const preBuffer = useCallback(async (texts: string[]) => {
    if (providerRef.current !== "google") return;

    const toFetch = texts
      .map((t) => t.trim())
      .filter((t) => {
        if (!t) return false;
        const key = makeCacheKey(t, accentRef.current, speedRef.current);
        // Skip if already in memory cache or already being fetched
        if (audioBufferCache.has(key)) return false;
        if (preBufferInFlight.has(key)) return false;
        return true;
      });

    if (toFetch.length === 0) return;

    // Mark as in-flight before the async fetch to prevent duplicate calls
    toFetch.forEach((t) =>
      preBufferInFlight.add(
        makeCacheKey(t, accentRef.current, speedRef.current),
      ),
    );

    // Single batch PUT — warms DB cache. When speak() is called later,
    // the individual POST will be a fast DB cache hit.
    try {
      await fetch("/api/tts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: toFetch.map((text) => ({
            text,
            voice: accentRef.current,
            speed: speedRef.current,
          })),
        }),
      });
    } catch {
      // Batch pre-fetch failed, non-critical
    } finally {
      toFetch.forEach((t) =>
        preBufferInFlight.delete(
          makeCacheKey(t, accentRef.current, speedRef.current),
        ),
      );
    }
  }, []);

  return {
    provider,
    accent,
    speed,
    voices,
    status,
    playing: status === "playing",
    loading: status === "loading",
    speakingCharIndex,
    setProvider,
    setAccent,
    setSpeed,
    speak,
    stop,
    preBuffer,
  };
}

// ─── Helper: play base64 audio ────────────────────────────────────────────
// Speed is already baked into Google TTS audio via speakingRate param,
// so no client-side playbackRate distortion needed.
// onBoundary(charIndex) fires on each word transition, matching the same
// interface as Edge TTS `onboundary`, so the UI can use one highlight path.
function playBase64Audio(
  base64: string,
  text: string,
  blobUrlRef: React.MutableRefObject<string | null>,
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  onDone: () => void,
  onBoundary?: (charIndex: number) => void,
): Promise<void> {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "audio/mpeg" });

  if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
  const url = URL.createObjectURL(blob);
  blobUrlRef.current = url;

  const audio = new Audio(url);
  audioRef.current = audio;

  // Build word map: [{charIndex, word}] for time-based highlight.
  // We divide audio duration evenly across words — crude but zero-cost
  // and visually effective for short practice sentences.
  type WordEntry = { charIndex: number };
  let wordMap: WordEntry[] = [];
  let lastWordIdx = -1;

  if (onBoundary && text) {
    // Extract char offsets of each word
    const re = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      wordMap.push({ charIndex: m.index });
    }
  }

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      audio.ontimeupdate = null;
    };

    // Drive word highlight via timeupdate
    if (onBoundary && wordMap.length > 0) {
      audio.ontimeupdate = () => {
        const dur = audio.duration;
        if (!dur || !isFinite(dur)) return;
        // Which word should be active at currentTime?
        const fraction = audio.currentTime / dur;
        const idx = Math.min(
          Math.floor(fraction * wordMap.length),
          wordMap.length - 1,
        );
        if (idx !== lastWordIdx) {
          lastWordIdx = idx;
          onBoundary(wordMap[idx].charIndex);
        }
      };
    }

    audio.onended = () => {
      cleanup();
      onDone();
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      onDone();
      reject(new Error("Audio playback failed"));
    };
    audio.play().catch((err) => {
      cleanup();
      reject(err);
    });
  });
}
