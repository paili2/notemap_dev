// src/features/properties/components/PropertyEditModal/sections/ParkingSection/ParkingSection.tsx
"use client";

import Field from "@/components/atoms/Field/Field";
import { Input } from "@/components/atoms/Input/Input";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ParkingSectionProps, Preset } from "./types";
import { PRESETS } from "./constants";
import SafeSelect from "@/features/safe/SafeSelect";

type Props = Omit<ParkingSectionProps, "parkingCount" | "setParkingCount"> & {
  /** 상위는 number|null 로 내려줌 */
  totalParkingSlots?: number | null;
  setTotalParkingSlots?: (v: number | null) => void;

  /** (옵션) 서버 enum id 동기화가 필요할 때만 사용 */
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

  /** 내부 UI 상태(셀렉트 값/커스텀 입력) — 내부에서는 문자열로만 관리 */
  const [selectValue, setSelectValue] = useState<string>(""); // "" | Preset | "custom"
  const [custom, setCustom] = useState<string>("");

  /** 셀렉트 아이템 메모 */
  const selectItems = useMemo(
    () => [
      ...PRESETS.map((opt) => ({ value: opt, label: opt } as const)),
      { value: "custom", label: "직접입력" } as const,
    ],
    []
  );

  /** 숫자 입력 표시값 (controlled string) */
  const displayCountStr =
    typeof totalParkingSlots === "number" && Number.isFinite(totalParkingSlots)
      ? String(totalParkingSlots)
      : "";

  /* ───────── prop → 내부 상태 동기화 ───────── */
  useEffect(() => {
    // parkingType 이 null/빈 → 내부도 초기화
    if (!parkingType) {
      if (selectValue !== "") setSelectValue("");
      if (custom !== "") setCustom("");
      return;
    }

    // 프리셋이면 셀렉트만
    if (isPreset(parkingType)) {
      if (selectValue !== parkingType) setSelectValue(parkingType);
      if (custom !== "") setCustom("");
      return;
    }

    // "custom" 자체면 셀렉트만 custom 으로
    if (parkingType === "custom") {
      if (selectValue !== "custom") setSelectValue("custom");
      return;
    }

    // 실제 커스텀 문자열
    if (selectValue !== "custom") setSelectValue("custom");
    if (custom !== parkingType) setCustom(parkingType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parkingType]);

  /* ───────── 이벤트 → 상위 반영 ───────── */

  // ✅ SafeSelect onChange 시그니처에 맞게 string | null
  const onChangeSelect = useCallback(
    (val: string | null) => {
      const next = val ?? "";
      if (next === selectValue) return;
      setSelectValue(next);

      if (next === "") {
        // 미선택
        if (parkingType !== null) setParkingType(null);
        if (setParkingTypeId && parkingTypeId !== null) setParkingTypeId(null);
        return;
      }

      if (next === "custom") {
        // 커스텀 입력으로 전환
        if (parkingType !== "custom") setParkingType("custom");
        if (setParkingTypeId && parkingTypeId !== null) setParkingTypeId(null);
        return;
      }

      // 프리셋 선택
      if (parkingType !== next) setParkingType(next);
      if (setParkingTypeId) {
        const id = parkingTypeNameToId[next] ?? null;
        if ((id ?? null) !== (parkingTypeId ?? null)) setParkingTypeId(id);
      }
    },
    [
      selectValue,
      parkingType,
      parkingTypeId,
      setParkingType,
      setParkingTypeId,
      parkingTypeNameToId,
    ]
  );

  // 커스텀 입력 onBlur에서만 상위 반영
  const onBlurCustom = useCallback(() => {
    const trimmed = custom.trim();
    const nextType = trimmed === "" ? "custom" : trimmed;
    if (parkingType !== nextType) setParkingType(nextType);
    if (setParkingTypeId && parkingTypeId !== null) setParkingTypeId(null);
  }, [custom, parkingType, parkingTypeId, setParkingType, setParkingTypeId]);

  // 숫자 입력 onChange
  const onChangeCount = useCallback(
    (raw: string) => {
      const onlyDigits = raw.replace(/\D+/g, "");
      const next = onlyDigits === "" ? null : Number(onlyDigits.slice(0, 6)); // 과도 입력 방지
      setTotalParkingSlots?.(next);
    },
    [setTotalParkingSlots]
  );

  return (
    <div className="grid grid-cols-2 items-center md:grid-cols-3">
      <Field label="주차 유형">
        <div className="flex items-center gap-2">
          <SafeSelect
            /** ✅ SafeSelect 타입에 맞춰 string | null 전달 */
            value={selectValue || null}
            onChange={onChangeSelect}
            items={selectItems}
            placeholder="선택"
            className="w-28 h-9"
          />

          {selectValue === "custom" && (
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onBlur={onBlurCustom}
              placeholder="예: 지상 병렬 1대"
              className="h-9 flex-1"
            />
          )}
        </div>
      </Field>

      <Field label="총 주차대수">
        <div className="flex items-center gap-3">
          <Input
            value={displayCountStr} // "" 또는 "숫자"
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
