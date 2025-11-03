import { PropertyViewDetails } from "../../components/PropertyViewModal/types";
import { OrientationRow, OrientationValue } from "../../types/property-domain";
import { mapBadgeToPinKind } from "../badge";

/** 서버 핀 상세 타입 */
export type ApiPin = {
  id: string | number;
  lat: number;
  lng: number;
  name?: string | null;
  badge?: string | null;
  addressLine?: string | null;
  completionDate?: string | null;

  buildingType?: "APT" | "OP" | "주택" | "근생" | string | null;

  /** ✅ 숫자 필드들 */
  totalBuildings?: number | null;
  totalFloors?: number | null;
  totalHouseholds?: number | null;
  remainingHouseholds?: number | null;
  totalParkingSlots?: number | null;
  parkingTypeId?: number | null;

  slopeGrade?: string | null;
  structureGrade?: string | null;

  /** ✅ 매물평점 (서버 문자열 "1"~"5" 또는 null) */
  parkingGrade?: string | null;
  hasElevator?: boolean | null;

  /** ✅ 연락처(서버 → 뷰) */
  contactMainLabel?: string | null;
  contactMainPhone?: string | null;
  contactSubLabel?: string | null;
  contactSubPhone?: string | null;

  /** ✅ 금액(서버 → 뷰) */
  minRealMoveInCost?: number | null; // 최저 실입(정수)

  /** ✅ 메모(서버 → 뷰) */
  publicMemo?: string | null;
  privateMemo?: string | null;

  options?: {
    hasAircon?: boolean | null;
    hasFridge?: boolean | null;
    hasWasher?: boolean | null;
    hasDryer?: boolean | null;
    hasBidet?: boolean | null;
    hasAirPurifier?: boolean | null;
    isDirectLease?: boolean | null;
    extraOptionsText?: string | null;
  } | null;

  /** 서버 directions 그대로 수용 */
  directions?: Array<{ direction?: string | null }> | null;

  areaGroups?: Array<{
    title?: string | null;
    exclusiveMinM2?: number | null;
    exclusiveMaxM2?: number | null;
    actualMinM2?: number | null;
    actualMaxM2?: number | null;
    sortOrder?: number | null;
  }> | null;

  units?: Array<{
    rooms?: number | null;
    baths?: number | null;
    hasLoft?: boolean | null;
    hasTerrace?: boolean | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    note?: string | null;
  }> | null;
};

/* ───────────── 유틸 ───────────── */
const toStr = (v: unknown) =>
  typeof v === "string" ? v : v == null ? "" : String(v);

const toYmd = (s?: string | null) =>
  typeof s === "string" && s.length >= 10 ? s.slice(0, 10) : undefined;

function toOrientationRows(
  dirs?: ApiPin["directions"]
): OrientationRow[] | undefined {
  if (!Array.isArray(dirs) || dirs.length === 0) return undefined;
  // ✅ 중복/순서 보존
  const raw = dirs.map((d) => toStr(d?.direction).trim()).filter(Boolean);
  return raw.map((dir, i) => ({
    ho: i + 1,
    value: dir as unknown as OrientationValue,
  }));
}

function boolToOX(b?: boolean | null): "O" | "X" | undefined {
  if (b === true) return "O";
  if (b === false) return "X";
  return undefined;
}

/** buildingType → 라벨 */
const BUILDING_TYPE_LABEL: Record<string, string> = {
  APT: "아파트",
  OP: "오피스텔",
  주택: "주택",
  근생: "근생",
};

/** 주차유형 라벨 */
const PARKING_TYPE_LABEL: Record<number, string> = {
  1: "병렬",
  2: "직렬",
  3: "기계식",
  4: "EV",
};
const mapParkingType = (id?: number | null): string | undefined =>
  id != null && PARKING_TYPE_LABEL[id] ? PARKING_TYPE_LABEL[id] : undefined;

/** "상/중/하" → Grade 유니온 */
function toGrade(g?: string | null) {
  const v = (g ?? "").trim();
  return v === "상" || v === "중" || v === "하" ? (v as any) : undefined;
}

/** 옵션 → 라벨 배열 */
function toOptionLabels(o?: ApiPin["options"]): string[] | undefined {
  if (!o) return undefined;
  const labels: string[] = [];
  if (o.hasAircon) labels.push("에어컨");
  if (o.hasFridge) labels.push("냉장고");
  if (o.hasWasher) labels.push("세탁기");
  if (o.hasDryer) labels.push("건조기");
  if (o.hasBidet) labels.push("비데");
  if (o.hasAirPurifier) labels.push("공기순환기");
  return labels.length ? labels : undefined;
}

/** 숫자 범위 → 'a ~ b' */
function fmtRange(
  min?: number | null,
  max?: number | null
): string | undefined {
  const a = typeof min === "number" && Number.isFinite(min) ? min : undefined;
  const b = typeof max === "number" && Number.isFinite(max) ? max : undefined;
  if (a == null && b == null) return undefined;
  if (a != null && b != null) return `${a} ~ ${b}`;
  return `${a ?? b}`;
}

