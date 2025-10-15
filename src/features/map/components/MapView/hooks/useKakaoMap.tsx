import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { loadKakaoOnce } from "@/lib/kakao/loader";
import { KOREA_BOUNDS } from "@/features/map/lib/constants";
import type { LatLng } from "@/lib/geo/types";

type Args = {
  appKey: string;
  center: LatLng;
  level?: number;
  /** 초기 로드시 전국 bounds에 맞추기 */
  fitKoreaBounds?: boolean;
  /** 우리가 허용하는 최대 축소 레벨 */
  maxLevel?: number;
  /** center prop 변경 시 자동 panTo 비활성화 */
  disableAutoPan?: boolean;
  /** idle 콜백 디바운스(ms). 기본 120ms */
  viewportDebounceMs?: number;
  onMapReady?: (args: { kakao: any; map: any }) => void;
  onViewportChange?: (query: {
    leftTop: LatLng;
    leftBottom: LatLng;
    rightTop: LatLng;
    rightBottom: LatLng;
    zoomLevel: number;
  }) => void;
};

export type SearchOptions = {
  clearPrev?: boolean;
  recenter?: boolean;
  fitZoom?: boolean;
  /** 입력이 ‘…역’일 때 지하철역(SW8)부터 우선 검색 */
  preferStation?: boolean;
  /** 기본 검색 마커(파란핀) 표시 여부 (기본 true) */
  showMarker?: boolean;
  /** 좌표를 받아서 추가 행동(로드뷰 열기 등) 수행 */
  onFound?: (pos: LatLng) => void;
};

const DEFAULT_VIEWPORT_DEBOUNCE = 120;

function useStableRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

