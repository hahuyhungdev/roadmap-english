"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Loader,
  Modal,
  Progress,
  TextInput,
} from "@mantine/core";
import { Plus, Trash2, Video, Clock3, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { extractVideoId } from "../shared/utils";

type Session = {
  id: number;
  mode: "youtube" | "script";
  title: string;
  videoId: string | null;
  sentences: unknown[] | null;
  updatedAt: string;
};

type Usage = {
  used: number;
  limit: number;
  disableAt: number;
  remaining: number;
  shouldDisable: boolean;
  periodStart: string;
  periodEnd: string;
};

const STEP_PROGRESS: Record<string, number> = {
  "Creating session": 20,
  "Fetching transcript": 65,
  "Preparing practice": 95,
};

export default function YouTubeShadowingHub() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [createStep, setCreateStep] = useState<
    keyof typeof STEP_PROGRESS | "Done" | ""
  >("");
  const [createError, setCreateError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);

  const progress = useMemo(() => {
    if (createStep === "Done") return 100;
    return createStep ? STEP_PROGRESS[createStep] : 0;
  }, [createStep]);

  useEffect(() => {
    void fetchSessions();
    void fetchUsage();
  }, []);

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch("/api/shadowing/sessions?mode=youtube");
      const data = await res.json();
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsage() {
    try {
      const res = await fetch("/api/shadowing/youtube/usage", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.usage) {
        setUsage(data.usage as Usage);
      }
    } catch {
      // ignore
    }
  }

  async function handleCreate() {
    setCreateError("");
    const videoUrl = youtubeUrl.trim();
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setCreateError("Please enter a valid YouTube URL.");
      return;
    }

    setCreating(true);
    try {
      setCreateStep("Creating session");
      const createRes = await fetch("/api/shadowing/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "youtube", videoId, videoUrl }),
      });
      const createData = await createRes.json().catch(() => null);
      const sessionId = createData?.session?.id as number | undefined;
      if (!sessionId) {
        setCreateError(createData?.error ?? "Failed to create YouTube session");
        return;
      }

      setCreateStep("Fetching transcript");
      const transcriptRes = await fetch("/api/shadowing/youtube/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl, mode: "auto" }),
      });
      const transcriptData = await transcriptRes.json().catch(() => null);
      if (!transcriptRes.ok || !Array.isArray(transcriptData?.segments)) {
        setCreateError(
          transcriptData?.error ?? "Could not fetch transcript from Supadata",
        );
        return;
      }

      setCreateStep("Preparing practice");
      const patchRes = await fetch(`/api/shadowing/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prepareTranscript: true }),
      });
      if (!patchRes.ok) {
        const patchErr = await patchRes.json().catch(() => null);
        setCreateError(
          patchErr?.error ?? "Failed to save transcript to session",
        );
        return;
      }

      setCreateStep("Done");
      await fetchUsage();
      router.push(`/shadowing/youtube/${sessionId}`);
    } catch {
      setCreateError("Failed while preparing YouTube shadowing session");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    if (deleting) return;
    setDeleting(id);
    try {
      await fetch(`/api/shadowing/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            YouTube Shadowing
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create from a YouTube link and practice with auto-built transcript.
          </p>
        </div>
        <Button
          leftSection={<Plus size={14} />}
          onClick={() => setShowCreate(true)}
          disabled={usage?.shouldDisable}
        >
          New YouTube Session
        </Button>
      </div>

      {usage && (
        <div
          className={clsx(
            "rounded-xl border px-3 py-2 text-xs",
            usage.shouldDisable
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-amber-200 bg-amber-50 text-amber-700",
          )}
        >
          Supadata monthly usage: {usage.used}/{usage.limit} credits used.
          Auto-disable at {usage.disableAt} each month.
          {usage.shouldDisable
            ? " Transcript fetching is currently disabled."
            : ` Remaining before disable: ${Math.max(0, usage.disableAt - usage.used)}.`}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader size="sm" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-10 text-center">
          <p className="text-gray-600 font-medium">No YouTube sessions yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create one to start shadowing.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/shadowing/youtube/${s.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/shadowing/youtube/${s.id}`);
                }
              }}
              className="w-full text-left rounded-xl border border-gray-200 bg-white/90 hover:border-red-200 hover:bg-red-50/40 px-4 py-3 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                  <Video size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {s.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                      <Clock3 size={10} /> {fmtDate(s.updatedAt)}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {Array.isArray(s.sentences) ? s.sentences.length : 0}{" "}
                      sentences
                    </span>
                  </div>
                </div>
                <button
                  className={clsx(
                    "w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                    deleting === s.id
                      ? "text-gray-400"
                      : "text-gray-300 hover:bg-red-50 hover:text-red-500",
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void handleDelete(s.id);
                  }}
                >
                  {deleting === s.id ? (
                    <Loader size="xs" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
                <ChevronRight size={15} className="text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        opened={showCreate}
        onClose={() => {
          if (creating) return;
          setShowCreate(false);
          setYoutubeUrl("");
          setCreateError("");
          setCreateStep("");
        }}
        title="Create YouTube Session"
        centered
      >
        <div className="space-y-3">
          <TextInput
            label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.currentTarget.value)}
            disabled={creating}
          />

          {(createStep || createError) && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              {createStep && (
                <>
                  <p className="text-xs text-gray-600 mb-1">{createStep}...</p>
                  <Progress value={progress} animated={creating} size="sm" />
                </>
              )}
              {createError && (
                <p className="text-xs text-red-600 mt-2">{createError}</p>
              )}
            </div>
          )}

          <Button
            fullWidth
            onClick={() => void handleCreate()}
            loading={creating}
            disabled={usage?.shouldDisable}
          >
            {usage?.shouldDisable
              ? "Disabled: Credit Threshold Reached"
              : "Create and Prepare"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
