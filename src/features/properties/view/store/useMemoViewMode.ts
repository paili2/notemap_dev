import { create } from "zustand";

export type MemoViewMode = "public" | "secret"; // K&N / R

interface MemoViewState {
  mode: MemoViewMode;
  setMode: (mode: MemoViewMode) => void;
  toggle: () => void;
}

export const useMemoViewMode = create<MemoViewState>((set) => ({
  mode: "public", // 기본은 K&N
  setMode: (mode) => set({ mode }),
  toggle: () =>
    set((s) => ({
      mode: s.mode === "public" ? "secret" : "public",
    })),
}));
