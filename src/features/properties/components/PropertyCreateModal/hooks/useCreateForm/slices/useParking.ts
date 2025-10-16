"use client";

import { useMemo, useState } from "react";

export function useParking() {
  const [parkingType, setParkingType] = useState("");
  const [parkingCount, setParkingCount] = useState("");

  const state = useMemo(
    () => ({ parkingType, parkingCount }),
    [parkingType, parkingCount]
  );

  const actions = useMemo(() => ({ setParkingType, setParkingCount }), []);

  return useMemo(() => ({ state, actions }), [state, actions]);
}
