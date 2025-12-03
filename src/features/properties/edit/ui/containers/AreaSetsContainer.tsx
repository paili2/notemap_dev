"use client";

import AreaSetsSection from "@/features/properties/components/sections/AreaSetsSection/AreaSetsSection";
import { EditFormAPI } from "@/features/properties/edit/types/editForm.slices";

export default function AreaSetsContainer({ form }: { form: EditFormAPI }) {
  return (
    <AreaSetsSection
      baseAreaSet={form.baseAreaSet}
      setBaseAreaSet={form.setBaseAreaSet}
      extraAreaSets={form.extraAreaSets}
      setExtraAreaSets={form.setExtraAreaSets}
    />
  );
}
