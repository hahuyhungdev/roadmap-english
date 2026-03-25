import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, Circle, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { getPhraseGroup, getSession } from "../lib/sessions";
import { useProgressStore } from "../store/useProgressStore";
import LessonAssistant from "../components/LessonAssistant";

export default function SessionDetail() {
  const { phraseId, id } = useParams<{ phraseId: string; id: string }>();
  const navigate = useNavigate();
  const session = getSession(id ?? "");
  const phrase = getPhraseGroup(phraseId ?? "");
  const { isCompleted, toggleCompleted } = useProgressStore();

  if (!session || !phrase) {
    return (
      <div className="text-center py-20 text-gray-400">
        Session not found.{" "}
        <Link to="/" className="text-indigo-500 underline">
          Back
        </Link>
      </div>
    );
  }

  const completed = isCompleted(session.id);
  const idx = phrase.sessions.findIndex((s) => s.id === session.id);
  const prev = idx > 0 ? phrase.sessions[idx - 1] : undefined;
  const next = idx >= 0 ? phrase.sessions[idx + 1] : undefined;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          to={`/phrase/${phrase.id}`}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft size={16} /> {phrase.title}
        </Link>
        <button
          onClick={() => toggleCompleted(session.id)}
          className={clsx(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
            completed
              ? "bg-indigo-50 text-indigo-600 border-indigo-200"
              : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300",
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
            <span className="text-xs text-gray-400">
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
        className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 prose prose-gray max-w-none
        prose-p:text-gray-700 prose-p:leading-7 prose-p:my-4
        prose-headings:text-gray-900 prose-headings:font-semibold
        prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-0
        prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100
        prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
        prose-li:text-gray-700 prose-li:my-1
        prose-a:text-indigo-600 hover:prose-a:text-indigo-500 prose-a:font-medium
        prose-strong:text-gray-900
        prose-code:text-indigo-700 prose-code:bg-indigo-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl
        prose-blockquote:border-l-4 prose-blockquote:border-indigo-300 prose-blockquote:bg-indigo-50/70
        prose-blockquote:rounded-r-lg prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:not-italic prose-blockquote:text-gray-700
        prose-table:text-sm prose-th:text-gray-700 prose-td:text-gray-700"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {session.content}
        </ReactMarkdown>
      </article>

      <LessonAssistant
        lessonTitle={session.meta.title}
        lessonContent={session.content}
      />

      <div className="mt-8 flex items-center justify-between gap-4 pb-6">
        {prev ? (
          <button
            onClick={() => navigate(`/phrase/${phrase.id}/session/${prev.id}`)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 px-3 py-2 rounded-lg border border-gray-200 hover:border-indigo-200 bg-white transition-colors"
          >
            <ChevronLeft size={15} /> {prev.meta.title}
          </button>
        ) : (
          <div />
        )}
        {next ? (
          <button
            onClick={() => navigate(`/phrase/${phrase.id}/session/${next.id}`)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 px-3 py-2 rounded-lg border border-gray-200 hover:border-indigo-200 bg-white transition-colors"
          >
            {next.meta.title} <ChevronRight size={15} />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
