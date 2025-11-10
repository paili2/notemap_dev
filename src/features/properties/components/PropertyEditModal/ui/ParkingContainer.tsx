"use client";
import { useMemo, useCallback } from "react";
import ParkingSection from "../../sections/ParkingSection/ParkingSection";

/** ✅ 폼 슬라이스에 id/세터 추가 */
type ParkingFormSlice = {
  parkingType: string | null;
  setParkingType: (v: string | null) => void;

  /** 🔹 enum id */
  parkingTypeId: number | null;
  setParkingTypeId: (v: number | null) => void;

  /** 🔹 상위는 string|null을 들고 있음 */
  totalParkingSlots: string | null;
  setTotalParkingSlots: (v: string | null) => void;

  /** (선택) name->id 매핑이 상위에 있으면 여기로 내려주세요 */
  parkingTypeNameToId?: Record<string, number>;
};

export default function ParkingContainer({ form }: { form: ParkingFormSlice }) {
  // string|null -> number|null
  const totalParkingSlotsNumber = useMemo<number | null>(() => {
    const s = (form.totalParkingSlots ?? "").toString().trim();
    if (!s) return null;
    const n = Number(s.replace(/\D+/g, ""));
    return Number.isFinite(n) ? n : null;
  }, [form.totalParkingSlots]);

  // number|null -> string|null
  const setTotalParkingSlotsNumber = useCallback(
    (v: number | null) =>
      form.setTotalParkingSlots(v == null ? null : String(v)),
    [form.setTotalParkingSlots]
  );

  return (
    <ParkingSection
      parkingType={form.parkingType}
      setParkingType={form.setParkingType}
      /** ✅ 여기서 참조 가능해짐 */
      parkingTypeId={form.parkingTypeId}
      setParkingTypeId={form.setParkingTypeId}
      totalParkingSlots={totalParkingSlotsNumber}
      setTotalParkingSlots={setTotalParkingSlotsNumber}
      /** (선택) 매핑 내려주기 */
      parkingTypeNameToId={form.parkingTypeNameToId ?? {}}
    />
  );
}
