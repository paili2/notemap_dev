"use client";

import * as React from "react";
import ContextMenuPanel from "./components/ContextMenuPanel/ContextMenuPanel";
import CustomOverlay from "@/features/map/components/PinContextMenu/components/CustomOverlay/CustomOverlay";
import type { PinContextMenuProps } from "./types";

export default function PinContextMenuContainer({
  kakao,
  map,
  position: target,
  roadAddress,
  jibunAddress,
  propertyId,
  propertyTitle,
  onClose,
  onView,
  onCreate,
  onPlan,
  zIndex = 10000,
}: PinContextMenuProps) {
  if (!kakao || !map || !target) return null;

  const isMarker = (v: any): v is kakao.maps.Marker =>
    !!v && typeof v.getPosition === "function";
  const isKakaoLatLng = (v: any): v is kakao.maps.LatLng =>
    !!v && typeof v.getLat === "function" && typeof v.getLng === "function";
  const isPlainLatLng = (v: any): v is { lat: number; lng: number } =>
    !!v && typeof v.lat === "number" && typeof v.lng === "number";

  // ✅ 실제 kakao.maps.LatLng로 정규화
  const position = React.useMemo(() => {
    if (isMarker(target)) return target.getPosition();
    if (isKakaoLatLng(target)) return target;
    if (isPlainLatLng(target))
      return new kakao.maps.LatLng(target.lat, target.lng);
    return new kakao.maps.LatLng(37.5665, 126.978);
  }, [target]);

  const xAnchor = 0.5;
  const yAnchor = 1;
  const offsetPx = 57;

  const handleView = (id: string) => onView?.(id);
  const handleCreate = () => onCreate?.();

  // ✅ 여기: 현재 오버레이 좌표를 캡처해서 (lat,lng)로 onPlan에 전달
  const handlePlan = React.useCallback(() => {
    const lat = position.getLat();
    const lng = position.getLng();
    onPlan?.({ lat, lng });
  }, [onPlan, position]);

  return (
    <CustomOverlay
      kakao={kakao}
      map={map}
      position={position}
      xAnchor={xAnchor}
      yAnchor={yAnchor}
      zIndex={zIndex}
      className="pointer-events-auto"
    >
      <div style={{ transform: `translateY(-${offsetPx}px)` }}>
        <div role="dialog" aria-modal="true">
          <div className="relative">
            <ContextMenuPanel
              roadAddress={roadAddress ?? undefined}
              jibunAddress={jibunAddress ?? undefined}
              propertyId={propertyId ?? undefined}
              propertyTitle={propertyTitle ?? undefined}
              onClose={onClose}
              onView={handleView}
              onCreate={handleCreate}
              onPlan={handlePlan}
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-full -mt-px -translate-x-1/2 w-0 h-0
                         border-l-[10px] border-l-transparent
                         border-r-[10px] border-r-transparent
                         border-t-[12px] border-t-white"
            />
          </div>
        </div>
      </div>
    </CustomOverlay>
  );
}
