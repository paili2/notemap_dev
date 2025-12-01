"use client";

import type { MutableRefObject } from "react";
import { distM } from "@/features/map/hooks/poi/shared/geometry";
import {
  parseStationAndExit,
  pickBestStation,
  pickBestExitStrict,
  pickBestPlace,
  shouldCreateSearchPin,
} from "../lib/searchUtils";
import type { PinKind } from "@/features/pins/types";
import type { MapMarker } from "@/features/map/shared/types/map";

type SearchDeps = {
  kakaoSDK: any;
  mapInstance: any;
  effectiveServerPoints: any[];
  effectiveServerDrafts: any[];
  localDraftMarkers: MapMarker[];
  upsertDraftMarker: (m: {
    id: string | number;
    lat: number;
    lng: number;
    address?: string | null;
    source?: "geocode" | "search" | "draft";
    kind?: PinKind;
  }) => void;
  clearTempMarkers: () => void;
  onSubmitSearch?: (q: string) => void;
  onOpenMenu?: (args: {
    position: { lat: number; lng: number };
    propertyId: string | number;
    propertyTitle: string;
    pin?: { kind: PinKind; isFav: boolean };
  }) => void;
  onChangeHideLabelForId?: (id?: string) => void;
  lastSearchCenterRef: MutableRefObject<{ lat: number; lng: number } | null>;
};

