"use client";
import ParkingSection from "../../sections/ParkingSection/ParkingSection";

type ParkingFormSlice = {
  parkingType: string | null;
  setParkingType: (v: string | null) => void;

  /** ✅ 문자열 기반 상위 폼 값을 섹션에서 쓰는 number|null로 어댑트 */
  totalParkingSlots: string | null;
  setTotalParkingSlots: (v: string | null) => void;

  /** (옵션) 타입 ID들을 상위에서 관리한다면 여기에 추가
   *  parkingTypeId?: number | null;
   *  setParkingTypeId?: (v: number | null) => void;
   *  registrationTypeId?: number | null;
   *  setRegistrationTypeId?: (v: number | null) => void;
   */
};

export default function ParkingContainer({ form }: { form: ParkingFormSlice }) {
  // 안전 숫자 변환: "", 공백, null, 비숫자 → null
  const totalParkingSlotsNumber: number | null = (() => {
    const s = (form.totalParkingSlots ?? "").trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  })();

  return (
    <ParkingSection
      parkingType={form.parkingType}
      setParkingType={form.setParkingType}
      // string|null ↔ number|null 어댑터
      totalParkingSlots={totalParkingSlotsNumber}
      setTotalParkingSlots={(v) =>
        form.setTotalParkingSlots(v === null ? null : String(v))
      }
      // 필요 시 타입 ID들도 넘겨주세요
      // parkingTypeId={form.parkingTypeId}
      // setParkingTypeId={form.setParkingTypeId}
      // parkingTypeNameToId={...}
    />
  );
}
