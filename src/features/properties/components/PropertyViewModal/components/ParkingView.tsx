"use client";

import Field from "@/components/atoms/Field/Field";

interface ParkingViewProps {
  parkingType?: string | null;
  parkingCount?: string | number | null;
}

export default function ParkingView({
  parkingType,
  parkingCount,
}: ParkingViewProps) {
  return (
    <div className="grid grid-cols-2 gap-4 items-center">
      <Field label="주차 유형">
        <div className="h-9 flex items-center text-sm">
          {parkingType?.trim() || "-"}
        </div>
      </Field>
      <Field label="총 주차대수">
        <div className="h-9 flex items-center text-sm">
          {parkingCount ? `${parkingCount} 대` : "-"}
        </div>
      </Field>
    </div>
  );
}
