"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Pencil, Check } from "lucide-react";
import YouTubeShadowingClient from "../youtube/YouTubeShadowingClient";
import ScriptShadowingClient from "../script/ScriptShadowingClient";

type SessionData = {
  id: number;
  mode: "youtube" | "script";
  title: string;
  videoId: string | null;
  videoUrl: string | null;
  scriptText: string | null;
  sentences: any[] | null;
  ttsVoice: string | null;
  ttsSpeed: number | null;
  activeSentenceIdx: number | null;
  createdAt: string;
  updatedAt: string;
};

interface Props {
  sessionId: number;
}

export function ShadowingSessionClient({ sessionId }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<Record<string, any>>({});

  // Load session from API
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/shadowing/sessions/${sessionId}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Session not found" : "Failed to load");
          return;
        }
        const data = await res.json();
        setSession(data.session);
        setTitleDraft(data.session.title);
      } catch {
        setError("Failed to load session");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  // Debounced save — merges concurrent updates so sentences + activeSentenceIdx
  // don't overwrite each other when they fire within the same tick.
  const saveSession = useCallback(
    (updates: Record<string, any>) => {
      pendingSaveRef.current = { ...pendingSaveRef.current, ...updates };
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const payload = pendingSaveRef.current;
        pendingSaveRef.current = {};
        fetch(`/api/shadowing/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => {});
      }, 1000);
    },
    [sessionId],
  );

  // Called by child components when sentences are loaded/changed
  const handleSentencesChange = useCallback(
    (sentences: any[]) => {
      setSession((prev) => (prev ? { ...prev, sentences } : prev));
      saveSession({ sentences });
    },
    [saveSession],
  );

  // Called when active sentence changes
  const handleActiveSentenceChange = useCallback(
    (idx: number) => {
      saveSession({ activeSentenceIdx: idx });
    },
    [saveSession],
  );

  // Called when script text changes (script mode)
  const handleScriptTextChange = useCallback(
    (scriptText: string) => {
      saveSession({ scriptText });
    },
    [saveSession],
  );

  // Called when video is loaded (youtube mode)
  const handleVideoChange = useCallback(
    (videoId: string) => {
      saveSession({ videoId });
    },
    [saveSession],
  );

  function handleSaveTitle() {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== session?.title) {
      setSession((prev) => (prev ? { ...prev, title: trimmed } : prev));
      fetch(`/api/shadowing/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      }).catch(() => {});
    }
    setEditingTitle(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500">{error || "Session not found"}</p>
        <button
          onClick={() => router.push("/shadowing")}
          className="text-sm text-indigo-600 hover:underline"
        >
          Back to sessions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Session header */}
      <div className="flex items-center gap-3 px-4 py-3 mb-2">
        <button
          onClick={() => router.push("/shadowing")}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Back to sessions"
        >
          <ArrowLeft size={18} />
        </button>

        {editingTitle ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") {
                  setTitleDraft(session.title);
                  setEditingTitle(false);
                }
              }}
              autoFocus
              className="flex-1 text-lg font-semibold text-gray-900 px-2 py-1 border border-indigo-300 rounded-lg outline-none"
            />
            <button
              onClick={handleSaveTitle}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 text-white"
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 cursor-pointer group flex-1 min-w-0"
            onClick={() => setEditingTitle(true)}
          >
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {session.title}
            </h1>
            <Pencil
              size={13}
              className="shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Render mode-specific client */}
      {session.mode === "youtube" ? (
        <YouTubeShadowingClient
          sessionId={sessionId}
          initialVideoId={session.videoId ?? undefined}
          initialSentences={session.sentences ?? undefined}
          initialActiveSentenceIdx={session.activeSentenceIdx ?? undefined}
          onSentencesChange={handleSentencesChange}
          onActiveSentenceChange={handleActiveSentenceChange}
          onVideoChange={handleVideoChange}
          onScriptTextChange={handleScriptTextChange}
        />
      ) : (
        <ScriptShadowingClient
          sessionId={sessionId}
          initialScriptText={session.scriptText ?? undefined}
          initialSentences={session.sentences ?? undefined}
          initialActiveSentenceIdx={session.activeSentenceIdx ?? undefined}
          initialTtsVoice={session.ttsVoice ?? undefined}
          initialTtsSpeed={session.ttsSpeed ?? undefined}
          onSentencesChange={handleSentencesChange}
          onActiveSentenceChange={handleActiveSentenceChange}
          onScriptTextChange={handleScriptTextChange}
        />
      )}
    </div>
  );
}
