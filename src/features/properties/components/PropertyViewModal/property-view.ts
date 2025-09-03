import {
  Grade,
  Registry,
  UnitLine,
  OrientationRow,
} from "@/features/properties/types/property-domain";
import { ImageItem } from "../../types/media";

/** 저장 전용 레퍼런스 타입(IndexedDB 키 참조) */
export type ImageRefLite = {
  idbKey: string;
  name?: string;
  caption?: string;
};

export type PropertyViewDetails = {
  id?: string;
  listingGrade?: Grade;
  title?: string;
  elevator?: "O" | "X";
  address?: string;

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

  // 주차
  parkingType?: string | null;
  parkingCount?: string | number;

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

  // ====== 저장 전용(로컬스토리지 경량화용) ======
  /** 카드별 이미지의 IndexedDB 레퍼런스 배열 */
  _imageCardRefs?: ImageRefLite[][];
  /** 파일 패널(세로열) 이미지의 IndexedDB 레퍼런스 배열 */
  _fileItemRefs?: ImageRefLite[];

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

  listingStars: number;
};

export type AnyImageRef =
  | string
  | { url?: string; name?: string; caption?: string }
  | { idbKey: string; name?: string; caption?: string };

export type UIImg = { url: string; name?: string; caption?: string };

export type MemoTab = "KN" | "R";
