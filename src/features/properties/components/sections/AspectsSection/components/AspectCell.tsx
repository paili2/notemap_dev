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
  setAspectDir: (no: number, dir: OrientationValue | "") => void;
  removeAspect: (no: number) => void;
  canRemove: boolean;
};

// controlled 유지용 가짜 빈 값
const EMPTY = "__EMPTY__";

export default function AspectCell({
  row,
  orientations,
  setAspectDir,
  removeAspect,
  canRemove,
}: Props) {
  // 항상 문자열을 넘겨서 controlled 유지
  const value = row.dir && row.dir.length > 0 ? row.dir : EMPTY;

  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-right">{row.no}호</span>

      <Select
        value={value}
        onValueChange={(v) => {
          // 가짜 값이 선택되면 빈 문자열로 상태 반영 (placeholder 상태)
          setAspectDir(row.no, v === EMPTY ? "" : (v as OrientationValue));
        }}
      >
        <SelectTrigger className="w-[110px] h-9">
          {/* value가 EMPTY여도 label은 아래 disabled 아이템의 라벨로 보임 */}
          <SelectValue placeholder="방향" />
        </SelectTrigger>
        <SelectContent position="popper" className="z-[1205]">
          {/* placeholder 역할의 disabled 아이템 */}
          <SelectItem value={EMPTY} disabled>
            방향
          </SelectItem>

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
