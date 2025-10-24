"use client";
import { createContext, useContext, useMemo } from "react";
import { useSidebarState } from "./hooks/useSidebarState";
import { useScheduledReservations } from "@/features/survey-reservations/hooks/useScheduledReservations";

const SidebarCtx = createContext<
  | (ReturnType<typeof useSidebarState> & {
      reservationOrderMap: Record<string, number>;
      reservationOrderByPosKey: Record<string, number>;
    })
  | null
>(null);

export function SideBarProvider({ children }: { children: React.ReactNode }) {
  const state = useSidebarState();
  const { items: reservations = [] } = useScheduledReservations();

  // ✅ pinDraftId → sortOrder 매핑
  const reservationOrderMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of reservations) {
      if (r.pinDraftId && typeof r.sortOrder === "number") {
        map[String(r.pinDraftId)] = r.sortOrder;
      }
    }
    return map;
  }, [reservations]);

  // ✅ posKey(lat,lng) → sortOrder 매핑
  const reservationOrderByPosKey = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of reservations) {
      const key =
        r.posKey ??
        (r.lat && r.lng
          ? `${Number(r.lat).toFixed(5)},${Number(r.lng).toFixed(5)}`
          : undefined);
      if (key && typeof r.sortOrder === "number") {
        map[key] = r.sortOrder;
      }
    }
    return map;
  }, [reservations]);

  const value = useMemo(
    () => ({
      ...state,
      reservationOrderMap,
      reservationOrderByPosKey,
    }),
    [state, reservationOrderMap, reservationOrderByPosKey]
  );

  return <SidebarCtx.Provider value={value}>{children}</SidebarCtx.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
