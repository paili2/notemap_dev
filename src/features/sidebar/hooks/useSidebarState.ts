"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  FavorateListItem,
  ListItem,
  PendingReservation,
} from "../types/sidebar";
import { api } from "@/shared/api/api";
import { createPinDraft } from "@/shared/api/pins";

const LS_KEY = "sidebar:favGroups";
/** 서버를 소스로 쓰되, 로컬 캐시는 보조용으로만 유지 */
const LS_KEY_SITE = "sidebar:siteReservations"; // 임시핀(답사예정) 캐시
const LS_KEY_SITE_SCHEDULED = "sidebar:siteReservations:scheduled"; // ✅ 내 예약 목록 캐시

/* 유틸 */
const makePosKey = (lat: number, lng: number) =>
  `${lat.toFixed(6)},${lng.toFixed(6)}`;

// 서버 예약 응답 → 사이드바 ListItem 변환
const mapReservationToListItem = (r: any): ListItem => {
  const lat = Number(r?.lat);
  const lng = Number(r?.lng);
  const created = String(r?.createdAt ?? new Date().toISOString());
  const title = String(r?.addressLine ?? "");
  const reserved = String(r?.reservedDate ?? ""); // "YYYY-MM-DD"

  return {
    id: String(r?.id ?? crypto.randomUUID()),
    title,
    dateISO: reserved || created.slice(0, 10), // ✅ 예약일 우선
    createdAt: created,
    posKey:
      Number.isFinite(lat) && Number.isFinite(lng)
        ? `${lat.toFixed(6)},${lng.toFixed(6)}`
        : undefined,
  };
};

