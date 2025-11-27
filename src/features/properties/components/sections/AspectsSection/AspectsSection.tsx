"use client";

import { Fragment, useEffect, useRef } from "react";
import Field from "@/components/atoms/Field/Field";
import { Button } from "@/components/atoms/Button/Button";
import { Plus } from "lucide-react";

import type { AspectRowLite } from "@/features/properties/types/property-domain";
import { ORIENTATIONS } from "../../constants";
import { AspectsSectionProps } from "./types";
import AspectCell from "./components/AspectCell";

export default function AspectsSection({
  aspects,
  addAspect,
  removeAspect,
  setAspectDir,
  isVisitPlanPin,
}: AspectsSectionProps & {
  /** ✅ 답사예정 핀 여부 */
  isVisitPlanPin?: boolean;
}) {
  const list = ORIENTATIONS;

  // ✅ 일반핀 → 답사예정으로 바뀔 때, 모든 향(dir) 초기화
  const prevIsVisitRef = useRef<boolean | undefined>(isVisitPlanPin);
  useEffect(() => {
    const prev = prevIsVisitRef.current;

    if (isVisitPlanPin && !prev) {
      aspects.forEach((row) => {
        const no = (row as any)?.no;
        if (no != null) {
          // dir을 빈 문자열로 초기화 (또는 undefined)
          setAspectDir(no, "");
        }
      });
    }

    prevIsVisitRef.current = isVisitPlanPin;
  }, [isVisitPlanPin, aspects, setAspectDir]);

  // 두 개씩 끊어서 한 줄에 배치
  const rows: AspectRowLite[][] = [];
  for (let i = 0; i < aspects.length; i += 2) {
    rows.push(aspects.slice(i, i + 2));
  }

  return (
    <Field label="향">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-x-3 gap-y-2 items-center">
        {rows.map((pair, rowIdx) => {
          const isLastRow = rowIdx === rows.length - 1;
          const pairKey =
            pair
              .map((p) => p?.no)
              .filter(Boolean)
              .join("-") || `aspect-row-${rowIdx}`;

          return (
            <Fragment key={pairKey}>
              <div>
                {pair[0] ? (
                  <AspectCell
                    row={pair[0]}
                    orientations={list}
                    setAspectDir={setAspectDir}
                    removeAspect={removeAspect}
                    canRemove={aspects.length > 1}
                  />
                ) : (
                  <div className="h-9" />
                )}
              </div>
              <div>
                {pair[1] ? (
                  <AspectCell
                    row={pair[1]}
                    orientations={list}
                    setAspectDir={setAspectDir}
                    removeAspect={removeAspect}
                    canRemove={aspects.length > 1}
                  />
                ) : (
                  <div className="h-9" />
                )}
              </div>
              <div className="flex items-center justify-end">
                {isLastRow && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={addAspect}
                    title="추가"
                    className="h-8 w-8 p-0 bg-transparent hover:bg-transparent focus-visible:ring-0 border-none shadow-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </Field>
  );
}
