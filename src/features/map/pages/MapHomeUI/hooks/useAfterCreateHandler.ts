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

      // 🔹 1) 답사예정 간단등록(visit-plan-only)
      if (mode === "visit-plan-only") {
        // 임시 상태/모달 정리만 하고,
        // ✅ 기존 onAfterCreate(=usePinsMap.refetch 호출) 는 더 이상 부르지 않는다.
        createHostHandlers?.resetAfterCreate?.();
        createHostHandlers?.onClose?.();
        closeView?.();
        return;
      }

      // 🔹 2) 일반 매물 생성(create)
      if (matchedDraftId != null && pinId != null) {
        // 기존 임시핀 → 실제 핀으로 교체
        replaceTempByRealId(matchedDraftId, pinId);
      } else if (lat != null && lng != null && pinId != null) {
        // 혹시 draftId를 못 찾았을 때는 새 draft 마커로 대체
        upsertDraftMarker({
          id: `__visit__${pinId}`,
          lat,
          lng,
          address: null,
          source: "draft",
        });
      }

      // 일반 생성일 때는 기존 onAfterCreate 로직도 그대로 실행
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
