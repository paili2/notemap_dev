"use client";

import { useCallback } from "react";

import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { NEAR_THRESHOLD_M } from "@/features/map/lib/constants";
import type { LatLng } from "@/lib/geo/types";
import { distanceMeters } from "@/lib/geo/distance";

type Args = {
  kakaoSDK: any;
  mapInstance: any;
  items: PropertyItem[];
  /** 가까운 기존 핀을 찾았을 때 호출 */
  onMatchedPin: (p: PropertyItem) => Promise<void> | void;
  /** 매칭되는 핀이 없을 때 좌표를 넘겨줌(여기서 openMenuAt(coords, "__draft__") 호출 가능) */
  onNoMatch: (coords: LatLng) => Promise<void> | void;
  /** 선택: 살짝 화면 위로 올리고 싶을 때 사용 */
  panToWithOffset?: (pos: LatLng, offsetY?: number, offsetX?: number) => void;
};

export function useRunSearch({
  kakaoSDK,
  mapInstance,
  items,
  onMatchedPin,
  onNoMatch,
  panToWithOffset,
}: Args) {
  return useCallback(
    async (keyword: string) => {
      if (!kakaoSDK || !mapInstance || !keyword?.trim()) return;

      const geocoder = new kakaoSDK.maps.services.Geocoder();
      const places = new kakaoSDK.maps.services.Places();

      const afterLocate = async (lat: number, lng: number) => {
        const coords: LatLng = { lat, lng };

        // 가까운 기존 핀 매칭
        let nearest: PropertyItem | null = null;
        let best = Infinity;
        for (const p of items) {
          const d = distanceMeters(coords, p.position);
          if (d < NEAR_THRESHOLD_M && d < best) {
            best = d;
            nearest = p;
          }
        }
        if (nearest) {
          await onMatchedPin(nearest);
        } else {
          await onNoMatch(coords);
        }

        // 지도 이동/이벤트 트리거
        const center = new kakaoSDK.maps.LatLng(lat, lng);
        mapInstance.setCenter(center);
        mapInstance.setLevel(Math.min(5, 11));
        kakaoSDK.maps.event.trigger(mapInstance, "idle");
        requestAnimationFrame(() =>
          kakaoSDK.maps.event.trigger(mapInstance, "idle")
        );

        // 필요 시 살짝 위로 보정
        if (panToWithOffset) panToWithOffset(coords, 180);
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
    [kakaoSDK, mapInstance, items, onMatchedPin, onNoMatch, panToWithOffset]
  );
}
