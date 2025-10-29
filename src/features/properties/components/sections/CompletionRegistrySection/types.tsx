// CompletionRegistrySection/types.ts
import type {
  Grade,
  BuildingType,
} from "@/features/properties/types/property-domain";

export type CompletionRegistrySectionProps = {
  // 준공일
  completionDate?: string | null;
  setCompletionDate: (v: string) => void;

  // 최저실입(만원)
  salePrice?: string | number | null;
  setSalePrice: (v: string) => void;

  // 경사도/구조 등급
  slopeGrade?: Grade;
  setSlopeGrade: (v?: Grade) => void;
  structureGrade?: Grade;
  setStructureGrade: (v?: Grade) => void;

  // 건물유형 (백엔드 enum)
  buildingType?: BuildingType | null;
  setBuildingType?: (v: BuildingType | null) => void;
};
