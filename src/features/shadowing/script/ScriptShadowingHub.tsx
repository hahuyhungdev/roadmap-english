"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Loader, Modal, TextInput } from "@mantine/core";
import { Plus, Trash2, FileText, Clock3, ChevronRight } from "lucide-react";
import clsx from "clsx";

type Session = {
  id: number;
  mode: "youtube" | "script";
  title: string;
  sentences: unknown[] | null;
  updatedAt: string;
};

export default function ScriptShadowingHub() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    void fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch("/api/shadowing/sessions?mode=script");
      const data = await res.json();
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/shadowing/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "script",
          title: title.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.session?.id) {
        router.push(`/shadowing/script/${data.session.id}`);
      }
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
          <h1 className="text-2xl font-bold text-gray-900">Script Shadowing</h1>
          <p className="text-sm text-gray-500 mt-1">
            Practice speaking from your own text, scripts, and lessons.
          </p>
        </div>
        <Button
          leftSection={<Plus size={14} />}
          onClick={() => setShowCreate(true)}
        >
          New Script Session
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader size="sm" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-10 text-center">
          <p className="text-gray-600 font-medium">No Script sessions yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create one to start practicing.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/shadowing/script/${s.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/shadowing/script/${s.id}`);
                }
              }}
              className="w-full text-left rounded-xl border border-gray-200 bg-white/90 hover:border-indigo-200 hover:bg-indigo-50/40 px-4 py-3 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <FileText size={18} />
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
          setTitle("");
        }}
        title="Create Script Session"
        centered
      >
        <div className="space-y-3">
          <TextInput
            label="Title (optional)"
            placeholder="Auto-generated if empty"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            disabled={creating}
          />
          <Button
            fullWidth
            onClick={() => void handleCreate()}
            loading={creating}
          >
            Create
          </Button>
        </div>
      </Modal>
    </div>
  );
}
