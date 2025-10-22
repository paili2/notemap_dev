"use client";
import CompletionRegistrySection from "../../sections/CompletionRegistrySection/CompletionRegistrySection";
import {
  REGISTRY_LIST,
  type Grade,
  type Registry,
} from "@/features/properties/types/property-domain";

// 백엔드 enum과 동일
type BuildingType = "APT" | "OP" | "주택" | "근생";

export default function CompletionRegistryContainer({
  form,
  REGISTRY_LIST: LIST = REGISTRY_LIST,
}: {
  form: {
    completionDate: string;
    setCompletionDate: (v: string) => void;
    salePrice: string;
    setSalePrice: (v: string) => void;
    registryOne?: Registry;
    setRegistryOne: (v?: Registry) => void;
    slopeGrade?: Grade;
    setSlopeGrade: (v?: Grade) => void;
    structureGrade?: Grade;
    setStructureGrade: (v?: Grade) => void;
    buildingType?: BuildingType | null;
    setBuildingType?: (v: BuildingType | null) => void;
  };
  REGISTRY_LIST?: typeof REGISTRY_LIST;
}) {
  // 브릿지: 없을 수도 있으니 안전 폴백
  const buildingType = (form as any).buildingType ?? null;
  const setBuildingType = ((form as any).setBuildingType ?? (() => {})) as (
    v: BuildingType | null
  ) => void;

  return (
    <CompletionRegistrySection
      completionDate={form.completionDate}
      setCompletionDate={form.setCompletionDate}
      salePrice={form.salePrice}
      setSalePrice={form.setSalePrice}
      REGISTRY_LIST={LIST}
      registry={form.registryOne}
      setRegistry={form.setRegistryOne}
      slopeGrade={form.slopeGrade}
      setSlopeGrade={form.setSlopeGrade}
      structureGrade={form.structureGrade}
      setStructureGrade={form.setStructureGrade}
      buildingType={buildingType}
      setBuildingType={setBuildingType}
    />
  );
}
