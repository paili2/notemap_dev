"use client";

import Field from "@/components/atoms/Field/Field";
import { Input } from "@/components/atoms/Input/Input";
import PillRadioGroup from "@/components/atoms/PillRadioGroup";
import { useCallback, useEffect, useState } from "react";

import type {
  Grade,
  BuildingType,
} from "@/features/properties/types/property-domain";
import type { CompletionRegistrySectionProps } from "./types";
import ElevatorSegment from "../HeaderSection/components/ElevatorSegment";

/** ───────── 상수/타입 ───────── */
const GRADES = ["상", "중", "하"] as const;
type GradeLiteral = (typeof GRADES)[number];

const UI_BUILDING_TYPES = ["주택", "APT", "OP", "도/생", "근/생"] as const;
type UIBuildingType = (typeof UI_BUILDING_TYPES)[number];

/** 라벨 ↔ 백엔드 enum 매핑 */
const mapLabelToBackend = (v?: UIBuildingType | null): BuildingType | null => {
  if (!v) return null;
  if (v === "근/생") return "근생";
  if (v === "도/생") return "도생";
  return v as unknown as BuildingType;
};

const mapBackendToLabel = (v?: string | null): UIBuildingType | undefined => {
  if (!v) return undefined;
  if (v === "근생") return "근/생";
  if (v === "도생" || v === "도/생") return "도/생";
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

const onlyDigits = (s: string) => s.replace(/[^\d]/g, "");

export default function CompletionRegistrySection({
  completionDate,
  setCompletionDate,
  // (레거시) 최저실입으로 쓰던 필드
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
  elevator,
  setElevator,
}: CompletionRegistrySectionProps & {
  minRealMoveInCost?: number | string | null;
  setMinRealMoveInCost?: (v: number | string | null) => void;
  elevator?: "O" | "X" | null;
  setElevator?: (v: "O" | "X" | null) => void;
}) {
  /** ── 준공일 ── */
  const [localDate, setLocalDate] = useState<string>(toYmd(completionDate));
  useEffect(() => setLocalDate(toYmd(completionDate)), [completionDate]);

  const commitDate = useCallback(() => {
    const v = finalizeYmd(localDate.trim());
    setCompletionDate(v);
    setLocalDate(toYmd(v));
  }, [localDate, setCompletionDate]);

  /** ── 건물유형 (등기) ── */
  const uiBuildingType = mapBackendToLabel(buildingType as any);

  /** ── 최저실입: 항상 로컬 상태 하나 두고, 필요 시 위로도 올려줌 ── */
  const initialPrice = String(minRealMoveInCost ?? salePrice ?? "");
  const [localPrice, setLocalPrice] = useState<string>(initialPrice);

  // props 쪽 값이 바뀌면 로컬도 동기화 (예: 편집모드 초기 로드)
  useEffect(() => {
    setLocalPrice(initialPrice);
  }, [initialPrice]);

  const onChangePrice = useCallback(
    (raw: string) => {
      const digits = onlyDigits(raw);
      setLocalPrice(digits); // 👈 UI는 무조건 즉시 반영

      // 윗단 상태도 있으면 같이 올려주기
      if (typeof setMinRealMoveInCost === "function") {
        setMinRealMoveInCost(digits === "" ? null : digits);
      } else if (typeof setSalePrice === "function") {
        setSalePrice(digits === "" ? "" : digits);
      }
    },
    [setMinRealMoveInCost, setSalePrice]
  );

  /** ── 경사도/구조 ── */
  const onChangeSlope = useCallback(
    (v: GradeLiteral | undefined) => setSlopeGrade?.(v as Grade | undefined),
    [setSlopeGrade]
  );
  const onChangeStructure = useCallback(
    (v: GradeLiteral | undefined) =>
      setStructureGrade?.(v as Grade | undefined),
    [setStructureGrade]
  );

  return (
    <div className="space-y-4">
      {/* 1행: 경사도 / 구조 / 엘리베이터 */}
      <div className="grid grid-cols-3 items-center gap-6 md:gap-10">
        <Field label="경사도" align="center">
          <PillRadioGroup
            name="slopeGrade"
            options={GRADES}
            value={slopeGrade as GradeLiteral | undefined}
            onChange={onChangeSlope}
          />
        </Field>

        <Field label="구조" align="center">
          <PillRadioGroup
            name="structureGrade"
            options={GRADES}
            value={structureGrade as GradeLiteral | undefined}
            onChange={onChangeStructure}
          />
        </Field>

        <Field label="엘리베이터" align="center">
          <ElevatorSegment
            value={elevator ?? null}
            onChange={(next) => {
              if (setElevator) setElevator(next);
            }}
          />
        </Field>
      </div>

      {/* 2행: 준공일 / 건물유형(등기) */}
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
            onChange={(v) => {
              const next = mapLabelToBackend(v as UIBuildingType);
              setBuildingType?.(next);
            }}
            allowUnset
          />
        </Field>
      </div>

      {/* 3행: 최저실입(만원) */}
      <Field label="최저실입" align="center">
        <div className="flex items-center gap-3">
          <Input
            type="text"
            inputMode="numeric"
            value={localPrice}
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
