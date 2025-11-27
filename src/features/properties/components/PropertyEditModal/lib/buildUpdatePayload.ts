"use client";

import type { UpdatePayload } from "@/features/properties/types/property-dto";
import type {
  Grade,
  UnitLine,
  OrientationRow,
  BuildingType, // ✅ 건물타입
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

/* ───────── areaGroups 정규화/비교 ───────── */
type AreaGroupPayload = {
  title: string;
  exclusiveMinM2: number | null;
  exclusiveMaxM2: number | null;
  actualMinM2: number | null;
  actualMaxM2: number | null;
  sortOrder: number;
};

const toNumOrNullFromAny = (v: any): number | null => {
  const s = toNumericStringOrUndefined(v as any);
  if (s === undefined) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/** UI AreaSet → 서버 areaGroups payload */
const areaSetsToGroups = (
  base?: AreaSet,
  extras?: AreaSet[],
  baseTitleOut?: string,
  extraTitlesOut?: string[]
): AreaGroupPayload[] => {
  const items: { set: any; title?: string | null }[] = [];

  if (base) {
    items.push({
      set: base,
      title: baseTitleOut ?? (base as any).title ?? null,
    });
  }

  (extras ?? []).forEach((s, idx) => {
    items.push({
      set: s,
      title: extraTitlesOut?.[idx] ?? (s as any).title ?? null,
    });
  });

  const groups: AreaGroupPayload[] = [];

  items.forEach(({ set, title }, idx) => {
    const exMin = toNumOrNullFromAny(
      set?.exclusiveMinM2 ?? set?.exclusiveMin ?? set?.m2Min
    );
    const exMax = toNumOrNullFromAny(
      set?.exclusiveMaxM2 ?? set?.exclusiveMax ?? set?.m2Max
    );
    const acMin = toNumOrNullFromAny(
      set?.actualMinM2 ?? set?.realMinM2 ?? set?.realMin
    );
    const acMax = toNumOrNullFromAny(
      set?.actualMaxM2 ?? set?.realMaxM2 ?? set?.realMax
    );

    const rawTitle = (title ?? "").toString().trim();
    const finalTitle = rawTitle || String(idx + 1);

    const isEmpty =
      !rawTitle &&
      exMin == null &&
      exMax == null &&
      acMin == null &&
      acMax == null;
    if (isEmpty) return;

    groups.push({
      title: finalTitle,
      exclusiveMinM2: exMin,
      exclusiveMaxM2: exMax,
      actualMinM2: acMin,
      actualMaxM2: acMax,
      sortOrder: idx,
    });
  });

  return groups;
};

/** areaGroups 비교용: sortOrder는 무시하고 값만 비교 */
const normalizeAreaGroupsForCompare = (groups: any[] | undefined) => {
  if (!Array.isArray(groups)) return [] as AreaGroupPayload[];
  return groups.map((g: any, idx: number) => ({
    title: (g.title ?? "").toString().trim() || String(idx + 1),
    exclusiveMinM2: toNumOrNullFromAny(
      g.exclusiveMinM2 ?? g.exclusiveMin ?? g.exMinM2
    ),
    exclusiveMaxM2: toNumOrNullFromAny(
      g.exclusiveMaxM2 ?? g.exclusiveMax ?? g.exMaxM2
    ),
    actualMinM2: toNumOrNullFromAny(g.actualMinM2 ?? g.realMinM2 ?? g.realMin),
    actualMaxM2: toNumOrNullFromAny(g.actualMaxM2 ?? g.realMaxM2 ?? g.realMax),
    sortOrder: 0, // 비교에서는 무시
  }));
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
  /** ✅ 주차유형 문자열(자유양식) */
  parkingType?: string | null;
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

  // ✅ 수정모달에서 선택한 건물유형
  buildingType?: BuildingType | null;

  rebateText?: string | null;
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
    if (!s) return;
    // ✅ blob:, data: 같은 로컬 전용 URL은 서버로 보내지 않도록 필터링
    if (!/^https?:\/\//.test(s)) return;
    if (!into.includes(s)) into.push(s);
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

  // orientations 정규화 (※ 현재 directions 변환에 사용)
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
        const v =
          (typeof o?.dir === "string" && o.dir.trim()) ||
          (typeof o?.value === "string" && o.value.trim()) ||
          undefined;
        return v ? { direction: v } : undefined;
      })
      .filter(Boolean) as Array<{ direction: string }>;
  } else {
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

  // ✅ parkingType 문자열 PATCH (trim + 최대 50자, 빈문자 → null)
  if (defined(a.parkingType)) {
    const raw = a.parkingType ?? "";
    const trimmed = raw.toString().trim().slice(0, 50);
    const nextParkingType =
      trimmed.length === 0 ? null : (trimmed as string | null);
    const prevParkingType = (initial as any)?.parkingType ?? null;

    putAllowNull("parkingType", nextParkingType, prevParkingType);
  }

  put(
    "salePrice",
    defined(a.salePrice) ? salePriceStr : undefined,
    prevSaleStr
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

  /* ✅ 신축/구옥 → isNew / isOld 매핑 */
  if (defined(a.buildingGrade)) {
    const nextIsNew = a.buildingGrade === "new";
    const nextIsOld = a.buildingGrade === "old";
    putAny("isNew", nextIsNew, (initial as any)?.isNew);
    putAny("isOld", nextIsOld, (initial as any)?.isOld);
  }

  /* (대안) 서버가 building.grade 를 받는 경우 */
  if (defined(a.buildingGrade)) {
    const nextGrade =
      a.buildingGrade === "new" || a.buildingGrade === "old"
        ? a.buildingGrade
        : null;
    const prevGrade = (initial as any)?.building?.grade ?? null;
    if (initial === undefined || !deepEq(prevGrade, nextGrade)) {
      const prevBuilding = (initial as any)?.building ?? {};
      (patch as any).building = { ...prevBuilding, grade: nextGrade };
    }
  }

  // ✅ 건물유형(도생/근생/주택 등) PATCH
  if (defined(a.buildingType)) {
    putAllowNull(
      "buildingType",
      a.buildingType ?? null,
      (initial as any)?.buildingType
    );
  }

  /* ===== 옵션/메모 ===== */
  putKeepEmptyArray("options", a.options, initial?.options);
  if (defined(a.optionEtc))
    put("optionEtc", optionEtcFinal, initial?.optionEtc);
  put("publicMemo", a.publicMemo, initial?.publicMemo);
  put("secretMemo", a.secretMemo, initial?.secretMemo);

  // ✅ 리베이트 텍스트 PATCH
  if (defined(a.rebateText)) {
    const nextRebate = (a.rebateText ?? "").toString().trim();
    const prevRebate = (initial as any)?.rebateText ?? "";
    if (initial === undefined || !deepEq(prevRebate, nextRebate)) {
      (patch as any).rebateText = nextRebate;
    }
  }

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

  /* ===== 면적 (그룹: areaGroups) ===== */
  const currAreaGroupsRaw = areaSetsToGroups(
    a.baseAreaSet,
    a.extraAreaSets,
    a.baseAreaTitleOut,
    a.extraAreaTitlesOut
  );
  const prevAreaGroupsRaw = (initial as any)?.areaGroups as any[] | undefined;

  const currAreaGroups = normalizeAreaGroupsForCompare(currAreaGroupsRaw);
  const prevAreaGroups = normalizeAreaGroupsForCompare(prevAreaGroupsRaw);

  // ✅ 규칙:
  //  - 초기값이 없는 신규 생성(initial === undefined) 이면 값이 있으면 areaGroups 보냄
  //  - 수정(initial 존재)에서는 "실제 면적 범위 입력을 건드렸을 때(explicitRangeTouched)"만 areaGroups 전송
  if (initial === undefined) {
    if (currAreaGroups.length > 0) {
      (patch as any).areaGroups = currAreaGroupsRaw;
    }
  } else if (explicitRangeTouched) {
    if (!deepEq(prevAreaGroups, currAreaGroups)) {
      (patch as any).areaGroups = currAreaGroupsRaw.length
        ? currAreaGroupsRaw
        : [];
    }
  }
  // 👉 이렇게 하면: 편집 모달에서 아무것도 안 건드리고 저장할 때는
  //    explicitRangeTouched가 false라서 areaGroups 필드가 아예 요청에 안 실림

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
