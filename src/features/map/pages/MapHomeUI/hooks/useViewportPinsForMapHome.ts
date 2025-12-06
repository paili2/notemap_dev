"use client";

import { useMemo } from "react";
import { MapMenuKey } from "@/features/map/components/menu/types/mapMenu.types";
import { usePinsFromViewport } from "@/features/map/hooks/usePinsFromViewport";
import type { PinSearchResult } from "@/features/pins/types/pin-search";
import {
  toServerPointsFromPins,
  toServerDraftsFromDrafts,
} from "../lib/searchUtils";

type Args = {
  mapInstance: any;
  filter: MapMenuKey;
  searchRes: PinSearchResult | null;
};

export function useViewportPinsForMapHome({
  mapInstance,
  filter,
  searchRes,
}: Args) {
  const draftStateForQuery = useMemo<
    undefined | "before" | "scheduled" | "all"
  >(() => {
    switch (filter) {
      case "plannedOnly":
        return "before";
      default:
        return undefined;
    }
  }, [filter]);

  const isNewFlag = useMemo(
    () => (filter === "new" ? true : undefined),
    [filter]
  );

  const isOldFlag = useMemo(
    () => (filter === "old" ? true : undefined),
    [filter]
  );

  const {
    points: serverPoints,
    drafts: serverDrafts,
    loading: pinsLoading,
    error: pinsError,
    reload, // 👈 usePinsFromViewport에서 넘어오는 reload
  } = usePinsFromViewport({
    map: mapInstance,
    debounceMs: 300,
    draftState: draftStateForQuery,
    isNew: isNewFlag,
    isOld: isOldFlag,
  });

  const normServerPoints = useMemo(
    () =>
      serverPoints?.map((p) => ({ ...p, title: p.title ?? undefined })) ?? [],
    [serverPoints]
  );

  const normServerDrafts = useMemo(
    () =>
      serverDrafts?.map((d) => ({ ...d, title: d.title ?? undefined })) ?? [],
    [serverDrafts]
  );

  const effectiveServerPoints = useMemo(
    () =>
      searchRes?.pins
        ? toServerPointsFromPins(searchRes.pins)
        : normServerPoints,
    [searchRes?.pins, normServerPoints]
  );

  const effectiveServerDrafts = useMemo(
    () =>
      searchRes?.drafts
        ? toServerDraftsFromDrafts(searchRes.drafts)
        : normServerDrafts,
    [searchRes?.drafts, normServerDrafts]
  );

  return {
    pinsLoading,
    pinsError,
    effectiveServerPoints,
    effectiveServerDrafts,
    reloadPins: reload,
  };
}
