"use client";

import {
  ActionIcon,
  Affix,
  Tooltip,
  Paper,
  CloseButton,
  Button,
  Group,
  Text,
  Textarea,
} from "@mantine/core";
import { NotebookPen, GripHorizontal, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useViewportSize } from "@mantine/hooks";
import { usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Rnd } from "react-rnd";

const LESSON_PATH_RE = /^\/phase\/[^/]+\/session\/([^/?#]+)/;

function extractSessionSlug(pathname: string): string | null {
  const match = LESSON_PATH_RE.exec(pathname);
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function formatSavedTime(isoDate: string | null): string {
  if (!isoDate) return "Not saved yet";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "Saved";
  return `Saved at ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

type LessonNote = {
  sessionSlug: string;
  content: string;
  updatedAt: string | null;
};

export default function NotePanel() {
  const [opened, setOpened] = useState(false);
  const [content, setContent] = useState("");
  const pathname = usePathname();
  const { width, height } = useViewportSize();
  const queryClient = useQueryClient();

  const sessionSlug = extractSessionSlug(pathname ?? "");

  const noteQuery = useQuery({
    queryKey: ["lesson-note", sessionSlug],
    enabled: Boolean(sessionSlug && opened),
    queryFn: async (): Promise<LessonNote> => {
      if (!sessionSlug) {
        return { sessionSlug: "", content: "", updatedAt: null };
      }

      const res = await fetch(
        `/api/lesson-notes?sessionSlug=${encodeURIComponent(sessionSlug)}`,
        { cache: "no-store" },
      );

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = (await res.json()) as Partial<LessonNote>;
      return {
        sessionSlug,
        content: typeof data.content === "string" ? data.content : "",
        updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null,
      };
    },
  });

  useEffect(() => {
    if (!sessionSlug) {
      setContent("");
      return;
    }

    if (noteQuery.data) {
      setContent(noteQuery.data.content);
    }
  }, [sessionSlug, noteQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      sessionSlug: string;
      content: string;
    }): Promise<LessonNote> => {
      const res = await fetch("/api/lesson-notes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = (await res.json()) as Partial<LessonNote>;
      return {
        sessionSlug: payload.sessionSlug,
        content: typeof data.content === "string" ? data.content : payload.content,
        updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null,
      };
    },
    onSuccess: (savedNote) => {
      queryClient.setQueryData(["lesson-note", savedNote.sessionSlug], savedNote);
    },
  });

  const serverContent = noteQuery.data?.content ?? "";
  const isDirty = Boolean(sessionSlug) && content !== serverContent;

  const statusText = !sessionSlug
    ? "Open a lesson page to start notes"
    : noteQuery.isPending
      ? "Loading..."
      : noteQuery.isError
        ? "Failed to load note"
        : saveMutation.isPending
          ? "Saving..."
          : saveMutation.isError
            ? "Failed to save note"
            : isDirty
              ? "Unsaved changes"
              : formatSavedTime(noteQuery.data?.updatedAt ?? null);

  const handleManualSave = async () => {
    if (!sessionSlug || !isDirty || saveMutation.isPending) return;
    try {
      await saveMutation.mutateAsync({
        sessionSlug,
        content,
      });
    } catch (err) {
      console.error("[NotePanel] Failed to save lesson note", err);
    }
  };

  return (
    <>
      <Affix
        position={{ top: "50%", right: 20 }}
        zIndex={100}
        style={{ transform: "translateY(-50%)" }}
      >
        <Tooltip label="Take Notes" position="left">
          <ActionIcon
            size="xl"
            radius="xl"
            variant="filled"
            color="blue"
            onClick={() => setOpened((o) => !o)}
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
          >
            <NotebookPen size={24} />
          </ActionIcon>
        </Tooltip>
      </Affix>

      {opened && width > 0 && (
        <Rnd
          default={{
            x: Math.max(0, width - 420),
            y: Math.max(0, (height - 500) / 2),
            width: 400,
            height: 500,
          }}
          minWidth={300}
          minHeight={250}
          bounds="window"
          dragHandleClassName="drag-handle"
          style={{ zIndex: 101, position: "fixed" }}
        >
          <Paper
            shadow="xl"
            radius="md"
            withBorder
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <Group
              p="xs"
              style={{
                borderBottom: "1px solid var(--mantine-color-gray-3)",
                backgroundColor: "var(--mantine-color-gray-0)",
              }}
              justify="space-between"
              wrap="nowrap"
            >
              <Group
                gap="xs"
                className="drag-handle"
                style={{ cursor: "grab", flex: 1 }}
              >
                <GripHorizontal size={16} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                  }}
                >
                  <Text size="sm" fw={600}>
                    My Notes
                  </Text>
                  <Text
                    size="xs"
                    c={noteQuery.isError || saveMutation.isError ? "red" : "dimmed"}
                    style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {sessionSlug ? `Lesson: ${sessionSlug} • ${statusText}` : statusText}
                  </Text>
                </div>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<Save size={14} />}
                  onClick={() => void handleManualSave()}
                  loading={saveMutation.isPending}
                  disabled={!sessionSlug || noteQuery.isPending || !isDirty}
                >
                  Save
                </Button>
                <CloseButton size="sm" onClick={() => setOpened(false)} />
              </Group>
            </Group>

            <Textarea
              value={content}
              onChange={(event) => setContent(event.currentTarget.value)}
              disabled={!sessionSlug || noteQuery.isPending}
              placeholder={
                !sessionSlug
                  ? "Open a lesson page to start taking notes..."
                  : noteQuery.isPending
                    ? "Loading notes..."
                    : "Start taking notes for this lesson..."
              }
              styles={{
                root: {
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                },
                wrapper: { flex: 1, display: "flex", flexDirection: "column" },
                input: {
                  flex: 1,
                  resize: "none",
                  border: "none",
                  borderRadius: 0,
                  padding: "16px",
                  fontSize: "16px",
                },
              }}
            />
          </Paper>
        </Rnd>
      )}
    </>
  );
}
