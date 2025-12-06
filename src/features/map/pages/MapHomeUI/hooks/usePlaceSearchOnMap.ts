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
  const lastViewportRef = useRef<any | null>(null);

  const {
    localDraftMarkers: rawLocalDraftMarkers,
    upsertDraftMarker,
    replaceTempByRealId,
    clearTempMarkers,
    clearSearchMarkers,
  } = useSearchDraftMarkers();

  /** 다양한 형태에서 lat/lng 추출 */
  const extractLatLng = (obj: any): { lat: number; lng: number } | null => {
    if (!obj) return null;

    if (typeof obj.getLat === "function" && typeof obj.getLng === "function") {
      const lat = obj.getLat();
      const lng = obj.getLng();
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    }

    const src = obj.position ?? obj.latlng ?? obj;
    const lat = Number(src?.lat);
    const lng = Number(src?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  };

  /** 검색 결과 임시 마커 생성 (근처에 있으면 스킵) */
  const safeUpsertDraftMarker = useCallback(
    (marker: any) => {
      const pos = extractLatLng(marker);
      if (!pos) return;

      const { lat, lng } = pos;
      const NEAR_THRESHOLD_M = 800;

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
        return;
      }

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

  /** 서버핀/드래프트 근처의 임시핀 제거 */
  const localDraftMarkers = useMemo(() => {
    const NEAR_THRESHOLD_M = 800;

    return (
      (rawLocalDraftMarkers ?? []).filter((m) => {
        const mm = extractLatLng(m);
        if (!mm) return false;

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

        return !hasServerPointNear && !hasServerDraftNear;
      }) ?? []
    );
  }, [rawLocalDraftMarkers, effectiveServerPoints, effectiveServerDrafts]);

  /** viewport 동일 여부 검사 */
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

  /** viewport 변경 처리 */
  const handleViewportChangeInternal = useCallback(
    (v: any) => {
      if (!v) return;

      if (lastViewportRef.current && isSameViewport(lastViewportRef.current, v))
        return;

      lastViewportRef.current = v;

      if (lastSearchCenterRef.current) {
        const centerLat = (v.leftTop.lat + v.rightBottom.lat) / 2;
        const centerLng = (v.leftTop.lng + v.rightBottom.lng) / 2;

        const d = distM(
          centerLat,
          centerLng,
          lastSearchCenterRef.current.lat,
          lastSearchCenterRef.current.lng
        );

        const THRESHOLD_M = 300;
        if (d > THRESHOLD_M) {
          clearSearchMarkers();
          lastSearchCenterRef.current = null;
        }
      }

      onViewportChange?.(v);
    },
    [onViewportChange, clearSearchMarkers]
  );

  /** 검색 실행 */
  const handleSubmitSearch = useCallback(
    (text: string) => {
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
    ]
  );

  /** 메뉴 열릴 때 search center 업데이트 */
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
