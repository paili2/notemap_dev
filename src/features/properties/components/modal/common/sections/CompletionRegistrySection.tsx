// features/properties/components/modal/common/sections/CompletionRegistrySection.tsx
"use client";

import * as React from "react";
import Field from "../Field";
import { Input } from "@/components/atoms/Input/Input";
import type {
  Registry,
  Grade,
} from "@/features/properties/types/property-domain";
import { formatDate } from "@/features/properties/lib/formatDate";

// "상/중/하" 등급 고정 목록
const GRADES: ReadonlyArray<Grade> = ["상", "중", "하"];

type Props = {
  // 준공/실입
  completionDate: string;
  setCompletionDate: (v: string) => void;
  salePrice: string;
  setSalePrice: (v: string) => void;

  // 등기
  REGISTRY_LIST: ReadonlyArray<Registry>;
  registry?: Registry;
  setRegistry: (v: Registry | undefined) => void;

  // 경사/구조 등급
  slopeGrade?: Grade;
  setSlopeGrade: (v: Grade | undefined) => void;
  structureGrade?: Grade;
  setStructureGrade: (v: Grade | undefined) => void;
};

export default function CompletionRegistrySection({
  completionDate,
  setCompletionDate,
  salePrice,
  setSalePrice,
  REGISTRY_LIST,
  registry,
  setRegistry,
  slopeGrade,
  setSlopeGrade,
  structureGrade,
  setStructureGrade,
}: Props) {
  return (
    <div className="space-y-4">
      {/* 1행: 경사도 + 구조 */}
      <div className="flex items-center gap-20">
        <Field label="경사도" align="center">
          {/* ⛳️ 제네릭 표기 제거 → 타입 추론 */}
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

      {/* 2행: 준공일 + 등기 */}
      <div className="flex items-center gap-8">
        <Field label="준공일" align="center">
          <Input
            value={completionDate}
            onChange={(e) => setCompletionDate(formatDate(e.target.value))}
            placeholder="예: 2024-04-14"
            className="h-9 w-44"
            inputMode="numeric"
          />
        </Field>

        <Field label="등기" align="center">
          <PillRadioGroup
            name="registry"
            options={REGISTRY_LIST}
            value={registry}
            onChange={setRegistry}
            allowUnset // 같은 버튼 다시 누르면 해제
          />
        </Field>
      </div>

      {/* 3행: 최저실입 */}
      <Field label="최저실입" align="center">
        <div className="flex items-center gap-3">
          <Input
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            placeholder="예: 5000"
            className="h-9 w-40"
            inputMode="numeric"
          />
          <span className="text-sm text-gray-500">만원</span>
        </div>
      </Field>
    </div>
  );
}

/**
 * 재사용 가능한 Pill 스타일 라디오 그룹
 * - 라디오 input은 sr-only로 숨기고, label을 pill로 스타일링
 * - allowUnset: 같은 버튼 다시 클릭 시 선택 해제 (onClick에서 제어)
 */
function PillRadioGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  allowUnset = false,
}: {
  name: string;
  options: ReadonlyArray<T>;
  value?: T;
  onChange: (v: T | undefined) => void;
  /** 같은 항목을 다시 클릭하면 선택 해제할지 여부 */
  allowUnset?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="flex items-center gap-2"
    >
      {options.map((opt) => {
        const id = `${name}-${opt}`;
        const checked = value === opt;
        return (
          <label
            key={opt}
            htmlFor={id}
            className={[
              "inline-flex h-8 min-w-10 items-center justify-center rounded-lg px-3 text-sm",
              "border transition-colors select-none cursor-pointer",
              checked
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            <input
              id={id}
              type="radio"
              name={name}
              className="sr-only peer"
              checked={checked}
              onChange={() => {
                // 일반 선택
                onChange(opt);
              }}
              onClick={(e) => {
                // ✅ allowUnset: 이미 선택된 항목 클릭 시 해제
                if (allowUnset && checked) {
                  e.preventDefault(); // 기본 체크 동작 막기
                  onChange(undefined);
                }
              }}
            />
            <span>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}
