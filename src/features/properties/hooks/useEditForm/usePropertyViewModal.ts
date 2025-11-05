// src/features/properties/store/usePropertyViewModal.ts
"use client";
import { create } from "zustand";
import type { PinItem } from "@/features/pins/types";
import type { PropertyViewDetails } from "../../components/PropertyViewModal/types";

const toUndef = <T>(v: T | null | undefined): T | undefined => v ?? undefined;

function extractPropertyId(pin?: PinItem | null, explicit?: string | null) {
  const cands = [
    explicit ?? undefined,
    (pin as any)?.propertyId,
    (pin as any)?.property?.id,
    (pin as any)?.payload?.propertyId,
    (pin as any)?.payload?.property?.id,
    (pin as any)?.id,
  ];
  for (const v of cands) if (typeof v === "string" && v.trim()) return v;
  return undefined;
}

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
  pinId?: string;
  data?: ViewData; // 낙관적 프리필만
  openWithPin: (args: {
    pin?: PinItem | null;
    propertyId?: string | null;
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

    set({ open: true, pinId: pid, data: optimistic });
  },

  close: () => set({ open: false, pinId: undefined, data: undefined }),
  setData: (patch) => set({ data: { ...(get().data ?? {}), ...patch } }),
}));
