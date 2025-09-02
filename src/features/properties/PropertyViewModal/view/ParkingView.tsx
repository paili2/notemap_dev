"use client";

import Field from "../../common/Field/Field";

export default function ParkingView({
  parkingType,
  parkingCount,
}: {
  parkingType?: string | null;
  parkingCount?: string | number | null;
}) {
  return (
    <div className="grid grid-cols-4 items-center">
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
