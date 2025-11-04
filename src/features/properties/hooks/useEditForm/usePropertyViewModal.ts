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
//  - 뷰는 라벨/가공값 허용
//  - 수정 모달은 editInitial(서버 원본 DTO)를 그대로 사용
type ViewData = Partial<PropertyViewDetails> & {
  propertyId?: string;
  title?: string;
  roadAddress?: string;
  jibunAddress?: string;
  salePrice?: string | number;
  images?: { url: string; caption?: string }[];
  /** 수정 모달 초기값으로 그대로 넘길 서버 원본 DTO */
  editInitial?: any; // 가능하면 실제 Property detail DTO 타입으로 교체
};

type State = {
  open: boolean;
  data?: ViewData;
  /** 핀 상세 & 매물 상세까지 최신으로 수화(hydrate) 되었는지 */
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

/* ───────────── 유틸: 이미지 정규화(뷰 표시용) ───────────── */
function toViewImages(
  detail: PropertyViewDetails
): { url: string; caption?: string }[] | undefined {
  const imgs = (detail as any)?.images;
  if (!imgs) return undefined;

  // string[] 형태면 url만 있는 케이스
  if (Array.isArray(imgs) && typeof imgs[0] === "string") {
    return (imgs as string[]).map((url) => ({ url }));
  }

  // ImageItem[] 형태면 url/name/caption에서 적절히 추출
  return (imgs as any[]).map((it) => ({
    url: it?.url ?? it?.src ?? it?.path ?? "",
    caption: it?.caption ?? it?.name,
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

    // 1) 핀에서 가져올 수 있는 값으로 낙관적 프리필
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

    // 요청 중 모달이 닫힌 뒤 set 호출되는 걸 방지
    let canceled = false;

    import("@/shared/api/api" as any)
      .then((mod: any) => mod.api ?? mod.default ?? mod)
      .then(async (api: any) => {
        try {
          // 2) 핀 상세
          const pinRes = await api.get(`/pins/${pid}`);
          const pinDetail: PropertyViewDetails & { propertyId?: string } =
            pinRes.data;

          if (canceled || !get().open) return;

          const propId =
            (pinDetail as any).propertyId ?? (pinDetail as any).id ?? pid;

          // 3) 매물(프로퍼티) 상세 - 수정 폼 초기값으로 그대로 보관
          let propertyDetailDto: any | undefined = undefined;
          try {
            if (propId) {
              const propRes = await api.get(`/properties/${propId}`);
              propertyDetailDto = propRes.data;
            }
          } catch {
            // properties 요청 실패 시에도 뷰는 유지
            propertyDetailDto = undefined;
          }
          if (canceled || !get().open) return;

          set({
            data: {
              ...(get().data ?? {}),
              ...pinDetail, // 뷰에 필요한 필드 병합
              propertyId: propId,
              images: toViewImages(pinDetail), // 뷰용 이미지 정규화
              salePrice: toUndef((pinDetail as any).salePrice),
              editInitial: propertyDetailDto, // ✅ 수정 모달 초기값(서버 원본)
            },
            hydrated: true,
          });
        } catch {
          if (!canceled) set({ hydrated: false });
        }
      })
      .catch(() => {
        /* api 모듈 로드 실패 시 프리필만 유지 */
      });

    // 모달이 닫히면 이후 set을 막기 위한 간단한 cancel 훅
    const unsubs = [
      // close 호출 시 canceled=true
      () => (canceled = true),
    ];
    // cleanup를 내부적으로만 사용 (외부에 노출할 필요 X)
    // close가 불리면 canceled 플래그가 true가 됨
  },

  close: () => set({ open: false, data: undefined, hydrated: false }),
  setHydrated: (v) => set({ hydrated: v }),
  setData: (patch) => set({ data: { ...(get().data ?? {}), ...patch } }),
}));
