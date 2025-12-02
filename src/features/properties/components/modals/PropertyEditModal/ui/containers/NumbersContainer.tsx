"use client";
import { EditFormAPI } from "@/features/properties/hooks/useEditForm/types";
import NumbersSection from "../../../../sections/NumbersSection/NumbersSection";

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
