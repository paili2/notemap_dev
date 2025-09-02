import { LatLng } from "@/features/map/types/map";
import { useEffect, useRef, useState } from "react";

type Args = {
  appKey: string;
  center: LatLng;
  level?: number;
  showNativeLayerControl?: boolean;
  controlRightOffsetPx?: number;
  controlTopOffsetPx?: number;
  onMapReady?: (args: { kakao: any; map: any }) => void;
};

declare global {
  interface Window {
    __kakaoMapLoader?: Promise<any>;
  }
}

function loadKakaoOnce(appKey: string) {
  if (typeof window === "undefined") return Promise.reject("SSR");
  const w = window as any;

  // 이미 로드 되었으면 재사용
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

const useKakaoMap = ({
  appKey,
  center,
  level = 5,
  showNativeLayerControl = true,
  controlRightOffsetPx = 10,
  controlTopOffsetPx = 10,
  onMapReady,
}: Args) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ref로 보관: 재렌더에도 인스턴스 유지 (재생성 X)
  const kakaoRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  const [ready, setReady] = useState(false);

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

        // 기본 컨트롤 (오른쪽 상단 위치/오프셋 적용)
        if (showNativeLayerControl) {
          const mapTypeControl = new kakao.maps.MapTypeControl();
          map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);
          // 오프셋은 DOM 스타일로 조정
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

    // cleanup: 지도 DOM만 정리 (스크립트는 그대로 두기)
    return () => {
      cancelled = true;
      // 카카오 지도는 명시적 destroy가 없어도 DOM 제거 시 GC됨
      mapRef.current = null;
    };
    // 의도적으로 deps 비움: "한 번만" 초기화
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appKey]);

  // 2) center 변경 시 부드럽게 이동 (재생성 금지)
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!ready || !kakao || !map) return;

    // requestAnimationFrame으로 프레임 단위 스로틀 → 미세 깜빡임 방지
    let raf = requestAnimationFrame(() => {
      const next = new kakao.maps.LatLng(center.lat, center.lng);
      map.panTo(next);
    });
    return () => cancelAnimationFrame(raf);
  }, [center.lat, center.lng, ready]);

  // 3) level 변경 시 메서드 호출 (재생성 금지)
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setLevel(level);
  }, [level, ready]);

  // 4) 네이티브 컨트롤 표시 토글 (필요 시)
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!ready || !kakao || !map) return;

    // 간단 구현: 표시 on일 때만 컨트롤 추가 (한 번 추가되면 유지되므로,
    // 자주 토글할 일 있으면 별도 DOM 스타일로 show/hide 권장)
    if (showNativeLayerControl) {
      const mapTypeControl = new kakao.maps.MapTypeControl();
      map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);
    }
  }, [showNativeLayerControl, ready]);

  return {
    containerRef,
    kakao: kakaoRef.current, // 현재 인스턴스 (state가 아니라 flicker 없음)
    map: mapRef.current,
    ready,
  };
};

export default useKakaoMap;
