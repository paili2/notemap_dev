// 준공일 + 최저실입

// CompletionPriceSection.tsx
"use client";

import { Input } from "@/components/atoms/Input/Input";
import Field from "../Field";

/** 준공일 + 최저실입 섹션 */
export default function CompletionPriceSection({
  completionDate,
  setCompletionDate,
  jeonsePrice,
  setJeonsePrice,
}: {
  completionDate: string;
  setCompletionDate: (v: string) => void;
  jeonsePrice: string;
  setJeonsePrice: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <Field label="준공일">
        <Input
          value={completionDate}
          onChange={(e) => setCompletionDate(e.target.value)}
          placeholder="ex) 2024.04.14"
          className="h-9"
        />
      </Field>
      <Field label="최저실입">
        <Input
          value={jeonsePrice}
          onChange={(e) => setJeonsePrice(e.target.value)}
          placeholder="ex) 5000만원"
          className="h-9"
        />
      </Field>
    </div>
  );
}
