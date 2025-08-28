// features/properties/components/modal/common/sections/ParkingSection.tsx
"use client";

import * as React from "react";
import Field from "../Field";
import { Input } from "@/components/atoms/Input/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/Select";

type Props = {
  parkingType: string;
  setParkingType: (v: string) => void;
  parkingCount: string; // 총 주차대수
  setParkingCount: (v: string) => void;
};

const PRESETS = ["병렬", "직렬", "기계식", "EV"] as const;
type Preset = (typeof PRESETS)[number];

export default function ParkingSection({
  parkingType,
  setParkingType,
  parkingCount,
  setParkingCount,
}: Props) {
  const isPreset = (v: string): v is Preset =>
    (PRESETS as readonly string[]).includes(v);

  // 내부 셀렉트/커스텀 입력 값 — 외부 parkingType 변화에도 동기화
  const [selectValue, setSelectValue] = React.useState<string>("");
  const [custom, setCustom] = React.useState<string>("");

  // 🔄 prop → 내부 상태 동기화 (초기/수정모달 프리필 모두 대응)
  React.useEffect(() => {
    if (!parkingType) {
      setSelectValue("");
      setCustom("");
      return;
    }
    if (isPreset(parkingType)) {
      setSelectValue(parkingType);
      setCustom("");
    } else {
      setSelectValue("custom");
      setCustom(parkingType);
    }
  }, [parkingType]);

  // 내부 상태 → 상위 값 반영
  React.useEffect(() => {
    if (selectValue === "custom") {
      setParkingType(custom.trim());
    } else {
      // "", "병렬", "직렬", "기계식", "EV"
      setParkingType(selectValue);
    }
  }, [selectValue, custom, setParkingType]);

  // 숫자만 허용(붙여넣기 포함)
  const onChangeCount = (raw: string) => {
    const onlyDigits = raw.replace(/\D+/g, "");
    setParkingCount(onlyDigits);
  };

  return (
    <div className="flex items-center gap-3">
      <Field label="주차 유형">
        <div className="flex items-center gap-2">
          <Select
            value={selectValue || undefined} // 빈 값일 땐 placeholder 표시
            onValueChange={(val) => {
              setSelectValue(val);
              if (val === "custom") setCustom("");
            }}
          >
            <SelectTrigger className="w-28 h-9">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-auto">
              {PRESETS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
              <SelectItem value="custom">직접입력</SelectItem>
            </SelectContent>
          </Select>

          {selectValue === "custom" && (
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onBlur={() => setCustom((v) => v.trim())}
              placeholder="예: 지상 병렬 1대"
              className="h-9 flex-1"
              autoFocus
            />
          )}
        </div>
      </Field>

      <Field label="총 주차대수">
        <div className="flex items-center gap-3">
          <Input
            value={parkingCount}
            onChange={(e) => onChangeCount(e.target.value)}
            className="w-16 h-9"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
          />
          <span className="text-gray-500">대</span>
        </div>
      </Field>
    </div>
  );
}
