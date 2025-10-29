"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import type {
  FavorateListItem,
  ListItem,
  PendingReservation,
} from "../types/sidebar";
import { createPinDraft } from "@/shared/api/pins";
import {
  getFavoriteGroups,
  upsertFavoriteItem,
  deleteFavoriteItem,
  updateGroupTitle,
  reorderGroups,
  type FavoriteGroup,
  type FavoriteItem,
} from "@/features/favorites/api/favorites";
import { useToast } from "@/hooks/use-toast";
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
  // 1) 즐겨찾기: 백엔드 API 기반
  const [nestedFavorites, setNestedFavorites] = useState<FavorateListItem[]>(
    []
  );
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const { toast } = useToast();
  const pathname = usePathname();

  // 즐겨찾기 그룹 로드
  const loadFavorites = useCallback(async () => {
    try {
      setFavoritesLoading(true);
      const groups = await getFavoriteGroups(true); // 아이템 포함해서 로드

      // 백엔드 데이터를 프론트엔드 형식으로 변환
      const convertedGroups: FavorateListItem[] = groups.map((group) => ({
        id: group.id,
        title: group.title,
        subItems: (group.items || []).map((item) => ({
          id: item.itemId,
          title: `Pin ${item.pinId}`, // 실제로는 핀 정보를 가져와야 함
        })),
      }));

      setNestedFavorites(convertedGroups);
    } catch (error: any) {
      console.error("즐겨찾기 로드 실패:", error);
      toast({
        title: "즐겨찾기 로드 실패",
        description: "즐겨찾기 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setFavoritesLoading(false);
    }
  }, [toast]);

  // 컴포넌트 마운트 시 즐겨찾기 로드 (계정 생성 페이지 제외)
  useEffect(() => {
    // 계정 생성 페이지에서는 즐겨찾기를 불러오지 않음
    if (pathname?.includes("/admin/accounts/create")) {
      setFavoritesLoading(false);
      return;
    }
    loadFavorites();
  }, [loadFavorites, pathname]);

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
          // ⛑ 표시문자열에서도 toFixed 제거 (혹시라도 역파싱 방지)
          `${args.lat}, ${args.lng}`;

        await createPinDraft({
          lat: args.lat, // ✅ 원본 숫자 그대로
          lng: args.lng, // ✅ 원본 숫자 그대로
          addressLine,
        });

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

  // 즐겨찾기 CRUD - 백엔드 API 연동
  const ensureFavoriteGroup = useCallback(
    async (groupId: string, _label?: string) => {
      // 그룹이 이미 존재하는지 확인
      const existingGroup = nestedFavorites.find((g) => g.title === groupId);
      if (existingGroup) return;

      // 새 그룹 생성 (실제로는 upsertFavoriteItem에서 자동 생성됨)
      try {
        await loadFavorites(); // 그룹 목록 새로고침
      } catch (error: any) {
        console.error("즐겨찾기 그룹 확인 실패:", error);
      }
    },
    [nestedFavorites, loadFavorites]
  );

  const addFavoriteToGroup = useCallback(
    async (groupId: string, item: ListItem) => {
      try {
        // pinId 추출 (ListItem에서 pinId를 가져와야 함)
        const pinId = item.id; // 임시로 id를 pinId로 사용

        await upsertFavoriteItem({
          groupId: groupId,
          pinId: pinId,
        });

        // 성공 시 로컬 상태 업데이트
        await loadFavorites();

        toast({
          title: "즐겨찾기 추가 완료",
          description: `${item.title}이(가) 즐겨찾기에 추가되었습니다.`,
        });
      } catch (error: any) {
        console.error("즐겨찾기 추가 실패:", error);
        toast({
          title: "즐겨찾기 추가 실패",
          description: "즐겨찾기 추가 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    },
    [loadFavorites, toast]
  );

  const createGroupAndAdd = useCallback(
    async (groupId: string, item: ListItem) => {
      try {
        // pinId 추출
        const pinId = item.id; // 임시로 id를 pinId로 사용

        await upsertFavoriteItem({
          title: groupId, // 새 그룹 생성
          pinId: pinId,
        });

        // 성공 시 로컬 상태 업데이트
        await loadFavorites();

        toast({
          title: "즐겨찾기 그룹 생성 및 추가 완료",
          description: `새 그룹 '${groupId}'에 ${item.title}이(가) 추가되었습니다.`,
        });
      } catch (error: any) {
        console.error("즐겨찾기 그룹 생성 및 추가 실패:", error);
        toast({
          title: "즐겨찾기 그룹 생성 실패",
          description: "즐겨찾기 그룹 생성 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    },
    [loadFavorites, toast]
  );

  const deleteFavoriteGroup = useCallback(async (groupId: string) => {
    // 백엔드에서는 그룹 삭제 API가 없으므로 로컬에서만 처리
    setNestedFavorites((prev) => prev.filter((g) => g.title !== groupId));
  }, []);

  const handleDeleteSubFavorite = useCallback(
    async (parentId: string, subId: string) => {
      try {
        // 그룹 ID 찾기
        const group = nestedFavorites.find((g) => g.id === parentId);
        if (!group) return;

        await deleteFavoriteItem(group.id, subId);

        // 성공 시 로컬 상태 업데이트
        await loadFavorites();

        toast({
          title: "즐겨찾기 삭제 완료",
          description: "즐겨찾기에서 삭제되었습니다.",
        });
      } catch (error: any) {
        console.error("즐겨찾기 삭제 실패:", error);
        toast({
          title: "즐겨찾기 삭제 실패",
          description: "즐겨찾기 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    },
    [nestedFavorites, loadFavorites, toast]
  );

  const handleDeleteNestedFavorite = useCallback(async (id: string) => {
    // 그룹 삭제는 로컬에서만 처리 (백엔드 API 없음)
    setNestedFavorites((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleContractRecordsClick = () => {
    console.log("영업자 계약기록 버튼 클릭됨");
  };

  return {
    // state
    nestedFavorites,
    favoritesLoading,
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
    loadFavorites, // 즐겨찾기 새로고침
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
