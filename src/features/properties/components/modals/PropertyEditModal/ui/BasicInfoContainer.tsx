"use client";
import { EditFormAPI } from "@/features/properties/hooks/useEditForm/types";
import BasicInfoSection from "../../../sections/BasicInfoSection/BasicInfoSection";

export default function BasicInfoContainer({ form }: { form: EditFormAPI }) {
  return (
    <BasicInfoSection
      address={form.address}
      setAddress={form.setAddress}
      officePhone={form.officePhone}
      setOfficePhone={form.setOfficePhone}
      officePhone2={form.officePhone2}
      setOfficePhone2={form.setOfficePhone2}
    />
  );
}
