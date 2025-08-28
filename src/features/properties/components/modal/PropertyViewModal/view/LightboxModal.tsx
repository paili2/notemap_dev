"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ImageItem } from "@/features/properties/types/media";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  images: ImageItem[];
  initialIndex?: number;
  onClose: () => void;
  /** 기본: contain */
  objectFit?: "contain" | "cover";
  /** 썸네일 표시 여부 */
  withThumbnails?: boolean;
};

export default function LightboxModal({
  open,
  images,
  initialIndex = 0,
  onClose,
  objectFit = "contain",
  withThumbnails = false,
}: Props) {
  const [index, setIndex] = useState(initialIndex);

  // 초기 인덱스 동기화
  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  // ESC / ← → 키
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length]);

  if (!open || !images?.length) return null;

  const fitClass = objectFit === "cover" ? "object-cover" : "object-contain";
  const cur = images[index];

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  // 오버레이 클릭 시 닫기, 내부 클릭은 전파 막기
  const stop = (e: React.MouseEvent) => e.stopPropagation();

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

      {/* 메인 이미지 영역 */}
      <div
        className="relative flex-1 flex items-center justify-center px-10"
        onClick={stop}
      >
        {/* 좌우 버튼 */}
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
          src={cur.dataUrl ?? cur.url}
          alt={cur.name || cur.caption || `이미지 ${index + 1}`}
          className={`max-h-[80vh] max-w-[90vw] ${fitClass} select-none`}
          draggable={false}
        />

        {/* 오른쪽 위 카운터 */}
        <div className="absolute top-3 right-16 rounded bg-black/60 text-white text-xs px-2 py-0.5">
          {index + 1} / {images.length}
        </div>
      </div>

      {/* 썸네일 바 (옵션) */}
      {withThumbnails && images.length > 1 && (
        <div className="px-4 py-3 bg-black/60" onClick={stop}>
          <div className="flex gap-2 overflow-x-auto">
            {images.map((im, i) => {
              const active = i === index;
              return (
                <button
                  key={i}
                  className={`relative flex-shrink-0 h-16 w-28 rounded border ${
                    active ? "border-white" : "border-white/30"
                  }`}
                  onClick={() => setIndex(i)}
                  aria-label={`썸네일 ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={im.dataUrl ?? im.url}
                    alt={im.name || im.caption || `썸네일 ${i + 1}`}
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
      )}
    </div>
  );
}
