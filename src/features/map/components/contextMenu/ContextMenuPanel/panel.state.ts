import type { PropertyId } from "./panel.types";
import {
  asBool,
  isDraftLikeId,
  mapDraftState,
  normalizeNullableString,
} from "./panel.utils";

/** 패널 상태 우선순위 결정: reserved > planned > draft > normal */
export function computePanelState(flags: {
  propertyId?: PropertyId | null;
  draftState?: string;
  isVisitReservedPin?: boolean;
  isPlanPin?: boolean;
}): "reserved" | "planned" | "draft" | "normal" {
  const { propertyId, draftState, isVisitReservedPin, isPlanPin } = flags;

  const idStr = String(propertyId ?? "").trim();
  const idLow = idStr.toLowerCase();

  const byState = mapDraftState(draftState);
  const reservedByState = byState.reserved;
  const plannedByState = byState.planned;

  const reservedByProp = asBool(isVisitReservedPin);
  const plannedByProp = asBool(isPlanPin);

  const reservedById =
    /(^|[_:. -])(visit|reserved|reserve|rsvd)([_:. -]|$)/i.test(idStr) ||
    idLow.startsWith("__visit__") ||
    idLow.startsWith("__reserved__");

  const plannedById =
    /(^|[_:. -])(plan|planned|planning|previsit)([_:. -]|$)/i.test(idStr) ||
    idLow.startsWith("__plan__") ||
    idLow.startsWith("__planned__");

  const reserved = reservedByState || reservedByProp || reservedById;
  const planned = !reserved && (plannedByState || plannedByProp || plannedById);

  const draftLike = isDraftLikeId(propertyId);
  const draft = !reserved && !planned && draftLike;

  if (reserved) return "reserved";
  if (planned) return "planned";
  if (draft) return "draft";
  return "normal";
}

/** 패널 헤더 타이틀 생성 규칙 */
export function computeHeaderTitle(args: {
  panelState: "reserved" | "planned" | "draft" | "normal";
  displayTitle?: string | null;
  propertyTitle?: string | null;
  roadAddress?: string | null;
  jibunAddress?: string | null;
}) {
  const { panelState, displayTitle, propertyTitle, roadAddress, jibunAddress } =
    args;

  if (panelState === "draft") return "선택 위치";

  const name =
    normalizeNullableString(displayTitle) ??
    normalizeNullableString(propertyTitle);

  if (name) return name;

  if (panelState === "reserved") return "답사지예약";

  if (panelState === "planned") {
    const addr =
      normalizeNullableString(roadAddress) ??
      normalizeNullableString(jibunAddress);
    if (addr) return addr;
    return "답사예정";
  }

  return "선택 위치";
}
