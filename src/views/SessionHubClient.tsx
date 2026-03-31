"use client";

import Link from "next/link";
import { ChevronRight, CheckCircle2, BookOpen } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import type { PhraseGroup } from "@/lib/sessions.server";

export default function SessionHubClient({
  phrases,
}: {
  phrases: PhraseGroup[];
}) {
  const { completedSessions } = useProgressStore();

  const totalLessons = phrases.reduce((sum, p) => sum + p.sessions.length, 0);
  const doneLessons = phrases.reduce(
    (sum, p) =>
      sum + p.sessions.filter((s) => completedSessions.includes(s.id)).length,
    0,
  );
  const pct =
    totalLessons === 0 ? 0 : Math.round((doneLessons / totalLessons) * 100);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={18} className="text-indigo-500" />
            <h1 className="text-2xl font-bold text-gray-900">English Phases</h1>
          </div>
          <p className="text-gray-500 text-sm">
            {totalLessons} lessons across {phrases.length} phases
          </p>
        </div>
      </div>

      <div className=" border border-gray-200 rounded-2xl p-5 mb-7 flex items-center gap-5 shadow-sm">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Overall Progress</span>
            <span className="font-semibold text-indigo-600">
              {doneLessons} / {totalLessons} lessons
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

      <div className="space-y-3">
        {phrases.map((phase, i) => {
          const total = phase.sessions.length;
          const done = phase.sessions.filter((s) =>
            completedSessions.includes(s.id),
          ).length;
          const phasePct = total === 0 ? 0 : Math.round((done / total) * 100);
          const isDone = done === total && total > 0;

          return (
            <Link
              key={phase.id}
              href={`/phase/${phase.id}`}
              className="group flex items-start gap-4  border border-gray-200 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div
                className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                  isDone
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-500"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                    {phase.title}
                  </h2>
                  {isDone && (
                    <CheckCircle2
                      size={14}
                      className="text-indigo-500 shrink-0"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {done} of {total} lessons done
                </p>

                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-700 ${
                      isDone ? "bg-indigo-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${phasePct}%` }}
                  />
                </div>
              </div>

              <ChevronRight
                size={17}
                className="shrink-0 text-gray-400 group-hover:text-indigo-500 transition-colors mt-1"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
