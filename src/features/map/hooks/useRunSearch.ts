"use client";

import { useCallback } from "react";

import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { NEAR_THRESHOLD_M } from "@/features/map/shared/constants";
import type { LatLng } from "@/lib/geo/types";
import { distanceMeters } from "@/lib/geo/distance";
import { useToast } from "@/hooks/use-toast";
import { isTooBroadKeyword } from "../shared/utils/isTooBroadKeyword";

// 👉 검색 주소랑 기존 핀 간 거리 허용치(조금 넉넉하게 3km까지)
const SEARCH_NEAR_THRESHOLD_M = Math.max(NEAR_THRESHOLD_M, 3000);

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
}: Args) {
  const { toast } = useToast();

  // 🧹 주소 정규화 + 비교 유틸
  const normalizeAddress = (addr?: string | null) => {
    if (!addr) return "";
    return String(addr)
      .replace(/\s+/g, "") // 공백 제거
      .replace(/[()-]/g, "") // 괄호/하이픈 제거
      .replace("특별자치시", "시") // 흔한 패턴 정규화
      .trim();
  };

  const isSameAddress = (a?: string | null, b?: string | null) =>
    normalizeAddress(a) === normalizeAddress(b);

  return useCallback(
    async (keyword: string) => {
      if (!kakaoSDK || !mapInstance) return;

      const trimmed = keyword.trim();
      if (!trimmed) return;

      // 0) 광역 키워드 컷
      if (isTooBroadKeyword(trimmed)) {
        toast({
          variant: "destructive",
          title: "검색 범위가 너무 넓어요",
          description: "정확한 주소 또는 건물명을 입력해주세요.",
        });
        return;
      }

      const trimmedLower = trimmed.toLowerCase();

      // ✅ 1단계: "이름"으로만 먼저 매칭 시도
      //    (지오코딩 좌표와 상관 없이, 지도에 떠 있는 핀 중 이름이 같은 게 있으면 그걸 우선 선택)
      const byName = items.find((p: any) => {
        const raw =
          p.name ??
          p.propertyName ??
          p.title ??
          p.address ??
          p.addressLine ??
          "";
        const pName = String(raw).trim();
        if (!pName) return false;
        const lower = pName.toLowerCase();
        return lower === trimmedLower || lower.includes(trimmedLower);
      });

      if (byName) {
        console.log("[useRunSearch] matched by name:", byName);
        await onMatchedPin(byName);
        return;
      }

      // ✅ 2단계: 지오코딩 + 주소/거리 기반 매칭
      const geocoder = new kakaoSDK.maps.services.Geocoder();
      const places = new kakaoSDK.maps.services.Places();

      const afterLocate = async (
        lat: number,
        lng: number,
        addrInfo?: { road?: string | null; jibun?: string | null }
      ) => {
        const coords: LatLng = { lat, lng };

        let bestByNameOrAddr: PropertyItem | null = null;
        let bestByNameOrAddrDist = Infinity;

        let nearest: PropertyItem | null = null;
        let nearestDist = Infinity;

        for (const p of items) {
          const anyP = p as any;
          const d = distanceMeters(coords, p.position);

          const pAddr = anyP.address ?? anyP.addressLine ?? null;
          const road = addrInfo?.road ?? null;
          const jibun = addrInfo?.jibun ?? null;

          const rawName = anyP.name ?? anyP.propertyName ?? anyP.title ?? "";
          const pName = String(rawName).trim();
          const lower = pName.toLowerCase();

          const matchByName =
            !!pName && (lower === trimmedLower || lower.includes(trimmedLower));
          const matchByAddr =
            isSameAddress(pAddr, road) || isSameAddress(pAddr, jibun);

          // 1) 이름/주소가 어느 정도라도 맞으면, 거리 상관 없이 "우선 후보"로 본다
          if (matchByName || matchByAddr) {
            if (d < bestByNameOrAddrDist) {
              bestByNameOrAddr = p;
              bestByNameOrAddrDist = d;
            }
          } else {
            // 2) 이름/주소 둘 다 안 맞을 때만 거리 컷 적용
            if (d >= SEARCH_NEAR_THRESHOLD_M) {
              continue;
            }
          }

          // 3) 순수 거리 기준 "가장 가까운 핀"도 한 개 저장해 둔다
          if (d < nearestDist) {
            nearest = p;
            nearestDist = d;
          }
        }

        // 최종 우선순위:
        //   1) 이름/주소 후보 중 가장 가까운 핀
        //   2) (없으면) 거리 기준으로도 충분히 가까운 핀
        //   3) (둘 다 없으면) 진짜로 매칭 X → draft 모드
        let picked: PropertyItem | null = null;

        if (bestByNameOrAddr) {
          picked = bestByNameOrAddr;
        } else if (nearest && nearestDist < SEARCH_NEAR_THRESHOLD_M) {
          picked = nearest;
        }

        console.log("[useRunSearch] picked (geo) =", picked, {
          bestByNameOrAddrDist,
          nearestDist,
        });

        if (picked) {
          await onMatchedPin(picked);
        } else {
          await onNoMatch(coords);
        }
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

              const roadName =
                (r0.road_address && r0.road_address.address_name) ?? null;
              const jibunName = (r0.address && r0.address.address_name) ?? null;

              await afterLocate(lat, lng, {
                road: roadName,
                jibun: jibunName,
              });
              resolve();
            } else {
              // 주소검색 실패 → 키워드 검색
              places.keywordSearch(
                trimmed,
                async (kwResult: any[], kwStatus: string) => {
                  if (
                    kwStatus === kakaoSDK.maps.services.Status.OK &&
                    kwResult?.length
                  ) {
                    const r0 = kwResult[0];
                    const lat = parseFloat(r0.y as string);
                    const lng = parseFloat(r0.x as string);

                    await afterLocate(lat, lng, {
                      road: (r0 as any).road_address_name ?? null,
                      jibun: (r0 as any).address_name ?? null,
                    });
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
