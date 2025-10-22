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

/**
 * 변경된 Props (하위호환):
 * - parkingTypeId?: number | null
 * - setParkingTypeId?: (v: number | null) => void
 * - parkingTypeNameToId?: Record<string, number>   // 라벨→ID 매핑
 *
 * 주의) 매핑 딕셔너리는 부모에서 주입해주는 게 가장 안전함.
 */
type Props = ParkingSectionProps & {
  parkingTypeId?: number | null;
  setParkingTypeId?: (v: number | null) => void;
  parkingTypeNameToId?: Record<string, number>;
};

export default function ParkingSection({
  parkingType,
  setParkingType,
  parkingCount,
  setParkingCount,

  // ⬇️ 추가
  parkingTypeId,
  setParkingTypeId,
  parkingTypeNameToId = {}, // 라벨→ID 매핑 (예: { "기계식": 1, "자주식": 2, ... })
}: Props) {
  const isPreset = (v: string): v is Preset =>
    (PRESETS as readonly string[]).includes(v);

  const [selectValue, setSelectValue] = useState<string>("");
  const [custom, setCustom] = useState<string>("");

  /** prop → 내부 상태 동기화 */
  useEffect(() => {
    if (!parkingType) {
      setSelectValue("");
      setCustom("");
      // 타입을 지운 경우 id도 null로 동기화
      setParkingTypeId?.(null);
      return;
    }
    if (isPreset(parkingType)) {
      setSelectValue(parkingType);
      setCustom("");
      // 프리셋 라벨 → id 매핑
      const id = parkingTypeNameToId[parkingType];
      setParkingTypeId?.(Number.isFinite(id as any) ? id : null);
      return;
    }
    if (parkingType === "custom") {
      setSelectValue("custom");
      // custom에서는 id 없음
      setParkingTypeId?.(null);
      return;
    }
    // 임의 문자열(예: "지상 병렬 1대") → custom 모드 + id 없음
    setSelectValue("custom");
    setCustom(parkingType);
    setParkingTypeId?.(null);
  }, [parkingType, parkingTypeNameToId, setParkingTypeId]);

  /** 내부 상태 → 상위 값 반영 */
  useEffect(() => {
    if (selectValue === "custom") {
      const trimmed = custom.trim();
      // 비어 있으면 sentinel 'custom' 유지(입력창 유지용)
      setParkingType(trimmed === "" ? "custom" : trimmed);
      // 커스텀은 id 없음
      setParkingTypeId?.(null);
    } else {
      // 프리셋 라벨 선택/미선택 처리
      const nextType = selectValue === "" ? null : selectValue;
      setParkingType(nextType);
      // 프리셋 라벨 → id 매핑(없으면 null)
      const id =
        nextType && parkingTypeNameToId[nextType]
          ? parkingTypeNameToId[nextType]
          : null;
      setParkingTypeId?.(id);
    }
  }, [
    selectValue,
    custom,
    setParkingType,
    setParkingTypeId,
    parkingTypeNameToId,
  ]);

  // 숫자만 허용(붙여넣기 포함) + 빈값이면 null
  const onChangeCount = (raw: string) => {
    const onlyDigits = raw.replace(/\D+/g, "");
    setParkingCount(onlyDigits === "" ? null : Number(onlyDigits));
  };

  return (
    <div className="grid grid-cols-2 items-center md:grid-cols-3 ">
      <Field label="주차 유형">
        <div className="flex items-center gap-2">
          <Select
            value={selectValue || undefined}
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
            value={String(parkingCount ?? "")}
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
