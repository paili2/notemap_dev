import { create } from "zustand";

interface GlobalLoadingState {
  isLoading: boolean;
  start: () => void;
  stop: () => void;
}

export const useGlobalLoading = create<GlobalLoadingState>((set) => ({
  isLoading: false,
  start: () => set({ isLoading: true }),
  stop: () => set({ isLoading: false }),
}));
