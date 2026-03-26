import {
  Mic,
  MicOff,
  Square,
  Trash2,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Volume2,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import clsx from "clsx";
import { useVoicePractice } from "../hooks/useVoicePractice";
import type { ConversationTurn, SpeakingReview, SonioxStatus } from "../types/speaking";
import { useEffect, useRef, useState } from "react";

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SonioxStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  idle: {
    label: "Ready",
    dot: "bg-gray-300",
    text: "text-gray-400",
    bg: "bg-gray-100",
  },
  connecting: {
    label: "Connecting…",
    dot: "bg-yellow-400 animate-pulse",
    text: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  speaking: {
    label: "Listening",
    dot: "bg-indigo-500 animate-pulse",
    text: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  processing: {
    label: "Thinking…",
    dot: "bg-amber-400 animate-pulse",
    text: "text-amber-600",
    bg: "bg-amber-50",
  },
  error: {
    label: "Error",
    dot: "bg-red-500",
    text: "text-red-600",
    bg: "bg-red-50",
  },
};

// ─── Review panel ────────────────────────────────────────────────────────────

function ReviewPanel({ review }: { review: SpeakingReview }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/60 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100/50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Lightbulb size={11} />
          Review & Corrections
        </span>
        <ChevronRight
          size={12}
          className={clsx(
            "text-indigo-400 transition-transform",
            expanded && "rotate-90",
          )}
        />
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2.5">
          {/* Original vs Corrected */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-red-500 font-semibold mb-1">
                You said
              </p>
              <p className="text-xs text-gray-700 bg-white rounded-lg px-2.5 py-1.5 border border-red-100 leading-relaxed">
                {review.original_transcript}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-green-600 font-semibold mb-1">
                Better version
              </p>
              <p className="text-xs text-gray-800 bg-white rounded-lg px-2.5 py-1.5 border border-green-100 font-medium leading-relaxed">
                {review.corrected_version}
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
              Why
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {review.explanation}
            </p>
          </div>

          {/* Alternatives */}
          {review.better_alternatives.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                Other ways to say it
              </p>
              <div className="flex flex-wrap gap-1.5">
                {review.better_alternatives.map((alt, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-colors cursor-default"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Turn bubble ─────────────────────────────────────────────────────────────

function TurnBubble({ turn }: { turn: ConversationTurn }) {
  const isUser = turn.role === "user";

  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[78%] rounded-2xl px-4 py-3 leading-relaxed text-sm",
          isUser
            ? "bg-indigo-600 text-white rounded-br-md"
            : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm",
        )}
      >
        <div className="flex items-start gap-2">
          {!isUser && (
            <Volume2 size={13} className="text-indigo-400 mt-0.5 shrink-0" />
          )}
          <span className={clsx(isUser ? "text-white" : "text-gray-800")}>
            {turn.text}
          </span>
        </div>

        {/* Coach review */}
        {isUser && turn.review && (
          <ReviewPanel review={turn.review} />
        )}
      </div>
    </div>
  );
}

// ─── Live transcript subtitle ─────────────────────────────────────────────────

function LiveTranscript({
  text,
  status,
}: {
  text: string;
  status: SonioxStatus;
}) {
  const visible =
    status === "speaking" || status === "connecting" || status === "processing";

  return (
    <div
      className={clsx(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-40 transition-all duration-300",
        visible && text ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
      )}
    >
      <div className="bg-gray-900/90 backdrop-blur-sm text-white text-sm px-5 py-2.5 rounded-2xl shadow-xl max-w-xl text-center border border-white/10">
        {text || (
          <span className="text-gray-400 italic">
            {status === "connecting" ? "Connecting to mic…" : "Listening…"}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Mic pulse animation ─────────────────────────────────────────────────────

function MicPulse({ active }: { active: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {active && (
        <>
          <span className="absolute w-20 h-20 rounded-full bg-indigo-400/20 animate-ping" />
          <span className="absolute w-14 h-14 rounded-full bg-indigo-400/25 animate-ping [animation-delay:150ms]" />
        </>
      )}
      <div
        className={clsx(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200",
          active
            ? "bg-indigo-600 shadow-lg shadow-indigo-200 text-white"
            : "bg-gray-100 text-gray-400",
        )}
      >
        {active ? <Mic size={24} /> : <MicOff size={24} />}
      </div>
    </div>
  );
}

// ─── SpeakingLab page ────────────────────────────────────────────────────────

export default function SpeakingLab() {
  const [vocabulary, setVocabulary] = useState<SpeakingReview[]>([]);
  const {
    status,
    error,
    transcript,
    turns,
    isAiResponding,
    startPractice,
    stopPractice,
    clearHistory,
  } = useVoicePractice({
    onReview: (review) => {
      setVocabulary((prev) => {
        // Deduplicate by corrected_version
        const exists = prev.some(
          (r) => r.corrected_version === review.corrected_version,
        );
        return exists ? prev : [review, ...prev].slice(0, 20);
      });
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[status];

  // Auto-scroll conversation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  const isActive = status === "speaking" || status === "connecting";

  return (
    <div className="max-w-4xl mx-auto flex flex-col" style={{ height: "calc(100vh - 9rem)" }}>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Speaking Lab</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Practice spoken English with real-time coaching
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <div
            className={clsx(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium",
              cfg.bg,
              cfg.text,
            )}
          >
            <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
            {cfg.label}
          </div>

          {turns.length > 0 && (
            <button
              onClick={() => {
                clearHistory();
                setVocabulary([]);
              }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Clear conversation"
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main content: 2-column layout */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Left: conversation */}
        <div className="flex flex-col flex-1 min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Conversation scroll area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {turns.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center pb-12 gap-3">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <Mic size={20} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Ready to practice
                  </p>
                  <p className="text-xs text-gray-400 max-w-[16rem] leading-relaxed">
                    Press Start, speak naturally, and get instant feedback on your English.
                  </p>
                </div>
              </div>
            )}

            {turns.map((turn) => (
              <TurnBubble key={turn.id} turn={turn} />
            ))}

            {isAiResponding && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <RefreshCw size={11} className="animate-spin" />
                    Coach is thinking…
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-4 mb-3 flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2.5 border border-red-100 shrink-0">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bottom controls */}
          <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50/60">
            <div className="flex items-center justify-center gap-4">
              {/* Start / Stop */}
              <button
                onClick={isActive ? stopPractice : startPractice}
                className={clsx(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95",
                  isActive
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-sm"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200",
                )}
              >
                {isActive ? (
                  <>
                    <Square size={14} fill="currentColor" /> Stop
                  </>
                ) : (
                  <>
                    <Mic size={14} /> Start Practice
                  </>
                )}
              </button>

              {/* Mic pulse indicator */}
              <MicPulse active={isActive} />
            </div>

            {/* Hotkey hint */}
            <p className="text-center text-[10px] text-gray-400 mt-2">
              {isActive
                ? "Speak naturally — the coach responds automatically"
                : "Click Start or press Space to begin"}
            </p>
          </div>
        </div>

        {/* Right: vocabulary panel */}
        <div className="w-72 shrink-0 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 shrink-0">
            <h2 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Lightbulb size={12} className="text-amber-500" />
              Vocabulary & Corrections
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {vocabulary.length} saved
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {vocabulary.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center pb-8 gap-2">
                <CheckCircle2 size={18} className="text-gray-200" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  Corrections will appear here as you practice
                </p>
              </div>
            )}

            {vocabulary.map((v, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-gray-50/70 p-2.5 text-xs group"
              >
                <p className="text-gray-400 line-through text-[11px] mb-0.5">
                  {v.original_transcript}
                </p>
                <p className="text-gray-800 font-medium leading-snug">
                  {v.corrected_version}
                </p>
                <p className="text-gray-500 text-[10px] mt-1 leading-relaxed">
                  {v.explanation}
                </p>
                {v.better_alternatives.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {v.better_alternatives.map((alt, j) => (
                      <span
                        key={j}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live transcript subtitle overlay */}
      <LiveTranscript text={transcript} status={status} />
    </div>
  );
}
