"use client";

import type { ImageItem } from "@/features/properties/types/media";
import LightboxModal from "./components/LightboxModal";
import MiniCarousel from "@/components/molecules/MiniCarousel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CaptionSlot from "./components/CaptionSlot";
import { AnyImg, DisplayImagesSectionProps } from "./types";

/* ───────── 로컬 전용 뷰 타입 ───────── */
/** 전역 ImageItem 을 건드리지 않고, 뷰에서만 추가로 쓰는 필드들을 확장 */
type DisplayImageItem = ImageItem & {
  caption?: string;
  name?: string;
  dataUrl?: string;
};

/* ───────── 유틸 ───────── */
const isOkUrl = (u: string) => /^https?:|^data:|^blob:/.test(u);
const pickStr = (...xs: any[]) =>
  xs.find((x) => typeof x === "string" && x.trim())?.trim() ?? "";

/** AnyImg → DisplayImageItem 하나로 정규화 */
function normOne(it: AnyImg): DisplayImageItem | null {
  if (!it) return null;

  if (typeof it === "string") {
    const s = it.startsWith("url:") ? it.slice(4) : it;
    return isOkUrl(s)
      ? ({ url: s, name: "", caption: "" } as DisplayImageItem)
      : null;
  }

  const raw = it as any;
  const url = pickStr(
    raw?.url,
    raw?.dataUrl,
    raw?.idbKey?.startsWith?.("url:") ? raw.idbKey.slice(4) : ""
  );
  if (!isOkUrl(url)) return null;

  const name = pickStr(raw?.name);
  const caption = pickStr(raw?.caption, raw?.title);

  const base: DisplayImageItem = {
    ...(raw as ImageItem),
    url,
    name,
    caption,
  };

  if (typeof raw?.dataUrl === "string") {
    base.dataUrl = raw.dataUrl;
  }

  return base;
}

