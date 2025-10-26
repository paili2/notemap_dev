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
import { useEffect, useMemo, useState } from "react";
import { ParkingSectionProps, Preset } from "./types";
import { PRESETS } from "./constants";

/**
 * 변경된 Props (하위호환):
 * - totalParkingSlots?: number | null
 * - setTotalParkingSlots?: (v: number | null) => void
 * - (기존) parkingCount?: number | null
 * - (기존) setParkingCount?: (v: number | null) => void
 * - parkingTypeId?: number | null
 * - setParkingTypeId?: (v: number | null) => void
 * - parkingTypeNameToId?: Record<string, number>   // 라벨→ID 매핑
 */
type Props = Omit<ParkingSectionProps, "parkingCount" | "setParkingCount"> & {
  /** ✅ 신규 */
  totalParkingSlots?: number | null;
  setTotalParkingSlots?: (v: number | null) => void;
  /** ⬇ 하위호환(부모가 아직 parkingCount를 쓰면 같이 동기화) */
  parkingCount?: number | null;
  setParkingCount?: (v: number | null) => void;

  parkingTypeId?: number | null;
  setParkingTypeId?: (v: number | null) => void;
  parkingTypeNameToId?: Record<string, number>;
};

export default function ParkingSection({
  parkingType,
  setParkingType,

  // 신규/구버전 값 모두 받되, 표시는 totalParkingSlots 우선
  totalParkingSlots,
  setTotalParkingSlots,
  parkingCount,
  setParkingCount,

  // 타입 id 관련
  parkingTypeId,
  setParkingTypeId,
  parkingTypeNameToId = {},
}: Props) {
  const isPreset = (v: string): v is Preset =>
    (PRESETS as readonly string[]).includes(v);

  const [selectValue, setSelectValue] = useState<string>("");
  const [custom, setCustom] = useState<string>("");

  /** 주차대수 현재값 (표시용) */
  const displayCount = useMemo(
    () =>
      typeof totalParkingSlots === "number"
        ? totalParkingSlots
        : typeof parkingCount === "number"
        ? parkingCount
        : null,
    [totalParkingSlots, parkingCount]
  );

  /** prop → 내부 상태 동기화 */
  useEffect(() => {
    if (!parkingType) {
      setSelectValue("");
      setCustom("");
      setParkingTypeId?.(null);
      return;
    }
    if (isPreset(parkingType)) {
      setSelectValue(parkingType);
      setCustom("");
      const id = parkingTypeNameToId[parkingType];
      setParkingTypeId?.(Number.isFinite(id as any) ? id : null);
      return;
    }
    if (parkingType === "custom") {
      setSelectValue("custom");
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
      setParkingType(trimmed === "" ? "custom" : trimmed);
      setParkingTypeId?.(null);
    } else {
      const nextType = selectValue === "" ? null : selectValue;
      setParkingType(nextType);
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

  // 입력값을 숫자만 허용(붙여넣기 포함) + 빈값이면 null.
  // 두 세터를 모두 불러서 신/구 prop이 함께 동기화되도록 처리
  const onChangeCount = (raw: string) => {
    const onlyDigits = raw.replace(/\D+/g, "");
    const next = onlyDigits === "" ? null : Number(onlyDigits);
    setTotalParkingSlots?.(next);
    setParkingCount?.(next);
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
            value={displayCount ?? ""} // null → 빈칸
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
