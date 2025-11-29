"use client";

import { EditFormAPI } from "@/features/properties/hooks/useEditForm/types";
import OptionsSection from "../../../sections/OptionsSection/OptionsSection";
import { PRESET_OPTIONS } from "../../../constants";

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
