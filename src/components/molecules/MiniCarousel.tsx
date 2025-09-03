"use client";

import * as React from "react";
import type { ImageItem } from "@/features/properties/types/media";

type IndexPlacement = "top-right" | "top-left" | "bottom-right" | "bottom-left";

type Props = {
  images: ImageItem[];
  aspect?: "video" | "square" | "auto";
  objectFit?: "cover" | "contain";
  showDots?: boolean;
  onImageClick?: (index: number) => void;
  className?: string;
  showIndex?: boolean;
  indexPlacement?: IndexPlacement;

  onIndexChange?: (i: number) => void;
};

export default function MiniCarousel({
  images,
  aspect = "auto",
  objectFit = "cover",
  showDots = false,
  onImageClick,
  className,
  showIndex = true,
  indexPlacement = "top-right",
  onIndexChange,
}: Props) {
  const [idx, setIdx] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const hasImages = Array.isArray(images) && images.length > 0;

  React.useEffect(() => {
    if (!hasImages) return;
    setIdx((cur) => {
      const clamped = Math.max(0, Math.min(cur, images.length - 1));
      if (clamped !== cur) onIndexChange?.(clamped);
      return clamped;
    });
  }, [hasImages, images.length, onIndexChange]);

  const go = (n: number) => {
    if (!hasImages) return;
    const len = images.length;
    const next = ((n % len) + len) % len;
    setIdx(next);
    onIndexChange?.(next);
  };
  const prev = () => go(idx - 1);
  const next = () => go(idx + 1);

  // 키보드 좌/우
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, images.length]);

  const aspectClass =
    aspect === "video"
      ? "aspect-video"
      : aspect === "square"
      ? "aspect-square"
      : "";

  const wrapClasses = [
    "relative w-full select-none outline-none",
    aspect === "auto" ? "h-full" : aspectClass,
    className || "",
  ].join(" ");

  const pos = (p: IndexPlacement) =>
    p === "top-right"
      ? "top-2 right-2"
      : p === "top-left"
      ? "top-2 left-2"
      : p === "bottom-left"
      ? "bottom-2 left-2"
      : "bottom-2 right-2";

  const indexPos = pos(indexPlacement);

  return (
    <div ref={wrapRef} tabIndex={0} className={wrapClasses}>
      {/* Slides */}
      <div className="absolute inset-0 overflow-hidden rounded-md">
        {hasImages &&
          images.map((img, i) => {
            const src = img.dataUrl ?? img.url;
            const displayTitle =
              img.caption?.trim?.() || img.name?.trim?.() || `image-${i + 1}`;

            return (
              <div
                key={i}
                className={[
                  "absolute inset-0 transition-opacity duration-300 ease-in-out",
                  i === idx ? "opacity-100" : "opacity-0",
                  objectFit === "contain" ? "grid place-items-center" : "",
                ].join(" ")}
                onClick={() => onImageClick?.(i)}
                role="button"
                aria-label={displayTitle}
                title={displayTitle}
              >
                {objectFit === "cover" ? (
                  <div
                    className="absolute inset-0 bg-no-repeat bg-center bg-cover"
                    style={{ backgroundImage: `url("${src}")` }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={displayTitle}
                    className="max-w-full max-h-full w-auto h-auto object-contain object-center"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                )}
              </div>
            );
          })}

        {!hasImages && (
          <div className="absolute inset-0 grid place-items-center text-gray-400 text-sm">
            이미지가 없습니다
          </div>
        )}
      </div>

      {/* 좌/우 화살표 */}
      {hasImages && images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="이전"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 grid place-items-center text-gray-600 hover:text-gray-800 focus:outline-none"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 5L8 12L15 19"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="다음"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 grid place-items-center text-gray-600 hover:text-gray-800 focus:outline-none"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 5L16 12L9 19"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && hasImages && images.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIdx(i);
                onIndexChange?.(i);
              }}
              aria-label={`go-${i}`}
              className={[
                "h-1.5 rounded-full transition-all",
                i === idx
                  ? "w-5 bg-gray-700"
                  : "w-2.5 bg-gray-400 hover:bg-gray-500",
              ].join(" ")}
            />
          ))}
        </div>
      )}

      {/* 1 / N 인덱스 배지 */}
      {showIndex && hasImages && images.length > 1 && (
        <div
          className={[
            "absolute z-10 rounded-md bg-black/55 text-white text-xs px-2 py-0.5",
            indexPos,
          ].join(" ")}
        >
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
