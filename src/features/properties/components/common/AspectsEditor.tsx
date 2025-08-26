// features/properties/components/modal/PropertyCreateModal/components/AspectsEditor.tsx
"use client";

import { Fragment } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/Select";

import {
  AspectRowLite,
  type OrientationValue,
} from "@/features/properties/types/property-domain";

import { ORIENTATIONS as DEFAULT_ORIENTATIONS } from "@/features/properties/components/common/constants";

type Props = {
  aspects: AspectRowLite[];
  addAspect: () => void;
  removeAspect: (no: number) => void;
  setAspectDir: (no: number, dir: OrientationValue | "") => void;
  /** 외부에서 방향 목록을 주입하고 싶을 때. 없으면 도메인 기본값 사용 */
  orientations?: readonly OrientationValue[];
};

export default function AspectsEditor({
  aspects,
  addAspect,
  removeAspect,
  setAspectDir,
  orientations,
}: Props): JSX.Element {
  const list = orientations ?? DEFAULT_ORIENTATIONS;

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
    <div className="grid grid-cols-[1fr_1fr_auto] gap-x-3 gap-y-2">
      {rows.map((pair, rowIdx) => {
        const isLastRow = rowIdx === rows.length - 1;
        return (
          <Fragment key={`aspect-row-${rowIdx}`}>
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
  );
}
