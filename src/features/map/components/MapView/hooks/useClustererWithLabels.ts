import { useEffect, useRef } from "react";
import type { MapMarker } from "@/features/map/types/map";
import { PinKind } from "@/features/pins/types";
import { getPinUrl, PIN_ACCENTS } from "@/features/pins/lib/assets";

export type ClustererWithLabelsOptions = {
  labelMaxLevel?: number; // 라벨/핀 보이는 최대 레벨 (이하: 라벨모드)
  clusterMinLevel?: number; // 클러스터 시작 레벨 (이상: 클러스터모드)
  onMarkerClick?: (id: string) => void;
  fitToMarkers?: boolean;
  labelGapPx?: number; // 라벨을 핀 머리 위로 띄우는 여백(px)
  hitboxSizePx?: number; // 핀 클릭 판정 원(투명) 지름(px)
  defaultPinKind?: PinKind; // 마커에 kind 없을 때 기본 핀
  hideLabelForId?: string | null;
};

/** #RRGGBB / #RGB → rgba */
function hexToRgba(hex: string, alpha = 1) {
  const m = hex.replace("#", "");
  const v =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const n = parseInt(v, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 화이트 계열인지 간단 판정 */
function isWhiteLike(color: string) {
  const c = color?.trim().toLowerCase();
  return c === "#fff" || c === "#ffffff" || c === "white";
}

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
    hitboxSizePx = 48,
    defaultPinKind = "1room",
    hideLabelForId = null,
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

  const styleLabelEl = (el: HTMLDivElement, accentHex: string) => {
    const textColor = isWhiteLike(accentHex) ? "#111827" : "#ffffff";
    const shadow = isWhiteLike(accentHex)
      ? "rgba(0,0,0,0.08)"
      : hexToRgba(accentHex, 0.25);
    Object.assign(el.style, {
      transform: `translateY(calc(-150% - ${labelGapPx}px))`,
      padding: "6px 10px",
      borderRadius: "8px",
      background: accentHex,
      color: textColor,
      fontWeight: "700",
      border: "1px solid rgba(0,0,0,0.12)",
      boxShadow: `0 4px 12px ${shadow}`,
      fontSize: "12px",
      lineHeight: "1",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      userSelect: "none",
    } as CSSStyleDeclaration);
  };

  const styleHitboxEl = (el: HTMLDivElement) => {
    const size = `${hitboxSizePx}px`;
    Object.assign(el.style, {
      width: size,
      height: size,
      borderRadius: "9999px",
      background: "rgba(0,0,0,0)",
      pointerEvents: "auto",
      cursor: "pointer",
      touchAction: "manipulation",
    } as CSSStyleDeclaration);
  };

  useEffect(() => {
    if (!kakao || !map) return;

    // ===== 0) 이전 리소스 정리 =====
    Object.entries(markerClickHandlersRef.current).forEach(([id, handler]) => {
      const mk = markerObjsRef.current[id];
      if (mk && handler) kakao.maps.event.removeListener(mk, "click", handler);
    });
    markerClickHandlersRef.current = {};

    Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
    labelOvRef.current = {};

    Object.entries(hitboxClickHandlersRef.current).forEach(([id, handler]) => {
      const hb = hitboxOvRef.current[id];
      if (hb && handler) kakao.maps.event.removeListener(hb, "click", handler);
    });
    hitboxClickHandlersRef.current = {};
    Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(null));
    hitboxOvRef.current = {};

    if (clustererRef.current) clustererRef.current.clear();
    Object.values(markerObjsRef.current).forEach((mk: any) => mk.setMap(null));
    markerObjsRef.current = {};

    // ===== 1) 마커 & 라벨 & 히트박스 생성 =====
    markers.forEach((m) => {
      const pos = new kakao.maps.LatLng(m.position.lat, m.position.lng);

      // 이 마커의 최종 kind/색상/아이콘 결정
      const kind: PinKind = ((m as any).kind ?? defaultPinKind) as PinKind;
      const accent = PIN_ACCENTS[kind] ?? "#3B82F6";
      const iconUrl = getPinUrl(kind); // 폴백 처리 아래에서

      // 1-a) 마커 (아이콘 적용: 실패 시 기본 마커 폴백)
      const mkOptions: any = {
        position: pos,
        title: m.title ?? String(m.id),
        zIndex: m.id === "__draft__" ? 101 : 0, // 드래프트는 살짝 위
      };

      if (iconUrl && typeof iconUrl === "string") {
        try {
          const markerSize = new kakao.maps.Size(36, 48);
          const markerOffset = new kakao.maps.Point(18, 48); // 바늘 끝이 좌표에 닿도록
          mkOptions.image = new kakao.maps.MarkerImage(iconUrl, markerSize, {
            offset: markerOffset,
          });
        } catch {
          // 실패 시 기본 마커 사용
        }
      }

      const mk = new kakao.maps.Marker(mkOptions);
      markerObjsRef.current[m.id] = mk;

      if (onMarkerClick) {
        const handler = () => onMarkerClick(m.id);
        kakao.maps.event.addListener(mk, "click", handler);
        markerClickHandlersRef.current[m.id] = handler;
      } else {
        markerClickHandlersRef.current[m.id] = null;
      }

      // 1-b) 라벨 (배경색 = 핀 색)
      const labelEl = document.createElement("div");
      labelEl.className = "kakao-label";
      labelEl.innerText = m.title ?? String(m.id);
      styleLabelEl(labelEl, accent);

      const labelOv = new kakao.maps.CustomOverlay({
        position: pos,
        content: labelEl,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: 10000,
      });
      labelOvRef.current[m.id] = labelOv;

      // 1-c) 히트박스(투명 클릭 영역)
      const hitEl = document.createElement("div");
      hitEl.className = "kakao-hitbox";
      styleHitboxEl(hitEl);

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
        yAnchor: 0.5,
        zIndex: 9999,
        clickable: true,
      });
      hitboxOvRef.current[m.id] = hitOv;

      if (onMarkerClick) {
        const hbHandler = () => onMarkerClick(m.id);
        kakao.maps.event.addListener(hitOv, "click", hbHandler);
        hitboxClickHandlersRef.current[m.id] = hbHandler;
      } else {
        hitboxClickHandlersRef.current[m.id] = null;
      }
    });

    // ===== 2) 클러스터러 준비(최초 1회 생성 후 재사용) =====
    if (!clustererRef.current) {
      clustererRef.current = new kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: clusterMinLevel,
      });

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
      const labelEntries = Object.entries(labelOvRef.current) as [
        string,
        any
      ][];
      const hitList = Object.values(hitboxOvRef.current) as any[];

      if (level <= labelMaxLevel) {
        // 라벨 모드
        clustererRef.current?.clear();
        mkList.forEach((mk) => mk.setMap(map));
        labelEntries.forEach(([id, ov]) =>
          ov.setMap(hideLabelForId && id === hideLabelForId ? null : map)
        );
        hitList.forEach((ov) => ov.setMap(map));
        return;
      }

      if (level >= clusterMinLevel) {
        // 클러스터 모드
        labelEntries.forEach(([, ov]) => ov.setMap(null));
        hitList.forEach((ov) => ov.setMap(null));
        mkList.forEach((mk) => mk.setMap(null));
        clustererRef.current?.clear();
        clustererRef.current?.addMarkers(mkList);
        return;
      }

      // 중간 모드: 마커 + 히트박스 (라벨 숨김)
      labelEntries.forEach(([, ov]) => ov.setMap(null));
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

      Object.entries(markerClickHandlersRef.current).forEach(
        ([id, handler]) => {
          const mk = markerObjsRef.current[id];
          if (mk && handler)
            kakao.maps.event.removeListener(mk, "click", handler);
        }
      );
      markerClickHandlersRef.current = {};

      Object.entries(hitboxClickHandlersRef.current).forEach(
        ([id, handler]) => {
          const hb = hitboxOvRef.current[id];
          if (hb && handler)
            kakao.maps.event.removeListener(hb, "click", handler);
        }
      );
      hitboxClickHandlersRef.current = {};

      clustererRef.current?.clear();
      Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
      Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(null));
      Object.values(markerObjsRef.current).forEach((mk: any) =>
        mk.setMap(null)
      );

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
    defaultPinKind,
    hideLabelForId,
  ]);
}

export default useClustererWithLabels;
