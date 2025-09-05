import { Button } from "@/components/atoms/Button/Button";
import { Trash2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms/Select/Select";
import type {
  AspectRowLite,
  OrientationValue,
} from "@/features/properties/types/property-domain";

type Props = {
  row: AspectRowLite;
  orientations: readonly OrientationValue[];
  setAspectDir: (no: number, dir: OrientationValue) => void;
  removeAspect: (no: number) => void;
  canRemove: boolean;
};

export default function AspectCell({
  row,
  orientations,
  setAspectDir,
  removeAspect,
  canRemove,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-right">{row.no}호</span>
      <Select
        value={row.dir || undefined}
        onValueChange={(v) => setAspectDir(row.no, v as OrientationValue)}
      >
        <SelectTrigger className="w-[110px] h-9">
          <SelectValue placeholder="방향" />
        </SelectTrigger>
        <SelectContent position="popper" className="z-[1205]">
          {orientations.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {canRemove && (
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
}
