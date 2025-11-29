"use client";

import { EditFormAPI } from "@/features/properties/hooks/useEditForm/types";
import AreaSetsSection from "../../../sections/AreaSetsSection/AreaSetsSection";

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
