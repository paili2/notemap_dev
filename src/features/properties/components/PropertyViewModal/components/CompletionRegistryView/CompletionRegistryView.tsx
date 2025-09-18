"use client";

import { formatDate } from "@/lib/formatDate";
import Field from "@/components/atoms/Field/Field";
import type {
  Grade,
  Registry,
} from "@/features/properties/types/property-domain";
import Pill from "./components/Pill";

const show = (v: any) =>
  v === null || v === undefined || `${v}`.trim?.() === "" ? "-" : `${v}`;

export interface CompletionRegistryView {
  completionDate?: string | null;
  salePrice?: string | number | null;
  registry?: Registry;
  slopeGrade?: Grade;
  structureGrade?: Grade;
}

export default function CompletionRegistryView({
  completionDate,
  salePrice,
  registry,
  slopeGrade,
  structureGrade,
}: CompletionRegistryView) {
  return (
    <div className="space-y-4">
      {/* 첫 줄: 경사도, 구조 */}
      <div className="grid grid-cols-2 gap-4 items-center">
        <Field label="경사도" align="center">
          <Pill text={slopeGrade} />
        </Field>
        <Field label="구조" align="center">
          <Pill text={structureGrade} />
        </Field>
      </div>

      {/* 둘째 줄: 준공일, 등기 */}
      <div className="grid grid-cols-2 gap-4 items-center">
        <Field label="준공일" align="center">
          <div className="h-9 flex items-center text-sm">
            {completionDate ? formatDate(completionDate) : "-"}
          </div>
        </Field>
        <Field label="등기" align="center">
          <Pill text={registry} />
        </Field>
      </div>

      {/* 셋째 줄: 최저실입 */}
      <div className="grid grid-cols-2 gap-4 items-center">
        <Field label="최저실입" align="center">
          <div className="flex items-center gap-3">
            <div className="h-9 flex items-center text-sm">
              {show(salePrice)}
            </div>
            <span className="text-sm text-gray-500">만원</span>
          </div>
        </Field>
      </div>
    </div>
  );
}
