"use client";

import clsx from "clsx";

interface SentenceCardProps {
  idx: number;
  active: boolean;
  onClick: (idx: number) => void;
  setRef: (el: HTMLButtonElement | null) => void;
}

export function SentenceCard({
  idx,
  active,
  onClick,
  setRef,
}: SentenceCardProps) {
  return (
    <button
      ref={setRef}
      type="button"
      onClick={() => onClick(idx)}
      className={clsx(
        "h-10 min-w-[38px] rounded-full border px-3 text-xs font-semibold transition-all flex items-center justify-center",
        active
          ? "border-indigo-400 bg-indigo-600 text-white shadow-sm"
          : "border-gray-200  text-gray-600 hover:border-indigo-400 hover:bg-indigo-50",
      )}
      title={`Sentence ${idx + 1}`}
    >
      {idx + 1}
    </button>
  );
}
