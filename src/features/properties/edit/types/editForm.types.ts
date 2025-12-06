import type {
  AspectRowLite as DomainAspectRowLite,
  Grade,
  OrientationValue,
  Registry,
  UnitLine,
  BuildingType,
} from "@/features/properties/types/property-domain";
import type { PinKind } from "@/features/pins/types";
import type { AreaSet } from "@/features/properties/components/sections/AreaSetsSection/types";
import type { StarStr } from "@/features/properties/types/property-dto";

export type {
  Grade,
  OrientationValue,
  Registry,
  UnitLine,
  AreaSet,
  PinKind,
  BuildingType,
  StarStr,
};

// 도메인 AspectRowLite를 그대로 지역 alias로 사용
export type AspectRowLite = DomainAspectRowLite;

export type UseEditFormArgs = {
  initialData: any | null;
};

export type NormalizedEditData = {
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
  parkingGrade: StarStr; // "1"~"5" | ""
  parkingType: string | null; // ✅ 문자열 or null
  totalParkingSlots: string; // ✅ 총 주차 대수 (문자열로 보관)
  completionDate: string;
  salePrice: string;

  // 면적
  baseArea: AreaSet;
  extraAreas: AreaSet[];

  // 설비/등기/등급
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
  : string;
  etcChecked: boolean;
  publicMemo: string;
  secretMemo: string;
  unitLines: UnitLine[];

  // 향
  aspects: AspectRowLite[];

  // 건물유형(enum)
  buildingType: BuildingType | null;

  // 리베이트(만원 단위 텍스트)
  rebateText: string;
};
