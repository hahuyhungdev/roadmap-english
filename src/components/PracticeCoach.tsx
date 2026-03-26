import { useEffect, useRef, useState } from "react";
import useSoniox from "../hooks/useSoniox";
import { Play, Mic, X, ChevronDown } from "lucide-react";

interface PracticeCoachProps {
  lessonTitle?: string;
  lessonContent?: string;
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
  const { start, stop, isRecording, transcript, partial, error } = useSoniox();
  const [finalTranscript, setFinalTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // sync partial to live display
  }, [partial]);

  async function handleStopAndSend() {
    // stop capture
    stop();
    const text = (transcript || "") + (partial ? ` ${partial}` : "");
    setFinalTranscript(text.trim());
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
          // include lesson content to give context
          lessonContent: lessonContent || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Coach API failed");
      setReply(data.reply || "");
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
                  // cleared
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => start()}
                disabled={isRecording}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Mic size={14} /> Start
              </button>
              <button
                onClick={handleStopAndSend}
                disabled={!isRecording}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play size={14} /> Stop
              </button>
            </div>

            {error && (
              <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            {/* User's Speech */}
            {(transcript || finalTranscript) && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600 font-semibold mb-1">
                  Your speech:
                </p>
                <p className="text-xs text-gray-800 leading-relaxed">
                  {transcript}{" "}
                  {partial && (
                    <span className="text-gray-500 italic">{partial}</span>
                  )}
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

      <audio ref={audioRef} />
    </>
  );
}
