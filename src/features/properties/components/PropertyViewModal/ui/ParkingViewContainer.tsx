"use client";

import ParkingView from "../components/ParkingView";

export default function ParkingViewContainer({
  parkingType,
  parkingCount,
}: {
  parkingType: string;
  parkingCount?: string | number;
}) {
  return <ParkingView parkingType={parkingType} parkingCount={parkingCount} />;
}
