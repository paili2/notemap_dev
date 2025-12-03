"use client";

import { useCallback, useMemo } from "react";

export type ParkingFormSlice = {
  parkingType: string | null;
  setParkingType: (v: string | null) => void;

  totalParkingSlots: string | null;
  setTotalParkingSlots: (v: string | null) => void;
};

type UseParkingFormArgs = {
  form: any; // useEditForm 리턴값
};

export function useParkingForm({ form }: UseParkingFormArgs): ParkingFormSlice {
  // Parking setters 프록시 + 로그
  const setParkingType = useCallback(
    (v: string | null) => {
      console.log("[Parking] type change:", v);
      form?.setParkingType?.(v);
    },
    [form]
  );

  const setTotalParkingSlots = useCallback(
    (v: string | null) => {
      console.log("[Parking] total slots change:", v);
      form?.setTotalParkingSlots?.(v ?? "");
    },
    [form]
  );

  const parkingForm = useMemo<ParkingFormSlice>(
    () => ({
      parkingType: form?.parkingType ?? null,
      setParkingType,

      totalParkingSlots: (() => {
        const raw = form?.totalParkingSlots;
        if (raw == null) return null;
        const s = String(raw).trim();
        return s === "" ? null : s;
      })(),
      setTotalParkingSlots,
    }),
    [form, setParkingType, setTotalParkingSlots]
  );

  return parkingForm;
}
