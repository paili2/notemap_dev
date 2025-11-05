// src/features/properties/components/PropertyEditModal/lib/buildUpdatePayload.ts
"use client";

import type { UpdatePayload } from "@/features/properties/types/property-dto";
import type {
  Registry,
  Grade,
  UnitLine,
  OrientationRow,
} from "@/features/properties/types/property-domain";
import type { ImageItem } from "@/features/properties/types/media";
import type { AreaSet } from "../../sections/AreaSetsSection/types";
import type { PinKind } from "@/features/pins/types";

/* ───────── 기본 유틸 ───────── */
const toIntOrNull = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const toNumericStringOrUndefined = (v: string | number | null | undefined) => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

const toParkingGradeOrUndefined = (
  v: "" | "1" | "2" | "3" | "4" | "5" | null | undefined
): "1" | "2" | "3" | "4" | "5" | undefined => {
  if (!v) return undefined;
  return (["1", "2", "3", "4", "5"] as const).includes(v as any)
    ? (v as any)
    : undefined;
};

const defined = (v: unknown) => v !== undefined;

/* ───────── 비교용 정규화 ───────── */
/** 비교 전에 공통 정규화: "", null, undefined → undefined / [] → undefined */
const normalizeShallow = (v: any) => {
  if (v === "" || v === null || v === undefined) return undefined;
  if (Array.isArray(v) && v.length === 0) return undefined;
  return v;
};

const jsonEq = (a: any, b: any) => {
  const na = normalizeShallow(a);
  const nb = normalizeShallow(b);
  if (na === nb) return true;
  if (!na || !nb || typeof na !== "object" || typeof nb !== "object")
    return false;
  try {
    return JSON.stringify(na) === JSON.stringify(nb);
  } catch {
    return false;
  }
};

/* ───────── unitLines 정규화/비교(타입 안전) ───────── */
type UnitLike = Partial<UnitLine> & {
  rooms?: number | null;
  baths?: number | null;
  hasLoft?: boolean; // 대체키 대비
  loft?: boolean;
  hasTerrace?: boolean;
  terrace?: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
  note?: string | null;
};

const pickBool = (u: any, ...keys: string[]) => {
  for (const k of keys) {
    const v = u?.[k];
    if (typeof v === "boolean") return v;
    if (v === 1 || v === "1") return true;
    if (v === 0 || v === "0") return false;
  }
  return false;
};

const pick = <T>(u: any, ...keys: string[]) => {
  for (const k of keys) {
    if (u?.[k] !== undefined) return u[k] as T;
  }
  return undefined as unknown as T;
};

const normalizeUnit = (u?: UnitLike) => {
  const uu: any = u ?? {};
  return {
    rooms: pick<number | null>(uu, "rooms") ?? null,
    baths: pick<number | null>(uu, "baths") ?? null,
    hasLoft: pickBool(uu, "hasLoft", "loft"),
    hasTerrace: pickBool(uu, "hasTerrace", "terrace"),
    minPrice: pick<number | null>(uu, "minPrice") ?? null,
    maxPrice: pick<number | null>(uu, "maxPrice") ?? null,
    note: pick<string | null>(uu, "note") ?? null,
  };
};

const sameUnit = (a?: UnitLike, b?: UnitLike) => {
  const A = normalizeUnit(a);
  const B = normalizeUnit(b);
  return (
    A.rooms === B.rooms &&
    A.baths === B.baths &&
    A.hasLoft === B.hasLoft &&
    A.hasTerrace === B.hasTerrace &&
    A.minPrice === B.minPrice &&
    A.maxPrice === B.maxPrice &&
    A.note === B.note
  );
};

const unitLinesChanged = (prev?: UnitLine[], curr?: UnitLine[]) => {
  const P = Array.isArray(prev) ? prev : undefined;
  const C = Array.isArray(curr) ? curr : undefined;
  if (!P && !C) return false;
  if (!P || !C) return true;
  if (P.length !== C.length) return true;
  for (let i = 0; i < P.length; i++) if (!sameUnit(P[i], C[i])) return true;
  return false;
};

