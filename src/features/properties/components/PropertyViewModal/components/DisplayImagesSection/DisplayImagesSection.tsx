"use client";

import type { ImageItem } from "@/features/properties/types/media";
import LightboxModal from "@/features/properties/components/PropertyViewModal/components/DisplayImagesSection/components/LightboxModal";
import MiniCarousel from "@/components/molecules/MiniCarousel";
import { useEffect, useState } from "react";
import CaptionSlot from "./components/CaptionSlot";
import { AnyImg, DisplayImagesSectionProps } from "./types";

const isOkUrl = (u: string) => /^https?:|^data:|^blob:/.test(u);
const pickStr = (...xs: any[]) =>
  xs.find((x) => typeof x === "string" && x.trim())?.trim() ?? "";

function normOne(it: AnyImg): ImageItem | null {
  if (!it) return null;
  if (typeof it === "string") {
    const s = it.startsWith("url:") ? it.slice(4) : it;
    return isOkUrl(s) ? { url: s, name: "", caption: "" } : null;
  }
  const raw = it as any;
  const url = pickStr(
    raw?.url,
    raw?.dataUrl,
    raw?.idbKey?.startsWith?.("url:") ? raw.idbKey.slice(4) : ""
  );
  if (!isOkUrl(url)) return null;

  return {
    url,
    name: pickStr(raw?.name),
    caption: pickStr(raw?.caption, raw?.title), // title도 허용
    ...(typeof raw?.dataUrl === "string" ? { dataUrl: raw.dataUrl } : {}),
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
}: DisplayImagesSectionProps) {
  // 가로형 그룹
  const cardGroups: ImageItem[][] = Array.isArray(cards)
    ? cards.map((g) => normList(g)).filter((g) => g.length > 0)
    : [];
  if (cardGroups.length === 0 && Array.isArray(images)) {
    const legacy = normList(images);
    if (legacy.length) cardGroups.push(legacy);
  }

  // 세로(파일) 카드
  const fileCard = normList(files);
  const hasFileCard = fileCard.length > 0;

  const [open, setOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<ImageItem[]>([]);
  const [startIndex, setStartIndex] = useState(0);

  const [cardIdxs, setCardIdxs] = useState<number[]>([]);
  useEffect(() => {
    setCardIdxs((prev) => {
      const next = [...prev];
      if (next.length < cardGroups.length) {
        next.push(...Array(cardGroups.length - next.length).fill(0));
      } else if (next.length > cardGroups.length) {
        next.length = cardGroups.length;
      }
      return next;
    });
  }, [cardGroups.length]);

  const [fileIdx, setFileIdx] = useState(0);

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
        const curIdx = cardIdxs[gi] ?? 0;
        const cur = group[curIdx];
        const curCaption = cur?.caption || "";
        const curName = cur?.name?.trim();

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
                onIndexChange={(i) =>
                  setCardIdxs((prev) => {
                    const next = [...prev];
                    next[gi] = i;
                    return next;
                  })
                }
              />
              {/* 파일명 오버레이(옵션) */}
              {showNames && curName ? (
                <div className="absolute bottom-2 left-2 max-w-[75%] rounded bg-black/40 text-white text-[11px] px-2 py-0.5 truncate">
                  {curName}
                </div>
              ) : null}
            </div>

            <CaptionSlot text={curCaption} />
          </div>
        );
      })}

      {/* 세로(파일) 카드 */}
      {hasFileCard && (
        <div className="rounded-xl border bg-gray-50/60 p-3">
          <div className="relative h-80 overflow-hidden rounded-md border bg-white">
            <MiniCarousel
              images={fileCard}
              aspect="auto"
              objectFit="cover"
              showDots
              showIndex
              indexPlacement="top-right"
              onImageClick={(i) => openLightbox(fileCard, i)}
              onIndexChange={setFileIdx}
              className="absolute inset-0"
            />
          </div>

          <CaptionSlot text={fileCard[fileIdx]?.caption} />
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
