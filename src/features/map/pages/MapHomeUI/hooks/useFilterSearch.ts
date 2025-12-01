// useFilterSearch.ts
import { useState, useCallback } from "react";
import { searchPins } from "@/shared/api/pins";
import type {
  PinSearchParams,
  PinSearchResult,
} from "@/features/pins/types/pin-search";
import { fitSearchResultToBounds } from "../lib/searchUtils";

type Args = {
  kakaoSDK: any;
  mapInstance: any;
  setFilterSearchOpen: (open: boolean) => void;
  setNoResultDialogOpen: (open: boolean) => void;
};

export function useFilterSearch({
  kakaoSDK,
  mapInstance,
  setFilterSearchOpen,
  setNoResultDialogOpen,
}: Args) {
  const [searchRes, setSearchRes] = useState<PinSearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fitToSearch = useCallback(
    (res: PinSearchResult) => {
      fitSearchResultToBounds({ kakaoSDK, mapInstance, res });
    },
    [kakaoSDK, mapInstance]
  );

  const handleApplyFilters = useCallback(
    async (params: PinSearchParams) => {
      setFilterSearchOpen(false);
      setSearchLoading(true);
      setSearchError(null);
      try {
        const res = await searchPins(params);
        setSearchRes(res);

        const hasPins = (res.pins?.length ?? 0) > 0;
        const hasDrafts = (res.drafts?.length ?? 0) > 0;

        if (!hasPins && !hasDrafts) {
          setNoResultDialogOpen(true);
        } else {
          fitToSearch(res);
        }
      } catch (e: any) {
        setSearchError(e?.message ?? "검색 실패");
        setSearchRes(null);
      } finally {
        setSearchLoading(false);
      }
    },
    [fitToSearch, setFilterSearchOpen, setNoResultDialogOpen]
  );

  const clearSearch = useCallback(() => {
    setSearchRes(null);
    setSearchError(null);
  }, []);

  return {
    searchRes,
    searchLoading,
    searchError,
    handleApplyFilters,
    clearSearch,
  };
}
