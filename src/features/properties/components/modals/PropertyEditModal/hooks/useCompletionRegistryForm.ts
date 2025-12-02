"use client";

import { useCallback, useMemo } from "react";

import type { CompletionRegistryFormSlice } from "@/features/properties/hooks/useEditForm/types";
import type {
  Grade,
  BuildingType,
} from "@/features/properties/types/property-domain";

type UseCompletionRegistryFormArgs = {
  form: any; // useEditForm 리턴값
};

export function useCompletionRegistryForm({
  form,
}: UseCompletionRegistryFormArgs): CompletionRegistryFormSlice {
  const setCompletionDate = useCallback(
    (v: string) => {
      console.log("[Completion] date change:", v);
      form?.setCompletionDate?.(v);
    },
    [form]
  );

  const setMinRealMoveInCost = useCallback(
    (v: string | number | null) => {
      const s = v == null ? "" : String(v);
      console.log("[Completion] minRealMoveInCost change:", v, "→", s);
      // 내부에서는 salePrice 한 필드로 관리
      form?.setSalePrice?.(s);
    },
    [form]
  );

  const setSalePrice = useCallback(
    (v: string | number | null) => {
      const s = v == null ? "" : String(v);
      console.log("[Completion] salePrice change:", v, "→", s);
      form?.setSalePrice?.(s);
    },
    [form]
  );

  const setElevator = useCallback(
    (v: any) => {
      console.log("[Completion] elevator change:", v);
      form?.setElevator?.(v);
    },
    [form]
  );

  const setSlopeGrade = useCallback(
    (v?: Grade) => {
      console.log("[Completion] slopeGrade change:", v);
      form?.setSlopeGrade?.(() => v);
    },
    [form]
  );

  const setStructureGrade = useCallback(
    (v?: Grade) => {
      console.log("[Completion] structureGrade change:", v);
      form?.setStructureGrade?.(() => v);
    },
    [form]
  );

  /** ✅ UI에서 전달되는 enum 그대로 사용 (추가 정규화 X) */
  const setBuildingType = useCallback(
    (v: BuildingType | null) => {
      console.log("[Completion] buildingType change:", v);
      form?.setBuildingType?.(v);
    },
    [form]
  );

  const setRebateText = useCallback(
    (v: string | null) => {
      const s = v ?? "";
      console.log("[Completion] rebateText change:", v, "→", s);
      form?.setRebateText?.(s);
    },
    [form]
  );

  const completionRegistryForm = useMemo<CompletionRegistryFormSlice>(
    () => ({
      // ─── 준공일 ───
      completionDate: form?.completionDate ?? "",
      setCompletionDate,

      // ✅ 최저 실입 (타입에서는 minRealMoveInCost 라고 부르지만 내부는 salePrice 재사용)
      minRealMoveInCost: form?.salePrice,
      setMinRealMoveInCost,

      // (기존 필드도 유지)
      salePrice: form?.salePrice,
      setSalePrice,

      // ✅ 엘리베이터
      elevator: form?.elevator,
      setElevator,

      // 경사도
      slopeGrade: form?.slopeGrade,
      setSlopeGrade,

      // 구조 등급
      structureGrade: form?.structureGrade,
      setStructureGrade,

      // ✅ 등기/건물 타입: 이미 useEditForm에서 정규화된 enum 값을 그대로 씀
      buildingType: (form?.buildingType ?? null) as BuildingType | null,
      setBuildingType,

      // ⭐ 리베이트 텍스트
      rebateText: form?.rebateText ?? "",
      setRebateText,
    }),
    [
      form?.completionDate,
      form?.salePrice,
      form?.elevator,
      form?.slopeGrade,
      form?.structureGrade,
      form?.buildingType,
      form?.rebateText,
      setCompletionDate,
      setMinRealMoveInCost,
      setSalePrice,
      setElevator,
      setSlopeGrade,
      setStructureGrade,
      setBuildingType,
      setRebateText,
    ]
  );

  return completionRegistryForm;
}
