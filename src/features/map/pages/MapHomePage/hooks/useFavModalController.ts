import { ListItem } from "@/features/sidebar";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseFavArgs = {
  createGroupAndAdd: (groupId: string, item: ListItem) => void;
  ensureFavoriteGroup: (groupId: string) => void;
  addFavoriteToGroup: (groupId: string, item: ListItem) => void;
  getCurrentItem: () => ListItem | null;
};

// ✅ 함수 본문
const MAP_FAVS_LS_KEY = "map:favs";

export function useFavModalController(args: UseFavArgs) {
  const [favModalOpen, setFavModalOpen] = useState(false);
  const [favCandidate, setFavCandidate] = useState<ListItem | null>(null);
  const [favById, setFavById] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(MAP_FAVS_LS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const normalized: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(parsed))
        normalized[k] = typeof v === "boolean" ? v : (v as any) === "true";
      return normalized;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(MAP_FAVS_LS_KEY, JSON.stringify(favById));
    } catch {}
  }, [favById]);

  const onAddFav = useCallback(() => {
    const snap = args.getCurrentItem();
    setFavCandidate(snap);
    setFavModalOpen(true);
  }, [args]);

  const handleSelectGroup = useCallback(
    (groupId: string) => {
      if (!favCandidate) {
        alert("추가할 대상이 없습니다. 지도를 다시 선택해 주세요.");
        return;
      }
      args.addFavoriteToGroup(groupId, favCandidate);
      setFavById((prev) => ({ ...prev, [favCandidate.id]: true }));
      setFavModalOpen(false);
      setFavCandidate(null);
    },
    [args, favCandidate]
  );

  const handleCreateAndSelect = useCallback(
    (groupId: string) => {
      args.ensureFavoriteGroup(groupId);
      if (favCandidate) {
        args.createGroupAndAdd(groupId, favCandidate);
        setFavById((prev) => ({ ...prev, [favCandidate.id]: true }));
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
    favById,
    onAddFav,
    favModalOpen,
    closeFavModal,
    handleSelectGroup,
    handleCreateAndSelect,
  } as const;
}
