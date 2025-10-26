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

/** YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD / YYYYMMDD → YYYY-MM-DD, 실패 시 null */
const toIsoDate = (v: any): string | null => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})[.\-\/]?(\d{2})[.\-\/]?(\d{2})$/);
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}`;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : iso;
};

/** 숫자 캐스팅 후 유한수면 반환, 아니면 undefined */
const toFinite = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const resolveAddressLine = (
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
  // ── 연락처 폴백 정리 (office* → contact*) ────────────────────────────
  const mainLabelRaw =
    (payload as any)?.contactMainLabel ?? (payload as any)?.officeName;
  const mainPhoneRaw =
    (payload as any)?.contactMainPhone ?? (payload as any)?.officePhone;

  const subLabelRaw =
    (payload as any)?.contactSubLabel ??
    (payload as any)?.officeName ??
    "사무실";
  const subPhoneRaw =
    (payload as any)?.contactSubPhone ?? (payload as any)?.officePhone2;

  const dto: any = {
    lat: Number(pos.lat),
    lng: Number(pos.lng),
    addressLine: resolveAddressLine(payload, pos, prefill),

    // ✅ 메인 연락처(없으면 기본값)
    contactMainLabel: sanitizeLabel(mainLabelRaw || "문의"),
    contactMainPhone: sanitizePhone(mainPhoneRaw || "010-0000-0000"),

    hasElevator: !!(payload as any)?.hasElevator,
    isOld: !!(payload as any)?.isOld,
    isNew: !!(payload as any)?.isNew,
  };

  // 서브 연락처: 전화가 있을 때만 포함(라벨 없으면 "사무실" 기본)
  if (toStr(subPhoneRaw).trim()) {
    Object.assign(dto, {
      contactSubLabel: sanitizeLabel(subLabelRaw || "사무실"),
      contactSubPhone: sanitizePhone(subPhoneRaw),
    });
  }

  // ── UI → DTO 키 보강 매핑 ────────────────────────────────────────────
  const registryRaw = (payload as any)?.registryOne; // (구버전) 선택값/ID
  const parkingTypeIdRaw = (payload as any)?.parkingTypeId; // ✅ 신버전: 주차 유형 ID
  const parkingTypeRaw = (payload as any)?.parkingType; // (구버전) 라벨/ID 혼재
  const parkingCountRaw = (payload as any)?.parkingCount;

  // 등기(등록유형) — 숫자/문자 모두 허용 → 숫자로 캐스팅
  if (
    registryRaw !== undefined &&
    registryRaw !== null &&
    `${registryRaw}`.trim() !== ""
  ) {
    const n = Number(registryRaw);
    dto.registrationTypeId = Number.isFinite(n) ? n : registryRaw;
  }

  // ✅ parkingTypeId 우선 적용 (문자 "1"도 숫자로 변환해서 세팅)
  if (
    parkingTypeIdRaw !== undefined &&
    parkingTypeIdRaw !== null &&
    `${parkingTypeIdRaw}`.trim() !== ""
  ) {
    const n = Number(parkingTypeIdRaw);
    if (Number.isFinite(n)) dto.parkingTypeId = n;
  } else if (
    parkingTypeRaw !== undefined &&
    parkingTypeRaw !== null &&
    `${parkingTypeRaw}`.trim() !== ""
  ) {
    // 보조: 구버전이 숫자일 때만 채택 (라벨 문자열이면 무시)
    const n = Number(parkingTypeRaw);
    if (Number.isFinite(n)) dto.parkingTypeId = n;
  }

  // 주차 대수
  {
    const n = toFinite(parkingCountRaw);
    if (n !== undefined) dto.totalParkingSlots = n;
  }

  // ─────────────────────────────────────────────────────────────────────

  // ✅ name: 없으면 title → name 폴백 (서버가 '임시 매물'로 채우는 걸 방지)
  const rawName = toStr(
    (payload as any)?.name || (payload as any)?.title
  ).trim();
  if (rawName) {
    dto.name = clip(rawName, 100);
  }

  // ✅ completionDate: 유효할 때만 포함(미입력/무효면 전송 생략)
  const normalizedDate = toIsoDate((payload as any)?.completionDate);

  Object.assign(
    dto,
    // enum/선택값은 공백이면 아예 미포함
    toStr((payload as any)?.badge).trim()
      ? { badge: toStr((payload as any)?.badge).trim() }
      : {},
    normalizedDate ? { completionDate: normalizedDate } : {},
    (payload as any)?.buildingType
      ? { buildingType: (payload as any).buildingType }
      : {},
    (() => {
      const n = toFinite((payload as any)?.totalHouseholds);
      return n !== undefined ? { totalHouseholds: n } : {};
    })(),
    (() => {
      const n = toFinite((payload as any)?.totalParkingSlots);
      return n !== undefined ? { totalParkingSlots: n } : {};
    })(),
    (() => {
      const n = toFinite((payload as any)?.registrationTypeId);
      return n !== undefined ? { registrationTypeId: n } : {};
    })(),
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
    // privateMemo 우선, 없으면 secretMemo 폴백
    (() => {
      const priv = toStr((payload as any)?.privateMemo).trim();
      const sec = toStr((payload as any)?.secretMemo).trim();
      const val = priv || sec;
      return val ? { privateMemo: sanitizeText(val) } : {};
    })()
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
        rooms: toFinite(u?.rooms) ?? 0,
        baths: toFinite(u?.baths) ?? 0,
        hasLoft: !!u?.hasLoft,
        hasTerrace: !!u?.hasTerrace,
        minPrice: toFinite(u?.minPrice) ?? 0,
        maxPrice: toFinite(u?.maxPrice) ?? 0,
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
