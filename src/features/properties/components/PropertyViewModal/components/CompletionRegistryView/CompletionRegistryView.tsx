"use client";

import Field from "@/components/atoms/Field/Field";
import type {
  Grade,
  Registry,
} from "@/features/properties/types/property-domain";
import Pill from "./components/Pill";

// 안전 출력 유틸
const show = (v: any) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "")
    ? "-"
    : String(v);

// YYYY-MM-DD 또는 Date → YYYY-MM-DD
function toYmd(input?: string | Date | null): string | undefined {
  if (!input) return undefined;
  if (input instanceof Date && !isNaN(input.getTime())) {
    const y = input.getFullYear();
    const m = String(input.getMonth() + 1).padStart(2, "0");
    const d = String(input.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof input === "string" && input.length >= 10) {
    return input.slice(0, 10);
  }
  return undefined;
}

// 숫자면 천단위 콤마, 그 외는 show()
function formatPriceMan(v: string | number | null | undefined): string {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v.toLocaleString("ko-KR");
  }
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString("ko-KR") : show(v);
  }
  return show(v);
}

interface CompletionRegistryViewProps {
  completionDate?: string | Date | null;
  salePrice?: string | number | null;
  registry?: Registry;
  slopeGrade?: Grade;
  structureGrade?: Grade;
}

export default function CompletionRegistryView({
  completionDate,
  salePrice,
  registry,
  slopeGrade,
  structureGrade,
}: CompletionRegistryViewProps) {
  const ymd = toYmd(completionDate);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 items-center">
        <Field label="경사도" align="center">
          <Pill text={slopeGrade ?? "-"} />
        </Field>
        <Field label="구조" align="center">
          <Pill text={structureGrade ?? "-"} />
        </Field>
      </div>

      <div className="grid grid-cols-2 items-center">
        <Field label="준공일" align="center">
          <div className="h-9 flex items-center text-sm">{ymd ?? "-"}</div>
        </Field>
        <Field label="등기" align="center">
          <Pill text={registry ?? "-"} />
        </Field>
      </div>

      <Field label="최저실입" align="center">
        <div className="flex items-center gap-3">
          <div className="h-9 flex items-center text-sm">
            {formatPriceMan(salePrice)}
          </div>
          <span className="text-sm text-gray-500">만원</span>
        </div>
      </Field>
    </div>
  );
}
