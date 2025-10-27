"use client";
import ParkingSection from "../../sections/ParkingSection/ParkingSection";

// 🔹 부모 useCreateForm/useParking 에서 totalParkingSlots로 일원화
type ParkingFormSlice = {
  parkingType: string | null;
  setParkingType: (v: string | null) => void;

  /** ✅ 총 주차대수 (number|null) */
  totalParkingSlots: number | null;
  setTotalParkingSlots: (v: number | null) => void;

  // ⬇️ 주차유형 ID (옵션)
  parkingTypeId?: number | null;
  setParkingTypeId?: (v: number | null) => void;
};

const PARKING_TYPE_NAME_TO_ID: Record<string, number> = {
  병렬: 1,
  직렬: 2,
  기계식: 3,
  직접입력: 4,
};

export default function ParkingContainer({ form }: { form: ParkingFormSlice }) {
  return (
    <ParkingSection
      parkingType={form.parkingType}
      setParkingType={form.setParkingType}
      // ✅ 레거시 parkingCount 대신 totalParkingSlots 사용
      totalParkingSlots={form.totalParkingSlots}
      setTotalParkingSlots={form.setTotalParkingSlots}
      parkingTypeId={form.parkingTypeId ?? null}
      setParkingTypeId={form.setParkingTypeId}
      parkingTypeNameToId={PARKING_TYPE_NAME_TO_ID}
    />
  );
}
