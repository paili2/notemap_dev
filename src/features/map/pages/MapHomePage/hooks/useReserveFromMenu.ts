import { useCallback } from "react";

type ReserveDeps = {
  s: any; // useMapHomeState() 반환값 타입을 가져오면 더 좋습니다
  reverseGeocode: (
    lat: number,
    lng: number
  ) => Promise<{ road: string | null; jibun: string | null }>;
  reserveVisitPlan: (payload: {
    lat: number;
    lng: number;
    address: string;
    roadAddress: string | null;
    jibunAddress: string | null;
  }) => Promise<any>;
};

export function useReserveFromMenu({
  s,
  reverseGeocode,
  reserveVisitPlan,
}: ReserveDeps) {
  return useCallback(
    async (payload: any) => {
      try {
        let lat: number;
        let lng: number;
        let title: string | null | undefined;
        let roadAddress: string | null | undefined;
        let jibunAddress: string | null | undefined;

        if ("lat" in payload) {
          // 좌표 직접 예약
          lat = payload.lat;
          lng = payload.lng;
          title = payload.title;
          roadAddress = payload.roadAddress ?? null;
          jibunAddress = payload.jibunAddress ?? null;
        } else {
          // visitId -> 마커에서 좌표 조회
          const v = s.markers.find(
            (m: any) => String(m.id) === String(payload.visitId)
          );
          if (!v) {
            alert("예약하려는 핀을 찾지 못했습니다.");
            return;
          }
          const pos = (v as any).position;
          lat = pos.lat;
          lng = pos.lng;
          title = (v as any).title ?? null;
          roadAddress = null;
          jibunAddress = null;
        }

        if (!roadAddress && !jibunAddress) {
          const g = await reverseGeocode(lat, lng);
          roadAddress = g.road;
          jibunAddress = g.jibun;
        }

        await reserveVisitPlan({
          lat,
          lng,
          address:
            title ??
            roadAddress ??
            jibunAddress ??
            `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          roadAddress: roadAddress ?? null,
          jibunAddress: jibunAddress ?? null,
        });

        s.setUseSidebar(true); // 예약 목록 열기
      } catch (e) {
        console.error(e);
        alert("답사지예약 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    },
    [s, reverseGeocode, reserveVisitPlan]
  );
}

// ──────────────────────────────────────────────────────────────
// File: src/features/map/pages/MapHomePage/utils/ids.ts
// 안전한 ID 비교 유틸 (중복 사용 방지)
// ──────────────────────────────────────────────────────────────
export const eqId = (a: unknown, b: unknown) => String(a) === String(b);
