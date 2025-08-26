"use client";

import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Input } from "@/components/atoms/Input/Input";

type Props = {
  ALL_OPTIONS: readonly string[];
  options: string[];
  setOptions: (next: string[]) => void;
  etcChecked: boolean;
  setEtcChecked: (v: boolean) => void;
  optionEtc: string;
  setOptionEtc: (v: string) => void;
};

export default function OptionsSection({
  ALL_OPTIONS,
  options,
  setOptions,
  etcChecked,
  setEtcChecked,
  optionEtc,
  setOptionEtc,
}: Props) {
  const toggleOption = (op: string) => {
    setOptions(
      options.includes(op) ? options.filter((x) => x !== op) : [...options, op]
    );
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">옵션</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 items-center">
        {ALL_OPTIONS.map((op) => (
          <label key={op} className="inline-flex items-center gap-2 text-sm">
            <Checkbox
              checked={options.includes(op)}
              onCheckedChange={() => toggleOption(op)}
            />
            <span className="text-sm">{op}</span>
          </label>
        ))}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Checkbox
            checked={etcChecked}
            onCheckedChange={(c) => {
              const next = c === true;
              setEtcChecked(next);
              if (!next) setOptionEtc("");
            }}
          />
          <Input
            value={optionEtc}
            onChange={(e) => setOptionEtc(e.target.value)}
            placeholder="직접입력"
            className="h-9 w-[120px] shrink-0"
            disabled={!etcChecked}
          />
        </div>
      </div>
    </div>
  );
}
