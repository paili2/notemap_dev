"use client";

import { useMemo, useState } from "react";

/**
 * 주차 관련 상태 훅
 * - parkingType: 표시용 문자열
 * - totalParkingSlots: 주차대수(숫자)
 * - parkingTypeId: 주차유형 ID
 * - registrationTypeId: 등록유형 ID
 */
export function useParking() {
  const [parkingType, setParkingType] = useState<string | null>(null);
  const [totalParkingSlots, setTotalParkingSlots] = useState<number | null>(
    null
  );
  const [parkingTypeId, setParkingTypeId] = useState<number | null>(null);
  const [registrationTypeId, setRegistrationTypeId] = useState<number | null>(
    null
  );

  const state = useMemo(
    () => ({
      parkingType,
      totalParkingSlots,
      parkingTypeId,
      registrationTypeId,
    }),
    [parkingType, totalParkingSlots, parkingTypeId, registrationTypeId]
  );

  const actions = useMemo(
    () => ({
      setParkingType,
      setTotalParkingSlots,
      setParkingTypeId,
      setRegistrationTypeId,
    }),
    []
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
