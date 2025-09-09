"use client";
import AreaSetsSection from "../../sections/AreaSetsSection/AreaSetsSection";
import { AreaSet } from "../../sections/AreaSetsSection/types";

export default function AreaSetsContainer({
  form,
}: {
  form: {
    baseAreaSet: AreaSet;
    setBaseAreaSet: (v: AreaSet) => void;
    extraAreaSets: AreaSet[];
    setExtraAreaSets: (v: AreaSet[]) => void;
  };
}) {
  return (
    <AreaSetsSection
      baseAreaSet={form.baseAreaSet}
      setBaseAreaSet={form.setBaseAreaSet}
      extraAreaSets={form.extraAreaSets}
      setExtraAreaSets={form.setExtraAreaSets}
    />
  );
}
