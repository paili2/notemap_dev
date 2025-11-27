"use client";
import { useMemo, useCallback } from "react";
import ParkingSection from "../../sections/ParkingSection/ParkingSection";

type ParkingFormSlice = {
  /** 주차 유형 (자주식/기계식 등 문자열) */
  parkingType: string | null;
  setParkingType: (v: string | null) => void;

  /** 총 주차 대수: 상위는 string|null 로 들고 있음 */
  totalParkingSlots: string | null;
  setTotalParkingSlots: (v: string | null) => void;
};

export default function ParkingContainer({ form }: { form: ParkingFormSlice }) {
  // string|null -> number|null (섹션 내부는 number|null 기준)
  const totalParkingSlotsNumber = useMemo<number | null>(() => {
    const s = (form.totalParkingSlots ?? "").toString().trim();
    if (!s) return null;
    const n = Number(s.replace(/\D+/g, ""));
    return Number.isFinite(n) ? n : null;
  }, [form.totalParkingSlots]);

  // number|null -> string|null (폼 슬라이스에 다시 반영)
  const setTotalParkingSlotsNumber = useCallback(
    (v: number | null) =>
      form.setTotalParkingSlots(v == null ? null : String(v)),
    [form.setTotalParkingSlots]
  );

  return (
    <ParkingSection
      /** ✅ 주차유형: 문자열만 내려보냄 */
      parkingType={form.parkingType}
      setParkingType={form.setParkingType}
      /** ✅ 총 주차대수: 섹션에는 number|null로 전달 */
      totalParkingSlots={totalParkingSlotsNumber}
      setTotalParkingSlots={setTotalParkingSlotsNumber}
    />
  );
}
