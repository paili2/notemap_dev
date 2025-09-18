"use client";

import Field from "@/components/atoms/Field/Field";
import { Input } from "@/components/atoms/Input/Input";
import type {
  Registry,
  Grade,
} from "@/features/properties/types/property-domain";
import { formatDate } from "@/lib/formatDate";
import PillRadioGroup from "@/components/atoms/PillRadioGroup";
import { CompletionRegistrySectionProps } from "./types";

const GRADES: ReadonlyArray<Grade> = ["상", "중", "하"];

export default function CompletionRegistrySection({
  completionDate,
  setCompletionDate,
  salePrice,
  setSalePrice,
  REGISTRY_LIST,
  registry,
  setRegistry,
  slopeGrade,
  setSlopeGrade,
  structureGrade,
  setStructureGrade,
}: CompletionRegistrySectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 items-center gap-20 md:flex">
        <Field label="경사도" align="center">
          <PillRadioGroup
            name="slopeGrade"
            options={GRADES}
            value={slopeGrade}
            onChange={setSlopeGrade}
          />
        </Field>

        <Field label="구조" align="center">
          <PillRadioGroup
            name="structureGrade"
            options={GRADES}
            value={structureGrade}
            onChange={setStructureGrade}
          />
        </Field>
      </div>

      {/* 2행: 준공일 + 등기 */}
      <div className="flex items-center gap-8">
        <Field label="준공일" align="center">
          <Input
            value={completionDate}
            onChange={(e) => setCompletionDate(formatDate(e.target.value))}
            placeholder="예: 2024-04-14"
            className="w-28 h-9 md:w-44"
            inputMode="numeric"
          />
        </Field>

        <Field label="등기" align="center">
          <PillRadioGroup
            name="registry"
            options={REGISTRY_LIST}
            value={registry}
            onChange={setRegistry}
            allowUnset
          />
        </Field>
      </div>

      {/* 3행: 최저실입 */}
      <Field label="최저실입" align="center">
        <div className="flex items-center gap-3">
          <Input
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            placeholder="예: 5000"
            className="h-9 w-40"
            inputMode="numeric"
          />
          <span className="text-sm text-gray-500">만원</span>
        </div>
      </Field>
    </div>
  );
}
