"use client";

import { Input } from "@/components/atoms/Input/Input";
import { ChevronUp, ChevronDown } from "lucide-react";
import Field from "@/components/atoms/Field/Field";
import {
  KeyboardEventHandler,
  useCallback,
  useRef,
  WheelEventHandler,
} from "react";
import { Button } from "@/components/atoms/Button/Button";

export interface NumberFieldProps {
  label: string;
  value: string;
  setValue: (v: string) => void;
  placeholder?: string;

  step?: number;
  min?: number;
  max?: number;

  align?: "start" | "center" | "end";
  labelWidth?: number | string;
  rowMinHeight?: number | string;
  dense?: boolean;
  className?: string;
}

export default function NumberField({
  label,
  value,
  setValue,
  placeholder,
  step = 1,
  min = 0,
  max,
  align = "start",
  labelWidth = 56,
  rowMinHeight = 36,
  dense = true,
  className,
}: NumberFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const toNum = useCallback((s: string) => {
    if (s.trim() === "") return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }, []);

  const clamp = useCallback(
    (n: number) => {
      if (typeof max === "number") n = Math.min(n, max);
      if (typeof min === "number") n = Math.max(n, min);
      return n;
    },
    [min, max]
  );

  const inc = useCallback(() => {
    const curr = toNum(value);
    const next = Number.isNaN(curr) ? clamp(step) : clamp(curr + step);
    setValue(String(next));
  }, [value, step, clamp, setValue, toNum]);

  const dec = useCallback(() => {
    const curr = toNum(value);
    const next = Number.isNaN(curr) ? clamp(min ?? 0) : clamp(curr - step);
    setValue(String(next));
  }, [value, step, clamp, setValue, toNum, min]);

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      inc();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      dec();
    }
  };

  const onWheel: WheelEventHandler<HTMLInputElement> = (e) => {
    if (document.activeElement !== inputRef.current) return;
    e.preventDefault();
    if (e.deltaY < 0) inc();
    else dec();
  };

  return (
    <Field
      label={label}
      dense={dense}
      align={align}
      labelWidth={labelWidth}
      rowMinHeight={rowMinHeight}
      className={className}
    >
      <div className="relative inline-flex items-center w-full">
        <Input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onWheel={onWheel}
          placeholder={placeholder}
          className="h-8 w-24 pr-7 text-right"
          inputMode="numeric"
          step={step}
          min={min}
          {...(typeof max === "number" ? { max } : {})}
        />

        <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-center">
          <Button
            type="button"
            onClick={inc}
            variant="plain"
            size="tinyIcon"
            className="flex items-center justify-center text-gray-400/70 hover:text-gray-700"
            aria-label="증가"
            tabIndex={-1}
          >
            <ChevronUp className="w-3 h-3" strokeWidth={1.5} />
          </Button>
          <Button
            type="button"
            onClick={dec}
            variant="plain"
            size="tinyIcon"
            className="flex items-center justify-center text-gray-400/70 hover:text-gray-700"
            aria-label="감소"
            tabIndex={-1}
          >
            <ChevronDown className="w-3 h-3" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </Field>
  );
}
