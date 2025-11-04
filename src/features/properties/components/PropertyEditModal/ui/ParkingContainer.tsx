"use client";
import { useMemo, useCallback } from "react";
import ParkingSection from "../../sections/ParkingSection/ParkingSection";

type ParkingFormSlice = {
  parkingType: string | null;
  setParkingType: (v: string | null) => void;

  totalParkingSlots: string | null; // 상위는 string|null
  setTotalParkingSlots: (v: string | null) => void;
};

export default function ParkingContainer({ form }: { form: ParkingFormSlice }) {
  // string|null -> number|null (빈 문자열, 공백, NaN => null)
  const totalParkingSlotsNumber = useMemo<number | null>(() => {
    const s = (form.totalParkingSlots ?? "").trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }, [form.totalParkingSlots]);

  // number|null -> string|null (안정 콜백)
  const setTotalParkingSlotsNumber = useCallback(
    (v: number | null) =>
      form.setTotalParkingSlots(v == null ? null : String(v)),
    [form]
  );

  const setParkingType = form.setParkingType; // 이미 안정일 가능성 높음

  return (
    <ParkingSection
      parkingType={form.parkingType}
      setParkingType={setParkingType}
      totalParkingSlots={totalParkingSlotsNumber}
      setTotalParkingSlots={setTotalParkingSlotsNumber}
    />
  );
}
