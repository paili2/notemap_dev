"use client";

import { AreaSet } from "@/features/properties/components/sections/AreaSetsSection/types";
import { useMemo, useState } from "react";

export function useAreaSets() {
  const [baseAreaSet, setBaseAreaSet] = useState<AreaSet>({
    title: "",
    exMinM2: "",
    exMaxM2: "",
    exMinPy: "",
    exMaxPy: "",
    realMinM2: "",
    realMaxM2: "",
    realMinPy: "",
    realMaxPy: "",
  });
  const [extraAreaSets, setExtraAreaSets] = useState<AreaSet[]>([]);

  const state = useMemo(
    () => ({ baseAreaSet, extraAreaSets }),
    [baseAreaSet, extraAreaSets]
  );
  const actions = useMemo(() => ({ setBaseAreaSet, setExtraAreaSets }), []);

  return useMemo(() => ({ state, actions }), [state, actions]);
}
