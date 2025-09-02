"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ImageItem } from "@/features/properties/types/media";
import { useCallback, useEffect, useRef, useState } from "react";

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
  // 항상 호출되는 훅들 (조건부 return보다 위!)
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

  /** 드래그/스와이프 상태 (항상 위에서 선언) */
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const lastXRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const lockedDirRef = useRef<"x" | "y" | null>(null);
  const threshold = 50; // px

  const dragStart = (x: number, y: number) => {
    startXRef.current = x;
    startYRef.current = y;
    lastXRef.current = x;
    draggingRef.current = true;
    lockedDirRef.current = null;
  };

  const dragMove = (x: number, y: number) => {
    if (
      !draggingRef.current ||
      startXRef.current == null ||
      startYRef.current == null
    )
      return;

    const dx = x - startXRef.current;
    const dy = y - startYRef.current;

    // 방향 잠금: 처음 크게 움직인 방향으로 확정
    if (!lockedDirRef.current) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        lockedDirRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
    }

    lastXRef.current = x;
  };

  const dragEnd = () => {
    if (
      !draggingRef.current ||
      startXRef.current == null ||
      lastXRef.current == null
    ) {
      draggingRef.current = false;
      lockedDirRef.current = null;
      return;
    }
    const dx = lastXRef.current - startXRef.current;

    if (lockedDirRef.current === "x") {
      if (dx > threshold) prev();
      else if (dx < -threshold) next();
    }

    draggingRef.current = false;
    lockedDirRef.current = null;
    startXRef.current = null;
    startYRef.current = null;
    lastXRef.current = null;
  };

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

      {/* 본문 */}
      <div className="relative px-4 pb-4 flex-1" onClick={stop}>
        <div
          className={
            withThumbnails && images.length > 1
              ? "grid gap-4 items-stretch"
              : "grid gap-4 items-stretch"
          }
          style={{
            gridTemplateColumns:
              withThumbnails && images.length > 1
                ? `${thumbColWidth}px 1fr`
                : "1fr",
          }}
        >
          {/* 왼쪽 썸네일 컬럼 */}
          {withThumbnails && images.length > 1 && (
            <div className="w-28">
              <div className="max-h-[78vh] overflow-y-auto pr-1 scrollbar-hide">
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

          {/* 메인 이미지 영역: 세로 중앙 정렬 */}
          {/* 모바일 세로 스크롤 유지 + 가로 제스처만 감지 위해 touch-action: pan-y */}
          <div
            className="relative h-[78vh] flex items-center justify-center select-none touch-pan-y"
            onMouseDown={(e) => dragStart(e.clientX, e.clientY)}
            onMouseMove={(e) => {
              if (draggingRef.current) dragMove(e.clientX, e.clientY);
            }}
            onMouseUp={dragEnd}
            onMouseLeave={dragEnd}
            onTouchStart={(e) => {
              const t = e.touches[0];
              dragStart(t.clientX, t.clientY);
            }}
            onTouchMove={(e) => {
              const t = e.touches[0];
              dragMove(t.clientX, t.clientY);
            }}
            onTouchEnd={dragEnd}
          >
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
              className={`block max-h-full max-w-[85vw] ${fitClass}`}
              draggable={false}
            />

            {/* 카운터 */}
            <div className="absolute top-3 right-3 md:right-6 rounded bg-black/60 text-white text-xs px-2 py-0.5">
              {safeIndex + 1} / {images.length}
            </div>
          </div>

          {/* 제목 */}
          {albumTitle && (
            <div
              className={
                withThumbnails && images.length > 1 ? "col-start-2" : ""
              }
            >
              <div
                className="text-center text-white text-lg whitespace-pre-wrap break-words px-2"
                title={albumTitle}
              >
                {albumTitle}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
