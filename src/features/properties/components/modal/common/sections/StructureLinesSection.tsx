"use client";

import StructureLines from "../StructureLines";
import type { UnitLine } from "@/features/properties/types/property-domain";

type Props = {
  lines: UnitLine[];
  onAddPreset: (preset: string) => void;
  onAddEmpty: () => void;
  onUpdate: (idx: number, patch: Partial<UnitLine>) => void;
  onRemove: (idx: number) => void;
  presets: readonly string[];
};

export default function StructureLinesSection({
  lines,
  onAddPreset,
  onAddEmpty,
  onUpdate,
  onRemove,
  presets,
}: Props) {
  return (
    <StructureLines
      lines={lines}
      onAddPreset={onAddPreset}
      onAddEmpty={onAddEmpty}
      onUpdate={onUpdate}
      onRemove={onRemove}
      presets={presets}
    />
  );
}
