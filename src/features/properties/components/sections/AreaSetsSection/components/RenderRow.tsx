"use client";

import Field from "@/components/atoms/Field/Field";
import { Input } from "@/components/atoms/Input/Input";
import { ReactNode } from "react";

export type RenderRowProps = {
  label: ReactNode;
  m2Min: string;
  onM2Min: (v: string) => void;
  m2Max: string;
  onM2Max: (v: string) => void;
  pyMin: string;
  onPyMin: (v: string) => void;
  pyMax: string;
  onPyMax: (v: string) => void;
};

export default function RenderRow({
  label,
  m2Min,
  onM2Min,
  m2Max,
  onM2Max,
  pyMin,
  onPyMin,
  pyMax,
  onPyMax,
}: RenderRowProps) {
  return (
    <div className="flex items-center gap-8">
      <Field label={label}>
        <div className="flex items-center gap-2">
          <Input
            className="h-9 w-24"
            value={m2Min}
            onChange={(e) => onM2Min(e.target.value)}
            placeholder="최소"
            inputMode="numeric"
          />
          <span className="text-muted-foreground">m² ~</span>
          <Input
            className="h-9 w-24"
            value={m2Max}
            onChange={(e) => onM2Max(e.target.value)}
            placeholder="최대"
            inputMode="numeric"
          />
          <span className="text-muted-foreground">m²</span>

          <div className="w-3" />

          <Input
            className="h-9 w-24"
            value={pyMin}
            onChange={(e) => onPyMin(e.target.value)}
            placeholder="최소"
            inputMode="numeric"
          />
          <span className="text-muted-foreground">평 ~</span>
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
}
