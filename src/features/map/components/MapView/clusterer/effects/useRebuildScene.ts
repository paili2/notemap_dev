"use client";

import React, { useEffect, useMemo } from "react";
import type { MapMarker } from "@/features/map/types/map";
import type { PinKind } from "@/features/pins/types";
import { DRAFT_ID, SELECTED_Z } from "../style";
import {
  createMarker,
  createLabelOverlay,
  createHitboxOverlay,
} from "../overlays";
import { mountClusterMode } from "../controller";

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
  const sceneKey = useMemo(() => {
    try {
      const core = [...(markers ?? [])]
        .map((m: any) => ({
          id: String(m.id),
          lat: m.position?.lat,
          lng: m.position?.lng,
          name:
            (m?.name ?? m?.title ?? m?.label ?? m?.address ?? "")?.toString() ??
            "",
          source: m?.source ?? "",
        }))
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      return JSON.stringify(core);
    } catch {
      return `len:${markers?.length ?? 0}`;
    }
  }, [markers]);

  // 첫 번째 “실제 값” 선택
  function firstNonEmpty(...vals: Array<unknown>) {
    for (const v of vals) {
      if (typeof v === "string") {
        const t = v.trim();
        if (t.length > 0) return t;
      } else if (typeof v === "number") {
        return String(v);
      }
    }
    return undefined;
  }

  // 좌표 → posKey (소수 5자리 ≈ 1.1m)
  function toPosKey(lat?: number, lng?: number) {
    if (typeof lat === "number" && typeof lng === "number") {
      return `${lat.toFixed(5)},${lng.toFixed(5)}`;
    }
    return undefined;
  }

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

    // 순번 매칭 유틸: id 우선, **주소 임시핀은 posKey 매칭 금지**
    const resolveOrderIndex = (m: any): number | undefined => {
      const byId = reservationOrderMap?.[String(m.pinDraftId ?? m.id)];
      if (typeof byId === "number") return byId;

      const key = String(m.id ?? "");
      const isAddressOnly =
        m.source === "geocode" ||
        m.source === "search" ||
        key.startsWith("__temp__") ||
        key.startsWith("__addr__") ||
        key === DRAFT_ID;

      if (isAddressOnly) return undefined; // 주소임시핀은 순번 매칭 X

      const lat =
        typeof m.position?.lat === "number"
          ? m.position.lat
          : m.getPosition?.().getLat?.();
      const lng =
        typeof m.position?.lng === "number"
          ? m.position.lng
          : m.getPosition?.().getLng?.();
      const posKey = m.posKey ?? (toPosKey(lat, lng) as string | undefined);

      if (posKey && reservationOrderByPosKey) {
        const byPos = reservationOrderByPosKey[posKey];
        if (typeof byPos === "number") return byPos;
      }
      return undefined;
    };

    console.debug("[RebuildScene] start", {
      realMarkersKey,
      sceneKey,
      total: markers.length,
    });

    // ① 미리 isPlan 판정 + posKey 계산
    const enriched = (markers as any[]).map((m) => {
      const key = String(m.id);
      const order = resolveOrderIndex(m); // 0 포함 number | undefined
      const isDraft = m.source === "draft";

      const isAddressOnly =
        m.source === "geocode" ||
        m.source === "search" ||
        key.startsWith("__temp__") ||
        key.startsWith("__addr__") ||
        key === DRAFT_ID;

      const lat =
        typeof m.position?.lat === "number"
          ? m.position.lat
          : m.getPosition?.().getLat?.();
      const lng =
        typeof m.position?.lng === "number"
          ? m.position.lng
          : m.getPosition?.().getLng?.();
      const posKey = m.posKey ?? toPosKey(lat, lng); // 허용오차 포함 posKey

      // ✅ 주소임시핀은 절대 isPlan 되지 않도록 가드
      const isPlan =
        !isAddressOnly &&
        (isDraft ||
          m.isPlan === true ||
          m.visit?.state === "PLANNED" ||
          (typeof m.planCount === "number" && m.planCount > 0) ||
          typeof order === "number");

      return { m, key, order, isDraft, isPlan, isAddressOnly, posKey };
    });

    // ② 같은 좌표에 plan이 하나라도 있으면 그 posKey는 plan-only 처리
    const planPosSet = new Set(
      enriched
        .filter((e) => e.isPlan && e.posKey)
        .map((e) => e.posKey as string)
    );

    // ③ 라벨을 posKey 단위로 1개만 유지하기 위한 저장소
    const labelByPos: Record<string, { ov: any; isPlan: boolean }> = {};

    // ④ 렌더 순서: plan 먼저 → 일반
    const ordered = enriched.sort((a, b) =>
      a.isPlan === b.isPlan ? 0 : a.isPlan ? -1 : 1
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

        // 라벨 표기 텍스트
        const displayName =
          firstNonEmpty(
            m.name,
            (m as any).propertyTitle,
            (m as any).property_name,
            m.title,
            m.label,
            m.address
          ) ?? key;
        const planText = `${m.regionLabel ?? ""} 답사예정`.trim();

        // ── 마커 ─────────────────────────────────────────────
        const mk = createMarker(kakao, pos, {
          isDraft,
          key,
          kind: (m.kind ?? defaultPinKind) as PinKind,
          title: isPlan ? planText : displayName,
        });
        markerObjsRef.current[key] = mk;

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

        const labelText = isPlan ? planText : displayName;

        // plan 라벨이 들어오면 같은 위치/근접 라벨들 제거
        if (isPlan) {
          if (posKey) hideLabelsByPosKey(posKey);
          const lat = m.position?.lat,
            lng = m.position?.lng;
          if (typeof lat === "number" && typeof lng === "number")
            hideLabelsNear(lat, lng, 20);
        }

        // 같은 key로 남아있던 이전 라벨 제거(안전망)
        try {
          const prev = labelOvRef.current[key];
          if (prev) {
            prev.setMap?.(null);
            delete labelOvRef.current[key];
          }
        } catch {}

        // 같은 posKey의 기존 라벨 제거 후 교체
        if (isPlan && posKey && labelByPos[posKey]) {
          try {
            labelByPos[posKey].ov.setMap?.(null);
          } catch {}
          delete labelByPos[posKey];
        }

        // 새 라벨 생성
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
            (el as any).dataset.posKey = posKey ?? "";
            (el as any).dataset.posLat = String(m.position?.lat ?? "");
            (el as any).dataset.posLng = String(m.position?.lng ?? "");
            (el as any).dataset.labelType = isPlan ? "plan" : "address";

            // ✅ 배지는 보존하고 제목만 업데이트
            // 1) 구조 있는 경우: data-role="label-title"만 변경
            const titleEl = (el as any).querySelector?.(
              '[data-role="label-title"]'
            );
            if (titleEl) {
              if (titleEl.textContent !== labelText)
                titleEl.textContent = labelText;
            } else if (!el.childElementCount) {
              // 2) 매우 옛날(텍스트만 있던) 라벨과의 호환: 내용이 없을 때만 전체 텍스트 설정
              if (!el.textContent || el.textContent !== labelText) {
                el.textContent = labelText;
              }
            }
          }
        } catch {}

        labelOvRef.current[key] = labelOv;
        if (posKey) labelByPos[posKey] = { ov: labelOv, isPlan };

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
      if (!cleared)
        markerObjsRef.current[selectedKey!]?.setZIndex?.(SELECTED_Z);
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
          if (mk && handler)
            kakao.maps.event.removeListener(mk, "click", handler);
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
