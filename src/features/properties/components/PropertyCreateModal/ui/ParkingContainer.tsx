"use client";

import ParkingSection from "../../sections/ParkingSection/ParkingSection";

/** Body에서 내려오는 슬라이스(문자열 기반) */
type ParkingFormSliceFromBody = {
  /** 서버 enum id (number | null) */
  parkingTypeId: number | null;
  setParkingTypeId: (v: number | null) => void;

  /** UI에 보이는 주차 유형 라벨 */
  parkingType: string | null;
  setParkingType: (v: string | null) => void;

  /** 총 주차대수 — Body에서는 문자열로 관리 */
  totalParkingSlots: string | null;
  setTotalParkingSlots: (v: string | null) => void;

  /** (옵션) name -> id 매핑 */
  parkingTypeNameToId?: Record<string, number>;
};

type Props = {
  form: ParkingFormSliceFromBody;
};

export default function ParkingContainer({ form }: Props) {
  const {
    parkingTypeId,
    setParkingTypeId,
    parkingType,
    setParkingType,
    totalParkingSlots,
    setTotalParkingSlots,
    parkingTypeNameToId,
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
      /** 주차 유형은 string | null 그대로 */
      parkingType={parkingType}
      setParkingType={setParkingType}
      /** 총 주차대수는 Section이 number|null을 기대 */
      totalParkingSlots={toNum(totalParkingSlots)}
      setTotalParkingSlots={(v) => setTotalParkingSlots(toStr(v))}
      /** 서버 enum id 동기화 */
      parkingTypeId={parkingTypeId}
      setParkingTypeId={setParkingTypeId}
      /** (옵션) name -> id 매핑 (나중에 필요하면 사용) */
      parkingTypeNameToId={parkingTypeNameToId}
    />
  );
}
