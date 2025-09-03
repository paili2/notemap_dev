"use client";

import Field from "@/components/atoms/Field/Field";
import { Input } from "@/components/atoms/Input/Input";
import { toPy, toM2 } from "@/features/properties/lib/area";
import { AreaSet, AreaSetsSectionProps } from "./types";

export default function AreaSetsSection({
  baseAreaSet,
  setBaseAreaSet,
  extraAreaSets,
  setExtraAreaSets,
}: AreaSetsSectionProps) {
  const addSet = () => {
    const idx = extraAreaSets.length + 2; // #2부터 시작
    setExtraAreaSets([
      ...extraAreaSets,
      {
        title: `개별 평수입력 #${idx}`,
        exMinM2: "",
        exMaxM2: "",
        exMinPy: "",
        exMaxPy: "",
        realMinM2: "",
        realMaxM2: "",
        realMinPy: "",
        realMaxPy: "",
      },
    ]);
  };

  const removeSet = (idx: number) => {
    setExtraAreaSets(extraAreaSets.filter((_, i) => i !== idx));
  };

  const patchSet = (idx: number, patch: Partial<AreaSet>) => {
    setExtraAreaSets(
      extraAreaSets.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  };

  const renderRow = (
    label: React.ReactNode,
    m2Min: string,
    onM2Min: (v: string) => void,
    m2Max: string,
    onM2Max: (v: string) => void,
    pyMin: string,
    onPyMin: (v: string) => void,
    pyMax: string,
    onPyMax: (v: string) => void
  ) => (
    <div className="flex items-center gap-8">
      <Field label={label}>
        <div className="flex items-center gap-2">
          {/* m² 최소 */}
          <Input
            className="h-9 w-24"
            value={m2Min}
            onChange={(e) => onM2Min(e.target.value)}
            placeholder="최소"
            inputMode="numeric"
          />
          <span className="text-muted-foreground">m² ~</span>
          {/* m² 최대 */}
          <Input
            className="h-9 w-24"
            value={m2Max}
            onChange={(e) => onM2Max(e.target.value)}
            placeholder="최대"
            inputMode="numeric"
          />
          <span className="text-muted-foreground">m²</span>

          <div className="w-3" />

          {/* 평 최소 */}
          <Input
            className="h-9 w-24"
            value={pyMin}
            onChange={(e) => onPyMin(e.target.value)}
            placeholder="최소"
            inputMode="numeric"
          />
          <span className="text-muted-foreground">평 ~</span>
          {/* 평 최대 */}
          <Input
            className="h-9 w-24"
            value={pyMax}
            onChange={(e) => onPyMax(e.target.value)}
            placeholder="최대"
            inputMode="numeric"
          />
          <span className="text-muted-foreground">평</span>
        </div>
      </Field>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 기본(첫 번째) 세트 */}
      <div className="rounded-xl border bg-muted/10 p-3 space-y-3">
        <div className="mb-1">
          <Input
            className="h-8 w-64"
            value={baseAreaSet.title}
            onChange={(e) =>
              setBaseAreaSet({ ...baseAreaSet, title: e.target.value })
            }
            placeholder="개별 평수입력"
          />
        </div>

        {renderRow(
          "전용",
          baseAreaSet.exMinM2,
          (v) =>
            setBaseAreaSet({
              ...baseAreaSet,
              exMinM2: v,
              exMinPy: toPy(v),
            }),
          baseAreaSet.exMaxM2,
          (v) =>
            setBaseAreaSet({
              ...baseAreaSet,
              exMaxM2: v,
              exMaxPy: toPy(v),
            }),
          baseAreaSet.exMinPy,
          (v) =>
            setBaseAreaSet({
              ...baseAreaSet,
              exMinPy: v,
              exMinM2: toM2(v),
            }),
          baseAreaSet.exMaxPy,
          (v) =>
            setBaseAreaSet({
              ...baseAreaSet,
              exMaxPy: v,
              exMaxM2: toM2(v),
            })
        )}

        {renderRow(
          "실평",
          baseAreaSet.realMinM2,
          (v) =>
            setBaseAreaSet({
              ...baseAreaSet,
              realMinM2: v,
              realMinPy: toPy(v),
            }),
          baseAreaSet.realMaxM2,
          (v) =>
            setBaseAreaSet({
              ...baseAreaSet,
              realMaxM2: v,
              realMaxPy: toPy(v),
            }),
          baseAreaSet.realMinPy,
          (v) =>
            setBaseAreaSet({
              ...baseAreaSet,
              realMinPy: v,
              realMinM2: toM2(v),
            }),
          baseAreaSet.realMaxPy,
          (v) =>
            setBaseAreaSet({
              ...baseAreaSet,
              realMaxPy: v,
              realMaxM2: toM2(v),
            })
        )}
      </div>

      {extraAreaSets.map((s, idx) => (
        <div
          key={idx}
          className="rounded-xl border bg-muted/5 p-3 space-y-3 relative"
        >
          <div className="absolute right-3 top-3">
            <button
              type="button"
              onClick={() => removeSet(idx)}
              className="text-xs px-2 py-1 rounded-md border hover:bg-muted"
              title="세트 삭제"
            >
              삭제
            </button>
          </div>

          <div className="mb-1">
            <Input
              className="h-8 w-64"
              value={s.title ?? `개별 평수입력 #${idx + 2}`}
              onChange={(e) => patchSet(idx, { title: e.target.value })}
              placeholder={`개별 평수입력 #${idx + 2}`}
            />
          </div>

          {renderRow(
            "전용",
            s.exMinM2,
            (v) => patchSet(idx, { exMinM2: v, exMinPy: toPy(v) }),
            s.exMaxM2,
            (v) => patchSet(idx, { exMaxM2: v, exMaxPy: toPy(v) }),
            s.exMinPy,
            (v) => patchSet(idx, { exMinPy: v, exMinM2: toM2(v) }),
            s.exMaxPy,
            (v) => patchSet(idx, { exMaxPy: v, exMaxM2: toM2(v) })
          )}

          {renderRow(
            "실평",
            s.realMinM2,
            (v) => patchSet(idx, { realMinM2: v, realMinPy: toPy(v) }),
            s.realMaxM2,
            (v) => patchSet(idx, { realMaxM2: v, realMaxPy: toPy(v) }),
            s.realMinPy,
            (v) => patchSet(idx, { realMinPy: v, realMinM2: toM2(v) }),
            s.realMaxPy,
            (v) => patchSet(idx, { realMaxPy: v, realMaxM2: toM2(v) })
          )}
        </div>
      ))}

      <div>
        <button
          type="button"
          onClick={addSet}
          className="text-sm px-3 h-9 rounded-md border hover:bg-muted"
          title="전용/실평 세트 추가"
        >
          + 개별 평수 입력
        </button>
      </div>
    </div>
  );
}
