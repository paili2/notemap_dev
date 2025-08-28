// Field.tsx — 기본: 라벨 폭 자동(max-content)
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Gap = 1 | 2 | 3 | 4; // Tailwind 정적 클래스 매핑 목적
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
    ? // truncate가 제대로 동작하려면 overflow-hidden 필요
      "truncate overflow-hidden"
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: htmlFor는 <label>일 때만 의미 있음
        htmlFor={renderAsLabel ? htmlFor : undefined}
        className={cn(
          "text-muted-foreground",
          // wrap 모드가 아니면 nowrap 유지
          noWrapLabel && longLabelMode !== "wrap" && "whitespace-nowrap",
          dense && "pt-0.5",
          longLabelClass,
          labelClassName
        )}
        style={labelMaxWidth ? { maxWidth: labelMaxWidth } : undefined}
      >
        {label}
      </LabelTag>

      <div className={cn("min-w-0", contentClassName)}>{children}</div>
    </div>
  );
}
