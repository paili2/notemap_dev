"use client";

import { useEffect } from "react";
import type { MutableRefObject } from "react";
import {
  applyOrderBadgeToLabel,
  DRAFT_ID,
  SELECTED_Z,
} from "../overlays/overlayStyles";

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

    // ───────── 마커 zIndex 갱신 ─────────
    try {
      Object.entries(markerMap).forEach(([id, mk]) => {
        if (!mk) return;

        const idStr = String(id);

        // ✅ 1) "선택 위치" 임시 question 핀
        if (idStr === DRAFT_ID || idStr === "__draft__") {
          mk.setZIndex?.(DRAFT_Z);
          return;
        }

        // ✅ 2) 답사예정 서버핀도 뒤로
        if (idStr.startsWith("__visit__")) {
          mk.setZIndex?.(DRAFT_Z);
          return;
        }

        // ✅ 3) 일반 매물핀
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

    // ───────── 라벨(배지 포함) 갱신 + 선택된 라벨 숨기기 ─────────
    try {
      Object.entries(labelMap).forEach(([id, ov]) => {
        const el = ov?.getContent?.() as HTMLDivElement | null;
        if (!el) return;

        const ds = (el as any).dataset ?? ((el as any).dataset = {});
        const idStr = String(id);

        // ✅ 0) 이미 숨긴 라벨이면 건드리지 않음
        if (ds.hiddenBySelected === "1") return;

        // ✅ 1) 선택된 핀 라벨은 **아예 지도에서 제거**
        if (selectedKey && idStr === selectedKey) {
          ds.hiddenBySelected = "1";

          try {
            // 라벨을 통째로 지도에서 떼버림
            ov.setMap?.(null);
          } catch {
            /* ignore */
          }
          return; // 이 라벨에 대해서는 추가 처리 X
        }

        // ✅ 주소 임시 라벨은 배지 안 붙임
        if (ds.labelType === "address") return;

        if (!ds.rawLabel || ds.rawLabel.trim() === "") {
          ds.rawLabel = el.textContent ?? "";
        }
        const raw = ds.rawLabel ?? "";

        const order = reservationOrderMap?.[idStr];
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
