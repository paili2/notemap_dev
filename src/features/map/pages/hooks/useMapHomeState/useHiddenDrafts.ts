"use client";

import { useCallback, useState } from "react";

export function useHiddenDrafts() {
  const [hiddenDraftIds, setHiddenDraftIds] = useState<Set<string>>(
    () => new Set()
  );

  const hideDraft = useCallback(
    (draftId: string | number | null | undefined) => {
      if (draftId == null) return;
      const key = String(draftId);
      setHiddenDraftIds((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    },
    []
  );

  const clearHiddenDraft = useCallback((draftId: string | number) => {
    const key = String(draftId);
    setHiddenDraftIds((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  return { hiddenDraftIds, hideDraft, clearHiddenDraft } as const;
}
