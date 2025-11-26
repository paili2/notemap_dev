"use client";

import { useCallback } from "react";

import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { NEAR_THRESHOLD_M } from "@/features/map/shared/constants";
import type { LatLng } from "@/lib/geo/types";
import { distanceMeters } from "@/lib/geo/distance";
import { useToast } from "@/hooks/use-toast";
import { isTooBroadKeyword } from "../utils/isTooBroadKeyword";

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
  mapInstance, // ← 이제 사실상 안 써도 되지만, 타입만 남겨둬도 됨
  items,
  onMatchedPin,
  onNoMatch,
}: Args) {
  const { toast } = useToast();

  return useCallback(
    async (keyword: string) => {
      if (!kakaoSDK || !mapInstance) return;

      const trimmed = keyword.trim();
      if (!trimmed) return;

      // 1) 광역 키워드 컷
      if (isTooBroadKeyword(trimmed)) {
        toast({
          title: "검색 범위가 너무 넓어요",
          description: "정확한 주소 또는 건물명을 입력해주세요.",
        });
        return;
      }

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
          await onMatchedPin(nearest); // ← 지도 이동은 여기서(= 상위) 처리
        } else {
          await onNoMatch(coords); // ← 여기서도 상위에서 처리
        }

        // ❌ 지도 이동/zoom 은 전부 제거
        // const center = new kakaoSDK.maps.LatLng(lat, lng);
        // mapInstance.setCenter(center);
        // mapInstance.setLevel(Math.min(5, 11));
        // kakaoSDK.maps.event.trigger(mapInstance, "idle");
        // requestAnimationFrame(() =>
        //   kakaoSDK.maps.event.trigger(mapInstance, "idle")
        // );
        // if (panToWithOffset) panToWithOffset(coords, 180);
      };

      await new Promise<void>((resolve) => {
        geocoder.addressSearch(
          trimmed,
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
                trimmed,
                async (kwResult: any[], kwStatus: string) => {
                  if (
                    kwStatus === kakaoSDK.maps.services.Status.OK &&
                    kwResult?.length
                  ) {
                    const r0 = kwResult[0];
                    await afterLocate(
                      parseFloat(r0.y as string),
                      parseFloat(r0.x as string)
                    );
                  } else {
                    toast({
                      title: "검색 결과가 없습니다.",
                      description: "정확한 주소 또는 건물명을 입력해주세요.",
                    });
                  }
                  resolve();
                }
              );
            }
          }
        );
      });
    },
    [kakaoSDK, mapInstance, items, onMatchedPin, onNoMatch, toast]
  );
}
