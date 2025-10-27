import { ImageItem } from "./media";
import { Grade, OrientationRow, Registry, UnitLine } from "./property-domain";

/* ------------------------------------------------------------------ */
/* Create DTO                                                          */
/* ------------------------------------------------------------------ */
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

  // ✅ 빌딩/등록/주차 타입 (id는 number 권장)
  buildingType?: string;
  registrationTypeId?: number;
  parkingTypeId?: number;

  // 향
  aspect?: string;
  aspectNo?: string;
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;
  orientations?: OrientationRow[];

  // 가격/평점/주차
  salePrice?: string; // 매매가 (서버가 number 허용이면 string | number 로 확장)
  parkingType?: string; // 예: "자주식", "답사지 확인"
  /** ✅ 백엔드 스펙에 맞춘 필드명: 총 주차 대수 (int, 없으면 null) */
  totalParkingSlots?: number | null;

  // 설비/등급/날짜
  listingStars?: number;
  elevator?: "O" | "X";
  slopeGrade?: Grade;
  structureGrade?: Grade;
  completionDate?: string;

  // 단지 숫자 (유연성 위해 number | string 허용)
  totalBuildings?: number | string;
  totalFloors?: number | string;
  totalHouseholds?: number | string;
  remainingHouseholds?: number | string;

  contactMainLabel?: string;
  contactMainPhone?: string;
  contactSubLabel?: string;
  contactSubPhone?: string;

  // 옵션/메모/등기/구조
  options: string[];
  optionEtc?: string;
  publicMemo?: string | null;
  secretMemo?: string | null; // ✅ 통일
  /** @deprecated use secretMemo */
  privateMemo?: string | null; // 과거 호환

  registry?: Registry;
  unitLines?: UnitLine[];

  // 이미지
  images?: string[];
  imageCards?: ImageItem[][];
  fileItems?: ImageItem[];

  // 면적
  exclusiveArea?: string;
  realArea?: string;
  extraExclusiveAreas?: string[];
  extraRealAreas?: string[];
};

/* ------------------------------------------------------------------ */
/* Update DTO                                                          */
/* ------------------------------------------------------------------ */
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

  // ✅ 빌딩/등록/주차 타입
  buildingType?: string;
  registrationTypeId?: number;
  parkingTypeId?: number;

  // 향
  aspect?: string;
  aspectNo?: string;
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;
  orientations?: OrientationRow[];

  // 가격/평점/주차
  salePrice?: string | number | null;
  listingStars?: number | null; // Create와 동일 키
  parkingType?: string;
  /** ✅ 백엔드 스펙에 맞춘 필드명: 총 주차 대수 (int, 없으면 null) */
  totalParkingSlots?: number | null;

  // 설비/등급/날짜
  elevator?: "O" | "X";
  slopeGrade?: Grade;
  structureGrade?: Grade;
  completionDate?: string;

  // 단지 숫자 (유연성 위해 number | string 허용)
  totalBuildings?: number | string;
  totalFloors?: number | string;
  totalHouseholds?: number | string;
  remainingHouseholds?: number | string;

  // 옵션/메모/등기/구조
  options?: string[];
  optionEtc?: string;
  publicMemo?: string | null;
  secretMemo?: string | null;
  registry?: Registry;
  unitLines?: UnitLine[];
  images?: string[];

  // 면적
  exclusiveArea?: string;
  realArea?: string;
  extraExclusiveAreas?: string[];
  extraRealAreas?: string[];
};
