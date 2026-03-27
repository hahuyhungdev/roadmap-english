import { useEffect, useRef, useState } from "react";
import useSoniox from "../hooks/useSoniox";
import { Mic, Square, X, ChevronDown } from "lucide-react";

interface PracticeCoachProps {
  lessonTitle?: string;
  lessonContent?: string;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^?\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function PracticeCoach({
  lessonTitle,
  lessonContent,
}: PracticeCoachProps) {
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

  async function callCoach(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text.trim(),
          topic: lessonTitle || undefined,
          history: [],
          lessonContent: lessonContent || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Coach API failed");
      setReply(data.reply || "");
      setFinalTranscript(text.trim());
      if (data.audioContent) {
        const audio = `data:audio/mp3;base64,${data.audioContent}`;
        if (audioRef.current) {
          audioRef.current.src = audio;
          audioRef.current.play().catch(() => {});
        }
      }
    } catch (err) {
      console.error(err);
      alert(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const { start, stop, isRecording, transcript, partial, error } = useSoniox({
    onSilence: callCoach,
    silenceMs: 2500,
    silenceThreshold: -50,
  });

  const [finalTranscript, setFinalTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [testText, setTestText] = useState("");
  const [ytStatus, setYtStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [ytTitle, setYtTitle] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytAudioRef = useRef<HTMLAudioElement | null>(null);

  const ytVideoId = youtubeUrl ? getYouTubeId(youtubeUrl) : null;

  // Auto-load audio when URL is pasted
  useEffect(() => {
    if (!ytVideoId) return;
    let cancelled = false;
    setYtStatus("loading");
    fetch(`/api/ytstream?url=${encodeURIComponent(youtubeUrl)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !ytAudioRef.current) return;
        if (data.audioUrl) {
          ytAudioRef.current.src = data.audioUrl;
          ytAudioRef.current.load();
          setYtTitle(data.title || "");
          setYtStatus("ready");
        } else {
          setYtStatus("error");
        }
      })
      .catch(() => {
        if (!cancelled) setYtStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytVideoId]);

  async function loadYouTubeAudio() {
    if (!ytVideoId) return;
    setYtStatus("loading");
    try {
      const res = await fetch(`/api/ytstream?url=${encodeURIComponent(youtubeUrl)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load YouTube audio");
      if (ytAudioRef.current) {
        ytAudioRef.current.src = data.audioUrl;
        ytAudioRef.current.load();
      }
      setYtTitle(data.title || "");
      setYtStatus("ready");
    } catch (e) {
      setYtStatus("error");
      alert(getErrorMessage(e));
    }
  }

  async function startWithYouTube() {
    if (!ytAudioRef.current || ytStatus !== "ready") {
      alert("YouTube audio not loaded yet. Please wait and try again.");
      return;
    }
    try {
      // captureStream() works on <audio> elements without CORS issues
      const stream = (ytAudioRef.current as HTMLAudioElement & {
        captureStream: () => MediaStream;
      }).captureStream();
      await start({ stream });
      ytAudioRef.current.play().catch(() => {});
    } catch (e) {
      alert(`Cannot capture YouTube audio: ${getErrorMessage(e)}`);
    }
  }

  return (
    <>
      {isExpanded && (
        <div className="fixed top-4 right-4 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-40 flex flex-col max-h-96">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="flex items-center gap-2">
              <Mic size={16} className="text-indigo-600" />
              <span className="text-sm font-semibold text-gray-900">
                Speaking Lab
              </span>
              {isRecording && (
                <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  Listening
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronDown size={16} />
              </button>
              <button
                onClick={() => {
                  if (isRecording) stop();
                  setFinalTranscript("");
                  setReply("");
                  setYtStatus("idle");
                }}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Control Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => start({ source: "mic" })}
                disabled={isRecording}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Mic size={13} /> Mic
              </button>
              <button
                onClick={startWithYouTube}
                disabled={isRecording || ytStatus !== "ready"}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={ytStatus !== "ready" ? "Paste YouTube URL and wait for it to load" : "Use YouTube audio as source"}
              >
                <Mic size={13} /> YouTube
              </button>
              <button
                onClick={() => {
                  stop();
                  ytAudioRef.current?.pause();
                  const text =
                    (transcript || "") + (partial ? ` ${partial}` : "");
                  const trimmed = text.trim();
                  if (trimmed) callCoach(trimmed);
                }}
                disabled={!isRecording}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Square size={13} /> Done
              </button>
            </div>

            {/* YouTube URL */}
            <div>
              <input
                type="url"
                placeholder="Paste YouTube URL..."
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  setYtStatus("idle");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadYouTubeAudio();
                }}
                className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              {/* Status */}
              <div className="mt-1 flex items-center justify-between">
                {ytStatus === "idle" && ytVideoId && (
                  <button
                    onClick={loadYouTubeAudio}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Load audio
                  </button>
                )}
                {ytStatus === "loading" && (
                  <p className="text-xs text-gray-400 animate-pulse">Loading audio...</p>
                )}
                {ytStatus === "ready" && ytTitle && (
                  <p className="text-xs text-green-500 truncate flex-1">{ytTitle}</p>
                )}
                {ytStatus === "error" && (
                  <p className="text-xs text-red-400">Failed to load</p>
                )}
              </div>
            </div>

            {/* Test text */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Test: type any English sentence here..."
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && testText.trim()) {
                    callCoach(testText.trim());
                    setTestText("");
                  }
                }}
                className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <button
                onClick={() => {
                  if (testText.trim()) {
                    callCoach(testText.trim());
                    setTestText("");
                  }
                }}
                className="px-2 py-1.5 bg-orange-500 text-white text-xs font-medium rounded hover:bg-orange-600 transition-colors"
              >
                Send
              </button>
            </div>

            {error && (
              <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            {/* Real-time partial transcript */}
            {partial && (
              <div className="p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                <p className="text-xs text-yellow-600 font-semibold mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                  Live
                </p>
                <p className="text-sm text-gray-900 font-medium leading-relaxed">
                  {partial}
                </p>
              </div>
            )}

            {/* Confirmed transcript */}
            {finalTranscript && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600 font-semibold mb-1">
                  Transcript
                </p>
                <p className="text-xs text-gray-800 leading-relaxed">
                  {finalTranscript}
                </p>
              </div>
            )}

            {/* Coach Response */}
            {loading && (
              <div className="text-xs text-gray-500 animate-pulse text-center py-2">
                Coach thinking...
              </div>
            )}

            {reply && (
              <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-600 font-semibold mb-1">
                  Coach feedback:
                </p>
                <p className="text-xs text-gray-800 leading-relaxed">{reply}</p>
                <audio ref={audioRef} className="mt-2 w-full h-6" controls />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsed State */}
      {!isExpanded && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            title="Open Speaking Lab"
          >
            <Mic size={20} />
          </button>
        </div>
      )}

      {/* Hidden audio — used for YouTube stream capture */}
      <audio ref={ytAudioRef} style={{ display: "none" }} />
      {/* Coach TTS audio */}
      <audio ref={audioRef} />
    </>
  );
}
