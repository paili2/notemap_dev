"use client";
import AspectsSection from "../../sections/AspectsSection/AspectsSection";
import {
  type AspectRowLite,
  type OrientationValue,
} from "@/features/properties/types/property-domain";

export default function AspectsContainer({
  form,
}: {
  form: {
    aspects: AspectRowLite[];
    addAspect: () => void;
    removeAspect: (no: number) => void;
    setAspectDir: (no: number, dir: OrientationValue | "") => void;
  };
}) {
  return (
    <AspectsSection
      aspects={form.aspects}
      addAspect={form.addAspect}
      removeAspect={form.removeAspect}
      setAspectDir={form.setAspectDir}
    />
  );
}
