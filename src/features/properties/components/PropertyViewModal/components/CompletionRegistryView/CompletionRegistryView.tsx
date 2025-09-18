"use client";

import { formatDate } from "@/lib/formatDate";
import Field from "@/components/atoms/Field/Field";
import type {
  Grade,
  Registry,
} from "@/features/properties/types/property-domain";
import Pill from "./components/Pill";

// ↑ 실제 경로에 맞게 수정 (formatDate 정의한 곳)

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
      <div className="grid grid-cols-4 items-center">
        <Field label="경사도" align="center">
          <Pill text={slopeGrade} />
        </Field>
        <Field label="구조" align="center">
          <Pill text={structureGrade} />
        </Field>
      </div>
      <div className="grid grid-cols-4 items-center">
        <Field label="준공일" align="center">
          <div className="h-9 flex items-center text-sm">
            {completionDate ? formatDate(completionDate) : "-"}
          </div>
        </Field>
        <Field label="등기" align="center">
          <Pill text={registry} />
        </Field>
      </div>
      <Field label="최저실입" align="center">
        <div className="flex items-center gap-3">
          <div className="h-9 flex items-center text-sm">{show(salePrice)}</div>
          <span className="text-sm text-gray-500">만원</span>
        </div>
      </Field>
    </div>
  );
}
