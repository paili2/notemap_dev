import { toPy } from "@/features/properties/lib/area";
import type {
  AreaSet,
  AspectRowLite,
  Grade,
  OrientationValue,
  Registry,
  UnitLine,
  PinKind,
} from "./types";
import {
  type BuildingType,
  normalizeBuildingTypeLabelToEnum,
  BUILDING_TYPES,
} from "@/features/properties/types/property-domain";

/* ───────────── 유틸 ───────────── */
type StarStr = "" | "1" | "2" | "3" | "4" | "5";
const asStr = (v: unknown) => (v == null ? "" : String(v));
const asYMD = (v: unknown) => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = asStr(v);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
};
const asNum = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const asOptionalNum = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const unpackRange = (s: unknown): { min: string; max: string } => {
  const raw = asStr(s).trim();
  if (!raw) return { min: "", max: "" };
  const [min, max] = raw.split("~", 2);
  return { min: (min ?? "").trim(), max: (max ?? "").trim() };
};
const pickOrientation = (o: unknown): OrientationValue | "" =>
  ((o as any)?.dir ?? (o as any)?.direction ?? (o as any)?.value ?? "") as
    | OrientationValue
    | "";

/* ───────── Registry 정규화 ─────────
   서버에서 "확인 필요", "등기완료", "미등기" 등 다양한 표기가 올 수 있어
   수정모달 셀렉트 옵션(확인필요/완료/미완료)로 일치시켜 줍니다.
*/
function normalizeRegistry(v: unknown): Registry | undefined {
  const s = String(v ?? "").trim();
  if (!s) return undefined;
  const n = s
    .replace(/\s+/g, "") // "확인 필요" -> "확인필요"
    .replace(/등기완료?$/g, "완료") // "등기완료" -> "완료"
    .replace(/^미등기$/g, "미완료"); // "미등기" -> "미완료"

  return (["확인필요", "완료", "미완료"] as const).includes(n as any)
    ? (n as Registry)
    : undefined;
}

/* ───────── buildingType 정규화 ─────────
   - 숫자 id가 오면: 1=주택, 2=APT, 3=OP, 4/5 = 근생
   - 문자열 라벨/별칭: normalizeBuildingTypeLabelToEnum 사용
   - 이미 백엔드 enum이면 그대로 유지
*/
function normalizeBuildingType(input: unknown): BuildingType | null {
  if (typeof input === "number") {
    switch (input) {
      case 1:
        return "주택";
      case 2:
        return "APT";
      case 3:
        return "OP";
      case 4:
        return "도생";
      case 5:
        return "근생";
      default:
        return null;
    }
  }

  const raw = asStr(input).trim();
  if (!raw) return null;

  if ((BUILDING_TYPES as readonly string[]).includes(raw)) {
    return raw as BuildingType;
  }
  return normalizeBuildingTypeLabelToEnum(raw);
}

/* ───────── Normalized 타입 ───────── */
type Normalized = {
  pinKind: PinKind;
  title: string;
  address: string;
  officePhone: string;
  officePhone2: string;
  officeName: string;
  moveIn: string;
  floor: string;
  roomNo: string;
  structure: string;

  listingStars: number;
  parkingGrade: StarStr;
  parkingType: string | null;
  parkingTypeId: number | null;
  totalParkingSlots: string;
  completionDate: string;
  salePrice: string;

  baseArea: AreaSet;
  extraAreas: AreaSet[];

  elevator: "O" | "X";
  registryOne: Registry | undefined;
  slopeGrade: Grade | undefined;
  structureGrade: Grade | undefined;

  totalBuildings: string;
  totalFloors: string;
  totalHouseholds: string;
  remainingHouseholds: string;

  options: string[];
  optionEtc: string;
  etcChecked: boolean;
  publicMemo: string;
  secretMemo: string;
  unitLines: UnitLine[];

  aspects: AspectRowLite[];
  buildingType: BuildingType | null;
};

