"use client";
import NumbersSection from "@/features/properties/components/sections/NumbersSection/NumbersSection";
import { EditFormAPI } from "@/features/properties/edit/types/editForm.slices";

export default function NumbersContainer({ form }: { form: EditFormAPI }) {
  return (
    <NumbersSection
      totalBuildings={form.totalBuildings}
      setTotalBuildings={form.setTotalBuildings}
      totalFloors={form.totalFloors}
      setTotalFloors={form.setTotalFloors}
      totalHouseholds={form.totalHouseholds}
      setTotalHouseholds={form.setTotalHouseholds}
      remainingHouseholds={form.remainingHouseholds}
      setRemainingHouseholds={form.setRemainingHouseholds}
    />
  );
}
