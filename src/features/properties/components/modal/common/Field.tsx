// Field.tsx — 기본: 라벨 폭 자동(max-content)
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Gap = 1 | 2 | 3 | 4;
type Align = "start" | "center" | "end";
type LongLabelMode = "truncate" | "wrap";

export type FieldProps = {
  label: React.ReactNode;
  children: React.ReactNode;

  gap?: Gap;
  /** px 또는 CSS 길이 문자열도 허용 */
  labelWidth?: number | string;
  labelMaxWidth?: number;

  dense?: boolean;
  align?: Align;

  className?: string;
  labelClassName?: string;
  contentClassName?: string;

  noWrapLabel?: boolean;
  longLabelMode?: LongLabelMode;

  /** 접근성: 특정 컨트롤 id에 매칭하려면 전달 */
  htmlFor?: string;
  /** label을 실제 <label>로 렌더링 (htmlFor와 함께 쓰면 좋음) */
  renderAsLabel?: boolean;

  /** ✅ 라벨/컨텐츠 영역 최소 높이(px). 기본 36px(h-9) */
  rowMinHeight?: number | string;
};

export default function Field({
  label,
  children,
  gap = 4,
  labelWidth, // undefined면 auto
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
  rowMinHeight = 36, // ✅ 기본 36px (Tailwind h-9)
}: FieldProps) {
  const gapClass =
    gap === 1 ? "gap-1" : gap === 2 ? "gap-2" : gap === 3 ? "gap-3" : "gap-4";

  const alignClass =
    align === "start"
      ? "items-start"
      : align === "end"
      ? "items-end"
      : "items-center";

  // 기본은 auto(= max-content 1fr), labelWidth가 있으면 고정폭
  const gridCols =
    typeof labelWidth === "number" || typeof labelWidth === "string"
      ? `${typeof labelWidth === "number" ? `${labelWidth}px` : labelWidth} 1fr`
      : "max-content 1fr";

  // 긴 라벨 처리
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
          // ✅ 수직 가운데 + 동일 라인높이 간섭 제거
          "flex items-center text-muted-foreground leading-none",
          noWrapLabel && longLabelMode !== "wrap" && "whitespace-nowrap",
          dense && "pt-0.5",
          longLabelClass,
          labelClassName
        )}
        style={{
          ...(labelMaxWidth ? { maxWidth: labelMaxWidth } : null),
          // ✅ 라벨도 동일한 최소 높이
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
          // ✅ 컨텐츠도 수직 가운데 + 라인하이트 간섭 제거
          "min-w-0 flex items-center leading-none",
          contentClassName
        )}
        style={{
          // ✅ 컨텐츠도 동일한 최소 높이
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
