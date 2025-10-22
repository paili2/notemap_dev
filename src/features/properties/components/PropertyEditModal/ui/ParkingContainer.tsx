"use client";
import ParkingSection from "../../sections/ParkingSection/ParkingSection";

type ParkingFormSlice = {
  parkingType: string | null;
  setParkingType: (v: string | null) => void;

  // 상위 폼은 string|null을 사용
  parkingCount: string | null;
  setParkingCount: (v: string | null) => void;
};

export default function ParkingContainer({ form }: { form: ParkingFormSlice }) {
  // 안전한 숫자 변환: "", "  ", null, 비숫자 -> null 반환
  const parkingCountNumber: number | null = (() => {
    const s = (form.parkingCount ?? "").trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  })();

  return (
    <ParkingSection
      parkingType={form.parkingType}
      setParkingType={form.setParkingType}
      // string|null -> number|null
      parkingCount={parkingCountNumber}
      // number|null -> string|null
      setParkingCount={(v) =>
        form.setParkingCount(v === null ? null : String(v))
      }
    />
  );
}