export function useSidebarState() {
  /* 1) 즐겨찾기: 기존 로컬스토리지 유지 */
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

  /* 2) 답사예정(임시핀) 목록: 최초엔 로컬 캐시 → 서버 동기화(현재는 비활성/404 무시) */
  const [siteReservations, setSiteReservations] = useState<ListItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LS_KEY_SITE);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Partial<ListItem>[];
      return Array.isArray(parsed)
        ? parsed.map((it) => {
            const iso =
              typeof it.dateISO === "string" && it.dateISO.trim() !== ""
                ? it.dateISO
                : typeof it.createdAt === "string"
                ? it.createdAt.slice(0, 10)
                : new Date().toISOString().slice(0, 10);
            return {
              id: String(it.id ?? crypto.randomUUID()),
              title: String(it.title ?? ""),
              dateISO: String(iso), // ✅ 항상 string
              createdAt: it.createdAt ?? new Date().toISOString(),
              posKey: it.posKey ?? undefined,
            };
          })
        : [];
    } catch {
      return [];
    }
  });

  /* 2-1) ✅ 내 답사지예약 목록: 서버 + 로컬 캐시 */
  const [scheduledReservations, setScheduledReservations] = useState<
    ListItem[]
  >(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LS_KEY_SITE_SCHEDULED);
      const parsed = raw ? (JSON.parse(raw) as Partial<ListItem>[]) : [];
      return Array.isArray(parsed)
        ? parsed.map((it) => ({
            id: String(it.id ?? crypto.randomUUID()),
            title: String(it.title ?? ""),
            dateISO:
              typeof it.dateISO === "string" && it.dateISO.trim() !== ""
                ? it.dateISO
                : (it.createdAt ?? new Date().toISOString()).slice(0, 10),
            createdAt: it.createdAt ?? new Date().toISOString(),
            posKey: it.posKey ?? undefined,
          }))
        : [];
    } catch {
      return [];
    }
  });

  /* 3) pending draft (컨텍스트 메뉴 → 사이드바로 넘기는 임시 플래그) */
  const [pendingReservation, setPendingReservation] =
    useState<PendingReservation | null>(null);
  const clearPendingReservation = useCallback(
    () => setPendingReservation(null),
    []
  );

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* 서버 동기화: 임시핀 목록 로드 (현재 백엔드에 GET /pin-drafts 없음 → no-op) */
  const loadSiteReservations = useCallback(async () => {
    // 백엔드 목록 API 준비 전까지 로컬 캐시만 사용
    return;
    // 나중에 GET이 생기면 여기 복구
  }, []);

  /* ✅ 서버 동기화: '내 답사지예약' 목록 로드 */
  const loadScheduledReservations = useCallback(async () => {
    try {
      // 실제 요청 경로 확인용 로그
      console.log(
        "📡 요청:",
        api.defaults.baseURL + "/survey-reservations/scheduled"
      );

      const { data } = await api.get("/survey-reservations/scheduled", {
        withCredentials: true, // ✅ 세션 쿠키 포함
      });

      // 서버 응답 구조 보강 (data.data 또는 data 자체)
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      // ✅ 정렬 규칙
      list.sort((a: any, b: any) => {
        const ra = a?.reservedDate || null;
        const rb = b?.reservedDate || null;
        if (!ra && rb) return 1;
        if (ra && !rb) return -1;
        if (ra && rb) {
          if (ra < rb) return -1;
          if (ra > rb) return 1;
        }
        const ca = a?.createdAt || "";
        const cb = b?.createdAt || "";
        return ca > cb ? -1 : ca < cb ? 1 : 0;
      });

      const items: ListItem[] = list.map(mapReservationToListItem);
      setScheduledReservations(items);

      if (typeof window !== "undefined") {
        localStorage.setItem(LS_KEY_SITE_SCHEDULED, JSON.stringify(items));
      }

      console.log(`✅ ${items.length}건 예약 데이터 불러옴`);
    } catch (e: any) {
      console.warn("❌ loadScheduledReservations failed:", e?.message);
      if (e?.response) {
        console.log("status:", e.response.status);
        console.log("url:", e.config?.baseURL + e.config?.url);
        console.log("response data:", e.response.data);
      }
    }
  }, []);

  // 개발모드 StrictMode로 인한 effect 2회 실행 방지
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    loadSiteReservations();
    loadScheduledReservations(); // ✅ 내 예약 목록도 초기 로드
  }, [loadSiteReservations, loadScheduledReservations]);

  /* 로컬 캐시: 즐겨찾기는 계속 저장 */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(nestedFavorites));
    } catch {}
  }, [nestedFavorites]);

  /* 예약 순서 배지용 맵(id -> 1-based order) : 임시핀용 */
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

  /* 생성: 현재 좌표 기준 임시핀 생성 → 목록에 prepend (새 스펙 사용) */
  const createVisitPlanAt = useCallback(
    async (args: {
      lat: number;
      lng: number;
      roadAddress?: string | null;
      jibunAddress?: string | null;
      title?: string | null;
      memo?: string | null; // 사용 안 함(보존만)
    }) => {
      setLoading(true);
      setErr(null);
      try {
        // 한 줄 주소: title > 도로명 > 지번 > "lat,lng"
        const addressLine = (args.title?.trim() ||
          args.roadAddress?.trim() ||
          args.jibunAddress?.trim() ||
          `${args.lat.toFixed(6)}, ${args.lng.toFixed(6)}`)!;

        // 새 스펙: { lat, lng, addressLine } → { data: { id } }
        const { id } = await createPinDraft({
          lat: args.lat,
          lng: args.lng,
          addressLine,
        });

        // 화면 표시에 필요한 최소 정보는 우리가 조합
        const now = new Date().toISOString();
        const item: ListItem = {
          id: String(id),
          title: addressLine || "임시 핀",
          dateISO: now.slice(0, 10),
          createdAt: now,
          posKey: makePosKey(args.lat, args.lng),
        };

        setSiteReservations((prev) => {
          const next = [item, ...prev];
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(LS_KEY_SITE, JSON.stringify(next));
            } catch {}
          }
          return next;
        });
        return item;
      } catch (e: any) {
        setErr(e?.message ?? "failed to create draft");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* 삭제: 서버 삭제 후 목록 갱신 (엔드포인트 있으면 사용) */
  const deleteVisitPlan = useCallback(async (id: string) => {
    setLoading(true);
    setErr(null);
    try {
      // 서버에 삭제 엔드포인트가 있다면 주석 해제
      // await api.delete(`/pin-drafts/${id}`);

      // 즉시반응을 위해 낙관적 업데이트
      setSiteReservations((prev) => {
        const next = prev.filter((x) => x.id !== id);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(LS_KEY_SITE, JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    } catch (e: any) {
      setErr(e?.message ?? "failed to delete");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const reserveVisitPlan = useCallback(
    async (
      draftId: string | number,
      opts?: { reservedDate?: string; dateISO?: string }
    ) => {
      setLoading(true);
      setErr(null);

      // YYYY-MM-DD 기본값: 오늘
      const today = new Date().toISOString().slice(0, 10);
      const idNum = Number(draftId);
      const reservedDate =
        opts?.reservedDate && /^\d{4}-\d{2}-\d{2}$/.test(opts.reservedDate)
          ? opts.reservedDate
          : opts?.dateISO && /^\d{4}-\d{2}-\d{2}$/.test(opts.dateISO)
          ? opts.dateISO
          : today;

      // ✅ 서버 요구 필드만!
      const body = {
        pinDraftId: Number.isFinite(idNum) ? idNum : draftId,
        reservedDate,
      };

      try {
        const { data } = await api.post("survey-reservations", body, {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        });

        // 임시핀 제거 → 목록 리로드
        setSiteReservations((prev) => {
          const next = prev.filter((x) => String(x.id) !== String(draftId));
          if (typeof window !== "undefined") {
            localStorage.setItem(LS_KEY_SITE, JSON.stringify(next));
          }
          return next;
        });

        await loadScheduledReservations();
        return data;
      } catch (err: any) {
        const r = err?.response?.data;
        console.groupCollapsed(
          "%c[SR][CREATE] 400 디버그",
          "color:#c00;font-weight:bold"
        );
        console.log("▶ URL :", api.defaults.baseURL + "/survey-reservations");
        console.log("▶ REQ :", body);
        console.log("▶ STATUS:", err?.response?.status);
        console.log("▶ RESP  :", r);
        if (Array.isArray(r?.messages))
          console.log("▶ RESP.messages:", r.messages);
        console.groupEnd();

        const msg =
          (Array.isArray(r?.messages) && r.messages[0]) ||
          r?.message ||
          err?.message ||
          "예약 생성 실패";
        setErr(String(msg));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadScheduledReservations, setSiteReservations]
  );

  /* 정렬(로컬): 필요시 sortOrder PATCH로 대체 가능 */
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

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LS_KEY_SITE, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, []);

  /* 🔁 하위 호환: 예전 시그니처 유지 (로컬만 추가하던 함수) */
  const handleAddSiteReservation = useCallback((item: ListItem) => {
    setSiteReservations((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev;
      const withCreated: ListItem = {
        ...item,
        createdAt: item.createdAt ?? new Date().toISOString(),
      };
      const next = [withCreated, ...prev].slice(0, 200);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LS_KEY_SITE, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, []);

  /* 기존 삭제 핸들러 유지(이제 내부에서 deleteVisitPlan 호출 권장) */
  const handleDeleteSiteReservation = useCallback(
    (id: string) => {
      void deleteVisitPlan(id);
    },
    [deleteVisitPlan]
  );

  /* 즐겨찾기: 그룹/항목 CRUD */
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
    siteReservations, // 임시핀(답사예정)
    scheduledReservations, // ✅ 내 예약 목록
    pendingReservation,
    reservationOrderMap,
    loading,
    err,

    // setters (필요 시)
    setNestedFavorites,
    setSiteReservations,

    // getters
    getReservationOrder,

    // actions - 예약(임시핀/예약)
    loadSiteReservations,
    loadScheduledReservations, // ✅ 서버에서 내 예약 재로딩
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
