import { useEffect, useState } from "react";
import type { FavorateListItem, ListItem } from "../types/sidebar";

const LS_KEY = "sidebar:favGroups"; // 그룹 저장 키

export function useSidebarState() {
  // 1) 초기값: 하드코딩 + localStorage 복원
  const [nestedFavorites, setNestedFavorites] = useState<FavorateListItem[]>(
    () => {
      if (typeof window === "undefined") return DEFAULT_GROUPS;
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return DEFAULT_GROUPS;
        const parsed = JSON.parse(raw) as FavorateListItem[];
        return Array.isArray(parsed) ? parsed : DEFAULT_GROUPS;
      } catch {
        return DEFAULT_GROUPS;
      }
    }
  );

  // 2) 즐겨찾기 외 섹션 (그대로)
  const [explorations, setExplorations] = useState<ListItem[]>([
    { id: "4", title: "경상북도 경주시 첨성로 169" },
    { id: "5", title: "강원특별자치도 강릉시 창해로 17" },
    { id: "6", title: "전라북도 전주시 완산구 기린대로 99" },
    { id: "7", title: "강원특별자치도 속초시 설악산로 1091" },
  ]);
  const [siteReservations, setSiteReservations] = useState<ListItem[]>([
    { id: "res1", title: "서울특별시 강남구 테헤란로 123 - 2024.01.15" },
    { id: "res2", title: "부산광역시 해운대구 해운대해변로 264 - 2024.01.20" },
    { id: "res3", title: "제주특별자치도 제주시 첨단로 242 - 2024.01.25" },
  ]);

  // 3) 로컬스토리지 동기화
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(nestedFavorites));
    } catch {}
  }, [nestedFavorites]);

  // ─────────────────────────────────────────────────────────────
  // ⭐ 핵심 추가: 그룹 생성/추가/삭제 헬퍼들
  // ─────────────────────────────────────────────────────────────

  /** 그룹이 없으면 생성하고, 있으면 그대로 반환 */
  const ensureFavoriteGroup = (groupId: string, label?: string) => {
    setNestedFavorites((prev) => {
      const exists = prev.some((g) => g.title === groupId);
      if (exists) return prev;
      const newGroup: FavorateListItem = {
        id: `fav-${groupId}`,
        title: groupId, // 고객번호 뒤 4자리 자체를 label로 사용
        subItems: [],
      };
      return [...prev, newGroup];
    });
  };

  /** 특정 그룹에 항목 추가(중복 방지) */
  const addFavoriteToGroup = (groupId: string, item: ListItem) => {
    setNestedFavorites((prev) =>
      prev.map((g) => {
        if (g.title !== groupId) return g;
        const already = g.subItems.some((s) => s.id === item.id);
        if (already) return g;
        return { ...g, subItems: [...g.subItems, item] };
      })
    );
  };

  /** 그룹 만들고 바로 추가 (네이버식: “그룹 선택/생성 → 추가”) */
  const createGroupAndAdd = (groupId: string, item: ListItem) => {
    setNestedFavorites((prev) => {
      const idx = prev.findIndex((g) => g.title === groupId);
      if (idx === -1) {
        // 새 그룹 생성 후 추가
        return [
          ...prev,
          {
            id: `fav-${groupId}`,
            title: groupId,
            subItems: [item],
          },
        ];
      }
      // 기존 그룹에 중복 체크 후 추가
      const group = prev[idx];
      const exists = group.subItems.some((s) => s.id === item.id);
      if (exists) return prev;
      const updated = [...prev];
      updated[idx] = { ...group, subItems: [...group.subItems, item] };
      return updated;
    });
  };

  /** 그룹 전체 삭제 */
  const deleteFavoriteGroup = (groupId: string) => {
    setNestedFavorites((prev) => prev.filter((g) => g.title !== groupId));
  };

  /** 그룹 내 항목 삭제 */
  const handleDeleteSubFavorite = (parentId: string, subId: string) => {
    setNestedFavorites((prev) =>
      prev.map((item) =>
        item.id === parentId
          ? {
              ...item,
              subItems: item.subItems.filter((sub) => sub.id !== subId),
            }
          : item
      )
    );
  };

  // 기존 삭제 핸들러들 유지 (그룹 id로 삭제)
  const handleDeleteNestedFavorite = (id: string) => {
    setNestedFavorites((prev) => prev.filter((item) => item.id !== id));
  };
  const handleDeleteExploration = (id: string) => {
    setExplorations((prev) => prev.filter((item) => item.id !== id));
  };
  const handleDeleteSiteReservation = (id: string) => {
    setSiteReservations((prev) => prev.filter((item) => item.id !== id));
  };

  const handleContractRecordsClick = () => {
    console.log("영업자 계약기록 버튼 클릭됨");
  };

  return {
    // state
    nestedFavorites,
    explorations,
    siteReservations,
    // setters (필요 시)
    setNestedFavorites,
    setExplorations,
    setSiteReservations,
    // actions - 즐겨찾기 그룹
    ensureFavoriteGroup,
    addFavoriteToGroup,
    createGroupAndAdd,
    deleteFavoriteGroup,
    // actions - 삭제류
    handleDeleteNestedFavorite,
    handleDeleteSubFavorite,
    handleDeleteExploration,
    handleDeleteSiteReservation,
    // misc
    handleContractRecordsClick,
  };
}

// 초기 하드코딩 데이터
const DEFAULT_GROUPS: FavorateListItem[] = [
  {
    id: "fav1",
    title: "7342",
    subItems: [
      { id: "sub1-1", title: "서울특별시 강남구 테헤란로 123" },
      { id: "sub1-2", title: "부산광역시 해운대구 해운대해변로 264" },
    ],
  },
  {
    id: "fav2",
    title: "9158",
    subItems: [
      { id: "sub2-1", title: "제주특별자치도 제주시 첨단로 242" },
      { id: "sub2-2", title: "경기도 성남시 분당구 판교역로 166" },
    ],
  },
];
