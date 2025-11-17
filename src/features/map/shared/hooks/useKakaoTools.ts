"use client";

import { useCallback, useRef } from "react";
import type { LatLng } from "@/lib/geo/types";

/* ───────── Kakao 얇은 타입 ───────── */
interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}
interface KakaoPoint {
  x: number;
  y: number;
}
interface KakaoProjection {
  pointFromCoords(latlng: KakaoLatLng): KakaoPoint;
  coordsFromPoint(point: KakaoPoint): KakaoLatLng;
}
interface KakaoGeocoder {
  coord2Address(
    lng: number,
    lat: number,
    cb: (res: any[], status: string) => void
  ): void;
  addressSearch(query: string, cb: (res: any[], status: string) => void): void;
}

interface KakaoSDK {
  maps: {
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    Point: new (x: number, y: number) => KakaoPoint;
    services: {
      Geocoder: new () => KakaoGeocoder;
      Status: { OK: string };
    };
  };
}
interface KakaoMapInstance {
  getProjection?: () => KakaoProjection | undefined;
  panTo?: (latlngOrCoords: KakaoLatLng) => void;
  relayout?: () => void;
}

/* ───────── 내부 상태/유틸 ───────── */
type AddressValue = { road: string | null; jibun: string | null };
type CacheEntry = { value: AddressValue; expiresAt: number };
const geocoderCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<AddressValue>>(); // 동시요청 합치기
let geocoderSingleton: KakaoGeocoder | null = null;

// 🔧 좌표는 그대로 문자열화해서 캐시 키로 사용 (toFixed 제거)
const toKey = (ll: LatLng) => `${ll.lat},${ll.lng}`;

function getKakaoFromWindowOrRef(ref?: KakaoSDK | null): KakaoSDK | null {
  if (typeof window === "undefined") return ref ?? null;
  return (window as any)?.kakao ?? ref ?? null;
}

function getGeocoder(kakao: KakaoSDK): KakaoGeocoder {
  if (geocoderSingleton) return geocoderSingleton;
  geocoderSingleton = new kakao.maps.services.Geocoder();
  return geocoderSingleton;
}

/* ───────── 공개: 캐시 유틸(선택) ───────── */
export function clearResolveAddressCache() {
  geocoderCache.clear();
}
export function primeResolveAddressCache(
  ll: LatLng,
  value: AddressValue,
  ttlMs = 5 * 60_000
) {
  geocoderCache.set(toKey(ll), { value, expiresAt: Date.now() + ttlMs });
}

/* ───────── Hooks ───────── */

/**
 * 좌표 → 도로명/지번 주소 해석 훅
 * - 옵션 객체로 유연성 상승
 * - 캐시 TTL(ms) + 타임아웃(ms) + 동시요청 dedupe
 */
export function useResolveAddress(opts?: {
  kakaoSDK?: KakaoSDK | null;
  timeoutMs?: number; // default 4000
  cacheTtlMs?: number; // default 5분
}): (latlng: LatLng) => Promise<AddressValue> {
  const {
    kakaoSDK = null,
    timeoutMs = 4000,
    cacheTtlMs = 5 * 60_000,
  } = opts || {};

  return useCallback(
    async (latlng: LatLng): Promise<AddressValue> => {
      try {
        const kakao = getKakaoFromWindowOrRef(kakaoSDK);
        if (!kakao?.maps?.services) return { road: null, jibun: null };

        const key = toKey(latlng);

        // 1) 캐시 조회
        const cached = geocoderCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.value;
        }

        // 2) 동시요청 합치기
        const existing = inflight.get(key);
        if (existing) return existing;

        // 3) 요청 생성
        const geocoder = getGeocoder(kakao);
        const coord = new kakao.maps.LatLng(latlng.lat, latlng.lng);

        const req = new Promise<AddressValue>((resolve) => {
          geocoder.coord2Address(
            coord.getLng(),
            coord.getLat(),
            (res: any[], status: string) => {
              if (status === kakao.maps.services.Status.OK && res?.[0]) {
                const r0 = res[0];
                const value: AddressValue = {
                  road: r0.road_address?.address_name ?? null,
                  jibun: r0.address?.address_name ?? null,
                };
                geocoderCache.set(key, {
                  value,
                  expiresAt: Date.now() + cacheTtlMs,
                });
                resolve(value);
              } else {
                resolve({ road: null, jibun: null });
              }
            }
          );
        });

        const withTimeout = Promise.race<AddressValue>([
          req,
          new Promise<AddressValue>((resolve) =>
            setTimeout(() => resolve({ road: null, jibun: null }), timeoutMs)
          ),
        ]);

        inflight.set(key, withTimeout);
        const out = await withTimeout;
        inflight.delete(key);
        return out;
      } catch {
        return { road: null, jibun: null };
      }
    },
    [kakaoSDK, timeoutMs, cacheTtlMs]
  );
}