function normList(list?: Array<AnyImg>): DisplayImageItem[] {
  if (!Array.isArray(list)) return [];
  return list.map(normOne).filter(Boolean) as DisplayImageItem[];
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/* ───────── 입력 정규화 (제목 무시) ───────── */
type Group = { items: DisplayImageItem[] };

function normalizeCardGroups(cards?: unknown, images?: unknown): Group[] {
  const out: Group[] = [];
  if (Array.isArray(cards)) {
    if (
      cards.length > 0 &&
      typeof cards[0] === "object" &&
      !Array.isArray(cards[0])
    ) {
      (cards as any[]).forEach((c) => {
        const items = normList(c?.images);
        out.push({ items });
      });
    } else {
      (cards as any[]).forEach((arr) => {
        const items = normList(arr);
        out.push({ items });
      });
    }
  }
  if (out.length === 0 && Array.isArray(images)) {
    const legacy = normList(images as AnyImg[]);
    out.push({ items: legacy });
  }
  return out;
}

function normalizeFileGroups(files?: unknown): Group[] {
  const out: Group[] = [];
  if (!Array.isArray(files)) return out;

  const first = files[0];
  if (first && typeof first === "object" && !Array.isArray(first)) {
    (files as any[]).forEach((f) => {
      const items = normList(f?.images);
      out.push({ items });
    });
  } else if (Array.isArray(first)) {
    (files as any[]).forEach((arr) => {
      const items = normList(arr);
      out.push({ items });
    });
  } else {
    const single = normList(files as AnyImg[]);
    out.push({ items: single });
  }
  return out;
}

/* ───────── 컴포넌트 ───────── */
export default function DisplayImagesSection({
  cards,
  images,
  files,
  showNames = false,
}: DisplayImagesSectionProps) {
  const rawCardGroups = useMemo(
    () => normalizeCardGroups(cards, images),
    [cards, images]
  );
  const rawFileGroups = useMemo(() => normalizeFileGroups(files), [files]);

  // 아이템 참조 안정화
  const cacheRef = useRef<Map<string, DisplayImageItem>>(new Map());
  const stabilizeItems = useCallback((items?: DisplayImageItem[]) => {
    const src = Array.isArray(items) ? items : [];
    const next = new Map<string, DisplayImageItem>();
    const out = src.map((it) => {
      const key = `${it?.url ?? ""}|${it?.name ?? ""}|${it?.caption ?? ""}`;
      const prev = cacheRef.current.get(key);
      const stable = prev ?? it;
      next.set(key, stable);
      return stable;
    });
    cacheRef.current = next;
    return out;
  }, []);

  const cardGroups = useMemo<Group[]>(
    () => rawCardGroups.map((g) => ({ items: stabilizeItems(g?.items) })),
    [rawCardGroups, stabilizeItems]
  );
  const fileGroups = useMemo<Group[]>(
    () => rawFileGroups.map((g) => ({ items: stabilizeItems(g?.items) })),
    [rawFileGroups, stabilizeItems]
  );

  const hasAny =
    cardGroups.some((g) => (g.items?.length ?? 0) > 0) ||
    fileGroups.some((g) => (g.items?.length ?? 0) > 0);

  // 라이트박스
  const [open, setOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<DisplayImageItem[]>([]);
  const [startIndex, setStartIndex] = useState(0);

  const openLightbox = useCallback((group: DisplayImageItem[], index = 0) => {
    const safeGroup = Array.isArray(group) ? group : [];
    setLightboxImages(safeGroup);
    setStartIndex(clamp(index, 0, Math.max(0, safeGroup.length - 1)));
    setOpen(true);
  }, []);

  // 인덱스 상태
  const [cardIdxs, setCardIdxs] = useState<number[]>([]);

  useEffect(() => {
    const lengthKey = cardGroups.map((g) => g.items?.length ?? 0).join(",");
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[DisplayImagesSection] cardGroups effect", {
        groups: cardGroups.length,
        lengths: lengthKey,
      });
    }

    const next = [...cardIdxs];
    let changed = false;

    if (next.length !== cardGroups.length) {
      next.length = cardGroups.length;
      for (let i = 0; i < cardGroups.length; i++) next[i] = next[i] ?? 0;
      changed = true;
    }

    for (let i = 0; i < next.length; i++) {
      const len = cardGroups[i]?.items?.length ?? 0;
      const safe = len === 0 ? 0 : clamp(next[i] ?? 0, 0, len - 1);
      if (safe !== next[i]) {
        next[i] = safe;
        changed = true;
      }
    }

    if (changed) setCardIdxs(next);
    // deps는 길이가 항상 2개로 고정됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cardGroups.length,
    cardGroups.map((g) => g.items?.length ?? 0).join(","),
  ]);

  const [fileIdxs, setFileIdxs] = useState<number[]>([]);

  useEffect(() => {
    const lengthKey = fileGroups.map((g) => g.items?.length ?? 0).join(",");
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[DisplayImagesSection] fileGroups effect", {
        groups: fileGroups.length,
        lengths: lengthKey,
      });
    }

    const next = [...fileIdxs];
    let changed = false;

    if (next.length !== fileGroups.length) {
      next.length = fileGroups.length;
      for (let i = 0; i < fileGroups.length; i++) next[i] = next[i] ?? 0;
      changed = true;
    }

    for (let i = 0; i < next.length; i++) {
      const len = fileGroups[i]?.items?.length ?? 0;
      const safe = len === 0 ? 0 : clamp(next[i] ?? 0, 0, len - 1);
      if (safe !== next[i]) {
        next[i] = safe;
        changed = true;
      }
    }

    if (changed) setFileIdxs(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fileGroups.length,
    fileGroups.map((g) => g.items?.length ?? 0).join(","),
  ]);

  if (!hasAny) {
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
        const items = Array.isArray(group.items) ? group.items : [];
        if (!items.length) return null;

        const curIdx = clamp(
          cardIdxs[gi] ?? 0,
          0,
          Math.max(0, items.length - 1)
        );
        const cur = items[curIdx];
        const curCaption = cur?.caption || "";
        const curName = cur?.name?.trim();

        return (
          <div
            key={`card-${gi}`}
            className="rounded-xl border bg-gray-50/60 p-3"
          >
            <div className="relative aspect-video overflow-hidden rounded-md border bg-white">
              <MiniCarousel
                images={items}
                aspect="video"
                objectFit="cover"
                showDots
                showIndex
                indexPlacement="top-right"
                onImageClick={(i) => openLightbox(items, i)}
                onIndexChange={(i) => {
                  const want = clamp(i, 0, Math.max(0, items.length - 1));
                  setCardIdxs((prev) => {
                    const cur = prev[gi] ?? 0;
                    if (cur === want) return prev;
                    const next = prev.slice();
                    next[gi] = want;
                    return next;
                  });
                }}
              />
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

      {/* 세로(파일) 카드들 */}
      {fileGroups.map((group, gi) => {
        const items = Array.isArray(group.items) ? group.items : [];
        if (!items.length) return null;

        const curIdx = clamp(
          fileIdxs[gi] ?? 0,
          0,
          Math.max(0, items.length - 1)
        );

        return (
          <div
            key={`file-${gi}`}
            className="rounded-xl border bg-gray-50/60 p-3"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-md border bg-white">
              <MiniCarousel
                images={items}
                objectFit="contain"
                showDots
                showIndex
                indexPlacement="top-right"
                onImageClick={(i) => openLightbox(items, i)}
                onIndexChange={(i) => {
                  const want = clamp(i, 0, Math.max(0, items.length - 1));
                  setFileIdxs((prev) => {
                    const cur = prev[gi] ?? 0;
                    if (cur === want) return prev;
                    const next = prev.slice();
                    next[gi] = want;
                    return next;
                  });
                }}
                className="w-full h-full"
              />
            </div>

            <CaptionSlot text={items[curIdx]?.caption} />
          </div>
        );
      })}

      {open ? (
        <LightboxModal
          open={open}
          images={lightboxImages}
          initialIndex={startIndex}
          onClose={() => setOpen(false)}
          objectFit="contain"
          withThumbnails
        />
      ) : null}
    </div>
  );
}
