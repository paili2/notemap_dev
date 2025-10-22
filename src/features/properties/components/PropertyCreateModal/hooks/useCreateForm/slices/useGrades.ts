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

  const state = useMemo(
    () => ({
      completionDate,
      salePrice,
      registryOne,
      slopeGrade,
      structureGrade,
    }),
    [completionDate, salePrice, registryOne, slopeGrade, structureGrade]
  );

  const actions = useMemo(
    () => ({
      setCompletionDate,
      setSalePrice,
      setRegistryOne,
      setSlopeGrade,
      setStructureGrade,
    }),
    []
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
