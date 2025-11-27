import type {
  Grade,
  Registry,
  UnitLine,
  OrientationValue,
} from "@/features/properties/types/property-domain";

import type {
  CreatePayload,
  UpdatePayload,
  CreatePinOptionsDto, // ✅ 옵션 DTO 타입 가져오기
} from "@/features/properties/types/property-dto";

import { AreaSet } from "../sections/AreaSetsSection/types";
import { PropertyViewDetails } from "../PropertyViewModal/types";
import type { CreatePinAreaGroupDto } from "@/features/properties/types/area-group-dto";

/* ────────────────────────────────────────────────────────────
 * 편집 모달 Props
 * ──────────────────────────────────────────────────────────── */
export type PropertyEditModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (
    payload: UpdatePayload & Partial<CreatePayload>
  ) => void | Promise<void>;
  initialData: PropertyViewDetails;
};

/* ────────────────────────────────────────────────────────────
 * 편집 아이템 (UI 상태)
 * ──────────────────────────────────────────────────────────── */
export type PropertyEditItem = {
  id: string;

  title?: string;
  address?: string;

  officePhone?: string;
  officePhone2?: string;
  officeName?: string;

  moveIn?: string; // YYYY-MM-DD or free text
  floor?: string;
  roomNo?: string;
  structure?: string;

  /** 생성/수정 공통 포맷 (간단 배열) */
  aspects?: { no: number; dir: OrientationValue | "" }[];
  listingStars?: number;

  parkingType?: string | null;
  parkingCount?: string | number | null; // 필요시 제거 가능

  /** 총 주차대수 */
  totalParkingSlots?: string | number | null;

  completionDate?: string | Date | null; // YYYY-MM or Date
  salePrice?: string | number | null;

  rebateText?: string | number | null;

  /** "a~b" 문자열 포맷 (㎡ 범위) */
  exclusiveArea?: string | null;
  realArea?: string | null;
  extraExclusiveAreas?: string[]; // 각 항목 "a~b"
  extraRealAreas?: string[]; // 각 항목 "a~b"

  /** 편집용 UI 상태(선택) */
  baseAreaSet?: AreaSet;
  extraAreaSets?: AreaSet[];

  elevator?: "O" | "X";
  registry?: Registry;
  slopeGrade?: Grade;
  structureGrade?: Grade;

  totalBuildings?: string;
  totalFloors?: string;
  totalHouseholds?: string;
  remainingHouseholds?: string;

  options?: string[];
  optionEtc?: string;
  publicMemo?: string;
  secretMemo?: string;

  unitLines?: UnitLine[];
  images?: string[];
};

/* ────────────────────────────────────────────────────────────
 * 내부 유틸
 * ──────────────────────────────────────────────────────────── */

const toStr = (v: any) =>
  typeof v === "string" ? v : v == null ? "" : String(v);

const toNum = (v: unknown) => {
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** DTO 규격에 맞춘 "a~b" 문자열 리스트 정규화 */
function normalizeRangeStrList(list?: string[] | null): string[] | undefined {
  if (!Array.isArray(list)) return undefined;

  const out: string[] = [];
  for (const raw of list) {
    if (!raw) continue;
    const s = String(raw).trim();

    // 1) 이미 "a~b" 형태면 숫자만 정규화해서 다시 조합
    const m = s.match(
      /^\s*([0-9]+(?:\.[0-9]+)?)\s*~\s*([0-9]+(?:\.[0-9]+)?)\s*$/
    );
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        out.push(`${a}~${b}`);
      }
      continue;
    }

    // 2) "~" 기준 파싱해서 숫자면 조합
    const [aRaw, bRaw] = s.split("~").map((t) => t?.trim());
    const a = toNum(aRaw);
    const b = toNum(bRaw);
    if (Number.isFinite(a as number) && Number.isFinite(b as number)) {
      out.push(`${a}~${b}`);
    }
  }
  return out.length ? out : undefined;
}

/** YYYY-MM 포맷으로 정규화 (Date/문자열 섞여 들어와도 안전) */
function normalizeYearMonth(v?: string | Date | null): string | undefined {
  if (!v) return undefined;
  if (v instanceof Date && !isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }
  const s = toStr(v).trim();
  const m = s.match(/^(\d{4})[-/.](\d{1,2})/);
  if (m) {
    const y = m[1];
    const mm = String(Number(m[2])).padStart(2, "0");
    return `${y}-${mm}`;
  }
  const m2 = s.match(/^(\d{4})(\d{2})$/);
  if (m2) return `${m2[1]}-${m2[2]}`;
  return undefined;
}

