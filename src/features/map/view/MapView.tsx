"use client";

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import useKakaoMap from "./hooks/useKakaoMap";
import { useClustererWithLabels } from "./clusterer/useClustererWithLabels";
import { useDistrictOverlay } from "./hooks/useDistrictOverlay";
import type { MapViewProps } from "./types";
import usePoiLayer from "../shared/hooks/poi/usePoiLayer";
import { PoiKind } from "../shared/overlays/poiOverlays";
import { PoiLayerToggle } from "./top/components/PoiLayerToggle";
import { toast } from "@/hooks/use-toast";

type Props = MapViewProps;

export type MapViewHandle = {
  searchPlace: (
    q: string,
    opts?: {
      clearPrev?: boolean;
      recenter?: boolean;
      fitZoom?: boolean;
      preferStation?: boolean;
      showMarker?: boolean;
      onFound?: (pos: { lat: number; lng: number }) => void;
    }
  ) => void;
  panTo: (p: { lat: number; lng: number }) => void;
};

const MapView = React.forwardRef<MapViewHandle, Props>(function MapView(
  {
    appKey,
    center,
    level = 5,
    markers = [],
    fitToMarkers = false,
    useDistrict = false,
    allowCreateOnMapClick = false,
    onMarkerClick,
    onDraftPinClick,
    onMapClick,
    onMapReady,
    onViewportChange,
    pinKind = "1room",
    hideLabelForId = null,

    poiKinds = [],
    showPoiToolbar = false,
    onOpenMenu,
  },
  ref
) {
  // useKakaoMap이 idle 디바운스를 제공하므로 내부 타이머 제거
  const { containerRef, kakao, map, searchPlace, panTo } = useKakaoMap({
    appKey,
    center,
    level,
    fitKoreaBounds: true,
    viewportDebounceMs: 500,
    onMapReady,
    onViewportChange, // 그대로 전달 (훅이 디바운스 처리)
    useCurrentLocationOnInit: true,
  });

  // 외부로 제어 메서드 노출
  useImperativeHandle(
    ref,
    () => ({
      searchPlace,
      panTo,
    }),
    [searchPlace, panTo]
  );

  // 구/군 경계 오버레이
  useDistrictOverlay(kakao, map, useDistrict);

  // ▼ 주변시설 레이어 (외부 상태 사용) — 가드 강화
  usePoiLayer({
    kakaoSDK: kakao,
    map,
    enabledKinds: [...(poiKinds ?? [])] as PoiKind[],
    maxResultsPerKind: 80,
    // 500m 체감 게이트
    minViewportEdgeMeters: 1000,
    showAtOrBelowLevel: 6,
  });

  // 지도 클릭 (디버그 로그 + 조건부 콜백)
  useEffect(() => {
    if (!kakao || !map) return;

    const handler = (e: any) => {
      const latlng = e?.latLng;
      if (!latlng) return;

      // 디버그: 좌표 확인용
      console.log("map clicked", latlng.getLat(), latlng.getLng());

      if (allowCreateOnMapClick && onMapClick) {
        onMapClick({
          lat: latlng.getLat(),
          lng: latlng.getLng(),
        });
      }
    };

    kakao.maps.event.addListener(map, "click", handler);
    return () => {
      kakao.maps.event.removeListener(map, "click", handler);
    };
  }, [kakao, map, allowCreateOnMapClick, onMapClick]);

  // 마커 클릭 핸들러
  const handleMarkerClick = useCallback(
    (id: string) => {
      // 🔹 500m(레벨 6) 이상에서는 메뉴 막고 토스트 + 확대만
      const level = map?.getLevel?.() ?? 0;
      if (level >= 6) {
        toast({
          title: "조금 더 확대해 주세요",
          description: "250m까지 확대하면 매물 메뉴를 사용할 수 있어요.",
        });

        try {
          // 250m(레벨 5)로 확대
          map?.setLevel?.(5, { animate: true });
        } catch {}

        return;
      }

      // ===== 여기부터는 기존 코드 유지 =====
      // 1) 드래프트 핀
      if (id === "__draft__") {
        const draft = markers.find((m) => String(m.id) === "__draft__");
        if (draft && onDraftPinClick) {
          onDraftPinClick(draft.position);
        } else if (map && onDraftPinClick && kakao) {
          const c = map.getCenter();
          onDraftPinClick({ lat: c.getLat(), lng: c.getLng() });
        }
        return;
      }

      // 2) 답사예정 핀 → 자동 예약 금지, 메뉴만 오픈
      if (String(id).startsWith("__visit__")) {
        const m = markers.find((x) => String(x.id) === String(id));
        if (m && onOpenMenu) {
          onOpenMenu({
            position: m.position,
            propertyId: String(m.id),
            propertyTitle: (m as any).title ?? null,
            pin: { kind: "question", isFav: !!(m as any).isFav },
          });
        }
        return;
      }

      // 3) 일반 핀 → 컨텍스트 메뉴 열기 + 상위 콜백 알림
      const m = markers.find((x) => String(x.id) === String(id));
      if (m && onOpenMenu) {
        onOpenMenu({
          position: m.position,
          propertyId: String(m.id),
          propertyTitle: (m as any).title ?? (m as any).name ?? "",
          pin: {
            kind: (m as any).pin?.kind ?? pinKind,
            isFav: !!(m as any).isFav,
          },
        });
      }

      onMarkerClick?.(id);
    },
    [
      markers,
      onDraftPinClick,
      onMarkerClick,
      map,
      kakao,
      onOpenMenu,
      pinKind,
      toast,
    ]
  );

  // 클러스터러 + 라벨
  useClustererWithLabels(kakao, map, markers, {
    hitboxSizePx: 56,
    onMarkerClick: handleMarkerClick,
    defaultPinKind: pinKind,
    fitToMarkers,
    hideLabelForId,
    enableDebug: true,
  });

  return (
    <div className="relative w-full h-full">
      {showPoiToolbar && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur rounded-xl p-2 shadow">
          <PoiLayerToggle
            value={[...poiKinds] as PoiKind[]}
            onChange={() => {
              /* 외부 제어형: 부모에서 상태를 바꾸도록 유지 */
            }}
          />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
});

export default MapView;
