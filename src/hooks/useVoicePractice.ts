/**
 * useVoicePractice.ts
 *
 * A self-contained React hook that orchestrates:
 *   1. Microphone capture (MediaStream API)
 *   2. Real-time streaming transcription (Soniox WebSocket)
 *   3. Coach API call → parses structured JSON review block
 *   4. TTS playback (Web Speech Synthesis API — zero API key required)
 *
 * Designed for manual stop mode: the user controls when recording ends.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ConversationTurn,
  SpeakingReview,
  SonioxStatus,
  UseVoicePracticeOptions,
  UseVoicePracticeReturn,
  CoachingMessage,
} from "../types/speaking";

// ─── Helpers ────────────────────────────────────────────────────────────────

let _turnCounter = 0;
function nextId() {
  return `turn-${++_turnCounter}-${Date.now()}`;
}

/** Parse a "```review\n{...}\n```" block from the coach's reply. */
function extractReview(raw: string): SpeakingReview | null {
  try {
    const match = raw.match(/```review\n([\s\S]*?)\n```/);
    if (!match) return null;
    return JSON.parse(match[1].trim()) as SpeakingReview;
  } catch {
    return null;
  }
}

// ─── Google Cloud TTS — Neural2 / Studio voices ──────────────────────────────

// Lazy-initialised AudioContext (must be created after a user gesture)
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new AudioContext();
  }
  return _audioCtx;
}

/**
 * Speak text using Google Cloud Text-to-Speech (Neural2 or Studio voice).
 *
 * Requires VITE_GOOGLE_TTS_API_KEY in .env.local (client-side, fine since
 * only the synthesised audio bytes are fetched — no user data leaves the browser).
 *
 * Voice options (change VOICE constants below):
 *   Neural2: en-US-Neural2-A | en-US-Neural2-C | en-US-Neural2-F | en-US-Neural2-J | en-US-Neural2-K
 *   Studio:  en-US-Studio-A  | en-US-Studio-D  | en-US-Studio-M  (broader, slightly higher latency)
 *
 * The serverless API endpoint /api/tts handles the actual Google Cloud call
 * so the API key stays server-side.
 *
 * Flow: POST /api/tts → { audioContent: "base64..." } → decode → Web Audio API
 */
