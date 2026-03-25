import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Circle, ChevronRight, ChevronLeft } from "lucide-react";
import clsx from "clsx";
import { getPhraseGroup } from "../lib/sessions";
import { useProgressStore } from "../store/useProgressStore";

export default function PhraseDetail() {
  const { phraseId } = useParams<{ phraseId: string }>();
  const phrase = getPhraseGroup(phraseId ?? "");
  const navigate = useNavigate();
  const { completedSessions, toggleCompleted } = useProgressStore();

  if (!phrase) {
    return (
      <div className="text-center py-20 text-gray-400">
        Phase not found. {" "}
        <Link to="/" className="text-indigo-500 underline">
          Back
        </Link>
      </div>
    );
  }

  const total = phrase.sessions.length;
  const done = phrase.sessions.filter((s) => completedSessions.includes(s.id)).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft size={16} /> All Phases
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{phrase.title}</h1>
        <p className="text-gray-500 text-sm mt-1">Learn lessons inside this phase</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Phase Progress</span>
            <span className="font-semibold text-indigo-600">
              {done} / {total} lessons
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

      <div className="space-y-2">
        {phrase.sessions.map((session) => {
          const completed = completedSessions.includes(session.id);

          return (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/phrase/${phrase.id}/session/${session.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/phrase/${phrase.id}/session/${session.id}`);
                }
              }}
              className={clsx(
                "bg-white border rounded-xl px-4 py-3.5 flex items-center gap-3 transition-colors cursor-pointer",
                completed ? "border-indigo-200 bg-indigo-50/40" : "border-gray-200 hover:border-indigo-200",
              )}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCompleted(session.id);
                }}
                className="shrink-0 text-gray-300 hover:text-indigo-500 transition-colors"
                aria-label={completed ? "Mark as not completed" : "Mark as completed"}
              >
                {completed ? <CheckCircle2 size={20} className="text-indigo-500" /> : <Circle size={20} />}
              </button>

              <span className="shrink-0 text-xs font-mono text-gray-400 w-7">
                {String(session.meta.sessionNumber).padStart(2, "0")}
              </span>

              <div className="flex-1 min-w-0">
                <span
                  className={clsx(
                    "text-sm font-medium block",
                    completed ? "text-gray-400 line-through" : "text-gray-900",
                  )}
                >
                  {session.meta.title}
                </span>
                {session.meta.description && (
                  <span className="text-xs text-gray-400 line-clamp-2">{session.meta.description}</span>
                )}
              </div>

              <Link
                to={`/phrase/${phrase.id}/session/${session.id}`}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-gray-300 hover:text-indigo-500 transition-colors"
                aria-label={`Open ${session.meta.title}`}
              >
                <ChevronRight size={18} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
