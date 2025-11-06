// src/features/properties/components/PropertyEditModal/ui/ParkingContainer.tsx
"use client";
import { useMemo, useCallback } from "react";
import ParkingSection from "../../sections/ParkingSection/ParkingSection";

type ParkingFormSlice = {
  parkingType: string | null;
  setParkingType: (v: string | null) => void;

  // 상위는 string|null
  totalParkingSlots: string | null;
  setTotalParkingSlots: (v: string | null) => void;
};

export default function ParkingContainer({ form }: { form: ParkingFormSlice }) {
  // string|null -> number|null (빈/공백/NaN => null)
  const totalParkingSlotsNumber = useMemo<number | null>(() => {
    const s = (form.totalParkingSlots ?? "").toString().trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }, [form.totalParkingSlots]);

  // number|null -> string|null (안정 콜백)
  const setTotalParkingSlotsNumber = useCallback(
    (v: number | null) =>
      form.setTotalParkingSlots(v == null ? null : String(v)),
    [form.setTotalParkingSlots] // ✅ 정확한 의존성
  );

  return (
    <ParkingSection
      parkingType={form.parkingType}
      setParkingType={form.setParkingType}
      totalParkingSlots={totalParkingSlotsNumber}
      setTotalParkingSlots={setTotalParkingSlotsNumber}
    />
  );
}
