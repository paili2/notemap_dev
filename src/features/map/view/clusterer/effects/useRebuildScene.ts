"use client";

import { useEffect, useMemo } from "react";
import type { MapMarker } from "@/features/map/shared/types/map";
import type { PinKind } from "@/features/pins/types";

import {
  createMarker,
  createLabelOverlay,
  createHitboxOverlay,
} from "../overlays";
import { mountClusterMode } from "../controller";
import { DRAFT_ID, SELECTED_Z } from "../styles";
import {
  buildSceneKey,
  cleanLabelCandidate,
  enrichMarkers,
  firstNonEmpty,
} from "./rebuildScene.helpers";
import type { EnrichedMarker } from "./rebuildScene.helpers";

type Args = {
  isReady: boolean;
  kakao: any;
  map: any;
  markers: readonly MapMarker[];
  reservationOrderMap: Record<string, number | undefined> | undefined;
  reservationOrderByPosKey?: Record<string, number | undefined>;
  defaultPinKind: PinKind;
  labelGapPx: number;
  hitboxSizePx: number;
  safeLabelMax: number;
  clusterMinLevel: number;
  selectedKey: string | null;
  realMarkersKey: string; // 키 변경 시 재생성
  // refs
  markerObjsRef: React.MutableRefObject<Record<string, any>>;
  markerClickHandlersRef: React.MutableRefObject<
    Record<string, ((...a: any[]) => void) | null>
  >;
  labelOvRef: React.MutableRefObject<Record<string, any>>;
  hitboxOvRef: React.MutableRefObject<Record<string, any>>;
  clustererRef: React.MutableRefObject<any>;
  onMarkerClickRef: React.MutableRefObject<((id: string) => void) | undefined>;
};

