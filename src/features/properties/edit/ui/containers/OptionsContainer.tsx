"use client";

import { PRESET_OPTIONS } from "@/features/properties/components/constants";
import OptionsSection from "@/features/properties/components/sections/OptionsSection/OptionsSection";
import { EditFormAPI } from "@/features/properties/edit/types/editForm.slices";

export default function OptionsContainer({ form }: { form: EditFormAPI }) {
  return (
    <OptionsSection
      PRESET_OPTIONS={PRESET_OPTIONS}
      options={form.options}
      setOptions={form.setOptions}
      etcChecked={form.etcChecked}
      setEtcChecked={form.setEtcChecked}
      optionEtc={form.optionEtc}
      setOptionEtc={form.setOptionEtc}
    />
  );
}
