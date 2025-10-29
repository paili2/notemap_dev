"use client";

import ParkingView from "../components/ParkingView";

export default function ParkingViewContainer({
  parkingType = "",
  totalParkingSlots = undefined,
}: {
  parkingType?: string | null;
  totalParkingSlots?: string | number | null;
}) {
  return (
    <ParkingView
      parkingType={parkingType ?? ""}
      totalParkingSlots={totalParkingSlots ?? undefined}
    />
  );
}
