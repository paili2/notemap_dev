"use client";

import type { ImageItem } from "@/features/properties/types/media";
import LightboxModal from "./LightboxModal";
import { useState } from "react";

type AnyImg = ImageItem | string | null | undefined;

type Props = {
  /** 가로형 이미지 카드(업로드 카드들) */
  cards?: Array<Array<AnyImg>>;
  /** 레거시 평탄 이미지 배열(카드가 없을 때만 1카드로 사용) */
  images?: Array<AnyImg>;
  /** 세로 파일 카드(업로드 화면의 '파일' 카드) */
  files?: Array<AnyImg>;
};

const isOkUrl = (u: string) => /^https?:|^data:|^blob:/.test(u);

/** url 없고 dataUrl만 있어도 통과 */
function normOne(it: AnyImg): ImageItem | null {
  if (!it) return null;

  if (typeof it === "string") {
    return isOkUrl(it) ? { url: it, name: "", caption: "" } : null;
  }

  if (typeof it === "object") {
    const raw = it as any;
    const u = typeof raw.url === "string" ? String(raw.url) : "";
    const d = typeof raw.dataUrl === "string" ? String(raw.dataUrl) : "";

    if (!isOkUrl(u) && !/^data:/.test(d)) return null;

    const finalUrl = isOkUrl(u) ? u : d;

    return {
      url: finalUrl,
      name: typeof raw.name === "string" ? raw.name : "",
      caption: typeof raw.caption === "string" ? raw.caption : "",
      dataUrl: d || undefined,
    };
  }

  return null;
}

function normList(list?: Array<AnyImg>): ImageItem[] {
  if (!Array.isArray(list)) return [];
  return list.map(normOne).filter(Boolean) as ImageItem[];
}

export default function DisplayImagesSection({ cards, images, files }: Props) {
  // 카드 정규화 (카드별 분리 유지)
  const cardGroups: ImageItem[][] = Array.isArray(cards)
    ? cards.map((g) => normList(g)).filter((g) => g.length > 0)
    : [];

  // 카드가 없으면 레거시 images를 1카드로
  if (cardGroups.length === 0 && Array.isArray(images)) {
    const legacy = normList(images);
    if (legacy.length) cardGroups.push(legacy);
  }

  // 세로 파일 카드
  const fileCard = normList(files);
  const hasFileCard = fileCard.length > 0;

  // 라이트박스
  const [open, setOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<ImageItem[]>([]);
  const [startIndex, setStartIndex] = useState(0);

  const openLightbox = (group: ImageItem[], index = 0) => {
    setLightboxImages(group);
    setStartIndex(index);
    setOpen(true);
  };

  if (cardGroups.length === 0 && !hasFileCard) {
    return (
      <div className="rounded-xl border bg-gray-50/60 p-3">
        <div className="aspect-video rounded-md border bg-white grid place-items-center text-sm text-gray-400">
          등록된 이미지가 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 가로형 카드들 */}
      {cardGroups.map((group, gi) => {
        const main = group[0];
        const mainCaption = (main.caption || "").trim();
        return (
          <div
            key={`card-${gi}`}
            className="rounded-xl border bg-gray-50/60 p-3"
          >
            <div
              className="relative aspect-video overflow-hidden rounded-md border bg-black/5 cursor-pointer"
              onClick={() => openLightbox(group, 0)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={main.dataUrl ?? main.url}
                alt={main.name || main.caption || "대표 이미지"}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              {/* 우상단 장수 배지 */}
              <div className="absolute top-2 right-2 rounded bg-black/55 text-white text-xs px-2 py-0.5">
                {group.length}장
              </div>
              {/* 좌하단 파일명(있으면) */}
              {main.name ? (
                <div className="absolute bottom-2 left-2 max-w-[75%] rounded bg-black/40 text-white text-[11px] px-2 py-0.5 truncate">
                  {main.name}
                </div>
              ) : null}
            </div>

            {/* 🔽 카드 캡션(대표 이미지의 caption을 카드 아래에 표시) */}
            {mainCaption && (
              <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap break-words text-center">
                {mainCaption}
              </p>
            )}
          </div>
        );
      })}

      {/* 세로 파일 카드 */}
      {hasFileCard && (
        <div className="rounded-xl border bg-gray-50/60 p-3">
          <div
            className="relative h-80 overflow-hidden rounded-md border bg-black/5 cursor-pointer"
            onClick={() => openLightbox(fileCard, 0)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileCard[0].dataUrl ?? fileCard[0].url}
              alt={fileCard[0].name || fileCard[0].caption || "파일 이미지"}
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute top-2 right-2 rounded bg-black/55 text-white text-xs px-2 py-0.5">
              {fileCard.length}장
            </div>
            {fileCard[0].name ? (
              <div className="absolute bottom-2 left-2 max-w-[75%] rounded bg-black/40 text-white text-[11px] px-2 py-0.5 truncate text-center">
                {fileCard[0].name}
              </div>
            ) : null}
          </div>

          {/* 🔽 파일 카드 캡션(첫 이미지 caption) */}
          {fileCard[0].caption?.trim() ? (
            <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap break-words">
              {fileCard[0].caption}
            </p>
          ) : null}
        </div>
      )}

      {/* 공용 라이트박스 */}
      <LightboxModal
        open={open}
        images={lightboxImages}
        initialIndex={startIndex}
        onClose={() => setOpen(false)}
        objectFit="contain"
        withThumbnails
      />
    </div>
  );
}
