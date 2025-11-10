"use client";

import ParkingSection from "../../sections/ParkingSection/ParkingSection";

/** Body에서 내려오는 슬라이스(문자열 기반) */
type ParkingFormSliceFromBody = {
  parkingType: string | null;
  setParkingType: (v: string | null) => void;
  totalParkingSlots: string | null; // 문자열 기반
  setTotalParkingSlots: (v: string | null) => void;
};

type Props = {
  form: ParkingFormSliceFromBody;
};

export default function ParkingContainer({ form }: Props) {
  const {
    parkingType,
    setParkingType,
    totalParkingSlots,
    setTotalParkingSlots,
  } = form;

  // Body(문자열) ↔ Section(숫자) 변환 어댑터
  const toNum = (s: string | null): number | null => {
    if (!s) return null;
    const n = Number(String(s).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? n : null;
  };
  const toStr = (n: number | null): string | null =>
    n == null ? null : String(n);

  return (
    <ParkingSection
      /** 주차 유형은 문자열 그대로 */
      parkingType={parkingType}
      setParkingType={setParkingType}
      /** 총 주차대수는 Section이 number|null을 기대 */
      totalParkingSlots={toNum(totalParkingSlots)}
      setTotalParkingSlots={(v) => setTotalParkingSlots(toStr(v))}
      /** 아래 prop들이 있다면 넘겨줘도 됨(없으면 제거) */
      // parkingTypeId={null}
      // setParkingTypeId={() => {}}
      // parkingTypeNameToId={{}}
    />
  );
}
