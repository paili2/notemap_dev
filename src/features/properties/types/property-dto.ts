import {
  DealStatus,
  Grade,
  OrientationRow,
  Registry,
  UnitLine,
  Visibility,
} from "./property-domain";

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
  aspect?: string;
  aspectNo?: string;
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;
  jeonsePrice?: string;

  elevator?: "O" | "X";

  slopeGrade?: Grade; // ← 통일
  structureGrade?: Grade; // ← 통일

  totalBuildings?: string; // 총 개동
  totalFloors?: string; // 총 층수
  totalHouseholds?: string; // 총 세대수
  remainingHouseholds?: string; // 잔여세대

  options: string[];
  optionEtc?: string;

  publicMemo?: string;
  secretMemo?: string;

  registry?: Registry;

  unitLines?: UnitLine[];

  images: string[]; // object URL들

  parkingType?: string; // 예: "자주식", "답사지 확인"
  parkingGrade?: Grade | undefined; // 별점→등급 매핑 결과
  completionDate?: string; // "2024.04.14" 같은 문자열
  exclusiveArea?: string; // 전용
  realArea?: string; // 실평

  status: Visibility; // 게시상태
  dealStatus: DealStatus; // 거래상태
  orientations?: OrientationRow[];
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
  aspect?: string;
  aspectNo?: string;
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;
  jeonsePrice?: string;

  parkingGrade?: Grade;
  elevator?: "O" | "X";
  slopeGrade?: Grade;
  structureGrade?: Grade;
  totalBuildings?: string;
  totalFloors?: string;
  remainingHouseholds?: string;
  totalHouseholds?: string;

  options?: string[];
  optionEtc?: string;
  publicMemo?: string;
  secretMemo?: string;
  registry?: Registry;
  unitLines?: UnitLine[];
  images?: string[];

  parkingType?: string;
  completionDate?: string;

  exclusiveArea?: string; // 전용
  realArea?: string; // 실평
  deed?: "O" | "X";

  orientations?: OrientationRow[];

  status?: Visibility;
  dealStatus?: DealStatus;
};
