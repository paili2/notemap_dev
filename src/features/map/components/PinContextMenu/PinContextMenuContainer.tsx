"use client";

import * as React from "react";
import ContextMenuPanel from "./components/ContextMenuPanel/ContextMenuPanel";
import CustomOverlay from "@/features/map/components/PinContextMenu/components/CustomOverlay/CustomOverlay";
import type { PinContextMenuProps } from "./types";

/**
 * 컨텍스트 메뉴 컨테이너
 * - position: kakao.maps.Marker | kakao.maps.LatLng | {lat,lng} 모두 허용
 * - 상태 판별 규칙
 *   - draft: pin.state === "draft" 이거나 propertyId 없음/"__draft__"
 *   - plan (답사예정): pin.kind === "question" 이거나 propertyId가 "__visit__*" (레거시 호환)
 *   - listed: draft/plan이 아니면서 propertyId가 유효
 * - 즐겨찾기 버튼은 listed 핀에서만 노출
 * - plan 핀에서는 "답사예정지 등록" 액션을 노출 (상세보기 대체)
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
  onAddFav,
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

  /** ---------------------------
   *  상태 기반 판별 (PinKind/PinState + 레거시 호환)
   * -------------------------- */
  const legacyDraft = !propertyId || propertyId === "__draft__";
  const legacyVisit =
    !!propertyId && String(propertyId).startsWith("__visit__");

  // draft: state === 'draft' 이거나 아직 id 없음/__draft__
  const isDraftPin = pin?.state === "draft" || legacyDraft;

  // plan(답사예정): kind === 'question' 이거나 레거시 __visit__*
  const isPlanPin = pin?.kind === "question" || legacyVisit;

  // listed: draft/plan 아님 && propertyId 존재
  const isListedPin = !isDraftPin && !isPlanPin && !!propertyId;

  // 즐겨찾기 상태는 listed 핀에서만 의미 있음
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
              /** 컨테이너에서 상태 불리언 확정 후 전달 */
              isDraftPin={isDraftPin}
              isPlanPin={isPlanPin}
              /** ✅ 즐겨찾기 버튼은 매물 등록된 핀에서만 노출 */
              showFav={isListedPin}
              onAddFav={onAddFav}
              favActive={favActive}
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
