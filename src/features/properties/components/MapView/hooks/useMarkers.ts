// 마커 렌더링 + fitToMarkers

"use client";

import { useEffect, useRef } from "react";
import type { MapMarker } from "@/features/properties/types/map";

export function useMarkers(
  kakao: any,
  map: any,
  markers: MapMarker[] | undefined,
  onMarkerClick?: (id: string) => void,
  fitToMarkers?: boolean
) {
  const markerObjsRef = useRef<any[]>([]);
  const didFitRef = useRef(false);

  useEffect(() => {
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

    // 최초 1회 bounds 맞추기
    if (fitToMarkers && !didFitRef.current && newMarkers.length > 0) {
      const bounds = new kakao.maps.LatLngBounds();
      newMarkers.forEach((mk) => bounds.extend(mk.getPosition()));
      map.setBounds(bounds);
      didFitRef.current = true;
    }
  }, [kakao, map, markers, onMarkerClick, fitToMarkers]);
}
