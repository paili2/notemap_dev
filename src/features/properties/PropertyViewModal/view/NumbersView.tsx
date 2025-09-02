"use client";

import Field from "../../common/Field/Field";
type Maybe = string | number | null | undefined;
const show = (v: Maybe) =>
  v === null || v === undefined || `${v}`.trim?.() === "" ? "-" : `${v}`;

export default function NumbersView({
  totalBuildings,
  totalFloors,
  totalHouseholds,
  remainingHouseholds,
}: {
  totalBuildings?: Maybe;
  totalFloors?: Maybe;
  totalHouseholds?: Maybe;
  remainingHouseholds?: Maybe;
}) {
  return (
    <div className="grid grid-cols-4">
      <Field label="총 개동" align="center">
        <div className="h-9 flex items-center text-sm">
          {show(totalBuildings)}
        </div>
      </Field>
      <Field label="총 층수" align="center">
        <div className="h-9 flex items-center text-sm">{show(totalFloors)}</div>
      </Field>
      <Field label="총 세대수" align="center">
        <div className="h-9 flex items-center text-sm">
          {show(totalHouseholds)}
        </div>
      </Field>
      <Field label="잔여세대" align="center">
        <div className="h-9 flex items-center text-sm">
          {show(remainingHouseholds)}
        </div>
      </Field>
    </div>
  );
}
