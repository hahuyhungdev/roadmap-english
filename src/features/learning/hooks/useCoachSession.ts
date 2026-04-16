"use client";

import { useRef, useState } from "react";
import type { Review, Turn } from "../types/coach";

type HistoryMsg = { role: "user" | "assistant"; content: string };

interface UseCoachSessionProps {
  lessonTitle?: string;
  lessonContent?: string;
}

interface UseCoachSessionResult {
  turns: Turn[];
  loading: boolean;
  isPlaying: boolean;
  callCoach: (text: string) => Promise<void>;
  clearSession: () => void;
}

export function useCoachSession({
  lessonTitle,
  lessonContent,
}: UseCoachSessionProps): UseCoachSessionResult {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const historyRef = useRef<HistoryMsg[]>([]);

  async function callCoach(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setTurns((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: trimmed },
    ]);
    const history = historyRef.current.slice(-6);

    setLoading(true);
    let fullReply = "";
    let fullResponse = "";

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: trimmed,
          topic: lessonTitle || undefined,
          lessonContent: lessonContent || undefined,
          history,
        }),
      });

      let data: {
        reply?: string;
        review?: Review;
        audioContent?: string;
        error?: string;
      } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(
          `Server error ${res.status} — is the API server running? Run \`vercel dev\` locally.`,
        );
      }
      if (!res.ok)
        throw new Error(data.error || `Coach API error ${res.status}`);

      fullReply = data.reply || "";
      fullResponse = fullReply.replace(/```review[\s\S]*?```/g, "").trim();

      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: trimmed },
        { role: "assistant", content: fullReply },
      ];

      const coachId = `c-${Date.now()}`;
      setTurns((prev) => [
        ...prev,
        {
          id: coachId,
          role: "coach",
          text: "",
          review: data.review ?? undefined,
        },
      ]);

      // Stream text incrementally (word by word)
      const words = fullResponse.split(" ");
      let currentText = "";
      for (const word of words) {
        currentText += (currentText ? " " : "") + word;
        setTurns((prev) =>
          prev.map((t) => (t.id === coachId ? { ...t, text: currentText } : t)),
        );
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      // Play TTS after text is fully rendered
      if (data.audioContent) {
        setIsPlaying(true);
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audio.onended = () => setIsPlaying(false);
        audio.play().catch(() => setIsPlaying(false));
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setTurns((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "coach", text: `⚠️ ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearSession() {
    setTurns([]);
    historyRef.current = [];
    setIsPlaying(false);
  }

  return {
    turns,
    loading,
    isPlaying,
    callCoach,
    clearSession,
  };
}
