"use client";

import Field from "@/components/atoms/Field/Field";
import { Maybe, NumbersViewProps } from "./types";

/** 값이 비어있으면 "-" 반환 */
const show = (v: Maybe) =>
  v === null || v === undefined || `${v}`.trim?.() === "" ? "-" : `${v}`;

/**
 * NumbersView:
 * - 총 개동, 총 층수, 총 세대수, 잔여세대 등 숫자 필드 표시
 * - 값이 없으면 "-"로 대체
 */
export default function NumbersView({
  totalBuildings,
  totalFloors,
  totalHouseholds,
  remainingHouseholds,
}: NumbersViewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Field label="총 개동" align="center">
        <div className="h-9 flex items-center justify-center text-sm">
          {show(totalBuildings)}
        </div>
      </Field>

      <Field label="총 층수" align="center">
        <div className="h-9 flex items-center justify-center text-sm">
          {show(totalFloors)}
        </div>
      </Field>

      <Field label="총 세대수" align="center">
        <div className="h-9 flex items-center justify-center text-sm">
          {show(totalHouseholds)}
        </div>
      </Field>

      <Field label="잔여세대" align="center">
        <div className="h-9 flex items-center justify-center text-sm">
          {show(remainingHouseholds)}
        </div>
      </Field>
    </div>
  );
}
