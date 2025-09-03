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

export type AspectRowLite = { no: number; dir: OrientationValue | "" };

// --- 공통 엔티티 ---
export type UnitLine = {
  rooms: number;
  baths: number;
  duplex: boolean;
  terrace: boolean;
  primary: string;
  secondary: string;
};
