"use client";

import NumberField from "./NumberField";

type NumbersSectionProps = {
  /** 총 개동(동 수) */
  totalBuildings: string;
  setTotalBuildings: (v: string) => void;
  /** 총 층수 */
  totalFloors: string;
  setTotalFloors: (v: string) => void;
  /** 총 세대수(단지 전체) */
  totalHouseholds: string;
  setTotalHouseholds: (v: string) => void;
  /** 잔여 세대(분양/임대 잔여) */
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
