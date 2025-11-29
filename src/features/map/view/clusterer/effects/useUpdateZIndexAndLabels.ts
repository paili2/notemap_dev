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
    const DRAFT_Z = -99999; // 🔥 임시/답사예정 핀은 항상 맨 뒤로

    // ───────── zIndex 갱신 ─────────
    try {
      Object.entries(markerMap).forEach(([id, mk]) => {
        if (!mk) return;

        const idStr = String(id);

        // ✅ 1) "선택 위치" 임시 question 핀
        if (idStr === DRAFT_ID || idStr === "__draft__") {
          mk.setZIndex?.(DRAFT_Z);
          return;
        }

        // ✅ 2) 서버 드래프트(답사예정) 핀도 뒤로 보내고 싶으면
        //     "__visit__" prefix 도 같이 내리기
        if (idStr.startsWith("__visit__")) {
          mk.setZIndex?.(DRAFT_Z);
          return;
        }

        // ✅ 3) 그 외(실매물 핀)는 기존 규칙 유지
        const order = reservationOrderMap?.[idStr];
        const z = typeof order === "number" ? BASE_Z + (1000 - order) : BASE_Z;

        if (selectedKey && idStr === selectedKey) {
          mk.setZIndex?.(SELECTED_Z);
        } else {
          mk.setZIndex?.(z);
        }
      });
    } catch {
      // ignore
    }

    // ───────── 라벨(배지 포함) 갱신 ─────────
    try {
      Object.entries(labelMap).forEach(([id, ov]) => {
        const el = ov?.getContent?.() as HTMLDivElement | null;
        if (!el) return;

        // ✅ 주소 임시 라벨은 건드리지 않음
        if ((el as any).dataset?.labelType === "address") return;

        const ds = (el as any).dataset ?? ((el as any).dataset = {});
        if (!ds.rawLabel || ds.rawLabel.trim() === "") {
          ds.rawLabel = el.textContent ?? "";
        }
        const raw = ds.rawLabel ?? "";

        const order = reservationOrderMap?.[String(id)];
        const desiredOrder = typeof order === "number" ? order : null;
        const currentText = el.textContent ?? "";
        const desiredText =
          (typeof desiredOrder === "number" ? String(desiredOrder + 1) : "") +
          raw;

        if (currentText === desiredText) return;

        el.textContent = "";
        applyOrderBadgeToLabel(el, raw, desiredOrder);
      });
    } catch {
      // ignore
    }
  }, [isReady, reservationOrderMap, selectedKey]);
}
