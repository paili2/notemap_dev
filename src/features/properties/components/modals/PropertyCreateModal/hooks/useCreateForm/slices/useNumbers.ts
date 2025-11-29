"use client";

import { useMemo, useState } from "react";

export function useNumbers() {
  const [totalBuildings, setTotalBuildings] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [totalHouseholds, setTotalHouseholds] = useState("");
  const [remainingHouseholds, setRemainingHouseholds] = useState("");

  const state = useMemo(
    () => ({
      totalBuildings,
      totalFloors,
      totalHouseholds,
      remainingHouseholds,
    }),
    [totalBuildings, totalFloors, totalHouseholds, remainingHouseholds]
  );

  const actions = useMemo(
    () => ({
      setTotalBuildings,
      setTotalFloors,
      setTotalHouseholds,
      setRemainingHouseholds,
    }),
    []
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
