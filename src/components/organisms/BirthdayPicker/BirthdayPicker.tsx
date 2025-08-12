"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from "@/components/atoms/Popover/Popover";
import { Calendar } from "@/components/atoms/Calendar/Calendar";

function buildYmdWhileTyping(raw: string) {
  // 숫자만 뽑고 최대 8자리(YYYYMMDD)
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const y = digits.slice(0, 4);
  const m = digits.slice(4, 6); // 0~2자리
  const d = digits.slice(6, 8); // 0~2자리

  let out = y;
  if (m.length > 0) out += "-" + m; // ❗패딩하지 않음
  if (d.length > 0) out += "-" + d; // ❗패딩하지 않음
  return out;
}

function normalizeYmdOnBlur(s: string) {
  // 완전히 비어있으면 그대로 반환(선택 입력)
  if (!s) return "";
  const m = s.match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/);
  if (!m) return s; // 형식 이상하면 원본 유지(필요시 비우도록 바꿀 수 있음)

  const yy = m[1];
  const mm = m[2] ? m[2].padStart(2, "0") : ""; // 여기서만 패딩
  const dd = m[3] ? m[3].padStart(2, "0") : "";

  const final = dd ? `${yy}-${mm}-${dd}` : mm ? `${yy}-${mm}` : yy;
  return final;
}

function isCompleteYmd(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = {
  value?: string;
  onChange: (next: string) => void;
  placeholder?: string;
  fromYear?: number;
  toYear?: number;
  disabled?: boolean;
  className?: string;
};

export default function BirthdayPicker({
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  fromYear = 1960,
  toYear = new Date().getFullYear(),
  disabled,
  className,
}: Props) {
  const [draft, setDraft] = React.useState(value ?? "");
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = buildYmdWhileTyping(e.target.value);
    setDraft(next);

    // 완성(YYYY-MM-DD)이면 즉시 반영
    if (isCompleteYmd(next)) onChange(next);
    // 비우면 상위도 비우기(선택 입력)
    if (next === "") onChange("");
  };

  const handleBlur = () => {
    const normalized = normalizeYmdOnBlur(draft);
    setDraft(normalized);
    // blur 후 완성되었으면 반영
    if (isCompleteYmd(normalized)) onChange(normalized);
    // 미완성(예: 1999-01)인 상태는 그대로 둠(사용자 의도 보존)
    // 필요하면 여기서 미완성은 비우도록 바꿀 수 있음.
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        inputMode="numeric"
        placeholder={placeholder}
        disabled={disabled}
      />

      <Popover open={open} onOpenChange={setOpen}>
        {/* 인풋 전체를 앵커로 잡아 정렬 안정화 (선택) */}
        <PopoverAnchor className="absolute inset-0" />
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            disabled={disabled}
            aria-label="달력 열기"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={8}
          avoidCollisions={false} // ✅ flip/shift 안 함 → 항상 아래
          sticky="always" // ✅ 스크롤/재배치에도 위치 유지
          className="p-0 w-auto"
        >
          <Calendar
            className="min-w-[320px]"
            mode="single"
            selected={isCompleteYmd(draft) ? new Date(draft) : undefined}
            onSelect={(d) => {
              if (!d) return;
              const next = toYMD(d);
              setDraft(next);
              onChange(next);
              setOpen(false);
            }}
            captionLayout="dropdown"
            fromYear={fromYear}
            toYear={toYear}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
