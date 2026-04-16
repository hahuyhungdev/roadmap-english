"use client";

import { Loader2, Send, Sparkles, X, Zap } from "lucide-react";
import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Textarea } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AiChatMessage, AiResponse } from "@/types/ai";

interface LessonAssistantProps {
  lessonTitle: string;
  lessonContent: string;
}

const MODE_LABELS: Record<string, string> = {
  practice: "Practice",
  idea: "Ideas",
  concise: "Concise",
};

const PLACEHOLDER: Record<string, string> = {
  practice: "Ask about this lesson…",
  idea: "Brainstorm ideas…",
  concise: "Quick question…",
};

export default function LessonAssistant({
  lessonTitle,
  lessonContent,
}: LessonAssistantProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"practice" | "idea" | "concise">("concise");
  const MODE_KEY = "ai_lesson_mode";
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load saved mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved === "practice" || saved === "idea" || saved === "concise") {
        setMode(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      // ignore
    }
  }, [mode]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function onSubmit(e?: FormEvent) {
    if (e && typeof (e as FormEvent).preventDefault === "function") {
      (e as FormEvent).preventDefault();
    }
    const question = input.trim();
    if (!question || loading) return;

    const nextMessages: AiChatMessage[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonTitle,
          lessonContent,
          mode,
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = (await res.json()) as AiResponse & { error?: string };
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            "API endpoint not found. For local dev, run: npm run dev:vercel",
          );
        }
        throw new Error(data.error || `API Error: ${res.status}`);
      }

      const reply = data.reply?.trim();
      if (!reply) {
        throw new Error("Empty response from AI");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get AI response";
      setError(message);
      setMessages((prev) => prev.slice(0, -1));
      setInput(question);
    } finally {
      setLoading(false);
    }
  }

  function adjustTextareaHeight() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(300, ta.scrollHeight)}px`;
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    const isEnter = e.key === "Enter";
    const isModifier = e.ctrlKey || e.metaKey;
    if (!isEnter) return;
    if ((!e.shiftKey && !isModifier) || isModifier) {
      e.preventDefault();
      void onSubmit();
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center z-50 transition-all active:scale-95 cursor-pointer"
        aria-label="Open AI assistant"
        title="AI Lesson Assistant"
      >
        <Sparkles size={20} />
      </button>
    );
  }

  return (
    <section
      className="fixed bottom-6 right-6 w-92  border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/60 flex flex-col z-50 overflow-hidden bg-white"
      style={{ height: "36rem", maxHeight: "80vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100  shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
            <Sparkles size={13} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 leading-tight">
              AI Assistant
            </h2>
            <p className="text-[10px] text-gray-500 leading-tight">
              {lessonTitle.length > 40
                ? lessonTitle.slice(0, 40) + "…"
                : lessonTitle}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close assistant"
        >
          <X size={14} />
        </button>
      </div>

      {/* Mode selector */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 shrink-0">
        <Zap size={11} className="text-indigo-500 shrink-0" />
        <div className="flex gap-1 flex-1">
          {(["practice", "idea", "concise"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
              }}
              className={`flex-1 text-xs px-2 py-1.5 rounded-lg font-medium transition-all ${
                mode === m
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500  border border-gray-200 hover:border-indigo-200 hover:text-indigo-600"
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 pb-8">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Sparkles size={16} className="text-indigo-500" />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-56">
              Ask anything about this lesson — summary, examples, corrections,
              or a quick quiz.
            </p>
            <div className="flex flex-wrap gap-1 justify-center mt-1">
              {["Explain this", "Give examples", "Quiz me"].map((hint) => (
                <button
                  key={hint}
                  onClick={() => {
                    setInput(hint);
                    textareaRef.current?.focus();
                  }}
                  className="text-[10px] px-2 py-1 rounded-full  border border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div
            key={`${m.role}-${idx}`}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] text-sm px-3 py-2.5 leading-relaxed ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-2xl rounded-br-md"
                  : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md border border-gray-100"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm prose-gray max-w-none prose-p:my-0 prose-p:leading-relaxed prose-p:text-gray-800 prose-headings:my-1 prose-headings:font-semibold prose-h1:text-sm prose-h2:text-sm prose-h3:text-sm prose-li:my-0 prose-li:text-gray-800 prose-a:text-indigo-600 prose-a:font-medium prose-strong:font-semibold prose-strong:text-gray-900 prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-2 prose-pre:rounded-lg prose-blockquote:border-l-2 prose-blockquote:border-indigo-400 prose-blockquote:bg-indigo-50/60 prose-blockquote:rounded-r prose-blockquote:px-3 prose-blockquote:py-1.5 prose-blockquote:not-italic prose-blockquote:text-gray-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-100 rounded-2xl px-3 py-2.5 rounded-bl-md">
            <Loader2 size={12} className="animate-spin" />
            <span>Thinking…</span>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 border border-red-100">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={onSubmit}
        className="shrink-0 px-3 py-3 border-t border-gray-100 "
      >
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.currentTarget.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            onInput={adjustTextareaHeight}
            placeholder={PLACEHOLDER[mode]}
            rows={1}
            autosize
            minRows={1}
            maxRows={7}
            className="flex-1"
            classNames={{
              input:
                "border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition-all placeholder:text-gray-500",
            }}
            style={{ maxHeight: "7rem" }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 active:scale-95"
            aria-label="Send"
          >
            <Send size={13} />
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-1.5 text-center">
          Enter to send · Shift+Enter for newline
        </p>
      </form>
    </section>
  );
}
