// 전용/실평 입력

"use client";

import { Input } from "@/components/atoms/Input/Input";
import Field from "../Field";
import { toM2, toPy } from "@/features/properties/lib/area";

export default function AreaSection({
  exMinM2,
  setExMinM2,
  exMaxM2,
  setExMaxM2,
  exMinPy,
  setExMinPy,
  exMaxPy,
  setExMaxPy,
  realMinM2,
  setRealMinM2,
  realMaxM2,
  setRealMaxM2,
  realMinPy,
  setRealMinPy,
  realMaxPy,
  setRealMaxPy,
}: {
  exMinM2: string;
  setExMinM2: (v: string) => void;
  exMaxM2: string;
  setExMaxM2: (v: string) => void;
  exMinPy: string;
  setExMinPy: (v: string) => void;
  exMaxPy: string;
  setExMaxPy: (v: string) => void;
  realMinM2: string;
  setRealMinM2: (v: string) => void;
  realMaxM2: string;
  setRealMaxM2: (v: string) => void;
  realMinPy: string;
  setRealMinPy: (v: string) => void;
  realMaxPy: string;
  setRealMaxPy: (v: string) => void;
}) {
  return (
    <>
      {/* 전용 (범위) */}
      <Field label="전용">
        <div className="flex gap-2">
          {/* m² */}
          <div className="flex items-center gap-2">
            <Input
              value={exMinM2}
              onChange={(e) => setExMinM2(e.target.value)}
              onBlur={(e) => setExMinPy(toPy(e.target.value))}
              placeholder="최소"
              className="h-9 w-20 text-right"
              inputMode="decimal"
            />
            <span>m²</span> <span>~</span>
            <Input
              value={exMaxM2}
              onChange={(e) => setExMaxM2(e.target.value)}
              onBlur={(e) => setExMaxPy(toPy(e.target.value))}
              placeholder="최대"
              className="h-9 w-20 text-right"
              inputMode="decimal"
            />
            <span>m²</span>
          </div>
          {/* 평 */}
          <div className="flex items-center gap-2">
            <Input
              value={exMinPy}
              onChange={(e) => setExMinPy(e.target.value)}
              onBlur={(e) => setExMinM2(toM2(e.target.value))}
              placeholder="최소"
              className="h-9 w-20 text-right"
              inputMode="decimal"
            />
            <span>평</span> <span>~</span>
            <Input
              value={exMaxPy}
              onChange={(e) => setExMaxPy(e.target.value)}
              onBlur={(e) => setExMaxM2(toM2(e.target.value))}
              placeholder="최대"
              className="h-9 w-20 text-right"
              inputMode="decimal"
            />
            <span>평</span>
          </div>
        </div>
      </Field>

      {/* 실평 (범위) */}
      <Field label="실평">
        <div className="flex gap-2">
          {/* m² */}
          <div className="flex items-center gap-2">
            <Input
              value={realMinM2}
              onChange={(e) => setRealMinM2(e.target.value)}
              onBlur={(e) => setRealMinPy(toPy(e.target.value))}
              placeholder="최소"
              className="h-9 w-20 text-right"
              inputMode="decimal"
            />
            <span>m²</span> <span>~</span>
            <Input
              value={realMaxM2}
              onChange={(e) => setRealMaxM2(e.target.value)}
              onBlur={(e) => setRealMaxPy(toPy(e.target.value))}
              placeholder="최대"
              className="h-9 w-20 text-right"
              inputMode="decimal"
            />
            <span>m²</span>
          </div>
          {/* 평 */}
          <div className="flex items-center gap-2">
            <Input
              value={realMinPy}
              onChange={(e) => setRealMinPy(e.target.value)}
              onBlur={(e) => setRealMinM2(toM2(e.target.value))}
              placeholder="최소"
              className="h-9 w-20 text-right"
              inputMode="decimal"
            />
            <span>평</span> <span>~</span>
            <Input
              value={realMaxPy}
              onChange={(e) => setRealMaxPy(e.target.value)}
              onBlur={(e) => setRealMaxM2(toM2(e.target.value))}
              placeholder="최대"
              className="h-9 w-20 text-right"
              inputMode="decimal"
            />
            <span>평</span>
          </div>
        </div>
      </Field>
    </>
  );
}
