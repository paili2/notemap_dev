import { useMemo } from "react";

export function useDerivedPinState(args: {
  propertyId?: string | null;
  pin?: {
    id?: string | number;
    kind?: string;
    isFav?: boolean;
    [k: string]: any;
  } | null;
  isPlanPinFromParent?: boolean;
  isVisitReservedFromParent?: boolean;
}) {
  const { propertyId, pin, isPlanPinFromParent, isVisitReservedFromParent } =
    args;

  return useMemo(() => {
    const hasId =
      typeof propertyId === "string" && propertyId.trim().length > 0;
    const legacyDraft = !hasId || propertyId === "__draft__";

    const visit = (pin as any)?.visit;

    // ✅ 예약 핀 판정
    const reservedRaw =
      isVisitReservedFromParent === true ||
      // id 패턴이 "__visit_" 으로 시작하는 경우 예약핀으로 판단
      (typeof pin?.id === "string" && pin.id.startsWith("__visit_")) ||
      visit?.reserved === true ||
      (pin as any)?.reserved === true ||
      (pin as any)?.reservationId ||
      (pin as any)?.surveyReservationId ||
      pin?.kind === "reserved" ||
      pin?.kind === "reservation" ||
      (pin as any)?.badge === "reserved";

    // ✅ 답사예정(임시 draft) 핀 판정
    const plannedRaw =
      isPlanPinFromParent === true ||
      (!reservedRaw &&
        (visit?.planned === true ||
          pin?.kind === "question" ||
          pin?.kind === "planned" ||
          (pin as any)?.planned === true));

    // ✅ 최종 우선순위: 예약 > 예정 > 드래프트 > 등록됨
    const reserved = Boolean(reservedRaw);
    const planned = !reserved && Boolean(plannedRaw);
    const draft = !reserved && !planned && legacyDraft;
    const listed = !reserved && !planned && !draft && hasId;

    const favActive = listed ? !!pin?.isFav : false;

    return { reserved, planned, draft, listed, favActive };
  }, [propertyId, pin, isPlanPinFromParent, isVisitReservedFromParent]);
}
