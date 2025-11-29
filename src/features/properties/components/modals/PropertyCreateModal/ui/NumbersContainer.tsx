"use client";

import NumbersSection from "../../../sections/NumbersSection/NumbersSection";

export default function NumbersContainer({
  form,
}: {
  form: {
    totalBuildings: string;
    setTotalBuildings: (v: string) => void;
    totalFloors: string;
    setTotalFloors: (v: string) => void;
    totalHouseholds: string;
    setTotalHouseholds: (v: string) => void;
    remainingHouseholds: string;
    setRemainingHouseholds: (v: string) => void;
  };
}) {
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
