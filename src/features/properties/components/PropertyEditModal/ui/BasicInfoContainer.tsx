"use client";
import BasicInfoSection from "../../sections/BasicInfoSection/BasicInfoSection";
import type { EditFormAPI } from "../hooks/useEditForm/useEditForm";

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
