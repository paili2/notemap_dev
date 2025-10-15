"use client";

import { useEffect } from "react";
import { DRAFT_ID, SELECTED_Z, applyOrderBadgeToLabel } from "../style";

export function useUpdateZIndexAndLabels(
  isReady: boolean,
  reservationOrderMap: Record<string, number | undefined> | undefined,
  selectedKey: string | null,
  markerObjsRef: React.MutableRefObject<Record<string, any>>,
  labelOvRef: React.MutableRefObject<Record<string, any>>
) {
  useEffect(() => {
    if (!isReady) return;

    const BASE_Z = 1000;

    Object.entries(markerObjsRef.current).forEach(([id, mk]) => {
      if (id === DRAFT_ID) return;
      const order = reservationOrderMap?.[id] ?? null;
      const z = order ? BASE_Z + (1000 - order) : BASE_Z;
      try {
        if (selectedKey && id === selectedKey) mk.setZIndex?.(SELECTED_Z);
        else mk.setZIndex?.(z);
      } catch {}
    });

    Object.entries(labelOvRef.current).forEach(([id, ov]) => {
      const el = ov.getContent?.() as HTMLDivElement | null;
      if (!el) return;
      const raw = (el as any).dataset?.rawLabel ?? el.textContent ?? "";
      const order = reservationOrderMap?.[id] ?? null;
      applyOrderBadgeToLabel(el, raw, order);
    });
  }, [isReady, reservationOrderMap, selectedKey]);
}
