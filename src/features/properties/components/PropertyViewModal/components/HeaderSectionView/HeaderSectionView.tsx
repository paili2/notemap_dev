"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import StarsRating from "@/components/molecules/StarsRating";
import { Star } from "lucide-react";

import { HeaderSectionViewProps } from "./types";
import { getPinUrl } from "@/features/pins/lib/assets";

export default function HeaderSectionView({
  title,
  listingStars,
  elevator,
  pinKind = "1room",
  onClose,
}: HeaderSectionViewProps) {
  const pinSrc = getPinUrl(pinKind);
  const pct = Math.max(0, Math.min(100, (Number(listingStars || 0) / 5) * 100));
  const hasRating =
    typeof listingStars === "number" && !Number.isNaN(listingStars);

  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b supports-[backdrop-filter]:bg-white/70">
      {/* ===== 데스크탑 레이아웃 ===== */}
      <div className="hidden md:flex items-center gap-3 px-4 py-5 overflow-x-auto">
        {/* 핀 아이콘 */}
        <div className="shrink-0 w-9 h-9 grid place-items-center">
          <Image
            src={pinSrc}
            alt={`${pinKind} 핀`}
            width={24}
            height={32}
            priority
          />
        </div>

        <span className="shrink-0 text-[20px] font-semibold text-gray-800">
          매물평점
        </span>

        <div className="shrink-0 w-[180px] flex items-center leading-none">
          <StarsRating
            value={listingStars}
            readOnly
            className="leading-none antialiased"
          />
        </div>

        <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

        <span className="shrink-0 text-[20px] font-semibold text-gray-800">
          매물명
        </span>
        <div className="flex-1 min-w-[200px] text-xl text-slate-900">
          <div className="h-10 flex items-center px-3 rounded-md bg-white">
            <span className="truncate">{title || "-"}</span>
          </div>
        </div>

        <div className="h-5 w-px bg-gray-200 mx-2 shrink-0" />

        <span className="shrink-0 text-[20px] font-semibold text-gray-800">
          엘리베이터
        </span>
        <span
          className={cn(
            "inline-flex h-9 items-center rounded-md border px-3 text-sm font-bold",
            elevator === "O"
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-red-50 border-red-200 text-red-700"
          )}
          title="엘리베이터 유무"
        >
          {elevator}
        </span>
      </div>

      {/* ===== 모바일 레이아웃 ===== */}
      <div className="md:hidden px-4 py-3 space-y-2">
        {/* 첫 줄: 핀 + 매물평점 + 별 + 점수 + 엘리베이터 */}
        <div className="flex items-center justify-between gap-2 text-[13px] leading-none">
          <div className="flex items-center gap-1">
            <div className="shrink-0 w-6 h-6 grid place-items-center">
              <Image
                src={pinSrc}
                alt={`${pinKind} 핀`}
                width={20}
                height={26}
                priority
              />
            </div>
            <h1
              className="text-sm font-semibold leading-5 line-clamp-2 break-words"
              title={title}
            >
              {title || "-"}
            </h1>{" "}
            {hasRating && (
              <div className="flex items-center gap-1">
                <span className="relative inline-flex">
                  <Star className="w-4 h-4 opacity-40" aria-hidden />
                  <span
                    className="absolute left-0 top-0 overflow-hidden"
                    style={{ width: `${pct}%`, height: 16 }}
                  >
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </span>
                </span>
                <span className="tabular-nums">{listingStars.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1">
              <span className="font-medium ml-2 text-sm">엘리베이터</span>
              <span
                className={cn(
                  "font-medium text-lg",
                  elevator === "O" ? "text-blue-600" : "text-rose-600"
                )}
              >
                {elevator}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
