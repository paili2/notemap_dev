"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { FieldProps } from "./types";

export default function Field({
  label,
  children,
  gap = 4,
  labelWidth,
  labelMaxWidth,
  dense = false,
  align = "center",
  className,
  labelClassName,
  contentClassName,
  noWrapLabel = true,
  longLabelMode = "truncate",
  htmlFor,
  renderAsLabel = false,
  rowMinHeight = 36,
}: FieldProps) {
  const gapClass =
    gap === 1 ? "gap-1" : gap === 2 ? "gap-2" : gap === 3 ? "gap-3" : "gap-4";

  const alignClass =
    align === "start"
      ? "items-start"
      : align === "end"
      ? "items-end"
      : "items-center";

  // 🔹 안쪽 flex 정렬에도 align을 반영
  const innerAlignClass =
    align === "start"
      ? "items-start"
      : align === "end"
      ? "items-end"
      : "items-center";

  const gridCols =
    typeof labelWidth === "number" || typeof labelWidth === "string"
      ? `${typeof labelWidth === "number" ? `${labelWidth}px` : labelWidth} 1fr`
      : "max-content 1fr";

  const isTruncate = longLabelMode === "truncate";
  const longLabelClass = isTruncate
    ? "truncate overflow-hidden"
    : "whitespace-normal break-keep";

  const LabelTag: "div" | "label" = renderAsLabel ? "label" : "div";

  return (
    <div
      className={cn(
        "grid min-w-0",
        gapClass,
        alignClass,
        dense ? "text-[12px]" : "text-[13px]",
        className
      )}
      style={{ gridTemplateColumns: gridCols }}
    >
      <LabelTag
        // @ts-ignore htmlFor는 <label>일 때만 의미 있음
        htmlFor={renderAsLabel ? htmlFor : undefined}
        className={cn(
          "flex text-muted-foreground leading-none",
          innerAlignClass, // ⬅️ 여기
          noWrapLabel && longLabelMode !== "wrap" && "whitespace-nowrap",
          dense && "pt-0.5",
          longLabelClass,
          labelClassName
        )}
        style={{
          ...(labelMaxWidth ? { maxWidth: labelMaxWidth } : null),
          minHeight:
            typeof rowMinHeight === "number"
              ? `${rowMinHeight}px`
              : rowMinHeight,
        }}
      >
        {label}
      </LabelTag>

      <div
        className={cn(
          "min-w-0 flex leading-none",
          innerAlignClass, // ⬅️ 그리고 여기
          contentClassName
        )}
        style={{
          minHeight:
            typeof rowMinHeight === "number"
              ? `${rowMinHeight}px`
              : rowMinHeight,
        }}
      >
        {children}
      </div>
    </div>
  );
}
