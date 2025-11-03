"use client";

import type { ImageItem } from "@/features/properties/types/media";
import LightboxModal from "@/features/properties/components/PropertyViewModal/components/DisplayImagesSection/components/LightboxModal";
import MiniCarousel from "@/components/molecules/MiniCarousel";
import { useCallback, useEffect, useMemo, useState } from "react";
import CaptionSlot from "./components/CaptionSlot";
import { AnyImg, DisplayImagesSectionProps } from "./types";

/* ───────── 유틸 ───────── */
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
    caption: pickStr(raw?.caption, raw?.title),
    ...(typeof raw?.dataUrl === "string" ? { dataUrl: raw.dataUrl } : {}),
  };
}
function normList(list?: Array<AnyImg>): ImageItem[] {
  if (!Array.isArray(list)) return [];
  return list.map(normOne).filter(Boolean) as ImageItem[];
}
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/* ───────── 컴포넌트 ───────── */
export default function DisplayImagesSection({
  cards,
  images,
  files,
  showNames = false,
}: DisplayImagesSectionProps) {
  /* 1) 카드를 안정적으로 정규화 */
  const cardGroups = useMemo<ImageItem[][]>(() => {
    const groups = Array.isArray(cards)
      ? (cards as AnyImg[][])
          .map((g) => normList(g))
          .filter((g) => g.length > 0)
      : [];

    // 카드가 비었고 legacy images가 있으면 fallback
    if (groups.length === 0 && Array.isArray(images)) {
      const legacy = normList(images as AnyImg[]);
      if (legacy.length) groups.push(legacy);
    }
    return groups;
  }, [cards, images]);

  /* 2) 세로(파일) 카드 정규화 */
  const fileCard = useMemo<ImageItem[]>(
    () => normList(files as AnyImg[]),
    [files]
  );
  const hasFileCard = fileCard.length > 0;

  /* 3) 라이트박스 상태 */
  const [open, setOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<ImageItem[]>([]);
  const [startIndex, setStartIndex] = useState(0);

  const openLightbox = useCallback((group: ImageItem[], index = 0) => {
    setLightboxImages(group);
    setStartIndex(clamp(index, 0, Math.max(0, group.length - 1)));
    setOpen(true);
  }, []);

  /* 4) 각 카드별 현재 인덱스(캐러셀 인덱스) 관리 + 길이 변화 방어 */
  const [cardIdxs, setCardIdxs] = useState<number[]>([]);
  useEffect(() => {
    setCardIdxs((prev) => {
      const next = [...prev];

      // 길이 증가 → 0으로 채움
      if (next.length < cardGroups.length) {
        next.push(...Array(cardGroups.length - next.length).fill(0));
      } else if (next.length > cardGroups.length) {
        // 길이 감소 → 잘라냄
        next.length = cardGroups.length;
      }

      // 각 그룹 길이에 맞게 개별 인덱스 클램프
      for (let i = 0; i < next.length; i++) {
        const len = cardGroups[i]?.length ?? 0;
        if (len === 0) next[i] = 0;
        else next[i] = clamp(next[i] ?? 0, 0, len - 1);
      }
      return next;
    });
  }, [cardGroups]);

  /* 5) 세로 카드 인덱스 */
  const [fileIdx, setFileIdx] = useState(0);
  useEffect(() => {
    if (!hasFileCard) {
      setFileIdx(0);
    } else {
      setFileIdx((i) => clamp(i, 0, Math.max(0, fileCard.length - 1)));
    }
  }, [hasFileCard, fileCard.length]);

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
        const curIdx = clamp(
          cardIdxs[gi] ?? 0,
          0,
          Math.max(0, group.length - 1)
        );
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
                    next[gi] = clamp(i, 0, Math.max(0, group.length - 1));
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
              onIndexChange={(i) =>
                setFileIdx(clamp(i, 0, Math.max(0, fileCard.length - 1)))
              }
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
