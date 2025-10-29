"use client";

import Field from "@/components/atoms/Field/Field";
import { Input } from "@/components/atoms/Input/Input";
import { useEffect, useMemo, useState } from "react";
import { ParkingSectionProps, Preset } from "./types";
import { PRESETS } from "./constants";
import SafeSelect from "@/features/safe/SafeSelect";

type Props = Omit<ParkingSectionProps, "parkingCount" | "setParkingCount"> & {
  totalParkingSlots?: number | null;
  setTotalParkingSlots?: (v: number | null) => void;

  parkingTypeId?: number | null;
  setParkingTypeId?: (v: number | null) => void;
  parkingTypeNameToId?: Record<string, number>;
};

export default function ParkingSection({
  parkingType,
  setParkingType,

  totalParkingSlots,
  setTotalParkingSlots,

  parkingTypeId,
  setParkingTypeId,
  parkingTypeNameToId = {},
}: Props) {
  const isPreset = (v: string): v is Preset =>
    (PRESETS as readonly string[]).includes(v);

  const [selectValue, setSelectValue] = useState<string>("");
  const [custom, setCustom] = useState<string>("");

  const displayCount = useMemo(
    () => (typeof totalParkingSlots === "number" ? totalParkingSlots : null),
    [totalParkingSlots]
  );

  // prop → 내부 상태
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
    setSelectValue("custom");
    setCustom(parkingType);
    setParkingTypeId?.(null);
  }, [parkingType, parkingTypeNameToId, setParkingTypeId]);

  // 내부 → 상위 반영 (동등성 가드는 SafeSelect/유틸 쪽에서 잡음)
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

  const onChangeCount = (raw: string) => {
    const onlyDigits = raw.replace(/\D+/g, "");
    const next = onlyDigits === "" ? null : Number(onlyDigits);
    setTotalParkingSlots?.(next);
  };

  return (
    <div className="grid grid-cols-2 items-center md:grid-cols-3">
      <Field label="주차 유형">
        <div className="flex items-center gap-2">
          <SafeSelect
            value={selectValue || null}
            onChange={(val) => {
              // SafeSelect가 값 동등성 가드 적용하므로 그대로 세팅
              setSelectValue(val ?? "");
              if (val === "custom") setCustom("");
            }}
            items={[
              ...PRESETS.map((opt) => ({ value: opt, label: opt })),
              { value: "custom", label: "직접입력" },
            ]}
            placeholder="선택"
            className="w-28 h-9"
          />

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
