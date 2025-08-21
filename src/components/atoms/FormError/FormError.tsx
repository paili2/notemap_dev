"use client";

import { XCircle, AlertTriangle } from "lucide-react";

type Variant = "error" | "warning" | "info";

type Props = {
  /** 문자열 또는 문자열 배열(여러 에러) */
  message?: string | string[] | null;
  /** 기본값: "error" */
  variant?: Variant;
  /** 가운데 정렬 여부 (폼 상단 글로벌 에러용) */
  center?: boolean;
  /** 시각적 구분 위해 아이콘 표시 (기본 true) */
  withIcon?: boolean;
  /** 스크린리더 즉시 읽기 */
  assertive?: boolean;
  /** 테스트/접근성용 id */
  id?: string;
};

const styles: Record<Variant, string> = {
  error: "border-destructive/30 bg-destructive/5 text-destructive",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

export function FormError({
  message,
  variant = "error",
  center = false,
  withIcon = true,
  assertive = true,
  id,
}: Props) {
  if (!message || (Array.isArray(message) && message.length === 0)) return null;

  const messages = Array.isArray(message) ? message : [message];
  const Icon =
    variant === "error"
      ? XCircle
      : variant === "warning"
      ? AlertTriangle
      : XCircle;

  return (
    <div
      id={id}
      role="alert"
      aria-live={assertive ? "assertive" : "polite"}
      className={`rounded-md border px-3 py-2 text-sm ${styles[variant]} ${
        center ? "text-center" : ""
      }`}
    >
      <div
        className={`flex ${center ? "justify-center" : "items-start gap-2"}`}
      >
        {withIcon && <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />}
        <div className="space-y-1">
          {messages.map((m, i) => (
            <p key={i}>{m}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
