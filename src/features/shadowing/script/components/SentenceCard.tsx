"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Pencil,
  Mic,
  Play,
  Square,
  X,
  Volume2,
} from "lucide-react";
import { ActionIcon, Group, Loader, Text, Tooltip } from "@mantine/core";
import { AudioReplay } from "../../shared/AudioReplay";
import type { useTTSSettings } from "../../shared/useTTSSettings";

type TTS = ReturnType<typeof useTTSSettings>;

// ─── Word highlight helper ────────────────────────────────────────────────────
// Splits `text` around the word at `charIndex` for karaoke-style highlight.
// Falls back to plain text when not speaking (charIndex < 0).
function SpeakingText({
  text,
  charIndex,
}: {
  text: string;
  charIndex: number;
}) {
  if (charIndex < 0 || charIndex >= text.length) {
    return <span className="text-gray-900">{text}</span>;
  }
  // Find end of the current word
  const after = text.slice(charIndex);
  const wordEnd = after.search(/\s/);
  const end = charIndex + (wordEnd === -1 ? after.length : wordEnd);

  return (
    <>
      <span className="text-gray-400">{text.slice(0, charIndex)}</span>
      <span className="bg-indigo-100 text-indigo-900 rounded-sm px-0.5">
        {text.slice(charIndex, end)}
      </span>
      <span className="text-gray-900">{text.slice(end)}</span>
    </>
  );
}

interface Props {
  text: string;
  sentenceIdx: number;
  total: number;
  tts: TTS;
  isRecording: boolean;
  lastAudioUrl: string | null;
  onListen: () => void;
  onToggleRecording: () => void;
  onPrev: () => void;
  onNext: () => void;
  onUpdateText: (nextText: string) => void;
}

export function SentenceCard({
  text,
  sentenceIdx,
  total,
  tts,
  isRecording,
  lastAudioUrl,
  onListen,
  onToggleRecording,
  onPrev,
  onNext,
  onUpdateText,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(text);

  useEffect(() => {
    if (!isEditing) setDraftText(text);
  }, [text, isEditing]);

  function handleSave() {
    const next = draftText.trim();
    if (!next) return;
    onUpdateText(next);
    setIsEditing(false);
  }

  function handleEditorKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setDraftText(text);
      setIsEditing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 shadow-sm p-5 space-y-4 transition-all">
      {/* Sentence text */}
      <div className="space-y-1">
        <Group justify="space-between" align="center">
          <Text
            size="xs"
            c="dimmed"
            className="uppercase tracking-widest font-semibold"
          >
            Sentence {sentenceIdx + 1} / {total}
          </Text>

          {isEditing ? (
            <div className="flex items-center gap-1">
              <Tooltip label="Save sentence" position="top" withArrow>
                <ActionIcon
                  variant="light"
                  color="teal"
                  size="sm"
                  radius="xl"
                  onClick={handleSave}
                  disabled={!draftText.trim()}
                >
                  <Check size={12} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Cancel" position="top" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  radius="xl"
                  onClick={() => {
                    setDraftText(text);
                    setIsEditing(false);
                  }}
                >
                  <X size={12} />
                </ActionIcon>
              </Tooltip>
            </div>
          ) : (
            <Tooltip label="Edit sentence" position="top" withArrow>
              <ActionIcon
                variant="subtle"
                color="indigo"
                size="sm"
                radius="xl"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={12} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
        {isEditing ? (
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={handleEditorKey}
            className="mt-1 w-full min-h-[88px] rounded-xl border border-indigo-200 bg-white px-3 py-2 text-base leading-relaxed font-medium tracking-wide text-gray-900 focus:border-indigo-400 focus:outline-none"
            placeholder="Edit this sentence"
          />
        ) : (
          <p className="text-lg leading-relaxed font-medium tracking-wide mt-1">
            <SpeakingText text={text} charIndex={tts.speakingCharIndex} />
          </p>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        <Tooltip label="Previous (A / ←)" position="top" withArrow>
          <ActionIcon
            variant="default"
            radius="xl"
            size="lg"
            onClick={onPrev}
            disabled={sentenceIdx === 0}
          >
            <ArrowLeft size={14} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Listen (S / Space)" position="top" withArrow>
          <ActionIcon
            variant="light"
            color="violet"
            radius="xl"
            size="lg"
            onClick={onListen}
            disabled={tts.loading || tts.playing}
            className="flex-1"
          >
            {tts.loading ? (
              <Loader size="xs" color="violet" />
            ) : tts.playing ? (
              <Volume2 size={14} className="animate-pulse" />
            ) : (
              <Play size={14} />
            )}
          </ActionIcon>
        </Tooltip>

        {tts.playing && (
          <Tooltip label="Stop TTS" position="top" withArrow>
            <ActionIcon
              variant="light"
              color="red"
              radius="xl"
              size="lg"
              onClick={tts.stop}
            >
              <Square size={13} />
            </ActionIcon>
          </Tooltip>
        )}

        <Tooltip
          label={isRecording ? "Stop recording (R / ↑)" : "Record (R / ↑)"}
          position="top"
          withArrow
        >
          <ActionIcon
            variant={isRecording ? "filled" : "light"}
            color={isRecording ? "red" : "gray"}
            radius="xl"
            size="lg"
            onClick={onToggleRecording}
            className="flex-1"
          >
            {isRecording ? <Square size={13} /> : <Mic size={14} />}
          </ActionIcon>
        </Tooltip>

        {lastAudioUrl && (
          <Tooltip label="Replay your voice" position="top" withArrow>
            <div className="shrink-0">
              <AudioReplay
                url={lastAudioUrl}
                autoReplayDelayMs={1000}
                autoReplayCount={1}
              />
            </div>
          </Tooltip>
        )}

        <Tooltip label="Next (D / →)" position="top" withArrow>
          <ActionIcon
            variant="default"
            radius="xl"
            size="lg"
            onClick={onNext}
            disabled={sentenceIdx >= total - 1}
          >
            <ArrowRight size={14} />
          </ActionIcon>
        </Tooltip>
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 text-red-500">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium">Recording…</span>
        </div>
      )}
    </div>
  );
}
