"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import {
  usePanToWithOffset,
  useResolveAddress,
} from "@/features/map/hooks/useKakaoTools";
import { useViewportPost } from "@/features/map/hooks/useViewportPost";
import { useRunSearch } from "../../hooks/useRunSearch";
import { LatLng } from "@/lib/geo/types";
import { applyPatchToItem } from "@/features/properties/lib/view/applyPatchToItem";
import { toViewDetails } from "@/features/properties/lib/view/toViewDetails";
import type { ViewSource } from "@/features/properties/lib/view/types";
import { CreatePayload } from "@/features/properties/types/property-dto";
import { buildEditPatchWithMedia } from "@/features/properties/components/PropertyEditModal/lib/buildEditPatch";
import { PoiKind } from "../../components/overlays/poiOverlays";
// 서버 핀 훅
import { usePinsMap } from "@/features/map/hooks/usePinsMap";
// 좌표 검증 로그
import { assertNoTruncate } from "@/shared/debug/assertCoords";

const DRAFT_PIN_STORAGE_KEY = "maphome:draftPin";

/** 부동소수점 비교 오차 보정 */
const sameCoord = (a?: LatLng | null, b?: LatLng | null, eps = 1e-7) =>
  !!a && !!b && Math.abs(a.lat - b.lat) < eps && Math.abs(a.lng - b.lng) < eps;

/** 뷰포트 타입 */
type Viewport = {
  leftTop: LatLng;
  leftBottom: LatLng;
  rightTop: LatLng;
  rightBottom: LatLng;
  zoomLevel: number;
};

/** 얕은 뷰포트 비교 */
const sameViewport = (a?: Viewport | null, b?: Viewport | null, eps = 1e-7) => {
  if (!a || !b) return false;
  const eq = (p: LatLng, q: LatLng) =>
    Math.abs(p.lat - q.lat) < eps && Math.abs(p.lng - q.lng) < eps;
  return (
    a.zoomLevel === b.zoomLevel &&
    eq(a.leftTop, b.leftTop) &&
    eq(a.leftBottom, b.leftBottom) &&
    eq(a.rightTop, b.rightTop) &&
    eq(a.rightBottom, b.rightBottom)
  );
};

/** Kakao LatLng 객체/POJO 모두에서 원본 숫자를 뽑아내는 정규화 */
function normalizeLL(v: any): LatLng {
  if (v && typeof v.getLat === "function" && typeof v.getLng === "function") {
    return { lat: v.getLat(), lng: v.getLng() };
  }
  return { lat: Number(v?.lat), lng: Number(v?.lng) };
}

/** ─────────────────────────────────────────────────────────────
 *  PropertyItem -> ViewSource (얇은 어댑터)
 *  - 필수 공통 메타만 매핑, 이미지 등은 p.view가 있으면 그대로 통과
 *  - address는 address, addressLine 둘 중 있는 값 사용
 * ───────────────────────────────────────────────────────────── */
function toViewSourceFromPropertyItem(p: PropertyItem): ViewSource {
  const anyP = p as any;
  return {
    title: p.title,
    address:
      (anyP.address && String(anyP.address)) ||
      (anyP.addressLine && String(anyP.addressLine)) ||
      undefined,
    status: anyP.status ?? null,
    dealStatus: anyP.dealStatus ?? null,
    type: anyP.type ?? null,
    priceText: anyP.priceText ?? null,
    // 서버에서 내려보내 저장해둔 view 블록이 있다면 그대로 활용
    view: anyP.view ?? undefined,
  };
}

