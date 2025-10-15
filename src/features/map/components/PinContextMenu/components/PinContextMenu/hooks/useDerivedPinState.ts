import { useMemo } from "react";

export function useDerivedPinState(args: {
  propertyId?: string | null;
  pin?: { kind?: string; isFav?: boolean } | null;
  isPlanPinFromParent?: boolean;
  isVisitReservedFromParent?: boolean;
}) {
  const { propertyId, pin, isPlanPinFromParent, isVisitReservedFromParent } =
    args;

  return useMemo(() => {
    const legacyDraft = !propertyId || propertyId === "__draft__";
    const planned =
      (typeof isPlanPinFromParent === "boolean"
        ? isPlanPinFromParent
        : pin?.kind === "question" || (pin as any)?.visit?.planned === true) ||
      false;

    const reservedRaw = Boolean(isVisitReservedFromParent);
    const reserved = !planned && reservedRaw;

    const draft = !planned && !reserved && legacyDraft;
    const listed = !draft && !planned && !reserved && !!propertyId;
    const favActive = listed ? !!pin?.isFav : false;

    return { reserved, planned, draft, listed, favActive };
  }, [propertyId, pin, isPlanPinFromParent, isVisitReservedFromParent]);
}
