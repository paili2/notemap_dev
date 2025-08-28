// features/properties/components/modal/PropertyViewModal/view/DisplayImagesSection.tsx
"use client";

import * as React from "react";
import type { ImageItem } from "@/features/properties/types/media";
import LightboxModal from "./LightboxModal";

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

function normOne(it: AnyImg): ImageItem | null {
  if (!it) return null;
  if (typeof it === "string") {
    return isOkUrl(it) ? { url: it, name: "", caption: "" } : null;
  }
  if (typeof it === "object" && typeof (it as any).url === "string") {
    const u = String((it as any).url);
    if (!isOkUrl(u)) return null;
    return {
      url: u,
      name: typeof (it as any).name === "string" ? (it as any).name : "",
      caption:
        typeof (it as any).caption === "string" ? (it as any).caption : "",
      dataUrl:
        typeof (it as any).dataUrl === "string"
          ? (it as any).dataUrl
          : undefined,
    };
  }
  return null;
}

function normList(list?: Array<AnyImg>): ImageItem[] {
  if (!Array.isArray(list)) return [];
  return list.map(normOne).filter(Boolean) as ImageItem[];
}

export default function DisplayImagesSection({ cards, images, files }: Props) {
  // 1) 카드 정규화
  const cardGroups: ImageItem[][] = Array.isArray(cards)
    ? cards.map((g) => normList(g)).filter((g) => g.length > 0)
    : [];

  // 2) 카드가 없다면 레거시 images를 하나의 카드로
  if (cardGroups.length === 0 && Array.isArray(images)) {
    const legacy = normList(images);
    if (legacy.length) cardGroups.push(legacy);
  }

  // 3) 세로 파일 카드(있다면 별도의 카드로 추가)
  const fileCard = normList(files);
  const hasFileCard = fileCard.length > 0;

  // 라이트박스 상태
  const [open, setOpen] = React.useState(false);
  const [lightboxImages, setLightboxImages] = React.useState<ImageItem[]>([]);
  const [startIndex, setStartIndex] = React.useState(0);

  const openLightbox = (group: ImageItem[], index = 0) => {
    setLightboxImages(group);
    setStartIndex(index);
    setOpen(true);
  };

  // 아무것도 없을 때
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
              <div className="absolute bottom-2 left-2 max-w-[75%] rounded bg-black/40 text-white text-[11px] px-2 py-0.5 truncate">
                {fileCard[0].name}
              </div>
            ) : null}
          </div>
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
