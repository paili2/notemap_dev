import { create } from "zustand";

type ReservationVersionState = {
  version: number;
  bump: () => void;
  set: (v: number) => void; // 필요시
};

export const useReservationVersion = create<ReservationVersionState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
  set: (v) => set({ version: v }),
}));
