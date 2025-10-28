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

export function useReserveFromMenu({
  s,
  reverseGeocode,
  reserveVisitPlan,
}: ReserveDeps) {
  return useCallback(
    async (payload: PayloadByCoords | PayloadByVisitId) => {
      try {
        let lat: number;
        let lng: number;
        let title: string | null | undefined;
        let roadAddress: string | null | undefined;
        let jibunAddress: string | null | undefined;

        if ("lat" in payload) {
          lat = Number(payload.lat);
          lng = Number(payload.lng);
          title = payload.title;
          roadAddress = payload.roadAddress ?? null;
          jibunAddress = payload.jibunAddress ?? null;
        } else {
          const v = s.markers.find(
            (m) => String(m.id) === String(payload.visitId)
          );
          if (!v) {
            alert("예약하려는 핀을 찾지 못했습니다.");
            return;
          }
          lat = v.position.lat;
          lng = v.position.lng;
          title = v.title ?? null;
          roadAddress = null;
          jibunAddress = null;
        }

        // ⛑ 좌표 유효성 가드
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          alert("좌표가 유효하지 않습니다.");
          return;
        }

        if (!roadAddress && !jibunAddress) {
          const g = await reverseGeocode(lat, lng);
          roadAddress = g.road;
          jibunAddress = g.jibun;
        }

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
