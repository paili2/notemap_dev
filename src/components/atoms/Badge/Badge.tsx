// 상태 표시(진행중, 완료)

import React from "react";
import clsx from "clsx";

export interface BadgeProps {
  label?: string;
  status?: "pending" | "inProgress" | "completed" | "canceled"; // 상태 표시
  variant?: "primary" | "secondary" | "success" | "warning" | "error";
  size?: "small" | "medium" | "large";
  rounded?: boolean;
  className?: string;
}

const Badge = ({
  label,
  status,
  variant,
  size = "medium",
  rounded = true,
  className,
}: BadgeProps) => {
  // 상태별 색상 지정 (variant보다 우선 적용)
  const statusColors: Record<string, string> = {
    pending: "bg-gray-200 text-gray-600",
    inProgress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    canceled: "bg-red-100 text-red-700",
  };

  // label이 없으면 status 텍스트 자동 표시
  const displayText =
    label ||
    (status === "pending"
      ? "대기"
      : status === "inProgress"
      ? "진행중"
      : status === "completed"
      ? "완료"
      : status === "canceled"
      ? "취소됨"
      : "");

  return (
    <span
      className={clsx(
        "inline-flex items-center font-semibold",
        status && statusColors[status],
        !status && variant === "primary" && "bg-blue-100 text-blue-700",
        !status && variant === "secondary" && "bg-gray-100 text-gray-700",
        !status && variant === "success" && "bg-green-100 text-green-700",
        !status && variant === "warning" && "bg-yellow-100 text-yellow-800",
        !status && variant === "error" && "bg-red-100 text-red-700",
        size === "small" && "px-2 py-0.5 text-xs",
        size === "medium" && "px-3 py-1 text-sm",
        size === "large" && "px-4 py-1.5 text-base",
        rounded ? "rounded-full" : "rounded-md",
        className
      )}
    >
      {displayText}
    </span>
  );
};

export default Badge;
