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
  /** name -> id 매핑 (예: { 지하: 1, 지상: 2 }) */
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

  /** 내부 UI 상태(셀렉트 값/커스텀 입력) — 내부에서는 문자열로 관리 */
  const [selectValue, setSelectValue] = useState<string>(""); // "" | Preset | "custom"
  const [custom, setCustom] = useState<string>("");

  /** id -> name 역매핑 */
  const idToName = useMemo(() => {
    const map: Record<number, string> = {};
    Object.entries(parkingTypeNameToId).forEach(([name, id]) => {
      if (typeof id === "number") map[id] = name;
    });
    return map;
  }, [parkingTypeNameToId]);

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
    if (selectValue === "custom") return;

    if (!parkingType && parkingTypeId != null) {
      const name = idToName[parkingTypeId];
      if (name) {
        if (selectValue !== name) setSelectValue(name);
        if (custom !== "") setCustom("");
        setParkingType?.(name);
        return;
      }
    }

    if (!parkingType) {
      if (selectValue !== "") setSelectValue("");
      if (custom !== "") setCustom("");
      return;
    }

    if (parkingType === "custom") {
      if (selectValue !== "") setSelectValue("");
      if (custom !== "") setCustom("");
      setParkingType?.(null);
      return;
    }

    if (isPreset(parkingType)) {
      if (selectValue !== parkingType) setSelectValue(parkingType);
      if (custom !== "") setCustom("");
      return;
    }

    if (selectValue !== "custom") setSelectValue("custom");
    if (custom !== parkingType) setCustom(parkingType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    parkingType,
    parkingTypeId,
    idToName,
    selectValue,
    custom,
    setParkingType,
  ]);

  /* ───────── 이벤트 → 상위 반영 ───────── */

  const onChangeSelect = useCallback(
    (val: string | null) => {
      const next = val ?? "";
      if (next === selectValue) return;
      setSelectValue(next);

      if (next === "") {
        setParkingType?.(null);
        setParkingTypeId?.(null);
        return;
      }

      if (next === "custom") {
        if (parkingType !== null) setParkingType?.(null);
        setParkingTypeId?.(null);
        return;
      }

      if (parkingType !== next) setParkingType?.(next);
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

  const onBlurCustom = useCallback(() => {
    const trimmed = custom.trim();
    if (trimmed === "") {
      setParkingType?.(null);
      setSelectValue("");
    } else {
      setParkingType?.(trimmed);
    }
    if (setParkingTypeId && parkingTypeId !== null) setParkingTypeId(null);
  }, [custom, setParkingType, setParkingTypeId, parkingTypeId]);

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
              onChange={(e) => setCustom(e.target.value)}
              onBlur={onBlurCustom}
              placeholder="예: 지상 병렬 10대"
              className="h-9 w-[160px] md:w-[200px]"
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
