"use client";

import { useEffect, useRef } from "react";

/* ====== 타입 (이 파일 하나로 자급자족) ====== */
export type LatLng = { lat: number; lng: number };

export type MapMarker = {
  id: string;
  title?: string;
  position: LatLng;
};

export type MapViewProps = {
  appKey: string;
  center: LatLng;
  level?: number;
  markers?: MapMarker[];
  fitToMarkers?: boolean;

  useDistrict?: boolean; // 지적편집도
  showNativeLayerControl?: boolean; // 기본 지도/스카이뷰, 줌 컨트롤
  controlRightOffsetPx?: number; // 컨트롤 우측 여백
  controlTopOffsetPx?: number; // 컨트롤 상단 여백

  onMarkerClick?: (id: string) => void;
  onMapClick?: (latlng: LatLng) => void;
  onMapReady?: (ctx: { map: any; kakao: any }) => void;
};

/* ===== Kakao SDK 로더 (중복 로드/중복 초기화 방지) ===== */
let kakaoLoaderPromise: Promise<any> | null = null;

function loadKakao(appKey: string, libraries: string[] = ["services"]) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SSR: window 없음"));
  }

  const w = window as any;

  // 이미 초기화됨
  if (w.kakao?.maps) return Promise.resolve(w.kakao);

  // 로딩 중 프라미스 재사용
  if (kakaoLoaderPromise) return kakaoLoaderPromise;

  kakaoLoaderPromise = new Promise<any>((resolve, reject) => {
    const SCRIPT_ID = "kakao-maps-sdk";
    const exist = document.getElementById(
      SCRIPT_ID
    ) as HTMLScriptElement | null;

    const onMapsReady = () => {
      try {
        const w2 = window as any;
        // autoload=false 상태에서 maps 엔진 초기화
        w2.kakao.maps.load(() => resolve(w2.kakao));
      } catch (e) {
        reject(e);
      }
    };

    // 이미 스크립트 태그가 있으면 콜백만 연결
    if (exist) {
      const w2 = window as any;
      if (w2.kakao?.maps?.load) {
        onMapsReady();
      } else {
        exist.addEventListener("load", onMapsReady, { once: true });
      }
      return;
    }

    // 신규 스크립트 삽입 (반드시 https + autoload=false)
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    const libs = libraries.length ? `&libraries=${libraries.join(",")}` : "";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false${libs}`;
    script.onerror = (e) => reject(new Error("Kakao SDK 스크립트 로드 실패"));
    script.onload = onMapsReady;
    document.head.appendChild(script);
  });

  return kakaoLoaderPromise;
}

/* ===== MapView 구현 ===== */
const MapView: React.FC<MapViewProps> = ({
  appKey,
  center,
  level = 5,
  markers = [],
  fitToMarkers = false,
  useDistrict = false,
  showNativeLayerControl = false,
  controlRightOffsetPx = 0,
  controlTopOffsetPx = 0,
  onMarkerClick,
  onMapClick,
  onMapReady,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const kakaoRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  const markerObjsRef = useRef<any[]>([]);
  const clickListenerRef = useRef<any>(null);
  const initedRef = useRef(false); // React 18 StrictMode 이중 마운트 대비
  const didFitRef = useRef(false);

  // SDK 로드 + 맵 생성 (한 번만)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (initedRef.current) return; // 중복 초기화 방지

        const kakao = await loadKakao(appKey, ["services"]);
        if (cancelled || !containerRef.current) return;

        kakaoRef.current = kakao;

        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level,
        });
        mapRef.current = map;
        initedRef.current = true;

        // 네이티브 컨트롤
        if (showNativeLayerControl) {
          const mapTypeControl = new kakao.maps.MapTypeControl();
          const zoomControl = new kakao.maps.ZoomControl();
          map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);
          map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
        }

        // 컨트롤 위치 여백(간단히 padding)
        if (containerRef.current) {
          containerRef.current.style.paddingRight = controlRightOffsetPx
            ? `${controlRightOffsetPx}px`
            : "";
          containerRef.current.style.paddingTop = controlTopOffsetPx
            ? `${controlTopOffsetPx}px`
            : "";
        }

        // 첫 프레임 타이밍에 레이아웃 보정
        setTimeout(() => {
          map.relayout?.();
          kakao.maps.event.trigger(map, "resize");
        }, 0);

        onMapReady?.({ map, kakao });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Kakao maps load failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    appKey,
    center.lat,
    center.lng,
    level,
    showNativeLayerControl,
    controlRightOffsetPx,
    controlTopOffsetPx,
    onMapReady,
  ]);

  // 지적편집도 토글
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    if (useDistrict) {
      map.addOverlayMapTypeId(kakao.maps.MapTypeId.USE_DISTRICT);
    } else {
      map.removeOverlayMapTypeId(kakao.maps.MapTypeId.USE_DISTRICT);
    }
  }, [useDistrict]);

  // 지도 클릭 이벤트
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    if (clickListenerRef.current) {
      kakao.maps.event.removeListener(map, "click", clickListenerRef.current);
      clickListenerRef.current = null;
    }

    if (onMapClick) {
      const handler = (e: any) => {
        const latlng = e?.latLng;
        if (!latlng) return;
        onMapClick({ lat: latlng.getLat(), lng: latlng.getLng() });
      };
      kakao.maps.event.addListener(map, "click", handler);
      clickListenerRef.current = handler;
    }

    return () => {
      if (clickListenerRef.current) {
        kakao.maps.event.removeListener(map, "click", clickListenerRef.current);
        clickListenerRef.current = null;
      }
    };
  }, [onMapClick]);

  // 마커 렌더링 + fitToMarkers
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    // 기존 마커 제거
    markerObjsRef.current.forEach((m) => m.setMap(null));
    markerObjsRef.current = [];

    // 새 마커
    const newMarkers = (markers ?? []).map((m) => {
      const mk = new kakao.maps.Marker({
        map,
        position: new kakao.maps.LatLng(m.position.lat, m.position.lng),
        title: m.title,
      });
      if (onMarkerClick) {
        kakao.maps.event.addListener(mk, "click", () => onMarkerClick(m.id));
      }
      return mk;
    });

    markerObjsRef.current = newMarkers;

    // 경계 맞추기
    if (fitToMarkers && !didFitRef.current && newMarkers.length > 0) {
      const bounds = new kakao.maps.LatLngBounds();
      newMarkers.forEach((mk) => bounds.extend(mk.getPosition()));
      map.setBounds(bounds);
      didFitRef.current = true;
    }
  }, [markers, fitToMarkers, onMarkerClick]);

  // idle 시 1회 relayout
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;
    const once = kakao.maps.event.addListener(map, "idle", () => {
      map.relayout?.();
      kakao.maps.event.removeListener(map, "idle", once);
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={
        {
          // 필요 시 외부에서 높이만 정해주면 됩니다. (예: className="h-[600px]")
        }
      }
    />
  );
};

export default MapView;
