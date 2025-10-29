"use client";
import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/atoms/Popover/Popover";

// ✅ 여기가 핵심: safeRefs.ts에서 가져오기
import {
  useBooleanGuardSetter,
  useStableRefCallback,
} from "@/shared/react/safeRefs";

type Props = {
  trigger: (props: {
    refCb: (el: HTMLElement | null) => void;
  }) => React.ReactNode;
  content: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  align?: "start" | "center" | "end";
  className?: string;
};

export default function SafePopover({
  trigger,
  content,
  open,
  onOpenChange,
  align,
  className,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const actualOpen = typeof open === "boolean" ? open : internalOpen;

  // ✅ 동등성 가드 setter 사용
  const guardedSetOpen = useBooleanGuardSetter(onOpenChange ?? setInternalOpen);

  // ✅ ref 안정화
  const setTriggerRef = useStableRefCallback<HTMLElement>();

  return (
    <Popover open={actualOpen} onOpenChange={guardedSetOpen}>
      <PopoverTrigger asChild>
        {trigger({ refCb: setTriggerRef })}
      </PopoverTrigger>
      <PopoverContent align={align} className={className}>
        {content}
      </PopoverContent>
    </Popover>
  );
}
