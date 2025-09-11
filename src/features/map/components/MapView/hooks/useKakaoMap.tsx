import { LatLng } from "@/lib/geo/types";
import { useEffect, useRef, useState } from "react";

type Args = {
  appKey: string;
  center: LatLng;
  level?: number;

  /** true → 전국 영역으로 맞추고 그 이상 축소 불가 */
  fitKoreaBounds?: boolean;

  /** fitKoreaBounds가 false일 때 적용될 일반 최대 축소 한계 (기본 11) */
  maxLevel?: number;

  showNativeLayerControl?: boolean;
  controlRightOffsetPx?: number;
  controlTopOffsetPx?: number;

  onMapReady?: (args: { kakao: any; map: any }) => void;

  /** 지도가 이동/확대/축소(idle) 후 현재 뷰포트+줌을 알려줌 */
  onViewportChange?: (query: {
    leftTop: LatLng;
    leftBottom: LatLng;
    rightTop: LatLng;
    rightBottom: LatLng;
    zoomLevel: number;
  }) => void;
};

type SearchOptions = {
  /** 기존 검색 마커 지우고 하나만 유지 (기본 true) */
  clearPrev?: boolean;
  /** 검색 좌표로 지도 중심 이동 (기본 true) */
  recenter?: boolean;
  /** 검색 좌표로 적당히 확대 (기본 false) */
  fitZoom?: boolean;
};

declare global {
  interface Window {
    __kakaoMapLoader?: Promise<any>;
  }
}

function loadKakaoOnce(appKey: string): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("SSR");
  const w = window as any;

  // 이미 로드된 SDK 재사용
  if (w.kakao?.maps) return Promise.resolve(w.kakao);
  if (window.__kakaoMapLoader) return window.__kakaoMapLoader;

  window.__kakaoMapLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services,clusterer`;
    script.async = true;
    script.onerror = reject;
    script.onload = () => {
      w.kakao.maps.load(() => resolve(w.kakao));
    };
    document.head.appendChild(script);
  });

  return window.__kakaoMapLoader;
}

// 대한민국 전체(제주 포함, 북동부까지) 대략 경계
const KOREA_BOUNDS = {
  sw: { lat: 33.0, lng: 124.0 },
  ne: { lat: 39.5, lng: 132.0 },
};

const useKakaoMap = ({
  appKey,
  center,
  level = 5,
  fitKoreaBounds = false,
  maxLevel = 11,
  showNativeLayerControl = true,
  controlRightOffsetPx = 10,
  controlTopOffsetPx = 10,
  onMapReady,
  onViewportChange,
}: Args) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const kakaoRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  const [ready, setReady] = useState(false);

  // 우리가 관리하는 최대 축소 레벨(getMaxLevel 대체)
  const maxLevelRef = useRef<number>(maxLevel);

  // 검색 마커 1개 유지
  const lastSearchMarkerRef = useRef<any>(null);

  // ===== 지도 생성 =====
  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;

    loadKakaoOnce(appKey)
      .then((kakao) => {
        if (cancelled || !containerRef.current) return;

        kakaoRef.current = kakao;

        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level,
        });

        // 일반 최대 축소 제한 우선 적용
        maxLevelRef.current = maxLevel;
        map.setMaxLevel(maxLevelRef.current);

        // 전국 보기 옵션: bounds 맞추고 그 레벨을 최대 축소로 고정
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

        // 안전장치: 한 틱 넘어가면 되돌리기
        kakao.maps.event.addListener(map, "zoom_changed", () => {
          const lv = map.getLevel();
          if (lv > maxLevelRef.current) map.setLevel(maxLevelRef.current);
        });

        // idle 시 뷰포트 변경 콜백
        kakao.maps.event.addListener(map, "idle", () => {
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
        });

        // 기본 컨트롤 + 위치 보정
        if (showNativeLayerControl) {
          const mapTypeControl = new kakao.maps.MapTypeControl();
          map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);
          const controls = containerRef.current.querySelectorAll(
            ".wrap_map .map_control, .map_type_control"
          );
          controls.forEach((el: any) => {
            el.style.right = `${controlRightOffsetPx}px`;
            el.style.top = `${controlTopOffsetPx}px`;
          });
        }

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
      if (lastSearchMarkerRef.current) {
        lastSearchMarkerRef.current.setMap(null);
        lastSearchMarkerRef.current = null;
      }
      mapRef.current = null;
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

  // level 변경 시에도 우리가 관리하는 상한 적용
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setLevel(Math.min(level, maxLevelRef.current));
  }, [level, ready]);

  // 네이티브 컨트롤 토글
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!ready || !kakao || !map) return;

    if (showNativeLayerControl) {
      const mapTypeControl = new kakao.maps.MapTypeControl();
      map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);
    }
  }, [showNativeLayerControl, ready]);

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

    // 1) 주소 검색
    geocoder.addressSearch(query, (addrResult: any[], addrStatus: string) => {
      if (
        addrStatus === kakao.maps.services.Status.OK &&
        addrResult.length > 0
      ) {
        const lat = parseFloat(addrResult[0].y);
        const lng = parseFloat(addrResult[0].x);
        placeMarkerAt(new kakao.maps.LatLng(lat, lng), opts);
      } else {
        // 2) 주소 실패 → 키워드 검색
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

  return {
    containerRef,
    kakao: kakaoRef.current,
    map: mapRef.current,
    ready,

    // 검색/마커 유틸
    searchPlace,
    clearLastMarker,
  };
};

export default useKakaoMap;
