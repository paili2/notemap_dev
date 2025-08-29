"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ImageItem } from "@/features/properties/types/media";
import { useCallback, useEffect, useState } from "react";

type Props = {
  open: boolean;
  images: ImageItem[];
  initialIndex?: number;
  onClose: () => void;
  objectFit?: "contain" | "cover";
  withThumbnails?: boolean;
  title?: string;
};

export default function LightboxModal({
  open,
  images,
  initialIndex = 0,
  onClose,
  objectFit = "contain",
  withThumbnails = false,
  title,
}: Props) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const prev = useCallback(
    () =>
      setIndex((i) =>
        images.length ? (i - 1 + images.length) % images.length : 0
      ),
    [images.length]
  );
  const next = useCallback(
    () => setIndex((i) => (images.length ? (i + 1) % images.length : 0)),
    [images.length]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, prev, next]);

  if (!open || !images?.length) return null;

  const fitClass = objectFit === "cover" ? "object-cover" : "object-contain";

  const safeIndex = Math.min(Math.max(index, 0), images.length - 1);
  const cur = images[safeIndex];

  const albumTitle =
    (title && title.trim()) ||
    images[0]?.caption?.trim?.() ||
    images[0]?.name?.trim?.() ||
    "";

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  // 썸네일 열 폭 (grid에서 1열 고정폭으로 사용)
  const thumbColWidth = 112; // px (w-28)

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/80 flex flex-col"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* 상단 바 */}
      <div className="flex items-center justify-end gap-2 p-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="닫기"
          className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-white/10 hover:bg-white/20 text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 본문: Grid 레이아웃 (썸네일=1열, 메인=2열, 제목=2열) */}
      <div className="relative px-4 pb-4 flex-1" onClick={stop}>
        <div
          className={
            withThumbnails && images.length > 1
              ? // 1열: 고정폭 썸네일, 2열: 메인
                `grid gap-4 items-start`
              : // 썸네일 없으면 단일열
                `grid gap-4 items-start`
          }
          // tailwind 任의 템플릿: 1열 고정 112px, 2열 auto
          style={{
            gridTemplateColumns:
              withThumbnails && images.length > 1
                ? `${thumbColWidth}px 1fr`
                : "1fr",
          }}
        >
          {/* 1열: 왼쪽 세로 썸네일 컬럼 */}
          {withThumbnails && images.length > 1 && (
            <div className="w-28">
              <div className="max-h-[78vh] overflow-y-auto pr-1">
                <div className="flex flex-col gap-2">
                  {images.map((im, i) => {
                    const active = i === safeIndex;
                    const t = (
                      im?.caption ||
                      im?.name ||
                      `썸네일 ${i + 1}`
                    ).trim();
                    return (
                      <button
                        key={i}
                        className={`relative h-20 w-full rounded border ${
                          active ? "border-white" : "border-white/30"
                        }`}
                        onClick={() => setIndex(i)}
                        aria-label={t}
                        title={t}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={im?.dataUrl ?? im?.url}
                          alt={t}
                          className="h-full w-full object-cover rounded"
                          draggable={false}
                          loading="lazy"
                          decoding="async"
                        />
                        {active && (
                          <span className="absolute inset-0 ring-2 ring-white rounded pointer-events-none" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2열: 우측 메인 이미지 영역 */}
          <div className="relative flex items-center justify-center">
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="이전"
                  className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={next}
                  aria-label="다음"
                  className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* 메인 이미지 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cur?.dataUrl ?? cur?.url}
              alt={albumTitle || `이미지 ${safeIndex + 1}`}
              className={`max-h-[78vh] max-w-[85vw] ${fitClass} select-none`}
              draggable={false}
            />

            {/* 카운터 (우측 상단) */}
            <div className="absolute top-3 right-3 md:right-6 rounded bg-black/60 text-white text-xs px-2 py-0.5">
              {safeIndex + 1} / {images.length}
            </div>
          </div>

          {/* 2열(메인열) 아래에 제목 배치: 메인과 정확히 가운데 정렬 */}
          {albumTitle && (
            <div
              className="col-start-2 text-center text-white text-lg whitespace-pre-wrap break-words px-2"
              title={albumTitle}
            >
              {albumTitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
