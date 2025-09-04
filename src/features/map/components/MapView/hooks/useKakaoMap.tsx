import { LatLng } from "@/features/map/types/map";
import { useEffect, useRef, useState } from "react";

type Args = {
  appKey: string;
  center: LatLng;
  level?: number;
  /** true → 전국 영역으로 맞추고 그 이상 축소 불가 */
  fitKoreaBounds?: boolean;
  /** 일반 최대 축소 한계( fitKoreaBounds가 true면 무시되고 전국레벨로 고정 ) */
  maxLevel?: number;
  showNativeLayerControl?: boolean;
  controlRightOffsetPx?: number;
  controlTopOffsetPx?: number;
  onMapReady?: (args: { kakao: any; map: any }) => void;
};

type SearchOptions = {
  /** 기존 마커 지우고 하나만 유지할지 (기본: true) */
  clearPrev?: boolean;
  /** 검색 좌표로 지도 중심 이동할지 (기본: true) */
  recenter?: boolean;
  /** 검색 좌표로 적당히 확대할지 (기본: false) */
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
}: Args) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const kakaoRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const lastMarkerRef = useRef<any>(null); // ✅ 마지막 마커 보관

  const [ready, setReady] = useState(false);

  // 우리가 관리하는 최대 축소 레벨( getMaxLevel 대체 )
  const maxLevelRef = useRef<number>(maxLevel);

  // 1) 최초 1회: SDK 로드 + 지도 생성
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
          maxLevelRef.current = lv; // 전국이 보이는 현재 레벨을 상한으로 저장
          map.setMaxLevel(lv);
        }

        // 안전장치: 한 틱 넘어가면 되돌리기
        kakao.maps.event.addListener(map, "zoom_changed", () => {
          const lv = map.getLevel();
          if (lv > maxLevelRef.current) map.setLevel(maxLevelRef.current);
        });

        // 기본 컨트롤 추가 + 오프셋
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
      // 마지막 마커 제거
      if (lastMarkerRef.current) {
        lastMarkerRef.current.setMap(null);
        lastMarkerRef.current = null;
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appKey]);

  // 2) center 변경 시 부드럽게 이동
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!ready || !kakao || !map) return;

    const raf = requestAnimationFrame(() => {
      const next = new kakao.maps.LatLng(center.lat, center.lng);
      map.panTo(next);
    });
    return () => cancelAnimationFrame(raf);
  }, [center.lat, center.lng, ready]);

  // 3) level 변경 시에도 우리가 관리하는 상한 적용
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setLevel(Math.min(level, maxLevelRef.current));
  }, [level, ready]);

  // 4) 네이티브 컨트롤 토글
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!ready || !kakao || !map) return;

    if (showNativeLayerControl) {
      const mapTypeControl = new kakao.maps.MapTypeControl();
      map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);
    }
  }, [showNativeLayerControl, ready]);

  // ====== ✅ 주소/키워드 검색 + 마커 찍기 헬퍼 ======
  const placeMarkerAt = (coords: any, opts?: SearchOptions) => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    const { clearPrev = true, recenter = true, fitZoom = false } = opts || {};

    if (clearPrev && lastMarkerRef.current) {
      lastMarkerRef.current.setMap(null);
      lastMarkerRef.current = null;
    }

    if (recenter) map.setCenter(coords);

    if (fitZoom) {
      // 지도를 살짝 더 확대해 보기 좋게 (최소 5레벨 보장)
      const targetLevel = Math.min(5, maxLevelRef.current);
      map.setLevel(targetLevel);
    }

    const marker = new kakao.maps.Marker({ map, position: coords });
    lastMarkerRef.current = marker;
  };

  /** 주소 → 실패 시 키워드로 검색하여 좌표에 마커 배치 */
  const searchPlace = (query: string, opts?: SearchOptions) => {
    if (!ready || !kakaoRef.current || !mapRef.current || !query) return;

    const kakao = kakaoRef.current;
    const map = mapRef.current;

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
        const coords = new kakao.maps.LatLng(lat, lng);
        placeMarkerAt(coords, opts);
      } else {
        // 2) 주소 실패 → 키워드 검색
        places.keywordSearch(query, (kwResult: any[], kwStatus: string) => {
          if (
            kwStatus === kakao.maps.services.Status.OK &&
            kwResult.length > 0
          ) {
            const lat = parseFloat(kwResult[0].y);
            const lng = parseFloat(kwResult[0].x);
            const coords = new kakao.maps.LatLng(lat, lng);
            placeMarkerAt(coords, opts);
          } else {
            console.warn("검색 결과 없음:", query);
          }
        });
      }
    });
  };

  return {
    containerRef,
    kakao: kakaoRef.current,
    map: mapRef.current,
    ready,
    /** 주소/키워드 자동 판별 검색 → 마커 찍기 */
    searchPlace,
    /** 마지막 마커 지우기 */
    clearLastMarker: () => {
      if (lastMarkerRef.current) {
        lastMarkerRef.current.setMap(null);
        lastMarkerRef.current = null;
      }
    },
  };
};

export default useKakaoMap;