export function useMapHomeState() {
  // 지도 관련 상태
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [kakaoSDK, setKakaoSDK] = useState<any>(null);

  // 라벨 숨김 상태
  const [hideLabelForId, setHideLabelForId] = useState<string | null>(null);
  const onChangeHideLabelForId = useCallback((id: string | null) => {
    setHideLabelForId(id);
  }, []);

  // UI 모달 & 메뉴 상태
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [menuRoadAddr, setMenuRoadAddr] = useState<string | null>(null);
  const [menuJibunAddr, setMenuJibunAddr] = useState<string | null>(null);

  const [menuAnchor, setMenuAnchor] = useState<LatLng | null>(null);
  const [menuTargetId, setMenuTargetId] = useState<string | null>(null);

  // Fit once
  const [fitAllOnce, setFitAllOnce] = useState(true);

  // Modals
  const [prefillAddress, setPrefillAddress] = useState<string | undefined>();

  // ✅ 생성용 드래프트 핀만 로컬 복원 (임시 UI용)
  const [draftPin, _setDraftPin] = useState<LatLng | null>(null);
  const restoredDraftPinRef = useRef<LatLng | null>(null);

  // menuAnchor 세팅 시 **원본 숫자 그대로** 넣고 즉시 검증
  const setRawMenuAnchor = useCallback((ll: LatLng | any) => {
    const p = normalizeLL(ll);
    assertNoTruncate("useMapHomeState:setMenuAnchor", p.lat, p.lng);
    setMenuAnchor(p);
  }, []);

  // draftPin 세팅도 동일
  const setDraftPinSafe = useCallback((pin: LatLng | null) => {
    if (pin) {
      const p = normalizeLL(pin);
      assertNoTruncate("useMapHomeState:setDraftPin", p.lat, p.lng);
      _setDraftPin(p);
      try {
        localStorage.setItem(DRAFT_PIN_STORAGE_KEY, JSON.stringify(p));
      } catch {}
    } else {
      _setDraftPin(null);
      try {
        localStorage.removeItem(DRAFT_PIN_STORAGE_KEY);
      } catch {}
    }
  }, []);

  // Toggles
  const [useDistrict, setUseDistrict] = useState<boolean>(false);
  const [useSidebar, setUseSidebar] = useState<boolean>(false);

  // ⭐ POI 선택 상태
  const [poiKinds, setPoiKinds] = useState<PoiKind[]>([]);

  const [items, setItems] = useState<PropertyItem[]>([]);
  const [addFav, setAddFav] = useState<boolean>(false);

  // Search / filter
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [filter, setFilter] = useState<"all" | "pins" | "units" | string>(
    "all"
  );
  const [q, setQ] = useState("");

  // === UI prop 호환용 alias들 ===
  const onChangeQ = useCallback((v: string) => setQ(v), []);
  const onChangeFilter = useCallback((v: any) => setFilter(v), []);
  const onChangePoiKinds = useCallback(
    (next: PoiKind[]) => setPoiKinds(next),
    []
  );

  // ─ Viewport post (기존 훅 래핑해서 force 옵션 추가)
  const postViewport = useViewportPost();
  const lastViewportRef = useRef<Viewport | null>(null);

  // ✅ 서버 핀 훅: /pins/map
  const { points, drafts, setBounds, refetch } = usePinsMap();

  // 🔥 매물 등록 직후 드래프트 마커를 즉시 숨기기 위한 로컬 상태
  const [hiddenDraftIds, setHiddenDraftIds] = useState<Set<string>>(new Set());
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

  const sendViewportQuery = useCallback(
    (vp: Viewport, opts?: { force?: boolean }) => {
      if (!opts?.force && sameViewport(vp, lastViewportRef.current)) return;
      lastViewportRef.current = vp;

      (postViewport as any)?.sendViewportQuery
        ? (postViewport as any).sendViewportQuery(vp)
        : (postViewport as any)(vp);

      // 카카오 idle 트리거
      if (kakaoSDK && mapInstance) {
        kakaoSDK.maps.event.trigger(mapInstance, "idle");
        requestAnimationFrame(() =>
          kakaoSDK.maps.event.trigger(mapInstance, "idle")
        );
      }

      // ✅ /pins/map 훅에도 bounds 전달 (남서, 북동)
      try {
        const sw = vp.leftBottom;
        const ne = vp.rightTop;
        setBounds({
          swLat: sw.lat,
          swLng: sw.lng,
          neLat: ne.lat,
          neLng: ne.lng,
        });
      } catch {}
    },
    [postViewport, kakaoSDK, mapInstance, setBounds]
  );

  const lastViewport = lastViewportRef.current;

  // ▸ 초기 복원 (draftPin) — 지도 열릴 때만
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_PIN_STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (v && typeof v.lat === "number" && typeof v.lng === "number") {
          restoredDraftPinRef.current = v;
          setDraftPinSafe(v); // ✅ 검증 경유
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived
  const filtered = useMemo(() => {
    return items.filter((p) => {
      const qq = query.trim().toLowerCase();
      const matchQ =
        !qq ||
        p.title.toLowerCase().includes(qq) ||
        (p.address?.toLowerCase().includes(qq) ?? false);
      const matchType = type === "all" || (p as any).type === type;
      const matchStatus = status === "all" || (p as any).status === status;
      return matchQ && matchType && matchStatus;
    });
  }, [items, query, type, status]);

  // Selection
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => items.find((x) => x.id === selectedId) ?? null,
    [items, selectedId]
  );

  // Tools
  const resolveAddress = useResolveAddress(kakaoSDK);
  const panToWithOffset = usePanToWithOffset(kakaoSDK, mapInstance);

  const openMenuAt = useCallback(
    async (
      position: LatLng,
      propertyId: "__draft__" | string,
      opts?: { roadAddress?: string | null; jibunAddress?: string | null }
    ) => {
      const p = normalizeLL(position);
      const isDraft = propertyId === "__draft__";
      setSelectedId(isDraft ? null : String(propertyId));
      setMenuTargetId(isDraft ? "__draft__" : String(propertyId));
      setDraftPinSafe(isDraft ? p : null);
      setFitAllOnce(false);

      onChangeHideLabelForId("__draft__");
      onChangeHideLabelForId(isDraft ? "__draft__" : String(propertyId));

      setRawMenuAnchor(p);

      if (opts?.roadAddress || opts?.jibunAddress) {
        setMenuRoadAddr(opts.roadAddress ?? null);
        setMenuJibunAddr(opts.jibunAddress ?? null);
      } else {
        const { road, jibun } = await resolveAddress(p);
        setMenuRoadAddr(road ?? null);
        setMenuJibunAddr(jibun ?? null);
      }

      panToWithOffset(p, 180);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });
    },
    [
      resolveAddress,
      panToWithOffset,
      setDraftPinSafe,
      onChangeHideLabelForId,
      setRawMenuAnchor,
    ]
  );

  const geocodeAddress = useCallback(
    async (q: string): Promise<LatLng | null> => {
      if (!kakaoSDK?.maps?.services || !q?.trim()) return null;
      const geocoder = new kakaoSDK.maps.services.Geocoder();
      return await new Promise<LatLng | null>((resolve) => {
        geocoder.addressSearch(q.trim(), (result: any[], status: string) => {
          if (status !== kakaoSDK.maps.services.Status.OK || !result?.length) {
            resolve(null);
            return;
          }
          const { x, y } = result[0];
          resolve({ lat: Number(y), lng: Number(x) });
        });
      });
    },
    [kakaoSDK]
  );

  // 기존 핀 말주머니 열기
  const openMenuForExistingPin = useCallback(
    async (p: PropertyItem) => {
      const pos = normalizeLL(p.position);
      setDraftPinSafe(null);
      const sid = String(p.id);
      setSelectedId(sid);
      setMenuTargetId(sid);
      setRawMenuAnchor(pos);
      setFitAllOnce(false);
      onChangeHideLabelForId(sid);

      panToWithOffset(pos, 180);

      if ((p as any).address) {
        setMenuRoadAddr((p as any).address);
        setMenuJibunAddr(null);
      } else {
        const { road, jibun } = await resolveAddress(pos);
        setMenuRoadAddr(road ?? null);
        setMenuJibunAddr(jibun ?? null);
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });
    },
    [
      resolveAddress,
      panToWithOffset,
      setDraftPinSafe,
      onChangeHideLabelForId,
      setRawMenuAnchor,
    ]
  );

  // 검색 훅 원본
  const runSearchRaw = useRunSearch({
    kakaoSDK,
    mapInstance,
    items,
    onMatchedPin: (p: PropertyItem) => openMenuForExistingPin(p),
    onNoMatch: (coords: LatLng) => openMenuAt(coords, "__draft__"),
    panToWithOffset,
    poiKinds,
  } as any);

  const runSearch = useCallback(
    (keyword?: string) => runSearchRaw(keyword ?? q),
    [runSearchRaw, q]
  );

  const handleSearchSubmit = useCallback(
    async (kw?: string) => {
      const keyword = kw ?? q;
      await runSearch(keyword);
      const pos = await geocodeAddress(keyword);
      if (pos) {
        await openMenuAt(pos, "__draft__");
      }
    },
    [q, runSearch, geocodeAddress, openMenuAt]
  );

  const onSubmitSearch = useCallback(
    (v?: string) => handleSearchSubmit(v),
    [handleSearchSubmit]
  );

  // ▸ draftPin 세팅 시(생성용) — 말주머니 처리
  useEffect(() => {
    if (!draftPin) return;

    setSelectedId(null);
    setMenuTargetId("__draft__");
    setRawMenuAnchor(draftPin);
    setFitAllOnce(false);

    (async () => {
      const { road, jibun } = await resolveAddress(draftPin);
      setMenuRoadAddr(road);
      setMenuJibunAddr(jibun);
    })();

    if (!sameCoord(draftPin, restoredDraftPinRef.current)) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });
    } else {
      setMenuOpen(false);
    }
  }, [draftPin, resolveAddress, onChangeHideLabelForId, setRawMenuAnchor]);

  // 지도 이동(idle 트리거)
  useEffect(() => {
    if (!draftPin || !kakaoSDK || !mapInstance) return;
    panToWithOffset(draftPin, 180);
    kakaoSDK.maps.event.trigger(mapInstance, "idle");
    requestAnimationFrame(() =>
      kakaoSDK.maps.event.trigger(mapInstance, "idle")
    );
  }, [draftPin, kakaoSDK, mapInstance, panToWithOffset]);

  // 마커 클릭
  const handleMarkerClick = useCallback(
    async (id: string | number) => {
      const sid = String(id);
      const item = items.find((p) => p.id === sid);
      if (!item) return;

      const pos = normalizeLL(item.position);

      setSelectedId(sid);
      setMenuTargetId(sid);
      setDraftPinSafe(null);
      setFitAllOnce(false);
      setRawMenuAnchor(pos);
      onChangeHideLabelForId(sid);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });

      panToWithOffset(pos, 180);
      const { road, jibun } = await resolveAddress(pos);
      setMenuRoadAddr(road ?? null);
      setMenuJibunAddr(jibun ?? null);
    },
    [
      items,
      resolveAddress,
      panToWithOffset,
      setDraftPinSafe,
      onChangeHideLabelForId,
      setRawMenuAnchor,
    ]
  );

  // Map ready
  const onMapReady = useCallback(
    ({ kakao, map }: any) => {
      setKakaoSDK(kakao);
      setMapInstance(map);
      requestAnimationFrame(() => setFitAllOnce(false));
      setTimeout(() => {
        map.relayout?.();
        kakao.maps.event.trigger(map, "resize");
        kakao.maps.event.trigger(map, "idle");
      }, 0);

      // ✅ 초기 bounds 설정 → /pins/map 최초 로드
      try {
        const b = map.getBounds();
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        setBounds({
          swLat: sw.getLat(),
          swLng: sw.getLng(),
          neLat: ne.getLat(),
          neLng: ne.getLng(),
        });
        refetch();
      } catch {}
    },
    [refetch, setBounds]
  );

  // View modal
  const onSaveViewPatch = useCallback(
    async (patch: Partial<PropertyViewDetails>) => {
      setItems((prev) =>
        prev.map((p) => (p.id === selectedId ? applyPatchToItem(p, patch) : p))
      );
    },
    [selectedId, setItems]
  );

  const onDeleteFromView = useCallback(async () => {
    setItems((prev) => prev.filter((p) => p.id !== selectedId));
    setViewOpen(false);
    setSelectedId(null);
  }, [selectedId, setItems]);

  const onSubmitEdit = useCallback(
    async (payload: CreatePayload) => {
      if (!selectedId) return;
      const patch = await buildEditPatchWithMedia(payload, String(selectedId));
      setItems((prev) =>
        prev.map((p) =>
          String(p.id) === String(selectedId)
            ? applyPatchToItem(p as any, patch as any)
            : p
        )
      );
      setEditOpen(false);
    },
    [selectedId, setItems, setEditOpen]
  );

  // 메뉴 닫기
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuTargetId(null);
    setMenuAnchor(null);
    setMenuRoadAddr(null);
    setMenuJibunAddr(null);
    onChangeHideLabelForId(null);

    if (!menuTargetId && draftPin) {
      setDraftPinSafe(null);
    }
  }, [menuTargetId, draftPin, setDraftPinSafe, onChangeHideLabelForId]);

  const openViewFromMenu = useCallback(
    (id: string) => {
      setSelectedId(id);
      closeMenu();
      setViewOpen(true);
    },
    [closeMenu]
  );

  const openCreateFromMenu = useCallback(() => {
    closeMenu();
    setPrefillAddress(menuRoadAddr ?? menuJibunAddr ?? undefined);
    setCreateOpen(true);
  }, [menuRoadAddr, menuJibunAddr, closeMenu]);

  // === 메뉴/액션 alias
  const onCloseMenu = closeMenu;
  const onViewFromMenu = useCallback(
    (id: string | number) => openViewFromMenu(String(id)),
    [openViewFromMenu]
  );
  const onCreateFromMenu = openCreateFromMenu;

  // ✅ 메뉴에서 “답사예정” 선택 시: 로컬 추가 제거, UI만 정리
  const onPlanFromMenu = useCallback(
    (pos: LatLng) => {
      const p = normalizeLL(pos);
      if (draftPin && sameCoord(draftPin, p)) {
        setDraftPinSafe(null);
      }
      closeMenu();
    },
    [closeMenu, draftPin, setDraftPinSafe]
  );

  // ✅ 마커 목록: 서버 points + drafts + 생성용 draftPin
  const markers = useMemo(() => {
    const pointMarkers = (points ?? []).map((p) => ({
      id: String(p.id),
      position: { lat: p.lat, lng: p.lng },
      kind: "1room" as const,
      title: p.badge ?? "",
      isFav: false,
    }));

    const draftMarkers = (drafts ?? [])
      .filter((d) => !hiddenDraftIds.has(String(d.id)))
      .map((d) => ({
        id: `__visit__${d.id}`,
        position: { lat: d.lat, lng: d.lng },
        kind: "question" as const,
        isFav: false,
      }));

    const draftPinMarker = draftPin
      ? [
          {
            id: "__draft__",
            position: draftPin,
            kind: "question" as const,
            isFav: false,
          },
        ]
      : [];

    return [...pointMarkers, ...draftMarkers, ...draftPinMarker];
  }, [points, drafts, draftPin, hiddenDraftIds]);

  // Create host
  const createHostHandlers = useMemo(
    () => ({
      onClose: () => {
        setCreateOpen(false);
        setDraftPinSafe(null);
        setPrefillAddress(undefined);
        setMenuOpen(false);
      },
      appendItem: (item: PropertyItem) => setItems((prev) => [item, ...prev]),
      selectAndOpenView: (id: string | number) => {
        const sid = String(id);
        setSelectedId(sid);
        setViewOpen(true);
        setMenuTargetId(null);
      },
      resetAfterCreate: () => {
        setDraftPinSafe(null);
        setPrefillAddress(undefined);
        setCreateOpen(false);
      },
      onAfterCreate: (res: { matchedDraftId?: string | number | null }) => {
        if (res?.matchedDraftId != null) {
          hideDraft(res.matchedDraftId);
        }
        refetch();
      },
    }),
    [setItems, setDraftPinSafe, hideDraft, refetch]
  );

  const editHostHandlers = useMemo(
    () => ({
      onClose: () => setEditOpen(false),
      updateItems: setItems,
      onSubmit: onSubmitEdit,
    }),
    [setItems, onSubmitEdit]
  );

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
    setDraftPinSafe(null);
    setPrefillAddress(undefined);
    setMenuOpen(false);
  }, [setDraftPinSafe]);

  /* ─────────────────────────────────────────────────────────────
     ⭐ POI 변경 시 즉시 반영
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (lastViewportRef.current) {
      sendViewportQuery(lastViewportRef.current, { force: true });
      refetch();
    } else {
      runSearch();
      if (kakaoSDK && mapInstance) {
        kakaoSDK.maps.event.trigger(mapInstance, "idle");
        requestAnimationFrame(() =>
          kakaoSDK.maps.event.trigger(mapInstance, "idle")
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poiKinds]);

  /** ───────────── 추가 파생/alias: MapHomeUI 호환 ───────────── */

  const onViewportChange = useCallback(
    (vp: any, opts?: { force?: boolean }) => sendViewportQuery(vp, opts),
    [sendViewportQuery]
  );

  // 🔧 핵심 수정: PropertyItem -> ViewSource 얇은 어댑터를 거쳐 toViewDetails 호출
  const selectedViewItem = useMemo(
    () =>
      selected ? toViewDetails(toViewSourceFromPropertyItem(selected)) : null,
    [selected]
  );

  const selectedPos = useMemo<LatLng | null>(() => {
    if (menuAnchor) return menuAnchor;
    if (draftPin) return draftPin;
    if (selected) return normalizeLL((selected as any).position);
    return null;
  }, [menuAnchor, draftPin, selected]);

  const closeView = useCallback(() => setViewOpen(false), []);
  const closeEdit = useCallback(() => setEditOpen(false), []);
  const onEditFromView = useCallback(() => {
    setViewOpen(false);
    setEditOpen(true);
  }, []);

  const onOpenMenu = useCallback(
    (p: {
      position: { lat: number; lng: number } | any;
      propertyId?: "__draft__" | string | number;
      propertyTitle?: string | null;
      pin?: { kind?: string; isFav?: boolean };
    }) => {
      openMenuAt(
        normalizeLL(p.position),
        (p.propertyId ?? "__draft__") as "__draft__" | string
      );
    },
    [openMenuAt]
  );

  const onMarkerClick = handleMarkerClick;

  return {
    // sdk/map
    kakaoSDK,
    mapInstance,
    onMapReady,
    sendViewportQuery,
    lastViewport,

    // data
    items,
    setItems,
    filtered,

    // markers
    fitAllOnce,
    setFitAllOnce,
    markers,

    // selection
    selectedId,
    setSelectedId,
    selected,

    // search/filter
    q,
    setQ,
    filter,
    setFilter,
    runSearch,
    handleSearchSubmit,
    onChangeQ,
    onChangeFilter,
    onSubmitSearch,

    // toggles
    useSidebar,
    setUseSidebar,
    useDistrict,
    setUseDistrict,

    // ⭐ POI
    poiKinds,
    setPoiKinds,
    onChangePoiKinds,

    // menu
    menuOpen,
    menuAnchor,
    menuTargetId,
    menuRoadAddr,
    menuJibunAddr,
    closeMenu,
    openViewFromMenu,
    openCreateFromMenu,
    onCloseMenu,
    onViewFromMenu,
    onCreateFromMenu,
    onOpenMenu,
    onPlanFromMenu,

    // draft
    draftPin,
    setDraftPin: setDraftPinSafe,

    // marker click / viewport
    handleMarkerClick,
    onMarkerClick,
    onViewportChange,

    // modals
    addFav,
    viewOpen,
    setViewOpen,
    editOpen,
    setEditOpen,
    createOpen,
    setCreateOpen,
    prefillAddress,
    closeCreate,
    closeView,
    closeEdit,
    onEditFromView,

    // view handlers
    onSaveViewPatch,
    onDeleteFromView,
    selectedViewItem,

    // host bridges
    createHostHandlers,
    editHostHandlers,

    // misc
    selectedPos,
    hideLabelForId,
    onChangeHideLabelForId,

    // 숨김 제어 API
    hideDraft,
    clearHiddenDraft,
  } as const;
}
