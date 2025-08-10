"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const spinnerVariants = cva(
  // 공통 스타일에서 border-t-transparent는 빼둡니다 (나중에 마지막에 추가)
  "inline-block animate-spin rounded-full border-solid",
  {
    variants: {
      size: {
        small: "w-4 h-4",
        medium: "w-6 h-6",
        large: "w-8 h-8",
      },
      color: {
        primary: "border-blue-500",
        secondary: "border-gray-400",
        white: "border-white",
        gray: "border-gray-200",
      },
      thickness: {
        thin: "border-2",
        normal: "border-4",
        thick: "border-[6px]",
      },
    },
    defaultVariants: {
      size: "medium",
      color: "primary",
      thickness: "normal",
    },
  }
);

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  (
    { className, size, color, thickness, label = "Loading…", ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn(
          spinnerVariants({ size, color, thickness }),
          // 투명 클래스를 마지막에 둬야함
          "border-t-transparent",
          className
        )}
        {...props}
      >
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);
Spinner.displayName = "Spinner";

export { Spinner };
