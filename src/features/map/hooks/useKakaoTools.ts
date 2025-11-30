"use client";

import { useCallback } from "react";
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
  return useCallback(
    (latlng: LatLng, offsetY = 180, offsetX = 0) => {
      if (!kakaoSDK || !mapInstance) return;

      // 1️⃣ 일단 레이아웃을 바로 맞춰 놓고
      try {
        mapInstance.relayout?.();
      } catch {}

      const pos = new kakaoSDK.maps.LatLng(latlng.lat, latlng.lng);
      const proj = mapInstance.getProjection?.();

      // 2️⃣ projection 을 못 얻으면 그냥 기본 panTo
      if (!proj || !proj.pointFromCoords || !proj.coordsFromPoint) {
        mapInstance.panTo?.(pos);
        return;
      }

      // 3️⃣ 오프셋 적용해서 항상 같은 방식으로 이동
      const pt = proj.pointFromCoords(pos);
      const targetPoint = new kakaoSDK.maps.Point(
        pt.x + offsetX,
        pt.y - offsetY
      );
      const target = proj.coordsFromPoint(targetPoint);

      mapInstance.panTo?.(target);
    },
    [kakaoSDK, mapInstance]
  );
}