/* ───────── 메인 Normalizer ───────── */
export function normalizeInitialData(initialData: any | null): Normalized {
  const d = initialData ?? {};

  // 면적(기본)
  const ex = unpackRange(d.exclusiveArea);
  const re = unpackRange(d.realArea);
  const baseAreaTitle = asStr(
    d.baseAreaTitle ?? d.areaTitle ?? d.areaSetTitle ?? ""
  );

  // 면적(추가)
  const extraExclusive = Array.isArray(d.extraExclusiveAreas)
    ? d.extraExclusiveAreas
    : [];
  const extraReal = Array.isArray(d.extraRealAreas) ? d.extraRealAreas : [];
  const extraTitles =
    (Array.isArray(d.extraAreaTitles) && d.extraAreaTitles.map(asStr)) ||
    (Array.isArray(d.areaSetTitles) && d.areaSetTitles.map(asStr)) ||
    [];
  const len = Math.max(
    extraExclusive.length,
    extraReal.length,
    extraTitles.length
  );
  const extraSets: AreaSet[] = Array.from({ length: len }, (_, i) => {
    const exi = unpackRange(extraExclusive[i] ?? "");
    const rei = unpackRange(extraReal[i] ?? "");
    const title = asStr(extraTitles[i] ?? "");
    const hasAny = title || exi.min || exi.max || rei.min || rei.max;
    if (!hasAny) return null as any;
    return {
      title: title || `세트 ${i + 1}`,
      exMinM2: exi.min,
      exMaxM2: exi.max,
      exMinPy: toPy(exi.min),
      exMaxPy: toPy(exi.max),
      realMinM2: rei.min,
      realMaxM2: rei.max,
      realMinPy: toPy(rei.min),
      realMaxPy: toPy(rei.max),
    };
  }).filter((v): v is AreaSet => Boolean(v));

  // 향
  const aspects: AspectRowLite[] =
    Array.isArray(d.orientations) && d.orientations.length
      ? (d.orientations as unknown[]).map((o, idx) => ({
          no: idx + 1,
          dir: pickOrientation(o),
        }))
      : ([d.aspect1, d.aspect2, d.aspect3].filter(Boolean).map((dir, i) => ({
          no: i + 1,
          dir: (dir as OrientationValue) ?? "",
        })) as AspectRowLite[]);

  // ───────── 주차 ─────────
  // 이름은 여러 필드 중 하나로 올 수 있음
  const rawParkingType = asStr(
    d.parkingType ?? d.parkingTypeName ?? d.parkingTypeLabel ?? d.parking?.type
  ).trim();
  const parkingType: string | null = rawParkingType ? rawParkingType : null;

  // ID도 여러 필드 후보
  const parkingTypeId: number | null =
    asOptionalNum(d.parkingTypeId) ??
    asOptionalNum(d.parking?.typeId) ??
    asOptionalNum(d.parkingTypeCode) ??
    null;

  const totalParkingSlots = asStr(
    d.totalParkingSlots ?? d.parking?.totalSlots ?? ""
  );

  // 평점
  const rawPg = asStr(d.parkingGrade).trim();
  const listingStars = asNum(d.listingStars, 0);
  const parkingGrade: StarStr = (["1", "2", "3", "4", "5"] as const).includes(
    rawPg as any
  )
    ? (rawPg as StarStr)
    : ((listingStars >= 1 && listingStars <= 5
        ? String(listingStars)
        : "") as StarStr);

  // units → unitLines (최소/최대 매매가 primary/secondary로 매핑)
  const unitLines: UnitLine[] = Array.isArray(d.units)
    ? (d.units as any[]).map((u) => ({
        rooms: asNum(u?.rooms ?? 0, 0),
        baths: asNum(u?.baths ?? 0, 0),
        duplex: !!u?.hasLoft,
        terrace: !!u?.hasTerrace,
        primary:
          u?.minPrice == null || u?.minPrice === "" ? "" : String(u.minPrice),
        secondary:
          u?.maxPrice == null || u?.maxPrice === "" ? "" : String(u.maxPrice),
      }))
    : Array.isArray(d.unitLines)
    ? (d.unitLines as UnitLine[])
    : [];

  // buildingType 정규화
  const buildingType: BuildingType | null = normalizeBuildingType(
    d.buildingType ??
      d.registrationType ??
      d.registrationTypeName ??
      d.registrationTypeId
  );

  return {
    // 기본
    pinKind: (d.pinKind ?? d.kind ?? d.markerKind ?? "1room") as PinKind,
    title: asStr(d.title),
    address: asStr(d.address),
    officePhone: asStr(d.contactMainPhone ?? d.officePhone),
    officePhone2: asStr(d.contactSubPhone ?? d.officePhone2),
    officeName: asStr(d.contactMainLabel ?? d.officeName),
    moveIn: asStr(d.moveIn),
    floor: asStr(d.floor),
    roomNo: asStr(d.roomNo),
    structure: asStr(d.structure || "3룸"),

    // 별점/주차/준공/매매
    listingStars,
    parkingGrade,
    parkingType,
    parkingTypeId,
    totalParkingSlots,
    completionDate: asYMD(d.completionDate),
    salePrice: asStr(d.salePrice ?? d.minRealMoveInCost),

    // 면적
    baseArea: {
      title: baseAreaTitle,
      exMinM2: ex.min,
      exMaxM2: ex.max,
      exMinPy: toPy(ex.min),
      exMaxPy: toPy(ex.max),
      realMinM2: re.min,
      realMaxM2: re.max,
      realMinPy: toPy(re.min),
      realMaxPy: toPy(re.max),
    },
    extraAreas: extraSets,

    // 설비/등급/등기
    elevator: (d.elevator as "O" | "X") ?? "O",
    registryOne: normalizeRegistry(d.registry ?? d.registryOne),
    slopeGrade: d.slopeGrade as Grade | undefined,
    structureGrade: d.structureGrade as Grade | undefined,

    // 숫자
    totalBuildings: asStr(d.totalBuildings),
    totalFloors: asStr(d.totalFloors),
    totalHouseholds: asStr(d.totalHouseholds),
    remainingHouseholds: asStr(d.remainingHouseholds),

    // 옵션/메모/유닛
    options: (d.options as string[]) ?? [],
    optionEtc: asStr(d.optionEtc),
    etcChecked: asStr(d.optionEtc).trim().length > 0,
    publicMemo: asStr(d.publicMemo),
    secretMemo: asStr(d.secretMemo ?? d.privateMemo),
    unitLines,

    // 향
    aspects: aspects.length ? aspects : [{ no: 1, dir: "" }],

    // 빌딩 타입
    buildingType,
  };
}
