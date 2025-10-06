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
 *   - plan (답사예정): 부모 플래그 우선, 없으면 pin.kind === "question" (필요 시 visit.planned 보조)
 *   - reserved (답사지예약 완료): 🔒 부모 플래그만 신뢰(사이드바 예약 목록에 존재)
 *   - listed: draft/plan/reserved이 아니면서 propertyId가 유효
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

  // ⬇ (옵션) 부모에서 명시 플래그를 내려줄 수도 있음
  isPlanPin: isPlanPinFromParent,
  isVisitReservedPin: isVisitReservedFromParent,
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

    // 우선순위: 도로명 > 지번 > 매물명 > "lat,lng"
    const primaryAddress =
      roadAddress?.trim() ||
      jibunAddress?.trim() ||
      propertyTitle?.trim() ||
      `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    onPlan?.({
      lat,
      lng,
      address: primaryAddress,
      roadAddress: roadAddress ?? null,
      jibunAddress: jibunAddress ?? null,
      propertyId: propertyId ?? null,
      propertyTitle: propertyTitle ?? null,
      dateISO: new Date().toISOString().slice(0, 10),
    });
  }, [onPlan, position, roadAddress, jibunAddress, propertyId, propertyTitle]);

  /** ---------------------------
   *  상태 기반 판별 (부모 플래그 우선, 추정 제거)
   * -------------------------- */
  const legacyDraft = !propertyId || propertyId === "__draft__";

  // 1) 예정: 부모 플래그 우선 → 없으면 kind === "question" (필요 시 visit.planned 보조)
  const planned =
    (typeof isPlanPinFromParent === "boolean"
      ? isPlanPinFromParent
      : pin?.kind === "question" || (pin as any)?.visit?.planned === true) ||
    false;

  // 2) 예약(raw): 🔒 오직 부모 플래그만 신뢰 (사이드바에 실제로 추가된 경우만 true)
  const reservedRaw = Boolean(isVisitReservedFromParent);

  // 3) 최종 예약: 예정이 아닐 때만 예약 인정
  const reserved = !planned && reservedRaw;

  // 4) 드래프트: 예정/예약이 모두 아닐 때만
  const draft =
    !planned && !reserved && (pin?.state === "draft" || legacyDraft);

  // 5) listed: draft/plan/reserved이 아니고 id가 유효
  const listed = !draft && !planned && !reserved && !!propertyId;

  const favActive = listed ? !!pin?.isFav : false;

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
              isDraftPin={draft}
              isPlanPin={planned}
              isVisitReservedPin={reserved}
              /** ✅ 즐겨찾기 버튼은 매물 등록된 핀에서만 노출 */
              showFav={listed}
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
