"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  active: boolean;
  onChange: (next: boolean) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  labelOn?: string;
  labelOff?: string;
};

export default function StarToggleButton({
  active,
  onChange,
  size = "sm",
  className,
  disabled,
  labelOn = "즐겨찾기 해제",
  labelOff = "즐겨찾기 추가",
}: Props) {
  // icon 변형이 [&_svg]:size-6을 넣으므로, 강제로 덮어쓰는 클래스 사용(!)
  const svgSize =
    size === "sm"
      ? "[&_svg]:!w-5 [&_svg]:!h-5"
      : size === "lg"
      ? "[&_svg]:!w-7 [&_svg]:!h-7"
      : "[&_svg]:!w-6 [&_svg]:!h-6"; // md

  const aria = active ? labelOn : labelOff;

  return (
    <Button
      type="button"
      variant="plain"
      size="icon"
      className={cn(
        "rounded-none p-0 h-auto w-auto border-0 bg-transparent shadow-none hover:bg-transparent",
        svgSize,
        className
      )}
      aria-pressed={active}
      aria-label={aria}
      title={aria}
      onMouseDown={(e) => e.stopPropagation()} // 말풍선 닫힘 방지
      onClick={(e) => {
        e.stopPropagation();
        onChange(!active);
      }}
      disabled={disabled}
    >
      <Star
        className={cn(
          "transition-all",
          active ? "text-yellow-500" : "text-gray-400"
        )}
        fill={active ? "currentColor" : "none"}
        strokeWidth={active ? 0 : 2}
      />
    </Button>
  );
}
