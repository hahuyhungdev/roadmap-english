"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Collapse } from "@mantine/core";
import { ChevronDown, StickyNote } from "lucide-react";
import clsx from "clsx";
import type { PhraseGroup } from "@/lib/sessions.server";

type LessonNote = {
  sessionSlug: string;
  content: string;
  updatedAt: string | null;
};

type PhaseNoteSummary = {
  sessionSlug: string;
  title: string;
  sessionNumber: number;
  lines: string[];
};

const NOTE_FORMAT_PREFIX = "__NOTE_PANEL_V2__";

function normalizeNoteLine(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function extractNoteLines(content: string): string[] {
  const raw = content.trim();
  if (!raw) return [];

  if (raw.startsWith(NOTE_FORMAT_PREFIX)) {
    const jsonRaw = raw.slice(NOTE_FORMAT_PREFIX.length).trim();
    try {
      const parsed = JSON.parse(jsonRaw) as Record<string, unknown>;
      return ["vocabulary", "mispronounced", "incorrect"].flatMap((key) => {
        const section = parsed[key];
        if (typeof section !== "string") return [];
        return section
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean);
      });
    } catch {
      return [raw];
    }
  }

  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildNoteSummaries(
  phase: PhraseGroup,
  notes: LessonNote[],
): PhaseNoteSummary[] {
  const notesBySlug = new Map(notes.map((note) => [note.sessionSlug, note]));
  const seen = new Set<string>();

  return phase.sessions
    .map((session) => {
      const note = notesBySlug.get(session.id);
      const uniqueLines = extractNoteLines(note?.content ?? "").filter(
        (line) => {
          const normalized = normalizeNoteLine(line);
          if (!normalized || seen.has(normalized)) return false;
          seen.add(normalized);
          return true;
        },
      );

      return {
        sessionSlug: session.id,
        title: session.meta.title,
        sessionNumber: session.meta.sessionNumber,
        lines: uniqueLines,
      };
    })
    .filter((summary) => summary.lines.length > 0);
}

export default function PhaseNotesReview({ phase }: { phase: PhraseGroup }) {
  const [opened, setOpened] = useState(false);
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [notesStatus, setNotesStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  const sessionIdsKey = useMemo(
    () => phase.sessions.map((session) => session.id).join(","),
    [phase.sessions],
  );

  useEffect(() => {
    if (!sessionIdsKey) {
      setNotes([]);
      setNotesStatus("ready");
      return;
    }

    const controller = new AbortController();
    setNotesStatus("loading");

    fetch(`/api/lesson-notes?sessionSlugs=${encodeURIComponent(sessionIdsKey)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load lesson notes");
        const data = (await response.json()) as { notes?: LessonNote[] };
        setNotes(data.notes ?? []);
        setNotesStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setNotes([]);
        setNotesStatus("error");
      });

    return () => controller.abort();
  }, [sessionIdsKey]);

  const noteSummaries = useMemo(
    () => buildNoteSummaries(phase, notes),
    [notes, phase],
  );
  const uniqueNoteCount = noteSummaries.reduce(
    (count, summary) => count + summary.lines.length,
    0,
  );
  const summaryText =
    notesStatus === "loading"
      ? "Loading saved lesson notes..."
      : notesStatus === "error"
        ? "Could not load saved notes."
        : `${uniqueNoteCount} unique note${
            uniqueNoteCount === 1 ? "" : "s"
          } across this phase`;

  return (
    <div className="border border-gray-200 rounded-2xl p-5 mb-7 shadow-sm bg-white/70 theme-dark:bg-slate-900/70 theme-dark:border-slate-700">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 theme-dark:bg-amber-950/80">
            <StickyNote
              size={16}
              className="text-amber-600 theme-dark:text-amber-300"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 theme-dark:text-slate-50">
              Phase Notes Review
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 theme-dark:text-slate-400">
              {summaryText}
            </p>
          </div>
        </div>

        <Button
          size="xs"
          variant="light"
          color="yellow"
          rightSection={
            <ChevronDown
              size={14}
              className={clsx("transition-transform", opened && "rotate-180")}
            />
          }
          onClick={() => setOpened((value) => !value)}
          disabled={notesStatus === "loading" || notesStatus === "error"}
        >
          {opened ? "Hide Review" : "Open Review"}
        </Button>
      </div>

      <Collapse expanded={opened}>
        <div className="pt-4 mt-4 border-t border-gray-100 theme-dark:border-slate-700">
          {noteSummaries.length === 0 ? (
            <p className="text-sm text-gray-500 theme-dark:text-slate-400">
              No saved notes in this phase yet.
            </p>
          ) : (
            <div className="space-y-5">
              {noteSummaries.map((summary) => (
                <section key={summary.sessionSlug}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-400 w-7 theme-dark:text-slate-500">
                      {String(summary.sessionNumber).padStart(2, "0")}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-800 theme-dark:text-slate-100">
                      {summary.title}
                    </h3>
                  </div>
                  <ul className="space-y-1.5 pl-9">
                    {summary.lines.map((line) => (
                      <li
                        key={`${summary.sessionSlug}-${normalizeNoteLine(line)}`}
                        className="text-sm text-gray-600 leading-relaxed list-disc theme-dark:text-slate-300"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </Collapse>
    </div>
  );
}
