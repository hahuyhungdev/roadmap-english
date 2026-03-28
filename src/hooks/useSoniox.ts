"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseSonioxOptions = {
  /** Audio source: 'mic' (default) or 'tab' (capture tab/system audio for testing) */
  source?: "mic" | "tab";
};

type UseSonioxResult = {
  start: (opts?: {
    source?: "mic" | "tab";
    stream?: MediaStream;
  }) => Promise<void>;
  stop: () => void;
  reset: () => void;
  isRecording: boolean;
  transcript: string;
  partial: string;
  error?: string;
};

function normalizeSpacedTranscript(text: string): string {
  if (!text) return text;
  // 1) Normalize whitespace
  let s = text.replace(/\s+/g, " ").trim();
  // 2) Remove spaces before punctuation
  s = s.replace(/\s+([.,!?;:])/g, "$1");

  // 3) Join runs of single-letter tokens (e.g., "H e l l o" -> "Hello")
  s = s.replace(/\b(?:([A-Za-z])\s+){1,}([A-Za-z])\b/g, (m) => {
    return m.replace(/\s+/g, "");
  });

  // 4) Join short splits where a long token is followed by a very short token
  //    (fixes cases like "Hell o" -> "Hello"). This is heuristic.
  s = s
    .split(" ")
    .reduce((acc: string[], tok) => {
      const prev = acc[acc.length - 1];
      const raw = tok.replace(/[.,!?;:]$/g, "");
      if (
        prev &&
        prev.replace(/[.,!?;:]$/g, "").length >= 3 &&
        raw.length <= 1 &&
        /^[A-Za-z]+$/.test(raw)
      ) {
        // merge into previous token
        acc[acc.length - 1] =
          prev + raw + (/[.,!?;:]$/.test(tok) ? tok.slice(-1) : "");
      } else {
        acc.push(tok);
      }
      return acc;
    }, [] as string[])
    .join(" ");

  // Final cleanup: collapse accidental joins and keep single space separators.
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

export default function useSoniox(options?: UseSonioxOptions): UseSonioxResult {
  function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as { message: unknown }).message === "string"
    ) {
      return (err as { message: string }).message;
    }
    return String(err);
  }

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Used for Web Speech API fallback when no Soniox API key is set
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef(""); // mirror of transcript state, avoids stale closures
  const partialRef = useRef(""); // mirror of partial state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partial, setPartial] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  const SONIOX_WS =
    process.env.NEXT_PUBLIC_SONIOX_WS_URL ||
    "wss://stt-rt.soniox.com/transcribe-websocket";
  const API_KEY = process.env.NEXT_PUBLIC_SONIOX_API_KEY as string;

  const stop = useCallback(() => {
    // Stop Web Speech API fallback if active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    try {
      if (mediaRef.current && mediaRef.current.state !== "inactive")
        mediaRef.current.stop();
    } catch (err) {
      console.warn("stop media error", err);
    }
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.warn("stop tracks error", err);
    }
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Send empty binary frame to signal end-of-stream (Soniox spec)
        wsRef.current.send(new Uint8Array(0));
      }
    } catch (err) {
      console.warn("failed to send EOS", err);
    }
    try {
      wsRef.current?.close();
    } catch (err) {
      console.warn("ws close error", err);
    }
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    transcriptRef.current = "";
    partialRef.current = "";
    setTranscript("");
    setPartial("");
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const start = useCallback(
    async (opts?: { source?: "mic" | "tab"; stream?: MediaStream }) => {
      setError(undefined);
      setTranscript("");
      setPartial("");
      transcriptRef.current = "";
      partialRef.current = "";
      if (isRecording) return;

      if (!API_KEY) {
        // Fall back to browser built-in SpeechRecognition (Chrome / Edge)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = (typeof window !== "undefined" ? window : null) as any;
        const SR = w?.SpeechRecognition ?? w?.webkitSpeechRecognition ?? null;

        if (!SR) {
          setError(
            "No NEXT_PUBLIC_SONIOX_API_KEY set. Add it to .env.local, or use Chrome/Edge for built-in speech recognition.",
          );
          return;
        }

        const recognition = new SR();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognitionRef.current = recognition;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (ev: any) => {
          let finalText = "";
          let partialText = "";
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const t = ev.results[i][0].transcript;
            if (ev.results[i].isFinal) finalText += t;
            else partialText += t;
          }
          if (partialText) {
            partialRef.current = partialText;
            setPartial(partialText);
          }
          if (finalText) {
            const next = transcriptRef.current
              ? `${transcriptRef.current} ${finalText}`
              : finalText;
            transcriptRef.current = next;
            setTranscript(next);
            partialRef.current = "";
            setPartial("");
          }
        };

        recognition.onend = () => {
          recognitionRef.current = null;
          setIsRecording(false);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (ev: any) => {
          recognitionRef.current = null;
          setIsRecording(false);
          if (ev.error !== "no-speech" && ev.error !== "aborted") {
            setError(`Speech recognition error: ${ev.error as string}`);
          }
        };

        try {
          recognition.start();
          setIsRecording(true);
        } catch (err) {
          setError(
            `Could not start speech recognition: ${getErrorMessage(err)}`,
          );
        }
        return;
      }

      let stream: MediaStream;

      try {
        if (opts?.stream) {
          // Use an externally-provided stream (e.g. from YouTube captureStream)
          stream = opts.stream;
        } else if (opts?.source === "tab") {
          // Capture tab / system audio (YouTube, podcast, etc.)
          stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: false,
          } as DisplayMediaStreamOptions);
        } else {
          // Default: capture from microphone
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        streamRef.current = stream;

        let ws: WebSocket;
        try {
          ws = new WebSocket(SONIOX_WS);
        } catch {
          stream.getTracks().forEach((t) => t.stop());
          setError(
            "WebSocket connection failed — your browser or a Chrome extension may be blocking it. Try disabling extensions or use Mic mode instead.",
          );
          return;
        }
        wsRef.current = ws;

        ws.onopen = () => {
          // Send config message (required first message per Soniox spec)
          const config = {
            api_key: API_KEY,
            model: "stt-rt-preview",
            audio_format: "webm", // MediaRecorder produces webm/opus
          };
          ws.send(JSON.stringify(config));
        };

        ws.onmessage = (ev) => {
          // Soniox sends JSON responses
          if (typeof ev.data === "string") {
            try {
              const d = JSON.parse(ev.data);

              // Error response — surface it and close
              if (d.error_code || d.error_message) {
                setError(`Soniox error ${d.error_code}: ${d.error_message}`);
                stop();
                return;
              }

              // Finished response — stop recording
              if (d.finished) {
                setIsRecording(false);
                return;
              }

              // Token-based transcript responses
              if (Array.isArray(d.tokens)) {
                type Token = { text: string; is_final: boolean };
                const tokens = d.tokens as Token[];
                const partialTokens = tokens.filter((t) => !t.is_final);
                const finalTokens = tokens.filter((t) => t.is_final);

                console.log("[Soniox] tokens received:", tokens.length, {
                  partial: partialTokens.length,
                  final: finalTokens.length,
                });

                if (partialTokens.length > 0) {
                  const partialText = normalizeSpacedTranscript(
                    partialTokens.map((t) => t.text).join(" "),
                  );
                  partialRef.current = partialText;
                  setPartial(partialText);
                  console.log("[Soniox] partial:", partialText);
                }

                if (finalTokens.length > 0) {
                  const text = normalizeSpacedTranscript(
                    finalTokens.map((t) => t.text).join(" "),
                  );
                  console.log("[Soniox] final:", text);
                  setTranscript((prev) => {
                    const next = prev ? `${prev} ${text}` : text;
                    transcriptRef.current = next;
                    return next;
                  });
                  partialRef.current = "";
                  setPartial("");
                }
              }
            } catch {
              console.debug("Non-JSON ws message ignored");
            }
          }
        };

        ws.onerror = () => {
          setError(
            "WebSocket error — check your API key, network, and that the Soniox service is available.",
          );
        };

        ws.onclose = (ev) => {
          if (ev.code === 1006) {
            setError(
              "Connection closed unexpectedly (1006). Verify your Soniox API key is valid.",
            );
          }
          setIsRecording(false);
        };

        // Start MediaRecorder after ws is open
        ws.addEventListener(
          "open",
          () => {
            // Try supported mimeTypes; fall back to browser default if none work
            const mimeTypes = [
              "audio/webm;codecs=opus",
              "audio/webm",
              "audio/ogg",
            ];
            let mimeType: string | undefined;
            for (const mt of mimeTypes) {
              if (MediaRecorder.isTypeSupported(mt)) {
                mimeType = mt;
                break;
              }
            }

            let mr: MediaRecorder;
            try {
              mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
            } catch {
              // Fall back: let browser pick the best supported format
              try {
                mr = new MediaRecorder(stream);
              } catch (innerErr) {
                setError(
                  `Cannot create MediaRecorder: ${getErrorMessage(innerErr)}`,
                );
                ws.close();
                return;
              }
            }
            mediaRef.current = mr;

            mr.ondataavailable = (ev) => {
              if (!ev.data || ev.data.size === 0) return;
              if (ws.readyState !== WebSocket.OPEN) return;
              ev.data.arrayBuffer().then((buf) => {
                try {
                  ws.send(buf); // Soniox expects raw binary frames
                } catch (err) {
                  console.warn("Failed to send audio chunk", err);
                }
              });
            };

            try {
              mr.start(250); // collect chunks every 250ms
            } catch (startErr) {
              setError(
                `Cannot start recording: ${getErrorMessage(startErr)}. Try using Mic mode instead.`,
              );
              if (mr.state !== "inactive") mr.stop();
              ws.close();
              return;
            }
            setIsRecording(true);

            // Manual mode: do not use silence detection. Recording continues until the user stops it.
            // The MediaRecorder stream remains open and Soniox will finalize when stop() is called.
            // No additional AudioContext-based silence timer is needed.
          },
          { once: true },
        );
      } catch (err) {
        console.warn(err);
        setError(getErrorMessage(err));
        setIsRecording(false);
      }
    },
    [options?.source],
  );

  return { start, stop, reset, isRecording, transcript, partial, error };
}
