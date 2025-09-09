"use client";

import { useCallback } from "react";
import type { LatLng } from "@/features/map/types/map";
import type { PropertyItem } from "@/features/properties/types/propertyItem";

type Deps = {
  kakaoSDK: any | null;
  mapInstance: any | null;
  items: PropertyItem[];
  openMenuForExistingPin: (p: PropertyItem) => void | Promise<void>;
  setDraftPin: (pos: LatLng) => void;
  panToWithOffset: (pos: LatLng, offsetY?: number, offsetX?: number) => void;
};

function distanceMeters(a: LatLng, b: LatLng) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function useRunSearch({
  kakaoSDK,
  mapInstance,
  items,
  openMenuForExistingPin,
  setDraftPin,
  panToWithOffset,
}: Deps) {
  const runSearch = useCallback(
    async (keyword: string) => {
      if (!kakaoSDK || !mapInstance || !keyword.trim()) return;

      const geocoder = new kakaoSDK.maps.services.Geocoder();
      const places = new kakaoSDK.maps.services.Places();

      const afterLocate = async (lat: number, lng: number) => {
        const coords = { lat, lng };

        // 근접 기존 핀 자동 매칭 (35m)
        const THRESHOLD_M = 35;
        let nearest: PropertyItem | null = null;
        let best = Infinity;
        for (const p of items) {
          const d = distanceMeters(coords, p.position);
          if (d < THRESHOLD_M && d < best) {
            best = d;
            nearest = p;
          }
        }
        if (nearest) {
          await openMenuForExistingPin(nearest);
        } else {
          setDraftPin(coords); // draftPin effect에서 메뉴 오픈
        }

        // 카메라 이동 및 idle 트리거
        const center = new kakaoSDK.maps.LatLng(lat, lng);
        mapInstance.setCenter(center);
        mapInstance.setLevel(Math.min(5, 11));
        kakaoSDK.maps.event.trigger(mapInstance, "idle");
        requestAnimationFrame(() =>
          kakaoSDK.maps.event.trigger(mapInstance, "idle")
        );

        // 클릭 UX와 동일하게 살짝 위로 보정 이동
        panToWithOffset(coords, 180);
      };

      await new Promise<void>((resolve) => {
        geocoder.addressSearch(
          keyword,
          async (addrResult: any[], addrStatus: string) => {
            if (
              addrStatus === kakaoSDK.maps.services.Status.OK &&
              addrResult?.length
            ) {
              const r0 = addrResult[0];
              const lat = parseFloat(
                (r0.road_address?.y ?? r0.address?.y ?? r0.y) as string
              );
              const lng = parseFloat(
                (r0.road_address?.x ?? r0.address?.x ?? r0.x) as string
              );
              await afterLocate(lat, lng);
              resolve();
            } else {
              places.keywordSearch(
                keyword,
                async (kwResult: any[], kwStatus: string) => {
                  if (
                    kwStatus === kakaoSDK.maps.services.Status.OK &&
                    kwResult?.length
                  ) {
                    const r0 = kwResult[0];
                    await afterLocate(parseFloat(r0.y), parseFloat(r0.x));
                  } else {
                    alert("검색 결과가 없습니다.");
                  }
                  resolve();
                }
              );
            }
          }
        );
      });
    },
    [
      kakaoSDK,
      mapInstance,
      items,
      openMenuForExistingPin,
      setDraftPin,
      panToWithOffset,
    ]
  );

  return { runSearch };
}
