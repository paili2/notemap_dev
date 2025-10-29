"use client";

import Field from "@/components/atoms/Field/Field";

interface ParkingViewProps {
  /** 주차 유형 라벨 (없으면 "-") */
  parkingType?: string | null;
  /** ✅ 총 주차대수: 0도 유효값 */
  totalParkingSlots?: string | number | null;
}

export default function ParkingView({
  parkingType,
  totalParkingSlots,
}: ParkingViewProps) {
  const countText =
    totalParkingSlots === 0 || totalParkingSlots === "0"
      ? "0 대"
      : totalParkingSlots != null && String(totalParkingSlots).trim() !== ""
      ? `${totalParkingSlots} 대`
      : "-";

  return (
    <div className="grid grid-cols-2 items-center">
      <Field label="주차 유형">
        <div className="h-9 flex items-center text-sm">
          {parkingType?.trim() || "-"}
        </div>
      </Field>
      <Field label="총 주차대수">
        <div className="h-9 flex items-center text-sm">{countText}</div>
      </Field>
    </div>
  );
}
