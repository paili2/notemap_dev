"use client";

import { Fragment } from "react";
import Field from "../Field";
import { Button } from "@/components/atoms/Button/Button";
import { Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/Select";

import type {
  AspectRowLite,
  OrientationValue,
} from "@/features/properties/types/property-domain";
import { ORIENTATIONS } from "../constants";

type Props = {
  aspects: AspectRowLite[];
  addAspect: () => void;
  removeAspect: (no: number) => void;
  setAspectDir: (no: number, dir: OrientationValue | "") => void;
};

export default function AspectsSection({
  aspects,
  addAspect,
  removeAspect,
  setAspectDir,
}: Props) {
  const list = ORIENTATIONS;

  // 두 개씩 끊어서 한 줄에 배치
  const rows: AspectRowLite[][] = [];
  for (let i = 0; i < aspects.length; i += 2) {
    rows.push(aspects.slice(i, i + 2));
  }

  const Cell = ({ row }: { row: AspectRowLite }) => (
    <div className="flex items-center gap-2">
      <span className="w-10 text-right">{row.no}호</span>
      <Select
        value={row.dir}
        onValueChange={(v) => setAspectDir(row.no, v as OrientationValue)}
      >
        <SelectTrigger className="w-[110px] h-9">
          <SelectValue placeholder="방향" />
        </SelectTrigger>
        <SelectContent position="popper" className="z-[1205]">
          {list.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {aspects.length > 1 && (
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => removeAspect(row.no)}
          title="삭제"
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <Field label="향">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-x-3 gap-y-2">
        {rows.map((pair, rowIdx) => {
          const isLastRow = rowIdx === rows.length - 1;
          // 안정적인 key: 행 번호 조합
          const pairKey =
            pair
              .map((p) => p?.no)
              .filter(Boolean)
              .join("-") || `aspect-row-${rowIdx}`;

          return (
            <Fragment key={pairKey}>
              <div>
                {pair[0] ? <Cell row={pair[0]} /> : <div className="h-9" />}
              </div>
              <div>
                {pair[1] ? <Cell row={pair[1]} /> : <div className="h-9" />}
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
