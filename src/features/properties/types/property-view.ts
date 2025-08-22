import {
  DealStatus,
  Grade,
  OrientationRow,
  Registry,
  UnitLine,
  Visibility,
} from "./property-domain";

// --- View (수정모달에서 쓰는 아이템) ---
export type PropertyViewItem = {
  id?: string;
  title: string;
  address?: string;

  status?: Visibility;
  dealStatus?: DealStatus;
  type?: string;

  jeonsePrice?: string;
  elevator?: "O" | "X";

  slopeGrade?: Grade;
  structureGrade?: Grade;

  options?: string[];
  optionEtc?: string;
  registry?: Registry;

  unitLines?: UnitLine[];

  publicMemo?: string;
  secretMemo?: string;

  images?: string[];

  officePhone?: string;
  officePhone2?: string;

  createdByName?: string;
  createdAt?: string | Date;
  inspectedByName?: string;
  inspectedAt?: string | Date;
  updatedByName?: string;
  updatedAt?: string | Date;

  orientations?: OrientationRow[];
  exclusiveArea?: string; // 전용
  realArea?: string; // 실평
  deed?: "O" | "X";
};

// --- View(상세) ---
export type PropertyViewDetails = PropertyViewItem & {
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;

  parkingType?: string;
  parkingGrade?: Grade | undefined;
  completionDate?: string | Date;
  exclusiveArea?: string;
  realArea?: string;

  totalBuildings?: string | number;
  totalFloors?: string | number;
  totalHouseholds?: string | number;
  remainingHouseholds?: string | number;

  registry?: Registry;

  aspect?: string; // 예: "남동"
  aspectNo?: string; // 예: "1호"

  status: Visibility;
  dealStatus: DealStatus;

  orientations?: OrientationRow[];
};
