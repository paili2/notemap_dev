"use client";
import AspectsSection from "@/features/properties/components/sections/AspectsSection/AspectsSection";
import { AspectsFormSlice } from "@/features/properties/edit/types/editForm.slices";

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
