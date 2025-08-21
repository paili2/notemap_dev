// 공용 도메인 타입 (수정/보기 모달 등에서 재사용)

export const REGISTRY_LIST = ["주택", "APT", "OP", "도/생", "근/생"] as const;
export type Registry = (typeof REGISTRY_LIST)[number];

export type UnitLine = {
  rooms: number;
  baths: number;
  duplex: boolean;
  terrace: boolean;
  primary: string;
  secondary: string;
};

export type Visibility = "공개" | "보류" | "비공개";
export type DealStatus = "분양중" | "예약중" | "계약중" | "계약완료";

/** 수정모달에서 쓰는 뷰 아이템 형태(현재 구조 유지) */
export type PropertyViewItem = {
  id?: string;
  title: string;
  address?: string;

  status?: Visibility;
  dealStatus?: DealStatus;
  type?: string;

  jeonsePrice?: string;
  elevator?: "O" | "X";

  slopeGrade?: "상" | "중" | "하";
  structureGrade?: "상" | "중" | "하";

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

/** 수정모달에서 서버로 보낼 업데이트 페이로드 */
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
  parkingGrade?: "상" | "중" | "하";
  elevator?: "O" | "X";
  slopeGrade?: "상" | "중" | "하";
  structureGrade?: "상" | "중" | "하";
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

  parkingType?: string; // ← 추가
  completionDate?: string; // ← 추가

  exclusiveArea?: string; // 전용
  realArea?: string; // 실평
  deed?: "O" | "X";

  orientations?: OrientationRow[]; // ← 향 배열 쓰면 추가

  status?: Visibility;
  dealStatus?: DealStatus;
};

export type Grade = "상" | "중" | "하";

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

  slopeGrade?: "상" | "중" | "하";
  structureGrade?: "상" | "중" | "하";

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
  realArea?: string;

  status: Visibility; // ← 게시상태
  dealStatus: DealStatus; // ← 거래상태
  orientations?: OrientationRow[];
};

// 뷰모달 전용 상세 타입 (뷰에서 추가로 쓰는 필드만 확장)
export type PropertyViewDetails = PropertyViewItem & {
  // 향(방향) - 1/2/3호별
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;

  // 주차/준공
  parkingType?: string;
  parkingGrade?: Grade | undefined;
  completionDate?: string | Date;
  exclusiveArea?: string;
  realArea?: string;

  // 숫자 정보
  totalBuildings?: string | number;
  totalFloors?: string | number;
  totalHouseholds?: string | number;
  remainingHouseholds?: string | number;

  registry?: Registry;

  aspect?: string; // 예: "남동"
  aspectNo?: string; // 예: "1호"

  status: Visibility; // ← 게시상태
  dealStatus: DealStatus; // ← 거래상태

  orientations?: OrientationRow[];
};

// --- 향(orientation) 타입 추가 ---

export type OrientationValue =
  | "동"
  | "서"
  | "남"
  | "북"
  | "남동"
  | "남서"
  | "북동"
  | "북서"
  | "동서"
  | "남북";

export type OrientationRow = {
  ho: number; // 호수 (1, 2, 3 …)
  value: OrientationValue | ""; // 선택값 (없음은 빈 문자열)
};
