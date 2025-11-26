"use client";

import { EditFormAPI } from "@/features/properties/hooks/useEditForm/types";
import { PRESET_OPTIONS } from "../../constants";
import OptionsSection from "../../sections/OptionsSection/OptionsSection";

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
