"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { loadKakaoMaps } from "@/lib/kakaoLoader";
import type { LatLng, MapMarker } from "@/features/properties/types/map";

type MapControls = {
  zoom?: boolean;
  mapType?: boolean;
};

type Props = {
  appKey: string;
  center?: LatLng;
  level?: number;
  markers?: MapMarker[]; // ← 추가
  fitToMarkers?: boolean; // ← 추가
  controls?: MapControls; // ← 추가
  onMarkerClick?: (marker: MapMarker) => void; // ← 추가
};

export default function MapView({
  appKey,
  center = { lat: 37.5665, lng: 126.978 },
  level = 3,
  markers = [],
  fitToMarkers = false,
  controls,
  onMarkerClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null); // kakao 타입은 any로
  const markerObjsRef = useRef<any[]>([]); // kakao 타입은 any로

  // 지도 생성
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadKakaoMaps(appKey); // SDK 로딩 보장
        if (cancelled || !containerRef.current) return;

        const k = (window as any).kakao!;
        const lat = Number(center.lat);
        const lng = Number(center.lng);

        const map = new k.maps.Map(containerRef.current, {
          center: new k.maps.LatLng(lat, lng),
          level,
        });
        mapRef.current = map;

        // 컨트롤(초기 1회)
        if (controls?.zoom) {
          const zoomCtrl = new k.maps.ZoomControl();
          map.addControl(zoomCtrl, k.maps.ControlPosition.RIGHT);
        }
        if (controls?.mapType) {
          const mapTypeCtrl = new k.maps.MapTypeControl();
          map.addControl(mapTypeCtrl, k.maps.ControlPosition.TOPRIGHT);
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
    // controls는 제거 API가 없어 초기 1회만 반영
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appKey, center.lat, center.lng, level]);

  // 마커 렌더링 & 클릭 핸들러
  useEffect(() => {
    const k = (window as any).kakao;
    const map = mapRef.current;
    if (!k || !map) return;

    // 기존 마커 제거
    markerObjsRef.current.forEach((m) => m.setMap(null));
    markerObjsRef.current = [];

    if (!markers || markers.length === 0) return;

    const bounds = new k.maps.LatLngBounds();

    markers.forEach((mData) => {
      const marker = new k.maps.Marker({
        position: new k.maps.LatLng(mData.position.lat, mData.position.lng),
        title: mData.title,
      });

      if (onMarkerClick) {
        k.maps.event.addListener(marker, "click", () => onMarkerClick(mData));
      }

      marker.setMap(map);
      markerObjsRef.current.push(marker);
      bounds.extend(new k.maps.LatLng(mData.position.lat, mData.position.lng));
    });

    if (fitToMarkers && markers.length > 0) {
      map.setBounds(bounds);
    }
  }, [markers, fitToMarkers, onMarkerClick]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
