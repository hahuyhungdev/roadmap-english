"use client";

import { useState } from "react";
import { ChevronRight, Lightbulb } from "lucide-react";
import clsx from "clsx";
import type { SpeakingReview } from "./types";

interface ReviewCardProps {
  review: SpeakingReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1.5 rounded-xl border border-indigo-100 bg-indigo-50/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100/40 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Lightbulb size={11} /> Review &amp; Corrections
        </span>
        <ChevronRight
          size={12}
          className={clsx(
            "text-indigo-500 transition-transform",
            open && "rotate-90",
          )}
        />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-red-500 font-semibold mb-1">
                You said
              </p>
              <p className="text-xs text-gray-700  rounded-lg px-2.5 py-1.5 border border-red-100 leading-relaxed">
                {review.original_transcript}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-green-600 font-semibold mb-1">
                Better version
              </p>
              <p className="text-xs text-gray-800  rounded-lg px-2.5 py-1.5 border border-green-100 font-medium leading-relaxed">
                {review.corrected_version}
              </p>
            </div>
          </div>
          {review.explanation && (
            <p className="text-xs text-gray-600 leading-relaxed">
              {review.explanation}
            </p>
          )}
          {review.better_alternatives?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                Alternatives
              </p>
              <div className="flex flex-wrap gap-1.5">
                {review.better_alternatives.map((alt, i) => (
                  <span
                    key={i}
                    className="text-xs  border border-indigo-100 text-indigo-700 rounded-full px-2 py-0.5"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
