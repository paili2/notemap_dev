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
  zIndex = 10000,
}: PinContextMenuProps) {
  if (!kakao || !map || !target) return null;

  const isMarker = (v: any): v is kakao.maps.Marker =>
    !!v && typeof v.getPosition === "function";
  const isKakaoLatLng = (v: any): v is kakao.maps.LatLng =>
    !!v && typeof v.getLat === "function" && typeof v.getLng === "function";
  const isPlainLatLng = (v: any): v is { lat: number; lng: number } =>
    !!v && typeof v.lat === "number" && typeof v.lng === "number";

  // ✅ 메모: position 계산
  const position = React.useMemo(() => {
    if (isMarker(target)) return target.getPosition();
    if (isKakaoLatLng(target)) return target;
    if (isPlainLatLng(target)) {
      return new kakao.maps.LatLng(target.lat, target.lng);
    }
    return new kakao.maps.LatLng(37.5665, 126.978);
  }, [target]); // Marker/LatLng는 참조안정 가정, literal만 추적

  const xAnchor = 0.5;
  const yAnchor = 1;
  const offsetPx = 57; // 핀 머리 위로 띄우는 높이

  const handleView = (id: string) => onView?.(id);

  // ✅ 선택 1: onCreate에 인자 넘기지 않기 (타입이 () => void인 경우)
  const handleCreate = () => onCreate?.();

  // // ✅ 선택 2: onCreate?: (id?: string) => void 라면
  // const handleCreate = () => onCreate?.(propertyId ?? undefined);

  return (
    <CustomOverlay
      kakao={kakao} // typeof window.kakao | null
      map={map} // kakao.maps.Map | null
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
            />
            {/* 꼬리 */}
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
