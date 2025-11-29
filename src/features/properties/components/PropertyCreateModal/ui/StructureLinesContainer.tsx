// StructureLinesContainer.tsx
"use client";

import StructureLinesSection from "../../sections/StructureLinesSection/StructureLinesSection";
import type { UnitLine } from "@/features/properties/types/property-domain";

type CommonFns = {
  onAddPreset: (preset: string) => void;
  onAddEmpty: () => void;
  onUpdate: (idx: number, patch: Partial<UnitLine>) => void;
  onRemove: (idx: number) => void;
};

// Edit 스타일: lines
type FormWithLines = CommonFns & {
  lines: UnitLine[];
};

// Create 스타일: unitLines
type FormWithUnitLines = CommonFns & {
  unitLines: UnitLine[];
};

type Props = {
  form: FormWithLines | FormWithUnitLines;
  presets: readonly string[];
  /** 답사예정 핀일 때 true → UI는 항상 빈 상태로 보여줌 */
  isVisitPlanPin?: boolean;
};

export default function StructureLinesContainer({
  form,
  presets,
  isVisitPlanPin,
}: Props) {
  const rawLines = "lines" in form ? form.lines : form.unitLines;

  // ✅ 답사예정이면 구조별 입력을 비워서 렌더
  const lines = isVisitPlanPin ? [] : rawLines;

  return (
    <StructureLinesSection
      lines={lines}
      onAddPreset={form.onAddPreset}
      onAddEmpty={form.onAddEmpty}
      onUpdate={form.onUpdate}
      onRemove={form.onRemove}
      // 섹션이 string[] 기대 시 복제
      presets={[...presets]}
    />
  );
}
