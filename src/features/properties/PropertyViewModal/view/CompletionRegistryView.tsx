"use client";

import { formatDate } from "@/features/properties/lib/formatDate";
import Field from "../../common/Field/Field";
import type {
  Grade,
  Registry,
} from "@/features/properties/types/property-domain";

// ↑ 실제 경로에 맞게 수정 (formatDate 정의한 곳)

const show = (v: any) =>
  v === null || v === undefined || `${v}`.trim?.() === "" ? "-" : `${v}`;

const Pill = ({ text }: { text?: string }) => (
  <span className="inline-flex h-8 items-center rounded-lg px-3 text-sm border bg-blue-50 text-blue-700">
    {text || "-"}
  </span>
);

export default function CompletionRegistryView({
  completionDate,
  salePrice,
  registry,
  slopeGrade,
  structureGrade,
}: {
  completionDate?: string | null;
  salePrice?: string | number | null;
  registry?: Registry;
  slopeGrade?: Grade;
  structureGrade?: Grade;
}) {
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
