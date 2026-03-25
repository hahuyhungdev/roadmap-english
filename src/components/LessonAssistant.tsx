import { Loader2, Send, Sparkles, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  const [isOpen, setIsOpen] = useState(true);

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
    <section className="fixed bottom-6 right-6 w-96 max-h-150 bg-white border border-gray-200 rounded-2xl p-4 shadow-2xl flex flex-col z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-900">
            AI Lesson Assistant
          </h2>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-400 hover:text-gray-600 p-0.5"
        >
          <X size={16} />
        </button>
      </div>

      {isOpen && (
        <>
          <div className="space-y-3 overflow-y-auto flex-1 mb-3 pr-2">
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
                    ? "ml-auto max-w-[85%] text-sm bg-indigo-50 text-indigo-900 rounded-xl px-3 py-2 text-right"
                    : "max-w-[90%] text-sm bg-gray-100 text-gray-800 rounded-xl px-3 py-2"
                }
              >
                {m.role === "assistant" ? (
                  <div
                    className="prose prose-sm prose-gray max-w-none
                    prose-p:my-1 prose-p:text-gray-800
                    prose-headings:my-1 prose-headings:font-semibold
                    prose-h1:text-sm prose-h2:text-sm prose-h3:text-sm
                    prose-li:my-0 prose-li:text-gray-800
                    prose-a:text-indigo-600 prose-a:font-medium
                    prose-strong:font-semibold prose-strong:text-gray-900
                    prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                    prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs prose-pre:p-2 prose-pre:rounded-lg"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            ))}

            {loading && (
              <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-100 rounded-xl px-3 py-2">
                <Loader2 size={14} className="animate-spin" /> Thinking...
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

          <form onSubmit={onSubmit} className="flex items-center gap-2 mt-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this lesson..."
              className="flex-1 border border-gray-200 rounded-xl px-2 py-1.5 text-xs outline-none focus:border-indigo-300"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs bg-indigo-600 text-white disabled:opacity-50"
            >
              <Send size={12} />
            </button>
          </form>
        </>
      )}
    </section>
  );
}
