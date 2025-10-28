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

// ✅ parkingType은 string | null, 주차 대수는 totalParkingSlots만 사용
type Normalized = {
  // 기본
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
  // 별점/주차/준공/매매
  listingStars: number;
  parkingType: string | null;
  totalParkingSlots: string;
  completionDate: string;
  salePrice: string;
  // 면적
  baseArea: AreaSet;
  extraAreas: AreaSet[];
  // 등기/등급
  elevator: "O" | "X";
  registryOne: Registry | undefined;
  slopeGrade: Grade | undefined;
  structureGrade: Grade | undefined;
  // 숫자
  totalBuildings: string;
  totalFloors: string;
  totalHouseholds: string;
  remainingHouseholds: string;
  // 옵션/메모/유닛
  options: string[];
  optionEtc: string;
  etcChecked: boolean;
  publicMemo: string;
  secretMemo: string;
  unitLines: UnitLine[];
  // 향
  aspects: AspectRowLite[];
};

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

  // 향(orientations → AspectRowLite[])
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

  // ✅ parkingType: 공백이면 null
  const rawParkingType = asStr(d.parkingType).trim();
  const parkingType: string | null = rawParkingType ? rawParkingType : null;

  // ✅ totalParkingSlots: 없으면 빈 문자열
  const totalParkingSlots = asStr(d.totalParkingSlots ?? "");

  return {
    // 기본
    pinKind: (d.pinKind ?? d.kind ?? d.markerKind ?? "1room") as PinKind,
    title: asStr(d.title),
    address: asStr(d.address),
    officePhone: asStr(d.officePhone),
    officePhone2: asStr(d.officePhone2),
    officeName: asStr(d.officeName),
    moveIn: asStr(d.moveIn),
    floor: asStr(d.floor),
    roomNo: asStr(d.roomNo),
    structure: asStr(d.structure || "3룸"),

    // 별점/주차/준공/매매
    listingStars: asNum(d.listingStars, 0),
    parkingType,
    totalParkingSlots,
    completionDate: asYMD(d.completionDate),
    salePrice: asStr(d.salePrice),

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

    // 등기/등급
    elevator: (d.elevator as "O" | "X") ?? "O",
    registryOne: d.registry as Registry | undefined,
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
    secretMemo: asStr(d.secretMemo),
    unitLines: (d.unitLines as UnitLine[]) ?? [],

    // 향
    aspects: aspects.length ? aspects : [{ no: 1, dir: "" }],
  };
}
