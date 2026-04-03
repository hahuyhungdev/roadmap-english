"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import clsx from "clsx";

interface AudioReplayProps {
  url: string;
  autoReplayCount?: number;
  autoReplayDelayMs?: number;
  className?: string;
}

export function AudioReplay({
  url,
  autoReplayCount = 0,
  autoReplayDelayMs = 0,
  className,
}: AudioReplayProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const runIdRef = useRef(0);

  async function playOnce(): Promise<boolean> {
    const a = audioRef.current;
    if (!a) return false;

    a.currentTime = 0;

    try {
      await a.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      return false;
    }

    return await new Promise<boolean>((resolve) => {
      const finish = () => {
        a.removeEventListener("ended", onEnded);
        a.removeEventListener("error", onError);
        resolve(true);
      };
      const fail = () => {
        a.removeEventListener("ended", onEnded);
        a.removeEventListener("error", onError);
        resolve(false);
      };
      const onEnded = () => {
        setPlaying(false);
        finish();
      };
      const onError = () => {
        setPlaying(false);
        fail();
      };

      a.addEventListener("ended", onEnded, { once: true });
      a.addEventListener("error", onError, { once: true });
    });
  }

  function toggle() {
    runIdRef.current += 1;
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      a.currentTime = 0;
      setPlaying(false);
    } else {
      void a.play();
      setPlaying(true);
    }
  }

  useEffect(() => {
    if (autoReplayCount <= 0) return;

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    let cancelled = false;
    const timer = setTimeout(async () => {
      for (let i = 0; i < autoReplayCount; i++) {
        if (cancelled || runIdRef.current !== runId) break;
        const ok = await playOnce();
        if (!ok) break;
      }
    }, autoReplayDelayMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url, autoReplayCount, autoReplayDelayMs]);

  return (
    <>
      <audio
        ref={audioRef}
        src={url}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        className="hidden"
      />
      <button
        onClick={toggle}
        title={playing ? "Stop playback" : "Replay your recording"}
        className={clsx(
          "shrink-0 w-9 h-9 flex items-center justify-center rounded-full border transition-colors",
          playing
            ? "bg-indigo-100 border-indigo-400 text-indigo-600"
            : " border-gray-200 text-gray-500 hover:border-indigo-400 hover:text-indigo-600",
          className,
        )}
      >
        {playing ? (
          <Square size={12} className="fill-current" />
        ) : (
          <Play size={12} className="fill-current" />
        )}
      </button>
    </>
  );
}
