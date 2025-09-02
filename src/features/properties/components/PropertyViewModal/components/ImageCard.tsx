"use client";

import type { ImageItem } from "@/features/properties/types/media";
import LightboxModal from "../../../../../components/organisms/LightboxModal";
import MiniCarousel from "../../../../../components/molecules/MiniCarousel";
import { useState } from "react";

type AnyImg = ImageItem | string | null | undefined;

type Props = {
  cards?: Array<Array<AnyImg>>;
  images?: Array<AnyImg>;
  files?: Array<AnyImg>;
  showNames?: boolean;
};

const isOkUrl = (u: string) => /^https?:|^data:|^blob:/.test(u);

function normOne(it: AnyImg): ImageItem | null {
  if (!it) return null;
  if (typeof it === "string")
    return isOkUrl(it) ? { url: it, name: "", caption: "" } : null;

  const raw = it as any;
  const u = typeof raw.url === "string" ? String(raw.url) : "";
  const d = typeof raw.dataUrl === "string" ? String(raw.dataUrl) : "";
  if (!isOkUrl(u) && !/^data:/.test(d)) return null;
  const finalUrl = isOkUrl(u) ? u : d;

  return {
    url: finalUrl,
    name: typeof raw.name === "string" ? raw.name : "",

    caption:
      typeof raw.caption === "string"
        ? raw.caption
        : typeof raw.title === "string"
        ? raw.title
        : "",
    dataUrl: d || undefined,
  };
}

function normList(list?: Array<AnyImg>): ImageItem[] {
  if (!Array.isArray(list)) return [];
  return list.map(normOne).filter(Boolean) as ImageItem[];
}

export default function DisplayImagesSection({
  cards,
  images,
  files,
  showNames = false,
}: Props) {
  const cardGroups: ImageItem[][] = Array.isArray(cards)
    ? cards.map((g) => normList(g)).filter((g) => g.length > 0)
    : [];

  if (cardGroups.length === 0 && Array.isArray(images)) {
    const legacy = normList(images);
    if (legacy.length) cardGroups.push(legacy);
  }

  const fileCard = normList(files);
  const hasFileCard = fileCard.length > 0;

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
            <div className="relative aspect-video overflow-hidden rounded-md border bg-white">
              <MiniCarousel
                images={group}
                aspect="video"
                objectFit="cover"
                showDots
                showIndex
                indexPlacement="top-right"
                onImageClick={(i) => openLightbox(group, i)}
              />
              {showNames && main.name ? (
                <div className="absolute bottom-2 left-2 max-w-[75%] rounded bg-black/40 text-white text-[11px] px-2 py-0.5 truncate">
                  {main.name}
                </div>
              ) : null}
            </div>

            {mainCaption && (
              <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap break-words text-center">
                {mainCaption}
              </p>
            )}
          </div>
        );
      })}

      {/* 세로(파일) 카드 */}
      {hasFileCard && (
        <div className="rounded-xl border bg-gray-50/60 p-3">
          <div className="relative h-80 overflow-hidden rounded-md border bg-white">
            <MiniCarousel
              images={fileCard}
              aspect="auto" // 부모 높이 꽉 채움
              objectFit="cover" // 생성 화면과 동일하게 크롭
              showDots
              showIndex
              indexPlacement="top-right"
              onImageClick={(i) => openLightbox(fileCard, i)}
              className="absolute inset-0"
            />
          </div>

          {fileCard[0]?.caption?.trim() ? (
            <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap break-words text-center">
              {fileCard[0].caption.trim()}
            </p>
          ) : null}
        </div>
      )}

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
