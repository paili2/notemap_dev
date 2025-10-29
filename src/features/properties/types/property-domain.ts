/* ───────── Registry(등기) ─────────
 * 등기 상태는 건물유형과 무관합니다.
 * 프로젝트 정책에 맞춰 라벨은 자유롭게 바꿔도 되지만,
 * 여기서는 최소 3상태로 분리합니다.
 */
export const REGISTRY_LIST = ["확인필요", "완료", "미완료"] as const;
export type Registry = (typeof REGISTRY_LIST)[number];

/* ───────── Grade ───────── */
export type Grade = "상" | "중" | "하";

/* ───────── Building Type (백엔드 스펙) ─────────
 * 서버와 1:1 대응하는 enum 값만 포함합니다.
 */
export const BUILDING_TYPES = ["APT", "OP", "주택", "근생"] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

/* ───────── (옵션) UI 라벨 호환 ─────────
 * 과거에 UI에서 사용하던 라벨(예: "도/생", "근/생")과의 호환을 위해 제공합니다.
 * 컴포넌트가 이 라벨 배열을 그대로 옵션으로 쓰고 있다면,
 * 아래 normalize 함수로 백엔드 enum으로 변환하세요.
 */
export const BUILDING_TYPE_LABELS = [
  "주택",
  "APT",
  "OP",
  "도/생",
  "근/생",
] as const;
export type BuildingTypeLabel = (typeof BUILDING_TYPE_LABELS)[number];

/** 라벨 → 백엔드 enum 매핑 (필요 시 확장) */
export function normalizeBuildingTypeLabelToEnum(
  v: BuildingTypeLabel | string | null | undefined
): BuildingType | null {
  const s = String(v ?? "").trim();
  // 라벨이 이미 백엔드 enum이면 그대로
  if ((BUILDING_TYPES as readonly string[]).includes(s))
    return s as BuildingType;

  // 과거/대체 라벨 매핑
  if (s === "도/생") return "근생"; // 도생(도시형생활주택) → 근생으로 수렴(정책에 맞게 수정 가능)
  if (s === "근/생") return "근생";

  return null;
}

/* ───────── Orientation ───────── */
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

/* ───────── 공통 엔티티 ───────── */
export type UnitLine = {
  rooms: number;
  baths: number;
  duplex: boolean;
  terrace: boolean;
  primary: string;
  secondary: string;
};
