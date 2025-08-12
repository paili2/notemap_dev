"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";
import { cn } from "@/lib/utils";
import { loadKakaoMaps } from "@/lib/kakaoLoader";
import type {
  LatLng,
  MapMarker,
  MapControls,
} from "@/features/properties/types/map";

type MapViewProps = {
  appKey: string;
  center?: LatLng;
  level?: number;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (pos: LatLng) => void;
  fitToMarkers?: boolean;
  controls?: MapControls;
  title?: string;
  className?: string;
  height?: number | string;
};

export function MapView({
  appKey,
  center = { lat: 37.5665, lng: 126.978 },
  level = 3,
  markers = [],
  onMarkerClick,
  onMapClick,
  fitToMarkers = true,
  controls = { zoom: true, mapType: false },
  title = "지도",
  className,
  height = 500,
}: MapViewProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);
  const markerObjsRef = React.useRef<any[]>([]);
  const initialized = React.useRef(false); // StrictMode 이니셜라이즈 가드
  const resizeObsRef = React.useRef<ResizeObserver | null>(null);

  // 1) SDK 로드 & 지도 생성 (1회)
  React.useEffect(() => {
    let canceled = false;

    (async () => {
      if (!appKey) {
        console.warn(
          "[MapView] NEXT_PUBLIC_KAKAO_MAP_KEY가 비어있어요. env 주입을 확인하세요."
        );
      }

      await loadKakaoMaps(appKey);
      if (canceled || initialized.current) return;
      if (!containerRef.current) return;

      const { kakao } = window as any;
      const map = new kakao.maps.Map(containerRef.current, {
        center: new kakao.maps.LatLng(center.lat, center.lng),
        level,
      });
      mapRef.current = map;
      initialized.current = true;

      // 컨트롤 추가
      if (controls.zoom) {
        const zoomControl = new kakao.maps.ZoomControl();
        map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
      }
      if (controls.mapType) {
        const mapTypeControl = new kakao.maps.MapTypeControl();
        map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);
      }

      // 지도 클릭 이벤트
      if (onMapClick) {
        kakao.maps.event.addListener(map, "click", (mouseEvent: any) => {
          const latlng = mouseEvent.latLng;
          onMapClick({ lat: latlng.getLat(), lng: latlng.getLng() });
        });
      }

      // 초기 렌더 직후 레이아웃 보정
      setTimeout(() => {
        try {
          const h = containerRef.current?.offsetHeight ?? 0;
          if (h === 0) {
            console.warn(
              "[MapView] 컨테이너 높이가 0입니다. 부모 높이 또는 Storybook 데코레이터를 확인하세요."
            );
          }
          map.relayout();
        } catch {}
      }, 0);

      // 컨테이너 크기 변동 감지하여 relayout
      if ("ResizeObserver" in window) {
        resizeObsRef.current = new ResizeObserver(() => {
          try {
            map.relayout();
          } catch {}
        });
        resizeObsRef.current.observe(containerRef.current);
      }

      // 윈도우 리사이즈 시에도 보정
      const onWinResize = () => {
        try {
          map.relayout();
        } catch {}
      };
      window.addEventListener("resize", onWinResize);

      // cleanup
      return () => {
        window.removeEventListener("resize", onWinResize);
        if (resizeObsRef.current && containerRef.current) {
          resizeObsRef.current.unobserve(containerRef.current);
          resizeObsRef.current.disconnect();
          resizeObsRef.current = null;
        }
      };
    })();

    return () => {
      canceled = true;
    };
  }, [appKey, controls.mapType, controls.zoom]); // 생성 관련만

  // 2) 중심/레벨 변경 반영
  React.useEffect(() => {
    const map = mapRef.current;
    const kakao = (window as any)?.kakao;
    if (!map || !kakao?.maps) return;

    map.setLevel(level);
    map.setCenter(new kakao.maps.LatLng(center.lat, center.lng));

    // 중심/레벨 변경 후 레이아웃 한번 더 보정
    try {
      map.relayout();
    } catch {}
  }, [center.lat, center.lng, level]);

  // 3) 마커 반영
  React.useEffect(() => {
    const map = mapRef.current;
    const kakao = (window as any)?.kakao;
    if (!map || !kakao?.maps) return;

    // 기존 마커 제거
    markerObjsRef.current.forEach((m) => m.setMap(null));
    markerObjsRef.current = [];

    if (!markers.length) return;

    const bounds = new kakao.maps.LatLngBounds();

    markers.forEach((m) => {
      const pos = new kakao.maps.LatLng(m.position.lat, m.position.lng);
      const marker = new kakao.maps.Marker({ position: pos, title: m.title });
      marker.setMap(map);
      markerObjsRef.current.push(marker);
      bounds.extend(pos);

      if (onMarkerClick) {
        kakao.maps.event.addListener(marker, "click", () => onMarkerClick(m));
      }
    });

    if (fitToMarkers && markers.length > 1) {
      map.setBounds(bounds);
      try {
        map.relayout();
      } catch {}
    }
  }, [JSON.stringify(markers), onMarkerClick, fitToMarkers]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="py-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="w-full"
          style={{
            // 높이 반드시 보장
            height: typeof height === "number" ? `${height}px` : height,
            minHeight: 200,
          }}
        />
      </CardContent>
    </Card>
  );
}

export default MapView;
