"use client";
import ParkingSection from "../../sections/ParkingSection/ParkingSection";

// 🔹 부모의 form 훅(useCreateForm)에서 이미 bridge로 노출된다고 했던 필드 포함
type ParkingFormSlice = {
  parkingType: string | null;
  setParkingType: (v: string | null) => void;
  parkingCount: number | null;
  setParkingCount: (v: number | null) => void;

  // ⬇️ 추가: 주차유형 ID
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
      parkingCount={form.parkingCount}
      setParkingCount={form.setParkingCount}
      parkingTypeId={form.parkingTypeId ?? null}
      setParkingTypeId={form.setParkingTypeId}
      parkingTypeNameToId={PARKING_TYPE_NAME_TO_ID}
    />
  );
}
