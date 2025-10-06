import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  FavorateListItem,
  ListItem,
  PendingReservation, // ✅ 추가
} from "../types/sidebar";

const LS_KEY = "sidebar:favGroups";
const LS_KEY_SITE = "sidebar:siteReservations";

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

  // 2) 답사지 예약 섹션
  const [siteReservations, setSiteReservations] = useState<ListItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LS_KEY_SITE);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Partial<ListItem>[];
      return Array.isArray(parsed)
        ? parsed.map((it) => ({
            id: String(it.id ?? crypto.randomUUID()),
            title: String(it.title ?? ""),
            dateISO: String(it.dateISO ?? ""), // ← 과거 데이터 폴백
            createdAt: it.createdAt ?? new Date().toISOString(),
            posKey: it.posKey ?? undefined,
          }))
        : [];
    } catch {
      return [];
    }
  });

  // ✅ 답사지예약 '초안' 상태 (컨텍스트 메뉴 → 사이드바로 넘길 임시 데이터)
  const [pendingReservation, setPendingReservation] =
    useState<PendingReservation | null>(null);
  const clearPendingReservation = useCallback(
    () => setPendingReservation(null),
    []
  );

  // ✅ 현재 순서 -> 배지/지도에 사용하는 맵 (id -> 1-based order)
  const reservationOrderMap = useMemo(() => {
    const map: Record<string, number> = {};
    siteReservations.forEach((it, idx) => {
      const id = it?.id;
      if (id) map[id] = idx + 1;
    });
    return map;
  }, [siteReservations]);

  // (선택) 헬퍼
  const getReservationOrder = useCallback(
    (pinId: string) => reservationOrderMap[pinId] ?? null,
    [reservationOrderMap]
  );

  const makePosKey = (lat: number, lng: number) =>
    `${lat.toFixed(6)},${lng.toFixed(6)}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LS_KEY_SITE, JSON.stringify(siteReservations));
    } catch {}
  }, [siteReservations]);

  const handleAddSiteReservation = useCallback((item: ListItem) => {
    setSiteReservations((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev; // 중복 방지
      const withCreated: ListItem = {
        ...item,
        createdAt: item.createdAt ?? new Date().toISOString(),
      };
      return [withCreated, ...prev].slice(0, 200);
    });
  }, []);

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
  const handleDeleteSiteReservation = (id: string) => {
    setSiteReservations((prev) => prev.filter((item) => item.id !== id));
  };

  const handleContractRecordsClick = () => {
    console.log("영업자 계약기록 버튼 클릭됨");
  };

  return {
    // state
    nestedFavorites,
    siteReservations,
    pendingReservation, // ✅ 추가

    // setters (필요 시)
    setNestedFavorites,
    setSiteReservations,

    reservationOrderMap,
    getReservationOrder,

    // actions - 즐겨찾기 그룹
    ensureFavoriteGroup,
    addFavoriteToGroup,
    createGroupAndAdd,
    deleteFavoriteGroup,

    // actions - 답사지예약
    handleAddSiteReservation,
    handleDeleteSiteReservation,
    setPendingReservation, // ✅ 추가
    clearPendingReservation, // ✅ 추가

    // actions - 삭제류
    handleDeleteNestedFavorite,
    handleDeleteSubFavorite,

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
