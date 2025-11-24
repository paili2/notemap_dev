"use client";

import { useMemo, useState } from "react";
import type {
  Registry,
  Grade,
} from "@/features/properties/types/property-domain";

export function useGrades() {
  const [completionDate, setCompletionDate] = useState("");
  const [salePrice, setSalePrice] = useState("");
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
      registryOne,
      slopeGrade,
      structureGrade,
      isNew,
      isOld,
    }),
    [
      completionDate,
      salePrice,
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
