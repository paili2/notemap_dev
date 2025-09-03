"use client";

import Field from "@/components/atoms/Field/Field";
import { Input } from "@/components/atoms/Input/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/Select";
import { useEffect, useState } from "react";
import { ParkingSectionProps, Preset } from "./types";
import { PRESETS } from "./constants";

export default function ParkingSection({
  parkingType,
  setParkingType,
  parkingCount,
  setParkingCount,
}: ParkingSectionProps) {
  const isPreset = (v: string): v is Preset =>
    (PRESETS as readonly string[]).includes(v);

  const [selectValue, setSelectValue] = useState<string>("");
  const [custom, setCustom] = useState<string>("");

  /** prop → 내부 상태 동기화 */
  useEffect(() => {
    if (!parkingType) {
      setSelectValue("");
      // 사용자 입력은 초기화
      setCustom("");
      return;
    }
    if (isPreset(parkingType)) {
      setSelectValue(parkingType);
      // 프리셋이면 커스텀 지움
      setCustom("");
      return;
    }
    if (parkingType === "custom") {
      // 커스텀 모드만 켜고, 사용자가 입력해 둔 값은 보존
      setSelectValue("custom");
      return;
    }
    // 임의 문자열(예: "지상 병렬 1대")이면 커스텀 모드 + 값 채움
    setSelectValue("custom");
    setCustom(parkingType);
  }, [parkingType]);

  /** 내부 상태 → 상위 값 반영 */
  useEffect(() => {
    if (selectValue === "custom") {
      const trimmed = custom.trim();
      // 비어 있으면 'custom' 센티넬만 보냄(초기화 방지)
      setParkingType(trimmed === "" ? "custom" : trimmed);
    } else {
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
            value={selectValue || undefined}
            onValueChange={(val) => {
              setSelectValue(val);
              if (val === "custom") {
                setCustom("");
              }
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
