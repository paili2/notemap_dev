"use client";
import { create } from "zustand";
import type { PinItem } from "@/features/pins/types";
import type { PropertyViewDetails } from "../../components/PropertyViewModal/types";

type ImgLike = { url: string; caption?: string; id?: string | number };

const toUndef = <T>(v: T | null | undefined): T | undefined => v ?? undefined;

/** 문자열/숫자 모두 안전하게 propertyId 추출 → string으로 반환 */
function extractPropertyId(
  pin?: PinItem | null,
  explicit?: string | number | null
): string | undefined {
  const cands: Array<string | number | undefined> = [
    explicit ?? undefined,
    (pin as any)?.propertyId,
    (pin as any)?.property?.id,
    (pin as any)?.payload?.propertyId,
    (pin as any)?.payload?.property?.id,
    (pin as any)?.id,
  ];
  for (const v of cands) {
    if (v === 0 || (!!v && (typeof v === "string" || typeof v === "number"))) {
      const s = String(v).trim();
      if (s) return s;
    }
  }
  return undefined;
}

type ViewData = Partial<PropertyViewDetails> & {
  /** 안전한 문자열 id */
  propertyId?: string;
  title?: string;
  roadAddress?: string;
  jibunAddress?: string;
  salePrice?: string | number;

  /** ✨ 호환 유지용 (flat) */
  images?: ImgLike[];

  /** ✨ Edit 하이드레이션과 호환되는 키들 */
  imageFolders?: ImgLike[][];
  verticalImages?: ImgLike[];
  imageCardCounts?: number[];
};

type State = {
  open: boolean;
  pinId?: string;
  data?: ViewData; // 낙관적 프리필만
  openWithPin: (args: {
    pin?: PinItem | null;
    propertyId?: string | number | null;
    roadAddress?: string | null;
    jibunAddress?: string | null;
    propertyTitle?: string | null;
  }) => void;
  close: () => void;
  setData: (patch: Partial<ViewData>) => void;
};

export const usePropertyViewModal = create<State>((set, get) => ({
  open: false,
  pinId: undefined,
  data: undefined,

  openWithPin: ({
    pin,
    propertyId,
    roadAddress,
    jibunAddress,
    propertyTitle,
  }) => {
    const pid = extractPropertyId(pin, propertyId);

    // ── 이미지 소스 가능한 후보들(뷰/에딧 양쪽 호환 키) ──
    const p: any = pin ?? {};
    const payload: any = p.payload ?? {};

    // 카드형(2차원) 후보
    const foldersFromPayload: ImgLike[][] | undefined =
      payload.imageFolders ?? payload.imagesByCard ?? payload.imageCards;

    // 세로형(1차원) 후보
    const verticalFromPayload: ImgLike[] | undefined =
      payload.verticalImages ?? payload.imagesVertical ?? payload.fileItems;

    // 플랫 이미지 (fallback)
    const flatImages: ImgLike[] | undefined =
      (p.images as ImgLike[]) ?? (payload.images as ImgLike[]);

    // 카드별 개수 자동 계산
    const imageCardCounts =
      Array.isArray(foldersFromPayload) && foldersFromPayload.length > 0
        ? foldersFromPayload.map((arr) => (Array.isArray(arr) ? arr.length : 0))
        : undefined;

    const optimistic: ViewData = {
      propertyId: pid,
      title: propertyTitle ?? (p as any)?.title ?? undefined,
      roadAddress: roadAddress ?? (p as any)?.roadAddress ?? undefined,
      jibunAddress: jibunAddress ?? (p as any)?.jibunAddress ?? undefined,
      salePrice:
        (p as any)?.salePrice ??
        (p as any)?.price ??
        (payload as any)?.salePrice ??
        undefined,

      // ✨ Edit/View가 모두 이해하는 구조로 프리필
      imageFolders: foldersFromPayload ?? undefined,
      verticalImages: verticalFromPayload ?? undefined,
      imageCardCounts,

      // ✨ 기존 flat도 유지(뷰 컨테이너 일부가 참고할 수 있음)
      images: flatImages ?? undefined,
    };

    set({ open: true, pinId: pid, data: optimistic });
  },

  close: () => set({ open: false, pinId: undefined, data: undefined }),

  setData: (patch) => set({ data: { ...(get().data ?? {}), ...patch } }),
}));
