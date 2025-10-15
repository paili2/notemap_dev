import type { CreatePayload } from "@/features/properties/types/property-dto";
import type { LatLng } from "@/lib/geo/types";
import {
  pruneNullishDeep,
  sanitizeAreaGroups,
  sanitizeDirections,
} from "./dtoUtils";

const toStr = (v: any) => (typeof v === "string" ? v : String(v ?? ""));
const clip = (s: string, max: number) => s.slice(0, max);
const sanitizeLabel = (v: any, max = 20) => clip(toStr(v).trim(), max);
const sanitizePhone = (v: any, max = 50) =>
  clip(
    toStr(v)
      .replace(/[^\d\-+() ]+/g, "")
      .trim(),
    max
  );
const sanitizeText = (v: any, max = 4000) => clip(toStr(v).trim(), max);

export const resolveAddressLine = (
  payload: CreatePayload,
  pos: LatLng,
  prefill?: string
) => {
  const a1 = toStr((payload as any)?.addressLine).trim();
  const a2 = toStr((payload as any)?.roadAddress).trim();
  const a3 = toStr((payload as any)?.jibunAddress).trim();
  const a4 = toStr(prefill).trim();
  return a1 || a2 || a3 || a4 || `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
};

export function buildCreateDto(
  payload: CreatePayload,
  pos: LatLng,
  prefill?: string
) {
  const dto: any = {
    lat: Number(pos.lat),
    lng: Number(pos.lng),
    addressLine: resolveAddressLine(payload, pos, prefill),

    contactMainLabel: sanitizeLabel(
      (payload as any)?.contactMainLabel || "문의"
    ),
    contactMainPhone: sanitizePhone(
      (payload as any)?.contactMainPhone || "010-0000-0000"
    ),

    hasElevator: !!(payload as any)?.hasElevator,
    isOld: !!(payload as any)?.isOld,
    isNew: !!(payload as any)?.isNew,
  };

  Object.assign(
    dto,
    toStr((payload as any)?.badge).trim()
      ? { badge: toStr((payload as any)?.badge).trim() }
      : {},
    toStr((payload as any)?.name).trim()
      ? { name: toStr((payload as any)?.name).trim() }
      : {},
    (payload as any)?.completionDate
      ? { completionDate: String((payload as any).completionDate).slice(0, 10) }
      : {},
    (payload as any)?.buildingType
      ? { buildingType: (payload as any).buildingType }
      : {},
    Number.isFinite((payload as any)?.totalHouseholds)
      ? { totalHouseholds: Number((payload as any).totalHouseholds) }
      : {},
    Number.isFinite((payload as any)?.totalParkingSlots)
      ? { totalParkingSlots: Number((payload as any).totalParkingSlots) }
      : {},
    Number.isFinite((payload as any)?.registrationTypeId)
      ? { registrationTypeId: Number((payload as any).registrationTypeId) }
      : {},
    Number.isFinite((payload as any)?.parkingTypeId)
      ? { parkingTypeId: Number((payload as any).parkingTypeId) }
      : {},
    (payload as any)?.parkingGrade
      ? { parkingGrade: (payload as any).parkingGrade }
      : {},
    (payload as any)?.slopeGrade
      ? { slopeGrade: (payload as any).slopeGrade }
      : {},
    (payload as any)?.structureGrade
      ? { structureGrade: (payload as any).structureGrade }
      : {},
    toStr((payload as any)?.publicMemo).trim()
      ? { publicMemo: sanitizeText((payload as any).publicMemo) }
      : {},
    toStr((payload as any)?.privateMemo).trim()
      ? { privateMemo: sanitizeText((payload as any).privateMemo) }
      : {},
    toStr((payload as any)?.contactSubLabel).trim()
      ? { contactSubLabel: sanitizeLabel((payload as any).contactSubLabel) }
      : {},
    toStr((payload as any)?.contactSubPhone).trim()
      ? { contactSubPhone: sanitizePhone((payload as any).contactSubPhone) }
      : {}
  );

  if ((payload as any)?.optionsTouched) {
    dto.options = {
      hasAircon: !!(payload as any)?.hasAircon,
      hasFridge: !!(payload as any)?.hasFridge,
      hasWasher: !!(payload as any)?.hasWasher,
      hasDryer: !!(payload as any)?.hasDryer,
      hasBidet: !!(payload as any)?.hasBidet,
      hasAirPurifier: !!(payload as any)?.hasAirPurifier,
      isDirectLease: !!(payload as any)?.isDirectLease,
      ...(toStr((payload as any)?.extraOptionsText).trim()
        ? { extraOptionsText: sanitizeText((payload as any).extraOptionsText) }
        : {}),
    };
  }

  if (Array.isArray((payload as any)?.units) && (payload as any).units.length) {
    const units = (payload as any).units
      .map((u: any) => ({
        rooms: Number.isFinite(u?.rooms) ? Number(u.rooms) : 0,
        baths: Number.isFinite(u?.baths) ? Number(u.baths) : 0,
        hasLoft: !!u?.hasLoft,
        hasTerrace: !!u?.hasTerrace,
        minPrice: Number.isFinite(u?.minPrice) ? Number(u.minPrice) : 0,
        maxPrice: Number.isFinite(u?.maxPrice) ? Number(u.maxPrice) : 0,
        ...(toStr(u?.note).trim() ? { note: sanitizeText(u.note) } : {}),
      }))
      .filter(
        (u: any) => (u.minPrice ?? 0) > 0 || (u.maxPrice ?? 0) > 0 || !!u.note
      );
    if (units.length) dto.units = units;
  }

  const directions = sanitizeDirections((payload as any)?.directions);
  if (directions) dto.directions = directions;

  const areaGroups = sanitizeAreaGroups((payload as any)?.areaGroups);
  if (areaGroups) dto.areaGroups = areaGroups;

  return pruneNullishDeep(dto);
}
