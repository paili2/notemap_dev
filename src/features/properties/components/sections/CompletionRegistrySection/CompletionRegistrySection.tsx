"use client";

import Field from "@/components/atoms/Field/Field";
import { Input } from "@/components/atoms/Input/Input";
import PillRadioGroup from "@/components/atoms/PillRadioGroup";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  Grade,
  BuildingType,
} from "@/features/properties/types/property-domain";
import type { CompletionRegistrySectionProps } from "./types";

/** ───────── 상수/타입 ───────── */
const GRADES = ["상", "중", "하"] as const;

// UI 라벨(버튼) 고정 튜플
const UI_BUILDING_TYPES = ["주택", "APT", "OP", "도/생", "근/생"] as const;
type UIBuildingType = (typeof UI_BUILDING_TYPES)[number];

// 라벨 ↔ 백엔드 enum 매핑
const mapLabelToBackend = (v?: UIBuildingType | null): BuildingType | null => {
  if (!v) return null;
  if (v === "근/생") return "근생";
  if (v === "도/생") return "도/생" as any;
  return v as unknown as BuildingType;
};
const mapBackendToLabel = (v?: string | null): UIBuildingType | undefined => {
  if (!v) return undefined;
  if (v === "근생") return "근/생";
  if (v === "도/생") return "도/생";
  if (["주택", "APT", "OP"].includes(v)) return v as UIBuildingType;
  return undefined;
};

/** ───────── 유틸 ───────── */
const toYmd = (s?: string | null) =>
  typeof s === "string" && s.length >= 10 ? s.slice(0, 10) : (s ?? "") || "";

const softNormalize = (raw: string) => raw.replace(/[^0-9-]/g, "").slice(0, 10);

const finalizeYmd = (raw: string) => {
  const digits = raw.replace(/\D+/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return raw;
};

// 숫자 문자열 정규화
const onlyDigits = (s: string) => s.replace(/[^\d]/g, "");

export default function CompletionRegistrySection({
  completionDate,
  setCompletionDate,
  // (레거시) salePrice: 과거에 최저실입으로 쓰던 필드
  salePrice,
  setSalePrice,
  // (신규) 최저 실입 정수 금액
  minRealMoveInCost,
  setMinRealMoveInCost,
  slopeGrade,
  setSlopeGrade,
  structureGrade,
  setStructureGrade,
  buildingType,
  setBuildingType,
}: CompletionRegistrySectionProps & {
  /** ✅ 신규 필드(선택): 최저 실입 정수 금액 */
  minRealMoveInCost?: number | string | null;
  setMinRealMoveInCost?: (v: number | string | null) => void;
}) {
  /** 준공일 로컬 상태(타이핑 쾌적성) */
  const [localDate, setLocalDate] = useState<string>(toYmd(completionDate));
  useEffect(() => setLocalDate(toYmd(completionDate)), [completionDate]);

  const commitDate = useCallback(() => {
    const v = finalizeYmd(localDate.trim());
    setCompletionDate(v);
    setLocalDate(toYmd(v));
  }, [localDate, setCompletionDate]);

  /** UI 라벨로 변환 */
  const uiBuildingType = mapBackendToLabel(buildingType as any);

  /** ✅ 최저실입: 신규(minRealMoveInCost) 우선, 없으면 레거시(salePrice) 사용 */
  const priceValue = useMemo(() => {
    const v = minRealMoveInCost ?? salePrice ?? "";
    return String(v ?? "");
  }, [minRealMoveInCost, salePrice]);

  const onChangePrice = useCallback(
    (raw: string) => {
      const digits = onlyDigits(raw);
      if (typeof setMinRealMoveInCost === "function") {
        // 신규 상태가 있으면 여기에 반영
        setMinRealMoveInCost(digits === "" ? null : digits);
      } else if (typeof setSalePrice === "function") {
        // 레거시 유지
        setSalePrice(digits);
      }
    },
    [setMinRealMoveInCost, setSalePrice]
  );

  return (
    <div className="space-y-4">
      {/* 1행: 경사도/구조 */}
      <div className="grid grid-cols-3 items-center gap-14 md:flex">
        <Field label="경사도" align="center">
          <PillRadioGroup
            name="slopeGrade"
            options={GRADES}
            value={slopeGrade}
            onChange={setSlopeGrade}
          />
        </Field>

        <Field label="구조" align="center">
          <PillRadioGroup
            name="structureGrade"
            options={GRADES}
            value={structureGrade}
            onChange={setStructureGrade}
          />
        </Field>
      </div>

      {/* 2행: 준공일/건물유형 */}
      <div className="grid grid-cols-3 items-end gap-x-4 gap-y-2 md:gap-x-5">
        <Field label="준공일" align="center">
          <Input
            type="text"
            inputMode="numeric"
            value={localDate}
            onChange={(e) => setLocalDate(softNormalize(e.target.value))}
            onBlur={commitDate}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitDate();
              }
              if (e.key === "Escape") {
                setLocalDate(toYmd(completionDate));
              }
            }}
            placeholder="예: 2024-04-14"
            className="h-9 w-32 md:w-36"
            aria-label="준공일 입력(YYYY-MM-DD)"
          />
        </Field>

        <Field label="등기" align="center">
          <PillRadioGroup
            name="buildingType"
            options={UI_BUILDING_TYPES}
            value={uiBuildingType}
            onChange={(v) =>
              setBuildingType?.(mapLabelToBackend(v as UIBuildingType))
            }
            allowUnset
          />
        </Field>
      </div>

      {/* 3행: 최저실입(만원) → 신규 필드 우선, 레거시와 호환 */}
      <Field label="최저실입" align="center">
        <div className="flex items-center gap-3">
          <Input
            type="text"
            inputMode="numeric"
            value={priceValue}
            onChange={(e) => onChangePrice(e.target.value)}
            placeholder="예: 5000"
            className="h-9 w-40"
            aria-label="최저실입(만원)"
          />
          <span className="text-sm text-gray-500">만원</span>
        </div>
      </Field>
    </div>
  );
}
