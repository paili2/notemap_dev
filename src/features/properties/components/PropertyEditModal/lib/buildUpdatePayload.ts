"use client";

import type { UpdatePayload } from "@/features/properties/types/property-dto";
import type {
  Grade,
  UnitLine,
  OrientationRow,
} from "@/features/properties/types/property-domain";
import type { ImageItem } from "@/features/properties/types/media";
import type { AreaSet } from "../../sections/AreaSetsSection/types";
import type { PinKind } from "@/features/pins/types";

/* ───────── UI 등기(용도) 타입 ───────── */
export type RegistryUi = "주택" | "APT" | "OP" | "도/생" | "근/생";

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

const deepEq = (a: any, b: any) => {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

/* ───────── unitLines 정규화/비교 ───────── */
type UnitLike = Partial<UnitLine> & {
  rooms?: number | null;
  baths?: number | null;
  hasLoft?: boolean;
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
  parkingTypeId?: number | string | null;
  totalParkingSlots?: number | string | null;
  completionDate?: string;
  salePrice?: string | number | null;

  // 면적 (단일값 + 범위)
  baseAreaSet?: AreaSet;
  extraAreaSets?: AreaSet[];
  exclusiveArea?: string;
  realArea?: string;
  extraExclusiveAreas?: string[];
  extraRealAreas?: string[];
  baseAreaTitleOut?: string;
  extraAreaTitlesOut?: string[];

  // 플랫 키(있으면 우선 사용)
  exclusiveAreaMin?: string | number | null;
  exclusiveAreaMax?: string | number | null;
  exclusiveAreaMinPy?: string | number | null;
  exclusiveAreaMaxPy?: string | number | null;
  realAreaMin?: string | number | null;
  realAreaMax?: string | number | null;
  realAreaMinPy?: string | number | null;
  realAreaMaxPy?: string | number | null;

  // 등기/등급/엘리베이터
  elevator?: "O" | "X";
  registry?: RegistryUi;
  registryOne?: RegistryUi;
  slopeGrade?: Grade;
  structureGrade?: Grade;

  // 숫자
  totalBuildings?: string | number | null;
  totalFloors?: string | number | null;
  totalHouseholds?: string | number | null;
  remainingHouseholds?: string | number | null;

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
  unitLines?: UnitLine[];

  imageFolders?: ImageItem[][];
  verticalImages?: ImageItem[];

  pinKind?: PinKind;

  buildingGrade?: "new" | "old";
};

/** 초기 스냅샷: 자유 키 접근 허용 */
type InitialSnapshot = Partial<BuildUpdateArgs> & { [key: string]: any };

/* ───────── 메인 ───────── */
export function buildUpdatePayload(
  a: BuildUpdateArgs,
  initial?: InitialSnapshot
): UpdatePayload {
  /* 이미지 URL 수집 */
  const urlsHorizontal: string[] = [];
  const urlsVertical: string[] = [];
  const pushUrl = (into: string[], u?: string) => {
    if (typeof u !== "string") return;
    const s = u.trim();
    if (s && !into.includes(s)) into.push(s);
  };

  if (Array.isArray(a.imageFolders)) {
    for (const g of a.imageFolders)
      for (const img of g ?? []) pushUrl(urlsHorizontal, img?.url);
  }
  if (Array.isArray(a.verticalImages)) {
    for (const img of a.verticalImages) pushUrl(urlsVertical, img?.url);
  }

  const optionEtcFinal = a.etcChecked
    ? (a.optionEtc ?? "").trim()
    : a.optionEtc ?? "";

  // 숫자 필드
  const totalBuildingsN = defined(a.totalBuildings)
    ? toIntOrNull(a.totalBuildings)
    : undefined;
  const totalFloorsN = defined(a.totalFloors)
    ? toIntOrNull(a.totalFloors)
    : undefined;
  const totalHouseholdsN = defined(a.totalHouseholds)
    ? toIntOrNull(a.totalHouseholds)
    : undefined;
  const remainingHouseholdsN = defined(a.remainingHouseholds)
    ? toIntOrNull(a.remainingHouseholds)
    : undefined;

  const totalParkingSlotsN = defined(a.totalParkingSlots)
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

  const patch: UpdatePayload = {} as UpdatePayload;

  // put helpers
  const put = (key: keyof UpdatePayload, next: any, prev?: any) => {
    const nNext = normalizeShallow(next);
    const nPrev = normalizeShallow(prev);
    if (!defined(nNext)) return;
    if (initial === undefined) (patch as any)[key] = nNext;
    else if (!jsonEq(nPrev, nNext)) (patch as any)[key] = nNext;
  };

  const putAllowNull = (key: keyof UpdatePayload, next: any, prev?: any) => {
    if (next === undefined) return;
    if (initial === undefined) (patch as any)[key] = next;
    else if (!deepEq(prev, next)) (patch as any)[key] = next;
  };

  const putKeepEmptyArray = (
    key: keyof UpdatePayload,
    next: any[] | undefined,
    prev?: any[] | undefined
  ) => {
    if (next === undefined) return;
    if (initial === undefined) (patch as any)[key] = next;
    else if (!deepEq(prev, next)) (patch as any)[key] = next;
  };

  const putAny = (key: string, next: any, prev?: any) => {
    const nNext = normalizeShallow(next);
    const nPrev = normalizeShallow(prev);
    if (!defined(nNext)) return;
    if (initial === undefined) (patch as any)[key] = nNext;
    else if (!jsonEq(nPrev, nNext)) (patch as any)[key] = nNext;
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

  const prevAspectNoStr =
    initial?.aspectNo == null ? undefined : String(initial!.aspectNo as any);

  put(
    "aspectNo",
    defined(a.aspectNo) ? String(a.aspectNo) : undefined,
    prevAspectNoStr
  );

  put("aspect1", a.aspect1, initial?.aspect1);
  put("aspect2", a.aspect2, initial?.aspect2);
  put("aspect3", a.aspect3, initial?.aspect3);

  /** directions로 변환해서 서버 규격에 맞게 보냄 */
  let directions: Array<{ direction: string }> | undefined;

  if (Array.isArray(a.orientations) && a.orientations.length > 0) {
    directions = a.orientations
      .map((o: any) => {
        // dir 또는 value(문자) 우선 사용, weight(숫자)는 사용하지 않음
        const v =
          (typeof o?.dir === "string" && o.dir.trim()) ||
          (typeof o?.value === "string" && o.value.trim()) ||
          undefined;
        return v ? { direction: v } : undefined;
      })
      .filter(Boolean) as Array<{ direction: string }>;
  } else {
    // aspect1~3로 구성 (빈 값은 제외)
    const arr = [a.aspect1, a.aspect2, a.aspect3]
      .map((v) => (v && String(v).trim()) || "")
      .filter(Boolean);
    if (arr.length) directions = arr.map((d) => ({ direction: d }));
  }

  /** initial도 directions 기준으로 비교 */
  const initialDirections = (initial as any)?.directions as
    | Array<{ direction: string }>
    | undefined;

  putKeepEmptyArray("directions", directions, initialDirections);

  /* ===== 가격/주차/준공 ===== */
  const prevSaleStr =
    initial?.salePrice === undefined || initial?.salePrice === null
      ? undefined
      : String(initial!.salePrice as any);

  // 숫자 변환
  const parkingTypeIdN = defined(a.parkingTypeId)
    ? toIntOrNull(a.parkingTypeId)
    : undefined;

  // 패치에 싣기 (초기값과 비교)
  putAllowNull(
    "parkingTypeId",
    parkingTypeIdN,
    (initial as any)?.parkingTypeId
  );

  put(
    "salePrice",
    defined(a.salePrice) ? salePriceStr : undefined,
    prevSaleStr
  );

  putAllowNull(
    "parkingType",
    defined(a.parkingType)
      ? a.parkingType === ""
        ? undefined
        : a.parkingType
      : undefined,
    initial?.parkingType
  );
  putAllowNull(
    "totalParkingSlots",
    totalParkingSlotsN,
    initial?.totalParkingSlots
  );
  put("completionDate", a.completionDate, initial?.completionDate);

  /* ===== 평점/엘리베이터 ===== */
  if (defined(a.parkingGrade) && parkingGradeVal !== undefined) {
    put("parkingGrade", parkingGradeVal, initial?.parkingGrade);
  }
  put("elevator", a.elevator, initial?.elevator);

  /* ===== 숫자 ===== */
  putAllowNull("totalBuildings", totalBuildingsN, initial?.totalBuildings);
  putAllowNull("totalFloors", totalFloorsN, initial?.totalFloors);
  putAllowNull("totalHouseholds", totalHouseholdsN, initial?.totalHouseholds);
  putAllowNull(
    "remainingHouseholds",
    remainingHouseholdsN,
    initial?.remainingHouseholds
  );

  /* ===== 등급/등기 ===== */
  put("slopeGrade", a.slopeGrade, initial?.slopeGrade);
  put("structureGrade", a.structureGrade, initial?.structureGrade);

  const uiRegistry = a.registry ?? a.registryOne;
  const prevRegistry =
    (initial as any)?.registry ?? (initial as any)?.registryOne;
  put("registry", uiRegistry, prevRegistry);

  /* ✅ 신축/구옥 → isNew / isOld 매핑 (UpdatePayload에 키 없어도 putAny로 안전 전송) */
  if (defined(a.buildingGrade)) {
    const nextIsNew = a.buildingGrade === "new";
    const nextIsOld = a.buildingGrade === "old";
    putAny("isNew", nextIsNew, (initial as any)?.isNew);
    putAny("isOld", nextIsOld, (initial as any)?.isOld);
  }

  /* ✅ (대안) 서버가 building.grade 를 받는 경우: building 객체로 내려보내기 */
  if (defined(a.buildingGrade)) {
    // 'new' | 'old' | null 로 정규화
    const nextGrade =
      a.buildingGrade === "new" || a.buildingGrade === "old"
        ? a.buildingGrade
        : null;

    // prev 값 추출 (없으면 null)
    const prevGrade = (initial as any)?.building?.grade ?? null;

    // 값이 바뀐 경우에만 patch에 포함
    if (initial === undefined || !deepEq(prevGrade, nextGrade)) {
      // 기존 initial.building 의 다른 필드는 보존하고 grade만 교체
      const prevBuilding = (initial as any)?.building ?? {};
      (patch as any).building = { ...prevBuilding, grade: nextGrade };
    }
  }

  /* ===== 옵션/메모 ===== */
  putKeepEmptyArray("options", a.options, initial?.options);
  if (defined(a.optionEtc))
    put("optionEtc", optionEtcFinal, initial?.optionEtc);
  put("publicMemo", a.publicMemo, initial?.publicMemo);
  put("secretMemo", a.secretMemo, initial?.secretMemo);

  /* ===== 면적 (레거시 단일값) ===== */
  put("exclusiveArea", a.exclusiveArea, initial?.exclusiveArea);
  put("realArea", a.realArea, initial?.realArea);
  putKeepEmptyArray(
    "extraExclusiveAreas",
    a.extraExclusiveAreas,
    initial?.extraExclusiveAreas
  );
  putKeepEmptyArray(
    "extraRealAreas",
    a.extraRealAreas,
    initial?.extraRealAreas
  );

  /* ===== 면적 (신규: 범위) ===== */
  const explicitRangeTouched =
    defined(a.exclusiveAreaMin) ||
    defined(a.exclusiveAreaMax) ||
    defined(a.exclusiveAreaMinPy) ||
    defined(a.exclusiveAreaMaxPy) ||
    defined(a.realAreaMin) ||
    defined(a.realAreaMax) ||
    defined(a.realAreaMinPy) ||
    defined(a.realAreaMaxPy);

  const initialHasRangeKeys =
    (initial as any)?.exclusiveAreaMin !== undefined ||
    (initial as any)?.exclusiveAreaMax !== undefined ||
    (initial as any)?.exclusiveAreaMinPy !== undefined ||
    (initial as any)?.exclusiveAreaMaxPy !== undefined ||
    (initial as any)?.realAreaMin !== undefined ||
    (initial as any)?.realAreaMax !== undefined ||
    (initial as any)?.realAreaMinPy !== undefined ||
    (initial as any)?.realAreaMaxPy !== undefined;

  if (explicitRangeTouched || initialHasRangeKeys) {
    const pickNumStr = (v: any) => toNumericStringOrUndefined(v);

    // baseAreaSet은 보조값으로만 사용 (UI가 아무 것도 안 건드렸다면 생성하지 않음)
    const fromSet = (s?: any) => ({
      exMin: pickNumStr(
        s?.exclusiveMin ?? s?.exMinM2 ?? s?.exclusive?.minM2 ?? s?.m2Min
      ),
      exMax: pickNumStr(
        s?.exclusiveMax ?? s?.exMaxM2 ?? s?.exclusive?.maxM2 ?? s?.m2Max
      ),
      exMinPy: pickNumStr(
        s?.exclusiveMinPy ?? s?.exMinPy ?? s?.exclusive?.minPy ?? s?.pyMin
      ),
      exMaxPy: pickNumStr(
        s?.exclusiveMaxPy ?? s?.exMaxPy ?? s?.exclusive?.maxPy ?? s?.pyMax
      ),
      realMin: pickNumStr(s?.realMin ?? s?.realMinM2 ?? s?.real?.minM2),
      realMax: pickNumStr(s?.realMax ?? s?.realMaxM2 ?? s?.real?.maxM2),
      realMinPy: pickNumStr(s?.realMinPy ?? s?.real?.minPy),
      realMaxPy: pickNumStr(s?.realMaxPy ?? s?.real?.maxPy),
    });

    const S = fromSet(a.baseAreaSet as any);

    const exMin = pickNumStr(
      defined(a.exclusiveAreaMin) ? a.exclusiveAreaMin : S.exMin
    );
    const exMax = pickNumStr(
      defined(a.exclusiveAreaMax) ? a.exclusiveAreaMax : S.exMax
    );
    const exMinPy = pickNumStr(
      defined(a.exclusiveAreaMinPy) ? a.exclusiveAreaMinPy : S.exMinPy
    );
    const exMaxPy = pickNumStr(
      defined(a.exclusiveAreaMaxPy) ? a.exclusiveAreaMaxPy : S.exMaxPy
    );

    const realMin = pickNumStr(
      defined(a.realAreaMin) ? a.realAreaMin : S.realMin
    );
    const realMax = pickNumStr(
      defined(a.realAreaMax) ? a.realAreaMax : S.realMax
    );
    const realMinPy = pickNumStr(
      defined(a.realAreaMinPy) ? a.realAreaMinPy : S.realMinPy
    );
    const realMaxPy = pickNumStr(
      defined(a.realAreaMaxPy) ? a.realAreaMaxPy : S.realMaxPy
    );

    putAny("exclusiveAreaMin", exMin, (initial as any)?.exclusiveAreaMin);
    putAny("exclusiveAreaMax", exMax, (initial as any)?.exclusiveAreaMax);
    putAny("exclusiveAreaMinPy", exMinPy, (initial as any)?.exclusiveAreaMinPy);
    putAny("exclusiveAreaMaxPy", exMaxPy, (initial as any)?.exclusiveAreaMaxPy);

    putAny("realAreaMin", realMin, (initial as any)?.realAreaMin);
    putAny("realAreaMax", realMax, (initial as any)?.realAreaMax);
    putAny("realAreaMinPy", realMinPy, (initial as any)?.realAreaMinPy);
    putAny("realAreaMaxPy", realMaxPy, (initial as any)?.realAreaMaxPy);
  }

  /* ===== 유닛 ===== */
  if (defined(a.unitLines)) {
    const prevUnits = (initial as any)?.unitLines as UnitLine[] | undefined;
    const currUnits = a.unitLines as UnitLine[] | undefined;
    if (initial === undefined || unitLinesChanged(prevUnits, currUnits)) {
      (patch as any).unitLines = currUnits ?? [];
    }
  }

  /* ===== 이미지 ===== */
  if (urlsHorizontal.length) {
    const prevImages = (initial as any)?.images;
    if (initial === undefined || !jsonEq(prevImages, urlsHorizontal)) {
      (patch as any).images = urlsHorizontal;
    }
  }
  if (urlsVertical.length) {
    const prevVerticalA = (initial as any)?.imagesVertical;
    const prevVerticalB = (initial as any)?.verticalImages;
    if (
      initial === undefined ||
      (!jsonEq(prevVerticalA, urlsVertical) &&
        !jsonEq(prevVerticalB, urlsVertical))
    ) {
      (patch as any).imagesVertical = urlsVertical;
      (patch as any).verticalImages = urlsVertical;
    }
  }

  return patch;
}

export default buildUpdatePayload;