type LatLngOut = { lat: number; lng: number };

const geocodeCache = new Map<string, { value: LatLngOut; expiresAt: number }>();
const inflightGeocode = new Map<string, Promise<LatLngOut>>();

/**
 * 주소 → 좌표 (정방향 지오코딩)
 * - Kakao SDK의 addressSearch() 사용
 * - 캐시 및 타임아웃, 동시요청 dedupe 지원
 */
export function useGeocodeAddress(opts?: {
  kakaoSDK?: KakaoSDK | null;
  timeoutMs?: number; // default 4000
  cacheTtlMs?: number; // default 5분
}): (address: string) => Promise<LatLngOut> {
  const {
    kakaoSDK = null,
    timeoutMs = 4000,
    cacheTtlMs = 5 * 60_000,
  } = opts || {};

  return useCallback(
    async (address: string): Promise<LatLngOut> => {
      const q = (address || "").trim();
      if (!q) throw new Error("empty-address");

      const kakao = getKakaoFromWindowOrRef(kakaoSDK);
      if (!kakao?.maps?.services) throw new Error("kakao-sdk-not-loaded");

      // 캐시 체크
      const c = geocodeCache.get(q);
      if (c && c.expiresAt > Date.now()) return c.value;

      // 중복요청 방지
      const ex = inflightGeocode.get(q);
      if (ex) return ex;

      const geocoder = getGeocoder(kakao);
      const req = new Promise<LatLngOut>((resolve, reject) => {
        geocoder.addressSearch(q, (res: any[], status: string) => {
          if (status === kakao.maps.services.Status.OK && res?.[0]) {
            const r0 = res[0];
            const out = { lat: Number(r0.y), lng: Number(r0.x) }; // Kakao: x=lng, y=lat
            geocodeCache.set(q, {
              value: out,
              expiresAt: Date.now() + cacheTtlMs,
            });
            resolve(out);
          } else reject(new Error("address-search-failed"));
        });
      });

      const withTimeout = Promise.race<LatLngOut>([
        req,
        new Promise<LatLngOut>((_, reject) =>
          setTimeout(() => reject(new Error("geocode-timeout")), timeoutMs)
        ),
      ]);

      inflightGeocode.set(q, withTimeout);
      try {
        const out = await withTimeout;
        return out;
      } finally {
        inflightGeocode.delete(q);
      }
    },
    [kakaoSDK, timeoutMs, cacheTtlMs]
  );
}

/**
 * 화면 픽셀 오프셋을 고려한 panTo
 * - 사이드바 토글 등 레이아웃 변동 대비 relayout()
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

      // 레이아웃 직후 재계산(1프레임 뒤)
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

      // 프로젝션 불가 → 기본 panTo
      if (!proj?.pointFromCoords || !proj?.coordsFromPoint) {
        mapInstance.panTo?.(pos);
        return;
      }

      // 오프셋 적용
      const pt = proj.pointFromCoords(pos);
      const target = proj.coordsFromPoint(
        new kakaoSDK.maps.Point(pt.x + offsetX, pt.y - offsetY)
      );
      mapInstance.panTo?.(target);
    },
    [kakaoSDK, mapInstance]
  );
}
