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

/** 숫자 캐스팅 후 유한수면 반환, 아니면 undefined ("" → undefined, 0 유지) */
const toFinite = (v: any) => {
  const s = String(v ?? "").trim();
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

/** 정수 또는 null (빈문자/undefined → null) */
const toIntOrNull = (v: any): number | null => {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

/** 주소 폴백: 좌표 문자열은 표시용이며, 절대 역파싱해서 좌표로 쓰지 말 것 */
const resolveAddressLine = (
  payload: CreatePayload,
  pos: LatLng,
  prefill?: string
) => {
  const a1 = toStr((payload as any)?.addressLine).trim();
  const a2 = toStr((payload as any)?.roadAddress).trim();
  const a3 = toStr((payload as any)?.jibunAddress).trim();
  const a4 = toStr(prefill).trim();
  // ⛑ 표시 문자열에서도 toFixed 금지 (정밀도 보존)
  return a1 || a2 || a3 || a4 || `${pos.lat}, ${pos.lng}`;
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
    // ✅ 좌표는 원본 정밀도 그대로(수치형으로 전송)
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

  // 🔹 임시핀-매물 명시 매칭 (문자/숫자 모두 허용; 숫자면 number로)
  const rawDraftId = (payload as any)?.pinDraftId;
  if (
    rawDraftId !== undefined &&
    rawDraftId !== null &&
    `${rawDraftId}`.trim() !== ""
  ) {
    const n = Number(rawDraftId);
    dto.pinDraftId = Number.isFinite(n) ? n : `${rawDraftId}`.trim();
  }

  // 서브 연락처: 전화가 있을 때만 포함(라벨 없으면 "사무실" 기본)
  if (toStr(subPhoneRaw).trim()) {
    Object.assign(dto, {
      contactSubLabel: sanitizeLabel(subLabelRaw || "사무실"),
      contactSubPhone: sanitizePhone(subPhoneRaw),
    });
  }

  // ── UI → DTO 키 보강 매핑 ────────────────────────────────────────────
  const parkingTypeIdRaw = (payload as any)?.parkingTypeId; // 신버전
  const parkingTypeRaw = (payload as any)?.parkingType; // 구버전(라벨/ID 혼재)

  // ✅ registrationTypeId: 신필드 우선, 없으면 구버전(registryOne) 폴백
  const regFromNew = toFinite((payload as any)?.registrationTypeId);
  const regFromLegacy = (() => {
    const registryRaw = (payload as any)?.registryOne;
    if (
      registryRaw === undefined ||
      registryRaw === null ||
      `${registryRaw}`.trim() === ""
    )
      return undefined;
    const n = Number(registryRaw);
    return Number.isFinite(n) ? n : undefined; // 라벨 문자열이면 무시
  })();
  if (regFromNew !== undefined) dto.registrationTypeId = regFromNew;
  else if (regFromLegacy !== undefined) dto.registrationTypeId = regFromLegacy;

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
    const n = Number(parkingTypeRaw);
    if (Number.isFinite(n)) dto.parkingTypeId = n;
  }

  // ✅ name: 없으면 title → name 폴백 (서버의 '임시 매물' 기본값 방지)
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
      ? { badge: clip(toStr((payload as any)?.badge).trim(), 30) }
      : {},
    normalizedDate ? { completionDate: normalizedDate } : {},
    (payload as any)?.buildingType
      ? { buildingType: (payload as any).buildingType }
      : {},
    (() => {
      const n = toFinite((payload as any)?.totalHouseholds);
      return n !== undefined ? { totalHouseholds: n } : {};
    })(),
    // ✅ 총 주차대수: payload.totalParkingSlots만 사용 (0도 전송)
    (() => {
      const n = toFinite((payload as any)?.totalParkingSlots);
      return n !== undefined ? { totalParkingSlots: n } : {};
    })(),
    // ✅ 새 필드 3종
    (() => {
      const n = toFinite((payload as any)?.totalBuildings);
      return n !== undefined ? { totalBuildings: n } : {};
    })(),
    (() => {
      const n = toFinite((payload as any)?.totalFloors);
      return n !== undefined ? { totalFloors: n } : {};
    })(),
    (() => {
      const n = toFinite((payload as any)?.remainingHouseholds);
      return n !== undefined ? { remainingHouseholds: n } : {};
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

  /* ✅ options: 백엔드 스펙(CreatePinOptionsDto)에 맞춰 항상 포함
     - 없으면 false/빈 문자열 디폴트
     - payload.options가 있으면 우선 사용, 없으면 개별 루트 필드에서 폴백
  */
  const opts = (payload as any)?.options ?? {};
  const pickBool = (k: string) => !!(opts[k] ?? (payload as any)?.[k]);
  const extraText = toStr(
    opts.extraOptionsText ?? (payload as any)?.extraOptionsText
  ).trim();

  dto.options = {
    hasAircon: pickBool("hasAircon"),
    hasFridge: pickBool("hasFridge"),
    hasWasher: pickBool("hasWasher"),
    hasDryer: pickBool("hasDryer"),
    hasBidet: pickBool("hasBidet"),
    hasAirPurifier: pickBool("hasAirPurifier"),
    isDirectLease: pickBool("isDirectLease"),
    ...(extraText ? { extraOptionsText: sanitizeText(extraText, 255) } : {}),
  };

  // 방향/면적 그룹 정리
  const directions = sanitizeDirections((payload as any)?.directions);
  if (directions) dto.directions = directions;

  const areaGroups = sanitizeAreaGroups(
    (payload as any)?.areaSets ?? (payload as any)?.areaGroups
  );
  if (areaGroups) dto.areaGroups = areaGroups;

  /* ✅ units: payload.units 또는 unitLines → 서버 스펙으로 변환 */
  const rawUnits = (payload as any)?.units;
  const rawUnitLines = (payload as any)?.unitLines;

  if (Array.isArray(rawUnits) && rawUnits.length > 0) {
    // 이미 서버 스펙 형태로 온 경우(예: buildCreatePayload에서 생성)
    dto.units = rawUnits.map((u: any) => ({
      rooms: toIntOrNull(u.rooms),
      baths: toIntOrNull(u.baths),
      hasLoft: !!u.hasLoft,
      hasTerrace: !!u.hasTerrace,
      minPrice: toIntOrNull(u.minPrice),
      maxPrice: toIntOrNull(u.maxPrice),
    }));
  } else if (Array.isArray(rawUnitLines) && rawUnitLines.length > 0) {
    // UI 라인 -> 서버 스펙으로 매핑
    dto.units = rawUnitLines.map((u: any) => ({
      rooms: toIntOrNull(u.rooms),
      baths: toIntOrNull(u.baths),
      hasLoft: !!u.hasLoft,
      hasTerrace: !!u.hasTerrace,
      minPrice: toIntOrNull(u.minPrice),
      maxPrice: toIntOrNull(u.maxPrice),
    }));
  }

  // 빈 문자열 name은 제거 (이중 안전망)
  if (typeof dto.name === "string" && dto.name.trim().length === 0) {
    delete dto.name;
  }

  // null/undefined 깊은 제거 (0/""/false는 유지되어야 함)
  return pruneNullishDeep(dto);
}
