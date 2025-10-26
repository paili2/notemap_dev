"use client";

import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/cn";
import { useEffect, useId, useRef, useState } from "react";
import type { ImageItem } from "@/features/properties/types/media";
import type { ImageCarouselUploadProps } from "./types";

export default function ImageCarouselUpload({
  items,
  onChangeCaption,
  onRemoveImage,
  useLocalCaptionFallback = true,
  onOpenPicker,
  inputRef,
  onChangeFiles,
  maxCount,
  layout = "wide",
  wideAspectClass = "aspect-video",
  tallHeightClass = "h-80",
  objectFit,
}: ImageCarouselUploadProps) {
  const id = useId();
  const count = items?.length ?? 0;

  const [current, setCurrent] = useState(0);
  const [imgError, setImgError] = useState(false);

  // 캡션 로컬 폴백
  const [localCaptions, setLocalCaptions] = useState<string[]>(() =>
    items.map((it) => (typeof it?.caption === "string" ? it.caption! : ""))
  );
  useEffect(() => {
    setLocalCaptions(
      items.map((it) => (typeof it?.caption === "string" ? it.caption! : ""))
    );
  }, [items]);

  // 현재 인덱스 보정 + 이미지/인덱스 바뀔 때 에러 상태 초기화
  useEffect(() => {
    if (current > 0 && current >= count) setCurrent(count - 1);
    setImgError(false);
  }, [count, current, items]);

  const goPrev = () => count > 0 && setCurrent((c) => (c - 1 + count) % count);
  const goNext = () => count > 0 && setCurrent((c) => (c + 1) % count);

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
  const onPointerCancel = () => {
    dragX.current = null;
  };

  // 키보드(좌/우)
  const containerRef = useRef<HTMLDivElement | null>(null);
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

  const cur = count > 0 ? items[current] : null;
  const fit = objectFit ?? (layout === "wide" ? "cover" : "contain");
  const currentCaption =
    cur?.caption ??
    (useLocalCaptionFallback ? localCaptions[current] : "") ??
    "";

  const handleCaptionChange = (text: string) => {
    if (onChangeCaption) onChangeCaption(current, text);
    else if (useLocalCaptionFallback)
      setLocalCaptions((prev) => {
        const next = [...prev];
        next[current] = text;
        return next;
      });
  };

  // 파일 선택 후 value 초기화(같은 파일 재선택 허용)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFiles?.(e);
    e.currentTarget.value = "";
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRemoveImage) return;

    setLocalCaptions((prev) => prev.filter((_, i) => i !== current));
    setCurrent((c) => Math.max(0, Math.min(c, count - 2)));
    setImgError(false);
    onRemoveImage(current);
  };

  // 안전한 src 판정
  const toSafeSrc = (raw?: string | null) => {
    const s = (raw ?? "").trim();
    return s.length > 0 ? s : undefined;
  };

  const safeSrc = cur ? toSafeSrc(cur.dataUrl ?? cur.url) : undefined;
  const showFallback = count === 0 || !safeSrc || imgError;

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="이미지 업로드 및 미리보기"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        "relative rounded-xl border border-gray-200 bg-gray-50/60 p-3 overflow-hidden",
        "flex flex-col gap-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
      )}
    >
      <div
        className={cn(
          "relative w-full rounded-md border overflow-hidden select-none bg-white",
          layout === "wide" ? wideAspectClass : tallHeightClass
        )}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {count === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            이미지를 업로드하세요
            {typeof maxCount === "number" ? ` (최대 ${maxCount}장)` : ""}
          </div>
        ) : showFallback ? (
          <div className="absolute inset-0 grid place-items-center bg-muted text-xs text-gray-500">
            이미지 로드 실패
          </div>
        ) : (
          <>
            {/* 메인 이미지 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={`img-${current}`}
              src={safeSrc}
              alt={cur?.name ?? `image-${current + 1}`}
              className={cn(
                "w-full h-full",
                fit === "cover" ? "object-cover" : "object-contain"
              )}
              draggable={false}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />

            {/* 우상단 삭제 버튼 */}
            {count > 0 && onRemoveImage && (
              <button
                type="button"
                onClick={handleRemove}
                aria-label="이미지 삭제"
                className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full hover:text-red-700 text-gray-500 p-1.5"
                title="삭제"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* 좌/우 버튼 (이미지 1장 이하이면 숨김) */}
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-black/40 hover:bg-black/55 text-white p-2"
                  aria-label="이전"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-black/40 hover:bg-black/55 text-white p-2"
                  aria-label="다음"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* 인덱스/점 표시 */}
            <div className="absolute bottom-2 right-2 rounded-md bg-black/55 text-white text-xs px-2 py-0.5">
              {current + 1} / {count}
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCurrent(i);
                    setImgError(false);
                  }}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    i === current ? "bg-white" : "bg-white/50 hover:bg-white/80"
                  )}
                  aria-label={`슬라이드 ${i + 1}`}
                />
              ))}
            </div>

            {/* 파일명 오버레이 */}
            {cur?.name && (
              <div className="absolute top-2 left-2 max-w-[75%] rounded bg-black/40 text-white text-[11px] px-2 py-0.5 truncate">
                {cur.name}
              </div>
            )}
          </>
        )}
      </div>

      {/* 캡션 + 업로드 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <input
          type="text"
          value={currentCaption}
          onChange={(e) => handleCaptionChange(e.target.value)}
          placeholder="제목을 입력하세요"
          className="flex-1 min-w-0 h-9 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
        />

        <div className="shrink-0">
          <input
            id={id}
            ref={inputRef ?? null}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onOpenPicker}
            className="gap-1"
          >
            <Upload className="h-4 w-4" />
            업로드
          </Button>
        </div>
      </div>
    </div>
  );
}
