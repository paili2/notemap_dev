"use client";

import { useEffect } from "react";
import {
  hideLabelsAround,
  showLabelsAround,
} from "../../../engine/overlays/labelRegistry";
import { LatLng } from "@/lib/geo/types";

type UseLabelMaskOnMenuOpenArgs = {
  open: boolean;
  map: any;
  kakaoSDK: any;
  anchor: LatLng | null;
  radius?: number;
};

/**
 * 컨텍스트 메뉴 open 기준으로 주변 라벨을 숨겼다가,
 * 닫힐 때 복원하는 훅
 */
export function useLabelMaskOnMenuOpen({
  open,
  map,
  kakaoSDK,
  anchor,
  radius = 240,
}: UseLabelMaskOnMenuOpenArgs) {
  useEffect(() => {
    if (!open || !map || !anchor) return;

    const { lat, lng } = anchor;

    const runHide = () => {
      try {
        hideLabelsAround(map, lat, lng, radius);
        requestAnimationFrame(() => hideLabelsAround(map, lat, lng, radius));
        setTimeout(() => hideLabelsAround(map, lat, lng, radius), 0);
      } catch (e) {
        console.warn("[LabelMask] hideLabelsAround failed:", e);
      }
    };

    // 즉시 1회
    runHide();

    // idle 직후 1회
    let idleKey: any = null;
    try {
      const ev =
        (globalThis as any)?.kakao?.maps?.event ?? kakaoSDK?.maps?.event;
      if (ev && typeof ev.addListener === "function") {
        idleKey = ev.addListener(map, "idle", () => {
          try {
            ev.removeListener(idleKey);
          } catch {}
          runHide();
        });
      } else {
        setTimeout(runHide, 150);
      }
    } catch {
      setTimeout(runHide, 150);
    }

    // 짧은 재시도 (라벨 지연 렌더 대비)
    let tries = 0;
    const maxTries = 8;
    const t = setInterval(() => {
      tries += 1;
      runHide();
      if (tries >= maxTries) clearInterval(t);
    }, 150);

    // 닫힐 때 복원
    return () => {
      try {
        clearInterval(t);
      } catch {}
      try {
        const ev =
          (globalThis as any)?.kakao?.maps?.event ?? kakaoSDK?.maps?.event;
        if (ev && typeof ev.removeListener === "function" && idleKey)
          ev.removeListener(idleKey);
      } catch {}
      try {
        showLabelsAround(map, lat, lng, radius + 40);
      } catch (e) {
        console.warn("[LabelMask] showLabelsAround failed:", e);
      }
    };
  }, [open, map, kakaoSDK, anchor?.lat, anchor?.lng, radius]);
}
