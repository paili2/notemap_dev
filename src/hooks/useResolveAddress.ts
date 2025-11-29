"use client";

import { useCallback } from "react";
import type { LatLng } from "@/lib/geo/types";

/* ───────── Kakao 얇은 타입 ───────── */
interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoGeocoder {
  coord2Address(
    lng: number,
    lat: number,
    cb: (res: any[], status: string) => void
  ): void;
}

export interface KakaoSDK {
  maps: {
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    services: {
      Geocoder: new () => KakaoGeocoder;
      Status: { OK: string };
    };
  };
}

/* ───────── 내부 상태/타입 ───────── */
export type AddressValue = { road: string | null; jibun: string | null };
type CacheEntry = { value: AddressValue; expiresAt: number };

const geocoderCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<AddressValue>>();

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

/* ───────── Hook 본체 ───────── */

/**
 * 좌표 → 도로명/지번 주소 해석 훅
 * - 옵션 객체로 유연성 상승
 * - 캐시 TTL(ms) + 타임아웃(ms) + 동시요청 dedupe
 *
 * 사용 예시:
 * const resolveAddress = useResolveAddress({ kakaoSDK });
 * const addr = await resolveAddress({ lat, lng });
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
