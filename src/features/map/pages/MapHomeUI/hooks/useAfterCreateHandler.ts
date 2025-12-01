// useAfterCreateHandler.ts
import { useCallback } from "react";

type Args = {
  createHostHandlers: any;
  closeView?: () => void;
  replaceTempByRealId: (
    draftId: number | string,
    pinId: number | string
  ) => void;
  upsertDraftMarker: (m: {
    id: string;
    lat: number;
    lng: number;
    address: string | null;
    source: "draft";
  }) => void;
};

export function useAfterCreateHandler({
  createHostHandlers,
  closeView,
  replaceTempByRealId,
  upsertDraftMarker,
}: Args) {
  const originalOnAfterCreate = createHostHandlers?.onAfterCreate;

  const handleAfterCreate = useCallback(
    (args: any) => {
      const { matchedDraftId, lat, lng, mode, pinId } = args || {};

      if (mode === "visit-plan-only") {
        createHostHandlers?.resetAfterCreate?.();
        createHostHandlers?.onClose?.();
        closeView?.();
        originalOnAfterCreate?.(args);
        return;
      }

      if (matchedDraftId != null && pinId != null) {
        replaceTempByRealId(matchedDraftId, pinId);
      } else if (lat != null && lng != null && pinId != null) {
        upsertDraftMarker({
          id: `__visit__${pinId}`,
          lat,
          lng,
          address: null,
          source: "draft",
        });
      }

      originalOnAfterCreate?.(args);
    },
    [
      closeView,
      createHostHandlers,
      originalOnAfterCreate,
      replaceTempByRealId,
      upsertDraftMarker,
    ]
  );

  return { handleAfterCreate };
}
