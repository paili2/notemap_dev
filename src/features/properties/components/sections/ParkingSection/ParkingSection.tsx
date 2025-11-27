"use client";

import Field from "@/components/atoms/Field/Field";
import { Input } from "@/components/atoms/Input/Input";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ParkingSectionProps, Preset } from "./types";
import { PRESETS } from "./constants";
import SafeSelect from "@/features/safe/SafeSelect";

const PARKING_TYPE_MAX_LEN = 50;

type Props = Omit<ParkingSectionProps, "parkingCount" | "setParkingCount"> & {
  /** 상위는 number|null 로 내려줌 */
  totalParkingSlots?: number | null;
  setTotalParkingSlots?: (v: number | null) => void;
};

export default function ParkingSection({
  parkingType,
  setParkingType,

  totalParkingSlots,
  setTotalParkingSlots,
}: Props) {
  const isPreset = (v: string): v is Preset =>
    (PRESETS as readonly string[]).includes(v);

  /** 내부 UI 상태(셀렉트 값/커스텀 입력) — 내부에서는 문자열로 관리 */
  const [selectValue, setSelectValue] = useState<string>(""); // "" | Preset | "custom"
  const [custom, setCustom] = useState<string>("");

  /** 셀렉트 아이템 */
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
    // 커스텀 입력 중일 때는 사용자가 타이핑하는 걸 우선시
    if (selectValue === "custom") return;

    // 값이 없는 경우 리셋
    if (!parkingType) {
      if (selectValue !== "") setSelectValue("");
      if (custom !== "") setCustom("");
      return;
    }

    // 프리셋 값인 경우
    if (isPreset(parkingType)) {
      if (selectValue !== parkingType) setSelectValue(parkingType);
      if (custom !== "") setCustom("");
      return;
    }

    // 프리셋이 아니면 "직접입력" 모드로
    if (selectValue !== "custom") setSelectValue("custom");
    if (custom !== parkingType) setCustom(parkingType);
  }, [parkingType, selectValue, custom]);

  /* ───────── 이벤트 → 상위 반영 ───────── */

  const onChangeSelect = useCallback(
    (val: string | null) => {
      const next = val ?? "";
      if (next === selectValue) return;
      setSelectValue(next);

      // 미선택
      if (next === "") {
        setParkingType?.(null);
        return;
      }

      // 직접입력 모드일 때는 parkingType는 커스텀 인풋 blur 시에만 반영
      if (next === "custom") {
        if (parkingType !== null) setParkingType?.(null);
        return;
      }

      // 프리셋 선택
      if (parkingType !== next) setParkingType?.(next);
    },
    [selectValue, parkingType, setParkingType]
  );

  /** 커스텀 문자열 입력 (길이 제한 포함) */
  const onChangeCustomInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value.slice(0, PARKING_TYPE_MAX_LEN);
      setCustom(next);
    },
    []
  );

  const onBlurCustom = useCallback(() => {
    const trimmed = custom.trim();
    if (trimmed === "") {
      setParkingType?.(null);
      setSelectValue("");
    } else {
      setParkingType?.(trimmed);
    }
  }, [custom, setParkingType]);

  const onChangeCount = useCallback(
    (raw: string) => {
      const onlyDigits = raw.replace(/\D+/g, "");
      const next = onlyDigits === "" ? null : Number(onlyDigits.slice(0, 6));
      setTotalParkingSlots?.(next);
    },
    [setTotalParkingSlots]
  );

  /* ───────── 레이아웃 분기 ───────── */

  // ✅ 직접입력일 때:
  // - 모바일: 한 컬럼 → 주차유형(셀렉트+인풋) 위, 총 주차대수 아래
  // - md 이상: 두 컬럼 → 왼쪽 주차유형(셀렉트+인풋), 오른쪽 총 주차대수
  if (selectValue === "custom") {
    return (
      <div className="grid gap-4 md:grid-cols-2 md:gap-x-36 md:gap-y-4 md:items-center">
        {/* 왼쪽: 주차 유형 + 직접입력 인풋 (항상 한 줄에 나란히) */}
        <Field label="주차 유형">
          <div className="flex items-center gap-2">
            <SafeSelect
              value={selectValue || null}
              onChange={onChangeSelect}
              items={selectItems}
              placeholder="선택"
              className="h-9 w-28 flex-shrink-0"
              contentClassName="max-h-[320px] z-[10010]"
              side="bottom"
              align="start"
            />
            <Input
              value={custom}
              onChange={onChangeCustomInput}
              onBlur={onBlurCustom}
              placeholder="예: 지상 병렬 10대"
              className="h-9 w-[160px] md:w-[200px]"
              maxLength={PARKING_TYPE_MAX_LEN}
            />
          </div>
        </Field>

        {/* 오른쪽(or 모바일에서는 아래): 총 주차대수 */}
        <Field label="총 주차대수">
          <div className="flex items-center gap-3">
            <Input
              value={displayCountStr}
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

  // 나머지(프리셋/미선택): 기존 레이아웃 유지
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
            contentClassName="max-h-[320px] z-[10010]"
            side="bottom"
            align="start"
          />
        </div>
      </Field>

      <Field label="총 주차대수">
        <div className="flex items-center gap-3">
          <Input
            value={displayCountStr}
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
