"use client";

import { useEffect } from "react";
import type { MutableRefObject } from "react";
import { applyOrderBadgeToLabel, DRAFT_ID, SELECTED_Z } from "../styles";

export function useUpdateZIndexAndLabels(
  isReady: boolean,
  reservationOrderMap: Record<string, number | undefined> | undefined,
  selectedKey: string | null,
  markerObjsRef: MutableRefObject<Record<string, any>>,
  labelOvRef: MutableRefObject<Record<string, any>>
) {
  useEffect(() => {
    if (!isReady) return;

    const markerMap = markerObjsRef.current ?? {};
    const labelMap = labelOvRef.current ?? {};
    const BASE_Z = 1000;

    // zIndex 갱신
    try {
      Object.entries(markerMap).forEach(([id, mk]) => {
        if (id === DRAFT_ID) return;
        const order = reservationOrderMap?.[id];
        const z = typeof order === "number" ? BASE_Z + (1000 - order) : BASE_Z;
        if (selectedKey && id === selectedKey) mk?.setZIndex?.(SELECTED_Z);
        else mk?.setZIndex?.(z);
      });
    } catch {}

    // 라벨(배지 포함) 갱신
    try {
      Object.entries(labelMap).forEach(([id, ov]) => {
        const el = ov?.getContent?.() as HTMLDivElement | null;
        if (!el) return;

        // ✅ 주소 임시 라벨은 절대 건드리지 않음
        // (useRebuildScene에서 el.dataset.labelType = "address"로 세팅됨)
        if ((el as any).dataset?.labelType === "address") {
          return;
        }

        // 1) rawLabel 확보(없으면 textContent를 원본으로 승격)
        const ds = (el as any).dataset ?? ((el as any).dataset = {});
        if (!ds.rawLabel || ds.rawLabel.trim() === "") {
          ds.rawLabel = el.textContent ?? "";
        }
        const raw = ds.rawLabel ?? "";

        // 2) 배지 반영 필요 여부 체크
        const order = reservationOrderMap?.[id];
        const desiredOrder = typeof order === "number" ? order : null;
        const currentText = el.textContent ?? "";
        const desiredText =
          (typeof desiredOrder === "number" ? String(desiredOrder + 1) : "") +
          raw;
        if (currentText === desiredText) return;

        // 3) 재합성
        el.textContent = "";
        applyOrderBadgeToLabel(el, raw, desiredOrder);
      });
    } catch {}
  }, [isReady, reservationOrderMap, selectedKey]);
}
