import type {
  AspectRowLite as DomainAspectRowLite,
  Grade,
  OrientationValue,
  Registry,
  UnitLine,
} from "@/features/properties/types/property-domain";
import type { PinKind } from "@/features/pins/types";
import type { AreaSet } from "../../../sections/AreaSetsSection/types";

export type { Grade, OrientationValue, Registry, UnitLine, AreaSet, PinKind };

// 도메인 타입을 그대로 노출하면서 지역 alias도 제공
export interface AspectRowLite extends DomainAspectRowLite {
  // dir: "" | OrientationValue  (도메인 정의 그대로)
}

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
  parkingType: string; // UI는 문자열 보유
  totalParkingSlots: string; // ✅ 신규: 총 주차 대수 (문자열로 보관)
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
