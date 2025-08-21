"use client";

import { Button } from "@/components/atoms/Button/Button";

type Props = {
  isDistrictOn: boolean;
  onToggleDistrict: () => void;

  /** 상단 여백(px) */
  offsetTopPx?: number;
};

export default function MapQuickControls({
  isDistrictOn,
  onToggleDistrict,
  offsetTopPx = 12,
}: Props) {
  return (
    <div
      className="absolute right-3"
      style={{ top: offsetTopPx, zIndex: 90, pointerEvents: "none" }}
    >
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* 지적편집도 토글 (오른쪽) - 아이콘 변경 */}
        <Button
          type="button"
          onClick={onToggleDistrict}
          variant={isDistrictOn ? "default" : "outline"}
          size="icon"
          className="h-10 w-10 rounded-xl shadow"
          title="지적편집도 토글"
          aria-pressed={isDistrictOn}
        >
          {/* 파란 원(#3B82F6) + 흰 다이아 4개 */}
          <svg viewBox="0 0 64 64" width="22" height="22" aria-hidden="true">
            <g fill="#6B7280" transform="translate(32 32)">
              <path
                d="M0 -12 L12 0 L0 12 L-12 0 Z"
                transform="translate(-12,-12) rotate(45)"
              />
              <path
                d="M0 -12 L12 0 L0 12 L-12 0 Z"
                transform="translate(12,-12) rotate(45)"
              />
              <path
                d="M0 -12 L12 0 L0 12 L-12 0 Z"
                transform="translate(-12,12) rotate(45)"
              />
              <path
                d="M0 -12 L12 0 L0 12 L-12 0 Z"
                transform="translate(12,12) rotate(45)"
              />
            </g>
          </svg>
        </Button>
      </div>
    </div>
  );
}
