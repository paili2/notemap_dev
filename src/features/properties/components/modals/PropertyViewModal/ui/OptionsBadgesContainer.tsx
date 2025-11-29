"use client";
import OptionsBadges from "../sections/OptionsBadges";

export default function OptionsBadgesContainer({
  options = [], // ✅ 기본값
  optionEtc = "", // ✅ 기본값
}: {
  options?: string[]; // ✅ 옵셔널로 변경
  optionEtc?: string; // ✅ 옵셔널로 변경
}) {
  return <OptionsBadges options={options} optionEtc={optionEtc} />;
}
