"use client";

import { useMemo, useState } from "react";

export function useParking() {
  // 표시용(문자열) & 개수
  const [parkingType, setParkingType] = useState<string | null>(null);
  const [parkingCount, setParkingCount] = useState<number | null>(null);

  const [parkingTypeId, setParkingTypeId] = useState<number | null>(null);
  const [registrationTypeId, setRegistrationTypeId] = useState<number | null>(
    null
  );

  const state = useMemo(
    () => ({
      parkingType,
      parkingCount,
      parkingTypeId,
      registrationTypeId,
    }),
    [parkingType, parkingCount, parkingTypeId, registrationTypeId]
  );

  const actions = useMemo(
    () => ({
      setParkingType,
      setParkingCount,
      setParkingTypeId,
      setRegistrationTypeId,
    }),
    []
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
