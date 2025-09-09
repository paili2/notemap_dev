"use client";
import OptionsSection from "../../sections/OptionsSection/OptionsSection";

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
  // ✅ readonly 로 받기
  PRESET_OPTIONS: readonly string[];
}) {
  return (
    <OptionsSection
      // ✅ 섹션이 가변 배열(string[])을 기대할 수 있으니 복제해서 전달
      PRESET_OPTIONS={[...PRESET_OPTIONS]}
      options={form.options}
      setOptions={form.setOptions}
      etcChecked={form.etcChecked}
      setEtcChecked={form.setEtcChecked}
      optionEtc={form.optionEtc}
      setOptionEtc={form.setOptionEtc}
    />
  );
}
