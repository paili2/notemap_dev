"use client";
import { AspectsFormSlice } from "@/features/properties/hooks/useEditForm/types";
import AspectsSection from "../../../../sections/AspectsSection/AspectsSection";

export default function AspectsContainer({ form }: { form: AspectsFormSlice }) {
  return (
    <AspectsSection
      aspects={form.aspects}
      addAspect={form.addAspect}
      removeAspect={form.removeAspect}
      setAspectDir={form.setAspectDir}
    />
  );
}
