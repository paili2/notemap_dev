"use client";

import Field from "@/components/atoms/Field/Field";
import { Input } from "@/components/atoms/Input/Input";
import { toPy, toM2 } from "@/features/properties/lib/area";
import { AreaSet, AreaSetsSectionProps } from "./types";
import RenderRow from "./components/RenderRow";
import { Button } from "@/components/atoms/Button/Button";

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

        <RenderRow
          label="전용"
          m2Min={baseAreaSet.exMinM2}
          onM2Min={(v) =>
            setBaseAreaSet({ ...baseAreaSet, exMinM2: v, exMinPy: toPy(v) })
          }
          m2Max={baseAreaSet.exMaxM2}
          onM2Max={(v) =>
            setBaseAreaSet({ ...baseAreaSet, exMaxM2: v, exMaxPy: toPy(v) })
          }
          pyMin={baseAreaSet.exMinPy}
          onPyMin={(v) =>
            setBaseAreaSet({ ...baseAreaSet, exMinPy: v, exMinM2: toM2(v) })
          }
          pyMax={baseAreaSet.exMaxPy}
          onPyMax={(v) =>
            setBaseAreaSet({ ...baseAreaSet, exMaxPy: v, exMaxM2: toM2(v) })
          }
        />

        <RenderRow
          label="실평"
          m2Min={baseAreaSet.realMinM2}
          onM2Min={(v) =>
            setBaseAreaSet({ ...baseAreaSet, realMinM2: v, realMinPy: toPy(v) })
          }
          m2Max={baseAreaSet.realMaxM2}
          onM2Max={(v) =>
            setBaseAreaSet({ ...baseAreaSet, realMaxM2: v, realMaxPy: toPy(v) })
          }
          pyMin={baseAreaSet.realMinPy}
          onPyMin={(v) =>
            setBaseAreaSet({ ...baseAreaSet, realMinPy: v, realMinM2: toM2(v) })
          }
          pyMax={baseAreaSet.realMaxPy}
          onPyMax={(v) =>
            setBaseAreaSet({ ...baseAreaSet, realMaxPy: v, realMaxM2: toM2(v) })
          }
        />
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

          <RenderRow
            label="전용"
            m2Min={s.exMinM2}
            onM2Min={(v) => patchSet(idx, { exMinM2: v, exMinPy: toPy(v) })}
            m2Max={s.exMaxM2}
            onM2Max={(v) => patchSet(idx, { exMaxM2: v, exMaxPy: toPy(v) })}
            pyMin={s.exMinPy}
            onPyMin={(v) => patchSet(idx, { exMinPy: v, exMinM2: toM2(v) })}
            pyMax={s.exMaxPy}
            onPyMax={(v) => patchSet(idx, { exMaxPy: v, exMaxM2: toM2(v) })}
          />

          <RenderRow
            label="실평"
            m2Min={s.realMinM2}
            onM2Min={(v) => patchSet(idx, { realMinM2: v, realMinPy: toPy(v) })}
            m2Max={s.realMaxM2}
            onM2Max={(v) => patchSet(idx, { realMaxM2: v, realMaxPy: toPy(v) })}
            pyMin={s.realMinPy}
            onPyMin={(v) => patchSet(idx, { realMinPy: v, realMinM2: toM2(v) })}
            pyMax={s.realMaxPy}
            onPyMax={(v) => patchSet(idx, { realMaxPy: v, realMaxM2: toM2(v) })}
          />
        </div>
      ))}

      <div>
        <Button
          type="button"
          onClick={addSet}
          variant="outline"
          className="h-9 px-3 hover:bg-muted"
          title="전용/실평 세트 추가"
        >
          + 개별 평수 입력
        </Button>
      </div>
    </div>
  );
}
