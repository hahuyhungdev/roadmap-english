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
import { Rnd } from "react-rnd";
import { $api } from "@/lib/api/client";

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

type SectionKey = "vocabulary" | "mispronounced" | "incorrect";
type SectionNotes = Record<SectionKey, string>;

const SECTION_LABELS: Record<SectionKey, string> = {
  vocabulary: "NEW VOCABULARY",
  mispronounced: "MISPRONOUNCED WORDS",
  incorrect: "INCORRECT SENTENCES",
};

const NOTE_FORMAT_PREFIX = "__NOTE_PANEL_V2__";

const EMPTY_NOTES: SectionNotes = {
  vocabulary: "",
  mispronounced: "",
  incorrect: "",
};

function parseSectionContent(content: string): SectionNotes {
  const raw = content.trim();
  if (!raw) return { ...EMPTY_NOTES };

  if (raw.startsWith(NOTE_FORMAT_PREFIX)) {
    const jsonRaw = raw.slice(NOTE_FORMAT_PREFIX.length).trim();
    try {
      const parsed = JSON.parse(jsonRaw) as Partial<SectionNotes>;
      return {
        vocabulary:
          typeof parsed.vocabulary === "string" ? parsed.vocabulary : "",
        mispronounced:
          typeof parsed.mispronounced === "string" ? parsed.mispronounced : "",
        incorrect: typeof parsed.incorrect === "string" ? parsed.incorrect : "",
      };
    } catch {
      return { ...EMPTY_NOTES, vocabulary: content };
    }
  }

  // Legacy fallback: keep previous free-text notes in the first section.
  return { ...EMPTY_NOTES, vocabulary: content };
}

function serializeSectionContent(notes: SectionNotes): string {
  return `${NOTE_FORMAT_PREFIX}\n${JSON.stringify(notes)}`;
}

function getSectionLineCount(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\n+/).length : 0;
}

export default function NotePanel() {
  const [opened, setOpened] = useState(false);
  const [sectionNotes, setSectionNotes] = useState<SectionNotes>({ ...EMPTY_NOTES });
  const pathname = usePathname();
  const { width, height } = useViewportSize();

  const sessionSlug = extractSessionSlug(pathname ?? "");

  const noteQuery = $api.useQuery(
    "get",
    "/api/lesson-notes",
    {
      params: {
        query: {
          sessionSlug: sessionSlug ?? "",
        },
      },
    },
    {
      enabled: Boolean(sessionSlug && opened),
      staleTime: 0,
    },
  );

  useEffect(() => {
    if (!sessionSlug) {
      setSectionNotes({ ...EMPTY_NOTES });
      return;
    }

    if (noteQuery.data) {
      setSectionNotes(parseSectionContent(noteQuery.data.content));
    }
  }, [sessionSlug, noteQuery.data]);

  const saveMutation = $api.useMutation("put", "/api/lesson-notes", {
    onSuccess: async () => {
      await noteQuery.refetch();
    },
  });

  const serverNotes = parseSectionContent(noteQuery.data?.content ?? "");
  const serializedCurrent = serializeSectionContent(sectionNotes);
  const serializedServer = serializeSectionContent(serverNotes);
  const isDirty = Boolean(sessionSlug) && serializedCurrent !== serializedServer;

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
        body: {
          sessionSlug,
          content: serializedCurrent,
        },
      });
    } catch (err) {
      console.error("[NotePanel] Failed to save lesson note", err);
    }
  };

  const panelDefaultWidth = 400;
  const panelPreferredHeight = Math.max(640, Math.floor(height * 0.9));
  const panelDefaultHeight =
    height > 0 ? Math.max(500, Math.min(panelPreferredHeight, height - 24)) : 640;

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
            x: Math.max(0, width - panelDefaultWidth - 24),
            y: Math.max(8, (height - panelDefaultHeight) / 2),
            width: panelDefaultWidth,
            height: panelDefaultHeight,
          }}
          minWidth={360}
          minHeight={420}
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

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                padding: "10px 12px 14px",
              }}
            >
              {(["vocabulary", "mispronounced", "incorrect"] as SectionKey[]).map(
                (sectionKey, index) => (
                  <div
                    key={sectionKey}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: index === 2 ? 1 : undefined,
                      minHeight: index === 2 ? 220 : 170,
                      marginTop: index === 0 ? 0 : 12,
                      paddingTop: index === 0 ? 0 : 12,
                      borderTop:
                        index === 0
                          ? "none"
                          : "1px solid var(--mantine-color-gray-3)",
                    }}
                  >
                    <Group justify="space-between" mb={6}>
                      <Text size="xs" fw={700} c="dimmed">
                        {SECTION_LABELS[sectionKey]}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {getSectionLineCount(sectionNotes[sectionKey])} line
                        {getSectionLineCount(sectionNotes[sectionKey]) === 1 ? "" : "s"}
                      </Text>
                    </Group>

                    <Textarea
                      value={sectionNotes[sectionKey]}
                      onChange={(event) => {
                        const nextValue = event.currentTarget.value;
                        setSectionNotes((prev) => ({
                          ...prev,
                          [sectionKey]: nextValue,
                        }));
                      }}
                      disabled={!sessionSlug || noteQuery.isPending}
                      placeholder={
                        !sessionSlug
                          ? "Open a lesson page to start taking notes..."
                          : noteQuery.isPending
                            ? "Loading notes..."
                            : `Add notes for ${SECTION_LABELS[sectionKey]}...`
                      }
                      styles={{
                        root: {
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                        },
                        wrapper: {
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                        },
                        input: {
                          flex: 1,
                          minHeight: index === 2 ? 180 : 120,
                          resize: "none",
                          fontSize: "14px",
                        },
                      }}
                    />
                  </div>
                ),
              )}
            </div>
          </Paper>
        </Rnd>
      )}
    </>
  );
}