/** areaGroups → 뷰 요약 */
function mapAreaGroups(api: ApiPin) {
  const groups = Array.isArray(api.areaGroups) ? api.areaGroups.slice() : [];
  if (!groups.length) {
    return {
      baseAreaTitle: undefined,
      extraAreaTitles: undefined as string[] | undefined,
      exclusiveArea: undefined,
      realArea: undefined,
      extraExclusiveAreas: undefined as string[] | undefined,
      extraRealAreas: undefined as string[] | undefined,
    };
  }
  groups.sort(
    (a, b) =>
      (a.sortOrder ?? Number.MAX_SAFE_INTEGER) -
      (b.sortOrder ?? Number.MAX_SAFE_INTEGER)
  );
  const first = groups[0];
  const rest = groups.slice(1);

  return {
    baseAreaTitle: (first.title ?? undefined) as string | undefined,
    extraAreaTitles:
      rest.map((g) => (g.title ?? "").trim()).filter((t) => t) || undefined,
    exclusiveArea: fmtRange(
      first.exclusiveMinM2 ?? null,
      first.exclusiveMaxM2 ?? null
    ),
    realArea: fmtRange(first.actualMinM2 ?? null, first.actualMaxM2 ?? null),
    extraExclusiveAreas: rest
      .map((g) => fmtRange(g.exclusiveMinM2 ?? null, g.exclusiveMaxM2 ?? null))
      .filter(Boolean) as string[] | undefined,
    extraRealAreas: rest
      .map((g) => fmtRange(g.actualMinM2 ?? null, g.actualMaxM2 ?? null))
      .filter(Boolean) as string[] | undefined,
  };
}

/** 서버 "parkingGrade" 문자열 정규화 → ""|"1"|"2"|"3"|"4"|"5"|undefined */
function normalizeParkingGrade(s?: string | null) {
  const v = (s ?? "").trim();
  return v === "1" || v === "2" || v === "3" || v === "4" || v === "5"
    ? v
    : v === ""
    ? ""
    : undefined;
}

/* ───────────── 메인 변환 함수 ───────────── */
export function toViewDetailsFromApi(
  api: ApiPin
): PropertyViewDetails & { lat: number; lng: number } {
  const orientations = toOrientationRows(api.directions);
  const area = mapAreaGroups(api);

  const registryLabel =
    BUILDING_TYPE_LABEL[String(api.buildingType ?? "")] ??
    api.buildingType ??
    undefined;

  // ⭐ parkingGrade/별점 변환
  const pg = normalizeParkingGrade(api.parkingGrade);
  const stars = pg ? Number(pg) : 0;

  // 주차 대수(표준/레거시 동시 세팅)
  const tps =
    typeof api.totalParkingSlots === "number" &&
    Number.isFinite(api.totalParkingSlots)
      ? api.totalParkingSlots
      : undefined;

  const view: PropertyViewDetails = {
    id: String(api.id),

    /** ✅ 서버 badge → 핀 종류로 역매핑 (PinKind | undefined) */
    pinKind: mapBadgeToPinKind(api.badge),

    title: api.name ?? api.badge ?? undefined,
    address: api.addressLine ?? undefined,

    /** ✅ 연락처 매핑 */
    officePhone: api.contactMainPhone ?? undefined,
    officePhone2: api.contactSubPhone ?? undefined,

    /** ✅ 별점: 서버 문자열과 숫자 동시 보관 */
    parkingGrade: pg, // "1"~"5" | "" | undefined
    listingStars: stars,

    elevator: boolToOX(api.hasElevator),

    /** 준공/등기 */
    completionDate: toYmd(api.completionDate),
    registry: registryLabel as any,

    /** 숫자/주차 */
    totalBuildings: api.totalBuildings ?? undefined,
    totalFloors: api.totalFloors ?? undefined,
    totalHouseholds: api.totalHouseholds ?? undefined,
    remainingHouseholds: api.remainingHouseholds ?? undefined,

    /** ✅ 표준 키 직접 세팅 + 레거시 키 병행 세팅 */
    totalParkingSlots: tps ?? null,
    parkingCount: tps ?? undefined,

    parkingType: mapParkingType(api.parkingTypeId),

    /** 등급 */
    slopeGrade: toGrade(api.slopeGrade),
    structureGrade: toGrade(api.structureGrade),

    /** 방향 (순서/중복 그대로) */
    orientations,
    aspect1: orientations?.[0]?.value as OrientationValue | undefined,
    aspect2: orientations?.[1]?.value as OrientationValue | undefined,
    aspect3: orientations?.[2]?.value as OrientationValue | undefined,

    /** 옵션 */
    options: toOptionLabels(api.options),
    optionEtc: api.options?.extraOptionsText ?? undefined,

    /** 면적 요약 */
    baseAreaTitle: area.baseAreaTitle,
    extraAreaTitles: area.extraAreaTitles,
    exclusiveArea: area.exclusiveArea,
    realArea: area.realArea,
    extraExclusiveAreas: area.extraExclusiveAreas,
    extraRealAreas: area.extraRealAreas,

    /** ✅ 메모 매핑 */
    publicMemo: api.publicMemo ?? undefined,
    secretMemo: api.privateMemo ?? undefined,

    /** ✅ 최저 실입(정수 금액) */
    minRealMoveInCost: api.minRealMoveInCost ?? undefined,

    /** 초기화(미디어/기타) */
    images: [],
    imageCards: [],
    fileItems: [],
    unitLines: undefined,

    /** 레거시 금액은 뷰에 표시하지 않음 */
    salePrice: undefined,

    type: undefined,
    createdByName: undefined,
    createdAt: undefined,
    inspectedByName: undefined,
    inspectedAt: undefined,
    updatedByName: undefined,
    updatedAt: undefined,
  };

  return { ...view, lat: api.lat, lng: api.lng };
}