export async function searchPlaceOnMap(text: string, deps: SearchDeps) {
  const {
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
  } = deps;

  const query = text.trim();
  if (!query || !kakaoSDK || !mapInstance) return;

  onSubmitSearch?.(query);

  const setCenterOnly = (lat: number, lng: number) => {
    console.log("[setCenterOnly]", { lat, lng, query });
    const ll = new kakaoSDK.maps.LatLng(lat, lng);
    mapInstance.setCenter(ll);
    mapInstance.setLevel(3);
  };

  const runAfterIdle = (fn: () => void) => {
    if (!kakaoSDK || !mapInstance || !(kakaoSDK as any).maps?.event) {
      fn();
      return;
    }

    try {
      const event = (kakaoSDK as any).maps.event;
      let fired = false;

      const listener = event.addListener(mapInstance, "idle", () => {
        if (fired) return;
        fired = true;
        event.removeListener(listener);
        fn();
      });

      setTimeout(() => {
        if (fired) return;
        fired = true;
        event.removeListener(listener);
        fn();
      }, 400);
    } catch {
      fn();
    }
  };

  const setCenterWithMarker = async (
    lat: number,
    lng: number,
    label?: string | null
  ) => {
    const NEAR_THRESHOLD_M = 450;

    type RealAroundPin = {
      id: string;
      lat: number;
      lng: number;
      title?: string | null;
    };

    try {
      const ll = new kakaoSDK.maps.LatLng(lat, lng);
      mapInstance.setCenter(ll);
      mapInstance.setLevel(3);
    } catch {}

    const findBestRealAround = (): RealAroundPin | null => {
      let bestReal: RealAroundPin | null = null;
      let bestDist = Infinity;

      const tryReal = (
        id: string | number,
        plat: number,
        plng: number,
        title?: string | null
      ) => {
        const d = distM(lat, lng, plat, plng);
        if (d <= NEAR_THRESHOLD_M && d < bestDist) {
          bestDist = d;
          bestReal = {
            id: String(id),
            lat: plat,
            lng: plng,
            title,
          };
        }
      };

      (effectiveServerPoints ?? []).forEach((p: any) => {
        tryReal(
          p.id,
          p.lat,
          p.lng,
          (p as any).title ?? (p as any).name ?? null
        );
      });

      (effectiveServerDrafts ?? []).forEach((d: any) => {
        tryReal(
          d.id,
          d.lat,
          d.lng,
          (d as any).title ?? (d as any).name ?? "답사예정"
        );
      });

      localDraftMarkers.forEach((m: any) => {
        const idStr = String(m.id);
        if (!idStr.startsWith("__visit__")) return;
        const pos = m.position;
        if (!pos) return;
        tryReal(idStr, pos.lat, pos.lng, m.title ?? null);
      });

      return bestReal;
    };

    let bestReal = findBestRealAround();

    // 못 찾았으면 뷰포트 강제 새로고침 한 번 시도
    if (!bestReal && kakaoSDK && mapInstance?.getLevel) {
      try {
        const level = mapInstance.getLevel();
        const center = mapInstance.getCenter();

        mapInstance.setLevel(level + 1, { animate: false });
        mapInstance.setLevel(level, { animate: false });
        mapInstance.setCenter(center);
      } catch {}

      bestReal = findBestRealAround();
    }

    if (bestReal) {
      const { id, lat: realLat, lng: realLng, title: realTitle } = bestReal;
      const title = realTitle ?? label ?? "선택 위치";

      runAfterIdle(() => {
        clearTempMarkers();

        lastSearchCenterRef.current = {
          lat: realLat,
          lng: realLng,
        };

        onOpenMenu?.({
          position: { lat: realLat, lng: realLng },
          propertyId: id,
          propertyTitle: title,
        });
      });

      return;
    }

    // 근처에 실제 핀이 없으면 __search__ 임시핀을 만들고 메뉴 열기
    clearTempMarkers();

    lastSearchCenterRef.current = { lat, lng };

    const id = "__search__";

    upsertDraftMarker({
      id,
      lat,
      lng,
      address: label ?? query,
      source: "search",
      kind: "question",
    });

    const openMenu = () => {
      onOpenMenu?.({
        position: { lat, lng },
        propertyId: id,
        propertyTitle: label ?? query ?? "선택 위치",
        pin: { kind: "question", isFav: false },
      });
      onChangeHideLabelForId?.(id);
    };

    if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
      window.requestAnimationFrame(openMenu);
    } else {
      setTimeout(openMenu, 0);
    }
  };

  const places = new kakaoSDK.maps.services.Places();
  const geocoder = new kakaoSDK.maps.services.Geocoder();
  const Status = kakaoSDK.maps.services.Status;
  const centerLL = mapInstance.getCenter?.();

  const doAddressFallback = () => {
    geocoder.addressSearch(query, (addrRes: any[], addrStatus: string) => {
      if (addrStatus !== Status.OK || !addrRes?.length) return;
      const { x, y, road_address, address } = addrRes[0] ?? {};
      const lat = Number(y);
      const lng = Number(x);
      const label =
        road_address?.address_name || address?.address_name || query || null;

      const pseudoItem = {
        place_name: query,
        road_address_name: label,
        address_name: label,
        address: { address_name: label },
        category_group_code: "",
      };

      if (shouldCreateSearchPin(pseudoItem, query)) {
        setCenterWithMarker(lat, lng, label);
      } else {
        setCenterOnly(lat, lng);
      }
    });
  };

  const { stationName, exitNo, hasExit } = parseStationAndExit(query);

  places.keywordSearch(
    query,
    (data: any[], status: string) => {
      console.log("[keywordSearch] result", {
        query,
        status,
        count: data?.length ?? 0,
      });

      if (status !== Status.OK || !data?.length) {
        doAddressFallback();
        return;
      }

      if (hasExit && stationName) {
        const station = pickBestStation(data, stationName);
        if (!station) {
          doAddressFallback();
          return;
        }

        const stationLL = new kakaoSDK.maps.LatLng(
          Number(station.y),
          Number(station.x)
        );

        places.keywordSearch(
          `${station.place_name} 출구`,
          (exitData: any[], exitStatus: string) => {
            console.log("[keywordSearch exit]", {
              query,
              exitStatus,
              exitCount: exitData?.length ?? 0,
            });

            if (exitStatus !== Status.OK || !exitData?.length) {
              const lat = stationLL.getLat();
              const lng = stationLL.getLng();
              if (shouldCreateSearchPin(station, query)) {
                setCenterWithMarker(lat, lng, station.place_name);
              } else {
                setCenterOnly(lat, lng);
              }
              return;
            }

            const picked =
              pickBestExitStrict(
                exitData,
                stationName,
                exitNo ?? null,
                stationLL
              ) ?? station;

            const lat = Number(picked.y);
            const lng = Number(picked.x);
            const label = picked.place_name ?? query;

            if (shouldCreateSearchPin(picked, query)) {
              setCenterWithMarker(lat, lng, label);
            } else {
              setCenterOnly(lat, lng);
            }
          },
          {
            location: stationLL,
            radius: 600,
          }
        );
        return;
      }

      let target: any;
      if (stationName) {
        target = pickBestStation(data, stationName);
      } else {
        target = pickBestPlace(data, query, centerLL ?? undefined);
      }

      if (!target) {
        doAddressFallback();
        return;
      }

      const lat = Number(target.y);
      const lng = Number(target.x);
      const label = target.place_name ?? query;

      if (shouldCreateSearchPin(target, query)) {
        setCenterWithMarker(lat, lng, label);
      } else {
        setCenterOnly(lat, lng);
      }
    },
    centerLL
      ? {
          location: centerLL,
          radius: 3000,
        }
      : undefined
  );
}
