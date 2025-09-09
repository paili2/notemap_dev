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

export default function StructureLinesContainer({
  form,
  presets,
}: {
  form: FormWithLines | FormWithUnitLines;
  presets: readonly string[];
}) {
  const lines = "lines" in form ? form.lines : form.unitLines;

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
