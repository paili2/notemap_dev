"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PinKind } from "@/features/pins/types";
import { distM } from "@/features/map/hooks/poi/shared/geometry";
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
  }) => void;
  onChangeHideLabelForId?: (id?: string) => void;
  menuOpen: boolean;
  menuAnchor: { lat: number; lng: number } | null;
  hideLabelForId?: string;
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
}: Args) {
  const lastSearchCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  const {
    localDraftMarkers: rawLocalDraftMarkers,
    upsertDraftMarker,
    replaceTempByRealId,
    clearTempMarkers,
    clearSearchMarkers,
  } = useSearchDraftMarkers();

  if (process.env.NODE_ENV !== "production") {
    console.log(
      "[DEBUG] effectiveServerPoints sample:",
      effectiveServerPoints?.[0]
    );
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

    return (rawLocalDraftMarkers ?? []).filter((m) => {
      const mm = extractLatLng(m);
      if (!mm) return false; // 좌표 이상한 건 아예 안 그림

      const hasServerPointNear = (effectiveServerPoints ?? []).some((p) => {
        const pp = extractLatLng(p);
        return pp && distM(mm.lat, mm.lng, pp.lat, pp.lng) <= NEAR_THRESHOLD_M;
      });

      const hasServerDraftNear = (effectiveServerDrafts ?? []).some((d) => {
        const dd = extractLatLng(d);
        return dd && distM(mm.lat, mm.lng, dd.lat, dd.lng) <= NEAR_THRESHOLD_M;
      });

      // 서버핀/서버드래프트 근처에 있으면 지도에서 숨김
      return !hasServerPointNear && !hasServerDraftNear;
    });
  }, [rawLocalDraftMarkers, effectiveServerPoints, effectiveServerDrafts]);

  /**
   * 🔒 onOpenMenu 래퍼:
   * 검색 결과 위치가 실제 매물 좌표와 가까우면 propertyId/position 을
   * 그 매물로 스냅시켜서 "실제 매물 메뉴" 로 보이게 함.
   */
  const wrappedOnOpenMenu = useCallback(
    (args: {
      position: { lat: number; lng: number };
      propertyId: string | number;
      propertyTitle: string;
      pin?: { kind: PinKind; isFav: boolean };
    }) => {
      if (!onOpenMenu) return;

      const { position } = args;
      const lat = position.lat;
      const lng = position.lng;

      const NEAR_THRESHOLD_M = 800;
      let best: { d: number; p: any } | null = null;

      for (const p of effectiveServerPoints ?? []) {
        if (!p) continue;
        const d = distM(lat, lng, p.lat, p.lng);
        if (d <= NEAR_THRESHOLD_M && (!best || d < best.d)) {
          best = { d, p };
        }
      }

      if (!best) {
        onOpenMenu(args);
        return;
      }

      const p = best.p;
      onOpenMenu({
        ...args,
        position: { lat: p.lat, lng: p.lng },
        propertyId: p.id,
        propertyTitle: (p.name ?? p.title ?? args.propertyTitle) as string,
      });
    },
    [onOpenMenu, effectiveServerPoints]
  );

  const handleViewportChangeInternal = useCallback(
    (v: any) => {
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
    (text: string) =>
      searchPlaceOnMap(text, {
        kakaoSDK,
        mapInstance,
        effectiveServerPoints,
        effectiveServerDrafts,
        localDraftMarkers, // 이미 서버핀 근처 임시핀은 제거된 상태
        upsertDraftMarker: safeUpsertDraftMarker,
        clearTempMarkers,
        onSubmitSearch,
        onOpenMenu: wrappedOnOpenMenu,
        onChangeHideLabelForId,
        lastSearchCenterRef,
      }),
    [
      kakaoSDK,
      mapInstance,
      effectiveServerPoints,
      effectiveServerDrafts,
      localDraftMarkers,
      safeUpsertDraftMarker,
      clearTempMarkers,
      onSubmitSearch,
      wrappedOnOpenMenu,
      onChangeHideLabelForId,
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
