"use client";

import {
  ActionIcon,
  Affix,
  Tooltip,
  Paper,
  CloseButton,
  Group,
  Text,
  Textarea,
} from "@mantine/core";
import { NotebookPen, GripHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocalStorage, useViewportSize } from "@mantine/hooks";
import { Rnd } from "react-rnd";

export default function NotePanel() {
  const [opened, setOpened] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { width, height } = useViewportSize();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [content, setContent] = useLocalStorage({
    key: "roadmap-english-notes",
    defaultValue: "",
  });

  if (!mounted) return null;

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

      {opened && mounted && width > 0 && (
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
                <Text size="sm" fw={600}>
                  My Notes
                </Text>
              </Group>
              <CloseButton size="sm" onClick={() => setOpened(false)} />
            </Group>

            <Textarea
              value={content}
              onChange={(event) => setContent(event.currentTarget.value)}
              placeholder="Start taking notes..."
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
