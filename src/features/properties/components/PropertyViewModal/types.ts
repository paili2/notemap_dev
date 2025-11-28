import {
  Grade,
  Registry,
  UnitLine,
  OrientationRow,
} from "@/features/properties/types/property-domain";
import type { PinKind } from "@/features/pins/types";
import { ImageItem } from "../../types/media";

/** 저장 전용 레퍼런스 타입(IndexedDB 키 참조) */
type ImageRefLite = {
  idbKey: string;
  name?: string;
  caption?: string;
};

/** 🔹 생성자/답사자/수정자 정보 */
export type PropertyViewPersonInfo = {
  id: string;
  name: string | null;
};

/* ✅ 구조별 입력(뷰 전용) */
export type UnitView = {
  rooms: number;
  baths: number;
  hasLoft: boolean;
  hasTerrace: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
};

export type PropertyViewDetails = {
  id?: string;

  // 메타
  listingGrade?: Grade;

  /** ✅ 서버 원본: "1"~"5" | "" (미선택) */
  parkingGrade?: "" | "1" | "2" | "3" | "4" | "5";

  /** ✅ 별 표시용 숫자(0~5). 어댑터에서 parkingGrade → 숫자로 채워줌 */
  listingStars?: number;

  /** ✅ 핀 종류(서버 badge 역매핑 결과). 없을 수 있음 */
  pinKind?: PinKind;

  title?: string;
  elevator?: "O" | "X";
  address?: string;

  // 연락처
  officePhone?: string;
  officePhone2?: string;

  // 기본/기타
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
  /** ✅ 표준 키: 총 주차 대수 (표시/로직은 이 키만 사용) */
  totalParkingSlots?: number | string | null;
  /** ⛔️ 레거시: 과거 데이터 호환용. 가능하면 사용 금지 (읽기만) */
  parkingCount?: string | number;

  // 등급들
  slopeGrade?: Grade;
  structureGrade?: Grade;

  // 숫자 정보
  totalBuildings?: number | string | null;
  totalFloors?: number | string | null;
  totalHouseholds?: number | string | null;
  remainingHouseholds?: number | string | null;

  // 메모/옵션
  options?: string[];
  optionEtc?: string;
  publicMemo?: string;
  secretMemo?: string;

  // 등기/날짜/금액
  registry?: Registry;
  completionDate?: string | Date | null;

  /** ⛔️ 레거시: 뷰에서는 사용하지 않음(남겨두되 표시 X) */
  salePrice?: string | number | null;

  /** ✅ 최저 실입(정수 금액, 만원 단위 등) */
  minRealMoveInCost?: number | null;

  // 면적 요약
  exclusiveArea?: string;
  realArea?: string;
  extraExclusiveAreas?: string[];
  extraRealAreas?: string[];
  baseAreaTitle?: string;
  extraAreaTitles?: string[];

  // 구조
  /** ⛔️ 레거시(구조 라인) */
  unitLines?: UnitLine[];
  /** ✅ 신버전(구조별 입력) */
  units?: UnitView[];

  // 미디어
  images?: ImageItem[] | string[];
  imageCards?: ImageItem[][];
  fileItems?: ImageItem[];

  // ====== 저장 전용(로컬스토리지 경량화용) ======
  /** 카드별 이미지의 IndexedDB 레퍼런스 배열 */
  _imageCardRefs?: ImageRefLite[][];
  /** 파일 패널(세로열) 이미지의 IndexedDB 레퍼런스 배열 */
  _fileItemRefs?: ImageRefLite[];

  // (선택) 유형/메타
  type?: string;

  // 메타 표시용(선택)

  /** ✅ 서버에서 내려오는 사람 정보(선호) */
  creator?: PropertyViewPersonInfo | null;
  surveyor?: PropertyViewPersonInfo | null;
  lastEditor?: PropertyViewPersonInfo | null;

  /** ✅ 서버 생성/수정/답사 일시 */
  createdAt?: string;
  updatedAt?: string;
  surveyedAt?: string | null;

  /** ⛔️ 레거시: 이름만 별도로 표시하고 싶을 때 사용 (가능하면 위 creator/surveyor/lastEditor 사용) */
  createdByName?: string;
  inspectedByName?: string;
  updatedByName?: string;

  /** ✅ 신축/구옥: 서버 GET 그대로 표시 전용 */
  ageType?: "NEW" | "OLD" | null;
  // isNew?: boolean | null;
  // isOld?: boolean | null;
  // /** 서버가 문자열로 줄 때 대비 (예: "NEW" | "OLD") */
  // buildingAgeType?: "NEW" | "OLD" | "" | null;
};

export type UIImg = { url: string; name?: string; caption?: string };
export type MemoTab = "KN" | "R";
