"use client";

import NumberField from "./NumberField";

type NumbersSectionProps = {
  totalBuildings: string;
  setTotalBuildings: (v: string) => void;
  totalFloors: string;
  setTotalFloors: (v: string) => void;
  totalHouseholds: string;
  setTotalHouseholds: (v: string) => void;
  remainingHouseholds: string;
  setRemainingHouseholds: (v: string) => void;
};

export default function NumbersSection({
  totalBuildings,
  setTotalBuildings,
  totalFloors,
  setTotalFloors,
  totalHouseholds,
  setTotalHouseholds,
  remainingHouseholds,
  setRemainingHouseholds,
}: NumbersSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4">
      <NumberField
        label="총 개동"
        value={totalBuildings}
        setValue={setTotalBuildings}
        placeholder="예: 2"
      />
      <NumberField
        label="총 층수"
        value={totalFloors}
        setValue={setTotalFloors}
        placeholder="예: 10"
      />
      <NumberField
        label="총 세대수"
        value={totalHouseholds}
        setValue={setTotalHouseholds}
        placeholder="예: 50"
      />
      <NumberField
        label="잔여세대"
        value={remainingHouseholds}
        setValue={setRemainingHouseholds}
        placeholder="예: 10"
      />
    </div>
  );
}
