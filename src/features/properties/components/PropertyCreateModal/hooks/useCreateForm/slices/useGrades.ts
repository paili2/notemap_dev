"use client";

import { useMemo, useState } from "react";
import type {
  Registry,
  Grade,
} from "@/features/properties/types/property-domain";

export function useGrades() {
  const [completionDate, setCompletionDate] = useState("");
  const [salePrice, setSalePrice] = useState("");

  // ✅ 신규: 최저 실입 / 리베이트
  const [minRealMoveInCost, setMinRealMoveInCost] = useState<
    number | string | null
  >(null);
  const [rebateText, setRebateText] = useState<string | null>(null);

  const [registryOne, setRegistryOne] = useState<Registry | undefined>();
  const [slopeGrade, setSlopeGrade] = useState<Grade | undefined>();
  const [structureGrade, setStructureGrade] = useState<Grade | undefined>();

  // 🔹 신축 / 구옥: 기본은 "무선택" → null
  const [isNew, setIsNew] = useState<boolean | null>(null);
  const [isOld, setIsOld] = useState<boolean | null>(null);

  const state = useMemo(
    () => ({
      completionDate,
      salePrice,
      minRealMoveInCost, // ✅ 추가
      rebateText, // ✅ 추가
      registryOne,
      slopeGrade,
      structureGrade,
      isNew,
      isOld,
    }),
    [
      completionDate,
      salePrice,
      minRealMoveInCost, // ✅ 추가
      rebateText, // ✅ 추가
      registryOne,
      slopeGrade,
      structureGrade,
      isNew,
      isOld,
    ]
  );

  const actions = useMemo(
    () => ({
      setCompletionDate,
      setSalePrice,
      setMinRealMoveInCost,
      setRebateText,
      setRegistryOne,
      setSlopeGrade,
      setStructureGrade,
      setIsNew,
      setIsOld,
    }),
    []
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
