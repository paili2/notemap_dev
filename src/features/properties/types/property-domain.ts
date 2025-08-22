// 공용 도메인 타입 (수정/보기 모달 등에서 재사용)

// --- Registry ---
export const REGISTRY_LIST = ["주택", "APT", "OP", "도/생", "근/생"] as const;
export type Registry = (typeof REGISTRY_LIST)[number];

// --- Grade ---
export type Grade = "상" | "중" | "하";

// --- Orientation ---
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
  value: OrientationValue | "";
};

// --- 공통 엔티티 ---
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