/** 옵션/기타 정리 → string[] */
function normalizeOptions(
  options?: string[] | null,
  optionEtc?: string | null
): string[] {
  const base = Array.isArray(options) ? options : [];
  const etc = optionEtc ? [optionEtc] : [];
  return [...base, ...etc].filter(Boolean);
}

type AspectInput = { no: number; dir: OrientationValue | "" };

/** 방향/aspects 정리: dir이 빈 문자열이면 제외 */
function normalizeAspects(aspects?: AspectInput[]) {
  if (!Array.isArray(aspects)) return undefined;

  const rows = aspects
    .filter(
      (r): r is { no: number; dir: OrientationValue } =>
        !!r &&
        typeof r.no === "number" &&
        typeof r.dir === "string" &&
        r.dir.length > 0
    )
    .map((r) => ({ no: r.no, dir: r.dir }));

  return rows.length ? rows : undefined;
}

/** AreaSet → CreatePinAreaGroupDto 변환 */
function areaSetsToGroups(
  base?: AreaSet,
  extras?: AreaSet[]
): CreatePinAreaGroupDto[] | undefined {
  const items: AreaSet[] = [
    ...(base ? [base] : []),
    ...((Array.isArray(extras) ? extras : []).filter(Boolean) as AreaSet[]),
  ];
  if (!items.length) return undefined;

  const out: CreatePinAreaGroupDto[] = [];

  items.forEach((s, idx) => {
    const title = toStr((s as any)?.title || "").slice(0, 50);

    const exMin = toNum((s as any)?.exclusive?.minM2);
    const exMax = toNum((s as any)?.exclusive?.maxM2);
    if (!Number.isFinite(exMin as number) || !Number.isFinite(exMax as number))
      return;
    if ((exMin as number) > (exMax as number)) return;

    const actMinRaw = toNum((s as any)?.real?.minM2);
    const actMaxRaw = toNum((s as any)?.real?.maxM2);
    const actualMinM2 = Number.isFinite(actMinRaw as number)
      ? (actMinRaw as number)
      : (exMin as number);
    const actualMaxM2 = Number.isFinite(actMaxRaw as number)
      ? (actMaxRaw as number)
      : (exMax as number);

    if (actualMinM2 > actualMaxM2) return;

    out.push({
      title,
      exclusiveMinM2: exMin as number,
      exclusiveMaxM2: exMax as number,
      actualMinM2,
      actualMaxM2,
      sortOrder: idx,
    });
  });

  return out.length ? out : undefined;
}

/** 가격 계열: 최종적으로 string | undefined 반환 */
function numericStringOrUndefined(v: string | number | null | undefined) {
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : undefined;
  if (typeof v === "string" && v.trim() !== "") {
    const cleaned = v.replace(/[^\d.-]+/g, "");
    if (
      cleaned === "" ||
      cleaned === "-" ||
      cleaned === "." ||
      cleaned === "-."
    )
      return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? String(n) : undefined;
  }
  return undefined;
}

/** string[] → CreatePinOptionsDto 변환 */
function toOptionsDto(
  list: string[] | undefined
): CreatePinOptionsDto | undefined {
  if (!list || !list.length) return undefined;

  // ⚠️ 여기서 필드명은 CreatePinOptionsDto 정의에 맞게 수정해야 함.
  // 예: { names: list } / { options: list } / { values: list } 등
  return { names: list } as CreatePinOptionsDto;
}

/* ────────────────────────────────────────────────────────────
 * 메인 빌더: UI 상태 → UpdatePayload(+Partial<CreatePayload>)
 * ──────────────────────────────────────────────────────────── */
