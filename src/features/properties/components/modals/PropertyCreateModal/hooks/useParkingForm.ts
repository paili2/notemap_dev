"use client";

import { useMemo } from "react";

export function useParkingForm(form: any) {
  return useMemo(
    () => ({
      parkingType: form.parkingType ?? null,
      setParkingType: (v: string | null) => form.setParkingType(v ?? ""),

      totalParkingSlots:
        form.totalParkingSlots == null ? null : String(form.totalParkingSlots),
      setTotalParkingSlots: (v: string | null) => {
        if (v == null) {
          form.setTotalParkingSlots(null);
          return;
        }
        const s = String(v).trim();
        if (!s) {
          form.setTotalParkingSlots(null);
          return;
        }
        const n = Number(s);
        form.setTotalParkingSlots(Number.isFinite(n) ? n : null);
      },
    }),
    [form]
  );
}
