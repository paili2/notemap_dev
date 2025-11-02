import { CreatePinAreaGroupDto } from "./area-group-dto";
import { ImageItem } from "./media";
import { Grade, OrientationRow, Registry, UnitLine } from "./property-domain";

/* ------------------------------------------------------------------ */
/* Units (구조별 입력) DTO                                             */
/* ------------------------------------------------------------------ */
export type UnitsDto = {
  /** 방 개수 (정수, 0 이상, 미입력 시 null) */
  rooms?: number | null;
  /** 욕실 개수 (정수, 0 이상, 미입력 시 null) */
  baths?: number | null;
  /** 다락 유무 */
  hasLoft?: boolean | null;
  /** 테라스 유무 */
  hasTerrace?: boolean | null;
  /** 최소 가격 (정수, 0 이상, 미입력 시 null) */
  minPrice?: number | null;
  /** 최대 가격 (정수, 0 이상, 미입력 시 null) */
  maxPrice?: number | null;
};

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
  /** ✅ 백엔드 스펙: [{ direction: "남향" }, ...] 또는 문자열 혼용 허용 */
  directions?: Array<{ direction: string } | string>;

  // 가격/평점/주차
  // salePrice?: string; // 매매가 (서버가 number 허용이면 string | number 로 확장)
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

  /** ✅ UI 보존용 (폼의 원본 라인) */
  unitLines?: UnitLine[];

  /** ✅ 구조별 입력(units) — 서버 전송용: 항상 배열(빈 배열 허용) */
  units?: UnitsDto[];

  // 이미지
  images?: string[];
  imageCards?: ImageItem[][];
  fileItems?: ImageItem[];

  // 면적(레거시 문자열)
  exclusiveArea?: string;
  realArea?: string;
  extraExclusiveAreas?: string[];
  extraRealAreas?: string[];

  /** ✅ 신규 스펙: 면적 그룹 */
  areaGroups?: CreatePinAreaGroupDto[];

  /** ✅ 임시핀 매칭/좌표(선택) */
  pinDraftId?: number | string | null;
  lat?: number;
  lng?: number;
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
  /** ✅ 업데이트도 동일 형태 허용 */
  directions?: Array<{ direction: string } | string>;

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

  /** ✅ UI 보존용 (폼의 원본 라인) */
  unitLines?: UnitLine[];

  /** ✅ 구조별 입력(units) — 서버 전송용: 항상 배열(빈 배열 허용) */
  units?: UnitsDto[];

  images?: string[];

  // 면적(레거시 문자열)
  exclusiveArea?: string;
  realArea?: string;
  extraExclusiveAreas?: string[];
  extraRealAreas?: string[];

  /** ✅ 신규 스펙: 면적 그룹 */
  areaGroups?: CreatePinAreaGroupDto[];

  /** ✅ 임시핀/좌표도 선택 허용(패치성 업데이트 대비) */
  pinDraftId?: number | string | null;
  lat?: number;
  lng?: number;
};
