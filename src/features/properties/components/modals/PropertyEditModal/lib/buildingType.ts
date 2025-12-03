import {
  type BuildingType,
  type BuildingTypeLabel,
  BUILDING_TYPES,
  normalizeBuildingTypeLabelToEnum,
} from "@/features/properties/types/property-domain";

/**
 * UI 라벨 / 서버 enum / 아무 문자열이나 받아서
 * 서버 enum(BuildingType)으로만 정규화
 *
 * - "APT" 같이 이미 enum 값이어도 그대로 통과
 * - "아파트" / "오피스텔" / "근/생" / "도/생" 등 라벨도 지원
 * - 인식 못 하면 null
 */
export function normalizeBuildingType(
  v: BuildingType | BuildingTypeLabel | string | null | undefined
): BuildingType | null {
  const s = String(v ?? "").trim();
  if (!s) return null;

  // 이미 서버 enum이면 그대로
  if ((BUILDING_TYPES as readonly string[]).includes(s)) {
    return s as BuildingType;
  }

  // 그 외에는 라벨 → enum 헬퍼에 위임
  return normalizeBuildingTypeLabelToEnum(s as BuildingTypeLabel | string);
}

/** (옵션) 두 값이 같은 건물유형인지 비교할 때 사용 */
export function isSameBuildingType(a: any, b: any): boolean {
  return normalizeBuildingType(a) === normalizeBuildingType(b);
}
