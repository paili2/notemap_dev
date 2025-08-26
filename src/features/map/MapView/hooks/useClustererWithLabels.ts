import { useEffect, useRef } from "react";
import type { MapMarker } from "@/features/map/types/map";

export type ClustererWithLabelsOptions = {
  labelMaxLevel?: number; // 라벨/핀 보이는 최대 레벨 (이하: 라벨모드)
  clusterMinLevel?: number; // 클러스터 시작 레벨 (이상: 클러스터모드)
  onMarkerClick?: (id: string) => void;
  fitToMarkers?: boolean;
  labelGapPx?: number; // 라벨을 핀 머리 위로 띄우는 여백(px)
  hitboxSizePx?: number; // 핀 클릭 판정 원(투명) 지름(px)
};

export function useClustererWithLabels(
  kakao: any,
  map: any,
  markers: MapMarker[],
  {
    labelMaxLevel = 5,
    clusterMinLevel = 6,
    onMarkerClick,
    fitToMarkers = false,
    labelGapPx = 12,
    hitboxSizePx = 48, // 40~56 권장
  }: ClustererWithLabelsOptions = {}
) {
  const markerObjsRef = useRef<Record<string, any>>({});
  const markerClickHandlersRef = useRef<
    Record<string, ((...args: any[]) => void) | null>
  >({});
  const labelOvRef = useRef<Record<string, any>>({});

  // 히트박스(투명 클릭 영역)
  const hitboxOvRef = useRef<Record<string, any>>({});
  const hitboxClickHandlersRef = useRef<
    Record<string, ((...args: any[]) => void) | null>
  >({});

  const clustererRef = useRef<any>(null);
  const clusterClickHandlerRef = useRef<((cluster: any) => void) | null>(null);
  const zoomChangedHandlerRef = useRef<(() => void) | null>(null);

  const styleLabelEl = (el: HTMLDivElement) => {
    Object.assign(el.style, {
      transform: `translateY(calc(-150% - ${labelGapPx}px))`,
      padding: "4px 8px",
      borderRadius: "6px",
      background: "#3b82f6",
      color: "white",
      fontWeight: "bold",
      border: "1px solid rgba(0,0,0,0.12)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      fontSize: "12px",
      lineHeight: "1",
      whiteSpace: "nowrap",
      pointerEvents: "none", // 라벨은 클릭 막지 않게
    } as CSSStyleDeclaration);
  };

  const styleHitboxEl = (el: HTMLDivElement) => {
    const size = `${hitboxSizePx}px`;
    Object.assign(el.style, {
      width: size,
      height: size,
      borderRadius: "9999px",
      background: "rgba(0,0,0,0)", // 보이진 않지만 클릭만 받도록
      pointerEvents: "auto",
      cursor: "pointer",
      // outline: "1px dashed #3b82f6", // 디버그용
      touchAction: "manipulation",
    } as CSSStyleDeclaration);
  };

  useEffect(() => {
    if (!kakao || !map) return;

    // ===== 0) 이전 리소스 정리 =====
    // 마커 리스너
    Object.entries(markerClickHandlersRef.current).forEach(([id, handler]) => {
      const mk = markerObjsRef.current[id];
      if (mk && handler) kakao.maps.event.removeListener(mk, "click", handler);
    });
    markerClickHandlersRef.current = {};
    // 라벨
    Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
    labelOvRef.current = {};
    // 히트박스
    Object.entries(hitboxClickHandlersRef.current).forEach(([id, handler]) => {
      const hb = hitboxOvRef.current[id];
      if (hb && handler) kakao.maps.event.removeListener(hb, "click", handler);
    });
    hitboxClickHandlersRef.current = {};
    Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(null));
    hitboxOvRef.current = {};
    // 클러스터/마커
    if (clustererRef.current) clustererRef.current.clear();
    Object.values(markerObjsRef.current).forEach((mk: any) => mk.setMap(null));
    markerObjsRef.current = {};

    // ===== 1) 마커 & 라벨 & 히트박스 생성 =====
    markers.forEach((m) => {
      const pos = new kakao.maps.LatLng(m.position.lat, m.position.lng);

      // 1-a) 마커
      const mk = new kakao.maps.Marker({
        position: pos,
        title: m.title ?? String(m.id),
      });
      markerObjsRef.current[m.id] = mk;

      if (onMarkerClick) {
        const handler = () => onMarkerClick(m.id);
        kakao.maps.event.addListener(mk, "click", handler);
        markerClickHandlersRef.current[m.id] = handler;
      } else {
        markerClickHandlersRef.current[m.id] = null;
      }

      // 1-b) 라벨
      const labelEl = document.createElement("div");
      labelEl.className = "kakao-label";
      labelEl.innerText = m.title ?? String(m.id);
      styleLabelEl(labelEl);

      const labelOv = new kakao.maps.CustomOverlay({
        position: pos,
        content: labelEl,
        xAnchor: 0.5, // 가로 중앙
        yAnchor: 1, // 핀 머리 기준(아래가 기준)
        zIndex: 10000,
      });
      labelOvRef.current[m.id] = labelOv;

      // 1-c) 히트박스(투명 클릭 영역)
      const hitEl = document.createElement("div");
      hitEl.className = "kakao-hitbox";
      styleHitboxEl(hitEl);

      // DOM 이벤트(전파 차단 + 보강)
      if (onMarkerClick) {
        hitEl.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          try {
            onMarkerClick(m.id);
          } catch (err) {
            console.error("onMarkerClick failed:", err);
          }
        });
      }

      const hitOv = new kakao.maps.CustomOverlay({
        position: pos,
        content: hitEl,
        xAnchor: 0.5,
        yAnchor: 0.5, // 중심 기준
        zIndex: 9999, // 라벨(10000)보다 약간 아래
        clickable: true,
      });
      hitboxOvRef.current[m.id] = hitOv;

      // Kakao 이벤트(플랫폼 보강)
      if (onMarkerClick) {
        const hbHandler = () => onMarkerClick(m.id);
        kakao.maps.event.addListener(hitOv, "click", hbHandler);
        hitboxClickHandlersRef.current[m.id] = hbHandler;
      } else {
        hitboxClickHandlersRef.current[m.id] = null;
      }
    });

    // ===== 2) 클러스터러 준비(최초 생성 후 재사용) =====
    if (!clustererRef.current) {
      clustererRef.current = new kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: clusterMinLevel, // 이 레벨보다 확대되면 클러스터 해제
      });

      // UX: 클러스터 클릭 시 한 단계 확대
      const clusterClickHandler = (cluster: any) => {
        try {
          const center = cluster.getCenter();
          const nextLevel = Math.max(1, map.getLevel() - 1);
          map.setLevel(nextLevel, { anchor: center });
        } catch {}
      };
      clusterClickHandlerRef.current = clusterClickHandler;
      kakao.maps.event.addListener(
        clustererRef.current,
        "clusterclick",
        clusterClickHandler
      );
    }

    // ===== 3) 표시 모드 적용 =====
    const applyMode = () => {
      const level = map.getLevel();
      const mkList = Object.values(markerObjsRef.current) as any[];
      const labelList = Object.values(labelOvRef.current) as any[];
      const hitList = Object.values(hitboxOvRef.current) as any[];

      if (level <= labelMaxLevel) {
        // 라벨 모드: 라벨 + 개별 마커 + 히트박스
        clustererRef.current?.clear();
        mkList.forEach((mk) => mk.setMap(map));
        labelList.forEach((ov) => ov.setMap(map));
        hitList.forEach((ov) => ov.setMap(map));
        return;
      }

      if (level >= clusterMinLevel) {
        // 클러스터 모드: 라벨/마커/히트박스 숨기고 클러스터만
        labelList.forEach((ov) => ov.setMap(null));
        hitList.forEach((ov) => ov.setMap(null));
        mkList.forEach((mk) => mk.setMap(null));
        clustererRef.current?.clear();
        clustererRef.current?.addMarkers(mkList);
        return;
      }

      // 폴백(갭): 마커 + 히트박스만 (라벨 숨김)
      labelList.forEach((ov) => ov.setMap(null));
      clustererRef.current?.clear();
      mkList.forEach((mk) => mk.setMap(map));
      hitList.forEach((ov) => ov.setMap(map));
    };

    const onZoomChanged = () => applyMode();
    zoomChangedHandlerRef.current = onZoomChanged;
    kakao.maps.event.addListener(map, "zoom_changed", onZoomChanged);

    // 초기 적용
    applyMode();

    // ===== 4) fitToMarkers =====
    if (fitToMarkers && markers.length > 0) {
      const bounds = new kakao.maps.LatLngBounds();
      markers.forEach((m) =>
        bounds.extend(new kakao.maps.LatLng(m.position.lat, m.position.lng))
      );
      map.setBounds(bounds);
    }

    // ===== 5) 클린업 =====
    return () => {
      if (kakao?.maps?.event && map && zoomChangedHandlerRef.current) {
        kakao.maps.event.removeListener(
          map,
          "zoom_changed",
          zoomChangedHandlerRef.current
        );
        zoomChangedHandlerRef.current = null;
      }
      if (
        kakao?.maps?.event &&
        clustererRef.current &&
        clusterClickHandlerRef.current
      ) {
        kakao.maps.event.removeListener(
          clustererRef.current,
          "clusterclick",
          clusterClickHandlerRef.current
        );
        clusterClickHandlerRef.current = null;
      }

      // 마커 클릭 제거
      Object.entries(markerClickHandlersRef.current).forEach(
        ([id, handler]) => {
          const mk = markerObjsRef.current[id];
          if (mk && handler)
            kakao.maps.event.removeListener(mk, "click", handler);
        }
      );
      markerClickHandlersRef.current = {};

      // 히트박스 클릭 제거
      Object.entries(hitboxClickHandlersRef.current).forEach(
        ([id, handler]) => {
          const hb = hitboxOvRef.current[id];
          if (hb && handler)
            kakao.maps.event.removeListener(hb, "click", handler);
        }
      );
      hitboxClickHandlersRef.current = {};

      // 지도에서 제거
      clustererRef.current?.clear();
      Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
      Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(null));
      Object.values(markerObjsRef.current).forEach((mk: any) =>
        mk.setMap(null)
      );

      // 레퍼런스 초기화
      labelOvRef.current = {};
      hitboxOvRef.current = {};
      markerObjsRef.current = {};
    };
  }, [
    kakao,
    map,
    markers,
    labelMaxLevel,
    clusterMinLevel,
    onMarkerClick,
    fitToMarkers,
    labelGapPx,
    hitboxSizePx,
  ]);
}

export default useClustererWithLabels;
