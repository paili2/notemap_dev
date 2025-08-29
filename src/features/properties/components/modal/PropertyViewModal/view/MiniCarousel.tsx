"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// 프로젝트에서 쓰는 ImageItem 타입( url, caption, dataUrl, name … )
import type { ImageItem } from "@/features/properties/types/media";
import { useEffect, useRef, useState } from "react";

type Props = {
  images: ImageItem[]; // 카드 안의 최대 20장
  aspect?: "video" | "square" | "tall";
  objectFit?: "cover" | "contain";
  showDots?: boolean;
  showCountBadge?: boolean;
  className?: string;
  onImageClick?: (index: number) => void;
};

export default function MiniCarousel({
  images,
  aspect = "video",
  objectFit = "cover",
  showDots = true,
  showCountBadge = true,
  className,
  onImageClick,
}: Props) {
  const count = images?.length ?? 0;
  const [cur, setCur] = useState(0);

  useEffect(() => {
    if (cur > 0 && cur >= count) setCur(count - 1);
  }, [count, cur]);

  const goPrev = () => count && setCur((c) => (c - 1 + count) % count);
  const goNext = () => count && setCur((c) => (c + 1) % count);

  // 드래그/스와이프
  const dragX = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragX.current == null) return;
    const dx = e.clientX - dragX.current;
    if (dx > 40) goPrev();
    if (dx < -40) goNext();
    dragX.current = null;
  };
  const onPointerCancel = () => (dragX.current = null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  };

  const boxAspect =
    aspect === "video"
      ? "aspect-video"
      : aspect === "square"
      ? "aspect-square"
      : "h-64";

  if (!count) {
    return (
      <div className={cn("rounded-md border bg-gray-50/60 p-2", className)}>
        <div
          className={cn(
            "rounded-md border bg-white grid place-items-center text-xs text-gray-400",
            boxAspect
          )}
        >
          이미지 없음
        </div>
      </div>
    );
  }

  const img = images[cur];

  return (
    <div
      role="group"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        "relative rounded-md border bg-white overflow-hidden",
        className
      )}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        className={cn("relative w-full select-none", boxAspect)}
        onClick={() => onImageClick?.(cur)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`${img.url}-${cur}`}
          src={img.dataUrl ?? img.url}
          alt={img.caption || img.name || `image-${cur + 1}`}
          className={cn(
            "w-full h-full",
            objectFit === "cover" ? "object-cover" : "object-contain"
          )}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={(e) =>
            ((e.currentTarget as HTMLImageElement).style.opacity = "0.2")
          }
        />

        {/* 좌/우 버튼 */}
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="이전"
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-black/40 hover:bg-black/55 text-white p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="다음"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-black/40 hover:bg-black/55 text-white p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* 카운트 배지 */}
        {showCountBadge && count > 1 && (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/55 text-white text-[11px] px-2 py-0.5">
            {cur + 1} / {count}
          </div>
        )}

        {/* 점 네비게이션 */}
        {showDots && count > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`슬라이드 ${i + 1}`}
                onClick={() => setCur(i)}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i === cur ? "bg-white" : "bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* 캡션(있을 때만) */}
      {img.caption && img.caption.trim() && (
        <div className="px-2 py-1 border-t bg-gray-50 text-[12px] text-gray-600 line-clamp-2">
          {img.caption}
        </div>
      )}
    </div>
  );
}
