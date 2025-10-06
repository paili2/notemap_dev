"use client";
import { useMemo } from "react";
import { useSidebar } from "@/features/sidebar/SideBarProvider";

export function usePinsSortedByReservation<T>(
  items: T[],
  getId: (x: T) => string
) {
  const { reservationOrderMap } = useSidebar();
  return useMemo(() => {
    const INF = Number.POSITIVE_INFINITY;
    return items.slice().sort((a, b) => {
      const oa = reservationOrderMap?.[getId(a)] ?? INF;
      const ob = reservationOrderMap?.[getId(b)] ?? INF;
      return oa - ob;
    });
  }, [items, reservationOrderMap, getId]);
}
