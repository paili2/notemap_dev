"use client";
import { STRUCTURE_PRESETS } from "@/features/properties/components/constants";
import StructureLinesSection from "@/features/properties/components/sections/StructureLinesSection/StructureLinesSection";
import { EditFormAPI } from "@/features/properties/edit/types/editForm.slices";

export default function StructureLinesContainer({
  form,
}: {
  form: EditFormAPI;
}) {
  return (
    <StructureLinesSection
      lines={form.unitLines}
      onAddPreset={form.addLineFromPreset}
      onAddEmpty={form.addEmptyLine}
      onUpdate={form.updateLine}
      onRemove={form.removeLine}
      presets={STRUCTURE_PRESETS}
    />
  );
}
