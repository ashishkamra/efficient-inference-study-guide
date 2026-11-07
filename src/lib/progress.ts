import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CheckResult = {
  choice: number;
  /** Missing on entries migrated from the v1 schema, where only the choice was stored. */
  correct?: boolean;
  at: number;
};

export type ExamAttempt = {
  at: number;
  score: number;
  total: number;
};

type ProgressState = {
  complete: string[];
  checks: Record<string, CheckResult>;
  exam: Record<string, number>;
  examSubmitted: boolean;
  examAttempts: ExamAttempt[];
  lastLessonId: string | null;
  videoProgress: Record<string, number>;
  hydrated: boolean;
  completeLesson: (id: string) => void;
  uncompleteLesson: (id: string) => void;
  toggleLesson: (id: string) => void;
  answerCheck: (id: string, choice: number, correct: boolean) => void;
  resetCheck: (id: string) => void;
  answerExam: (id: string, choice: number) => void;
  submitExam: (score: number, total: number) => void;
  resetExam: () => void;
  resetAll: () => void;
  setHydrated: () => void;
  setLastLesson: (id: string) => void;
  setVideoProgress: (id: string, seconds: number) => void;
};

const EMPTY = {
  complete: [] as string[],
  checks: {} as Record<string, CheckResult>,
  exam: {} as Record<string, number>,
  examSubmitted: false,
  examAttempts: [] as ExamAttempt[],
  lastLessonId: null as string | null,
  videoProgress: {} as Record<string, number>,
};

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...EMPTY,
      hydrated: false,
      completeLesson: (id) =>
        set((s) => ({ complete: s.complete.includes(id) ? s.complete : [...s.complete, id] })),
      uncompleteLesson: (id) =>
        set((s) => ({ complete: s.complete.filter((lessonId) => lessonId !== id) })),
      toggleLesson: (id) =>
        set((s) => ({
          complete: s.complete.includes(id)
            ? s.complete.filter((lessonId) => lessonId !== id)
            : [...s.complete, id],
        })),
      answerCheck: (id, choice, correct) =>
        set((s) => ({
          checks: { ...s.checks, [id]: { choice, correct, at: Date.now() } },
        })),
      resetCheck: (id) =>
        set((s) => {
          const checks = { ...s.checks };
          delete checks[id];
          return { checks };
        }),
      answerExam: (id, choice) => set((s) => ({ exam: { ...s.exam, [id]: choice } })),
      submitExam: (score, total) =>
        set((s) => ({
          examSubmitted: true,
          examAttempts: [
            ...s.examAttempts.slice(-9),
            { at: Date.now(), score, total },
          ],
        })),
      resetExam: () => set({ exam: {}, examSubmitted: false }),
      resetAll: () => set({ ...EMPTY }),
      setHydrated: () => set({ hydrated: true }),
      setLastLesson: (id) => set({ lastLessonId: id }),
      setVideoProgress: (id, seconds) =>
        set((s) => ({
          videoProgress: {
            ...s.videoProgress,
            [id]: Number.isFinite(seconds) ? Math.max(0, seconds) : 0,
          },
        })),
    }),
    {
      name: "ridge-progress-v1",
      version: 2,
      skipHydration: true,
      partialize: (s) => ({
        complete: s.complete,
        checks: s.checks,
        exam: s.exam,
        examSubmitted: s.examSubmitted,
        examAttempts: s.examAttempts,
        lastLessonId: s.lastLessonId,
        videoProgress: s.videoProgress,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<ProgressState>),
        hydrated: false,
      }),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Record<string, unknown>;
        if (version < 2) {
          const rawChecks = (state.checks ?? {}) as Record<string, number | CheckResult>;
          const checks: Record<string, CheckResult> = {};
          for (const [id, value] of Object.entries(rawChecks)) {
            checks[id] =
              typeof value === "number"
                ? { choice: value, at: 0 }
                : { choice: value.choice, correct: value.correct, at: value.at ?? 0 };
          }
          return {
            ...state,
            checks,
            examAttempts: state.examAttempts ?? [],
            lastLessonId: state.lastLessonId ?? null,
            videoProgress: state.videoProgress ?? {},
          };
        }
        return state;
      },
    },
  ),
);
