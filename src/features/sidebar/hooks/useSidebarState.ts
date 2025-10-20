"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  FavorateListItem,
  ListItem,
  PendingReservation,
} from "../types/sidebar";
import { createPinDraft } from "@/shared/api/pins";
import {
  fetchUnreservedDrafts,
  type BoundsParams,
} from "@/shared/api/surveyReservations";
import { useScheduledReservations } from "@/features/survey-reservations/hooks/useScheduledReservations";

// ──────────────────────────────────────────────────────────────
// 상수/유틸
// ──────────────────────────────────────────────────────────────
const LS_KEY = "sidebar:favGroups"; // 즐겨찾기만 로컬 유지

const makePosKey = (lat: number, lng: number) =>
  `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;

const mapReservationToListItem = (r: any): ListItem => {
  const lat = Number(r?.lat);
  const lng = Number(r?.lng);
  const created = String(r?.createdAt ?? new Date().toISOString());
  const title = String(r?.addressLine ?? "");
  const reserved = String(r?.reservedDate ?? ""); // "YYYY-MM-DD"
  return {
    id: String(r?.id ?? crypto.randomUUID()),
    title,
    dateISO: reserved || created.slice(0, 10),
    createdAt: created,
    posKey:
      Number.isFinite(lat) && Number.isFinite(lng)
        ? makePosKey(lat, lng)
        : undefined,
  };
};

const mapBeforeDraftToListItem = (d: any): ListItem => {
  const lat = Number(d?.lat);
  const lng = Number(d?.lng);
  const created = String(d?.createdAt ?? new Date().toISOString());
  const title = String(d?.addressLine ?? "");
  return {
    id: String(d?.id ?? crypto.randomUUID()),
    title,
    dateISO: created.slice(0, 10),
    createdAt: created,
    posKey:
      Number.isFinite(lat) && Number.isFinite(lng)
        ? makePosKey(lat, lng)
        : undefined,
  };
};

// ──────────────────────────────────────────────────────────────
// 훅 본체
// ──────────────────────────────────────────────────────────────
export function useSidebarState() {
  // 1) 즐겨찾기: 로컬 유지
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

  // 2) 예약 전 임시핀(서버 /survey-reservations/before)
  const [siteReservations, setSiteReservations] = useState<ListItem[]>([]);

  // 3) 내 예약 목록(서버 /survey-reservations/scheduled) — 전용 훅 사용
  const {
    items: scheduledItems,
    loading: scheduledLoading,
    error: scheduledError,
    refetch: refetchScheduled,
    setItems: setScheduledItems, // 낙관적 업데이트용
  } = useScheduledReservations();

  const [scheduledReservations, setScheduledReservations] = useState<
    ListItem[]
  >([]);

  // 서버→UI 매핑(예약 목록)
  useEffect(() => {
    if (scheduledError) return;
    const mapped = scheduledItems.map(mapReservationToListItem);
    setScheduledReservations(mapped);
  }, [scheduledItems, scheduledError]);

  // 4) 임시 상태/플래그
  const [pendingReservation, setPendingReservation] =
    useState<PendingReservation | null>(null);
  const clearPendingReservation = useCallback(
    () => setPendingReservation(null),
    []
  );

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 5) 서버 동기화 — 임시핀 목록 로드
  const loadSiteReservations = useCallback(async (bounds?: BoundsParams) => {
    try {
      const list = await fetchUnreservedDrafts(bounds);
      setSiteReservations(list.map(mapBeforeDraftToListItem));
    } catch (e: any) {
      console.warn("loadSiteReservations failed:", e?.message);
    }
  }, []);

  // 초기화 (StrictMode 2회 방지)
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    void loadSiteReservations(); // 임시핀 서버 로드
    void refetchScheduled(); // 내 예약 목록 서버 로드
  }, [loadSiteReservations, refetchScheduled]);

  // 즐겨찾기는 계속 로컬 저장
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(nestedFavorites));
    } catch {}
  }, [nestedFavorites]);

  // 예약 순서 배지용 맵(id -> 1-based order) : 임시핀용
  const reservationOrderMap = useMemo(() => {
    const map: Record<string, number> = {};
    siteReservations.forEach((it, idx) => {
      const id = it?.id;
      if (id) map[id] = idx + 1;
    });
    return map;
  }, [siteReservations]);

  const getReservationOrder = useCallback(
    (pinId: string) => reservationOrderMap[pinId] ?? null,
    [reservationOrderMap]
  );

  // 생성: 현재 좌표 기준 임시핀 생성 → 서버 성공 후 목록 새로고침
  const createVisitPlanAt = useCallback(
    async (args: {
      lat: number;
      lng: number;
      roadAddress?: string | null;
      jibunAddress?: string | null;
      title?: string | null;
      memo?: string | null;
    }) => {
      setLoading(true);
      setErr(null);
      try {
        const addressLine =
          args.title?.trim() ||
          args.roadAddress?.trim() ||
          args.jibunAddress?.trim() ||
          `${args.lat.toFixed(6)}, ${args.lng.toFixed(6)}`;

        await createPinDraft({
          lat: args.lat,
          lng: args.lng,
          addressLine,
        });

        // 서버 재로딩으로 일관성 맞춤
        await loadSiteReservations();
      } catch (e: any) {
        setErr(e?.message ?? "failed to create draft");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [loadSiteReservations]
  );

  // 삭제(임시핀): 서버 엔드포인트 생기면 연결. 지금은 UI만 갱신 후 서버 로딩.
  const deleteVisitPlan = useCallback(
    async (id: string) => {
      setLoading(true);
      setErr(null);
      try {
        setSiteReservations((prev) => prev.filter((x) => x.id !== id));
        await loadSiteReservations();
      } catch (e: any) {
        setErr(e?.message ?? "failed to delete");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [loadSiteReservations]
  );

  // 예약 확정(임시핀→예약 핀): 서버 성공 후 두 목록 모두 새로고침
  const reserveVisitPlan = useCallback(
    async (
      draftId: string | number,
      opts?: { reservedDate?: string; dateISO?: string }
    ) => {
      setLoading(true);
      setErr(null);
      // 실제 예약 생성은 컨텍스트 메뉴 쪽에서 처리함(여기선 재로딩만 책임져도 됨).
      try {
        // 임시핀 리스트 낙관적 제거
        setSiteReservations((prev) =>
          prev.filter((x) => String(x.id) !== String(draftId))
        );
        // 서버 동기화
        await Promise.all([loadSiteReservations(), refetchScheduled()]);
      } catch (e: any) {
        setErr(e?.message ?? "failed to reserve");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [loadSiteReservations, refetchScheduled]
  );

  // 정렬(로컬 표시만 변경)
  const moveVisitPlan = useCallback((id: string, dir: "up" | "down") => {
    setSiteReservations((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx < 0) return prev;
      const j = dir === "up" ? idx - 1 : idx + 1;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const [a, b] = [next[idx], next[j]];
      next[idx] = b;
      next[j] = a;
      return next;
    });
  }, []);

  // 하위 호환: 과거 이름 유지 (내부에서 상태만 갱신)
  const handleAddSiteReservation = useCallback((item: ListItem) => {
    setSiteReservations((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev;
      const withCreated: ListItem = {
        ...item,
        createdAt: item.createdAt ?? new Date().toISOString(),
      };
      return [withCreated, ...prev].slice(0, 200);
    });
  }, []);

  const handleDeleteSiteReservation = useCallback(
    (id: string) => {
      void deleteVisitPlan(id);
    },
    [deleteVisitPlan]
  );

  // 즐겨찾기 CRUD
  const ensureFavoriteGroup = (groupId: string, _label?: string) => {
    setNestedFavorites((prev) => {
      const exists = prev.some((g) => g.title === groupId);
      if (exists) return prev;
      const newGroup: FavorateListItem = {
        id: `fav-${groupId}`,
        title: groupId,
        subItems: [],
      };
      return [...prev, newGroup];
    });
  };

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

  const createGroupAndAdd = (groupId: string, item: ListItem) => {
    setNestedFavorites((prev) => {
      const idx = prev.findIndex((g) => g.title === groupId);
      if (idx === -1) {
        return [
          ...prev,
          { id: `fav-${groupId}`, title: groupId, subItems: [item] },
        ];
      }
      const group = prev[idx];
      const exists = group.subItems.some((s) => s.id === item.id);
      if (exists) return prev;
      const updated = [...prev];
      updated[idx] = { ...group, subItems: [...group.subItems, item] };
      return updated;
    });
  };

  const deleteFavoriteGroup = (groupId: string) => {
    setNestedFavorites((prev) => prev.filter((g) => g.title !== groupId));
  };

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

  const handleDeleteNestedFavorite = (id: string) => {
    setNestedFavorites((prev) => prev.filter((item) => item.id !== id));
  };

  const handleContractRecordsClick = () => {
    console.log("영업자 계약기록 버튼 클릭됨");
  };

  return {
    // state
    nestedFavorites,
    siteReservations, // 임시핀(예약 전) — 서버 소스
    scheduledReservations, // 내 예약 목록 — 서버 소스
    pendingReservation,
    reservationOrderMap,
    loading,
    err,

    // setters
    setNestedFavorites,
    setSiteReservations,
    setScheduledReservations, // 필요 시 외부에서 직접 주입
    setScheduledItems, // (낙관적 업데이트용)

    // getters
    getReservationOrder,

    // actions - 예약(임시핀/예약)
    loadSiteReservations, // GET /survey-reservations/before
    refetchScheduled, // GET /survey-reservations/scheduled
    createVisitPlanAt,
    deleteVisitPlan,
    reserveVisitPlan,
    moveVisitPlan,

    // 하위 호환(기존 이름 유지)
    handleAddSiteReservation,
    handleDeleteSiteReservation,

    // actions - 즐겨찾기 그룹
    ensureFavoriteGroup,
    addFavoriteToGroup,
    createGroupAndAdd,
    deleteFavoriteGroup,
    handleDeleteNestedFavorite,
    handleDeleteSubFavorite,

    // pending flags
    setPendingReservation,
    clearPendingReservation,

    // misc
    handleContractRecordsClick,
  };
}

/* 초기 하드코딩 데이터 (즐겨찾기) */
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
