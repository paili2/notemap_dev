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

  /** ⬇️ 추가: Content에 클래스 지정(Z-index 등) */
  contentClassName?: string;

  /** ⬇️ 추가: Radix Content 포지셔닝 옵션 */
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
  const controlledOpen = typeof open === "boolean" ? open : undefined; // uncontrolled도 지원
  const setOpenGuarded = useGuardedSetter<boolean>(onOpenChange ?? (() => {}));

  // Trigger ref를 안정 콜백으로 만들어 동일 노드 재세팅 시 setState 루프 방지
  const setTrigRef = useStableRefCallback<HTMLButtonElement>();

  return (
    <Select
      value={value ?? undefined}
      onValueChange={(v) => onChange(v ?? null)}
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
