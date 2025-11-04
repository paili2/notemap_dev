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

  /** 내부 UI 상태(셀렉트 값/커스텀 입력) */
  const [selectValue, setSelectValue] = useState<string>(""); // "" | Preset | "custom"
  const [custom, setCustom] = useState<string>("");

  /** 셀렉트 아이템은 메모해서 불필요한 리렌더 방지 */
  const selectItems = useMemo(
    () => [
      ...PRESETS.map((opt) => ({ value: opt, label: opt })),
      { value: "custom", label: "직접입력" },
    ],
    []
  );

  /** 숫자 입력 표시값 */
  const displayCount = useMemo<number | null>(
    () => (typeof totalParkingSlots === "number" ? totalParkingSlots : null),
    [totalParkingSlots]
  );

  /* ───────────────── prop → 내부 상태 동기화(내부 state만 갱신) ───────────────── */
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
  }, [parkingType, selectValue, custom]);

  /* ───────────────── 이벤트에서만 상위 반영 ───────────────── */

  // SafeSelect 변경
  const onChangeSelect = useCallback(
    (val: string | null) => {
      const next = val ?? "";
      if (next === selectValue) return;
      setSelectValue(next);

      if (next === "") {
        if (parkingType !== null) setParkingType(null);
        if (setParkingTypeId && parkingTypeId !== null) setParkingTypeId(null);
        return;
      }

      if (next === "custom") {
        // 커스텀 입력으로 전환
        if (parkingType !== "custom") setParkingType("custom");
        if (setParkingTypeId && parkingTypeId !== null) setParkingTypeId(null);
        // 기존 custom 텍스트는 유지(원하면 여기서 초기화)
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
      const next = onlyDigits === "" ? null : Number(onlyDigits);
      if (setTotalParkingSlots && next !== (totalParkingSlots ?? null)) {
        setTotalParkingSlots(next);
      }
    },
    [setTotalParkingSlots, totalParkingSlots]
  );

  return (
    <div className="grid grid-cols-2 items-center md:grid-cols-3">
      <Field label="주차 유형">
        <div className="flex items-center gap-2">
          <SafeSelect
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
              // autoFocus는 포커스 루프의 씨앗이 될 수 있어 기본 off
              // 필요 시 UI/UX 확인 후 켜세요.
              // autoFocus
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
