import { useCallback } from "react";

type ReverseGeocodeResult = { road: string | null; jibun: string | null };

type ReserveDeps = {
  s: {
    markers: Array<{
      id: string | number;
      title?: string | null;
      position: { lat: number; lng: number };
    }>;
    setUseSidebar: (v: boolean) => void;
  };
  reverseGeocode: (lat: number, lng: number) => Promise<ReverseGeocodeResult>;
  reserveVisitPlan: (payload: {
    lat: number;
    lng: number;
    address: string;
    roadAddress: string | null;
    jibunAddress: string | null;
  }) => Promise<any>;
};

type PayloadByCoords = {
  lat: number;
  lng: number;
  title?: string | null;
  roadAddress?: string | null;
  jibunAddress?: string | null;
};
type PayloadByVisitId = { visitId: string | number };

/** 서버/클라이언트 모두에서 동일하게 쓰이도록 좌표 정규화 */
const normalizeCoord = (v: number) => Number(v.toFixed(7));

export function useReserveFromMenu({
  s,
  reverseGeocode,
  reserveVisitPlan,
}: ReserveDeps) {
  return useCallback(
    async (payload: PayloadByCoords | PayloadByVisitId) => {
      try {
        // ✅ 1) 원본 좌표와 메타
        let latRaw: number;
        let lngRaw: number;
        let title: string | null | undefined;
        let roadAddress: string | null | undefined;
        let jibunAddress: string | null | undefined;

        if ("lat" in payload) {
          // 좌표 기반(검색/임시핀)
          latRaw = Number(payload.lat);
          lngRaw = Number(payload.lng);
          title = payload.title;
          roadAddress = payload.roadAddress ?? null;
          jibunAddress = payload.jibunAddress ?? null;
        } else {
          // visitId 기반(이미 있는 임시핀 / 답사예정핀)
          const v = s.markers.find(
            (m) => String(m.id) === String(payload.visitId)
          );
          if (!v) {
            alert("예약하려는 핀을 찾지 못했습니다.");
            return;
          }
          latRaw = Number(v.position.lat);
          lngRaw = Number(v.position.lng);
          title = v.title ?? null;
          roadAddress = null;
          jibunAddress = null;
        }

        // ⛑ 좌표 유효성 가드 (원본 기준 체크)
        if (!Number.isFinite(latRaw) || !Number.isFinite(lngRaw)) {
          alert("좌표가 유효하지 않습니다.");
          return;
        }

        // ✅ 2) 서버로 보낼 좌표만 정규화 (원본은 그대로 유지)
        const lat = normalizeCoord(latRaw);
        const lng = normalizeCoord(lngRaw);

        // ✅ 3) reverseGeocode는 원본 좌표만 사용, 좌표는 절대 변경 ❌
        if (!roadAddress && !jibunAddress) {
          const g = await reverseGeocode(latRaw, lngRaw);
          roadAddress = g.road;
          jibunAddress = g.jibun;
        }

        // ✅ 4) 서버로 나가는 lat/lng는 위에서 만든 정규화 값만 사용
        await reserveVisitPlan({
          lat,
          lng,
          address: title ?? roadAddress ?? jibunAddress ?? `${lat}, ${lng}`,
          roadAddress: roadAddress ?? null,
          jibunAddress: jibunAddress ?? null,
        });

        s.setUseSidebar(true);
      } catch (e) {
        console.error(e);
        alert("답사지예약 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    },
    [s, reverseGeocode, reserveVisitPlan]
  );
}

export const eqId = (a: unknown, b: unknown) => String(a) === String(b);
