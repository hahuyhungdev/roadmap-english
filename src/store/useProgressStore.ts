import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProgressStore {
  completedSessions: string[];
  toggleCompleted: (id: string) => void;
  isCompleted: (id: string) => boolean;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      completedSessions: [],
      toggleCompleted: (id) =>
        set((state) => ({
          completedSessions: state.completedSessions.includes(id)
            ? state.completedSessions.filter((s) => s !== id)
            : [...state.completedSessions, id],
        })),
      isCompleted: (id) => get().completedSessions.includes(id),
    }),
    { name: "english-progress" },
  ),
);
