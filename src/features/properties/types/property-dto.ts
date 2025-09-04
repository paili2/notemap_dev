import { ImageItem } from "./media";
import { Grade, OrientationRow, Registry, UnitLine } from "./property-domain";

// --- Create DTO ---
export type CreatePayload = {
  title: string;
  address?: string;

  officeName?: string;
  officePhone?: string;
  officePhone2?: string;

  moveIn?: string;
  floor?: string;
  roomNo?: string;
  structure?: string;

  // 향
  aspect?: string;
  aspectNo?: string;
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;
  orientations?: OrientationRow[];

  // 가격/평점/주차
  salePrice?: string; // 매매가
  parkingType?: string; // 예: "자주식", "답사지 확인"
  parkingCount?: string | number;

  // 설비/등급/날짜
  listingStars?: number;
  elevator?: "O" | "X";
  slopeGrade?: Grade;
  structureGrade?: Grade;
  completionDate?: string; // "2024.04.14" 같은 문자열

  // 단지 숫자
  totalBuildings?: string;
  totalFloors?: string;
  totalHouseholds?: string;
  remainingHouseholds?: string;

  // 옵션/메모/등기/구조
  options: string[];
  optionEtc?: string;
  publicMemo?: string;
  secretMemo?: string;
  registry?: Registry;
  unitLines?: UnitLine[];

  // 이미지
  images?: string[];
  imageCards?: ImageItem[][];
  fileItems?: ImageItem[];

  // 면적
  exclusiveArea?: string; // 전용
  realArea?: string; // 실평
  extraExclusiveAreas?: string[];
  extraRealAreas?: string[];
};

// --- Update DTO ---
export type UpdatePayload = {
  title?: string;
  address?: string;
  officeName?: string;
  officePhone?: string;
  officePhone2?: string;
  moveIn?: string;
  floor?: string;
  roomNo?: string;
  structure?: string;

  // 향
  aspect?: string;
  aspectNo?: string;
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;
  orientations?: OrientationRow[];

  // 가격/평점/주차
  salePrice?: string | number | null;
  listingGrade?: Grade;
  parkingType?: string;
  parkingCount?: string | number | null;

  // 설비/등급/날짜
  elevator?: "O" | "X";
  slopeGrade?: Grade;
  structureGrade?: Grade;
  completionDate?: string;

  // 단지 숫자
  totalBuildings?: string;
  totalFloors?: string;
  totalHouseholds?: string;
  remainingHouseholds?: string;

  // 옵션/메모/등기/구조
  options?: string[];
  optionEtc?: string;
  publicMemo?: string;
  secretMemo?: string;
  registry?: Registry;
  unitLines?: UnitLine[];
  images?: string[];

  // 면적
  exclusiveArea?: string;
  realArea?: string;
  extraExclusiveAreas?: string[];
  extraRealAreas?: string[];
};
