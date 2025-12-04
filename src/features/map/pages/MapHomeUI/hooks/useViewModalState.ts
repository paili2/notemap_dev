"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getPinRaw } from "@/shared/api/pins/queries/getPin";
import { toViewDetailsFromApi } from "@/features/properties/lib/view/toViewDetailsFromApi";
import { ensureViewForEdit } from "../lib/viewUtils";
import { togglePinDisabled } from "@/shared/api/pins";
import { PropertyViewDetails } from "@/features/properties/view/types";
import {
  pinDetailKey,
  PinDetailQueryData,
} from "@/features/properties/edit/hooks/useEditForm/usePinDetail";

type Args = {
  selectedViewItem: PropertyViewDetails | null;
  onViewFromMenu?: (id: string) => void;
  onDeleteFromView?: () => Promise<void> | void;
  refreshViewportPins: () => Promise<void> | void;
  closeView?: () => void;
};

export function useViewModalState({
  selectedViewItem,
  onViewFromMenu,
  onDeleteFromView,
  refreshViewportPins,
  closeView,
}: Args) {
  const [viewOpenLocal, setViewOpenLocal] = useState(false);
  const [viewDataLocal, setViewDataLocal] =
    useState<PropertyViewDetails | null>(null);

  const queryClient = useQueryClient();

  const handleViewFromMenuLocal = useCallback(
    async (pinId: string) => {
      setViewOpenLocal(true);
      setViewDataLocal(null);

      try {
        const apiPin = await getPinRaw(pinId);

        // 🔹 ApiEnvelope({ data })든 raw 객체든 모두 대응
        const raw = (apiPin as any)?.data ?? apiPin;
        const base = toViewDetailsFromApi(raw) as PropertyViewDetails;

        const withEditInitial = {
          ...base,
          id: (base as any).id ?? pinId,
          editInitial: {
            view: { ...base },
            raw,
          },
        } as PropertyViewDetails & { editInitial: any };

        setViewDataLocal(withEditInitial);

        // 🔹 여기서 react-query 캐시에도 동일 데이터 심어줌
        const key = pinDetailKey(pinId);
        const cacheValue: PinDetailQueryData = {
          raw,
          view: base,
        };

        queryClient.setQueryData(key, cacheValue);
      } catch (e) {
        console.error(e);
        setViewOpenLocal(false);
      }
    },
    [queryClient]
  );

  const handleViewFromMenu = useCallback(
    (id: string) => {
      onViewFromMenu?.(id);
      handleViewFromMenuLocal(id);
    },
    [onViewFromMenu, handleViewFromMenuLocal]
  );

  const handleOpenViewAfterCreate = useCallback(
    (pinId: string | number) => {
      handleViewFromMenu(String(pinId));
    },
    [handleViewFromMenu]
  );

  const handleDeleteFromView = useCallback(async () => {
    if (typeof onDeleteFromView === "function") {
      await onDeleteFromView();
      return;
    }
    const id =
      (selectedViewItem as any)?.id ?? (viewDataLocal as any)?.id ?? null;
    if (!id) return;

    try {
      await togglePinDisabled(String(id), true);
      await refreshViewportPins();
      setViewOpenLocal(false);
    } catch (e) {
      console.error("[disable-pin] 실패:", e);
    }
  }, [onDeleteFromView, selectedViewItem, viewDataLocal, refreshViewportPins]);

  const handleCloseView = useCallback(() => {
    setViewOpenLocal(false);
    closeView?.();
  }, [closeView]);

  const selectedViewForModal = useMemo(() => {
    const base = (viewDataLocal ??
      selectedViewItem ??
      null) as PropertyViewDetails | null;
    return ensureViewForEdit(base);
  }, [selectedViewItem, viewDataLocal]);

  useEffect(() => {
    if (selectedViewItem) setViewOpenLocal(true);
  }, [selectedViewItem]);

  return {
    viewOpenLocal,
    selectedViewForModal,
    handleViewFromMenu,
    handleOpenViewAfterCreate,
    handleDeleteFromView,
    handleCloseView,
  };
}