/* ───────── 입력 타입 ───────── */
type BuildUpdateArgs = {
  // 기본
  title?: string;
  address?: string;
  officeName?: string;
  officePhone?: string;
  officePhone2?: string;
  moveIn?: string;
  floor?: string;
  roomNo?: string;
  structure?: string;

  // 평점/주차/준공/매매
  parkingGrade?: "" | "1" | "2" | "3" | "4" | "5";
  parkingType?: string | null;
  totalParkingSlots?: number | string | null;
  completionDate?: string;
  salePrice?: string | number | null;

  // 면적
  baseAreaSet?: AreaSet;
  extraAreaSets?: AreaSet[];
  exclusiveArea?: string;
  realArea?: string;
  extraExclusiveAreas?: string[];
  extraRealAreas?: string[];
  baseAreaTitleOut?: string;
  extraAreaTitlesOut?: string[];

  // 등기/등급/엘리베이터
  elevator?: "O" | "X";
  registryOne?: Registry;
  slopeGrade?: Grade;
  structureGrade?: Grade;

  // 숫자
  totalBuildings?: string | number;
  totalFloors?: string | number;
  totalHouseholds?: string | number;
  remainingHouseholds?: string | number;

  // 옵션/메모
  options?: string[];
  etcChecked?: boolean;
  optionEtc?: string;
  publicMemo?: string | null;
  secretMemo?: string | null;

  // 향/유닛
  orientations?:
    | OrientationRow[]
    | Array<{
        dir?: string;
        weight?: number | null;
        ho?: string | number | null;
        value?: number | null;
      }>;
  aspect?: string;
  aspectNo?: number;
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;
  unitLines?: UnitLine[]; // ✅ 묶음 대상

  // 이미지
  imageFolders?: ImageItem[][];
  verticalImages?: ImageItem[];

  // 기타
  pinKind?: PinKind;
};

/** 초기 스냅샷: 자유 키 접근 허용(레거시 키 호환) */
type InitialSnapshot = Partial<BuildUpdateArgs> & { [key: string]: any };

