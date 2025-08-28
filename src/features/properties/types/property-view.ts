import {
  Grade,
  Registry,
  UnitLine,
  OrientationRow,
  Visibility,
  DealStatus,
} from "@/features/properties/types/property-domain";
import { ImageItem } from "./media";

export type PropertyViewDetails = {
  id?: string;
  title?: string;
  address?: string;

  officeName?: string;
  officePhone?: string;
  officePhone2?: string;

  moveIn?: string;
  floor?: string;
  roomNo?: string;
  structure?: string;

  // 방향
  aspect?: string;
  aspectNo?: string;
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;
  orientations?: OrientationRow[];

  // 매물/주차
  listingGrade?: Grade; // 매물평점
  parkingType?: string | null;
  parkingCount?: string | number;

  elevator?: "O" | "X";

  // 등급들
  slopeGrade?: Grade;
  structureGrade?: Grade;

  // 숫자 정보
  totalBuildings?: number | string | null;
  totalFloors?: number | string | null;
  totalHouseholds?: number | string | null;
  remainingHouseholds?: number | string | null;

  // 메모/기타
  options?: string[];
  optionEtc?: string;
  publicMemo?: string;
  secretMemo?: string;

  registry?: Registry;
  unitLines?: UnitLine[];
  images?: ImageItem[] | string[];
  imageCards?: ImageItem[][];
  fileItems?: ImageItem[];

  completionDate?: string | Date | null;
  salePrice?: string | number | null;

  exclusiveArea?: string;
  realArea?: string;
  extraExclusiveAreas?: string[];
  extraRealAreas?: string[];

  // (선택) 유형/메타
  type?: string;

  // 메타 표시용(선택)
  createdByName?: string;
  createdAt?: string;
  inspectedByName?: string;
  inspectedAt?: string;
  updatedByName?: string;
  updatedAt?: string;

  status?: Visibility;
  dealStatus?: DealStatus;

  listingStars: number;
};
