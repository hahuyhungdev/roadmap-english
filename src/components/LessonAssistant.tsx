import { Loader2, Send, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { AiChatMessage, AiResponse } from "../types/ai";

interface LessonAssistantProps {
  lessonTitle: string;
  lessonContent: string;
}

export default function LessonAssistant({
  lessonTitle,
  lessonContent,
}: LessonAssistantProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
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
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = (await res.json()) as AiResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
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

  return (
    <section className="mt-6 bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-indigo-500" />
        <h2 className="text-sm font-semibold text-gray-900">
          AI Lesson Assistant
        </h2>
      </div>

      <div className="space-y-2 max-h-72 overflow-auto pr-1 mb-3">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500">
            Ask anything about this lesson: summary, examples, role-play,
            corrections, or quiz.
          </p>
        )}

        {messages.map((m, idx) => (
          <div
            key={`${m.role}-${idx}`}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] text-sm bg-indigo-50 text-indigo-900 rounded-xl px-3 py-2"
                : "max-w-[90%] text-sm bg-gray-100 text-gray-800 rounded-xl px-3 py-2"
            }
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-100 rounded-xl px-3 py-2">
            <Loader2 size={14} className="animate-spin" /> Thinking...
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this lesson..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-300"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm bg-indigo-600 text-white disabled:opacity-50"
        >
          <Send size={14} /> Send
        </button>
      </form>
    </section>
  );
}
