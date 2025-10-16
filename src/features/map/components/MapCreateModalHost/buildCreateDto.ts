import type { CreatePayload } from "@/features/properties/types/property-dto";
import type { LatLng } from "@/lib/geo/types";
import {
  pruneNullishDeep,
  sanitizeAreaGroups,
  sanitizeDirections,
} from "./dtoUtils";

/* ───────────── 문자열/클리닝 유틸 ───────────── */
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

/** YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD / YYYYMMDD → YYYY-MM-DD 로 정규화. 실패 시 null */
const toIsoDate = (v: any): string | null => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})[.\-\/]?(\d{2})[.\-\/]?(\d{2})$/);
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}`;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : iso;
};

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

  // completionDate: 유효할 때만 포함 (ex. "1" 같은 값은 제외)
  const normalizedDate = toIsoDate((payload as any)?.completionDate);

  Object.assign(
    dto,
    // enum/선택값은 공백이면 아예 미포함
    toStr((payload as any)?.badge).trim()
      ? { badge: toStr((payload as any)?.badge).trim() }
      : {},
    // name: 공백이면 미포함(서버의 @Length(1,…) 회피)
    toStr((payload as any)?.name).trim()
      ? { name: toStr((payload as any)?.name).trim() }
      : {},
    normalizedDate ? { completionDate: normalizedDate } : {},
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

  // 옵션 세트: 스위치 만졌을 때만 포함
  if ((payload as any)?.optionsTouched) {
    dto.options = {
      hasAircon: !!(payload as any)?.hasAircon,
      hasFridge: !!(payload as any)?.hasFridge,
      hasWasher: !!(payload as any)?.hasWasher,
      hasDryer: !!(payload as any)?.hasDryer,
      hasBidet: !!(payload as any)?.hasBidet,
      hasAirPurifier: !!(payload as any)?.hasAirPurifier,
      ...(toStr((payload as any)?.extraOptionsText).trim()
        ? { extraOptionsText: sanitizeText((payload as any).extraOptionsText) }
        : {}),
    };
  }

  // 유닛: 유효값이 있는 항목만 포함
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

  // 방향/면적 그룹 정리
  const directions = sanitizeDirections((payload as any)?.directions);
  if (directions) dto.directions = directions;

  const areaGroups = sanitizeAreaGroups((payload as any)?.areaGroups);
  if (areaGroups) dto.areaGroups = areaGroups;

  // 빈 문자열 name은 제거 (이중 안전망)
  if (typeof dto.name === "string" && dto.name.trim().length === 0) {
    delete dto.name;
  }

  // null/undefined 깊은 제거
  return pruneNullishDeep(dto);
}