async function speak(text: string): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_TTS_API_KEY;

  if (!apiKey) {
    console.warn(
      "[SpeakingLab] NEXT_PUBLIC_GOOGLE_TTS_API_KEY not set — skipping TTS.",
    );
    return;
  }

  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: "en-US",
            name: "en-US-Neural2-F", // change to Neural2-C/K/J/A for different timbres
          },
          audioConfig: {
            audioEncoding: "LINEAR16",
            sampleRateHertz: 24_000,
            speakingRate: 0.95,
            pitch: 0.0,
          },
        }),
      },
    );

    if (!res.ok) {
      console.warn("[SpeakingLab] TTS API error:", await res.text());
      return;
    }

    const data = (await res.json()) as { audioContent?: string };
    const b64 = data.audioContent;
    if (!b64) return;

    // Decode base64 → ArrayBuffer → Web Audio buffer → play
    const binary = atob(b64);
    const buf = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);

    const ctx = getAudioCtx();
    await ctx.resume();

    const audioBuffer = await ctx.decodeAudioData(buf);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  } catch (err) {
    // TTS failure is non-fatal — don't surface errors to the user
    console.warn("[SpeakingLab] TTS playback error:", err);
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useVoicePractice(
  options: UseVoicePracticeOptions = {},
): UseVoicePracticeReturn {
  const { onReview } = options;

  // ── Public state ──────────────────────────────────────────────────────────
  const [status, setStatus] = useState<SonioxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // ── Refs (avoid stale closures in async callbacks) ────────────────────────
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const currentTranscriptRef = useRef("");
  const wsRef = useRef<WebSocket | null>(null);
  const historyRef = useRef<CoachingMessage[]>([]);
  const cancelledRef = useRef(false);

  // ── Cleanup helper ────────────────────────────────────────────────────────
  function stopAll() {
    cancelledRef.current = true;

    wsRef.current?.close();
    wsRef.current = null;

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    window.speechSynthesis?.cancel();
    setStatus("idle");
  }

  // ── Speech-to-text via Soniox WebSocket ───────────────────────────────────
  async function connectSoniox(onFinal: (text: string) => void): Promise<{
    sendAudio: (chunk: Float32Array) => void;
    isConnected: () => boolean;
  }> {
    return new Promise((resolve, reject) => {
      const SONIOX_WS = "wss://api.soniox.com/transcribe";

      const ws = new WebSocket(SONIOX_WS);
      wsRef.current = ws;

      let ready = false;
      const sendQueue: ArrayBuffer[] = [];

      ws.onopen = () => {
        ready = true;
        // Send configuration
        ws.send(
          JSON.stringify({
            // soniox_api_key: apiKey ?? "",  // uncomment if using auth
            enable_PARTIAL: true,
            language: "en",
          }),
        );
        // Flush queued audio
        for (const buf of sendQueue) ws.send(buf);
        sendQueue.length = 0;
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          // Binary audio ack — ignore
          return;
        }
        const data = JSON.parse(event.data as string);

        if (data.transcript && !data.is_final) {
          currentTranscriptRef.current = data.transcript;
          setTranscript(data.transcript);
        }

        if (data.is_final) {
          currentTranscriptRef.current = data.transcript ?? "";
          setTranscript(data.transcript ?? "");
          onFinal(data.transcript ?? "");
        }
      };

      ws.onerror = () => reject(new Error("Soniox WebSocket error"));
      ws.onclose = () => {
        if (!ready) reject(new Error("Soniox connection closed before ready"));
      };

      resolve({
        sendAudio(chunk) {
          if (!ws || ws.readyState !== WebSocket.OPEN) return;
          const buf = chunk.buffer.slice(
            chunk.byteOffset,
            chunk.byteOffset + chunk.byteLength,
          ) as ArrayBuffer;
          if (!ready) {
            sendQueue.push(buf);
          } else {
            ws.send(buf);
          }
        },
        isConnected() {
          return ws.readyState === WebSocket.OPEN;
        },
      });
    });
  }

  // ── Mic capture + audio level monitoring ──────────────────────────────────
  async function startMicCapture(
    sendAudio: (chunk: Float32Array) => void,
    isConnected: () => boolean,
  ) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    micStreamRef.current = stream;

    const ctx = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;
    analyserRef.current = analyser;
    source.connect(analyser);

    const bufferLength = analyser.fftSize;
    const timeData = new Float32Array(bufferLength);

    // Poll audio continuously and send captured audio until the user stops.
    function pollLevel() {
      if (!analyserRef.current) return;
      analyserRef.current.getFloatTimeDomainData(timeData);

      if (isConnected()) {
        // Send raw PCM 16-bit mono audio chunk
        const pcm = convertTo16BitPCM(timeData);
        sendAudio(pcm);
      }

      if (micStreamRef.current) {
        requestAnimationFrame(pollLevel);
      }
    }

    requestAnimationFrame(pollLevel);
  }

  /** Convert Float32Array (-1..1) to 16-bit PCM Int16Array for Soniox */
  function convertTo16BitPCM(float32: Float32Array): Float32Array {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return new Float32Array(int16.buffer);
  }

  // ── Coach API call ────────────────────────────────────────────────────────
  async function callCoach(
    transcript: string,
  ): Promise<{ reply: string; review: SpeakingReview | null }> {
    const res = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        history: historyRef.current,
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? `API error ${res.status}`);
    }

    const data = (await res.json()) as { reply?: string };
    const reply = data.reply?.trim() ?? "";
    const review = extractReview(reply);

    return { reply, review };
  }

  // ── Main startPractice ────────────────────────────────────────────────────
  const startPractice = useCallback(async () => {
    stopAll(); // reset any prior state
    cancelledRef.current = false;
    setError(null);
    setTranscript("");
    currentTranscriptRef.current = "";
    setStatus("connecting");

    try {
      // 1. Connect to Soniox
      const { sendAudio, isConnected } = await connectSoniox(
        async (finalText) => {
          if (!finalText.trim()) return;
          // This fires when Soniox delivers a final transcript
          await handleFinalTranscript(finalText);
        },
      );

      // 2. Start mic capture + level polling
      await startMicCapture(sendAudio, isConnected);
      setStatus("speaking");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start";
      setError(msg);
      setStatus("error");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle completed speech turn ───────────────────────────────────────────
  async function handleFinalTranscript(finalText: string) {
    if (!finalText.trim() || cancelledRef.current) return;

    setStatus("processing");

    const turnId = nextId();
    const now = Date.now();

    // Append user turn optimistically
    setTurns((prev) => [
      ...prev,
      {
        id: turnId,
        role: "user",
        text: finalText,
        review: null,
        timestamp: now,
      },
    ]);

    historyRef.current.push({ role: "user", content: finalText });

    setIsAiResponding(true);

    try {
      const { reply, review } = await callCoach(finalText);

      // Strip the review JSON block from the spoken text (keep it in review for UI)
      const textForSpeech = reply
        .replace(/```review\n[\s\S]*?\n```/g, "")
        .trim();

      // Append coach turn
      setTurns((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "coach",
          text: reply,
          review,
          timestamp: Date.now(),
        },
      ]);
      historyRef.current.push({ role: "assistant", content: reply });

      // Fire TTS + report review in parallel
      void speak(textForSpeech);
      if (review) onReview?.(review);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Coach unavailable";
      setError(msg);
      // Rollback the user turn on error
      setTurns((prev) => prev.filter((t) => t.id !== turnId));
      historyRef.current.pop(); // remove the failed user message
    } finally {
      setIsAiResponding(false);
      if (!cancelledRef.current && micStreamRef.current) {
        setStatus("speaking");
      }
    }
  }

  // ── Controls ───────────────────────────────────────────────────────────────
  const stopPractice = useCallback(() => {
    stopAll();
    setTranscript("");
    currentTranscriptRef.current = "";
    setIsAiResponding(false);
    setError(null);
  }, []);

  const clearHistory = useCallback(() => {
    setTurns([]);
    historyRef.current = [];
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => stopAll();
  }, []);

  return {
    status,
    error,
    transcript,
    turns,
    isAiResponding,
    startPractice,
    stopPractice,
    clearHistory,
  };
}
