"use client";
import ParkingSection from "../../sections/ParkingSection/ParkingSection";
import type { EditFormAPI } from "../hooks/useEditForm/useEditForm";

export default function ParkingContainer({ form }: { form: EditFormAPI }) {
  return (
    <ParkingSection
      parkingType={form.parkingType}
      setParkingType={form.setParkingType}
      parkingCount={form.parkingCount}
      setParkingCount={form.setParkingCount}
    />
  );
}
