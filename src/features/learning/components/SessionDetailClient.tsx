"use client";

import { useEffect, useState } from "react";
import type { PhraseGroup } from "@/lib/sessions.server";
import { useProgressStore } from "@/store/useProgressStore";
import type { Session } from "@/types";
import clsx from "clsx";
import { CheckCircle2, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import LessonAssistant from "./LessonAssistant";
import PracticeCoach from "./PracticeCoach";

export default function SessionDetailClient({
  session,
  phase,
}: {
  session: Session;
  phase: PhraseGroup;
}) {
  const { completedSessions, toggleCompleted, syncFromDB } = useProgressStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    void syncFromDB();
  }, [syncFromDB]);

  const completed = mounted && completedSessions.includes(session.id);

  return (
    <div className="max-w-6xl mx-auto overflow-x-scroll h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/phase/${phase.id}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft size={16} /> {phase.title}
        </Link>
        <button
          onClick={() => toggleCompleted(session.id)}
          className={clsx(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
            completed
              ? "bg-indigo-50 text-indigo-600 border-indigo-200"
              : " text-gray-500 border-gray-200 hover:border-indigo-400",
          )}
        >
          {completed ? <CheckCircle2 size={13} /> : <Circle size={13} />}
          {completed ? "Completed" : "Mark done"}
        </button>
      </div>

      <div className="mb-6">
        <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-1">
          Lesson {String(session.meta.sessionNumber).padStart(2, "0")} &middot;{" "}
          {session.meta.topic}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          {session.meta.title}
        </h1>
        {session.meta.description && (
          <p className="text-sm text-gray-500 mt-2">
            {session.meta.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {session.meta.level && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              {session.meta.level}
            </span>
          )}
          {session.meta.date && (
            <span className="text-xs text-gray-500">
              {new Date(session.meta.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      <article
        className={[
          "border border-gray-200 rounded-2xl p-6 md:p-8 prose prose-gray max-w-none",
          "prose-p:text-gray-700 prose-p:leading-7 prose-p:my-4",
          "prose-headings:text-gray-900 prose-headings:font-semibold",
          "prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-0",
          "prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100",
          "prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2",
          "prose-li:text-gray-700 prose-li:my-1",
          "prose-a:text-indigo-600 hover:prose-a:text-indigo-500 prose-a:font-medium",
          "prose-strong:text-gray-900",
          "prose-code:text-indigo-700 prose-code:bg-indigo-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
          "prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl",
          "prose-blockquote:border-l-4 prose-blockquote:border-indigo-400 prose-blockquote:bg-indigo-50/70",
          "prose-blockquote:rounded-r-lg prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:not-italic prose-blockquote:text-gray-700",
          "prose-table:text-sm prose-th:text-gray-700 prose-td:text-gray-700",
          "prose-details:my-4 prose-details:border prose-details:border-gray-200 prose-details:rounded-xl prose-details:bg-gray-50/70 prose-details:overflow-hidden",
          "prose-summary:cursor-pointer prose-summary:list-none prose-summary:font-semibold prose-summary:text-gray-900 prose-summary:px-4 prose-summary:py-3 prose-summary:select-none prose-summary:hover:bg-indigo-50 prose-summary:transition-colors prose-summary:[&::-webkit-details-marker]:hidden",
        ].join(" ")}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            details: ({ children, open: _open, ...props }) => (
              <details {...props} className="group mb-2">
                {children}
              </details>
            ),
            summary: ({ children, ...props }) => (
              <summary
                {...props}
                className="flex items-center justify-between gap-3 cursor-pointer [&_*]:cursor-pointer"
                title="Click to expand or collapse"
              >
                <span className="flex items-center gap-2">
                  <ChevronRight
                    size={14}
                    className="shrink-0 text-indigo-500 transition-transform duration-200 group-open:rotate-90"
                  />
                  <span>{children}</span>
                </span>
                <ChevronRight
                  size={12}
                  className="shrink-0 text-gray-400 transition-transform duration-200 group-open:hidden"
                />
                <span className="hidden text-xs text-indigo-600 font-medium group-open:inline">
                  Collapse
                </span>
              </summary>
            ),
          }}
        >
          {session.content}
        </ReactMarkdown>
      </article>

      <LessonAssistant
        lessonTitle={session.meta.title}
        lessonContent={session.content}
      />
      <PracticeCoach
        lessonTitle={session.meta.title}
        lessonContent={session.content}
      />
    </div>
  );
}