export function useRebuildScene(args: Args) {
  const {
    isReady,
    kakao,
    map,
    markers,
    reservationOrderMap,
    reservationOrderByPosKey,
    defaultPinKind,
    labelGapPx,
    hitboxSizePx,
    safeLabelMax,
    clusterMinLevel,
    selectedKey,
    realMarkersKey,
    markerObjsRef,
    markerClickHandlersRef,
    labelOvRef,
    hitboxOvRef,
    clustererRef,
    onMarkerClickRef,
  } = args;

  // markers 내용 변화에 반응하도록 안정적인 키 생성
  const sceneKey = useMemo(() => buildSceneKey(markers), [markers]);

  useEffect(() => {
    if (!isReady) return;

    // ── cleanup old ─────────────────────────────────────────────
    Object.entries(markerClickHandlersRef.current).forEach(([id, handler]) => {
      const mk = markerObjsRef.current[id];
      if (mk && handler) kakao.maps.event.removeListener(mk, "click", handler);
    });
    markerClickHandlersRef.current = {};
    Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
    labelOvRef.current = {};
    Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(null));
    hitboxOvRef.current = {};
    clustererRef.current?.clear?.();
    Object.values(markerObjsRef.current).forEach((mk: any) => mk.setMap(null));
    markerObjsRef.current = {};

    // ① 미리 isPlan 판정 + posKey 계산
    const enriched: EnrichedMarker[] = enrichMarkers(
      markers,
      reservationOrderMap,
      reservationOrderByPosKey
    );

    // ② 라벨을 posKey 단위로 1개만 유지하기 위한 저장소
    const labelByPos: Record<string, { ov: any; isPlan: boolean }> = {};

    // ③ 렌더 순서: 일반 먼저 → plan(답사 관련) 나중
    const ordered = enriched.sort((a, b) =>
      a.isPlan === b.isPlan ? 0 : a.isPlan ? 1 : -1
    );

    // 거리(m)
    const distM = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371000;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    };

    const hideLabelsByPosKey = (pk: string) => {
      Object.entries(labelOvRef.current).forEach(([k, ov]: any) => {
        try {
          const el = ov?.getContent?.();
          if (el?.dataset?.posKey === pk) {
            ov.setMap?.(null);
            delete labelOvRef.current[k];
          }
        } catch {}
      });
    };

    const hideLabelsNear = (lat: number, lng: number, thresholdM = 20) => {
      Object.entries(labelOvRef.current).forEach(([k, ov]: any) => {
        try {
          const el = ov?.getContent?.();
          const plat = parseFloat(el?.dataset?.posLat ?? "NaN");
          const plng = parseFloat(el?.dataset?.posLng ?? "NaN");
          if (Number.isFinite(plat) && Number.isFinite(plng)) {
            if (distM(lat, lng, plat, plng) <= thresholdM) {
              ov.setMap?.(null);
              delete labelOvRef.current[k];
            }
          }
        } catch {}
      });
    };

    ordered.forEach(
      ({ m, key, order, isDraft, isPlan, isAddressOnly, posKey }) => {
        const pos = new kakao.maps.LatLng(m.position.lat, m.position.lng);

        // 🔹 name이 주소랑 같은 경우는 라벨 후보에서 제외하기 위한 전처리
        const nameCandidate = (() => {
          const n = (m as any).name;
          const addr = (m as any).address ?? (m as any).addressLine;
          if (
            typeof n === "string" &&
            n.trim().length > 0 &&
            (!addr || n.trim() !== String(addr).trim())
          ) {
            return n; // 주소와 다른 진짜 이름만 허용
          }
          return undefined;
        })();

        const displayName =
          firstNonEmpty(
            // 1순위: 매물명 계열
            cleanLabelCandidate((m as any).property?.name),
            cleanLabelCandidate((m as any).property?.title),
            cleanLabelCandidate((m as any).data?.propertyName),
            cleanLabelCandidate((m as any).propertyName),

            // 2순위: MapMarker.name (주소랑 다를 때만)
            cleanLabelCandidate(nameCandidate),

            // 3순위: 기타 name 계열
            cleanLabelCandidate((m as any).point?.name),
            cleanLabelCandidate((m as any).data?.name),

            // 4순위: 그 다음에야 title(주소 등)
            cleanLabelCandidate(m.title),

            // 5순위: 그래도 없으면 id (내부키는 cleanLabelCandidate로 필터)
            cleanLabelCandidate(String(m.id ?? ""))
          ) || "";

        const planText = `${m.regionLabel ?? ""} 답사예정`.trim();

        // ── 마커 ─────────────────────────────────────────────
        const mk = createMarker(kakao, pos, {
          isDraft,
          key,
          kind: (m.kind ?? defaultPinKind) as PinKind,
          title: isPlan ? planText : displayName,
        });
        markerObjsRef.current[key] = mk;

        // 🔥 임시 question 핀 / 답사예정 placeholder 들은 항상 맨 뒤로
        if (
          key === "__draft__" || // 지도 빈 곳 클릭해서 생기는 임시핀
          key === DRAFT_ID || // DRAFT_ID 상수 (보통 "__draft__")
          key.startsWith("__visit__") // serverDrafts에서 온 답사예정핀
        ) {
          mk.setZIndex(-99999);
        }

        // 클릭 핸들러
        const handler = () => onMarkerClickRef.current?.(key);
        kakao.maps.event.addListener(mk, "click", handler);
        markerClickHandlersRef.current[key] = handler;

        /** 🔒 주소 임시핀은 라벨을 아예 만들지 않는다. (히트박스만) */
        if (isAddressOnly) {
          const hitOv = createHitboxOverlay(kakao, pos, hitboxSizePx, () =>
            onMarkerClickRef.current?.(key)
          );
          hitboxOvRef.current[key] = hitOv;
          return; // ⬅️ 여기서 끝!
        }

        /** ✅ 같은 위치에 이미 "매물 라벨(비 plan)"이 있으면,
         *    이 핀(plan)은 라벨 없이 히트박스만 만든다.
         *    → 매물등록핀 라벨만 남기기 위함
         */
        if (isPlan && posKey && labelByPos[posKey]?.isPlan === false) {
          const hitOv = createHitboxOverlay(kakao, pos, hitboxSizePx, () =>
            onMarkerClickRef.current?.(key)
          );
          hitboxOvRef.current[key] = hitOv;
          return;
        }

        const labelText = isPlan ? planText : displayName;

        // plan 라벨이 들어오면 같은 위치/근접 라벨들 제거
        if (isPlan) {
          if (posKey) hideLabelsByPosKey(posKey);
          const lat = m.position?.lat;
          const lng = m.position?.lng;
          if (typeof lat === "number" && typeof lng === "number") {
            hideLabelsNear(lat, lng, 20);
          }
        }

        // 🔁 기존 라벨이 있으면 제거하지 말고 텍스트 + 위치만 업데이트
        const prev = labelOvRef.current[key];
        if (prev) {
          const el = prev.getContent?.() as HTMLElement | null;

          const titleEl = el?.querySelector?.(
            '[data-role="label-title"]'
          ) as HTMLElement | null;

          if (titleEl) {
            titleEl.textContent = labelText;
          } else if (el) {
            el.textContent = labelText;
          }

          prev.setPosition(pos);
          prev.setMap(map);

          return; // ⬅️ 새 라벨 생성 로직을 건너뛰고 끝!
        }

        // 같은 posKey의 기존 라벨 제거 후 교체 (plan → 교체 가능)
        if (isPlan && posKey && labelByPos[posKey]) {
          try {
            labelByPos[posKey].ov.setMap?.(null);
          } catch {}
          delete labelByPos[posKey];
        }

        // 새 라벨 생성 (dataset에는 "원본 좌표"도 심어둔다 — 반올림 금지)
        const labelOv = createLabelOverlay(
          kakao,
          pos,
          labelText,
          labelGapPx,
          typeof order === "number" ? order : undefined
        );
        try {
          const el = labelOv.getContent?.() as HTMLDivElement | null;
          if (el) {
            (el as any).dataset = (el as any).dataset || {};
            (el as any).dataset.rawLabel = labelText;
            (el as any).dataset.posKey = posKey ?? ""; // 그룹핑 전용 키
            (el as any).dataset.posLat = String(m.position?.lat ?? ""); // 원본
            (el as any).dataset.posLng = String(m.position?.lng ?? ""); // 원본
            (el as any).dataset.labelType = isPlan ? "plan" : "address";

            // ✅ 배지는 보존하고 제목만 업데이트
            const titleEl = (el as any).querySelector?.(
              '[data-role="label-title"]'
            );
            if (titleEl) {
              if (titleEl.textContent !== labelText) {
                titleEl.textContent = labelText;
              }
            } else if (!el.childElementCount) {
              // 옛날(텍스트만 있던) 라벨과의 호환
              if (!el.textContent || el.textContent !== labelText) {
                el.textContent = labelText;
              }
            }
          }
        } catch {}

        labelOvRef.current[key] = labelOv;
        if (posKey) {
          labelByPos[posKey] = { ov: labelOv, isPlan };
        }

        // 히트박스
        const hitOv = createHitboxOverlay(kakao, pos, hitboxSizePx, () =>
          onMarkerClickRef.current?.(key)
        );
        hitboxOvRef.current[key] = hitOv;
      }
    );

    // ── initial mode ─────────────────────────────────────────────
    const level = map.getLevel();
    if (level <= safeLabelMax) {
      clustererRef.current?.clear?.();
      Object.values(markerObjsRef.current).forEach((mk: any) => mk.setMap(map));
      const cleared = selectedKey == null;
      Object.entries(labelOvRef.current).forEach(([id, ov]: any[]) =>
        ov.setMap(!cleared && id === selectedKey ? null : map)
      );
      Object.entries(hitboxOvRef.current).forEach(([id, ov]: any[]) =>
        ov.setMap(!cleared && id === selectedKey ? null : map)
      );
      if (!cleared) {
        markerObjsRef.current[selectedKey!]?.setZIndex?.(SELECTED_Z);
      }
    } else if (level >= clusterMinLevel) {
      mountClusterMode(
        { kakao, map },
        {
          markerObjsRef,
          markerClickHandlersRef,
          labelOvRef,
          hitboxOvRef,
          clustererRef,
          onMarkerClickRef,
        },
        selectedKey
      );
    } else {
      Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
      clustererRef.current?.clear?.();
      Object.values(markerObjsRef.current).forEach((mk: any) => mk.setMap(map));
      Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(map));
    }

    // ── cleanup ─────────────────────────────────────────────
    return () => {
      Object.entries(markerClickHandlersRef.current).forEach(
        ([id, handler]) => {
          const mk = markerObjsRef.current[id];
          if (mk && handler) {
            kakao.maps.event.removeListener(mk, "click", handler);
          }
        }
      );
      markerClickHandlersRef.current = {};
      clustererRef.current?.clear?.();
      Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
      Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(null));
      Object.values(markerObjsRef.current).forEach((mk: any) =>
        mk.setMap(null)
      );
      labelOvRef.current = {};
      hitboxOvRef.current = {};
      markerObjsRef.current = {};
    };
    // realMarkersKey 또는 markers 내용(sceneKey) 변경 시 재구성
  }, [
    isReady,
    sceneKey, // markers 변화에 반응
    realMarkersKey,
    kakao,
    map,
    reservationOrderMap,
    reservationOrderByPosKey,
    defaultPinKind,
    labelGapPx,
    hitboxSizePx,
    safeLabelMax,
    clusterMinLevel,
    selectedKey,
  ]);
}
