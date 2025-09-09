"use client";
import { REGISTRY_LIST } from "@/features/properties/types/property-domain";
import CompletionRegistrySection from "../../sections/CompletionRegistrySection/CompletionRegistrySection";
import type { EditFormAPI } from "../hooks/useEditForm";

export default function CompletionRegistryContainer({
  form,
}: {
  form: EditFormAPI;
}) {
  return (
    <CompletionRegistrySection
      completionDate={form.completionDate}
      setCompletionDate={form.setCompletionDate}
      salePrice={form.salePrice}
      setSalePrice={form.setSalePrice}
      REGISTRY_LIST={REGISTRY_LIST}
      registry={form.registryOne}
      setRegistry={form.setRegistryOne}
      slopeGrade={form.slopeGrade}
      setSlopeGrade={form.setSlopeGrade}
      structureGrade={form.structureGrade}
      setStructureGrade={form.setStructureGrade}
    />
  );
}
