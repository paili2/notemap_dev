"use client";

import { Button } from "@/components/atoms/Button/Button";

type Props = {
  count?: number;
  onClick: () => void;
};

export default function FavoritesButton({ count = 0, onClick }: Props) {
  return (
    <div className="relative">
      <Button
        type="button"
        onClick={onClick}
        title="즐겨찾기"
        aria-label="즐겨찾기 열기"
        className="rounded-xl shadow"
        variant="outline"
      >
        즐겨찾기
      </Button>

      {count > 0 && (
        <span
          aria-label={`즐겨찾기 ${count}건`}
          className="pointer-events-none absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}
