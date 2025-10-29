"use client";

import CompletionRegistrySection from "../../sections/CompletionRegistrySection/CompletionRegistrySection";
import type { Grade } from "@/features/properties/types/property-domain";

// 백엔드 enum과 동일
type BuildingType = "APT" | "OP" | "주택" | "근생";

/** YYYY-MM-DD 로 잘라서 반환(없으면 빈 문자열) */
const toYmd = (s?: string | null) =>
  typeof s === "string" && s.trim().length >= 10 ? s.slice(0, 10) : "";

/** 어떤 값이 와도 문자열로 표준화 (입력 중 숫자/빈값 대응) */
const toStr = (v: unknown) =>
  typeof v === "string" ? v : v == null ? "" : String(v);

/** 세터 안전 래퍼: date input이 요구하는 10자 이내만 반영 */
const clampYmdSetter = (set: (v: string) => void) => (v: string) => {
  const next = (v ?? "").slice(0, 10); // '' 또는 'YYYY-MM-DD'
  set(next);
};

export default function CompletionRegistryContainer({
  form,
}: {
  form: {
    completionDate?: string | null;
    setCompletionDate: (v: string) => void;

    salePrice?: string | number | null;
    setSalePrice: (v: string) => void;

    // ⛔️ 등기 관련 필드 제거됨
    // registryOne?: never;
    // setRegistryOne?: never;

    slopeGrade?: Grade;
    setSlopeGrade: (v?: Grade) => void;

    structureGrade?: Grade;
    setStructureGrade: (v?: Grade) => void;

    buildingType?: BuildingType | null;
    setBuildingType?: (v: BuildingType | null) => void;
  };
}) {
  // 안전 폴백
  const buildingType = (form as any).buildingType ?? null;
  const setBuildingType = ((form as any).setBuildingType ?? (() => {})) as (
    v: BuildingType | null
  ) => void;

  // 표기/입력용 값 정규화
  const normalizedCompletionDate = toYmd(form.completionDate);
  const normalizedSalePrice = toStr(form.salePrice);

  // ✅ date 세터 래핑: 10자 이내만 반영 (입력 중 깨짐 방지)
  const setCompletionDateSafe = clampYmdSetter(form.setCompletionDate);

  return (
    <CompletionRegistrySection
      // 준공일
      completionDate={normalizedCompletionDate}
      setCompletionDate={setCompletionDateSafe}
      // 가격
      salePrice={normalizedSalePrice}
      setSalePrice={form.setSalePrice}
      // 등급
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
