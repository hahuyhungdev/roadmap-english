import { useState, useEffect, useRef } from "react";

const MILESTONES = [
  { seconds: 300, label: "5 min focus", emoji: "🔥" },
  { seconds: 600, label: "10 min session", emoji: "💪" },
  { seconds: 1200, label: "20 min deep work", emoji: "🌟" },
  { seconds: 1800, label: "30 min streak", emoji: "🏆" },
  { seconds: 3600, label: "1 hour grind", emoji: "🚀" },
] as const;

export interface TimerMilestone {
  label: string;
  emoji: string;
}

export function useSessionTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active && !intervalRef.current) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (!active && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const latestMilestone: TimerMilestone | null =
    MILESTONES.filter((m) => seconds >= m.seconds).at(-1) ?? null;

  return { seconds, formatted, latestMilestone };
}
