import { Grade, Registry } from "@/features/properties/types/property-domain";

export type BuildingType = "APT" | "OP" | "주택" | "근생"; // 백엔드 스펙에 맞춘 타입

export interface CompletionRegistrySectionProps {
  // 준공/실입
  completionDate: string;
  setCompletionDate: (v: string) => void;
  salePrice: string;
  setSalePrice: (v: string) => void;

  // 등기
  REGISTRY_LIST: ReadonlyArray<Registry>;
  registry?: Registry;
  setRegistry: (v: Registry | undefined) => void;

  // 경사/구조 등급
  slopeGrade?: Grade;
  setSlopeGrade: (v: Grade | undefined) => void;
  structureGrade?: Grade;
  setStructureGrade: (v: Grade | undefined) => void;

  buildingType: BuildingType | null;
  setBuildingType: (v: BuildingType | null) => void;
}