export function mapEditItemToUpdatePayload(
  item: PropertyEditItem,
  initial?: PropertyViewDetails
): UpdatePayload & Partial<CreatePayload> {
  // 1) 기본 필드
  const completionYm = normalizeYearMonth(item.completionDate);
  const salePriceStr = numericStringOrUndefined(item.salePrice);
  const rebateTextStr = numericStringOrUndefined(item.rebateText);
  const totalParkingSlots =
    typeof item.totalParkingSlots === "number" ||
    (typeof item.totalParkingSlots === "string" &&
      item.totalParkingSlots.trim() !== "")
      ? Number(String(item.totalParkingSlots).replace(/[, ]+/g, ""))
      : undefined;

  // 2) 추가 면적 범위 리스트 → "a~b" 문자열 배열로 정규화
  const extraExclusiveStrList = normalizeRangeStrList(item.extraExclusiveAreas);
  const extraRealStrList = normalizeRangeStrList(item.extraRealAreas);

  // 3) 면적 그룹
  const areaGroups = areaSetsToGroups(item.baseAreaSet, item.extraAreaSets);

  // 4) 방향 → aspect1~3로 변환
  const aspectRows = normalizeAspects(item.aspects);
  const dirs = (aspectRows?.map((r) => r.dir) ?? []) as string[];
  const [aspect1, aspect2, aspect3] = dirs;

  // 5) 옵션 리스트 & DTO 변환
  const optionList = normalizeOptions(item.options, item.optionEtc);
  const optionsDto = toOptionsDto(optionList);

  // 6) 전송 페이로드
  const payload: UpdatePayload & Partial<CreatePayload> = {
    // 텍스트 기본
    title: item.title?.trim() || undefined,
    address: item.address?.trim() || undefined,

    officePhone: item.officePhone?.trim() || undefined,
    officePhone2: item.officePhone2?.trim() || undefined,
    officeName: item.officeName?.trim() || undefined,

    moveIn: item.moveIn?.trim() || undefined,
    floor: item.floor?.trim() || undefined,
    roomNo: item.roomNo?.trim() || undefined,
    structure: item.structure?.trim() || undefined,

    // 별점/방향/옵션
    listingStars:
      typeof item.listingStars === "number" ? item.listingStars : undefined,
    ...(aspect1 ? { aspect1 } : {}),
    ...(aspect2 ? { aspect2 } : {}),
    ...(aspect3 ? { aspect3 } : {}),
    options: optionsDto,

    // 주차
    parkingType: item.parkingType ?? undefined,
    totalParkingSlots,

    // 준공연월/가격
    completionDate: completionYm,
    salePrice: salePriceStr,
    rebateText: rebateTextStr,

    // ⚠️ 숫자 min/max 키들 제거하고 문자열 범위로만 보냄
    exclusiveArea:
      typeof item.exclusiveArea === "string" && item.exclusiveArea.trim()
        ? item.exclusiveArea.trim()
        : undefined,
    realArea:
      typeof item.realArea === "string" && item.realArea.trim()
        ? item.realArea.trim()
        : undefined,

    // 추가 면적(문자열 리스트)
    extraExclusiveAreas: extraExclusiveStrList,
    extraRealAreas: extraRealStrList,

    // 면적 그룹
    areaGroups,

    // 엘리베이터/등급/등본
    elevator: item.elevator,
    registry: item.registry,
    slopeGrade: item.slopeGrade,
    structureGrade: item.structureGrade,

    // 단지 규모
    totalBuildings:
      typeof item.totalBuildings === "string" && item.totalBuildings.trim()
        ? Number(item.totalBuildings.replace(/[, ]+/g, ""))
        : typeof item.totalBuildings === "number"
        ? item.totalBuildings
        : undefined,
    totalFloors:
      typeof item.totalFloors === "string" && item.totalFloors.trim()
        ? Number(item.totalFloors.replace(/[, ]+/g, ""))
        : typeof item.totalFloors === "number"
        ? item.totalFloors
        : undefined,
    totalHouseholds:
      typeof item.totalHouseholds === "string" && item.totalHouseholds.trim()
        ? Number(item.totalHouseholds.replace(/[, ]+/g, ""))
        : typeof item.totalHouseholds === "number"
        ? item.totalHouseholds
        : undefined,
    remainingHouseholds:
      typeof item.remainingHouseholds === "string" &&
      item.remainingHouseholds.trim()
        ? Number(item.remainingHouseholds.replace(/[, ]+/g, ""))
        : typeof item.remainingHouseholds === "number"
        ? item.remainingHouseholds
        : undefined,

    // 메모/이미지/라인
    publicMemo: item.publicMemo?.trim() || undefined,
    secretMemo: item.secretMemo?.trim() || undefined,
    unitLines:
      item.unitLines && item.unitLines.length ? item.unitLines : undefined,
    images: item.images && item.images.length ? item.images : undefined,
  };

  return pruneNullishDeep(payload);
}

/** 깊은 nullish 제거 유틸 */
function pruneNullishDeep<T>(obj: T): T {
  if (obj == null) return obj;
  if (Array.isArray(obj)) {
    const arr = obj.map((v) => pruneNullishDeep(v)).filter((v) => !(v == null));
    return arr as unknown as T;
  }
  if (typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj as any)) {
      const pv = pruneNullishDeep(v as any);
      const drop =
        pv === undefined ||
        pv === null ||
        (typeof pv === "string" && pv.trim() === "");
      if (!drop) out[k] = pv;
    }
    return out;
  }
  return obj;
}
