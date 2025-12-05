import { useMemo } from "react";

type AnyPin = {
  id?: string | number;
  kind?: string;
  isFav?: boolean;
  badge?: string;
  visit?: {
    planned?: boolean;
    reserved?: boolean;
    status?: string; // "before" | "scheduled" 등
    [k: string]: any;
  };
  // 다양한 백엔드/호환 필드들
  planned?: boolean;
  reserved?: boolean;
  reservationId?: string | number;
  surveyReservationId?: string | number;
  [k: string]: any;
};

export function useDerivedPinState(args: {
  propertyId?: string | null;
  pin?: AnyPin | null;
  isPlanPinFromParent?: boolean;
  isVisitReservedFromParent?: boolean;
}) {
  const { propertyId, pin, isPlanPinFromParent, isVisitReservedFromParent } =
    args;

  return useMemo(() => {
    // ── 기본 식별 ─────────────────────────────────────────────
    const hasId =
      typeof propertyId === "string" && propertyId.trim().length > 0;
    const isDraftClick = propertyId === "__draft__"; // 컨테이너의 신규 클릭 가드와 일관
    const legacyDraft = isDraftClick || !hasId;

    const visit = (pin as AnyPin | undefined)?.visit;

    // ── 예약 판단(강한 신호부터) ─────────────────────────────
    const reservedRaw =
      isVisitReservedFromParent === true || // 부모가 확정적으로 알려주면 최우선
      // id 패턴이 "__visit_" 으로 시작하면 예약핀으로 판단
      (typeof pin?.id === "string" && pin.id.startsWith("__visit_")) ||
      // visit.status가 scheduled면 예약
      (typeof visit?.status === "string" &&
        visit.status.toLowerCase() === "scheduled") ||
      visit?.reserved === true ||
      pin?.reserved === true ||
      pin?.reservationId != null ||
      pin?.surveyReservationId != null ||
      pin?.kind === "reserved" ||
      pin?.kind === "reservation" ||
      pin?.badge === "reserved";

    // ── 예정 판단(예약이 아닌 경우만) ────────────────────────
    const plannedRaw =
      !reservedRaw &&
      (isPlanPinFromParent === true || // 부모 플래그
        // visit.status가 before면 예정
        (typeof visit?.status === "string" &&
          visit.status.toLowerCase() === "before") ||
        visit?.planned === true ||
        pin?.planned === true ||
        // 기존 kind / 배지 표기 호환
        pin?.kind === "question" ||
        pin?.kind === "planned" ||
        pin?.badge === "planned");

    // ── 최종 우선순위: 예약 > 예정 > 드래프트 > 등록됨 ───────
    const reserved = Boolean(reservedRaw);
    const planned = !reserved && Boolean(plannedRaw);
    const draft = !reserved && !planned && legacyDraft;
    const listed = !reserved && !planned && !draft && hasId;

    // 등록된 매물에서만 즐겨찾기 활성 의미가 있음
    const favActive = listed ? !!pin?.isFav : false;

    return { reserved, planned, draft, listed, favActive };
  }, [propertyId, pin, isPlanPinFromParent, isVisitReservedFromParent]);
}
