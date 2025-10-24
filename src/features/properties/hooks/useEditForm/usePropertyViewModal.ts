"use client";

import { create } from "zustand";
import type { PinItem } from "@/features/pins/types";
import type { PropertyViewDetails } from "../../components/PropertyViewModal/types";

const toUndef = <T>(v: T | null | undefined): T | undefined => v ?? undefined;

// 🔎 핀에서 propertyId 후보를 안전 추출
function extractPropertyId(
  pin?: PinItem | null,
  explicit?: string | null
): string | undefined {
  const cands = [
    explicit ?? undefined, // 컨텍스트메뉴에서 직접 넘어온 propertyId
    (pin as any)?.propertyId, // 일부 구현에서 직접 가질 수 있음
    (pin as any)?.property?.id, // 중첩 객체
    (pin as any)?.payload?.propertyId, // payload 경유
    (pin as any)?.payload?.property?.id, // payload 내부 중첩
    (pin as any)?.id, // 최후 후보(핀 id==매물 id로 쓰는 프로젝트도 있어서)
  ];
  for (const v of cands) {
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return undefined;
}

// 🔸 뷰 모달에서 쓰는 데이터(프리필 + 서버 페치 병행)
type ViewData = Partial<PropertyViewDetails> & {
  propertyId?: string;
  title?: string;
  roadAddress?: string;
  jibunAddress?: string;
  salePrice?: string | number;
  images?: { url: string; caption?: string }[];
};

type State = {
  open: boolean;
  data?: ViewData;
  // 서버에서 최신 상세를 채워넣었는지 여부(낙관적 프리필 이후)
  hydrated: boolean;
  openWithPin: (args: {
    pin?: PinItem | null;
    propertyId?: string | null;
    roadAddress?: string | null;
    jibunAddress?: string | null;
    propertyTitle?: string | null;
  }) => void;
  close: () => void;
  setHydrated: (v: boolean) => void;
  setData: (patch: Partial<ViewData>) => void;
};

/* ───────────── 유틸: 이미지 정규화 ───────────── */
function toViewImages(
  detail: PropertyViewDetails
): { url: string; caption?: string }[] | undefined {
  const imgs = detail.images;
  if (!imgs) return undefined;

  // string[] 형태면 url만 있는 케이스
  if (Array.isArray(imgs) && typeof imgs[0] === "string") {
    return (imgs as string[]).map((url) => ({ url }));
  }

  // ImageItem[] 형태면 url/name/caption에서 적절히 추출
  return (imgs as any[]).map((it) => ({
    url: it.url ?? it.src ?? it.path ?? "",
    caption: it.caption ?? it.name,
  }));
}

export const usePropertyViewModal = create<State>((set, get) => ({
  open: false,
  data: undefined,
  hydrated: false,

  openWithPin: ({
    pin,
    propertyId,
    roadAddress,
    jibunAddress,
    propertyTitle,
  }) => {
    const pid = extractPropertyId(pin, propertyId);

    const optimistic: ViewData = {
      propertyId: pid,
      title: propertyTitle ?? (pin as any)?.title ?? undefined,
      roadAddress: roadAddress ?? (pin as any)?.roadAddress ?? undefined,
      jibunAddress: jibunAddress ?? (pin as any)?.jibunAddress ?? undefined,
      salePrice:
        (pin as any)?.salePrice ??
        (pin as any)?.price ??
        (pin as any)?.payload?.salePrice ??
        undefined,
      images:
        ((pin as any)?.images as { url: string; caption?: string }[]) ??
        ((pin as any)?.payload?.images as {
          url: string;
          caption?: string;
        }[]) ??
        undefined,
    };

    set({ open: true, data: optimistic, hydrated: false });
    if (!pid) return;

    import("@/shared/api/api" as any)
      .then((mod: any) => mod.api ?? mod.default ?? mod)
      .then(async (api: any) => {
        try {
          // ✅ pins/:id만 사용
          const res = await api.get(`/pins/${pid}`);
          const detail: PropertyViewDetails = res.data;

          set({
            data: {
              ...(get().data ?? {}),
              ...detail,
              // pins 응답에 propertyId가 따로 있으면 우선 사용, 없으면 id/pid
              propertyId:
                (detail as any).propertyId ?? (detail as any).id ?? pid,
              images: toViewImages(detail),
              salePrice: toUndef(detail.salePrice),
            },
            hydrated: true,
          });
        } catch {
          set({ hydrated: false });
        }
      })
      .catch(() => {
        /* api 모듈 로드 실패 시 프리필만 유지 */
      });
  },

  close: () => set({ open: false, data: undefined, hydrated: false }),
  setHydrated: (v) => set({ hydrated: v }),
  setData: (patch) => set({ data: { ...(get().data ?? {}), ...patch } }),
}));
