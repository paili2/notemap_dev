"use client";
import CompletionRegistrySection from "../../sections/CompletionRegistrySection/CompletionRegistrySection";
import {
  REGISTRY_LIST,
  type Grade,
  type Registry,
} from "@/features/properties/types/property-domain";

export default function CompletionRegistryContainer({
  form,
  REGISTRY_LIST: LIST = REGISTRY_LIST,
}: {
  form: {
    completionDate: string;
    setCompletionDate: (v: string) => void;
    salePrice: string;
    setSalePrice: (v: string) => void;
    registryOne?: Registry;
    setRegistryOne: (v?: Registry) => void;
    slopeGrade?: Grade;
    setSlopeGrade: (v?: Grade) => void;
    structureGrade?: Grade;
    setStructureGrade: (v?: Grade) => void;
  };
  REGISTRY_LIST?: typeof REGISTRY_LIST;
}) {
  return (
    <CompletionRegistrySection
      completionDate={form.completionDate}
      setCompletionDate={form.setCompletionDate}
      salePrice={form.salePrice}
      setSalePrice={form.setSalePrice}
      REGISTRY_LIST={LIST}
      registry={form.registryOne}
      setRegistry={form.setRegistryOne}
      slopeGrade={form.slopeGrade}
      setSlopeGrade={form.setSlopeGrade}
      structureGrade={form.structureGrade}
      setStructureGrade={form.setStructureGrade}
    />
  );
}
