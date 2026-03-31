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
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft size={15} /> All Phases
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <BookMarked size={16} className="text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{phase.title}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {total} lesson{total !== 1 ? "s" : ""} in this phase
            </p>
          </div>
        </div>
      </div>

      <div className=" border border-gray-200 rounded-2xl p-5 mb-7 flex items-center gap-5 shadow-sm">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Phase Progress</span>
            <span className="font-semibold text-indigo-600">
              {done} / {total} lessons
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-linear-to-r from-indigo-500 to-indigo-500 h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="text-3xl font-bold text-indigo-600 w-16 text-right leading-none">
          {pct}%
        </div>
      </div>

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
                  ? "border-indigo-100 bg-indigo-50/50"
                  : "border-gray-200  hover:border-indigo-200 hover:shadow-sm",
              )}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCompleted(session.id);
                }}
                className="shrink-0 text-gray-400 hover:text-indigo-500 transition-colors"
                aria-label={
                  completed ? "Mark as not completed" : "Mark as completed"
                }
              >
                {completed ? (
                  <CheckCircle2 size={19} className="text-indigo-500" />
                ) : (
                  <Circle size={19} />
                )}
              </button>

              <span className="shrink-0 text-xs font-medium text-gray-400 w-6 text-center group-hover:text-indigo-500 transition-colors">
                {String(session.meta.sessionNumber).padStart(2, "0")}
              </span>

              <div className="flex-1 min-w-0">
                <span
                  className={clsx(
                    "text-sm font-medium block truncate",
                    completed ? "text-gray-500 line-through" : "text-gray-800",
                  )}
                >
                  {session.meta.title}
                </span>
                {session.meta.description && (
                  <span className="text-xs text-gray-500 line-clamp-1">
                    {session.meta.description}
                  </span>
                )}
              </div>

              <ChevronRight
                size={16}
                className="shrink-0 text-gray-400 group-hover:text-indigo-500 transition-colors"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
