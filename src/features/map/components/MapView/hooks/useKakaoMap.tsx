import { LatLng } from "@/lib/geo/types";
import { useEffect, useRef, useState } from "react";
import { loadKakaoOnce } from "@/lib/kakao/loader";
import { DEFAULT_LEVEL } from "@/features/map/lib/constants";
import { KOREA_BOUNDS } from "@/features/map/lib/constants";

type Args = {
  appKey: string;
  center: LatLng;
  level?: number;
  fitKoreaBounds?: boolean;
  maxLevel?: number;
  onMapReady?: (args: { kakao: any; map: any }) => void;
  onViewportChange?: (query: {
    leftTop: LatLng;
    leftBottom: LatLng;
    rightTop: LatLng;
    rightBottom: LatLng;
    zoomLevel: number;
  }) => void;
};

type SearchOptions = {
  clearPrev?: boolean;
  recenter?: boolean;
  fitZoom?: boolean;
};

const useKakaoMap = ({
  appKey,
  center,
  level = 5,
  fitKoreaBounds = false,
  maxLevel = 11,
  onMapReady,
  onViewportChange,
}: Args) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const kakaoRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // 우리가 관리하는 최대 축소 레벨
  const maxLevelRef = useRef<number>(maxLevel);

  // 검색 마커 1개 유지
  const lastSearchMarkerRef = useRef<any>(null);

  // 리스너 참조 (cleanup에서 제거)
  const zoomListenerRef = useRef<((...a: any[]) => void) | null>(null);
  const idleListenerRef = useRef<((...a: any[]) => void) | null>(null);

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

        // 일반 최대 축소 제한
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

        // idle 시 뷰포트 변경 콜백
        const onIdle = () => {
          if (!onViewportChange) return;
          const bounds = map.getBounds();
          const sw = bounds.getSouthWest(); // 좌하단
          const ne = bounds.getNorthEast(); // 우상단
          onViewportChange({
            leftTop: { lat: ne.getLat(), lng: sw.getLng() },
            leftBottom: { lat: sw.getLat(), lng: sw.getLng() },
            rightTop: { lat: ne.getLat(), lng: ne.getLng() },
            rightBottom: { lat: sw.getLat(), lng: ne.getLng() },
            zoomLevel: map.getLevel(),
          });
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
  }, [appKey]);

  // center 변경 시 부드럽게 이동
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!ready || !kakao || !map) return;

    const raf = requestAnimationFrame(() => {
      map.panTo(new kakao.maps.LatLng(center.lat, center.lng));
    });
    return () => cancelAnimationFrame(raf);
  }, [center.lat, center.lng, ready]);

  // level 변경 시 상한 적용
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setLevel(Math.min(level, maxLevelRef.current));
  }, [level, ready]);

  // ===== 주소/키워드 검색 + 마커 찍기 =====
  const placeMarkerAt = (coords: any, opts?: SearchOptions) => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    const { clearPrev = true, recenter = true, fitZoom = false } = opts || {};

    if (clearPrev && lastSearchMarkerRef.current) {
      lastSearchMarkerRef.current.setMap(null);
      lastSearchMarkerRef.current = null;
    }

    if (recenter) map.setCenter(coords);
    if (fitZoom) {
      const targetLevel = Math.min(5, maxLevelRef.current);
      map.setLevel(targetLevel);
    }

    const marker = new kakao.maps.Marker({ map, position: coords });
    lastSearchMarkerRef.current = marker;
  };

  /** 주소 → 실패 시 키워드로 검색하여 좌표에 마커 배치 */
  const searchPlace = (query: string, opts?: SearchOptions) => {
    if (!ready || !kakaoRef.current || !mapRef.current || !query) return;

    const kakao = kakaoRef.current;
    const geocoder = new kakao.maps.services.Geocoder();
    const places = new kakao.maps.services.Places();

    geocoder.addressSearch(query, (addrResult: any[], addrStatus: string) => {
      if (
        addrStatus === kakao.maps.services.Status.OK &&
        addrResult.length > 0
      ) {
        const lat = parseFloat(addrResult[0].y);
        const lng = parseFloat(addrResult[0].x);
        placeMarkerAt(new kakao.maps.LatLng(lat, lng), opts);
      } else {
        places.keywordSearch(query, (kwResult: any[], kwStatus: string) => {
          if (
            kwStatus === kakao.maps.services.Status.OK &&
            kwResult.length > 0
          ) {
            const lat = parseFloat(kwResult[0].y);
            const lng = parseFloat(kwResult[0].x);
            placeMarkerAt(new kakao.maps.LatLng(lat, lng), opts);
          } else {
            console.warn("검색 결과 없음:", query);
          }
        });
      }
    });
  };

  const clearLastMarker = () => {
    if (lastSearchMarkerRef.current) {
      lastSearchMarkerRef.current.setMap(null);
      lastSearchMarkerRef.current = null;
    }
  };

  // 선택: 외부 제어 API 몇 개 노출
  const panTo = (p: LatLng) => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;
    map.panTo(new kakao.maps.LatLng(p.lat, p.lng));
  };

  const fitBounds = (points: LatLng[]) => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map || !points?.length) return;
    const b = new kakao.maps.LatLngBounds();
    points.forEach((p) => b.extend(new kakao.maps.LatLng(p.lat, p.lng)));
    map.setBounds(b);
  };

  const setMaxZoom = (maxLv: number) => {
    const map = mapRef.current;
    if (!map) return;
    maxLevelRef.current = maxLv;
    map.setMaxLevel(maxLv);
  };

  return {
    containerRef,
    kakao: kakaoRef.current,
    map: mapRef.current,
    ready,

    // 검색/마커 유틸
    searchPlace,
    clearLastMarker,

    // 선택 API
    panTo,
    fitBounds,
    setMaxZoom,
  };
};

export default useKakaoMap;
