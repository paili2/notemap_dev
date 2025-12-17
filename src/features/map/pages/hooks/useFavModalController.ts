import { ListItem } from "@/features/sidebar";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseFavArgs = {
  createGroupAndAdd: (groupId: string, item: ListItem) => void;
  ensureFavoriteGroup: (groupId: string) => void;
  addFavoriteToGroup: (groupId: string, item: ListItem) => void;
  getCurrentItem: () => ListItem | null;
  isFavorited?: (id: string) => boolean;
  removeFavorite?: (id: string) => void | Promise<void>;
};

export function useFavModalController(args: UseFavArgs) {
  const [favModalOpen, setFavModalOpen] = useState(false);
  const [favCandidate, setFavCandidate] = useState<ListItem | null>(null);

  const onAddFav = useCallback(async () => {
    const snap = args.getCurrentItem();
    if (!snap) return;

    const alreadyFav = args.isFavorited?.(snap.id) ?? false;
    if (alreadyFav) {
      // ✅ 이미 즐겨찾기면: 모달 없이 즉시 삭제
      await args.removeFavorite?.(snap.id);
      setFavModalOpen(false);
      setFavCandidate(null);
      return;
    }

    // ✅ 미즐겨찾기면: 그룹 선택 모달 오픈
    setFavCandidate(snap);
    setFavModalOpen(true);
  }, [args]);

  const handleSelectGroup = useCallback(
    (groupId: string) => {
      if (!favCandidate) {
        alert("추가할 대상이 없습니다. 지도를 다시 선택해 주세요.");
        return;
      }
      // 이미 즐겨찾기인 경우에는 추가 흐름을 막음 (삭제는 버튼에서 즉시 처리)
      if (args.isFavorited?.(favCandidate.id) ?? false) return;
      args.addFavoriteToGroup(groupId, favCandidate);
      setFavModalOpen(false);
      setFavCandidate(null);
    },
    [args, favCandidate]
  );

  const handleCreateAndSelect = useCallback(
    (groupId: string) => {
      args.ensureFavoriteGroup(groupId);
      if (favCandidate) {
        // 이미 즐겨찾기인 경우에는 추가 흐름을 막음 (삭제는 버튼에서 즉시 처리)
        if (args.isFavorited?.(favCandidate.id) ?? false) {
          setFavModalOpen(false);
          setFavCandidate(null);
          return;
        }
        args.createGroupAndAdd(groupId, favCandidate);
      }
      setFavModalOpen(false);
      setFavCandidate(null);
    },
    [args, favCandidate]
  );

  const closeFavModal = useCallback(() => {
    setFavModalOpen(false);
    setFavCandidate(null);
  }, []);

  return {
    onAddFav,
    favModalOpen,
    closeFavModal,
    handleSelectGroup,
    handleCreateAndSelect,
  } as const;
}
