"use client";
import AspectsSection from "../../sections/AspectsSection/AspectsSection";
import type { EditFormAPI } from "../hooks/useEditForm";

export default function AspectsContainer({ form }: { form: EditFormAPI }) {
  return (
    <AspectsSection
      aspects={form.aspects}
      addAspect={form.addAspect}
      removeAspect={form.removeAspect}
      setAspectDir={form.setAspectDir}
    />
  );
}
