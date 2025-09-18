"use client";

import { Star } from "lucide-react";

export default function StarFillOne({
  size = 16,
  value = 0,
}: {
  size?: number;
  value?: number;
}) {
  const pct = Math.max(0, Math.min(100, (Number(value || 0) / 5) * 100));
  return (
    <span className="relative inline-flex" aria-hidden>
      {/* 빈 별 */}
      <Star style={{ width: size, height: size }} className="opacity-40" />
      {/* 채운 별 (width로 비율 채움) */}
      <span
        className="absolute left-0 top-0 overflow-hidden"
        style={{ width: `${pct}%`, height: size }}
      >
        <Star
          style={{ width: size, height: size }}
          className="text-yellow-400 fill-yellow-400"
        />
      </span>
    </span>
  );
}
