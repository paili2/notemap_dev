"use client";
import ParkingSection from "../../sections/ParkingSection/ParkingSection";

export default function ParkingContainer({
  form,
}: {
  form: {
    parkingType: string;
    setParkingType: (v: string) => void;
    parkingCount: string;
    setParkingCount: (v: string) => void;
  };
}) {
  return (
    <ParkingSection
      parkingType={form.parkingType}
      setParkingType={form.setParkingType}
      parkingCount={form.parkingCount}
      setParkingCount={form.setParkingCount}
    />
  );
}
