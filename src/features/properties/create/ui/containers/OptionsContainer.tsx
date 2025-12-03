"use client";

import OptionsSection from "@/features/properties/components/sections/OptionsSection/OptionsSection";

export default function OptionsContainer({
  form,
  PRESET_OPTIONS,
}: {
  form: {
    options: string[];
    setOptions: (v: string[]) => void;
    etcChecked: boolean;
    setEtcChecked: (v: boolean) => void;
    optionEtc: string;
    setOptionEtc: (v: string) => void;
  };
  PRESET_OPTIONS: readonly string[];
}) {
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
