"use client";
import OptionsBadges from "../components/OptionsBadges";

export default function OptionsBadgesContainer({
  options,
  optionEtc,
}: {
  options: string[];
  optionEtc: string;
}) {
  return <OptionsBadges options={options ?? []} optionEtc={optionEtc ?? ""} />;
}
