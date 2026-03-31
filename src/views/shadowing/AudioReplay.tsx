"use client";

import { useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import clsx from "clsx";

interface AudioReplayProps {
  url: string;
}

export function AudioReplay({ url }: AudioReplayProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
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

  return (
    <>
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
      <button
        onClick={toggle}
        title={playing ? "Stop playback" : "Replay your recording"}
        className={clsx(
          "shrink-0 w-7 h-7 flex items-center justify-center rounded-full border transition-colors",
          playing
            ? "bg-indigo-100 border-indigo-400 text-indigo-600"
            : " border-gray-200 text-gray-500 hover:border-indigo-400 hover:text-indigo-600",
        )}
      >
        {playing ? (
          <Square size={10} className="fill-current" />
        ) : (
          <Play size={10} className="fill-current" />
        )}
      </button>
    </>
  );
}
