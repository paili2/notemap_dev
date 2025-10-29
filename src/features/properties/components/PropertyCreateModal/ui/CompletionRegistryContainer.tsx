"use client";
import CompletionRegistrySection from "../../sections/CompletionRegistrySection/CompletionRegistrySection";
import {
  REGISTRY_LIST,
  type Grade,
  type Registry,
} from "@/features/properties/types/property-domain";

// 백엔드 enum과 동일
type BuildingType = "APT" | "OP" | "주택" | "근생";

// YYYY-MM-DD 로 잘라서 반환(없으면 빈 문자열)
const toYmd = (s?: string | null) =>
  typeof s === "string" && s.length >= 10 ? s.slice(0, 10) : "";

// 어떤 값이 와도 문자열로 표준화
const toStr = (v: unknown) =>
  typeof v === "string" ? v : v == null ? "" : String(v);

export default function CompletionRegistryContainer({
  form,
  REGISTRY_LIST: LIST = REGISTRY_LIST,
}: {
  form: {
    completionDate?: string | null;
    setCompletionDate: (v: string) => void;
    salePrice?: string | number | null;
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
  // 안전 폴백
  const buildingType = (form as any).buildingType ?? null;
  const setBuildingType = ((form as any).setBuildingType ?? (() => {})) as (
    v: BuildingType | null
  ) => void;

  // 표기/입력용 값 정규화
  const normalizedCompletionDate = toYmd(form.completionDate);
  const normalizedSalePrice = toStr(form.salePrice);

  return (
    <CompletionRegistrySection
      // ✅ 준공일: YYYY-MM-DD로 잘라서 전달
      completionDate={normalizedCompletionDate}
      setCompletionDate={form.setCompletionDate}
      // ✅ 가격: 문자열로 표준화하여 전달
      salePrice={normalizedSalePrice}
      setSalePrice={form.setSalePrice}
      // 등기/등급
      REGISTRY_LIST={LIST}
      registry={form.registryOne}
      setRegistry={form.setRegistryOne}
      slopeGrade={form.slopeGrade}
      setSlopeGrade={form.setSlopeGrade}
      structureGrade={form.structureGrade}
      setStructureGrade={form.setStructureGrade}
      // 건물유형
      buildingType={buildingType}
      setBuildingType={setBuildingType}
    />
  );
}
