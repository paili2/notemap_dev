"use client";

import * as React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms/Select/Select";
import {
  useStableRefCallback,
  useGuardedSetter,
} from "@/shared/react/safeRefs";

type Item = { value: string; label: React.ReactNode };

type Props = {
  value?: string | null;
  onChange: (v: string | null) => void;
  items: Item[];
  placeholder?: string;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  className?: string;

  contentClassName?: string;
  position?: "item-aligned" | "popper";
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

export default function SafeSelect({
  value,
  onChange,
  items,
  placeholder = "선택",
  open,
  onOpenChange,
  className,
  contentClassName,
  position = "popper",
  side,
  align,
  sideOffset,
}: Props) {
  const controlledOpen = typeof open === "boolean" ? open : undefined;
  const setOpenGuarded = useGuardedSetter<boolean>(onOpenChange ?? (() => {}));
  const setTrigRef = useStableRefCallback<HTMLButtonElement>();

  return (
    <Select
      value={value ?? ""} // ✅ 항상 문자열로 유지(초기에도 controlled)
      onValueChange={(v) => onChange(v === "" ? null : v)} // "" ⇄ null 변환
      open={controlledOpen}
      onOpenChange={(v) => setOpenGuarded(Boolean(v))}
    >
      <SelectTrigger ref={setTrigRef} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent
        position={position}
        className={contentClassName}
        {...(side ? { side } : {})}
        {...(align ? { align } : {})}
        {...(typeof sideOffset === "number" ? { sideOffset } : {})}
      >
        {items.map((it) => (
          <SelectItem key={String(it.value)} value={it.value}>
            {it.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
