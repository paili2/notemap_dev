// features/map/pages/MapHomeUI/hooks/usePlaceSearchOnMap.ts
"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PinKind } from "@/features/pins/types";
import { distM } from "@/features/map/poi/lib/geometry";
import { useSearchDraftMarkers } from "./useSearchDraftMarkers";
import { searchPlaceOnMap } from "./searchPlaceOnMap";

type Args = {
  kakaoSDK: any;
  mapInstance: any;
  effectiveServerPoints: any[];
  effectiveServerDrafts: any[];
  onSubmitSearch?: (q: string) => void;
  onViewportChange?: (v: any) => void;
  onOpenMenu?: (args: {
    position: { lat: number; lng: number };
    propertyId: string | number;
    propertyTitle: string;
    pin?: { kind: PinKind; isFav: boolean };
    source?: string;
  }) => void;
  onChangeHideLabelForId?: (id?: string) => void;
  menuOpen: boolean;
  menuAnchor: { lat: number; lng: number } | null;
  hideLabelForId?: string;
  /** 🔥 검색으로 매물 잡았을 때, “핀 클릭”처럼 처리하는 콜백 */
  onMarkerClick?: (id: string | number) => void;
};

function usePlaceSearchOnMap({
  kakaoSDK,
  mapInstance,
  effectiveServerPoints,
  effectiveServerDrafts,
  onSubmitSearch,
  onViewportChange,
  onOpenMenu,
  onChangeHideLabelForId,
  menuOpen,
  menuAnchor,
  hideLabelForId,
  onMarkerClick,
}: Args) {
  const lastSearchCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  // 🔒 마지막 viewport 기억해서 동일 viewport 중복 호출은 막기
  const lastViewportRef = useRef<any | null>(null);

  const {
    localDraftMarkers: rawLocalDraftMarkers,
    upsertDraftMarker,
    replaceTempByRealId,
    clearTempMarkers,
    clearSearchMarkers,
  } = useSearchDraftMarkers();

  if (process.env.NODE_ENV !== "production") {
    console.log("[usePlaceSearchOnMap] init", {
      samplePoint: effectiveServerPoints?.[0],
      hideLabelForId,
      menuOpen,
    });
  }

  /** 다양한 형태의 객체에서 lat/lng를 추출하는 유틸 */
  const extractLatLng = (obj: any): { lat: number; lng: number } | null => {
    if (!obj) return null;

    // Kakao LatLng 객체
    if (typeof obj.getLat === "function" && typeof obj.getLng === "function") {
      const lat = obj.getLat();
      const lng = obj.getLng();
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    }

    // { position: { lat, lng } } or { latlng: { lat, lng } } or 그냥 { lat, lng }
    const src = obj.position ?? obj.latlng ?? obj;
    const lat = Number(src?.lat);
    const lng = Number(src?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  };

  /**
   * 🔒 검색 결과용 임시 마커(__search__)를 올릴 때
   * 이미 근처에 "실제 매물 or 답사예정핀 or 기존 검색핀" 이 있으면
   * 새 임시핀을 만들지 않는 래퍼.
   */
  const safeUpsertDraftMarker = useCallback(
    (marker: any) => {
      const pos = extractLatLng(marker);

      // 좌표를 못 뽑으면 비정상 marker → 임시핀 생성도 하지 않음
      if (!pos) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[usePlaceSearchOnMap] safeUpsertDraftMarker: invalid marker, skip",
            marker
          );
        }
        return;
      }

      const { lat, lng } = pos;
      const NEAR_THRESHOLD_M = 800; // 넉넉하게

      const hasServerPointNear = (effectiveServerPoints ?? []).some((p) => {
        const pp = extractLatLng(p);
        return pp && distM(lat, lng, pp.lat, pp.lng) <= NEAR_THRESHOLD_M;
      });

      const hasServerDraftNear = (effectiveServerDrafts ?? []).some((d) => {
        const dd = extractLatLng(d);
        return dd && distM(lat, lng, dd.lat, dd.lng) <= NEAR_THRESHOLD_M;
      });

      const hasLocalDraftNear = (rawLocalDraftMarkers ?? []).some((m) => {
        const mm = extractLatLng(m);
        return mm && distM(lat, lng, mm.lat, mm.lng) <= NEAR_THRESHOLD_M;
      });

      if (hasServerPointNear || hasServerDraftNear || hasLocalDraftNear) {
        if (process.env.NODE_ENV !== "production") {
          console.log(
            "[usePlaceSearchOnMap] skip temp search marker (already have pin nearby)",
            {
              marker,
              hasServerPointNear,
              hasServerDraftNear,
              hasLocalDraftNear,
            }
          );
        }
        return;
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("[usePlaceSearchOnMap] safeUpsertDraftMarker → upsert", {
          marker,
          lat,
          lng,
        });
      }

      // upsertDraftMarker가 lat/lng를 기대하므로 확실히 실어 보내기
      upsertDraftMarker({
        ...marker,
        lat,
        lng,
      });
    },
    [
      upsertDraftMarker,
      effectiveServerPoints,
      effectiveServerDrafts,
      rawLocalDraftMarkers,
    ]
  );

  /**
   * 🔧 최종적으로 지도에 넘길 localDraftMarkers:
   * 서버핀(effectiveServerPoints)과 너무 가까운 임시핀은 전부 제거.
   * (혹시 safeUpsertDraftMarker 바깥에서 upsertDraftMarker가 직접 호출되더라도 방어)
   */
  const localDraftMarkers = useMemo(() => {
    const NEAR_THRESHOLD_M = 800;

    const result =
      (rawLocalDraftMarkers ?? []).filter((m) => {
        const mm = extractLatLng(m);
        if (!mm) return false; // 좌표 이상한 건 아예 안 그림

        const hasServerPointNear = (effectiveServerPoints ?? []).some((p) => {
          const pp = extractLatLng(p);
          return (
            pp && distM(mm.lat, mm.lng, pp.lat, pp.lng) <= NEAR_THRESHOLD_M
          );
        });

        const hasServerDraftNear = (effectiveServerDrafts ?? []).some((d) => {
          const dd = extractLatLng(d);
          return (
            dd && distM(mm.lat, mm.lng, dd.lat, dd.lng) <= NEAR_THRESHOLD_M
          );
        });

        // 서버핀/서버드래프트 근처에 있으면 지도에서 숨김
        return !hasServerPointNear && !hasServerDraftNear;
      }) ?? [];

    if (process.env.NODE_ENV !== "production") {
      console.log("[usePlaceSearchOnMap] localDraftMarkers (filtered)", {
        count: result.length,
        rawCount: rawLocalDraftMarkers?.length ?? 0,
      });
    }

    return result;
  }, [rawLocalDraftMarkers, effectiveServerPoints, effectiveServerDrafts]);

  // 🔍 viewport 객체가 거의 같은지 비교 (소수점 오차 허용)
  const isSameViewport = (a: any, b: any) => {
    if (!a || !b) return false;
    const EPS = 1e-6;

    const diff =
      Math.abs(a.leftTop.lat - b.leftTop.lat) +
      Math.abs(a.leftTop.lng - b.leftTop.lng) +
      Math.abs(a.rightBottom.lat - b.rightBottom.lat) +
      Math.abs(a.rightBottom.lng - b.rightBottom.lng);

    return diff < EPS;
  };

  const handleViewportChangeInternal = useCallback(
    (v: any) => {
      if (!v) return;

      // ✅ 같은 viewport가 연속으로 들어오면 스킵 → /map GET 중복 방지
      if (
        lastViewportRef.current &&
        isSameViewport(lastViewportRef.current, v)
      ) {
        if (process.env.NODE_ENV !== "production") {
          console.log("[viewportChange] duplicated viewport, skip", v);
        }
        return;
      }
      lastViewportRef.current = v;

      console.log("[viewportChange] fired", {
        lastSearchCenter: lastSearchCenterRef.current,
        v,
      });

      if (lastSearchCenterRef.current) {
        const centerLat = (v.leftTop.lat + v.rightBottom.lat) / 2;
        const centerLng = (v.leftTop.lng + v.rightBottom.lng) / 2;

        const d = distM(
          centerLat,
          centerLng,
          lastSearchCenterRef.current.lat,
          lastSearchCenterRef.current.lng
        );

        console.log("[viewportChange] distance from lastSearchCenter", { d });

        const THRESHOLD_M = 300;
        if (d > THRESHOLD_M) {
          console.log(
            "[viewportChange] over threshold → clear search markers",
            { THRESHOLD_M }
          );
          clearSearchMarkers();
          lastSearchCenterRef.current = null;
        }
      }

      onViewportChange?.(v);
    },
    [onViewportChange, clearSearchMarkers]
  );

  const handleSubmitSearch = useCallback(
    (text: string) => {
      console.log("[usePlaceSearchOnMap] handleSubmitSearch", {
        text,
        hasOnMarkerClick: !!onMarkerClick,
        hideLabelForId,
        menuOpen,
      });

      return searchPlaceOnMap(text, {
        kakaoSDK,
        mapInstance,
        effectiveServerPoints,
        effectiveServerDrafts,
        localDraftMarkers,
        upsertDraftMarker: safeUpsertDraftMarker,
        clearTempMarkers,
        onSubmitSearch,
        onOpenMenu,
        onChangeHideLabelForId,
        lastSearchCenterRef,
        onMarkerClick,
      });
    },
    [
      kakaoSDK,
      mapInstance,
      effectiveServerPoints,
      effectiveServerDrafts,
      localDraftMarkers,
      safeUpsertDraftMarker,
      clearTempMarkers,
      onSubmitSearch,
      onOpenMenu,
      onChangeHideLabelForId,
      onMarkerClick,
      hideLabelForId,
      menuOpen,
    ]
  );

  // 메뉴 open/close 에 따라 lastSearchCenterRef & hideLabelForId 조정
  useEffect(() => {
    if (!menuOpen) {
      if (hideLabelForId === "__search__") {
        onChangeHideLabelForId?.(undefined);
      }
      return;
    }

    if (menuAnchor) {
      lastSearchCenterRef.current = {
        lat: menuAnchor.lat,
        lng: menuAnchor.lng,
      };
    }
  }, [menuOpen, menuAnchor, hideLabelForId, onChangeHideLabelForId]);

  return {
    localDraftMarkers,
    upsertDraftMarker,
    replaceTempByRealId,
    clearTempMarkers,
    handleSubmitSearch,
    handleViewportChangeInternal,
  };
}

export default usePlaceSearchOnMap;
