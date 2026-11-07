import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProgressState = {
  complete: string[];
  checks: Record<string, number>;
  exam: Record<string, number>;
  examSubmitted: boolean;
  hydrated: boolean;
  completeLesson: (id: string) => void;
  answerCheck: (id: string, choice: number) => void;
  answerExam: (id: string, choice: number) => void;
  submitExam: () => void;
  resetExam: () => void;
  resetAll: () => void;
  setHydrated: () => void;
};

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      complete: [],
      checks: {},
      exam: {},
      examSubmitted: false,
      hydrated: false,
      completeLesson: (id) =>
        set((s) => ({ complete: s.complete.includes(id) ? s.complete : [...s.complete, id] })),
      answerCheck: (id, choice) => set((s) => ({ checks: { ...s.checks, [id]: choice } })),
      answerExam: (id, choice) => set((s) => ({ exam: { ...s.exam, [id]: choice } })),
      submitExam: () => set({ examSubmitted: true }),
      resetExam: () => set({ exam: {}, examSubmitted: false }),
      resetAll: () => set({ complete: [], checks: {}, exam: {}, examSubmitted: false }),
      setHydrated: () => set({ hydrated: true }),
    }),
    { name: "ridge-progress-v1", skipHydration: true },
  ),
);
