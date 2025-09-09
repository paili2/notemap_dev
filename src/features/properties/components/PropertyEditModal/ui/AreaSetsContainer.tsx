"use client";
import AreaSetsSection from "../../sections/AreaSetsSection/AreaSetsSection";
import type { EditFormAPI } from "../hooks/useEditForm";

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
