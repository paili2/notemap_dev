"use client";

import * as React from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import type {
  OrientationRow,
  OrientationValue,
} from "@/features/properties/types/property-domain";

type CreateFormValues = {
  orientations: OrientationRow[];
};

const ORIENTATION_OPTIONS: OrientationValue[] = [
  "동",
  "서",
  "남",
  "북",
  "남동",
  "남서",
  "북동",
  "북서",
  "동서",
  "남북",
];

// 호수 개수와 기존 데이터로 기본 행 구성
function makeRows(count: number, seed?: OrientationRow[]): OrientationRow[] {
  const base = Array.from({ length: count }, (_, i) => ({
    ho: i + 1,
    value: "" as const,
  }));
  if (!seed?.length) return base;
  return base.map((row, i) => {
    const s = seed[i];
    return s
      ? { ho: row.ho, value: (s.value ?? "") as OrientationValue | "" }
      : row;
  });
}

export type OrientationFormProps = {
  propertyId: string; // 매물 고유 ID (폼 상태 분리용)
  hoCount: number; // 호수 개수
  initial?: OrientationRow[]; // 기존 저장값(수정 모드)
  onSave: (rows: OrientationRow[]) => void; // 저장 콜백 (API 연동)
  className?: string;
};

export default function OrientationForm({
  propertyId,
  hoCount,
  initial,
  onSave,
  className,
}: OrientationFormProps) {
  const defaultValues = React.useMemo<CreateFormValues>(
    () => ({ orientations: makeRows(hoCount, initial) }),
    [hoCount, initial]
  );

  const { control, handleSubmit, reset } = useForm<CreateFormValues>({
    defaultValues,
  });

  // propertyId/hoCount/initial이 바뀌면 폼 리셋 → 다른 매물 값이 섞이지 않음
  React.useEffect(() => {
    reset(defaultValues);
  }, [propertyId, hoCount, initial, reset, defaultValues]);

  const { fields } = useFieldArray({ control, name: "orientations" });

  const submit = (v: CreateFormValues) => onSave(v.orientations);

  return (
    <form
      key={propertyId}
      onSubmit={handleSubmit(submit)}
      className={className ?? "space-y-4"}
    >
      <div className="space-y-2">
        <h3 className="font-semibold">향(호수별)</h3>
        <div className="grid gap-3">
          {fields.map((f, i) => (
            <div key={f.id} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-sm text-muted-foreground">
                {f.ho}호
              </span>
              <Controller
                control={control}
                name={`orientations.${i}.value`}
                render={({ field }) => (
                  <select {...field} className="w-44 rounded border px-2 py-1">
                    <option value="">선택</option>
                    {ORIENTATION_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          저장
        </button>
        <button
          type="button"
          className="rounded border px-4 py-2"
          onClick={() => reset(defaultValues)}
        >
          되돌리기
        </button>
      </div>
    </form>
  );
}
