import { useEffect, useRef } from "react";
import type { MapMarker } from "@/features/map/types/map";
import { PinKind } from "@/features/pins/types";
import { getPinUrl, PIN_ACCENTS } from "@/features/pins/lib/assets";
import { styleHitboxEl, styleLabelEl } from "@/features/map/lib/overlays/style";
import { HITBOX, LABEL, PIN_MARKER, Z } from "@/features/map/lib/constants";

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

export function useClustererWithLabels(
  kakao: any,
  map: any,
  markers: MapMarker[],
  {
    labelMaxLevel = 5,
    clusterMinLevel = 6,
    onMarkerClick,
    fitToMarkers = false,
    labelGapPx = LABEL.GAP_PX,
    hitboxSizePx = HITBOX.DIAMETER_PX,
    defaultPinKind = "1room",
    hideLabelForId = null,
  }: ClustererWithLabelsOptions = {}
) {
  const markerObjsRef = useRef<Record<string, any>>({});
  const markerClickHandlersRef = useRef<
    Record<string, ((...args: any[]) => void) | null>
  >({});
  const labelOvRef = useRef<Record<string, any>>({});
  const hitboxOvRef = useRef<Record<string, any>>({});

  const clustererRef = useRef<any>(null);

  // 안전한 경계 (설정 실수 방지)
  const safeLabelMax = Math.min(labelMaxLevel, clusterMinLevel - 1);

  // 1) 클러스터러 초기화 및 clusterclick 리스너 (옵션 바뀌면 재설치)
  useEffect(() => {
    if (!kakao || !map) return;

    if (!clustererRef.current) {
      clustererRef.current = new kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: clusterMinLevel,
      });
    } else {
      // minLevel 변경 반영
      try {
        clustererRef.current.setMinLevel?.(clusterMinLevel);
      } catch {}
    }

    const handler = (cluster: any) => {
      try {
        const center = cluster.getCenter();
        const nextLevel = Math.max(1, map.getLevel() - 1);
        map.setLevel(nextLevel, { anchor: center });
      } catch {}
    };

    kakao.maps.event.addListener(clustererRef.current, "clusterclick", handler);
    return () => {
      kakao?.maps?.event?.removeListener?.(
        clustererRef.current,
        "clusterclick",
        handler
      );
    };
  }, [kakao, map, clusterMinLevel]);

  // 2) 마커/라벨/히트박스 생성 및 정리 (markers 또는 옵션 바뀔 때)
  useEffect(() => {
    if (!kakao || !map) return;

    // 이전 리소스 정리
    Object.entries(markerClickHandlersRef.current).forEach(([id, handler]) => {
      const mk = markerObjsRef.current[id];
      if (mk && handler) kakao.maps.event.removeListener(mk, "click", handler);
    });
    markerClickHandlersRef.current = {};

    Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
    labelOvRef.current = {};

    Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(null));
    hitboxOvRef.current = {};

    if (clustererRef.current) clustererRef.current.clear();
    Object.values(markerObjsRef.current).forEach((mk: any) => mk.setMap(null));
    markerObjsRef.current = {};

    // 생성
    markers.forEach((m) => {
      const pos = new kakao.maps.LatLng(m.position.lat, m.position.lng);

      // kind/색상/아이콘 결정
      const kind: PinKind = ((m as any).kind ?? defaultPinKind) as PinKind;
      const accent = PIN_ACCENTS[kind] ?? "#3B82F6";
      const iconUrl = getPinUrl(kind);

      // 마커
      const mkOptions: any = {
        position: pos,
        title: m.title ?? String(m.id),
        zIndex: m.id === "__draft__" ? Z.DRAFT_PIN : 0,
      };

      if (iconUrl && typeof iconUrl === "string") {
        try {
          const markerSize = new kakao.maps.Size(
            PIN_MARKER.size.w,
            PIN_MARKER.size.h
          );
          const markerOffset = new kakao.maps.Point(
            PIN_MARKER.offset.x,
            PIN_MARKER.offset.y
          );
          mkOptions.image = new kakao.maps.MarkerImage(iconUrl, markerSize, {
            offset: markerOffset,
          });
        } catch {
          /* 폴백: 기본 마커 */
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

      // 라벨
      const labelEl = document.createElement("div");
      labelEl.className = "kakao-label";
      labelEl.innerText = m.title ?? String(m.id);
      styleLabelEl(labelEl, accent, labelGapPx);

      const labelOv = new kakao.maps.CustomOverlay({
        position: pos,
        content: labelEl,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: LABEL.Z_INDEX,
      });
      labelOvRef.current[m.id] = labelOv;

      // 히트박스 (DOM 이벤트만 사용: 중복 방지)
      const hitEl = document.createElement("div");
      hitEl.className = "kakao-hitbox";
      styleHitboxEl(hitEl, hitboxSizePx);

      if (onMarkerClick) {
        hitEl.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          onMarkerClick(m.id);
        });
      }

      const hitOv = new kakao.maps.CustomOverlay({
        position: pos,
        content: hitEl,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: HITBOX.Z_INDEX,
        clickable: true,
      });
      hitboxOvRef.current[m.id] = hitOv;
    });

    // 초기 모드 적용 & fit
    applyMode();
    if (fitToMarkers && markers.length > 0) {
      const bounds = new kakao.maps.LatLngBounds();
      markers.forEach((m) =>
        bounds.extend(new kakao.maps.LatLng(m.position.lat, m.position.lng))
      );
      map.setBounds(bounds);
    }

    // 정리
    return () => {
      Object.entries(markerClickHandlersRef.current).forEach(
        ([id, handler]) => {
          const mk = markerObjsRef.current[id];
          if (mk && handler)
            kakao.maps.event.removeListener(mk, "click", handler);
        }
      );
      markerClickHandlersRef.current = {};

      if (clustererRef.current) clustererRef.current.clear();
      Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
      Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(null));
      Object.values(markerObjsRef.current).forEach((mk: any) =>
        mk.setMap(null)
      );

      labelOvRef.current = {};
      hitboxOvRef.current = {};
      markerObjsRef.current = {};
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    function applyMode() {
      const level = map.getLevel();
      const mkList = Object.values(markerObjsRef.current) as any[];
      const labelEntries = Object.entries(labelOvRef.current) as [
        string,
        any
      ][];
      const hitList = Object.values(hitboxOvRef.current) as any[];

      if (level <= safeLabelMax) {
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
    }
  }, [
    kakao,
    map,
    JSON.stringify(markers), // 깊은 변경 추적(차후 diff 최적화 가능)
    safeLabelMax,
    clusterMinLevel,
    onMarkerClick,
    fitToMarkers,
    labelGapPx,
    hitboxSizePx,
    defaultPinKind,
    hideLabelForId,
  ]);

  // 3) 줌 변화에 따른 표시 모드 적용만 담당 (가벼운 이펙트)
  useEffect(() => {
    if (!kakao || !map) return;

    const applyMode = () => {
      const level = map.getLevel();
      const mkList = Object.values(markerObjsRef.current) as any[];
      const labelEntries = Object.entries(labelOvRef.current) as [
        string,
        any
      ][];
      const hitList = Object.values(hitboxOvRef.current) as any[];

      if (level <= safeLabelMax) {
        clustererRef.current?.clear();
        mkList.forEach((mk) => mk.setMap(map));
        labelEntries.forEach(([id, ov]) =>
          ov.setMap(hideLabelForId && id === hideLabelForId ? null : map)
        );
        hitList.forEach((ov) => ov.setMap(map));
        return;
      }

      if (level >= clusterMinLevel) {
        labelEntries.forEach(([, ov]) => ov.setMap(null));
        hitList.forEach((ov) => ov.setMap(null));
        mkList.forEach((mk) => mk.setMap(null));
        clustererRef.current?.clear();
        clustererRef.current?.addMarkers(mkList);
        return;
      }

      labelEntries.forEach(([, ov]) => ov.setMap(null));
      clustererRef.current?.clear();
      mkList.forEach((mk) => mk.setMap(map));
      hitList.forEach((ov) => ov.setMap(map));
    };

    kakao.maps.event.addListener(map, "zoom_changed", applyMode);
    applyMode(); // 마운트 시 한 번 동기화

    return () => {
      kakao?.maps?.event?.removeListener?.(map, "zoom_changed", applyMode);
    };
  }, [kakao, map, safeLabelMax, clusterMinLevel, hideLabelForId]);
}

export default useClustererWithLabels;
