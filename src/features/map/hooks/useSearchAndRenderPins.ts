import { useCallback, useState } from "react";

import type {
  PinSearchParams,
  PinSearchResult,
} from "@/features/pins/types/pin-search";
import { searchPins } from "@/shared/api/pins";

export function useSearchAndRenderPins({
  onRender,
}: {
  onRender: (
    pins: PinSearchResult["pins"],
    drafts?: PinSearchResult["drafts"]
  ) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (params: PinSearchParams) => {
      setLoading(true);
      try {
        const { pins, drafts } = await searchPins(params);
        onRender(pins, drafts);
      } catch (e: any) {
        setError(e.message || "검색 실패");
      } finally {
        setLoading(false);
      }
    },
    [onRender]
  );

  return { run, loading, error };
}