/* ───────── 메인 ───────── */
export function buildUpdatePayload(
  a: BuildUpdateArgs,
  initial?: InitialSnapshot
): UpdatePayload {
  /* 이미지 URL 평면화 + 중복 제거 */
  const urls: string[] = [];
  const pushUrl = (u?: string) => {
    if (typeof u !== "string") return;
    const s = u.trim();
    if (s && !urls.includes(s)) urls.push(s);
  };
  if (Array.isArray(a.imageFolders)) {
    for (const g of a.imageFolders)
      for (const img of g ?? []) pushUrl(img?.url);
  }
  if (Array.isArray(a.verticalImages)) {
    for (const img of a.verticalImages) pushUrl(img?.url);
  }

  const optionEtcFinal = a.etcChecked
    ? (a.optionEtc ?? "").trim()
    : a.optionEtc ?? "";

  const normalizedTotalParkingSlots = defined(a.totalParkingSlots)
    ? toIntOrNull(a.totalParkingSlots)
    : undefined;

  // orientations 정규화
  let orientationsNormalized: OrientationRow[] | undefined;
  if (Array.isArray(a.orientations)) {
    orientationsNormalized = a.orientations.map((o: any) =>
      "ho" in o || "value" in o
        ? ({ ho: o.ho ?? null, value: o.value ?? null } as OrientationRow)
        : ({
            ho: o.ho ?? null,
            value: o.value ?? o.weight ?? null,
          } as OrientationRow)
    );
  }

  const salePriceStr = toNumericStringOrUndefined(a.salePrice);
  const parkingGradeVal = toParkingGradeOrUndefined(
    a.parkingGrade ?? undefined
  );

  const patch: UpdatePayload = {};
  const put = (key: keyof UpdatePayload, next: any, prev?: any) => {
    const nNext = normalizeShallow(next);
    const nPrev = normalizeShallow(prev);
    if (!defined(nNext)) return;
    if (initial === undefined) {
      (patch as any)[key] = nNext; // 초기값 없으면 전달된 것만 포함
    } else if (!jsonEq(nPrev, nNext)) {
      (patch as any)[key] = nNext; // 변경된 경우에만 포함
    }
  };

  /* ===== 기본 ===== */
  put("title", a.title, initial?.title);
  put("address", a.address, initial?.address);
  put("officeName", a.officeName, initial?.officeName);
  put("officePhone", a.officePhone, initial?.officePhone);
  put("officePhone2", a.officePhone2, initial?.officePhone2);
  put("moveIn", a.moveIn, initial?.moveIn);
  put("floor", a.floor, initial?.floor);
  put("roomNo", a.roomNo, initial?.roomNo);
  put("structure", a.structure, initial?.structure);

  /* ===== 향/방향 ===== */
  put("aspect", a.aspect, initial?.aspect);
  put(
    "aspectNo",
    defined(a.aspectNo) ? String(a.aspectNo) : undefined,
    initial?.aspectNo
  );
  put("aspect1", a.aspect1, initial?.aspect1);
  put("aspect2", a.aspect2, initial?.aspect2);
  put("aspect3", a.aspect3, initial?.aspect3);
  put(
    "orientations",
    defined(a.orientations) ? orientationsNormalized ?? [] : undefined,
    initial?.orientations
  );

  /* ===== 가격/주차/준공 ===== */
  put(
    "salePrice",
    defined(a.salePrice) ? salePriceStr : undefined,
    initial?.salePrice
  );
  put(
    "parkingType",
    defined(a.parkingType) ? a.parkingType ?? undefined : undefined,
    initial?.parkingType
  );
  put(
    "totalParkingSlots",
    normalizedTotalParkingSlots,
    initial?.totalParkingSlots
  );
  put("completionDate", a.completionDate, initial?.completionDate);

  /* ===== 평점/엘리베이터 ===== */
  if (defined(a.parkingGrade) && parkingGradeVal !== undefined) {
    put("parkingGrade", parkingGradeVal, initial?.parkingGrade);
  }
  put("elevator", a.elevator, initial?.elevator);

  /* ===== 숫자 ===== */
  put("totalBuildings", a.totalBuildings, initial?.totalBuildings);
  put("totalFloors", a.totalFloors, initial?.totalFloors);
  put("totalHouseholds", a.totalHouseholds, initial?.totalHouseholds);
  put(
    "remainingHouseholds",
    a.remainingHouseholds,
    initial?.remainingHouseholds
  );

  /* ===== 등급/등기 ===== */
  put("slopeGrade", a.slopeGrade, initial?.slopeGrade);
  put("structureGrade", a.structureGrade, initial?.structureGrade);
  const prevRegistry =
    (initial as any)?.registryOne ?? (initial as any)?.registry;
  put("registry", a.registryOne, prevRegistry);

  /* ===== 옵션/메모 ===== */
  put("options", a.options, initial?.options);
  if (defined(a.optionEtc))
    put("optionEtc", optionEtcFinal, initial?.optionEtc);
  put("publicMemo", a.publicMemo, initial?.publicMemo);
  put("secretMemo", a.secretMemo, initial?.secretMemo);

  /* ===== 면적 ===== */
  put("exclusiveArea", a.exclusiveArea, initial?.exclusiveArea);
  put("realArea", a.realArea, initial?.realArea);
  put(
    "extraExclusiveAreas",
    a.extraExclusiveAreas,
    initial?.extraExclusiveAreas
  );
  put("extraRealAreas", a.extraRealAreas, initial?.extraRealAreas);

  /* ===== 유닛: 하나라도 다르면 전체 배열 전송 ===== */
  if (defined(a.unitLines)) {
    const prevUnits = (initial as any)?.unitLines as UnitLine[] | undefined;
    const currUnits = a.unitLines as UnitLine[] | undefined;
    if (initial === undefined || unitLinesChanged(prevUnits, currUnits)) {
      (patch as any).unitLines = currUnits ?? [];
    }
  }

  /* ===== 이미지(문자열 배열) ===== */
  if (urls.length) {
    const prevImages = (initial as any)?.images;
    if (initial === undefined || !jsonEq(prevImages, urls)) {
      (patch as any).images = urls;
    }
  }

  return patch;
}

export default buildUpdatePayload;
