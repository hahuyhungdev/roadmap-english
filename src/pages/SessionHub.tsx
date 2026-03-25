import { Link } from "react-router-dom";
import { ChevronRight, Layers3, CheckCircle2 } from "lucide-react";
import { loadPhraseGroups } from "../lib/sessions";
import { useProgressStore } from "../store/useProgressStore";

const phrases = loadPhraseGroups();

export default function SessionHub() {
  const { completedSessions } = useProgressStore();

  const totalLessons = phrases.reduce((sum, p) => sum + p.sessions.length, 0);
  const doneLessons = phrases.reduce(
    (sum, p) => sum + p.sessions.filter((s) => completedSessions.includes(s.id)).length,
    0,
  );
  const pct = totalLessons === 0 ? 0 : Math.round((doneLessons / totalLessons) * 100);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">English Phases</h1>
        <p className="text-gray-500 text-sm mt-1">Pick a phase, then learn lessons inside it</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Total Progress</span>
            <span className="font-semibold text-indigo-600">
              {doneLessons} / {totalLessons} lessons
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="text-2xl font-bold text-indigo-600 w-14 text-right">{pct}%</div>
      </div>

      <div className="space-y-3">
        {phrases.map((phrase) => {
          const total = phrase.sessions.length;
          const done = phrase.sessions.filter((s) => completedSessions.includes(s.id)).length;

          return (
            <Link
              key={phrase.id}
              to={`/phrase/${phrase.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-indigo-500">
                  <Layers3 size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900">{phrase.title}</h2>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{total} lessons</span>
                    <span>•</span>
                    <span>{done} completed</span>
                  </div>

                  <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${total === 0 ? 0 : (done / total) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-gray-400">
                  {done === total && total > 0 && <CheckCircle2 size={16} className="text-indigo-500" />}
                  <ChevronRight size={18} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
