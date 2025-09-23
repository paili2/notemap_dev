"use client";

import * as React from "react";
import ContextMenuPanel from "./components/ContextMenuPanel/ContextMenuPanel";
import CustomOverlay from "@/features/map/components/PinContextMenu/components/CustomOverlay/CustomOverlay";
import type { PinContextMenuProps } from "./types";

/**
 * 컨텍스트 메뉴 컨테이너
 * - position: kakao.maps.Marker | kakao.maps.LatLng | {lat,lng} 모두 허용
 * - 답사예정핀(__visit__*)은 UI 상 plan 으로 취급하며 ❌ 즐겨찾기 버튼 미노출
 * - 매물 등록된 핀(= plan/visit 아님, propertyId 유효)에서만 즐겨찾기 버튼 노출
 */
export default function PinContextMenuContainer({
  kakao,
  map,
  position: target,
  roadAddress,
  jibunAddress,
  propertyId,
  propertyTitle,
  pin,
  onClose,
  onView,
  onCreate,
  onPlan,
  onToggleFav,
  zIndex = 10000,
}: PinContextMenuProps) {
  if (!kakao || !map || !target) return null;

  const isMarker = (v: any): v is kakao.maps.Marker =>
    !!v && typeof v.getPosition === "function";
  const isKakaoLatLng = (v: any): v is kakao.maps.LatLng =>
    !!v && typeof v.getLat === "function" && typeof v.getLng === "function";
  const isPlainLatLng = (v: any): v is { lat: number; lng: number } =>
    !!v && typeof v.lat === "number" && typeof v.lng === "number";

  // kakao.maps.LatLng 로 표준화
  const position = React.useMemo(() => {
    if (isMarker(target)) return target.getPosition();
    if (isKakaoLatLng(target)) return target;
    if (isPlainLatLng(target))
      return new kakao.maps.LatLng(target.lat, target.lng);
    return new kakao.maps.LatLng(37.5665, 126.978); // fallback: 시청
  }, [target, kakao?.maps?.LatLng]);

  const xAnchor = 0.5;
  const yAnchor = 1;
  const offsetPx = 57;

  const handleView = (id: string) => onView?.(id);
  const handleCreate = () => onCreate?.();

  const handlePlan = React.useCallback(() => {
    const lat = position.getLat();
    const lng = position.getLng();
    onPlan?.({ lat, lng });
  }, [onPlan, position]);

  // ✅ 방문(답사예정) 핀 감지: __visit__* 아이디
  const isVisit = !!propertyId && String(propertyId).startsWith("__visit__");

  // ✅ plan 판정: pin.kind === 'plan' 이거나 방문핀일 때 plan처럼 취급
  const isPlanPin = pin?.kind === "plan" || isVisit;

  // ✅ 매물 등록된 핀: plan/visit 이 아니고, propertyId가 정상인 경우
  const isListedPin = !isPlanPin && !!propertyId;

  // ✅ 즐겨찾기 상태는 listed 핀에서만 의미 있음
  const favActive = isListedPin ? !!pin?.isFav : false;

  return (
    <CustomOverlay
      kakao={kakao}
      map={map}
      position={position}
      xAnchor={xAnchor}
      yAnchor={yAnchor}
      zIndex={zIndex}
    >
      <div style={{ transform: `translateY(-${offsetPx}px)` }}>
        <div role="dialog" aria-modal="true">
          <div className="relative pointer-events-auto">
            <ContextMenuPanel
              roadAddress={roadAddress ?? undefined}
              jibunAddress={jibunAddress ?? undefined}
              propertyId={propertyId ?? undefined}
              propertyTitle={propertyTitle ?? undefined}
              onClose={onClose}
              onView={handleView}
              onCreate={handleCreate}
              onPlan={handlePlan}
              isPlanPin={isPlanPin}
              /** ✅ 즐겨찾기 버튼은 매물 등록된 핀에서만 노출 */
              showFav={isListedPin}
              favActive={favActive}
              onToggleFav={isListedPin ? onToggleFav : undefined}
            />

            {/* 꼬리(삼각형) */}
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
