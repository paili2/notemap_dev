import { LatLng } from "@/lib/geo/types";
import { useCallback, useRef } from "react";

/** ---- Kakao SDK 얇은 타입들 ---- */
export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoPoint {
  x: number;
  y: number;
}

export interface KakaoProjection {
  pointFromCoords(latlng: KakaoLatLng): KakaoPoint;
  coordsFromPoint(point: KakaoPoint): KakaoLatLng;
}

export interface KakaoGeocoder {
  coord2Address(
    lng: number,
    lat: number,
    cb: (res: any[], status: string) => void
  ): void;
}

export interface KakaoSDK {
  maps: {
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    Point: new (x: number, y: number) => KakaoPoint;
    services: {
      Geocoder: new () => KakaoGeocoder;
      Status: { OK: string };
    };
  };
}

/** 우리가 쓰는 지도 인스턴스 메서드만 */
export interface KakaoMapInstance {
  getProjection?: () => KakaoProjection | undefined;
  panTo?: (latlngOrCoords: KakaoLatLng) => void;
  relayout?: () => void;
}

/** ---- 모듈 내부 상태/유틸 ---- */
const geocoderCache = new Map<
  string,
  { road: string | null; jibun: string | null }
>();
let geocoderSingleton: KakaoGeocoder | null = null;

function getKakaoFromWindowOrRef(ref?: KakaoSDK | null): KakaoSDK | null {
  if (typeof window === "undefined") return ref ?? null;
  return (window as any).kakao ?? ref ?? null;
}

function getGeocoder(kakao: KakaoSDK): KakaoGeocoder {
  if (geocoderSingleton) return geocoderSingleton;
  geocoderSingleton = new kakao.maps.services.Geocoder();
  return geocoderSingleton;
}

function keyOf(latlng: LatLng) {
  // ~11cm 해상도
  const lat = latlng.lat.toFixed(6);
  const lng = latlng.lng.toFixed(6);
  return `${lat},${lng}`;
}

/** ---- Hooks ---- */

/**
 * 좌표 -> { road, jibun } 해석 훅
 * - SSR/SDK 미탑재 시 { road:null, jibun:null }
 * - 4초 타임아웃 + 간단 캐시
 */
export function useResolveAddress(
  kakaoSDKRef?: KakaoSDK | null,
  timeoutMs = 4000
): (latlng: LatLng) => Promise<{ road: string | null; jibun: string | null }> {
  return useCallback(
    async (latlng: LatLng) => {
      try {
        const kakao = getKakaoFromWindowOrRef(kakaoSDKRef);
        if (!kakao || !kakao.maps?.services) return { road: null, jibun: null };

        const cacheKey = keyOf(latlng);
        const cached = geocoderCache.get(cacheKey);
        if (cached) return cached;

        const geocoder = getGeocoder(kakao);
        const coord = new kakao.maps.LatLng(latlng.lat, latlng.lng);

        const p = new Promise<{ road: string | null; jibun: string | null }>(
          (resolve) => {
            geocoder.coord2Address(
              coord.getLng(),
              coord.getLat(),
              (res: any[], status: string) => {
                if (status === kakao.maps.services.Status.OK && res?.[0]) {
                  const r0 = res[0];
                  const value = {
                    road: r0.road_address?.address_name ?? null,
                    jibun: r0.address?.address_name ?? null,
                  };
                  geocoderCache.set(cacheKey, value);
                  resolve(value);
                } else {
                  resolve({ road: null, jibun: null });
                }
              }
            );
          }
        );

        const timeout = new Promise<{ road: null; jibun: null }>((resolve) =>
          setTimeout(() => resolve({ road: null, jibun: null }), timeoutMs)
        );

        return await Promise.race([p, timeout]);
      } catch {
        return { road: null, jibun: null };
      }
    },
    [kakaoSDKRef, timeoutMs]
  );
}

/**
 * 화면 픽셀 오프셋을 고려해 panTo
 * - 사이드바 토글 직후 등 레이아웃 변동 대비 relayout()
 * - offsetY: 양수면 위로 올려 보이게
 */
export function usePanToWithOffset(
  kakaoSDK: KakaoSDK | null,
  mapInstance: KakaoMapInstance | null
): (latlng: LatLng, offsetY?: number, offsetX?: number) => void {
  const relayoutQueued = useRef(false);

  return useCallback(
    (latlng: LatLng, offsetY = 180, offsetX = 0) => {
      if (!kakaoSDK || !mapInstance) return;

      if (
        !relayoutQueued.current &&
        typeof mapInstance.relayout === "function"
      ) {
        relayoutQueued.current = true;
        requestAnimationFrame(() => {
          try {
            mapInstance.relayout?.();
          } finally {
            relayoutQueued.current = false;
          }
        });
      }

      const pos = new kakaoSDK.maps.LatLng(latlng.lat, latlng.lng);
      const proj = mapInstance.getProjection?.();
      if (!proj?.pointFromCoords || !proj?.coordsFromPoint) {
        mapInstance.panTo?.(pos);
        return;
      }

      const pt = proj.pointFromCoords(pos);
      const target = proj.coordsFromPoint(
        new kakaoSDK.maps.Point(pt.x + offsetX, pt.y - offsetY)
      );
      mapInstance.panTo?.(target);
    },
    [kakaoSDK, mapInstance]
  );
}