const useKakaoMap = ({
  appKey,
  center,
  level = 5,
  fitKoreaBounds = false,
  maxLevel = 11,
  disableAutoPan = false,
  viewportDebounceMs = DEFAULT_VIEWPORT_DEBOUNCE,
  onMapReady,
  onViewportChange,
}: Args) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const kakaoRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  const [ready, setReady] = useState(false);

  // 옵션/콜백 ref로 고정 (리스너 내부 stale 방지)
  const maxLevelRef = useRef<number>(maxLevel);
  const onViewportChangeRef = useStableRef(onViewportChange);

  // Kakao services 재사용
  const geocoderRef = useRef<any>(null);
  const placesRef = useRef<any>(null);

  // 검색 마커 1개 유지
  const lastSearchMarkerRef = useRef<any>(null);

  // 리스너/타이머
  const zoomListenerRef = useRef<((...a: any[]) => void) | null>(null);
  const idleListenerRef = useRef<((...a: any[]) => void) | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  // ===== 지도 생성 =====
  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;

    loadKakaoOnce(appKey, { autoload: false, libs: ["services", "clusterer"] })
      .then((kakao) => {
        if (cancelled || !containerRef.current) return;

        kakaoRef.current = kakao;

        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level,
        });

        // services 준비
        geocoderRef.current = new kakao.maps.services.Geocoder();
        placesRef.current = new kakao.maps.services.Places();

        // 축소 상한
        maxLevelRef.current = maxLevel;
        map.setMaxLevel(maxLevelRef.current);

        // 전국 보기 옵션
        if (fitKoreaBounds) {
          const bounds = new kakao.maps.LatLngBounds(
            new kakao.maps.LatLng(KOREA_BOUNDS.sw.lat, KOREA_BOUNDS.sw.lng),
            new kakao.maps.LatLng(KOREA_BOUNDS.ne.lat, KOREA_BOUNDS.ne.lng)
          );
          map.setBounds(bounds);
          const lv = map.getLevel();
          maxLevelRef.current = lv;
          map.setMaxLevel(lv);
        }

        // 최대 확대 제한 강제
        const onZoomChanged = () => {
          const lv = map.getLevel();
          if (lv > maxLevelRef.current) map.setLevel(maxLevelRef.current);
        };
        kakao.maps.event.addListener(map, "zoom_changed", onZoomChanged);
        zoomListenerRef.current = onZoomChanged;

        // idle 시 디바운스된 뷰포트 변경 콜백
        const onIdle = () => {
          if (!onViewportChangeRef.current) return;

          // 디바운스
          if (idleTimerRef.current) {
            window.clearTimeout(idleTimerRef.current);
          }
          idleTimerRef.current = window.setTimeout(() => {
            if (!mapRef.current) return;
            const b = mapRef.current.getBounds();
            const sw = b.getSouthWest(); // 좌하
            const ne = b.getNorthEast(); // 우상
            onViewportChangeRef.current?.({
              leftTop: { lat: ne.getLat(), lng: sw.getLng() },
              leftBottom: { lat: sw.getLat(), lng: sw.getLng() },
              rightTop: { lat: ne.getLat(), lng: ne.getLng() },
              rightBottom: { lat: sw.getLat(), lng: ne.getLng() },
              zoomLevel: mapRef.current.getLevel(),
            });
          }, viewportDebounceMs);
        };
        kakao.maps.event.addListener(map, "idle", onIdle);
        idleListenerRef.current = onIdle;

        mapRef.current = map;
        setReady(true);
        onMapReady?.({ kakao, map });
      })
      .catch((e) => {
        console.error("Kakao SDK load failed:", e);
      });

    // cleanup
    return () => {
      cancelled = true;
      const kakao = kakaoRef.current;
      const map = mapRef.current;

      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }

      if (kakao?.maps?.event && map) {
        if (zoomListenerRef.current) {
          kakao.maps.event.removeListener(
            map,
            "zoom_changed",
            zoomListenerRef.current
          );
          zoomListenerRef.current = null;
        }
        if (idleListenerRef.current) {
          kakao.maps.event.removeListener(map, "idle", idleListenerRef.current);
          idleListenerRef.current = null;
        }
      }

      if (lastSearchMarkerRef.current) {
        lastSearchMarkerRef.current.setMap(null);
        lastSearchMarkerRef.current = null;
      }

      mapRef.current = null;
      // kakaoRef는 SDK 전역이므로 유지
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    appKey,
    fitKoreaBounds,
    maxLevel,
    level,
    center.lat,
    center.lng,
    viewportDebounceMs,
  ]);

  // center 변경 시 부드럽게 이동 (옵션으로 끌 수 있음)
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!ready || !kakao || !map || disableAutoPan) return;

    const current = map.getCenter?.();
    const next = new kakao.maps.LatLng(center.lat, center.lng);

    // 좌표 동일하면 skip
    if (
      current &&
      current.getLat() === next.getLat() &&
      current.getLng() === next.getLng()
    ) {
      return;
    }

    const raf = requestAnimationFrame(() => {
      map.panTo(next);
    });
    return () => cancelAnimationFrame(raf);
  }, [center.lat, center.lng, disableAutoPan, ready]);

  // level 변경 시 상한 적용 (동일 level이면 skip)
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const desired = Math.min(level, maxLevelRef.current);
    if (map.getLevel?.() !== desired) {
      map.setLevel(desired);
    }
  }, [level, ready]);

  // ===== 유틸 =====
  const clearLastMarker = useCallback(() => {
    if (lastSearchMarkerRef.current) {
      lastSearchMarkerRef.current.setMap(null);
      lastSearchMarkerRef.current = null;
    }
  }, []);

  const placeMarkerAt = useCallback((coords: any, opts?: SearchOptions) => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    const {
      clearPrev = true,
      recenter = true,
      fitZoom = false,
      showMarker = true,
    } = opts || {};

    // 이전 검색 마커 제거 (showMarker=false면 무조건 제거)
    if ((clearPrev || showMarker === false) && lastSearchMarkerRef.current) {
      lastSearchMarkerRef.current.setMap(null);
      lastSearchMarkerRef.current = null;
    }

    if (recenter) {
      const current = map.getCenter?.();
      if (
        !current ||
        current.getLat() !== coords.getLat() ||
        current.getLng() !== coords.getLng()
      ) {
        map.setCenter(coords);
      }
    }

    if (fitZoom) {
      const targetLevel = Math.min(5, maxLevelRef.current);
      if (map.getLevel?.() !== targetLevel) map.setLevel(targetLevel);
    }

    if (showMarker === false) return;

    const marker = new kakao.maps.Marker({ map, position: coords });
    lastSearchMarkerRef.current = marker;
  }, []);

  const searchPlace = useCallback(
    (query: string, opts?: SearchOptions) => {
      if (!ready || !kakaoRef.current || !mapRef.current || !query) return;

      const kakao = kakaoRef.current;
      const geocoder =
        geocoderRef.current ?? new kakao.maps.services.Geocoder();
      const places = placesRef.current ?? new kakao.maps.services.Places();
      geocoderRef.current = geocoder;
      placesRef.current = places;

      const { preferStation = false, onFound } = opts || {};
      const endsWithStation = query.trim().endsWith("역");

      const tryStationFirst = (): Promise<{
        lat: number;
        lng: number;
      } | null> =>
        new Promise((resolve) => {
          places.keywordSearch(query, (data: any[], status: string) => {
            if (status === kakao.maps.services.Status.OK && data?.length) {
              const station =
                data.find(
                  (d) =>
                    d.category_group_code === "SW8" ||
                    d.category_name?.includes("지하철역")
                ) || null;
              if (station) {
                resolve({
                  lat: parseFloat(station.y),
                  lng: parseFloat(station.x),
                });
                return;
              }
            }
            resolve(null);
          });
        });

      const tryKeyword = (): Promise<{ lat: number; lng: number } | null> =>
        new Promise((resolve) => {
          places.keywordSearch(query, (data: any[], status: string) => {
            if (status === kakao.maps.services.Status.OK && data?.[0]) {
              resolve({
                lat: parseFloat(data[0].y),
                lng: parseFloat(data[0].x),
              });
            } else {
              resolve(null);
            }
          });
        });

      const tryAddress = (): Promise<{ lat: number; lng: number } | null> =>
        new Promise((resolve) => {
          geocoder.addressSearch(query, (res: any[], status: string) => {
            if (status === kakao.maps.services.Status.OK && res?.[0]) {
              resolve({
                lat: parseFloat(res[0].y),
                lng: parseFloat(res[0].x),
              });
            } else {
              resolve(null);
            }
          });
        });

      (async () => {
        let found: { lat: number; lng: number } | null = null;

        if (endsWithStation || preferStation) {
          found = await tryStationFirst();
          if (!found) found = await tryKeyword();
          if (!found) found = await tryAddress();
        } else {
          found = await tryAddress();
          if (!found) found = await tryKeyword();
        }

        if (!found) {
          console.warn("검색 결과 없음:", query);
          return;
        }

        placeMarkerAt(new kakao.maps.LatLng(found.lat, found.lng), opts);
        onFound?.({ lat: found.lat, lng: found.lng });
      })();
    },
    [placeMarkerAt, ready]
  );

  // 선택: 외부 제어 API
  const panTo = useCallback((p: LatLng) => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;
    const next = new kakao.maps.LatLng(p.lat, p.lng);
    const cur = map.getCenter?.();
    if (
      !cur ||
      cur.getLat() !== next.getLat() ||
      cur.getLng() !== next.getLng()
    ) {
      map.panTo(next);
    }
  }, []);

  const fitBounds = useCallback((points: LatLng[]) => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map || !points?.length) return;
    const b = new kakao.maps.LatLngBounds();
    points.forEach((p) => b.extend(new kakao.maps.LatLng(p.lat, p.lng)));
    map.setBounds(b);
  }, []);

  const setMaxLevel = useCallback((maxLv: number) => {
    const map = mapRef.current;
    if (!map) return;
    maxLevelRef.current = maxLv;
    map.setMaxLevel(maxLv);
    // 현재 레벨이 상한보다 크면 줄여준다
    const lv = map.getLevel?.();
    if (typeof lv === "number" && lv > maxLv) {
      map.setLevel(maxLv);
    }
  }, []);

  // 외부에 안정적인 핸들러 제공을 위해 useMemo
  const api = useMemo(
    () => ({
      // refs
      containerRef,
      kakao: kakaoRef.current,
      map: mapRef.current,
      ready,
      // 검색/마커
      searchPlace,
      clearLastMarker,
      // 제어
      panTo,
      fitBounds,
      setMaxLevel,
    }),
    [ready, searchPlace, clearLastMarker, panTo, fitBounds, setMaxLevel]
  );

  return api;
};

export default useKakaoMap;
