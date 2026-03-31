"use client";

import { Keyboard, X } from "lucide-react";
import { YOUTUBE_SHORTCUTS } from "@/features/shadowing/shared/constants";

interface ShortcutsModalProps {
  onClose: () => void;
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className=" rounded-2xl p-6 shadow-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-indigo-500" />
            <h3 className="font-bold text-gray-900">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="space-y-2">
          {YOUTUBE_SHORTCUTS.map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <kbd className="shrink-0 min-w-[110px] text-center px-2 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono font-semibold text-gray-700">
                {key}
              </kbd>
              <span className="text-sm text-gray-600">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Active when not focused on an input field
        </p>
      </div>
    </div>
  );
}
