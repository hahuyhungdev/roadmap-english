"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  BookMarked,
} from "lucide-react";
import clsx from "clsx";
import { useProgressStore } from "@/store/useProgressStore";
import type { PhraseGroup } from "@/lib/sessions.server";
import PhaseNotesReview from "./PhaseNotesReview";

export default function PhraseDetailClient({ phase }: { phase: PhraseGroup }) {
  const router = useRouter();
  const { completedSessions, toggleCompleted } = useProgressStore();

  const total = phase.sessions.length;
  const done = phase.sessions.filter((s) =>
    completedSessions.includes(s.id),
  ).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors theme-dark:hover:text-indigo-300"
        >
          <ChevronLeft size={15} /> All Phases
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 theme-dark:bg-indigo-900/70">
            <BookMarked
              size={16}
              className="text-indigo-500 theme-dark:text-indigo-300"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{phase.title}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {total} lesson{total !== 1 ? "s" : ""} in this phase
            </p>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-2xl p-5 mb-7 flex items-center gap-5 shadow-sm bg-white/70 theme-dark:bg-slate-900/70 theme-dark:border-slate-700">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Phase Progress</span>
            <span className="font-semibold text-indigo-600 theme-dark:text-indigo-300">
              {done} / {total} lessons
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden theme-dark:bg-slate-700">
            <div
              className="bg-linear-to-r from-indigo-500 to-indigo-500 h-2.5 rounded-full transition-all duration-700 theme-dark:from-indigo-400 theme-dark:to-indigo-400"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="text-3xl font-bold text-indigo-600 w-16 text-right leading-none theme-dark:text-indigo-300">
          {pct}%
        </div>
      </div>

      <PhaseNotesReview phase={phase} />

      <div className="space-y-2">
        {phase.sessions.map((session) => {
          const completed = completedSessions.includes(session.id);

          return (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() =>
                router.push(`/phase/${phase.id}/session/${session.id}`)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/phase/${phase.id}/session/${session.id}`);
                }
              }}
              className={clsx(
                "group flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all cursor-pointer",
                completed
                  ? "border-indigo-100 bg-indigo-50/50 theme-dark:border-indigo-900/70 theme-dark:bg-indigo-950/40"
                  : "border-gray-200 bg-white/60 hover:border-indigo-200 hover:shadow-sm theme-dark:border-slate-700 theme-dark:bg-slate-900/60 theme-dark:hover:border-indigo-500/60",
              )}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCompleted(session.id);
                }}
                className="shrink-0 text-gray-400 hover:text-indigo-500 transition-colors theme-dark:text-slate-500 theme-dark:hover:text-indigo-300"
                aria-label={
                  completed ? "Mark as not completed" : "Mark as completed"
                }
              >
                {completed ? (
                  <CheckCircle2
                    size={19}
                    className="text-indigo-500 theme-dark:text-indigo-300"
                  />
                ) : (
                  <Circle size={19} />
                )}
              </button>

              <span className="shrink-0 text-xs font-medium text-gray-400 w-6 text-center group-hover:text-indigo-500 transition-colors theme-dark:text-slate-500 theme-dark:group-hover:text-indigo-300">
                {String(session.meta.sessionNumber).padStart(2, "0")}
              </span>

              <div className="flex-1 min-w-0">
                <span
                  className={clsx(
                    "text-sm font-medium block truncate",
                    completed
                      ? "text-gray-500 line-through theme-dark:text-slate-400"
                      : "text-gray-800 theme-dark:text-slate-100",
                  )}
                >
                  {session.meta.title}
                </span>
                {session.meta.description && (
                  <span className="text-xs text-gray-500 line-clamp-1 theme-dark:text-slate-400">
                    {session.meta.description}
                  </span>
                )}
              </div>

              <ChevronRight
                size={16}
                className="shrink-0 text-gray-400 group-hover:text-indigo-500 transition-colors theme-dark:text-slate-500 theme-dark:group-hover:text-indigo-300"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
