"use client";
import { EditFormAPI } from "@/features/properties/hooks/useEditForm/types";
import StructureLinesSection from "../../../sections/StructureLinesSection/StructureLinesSection";
import { STRUCTURE_PRESETS } from "../../../constants";

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
