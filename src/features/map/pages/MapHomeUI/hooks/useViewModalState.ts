"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getPinRaw } from "@/shared/api/pins/queries/getPin";
import { toViewDetailsFromApi } from "@/features/properties/lib/view/toViewDetailsFromApi";
import { ensureViewForEdit } from "../lib/viewUtils";
import { togglePinDisabled } from "@/shared/api/pins";
import { PropertyViewDetails } from "@/features/properties/view/types";

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

  const handleViewFromMenuLocal = useCallback(async (pinId: string) => {
    setViewOpenLocal(true);
    setViewDataLocal(null);
    try {
      const apiPin = await getPinRaw(pinId);

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
    } catch (e) {
      console.error(e);
      setViewOpenLocal(false);
    }
  }, []);

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
