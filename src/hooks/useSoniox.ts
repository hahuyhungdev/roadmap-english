import { useEffect, useRef, useState } from "react";

type UseSonioxResult = {
  start: () => Promise<void>;
  stop: () => void;
  isRecording: boolean;
  transcript: string; // final confirmed transcript
  partial: string; // live partial transcript
  error?: string;
};

export default function useSoniox(): UseSonioxResult {
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
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partial, setPartial] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  const SONIOX_WS =
    (import.meta.env.VITE_SONIOX_WS_URL as string) ||
    "wss://stt-rt.soniox.com/transcribe-websocket";
  const API_KEY = (import.meta.env.VITE_SONIOX_API_KEY as string) || "";

  function stop() {
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
  }

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  async function start() {
    setError(undefined);
    setTranscript("");
    setPartial("");
    if (isRecording) return;

    if (!API_KEY) {
      setError("Missing VITE_SONIOX_API_KEY — add it to your .env file.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ws = new WebSocket(SONIOX_WS);
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

              if (partialTokens.length > 0) {
                setPartial(partialTokens.map((t) => t.text).join(" "));
              }

              if (finalTokens.length > 0) {
                const text = finalTokens.map((t) => t.text).join(" ");
                setTranscript((prev) =>
                  prev ? `${prev} ${text}` : text,
                );
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
          const mimeType =
            MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ||
            MediaRecorder.isTypeSupported("audio/webm")
              ? "audio/webm"
              : "audio/ogg";

          const mr = new MediaRecorder(stream, { mimeType });
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

          mr.start(250); // collect chunks every 250ms
          setIsRecording(true);
        },
        { once: true },
      );
    } catch (err) {
      setError(getErrorMessage(err));
      setIsRecording(false);
    }
  }

  return { start, stop, isRecording, transcript, partial, error };
}
