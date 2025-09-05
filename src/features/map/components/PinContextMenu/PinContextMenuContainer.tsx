"use client";

import * as React from "react";
import ContextMenuPanel from "./components/ContextMenuPanel/ContextMenuPanel";
import CustomOverlay from "./components/CustomOverlay/CustomOverlay";
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
  zIndex = 10000,
}: PinContextMenuProps) {
  if (!kakao || !map || !target) return null;

  // --- 타입 가드들 ---
  const isMarker = (v: any): v is kakao.maps.Marker =>
    v && typeof v.getPosition === "function";
  const isKakaoLatLng = (v: any): v is kakao.maps.LatLng =>
    v && typeof v.getLat === "function" && typeof v.getLng === "function";
  const isPlainLatLng = (v: any): v is { lat: number; lng: number } =>
    v && typeof v.lat === "number" && typeof v.lng === "number";

  // 항상 kakao.maps.LatLng 로 변환
  const position: kakao.maps.LatLng = (() => {
    if (isMarker(target)) return target.getPosition();
    if (isKakaoLatLng(target)) return target;
    if (isPlainLatLng(target))
      return new kakao.maps.LatLng(target.lat, target.lng);
    // 타입이 엇갈릴 일이 없지만, 혹시 몰라 fallback
    return new kakao.maps.LatLng(37.5665, 126.978);
  })();

  const xAnchor = 0.5;
  const yAnchor = 1;
  const offsetPx = 57;

  const handleView = (id: string) => onView?.(id);
  const handleCreate = () => onCreate?.(propertyId ?? undefined);

  return (
    <CustomOverlay
      kakao={kakao as typeof kakao}
      map={map as kakao.maps.Map}
      position={position}
      xAnchor={xAnchor}
      yAnchor={yAnchor}
      zIndex={zIndex}
      className="pointer-events-auto"
    >
      <div style={{ transform: `translateY(-${offsetPx}px)` }}>
        <div role="dialog" aria-modal>
          <div className="relative">
            <ContextMenuPanel
              roadAddress={roadAddress ?? undefined}
              jibunAddress={jibunAddress ?? undefined}
              propertyId={propertyId ?? undefined}
              propertyTitle={propertyTitle ?? undefined}
              onClose={onClose}
              onView={handleView}
              onCreate={handleCreate}
            />
            <div
              aria-hidden
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
