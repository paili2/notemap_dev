"use client";
import { STRUCTURE_PRESETS } from "../../constants";
import StructureLinesSection from "../../sections/StructureLinesSection/StructureLinesSection";
import type { EditFormAPI } from "../hooks/useEditForm";

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
