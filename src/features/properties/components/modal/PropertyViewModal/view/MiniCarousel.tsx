// MiniCarousel.tsx
"use client";

import * as React from "react";
import type { ImageItem } from "@/features/properties/types/media";

type IndexPlacement = "top-right" | "top-left" | "bottom-right" | "bottom-left";

type Props = {
  images: ImageItem[];
  /** "video"면 16:9, "square"면 1:1, "auto"면 부모 높이 채움 */
  aspect?: "video" | "square" | "auto";
  /** 이미지 fit 방식 */
  objectFit?: "cover" | "contain";
  /** 하단 점(페이지네이션) 표시 */
  showDots?: boolean;
  /** 이미지 클릭 콜백 */
  onImageClick?: (index: number) => void;
  /** (선택) 추가 클래스 */
  className?: string;
  /** 1 / N 인덱스 배지 표시 */
  showIndex?: boolean;
  /** 인덱스 배지 위치 (기본: 우상단) */
  indexPlacement?: IndexPlacement;
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
}: Props) {
  const [idx, setIdx] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const hasImages = Array.isArray(images) && images.length > 0;

  React.useEffect(() => {
    if (!hasImages) return;
    setIdx((cur) => Math.max(0, Math.min(cur, images.length - 1)));
  }, [hasImages, images.length]);

  const go = (n: number) => {
    if (!hasImages) return;
    const len = images.length;
    setIdx(((n % len) + len) % len);
  };
  const prev = () => go(idx - 1);
  const next = () => go(idx + 1);

  // 키보드 내비
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

  const indexPos =
    indexPlacement === "top-right"
      ? "top-2 right-2"
      : indexPlacement === "top-left"
      ? "top-2 left-2"
      : indexPlacement === "bottom-left"
      ? "bottom-2 left-2"
      : "bottom-2 right-2";

  return (
    <div ref={wrapRef} tabIndex={0} className={wrapClasses}>
      {/* Slides */}
      <div className="absolute inset-0 overflow-hidden rounded-md">
        {hasImages &&
          images.map((img, i) => {
            const src = img.dataUrl ?? img.url;
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
                    alt={img.name || img.caption || `image-${i + 1}`}
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

      {/* Dots (in-photo) */}
      {showDots && hasImages && images.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
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
