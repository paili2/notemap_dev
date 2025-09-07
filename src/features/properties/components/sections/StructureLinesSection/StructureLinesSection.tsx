"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Trash2, Plus } from "lucide-react";
import type { UnitLine } from "@/features/properties/types/property-domain";

type StructureLinesProps = {
  lines: UnitLine[];
  onAddPreset: (preset: string) => void;
  onAddEmpty: () => void;
  onUpdate: (idx: number, patch: Partial<UnitLine>) => void;
  onRemove: (idx: number) => void;
  presets: readonly string[];
  title?: string;
};

export default function StructureLinesSection({
  lines,
  onAddPreset,
  onAddEmpty,
  onUpdate,
  onRemove,
  presets,
  title = "구조별 입력",
}: StructureLinesProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{title}</div>
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => (
            <Button
              key={p}
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              type="button"
              onClick={() => onAddPreset(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            size="sm"
            variant="secondary"
            className="h-7 px-2 text-xs"
            type="button"
            onClick={onAddEmpty}
          >
            <Plus className="h-3 w-3 mr-1" />
            직접추가
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {lines.length === 0 && (
          <div className="text-xs text-muted-foreground">
            프리셋을 누르거나 ‘직접추가’를 눌러 행을 추가하세요.
          </div>
        )}

        {lines.map((line, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[88px_auto_auto_minmax(180px,1fr)_32px] items-center gap-2"
          >
            <Input
              value={`${line.rooms || ""}/${line.baths || ""}`}
              onChange={(e) => {
                const v = e.target.value.replace(/\s/g, "");
                const [r, b] = v.split("/");
                onUpdate(idx, {
                  rooms: parseInt(r || "0", 10) || 0,
                  baths: parseInt(b || "0", 10) || 0,
                });
              }}
              placeholder="2/1"
              className="h-9 text-center"
              inputMode="numeric"
              pattern="[0-9/]*" // ← 선택: 숫자/슬래시만
            />

            <label className="inline-flex items-center gap-2 text-sm">
              <Checkbox
                checked={line.duplex}
                onCheckedChange={(c) => onUpdate(idx, { duplex: !!c })}
              />
              <span>복층</span>
            </label>

            <label className="inline-flex items-center gap-2 text-sm">
              <Checkbox
                checked={line.terrace}
                onCheckedChange={(c) => onUpdate(idx, { terrace: !!c })}
              />
              <span>테라스</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <Input
                value={line.primary}
                onChange={(e) => onUpdate(idx, { primary: e.target.value })}
                placeholder="직접입력"
                className="h-9"
                inputMode="numeric"
              />
              <Input
                value={line.secondary}
                onChange={(e) => onUpdate(idx, { secondary: e.target.value })}
                placeholder="직접입력"
                className="h-9"
                inputMode="numeric"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => onRemove(idx)}
              title="행 삭제"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
