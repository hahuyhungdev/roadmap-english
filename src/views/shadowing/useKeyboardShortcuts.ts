"use client";

import { useEffect, useRef } from "react";
import type { YTPlayer, Sentence } from "./types";

interface UseKeyboardShortcutsProps {
  sentences: Sentence[];
  activeSentenceIdx: number;
  isRecording: boolean;
  playerRef: React.MutableRefObject<YTPlayer | null>;
  onPrevSentence: (idx: number) => void;
  onNextSentence: (idx: number) => void;
  onToggleRecording: () => void;
  onToggleShortcutsModal: () => void;
  onToggleTtsSettings: () => void;
}

export function useKeyboardShortcuts({
  sentences,
  activeSentenceIdx,
  isRecording,
  playerRef,
  onPrevSentence,
  onNextSentence,
  onToggleRecording,
  onToggleShortcutsModal,
  onToggleTtsSettings,
}: UseKeyboardShortcutsProps) {
  const activeSentenceIdxRef = useRef(activeSentenceIdx);

  useEffect(() => {
    activeSentenceIdxRef.current = activeSentenceIdx;
  }, [activeSentenceIdx]);

  const keyHandlerRef = useRef<(e: globalThis.KeyboardEvent) => void>(() => {});

  useEffect(() => {
    keyHandlerRef.current = (e: globalThis.KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      const player = playerRef.current;
      const currentIdx = activeSentenceIdxRef.current;

      switch (e.key) {
        // Space: play/pause
        case " ":
          e.preventDefault();
          if (player) {
            player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo();
          }
          break;

        // Arrow Left: previous sentence (Shift) or rewind 5s
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) {
            if (currentIdx > 0) {
              onPrevSentence(currentIdx - 1);
            }
          } else {
            player?.seekTo((player.getCurrentTime() ?? 0) - 5, true);
          }
          break;

        // Arrow Right: next sentence (Shift) or forward 5s
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) {
            if (currentIdx < sentences.length - 1) {
              onNextSentence(currentIdx + 1);
            }
          } else {
            player?.seekTo((player.getCurrentTime() ?? 0) + 5, true);
          }
          break;

        // Arrow Down: pause video
        case "ArrowDown":
          e.preventDefault();
          if (player) {
            player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo();
          }
          break;

        // R: record/stop recording
        case "r":
        case "R":
          e.preventDefault();
          onToggleRecording();
          break;

        // ?: show shortcuts
        case "?":
          e.preventDefault();
          onToggleShortcutsModal();
          break;

        // Escape: close modals
        case "Escape":
          e.preventDefault();
          onToggleShortcutsModal();
          onToggleTtsSettings();
          break;
      }
    };
  }, [sentences, onPrevSentence, onNextSentence, onToggleRecording, onToggleShortcutsModal, onToggleTtsSettings, playerRef]);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
