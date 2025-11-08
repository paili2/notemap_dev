"use client";

import { Button } from "@/components/atoms/Button/Button";
import GridTilesIcon from "@/features/map/core/menu/components/common/icons/GridTilesIcon";
import { cn } from "@/lib/cn";

type Props = {
  pressed: boolean;
  onPress: () => void;
  className?: string;
  title?: string;
  ariaLabel?: string;
};

export default function SidebarToggleButton({
  pressed,
  onPress,
  className,
  title = "사이드바 토글",
  ariaLabel = "사이드바 토글",
}: Props) {
  return (
    <Button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation?.();
        onPress();
      }}
      variant={pressed ? "default" : "outline"}
      size="icon"
      className={cn(
        "h-10 w-10 rounded-xl shadow pointer-events-auto",
        className
      )}
      title={title}
      aria-pressed={pressed}
      aria-label={ariaLabel}
      data-state={pressed ? "on" : "off"}
    >
      <GridTilesIcon
        className={cn(
          "transition-transform duration-150",
          pressed && "rotate-90"
        )}
      />
    </Button>
  );
}
