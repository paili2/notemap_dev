"use client";

import { useCallback, useEffect, useRef } from "react";
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

export function usePlaceSearchOnMap({
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
    localDraftMarkers,
    upsertDraftMarker,
    replaceTempByRealId,
    clearTempMarkers,
    clearSearchMarkers,
  } = useSearchDraftMarkers();

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
        localDraftMarkers,
        upsertDraftMarker,
        clearTempMarkers,
        onSubmitSearch,
        onOpenMenu,
        onChangeHideLabelForId,
        lastSearchCenterRef,
      }),
    [
      kakaoSDK,
      mapInstance,
      effectiveServerPoints,
      effectiveServerDrafts,
      localDraftMarkers,
      upsertDraftMarker,
      clearTempMarkers,
      onSubmitSearch,
      onOpenMenu,
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
