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
import { CreatePayload } from "@/features/properties/types/property-dto";
import { buildEditPatchWithMedia } from "@/features/properties/components/PropertyEditModal/lib/buildEditPatch";
import { PoiKind } from "../../components/overlays/poiOverlays";

// ✅ 서버에서 핀을 가져오는 훅
import { usePinsMap } from "@/features/map/hooks/usePinsMap";

const DRAFT_PIN_STORAGE_KEY = "maphome:draftPin";

/** 부동소수점 비교 오차 보정 */
const sameCoord = (a?: LatLng | null, b?: LatLng | null, eps = 1e-7) =>
  !!a && !!b && Math.abs(a.lat - b.lat) < eps && Math.abs(a.lng - b.lng) < eps;

/** 뷰포트 타입(프로젝트 정의와 일치하도록 맞춰 주세요) */
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

  /* ✅ 생성용 드래프트 핀만 로컬 복원 (임시 UI용) */
  const [draftPin, _setDraftPin] = useState<LatLng | null>(null);
  const setDraftPin = useCallback((pin: LatLng | null) => {
    _setDraftPin(pin);
    try {
      if (pin) localStorage.setItem(DRAFT_PIN_STORAGE_KEY, JSON.stringify(pin));
      else localStorage.removeItem(DRAFT_PIN_STORAGE_KEY);
    } catch {}
  }, []);
  const restoredDraftPinRef = useRef<LatLng | null>(null);

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
  const postViewport = useViewportPost(); // 기존 훅
  const lastViewportRef = useRef<Viewport | null>(null);

  // ✅ 서버 핀 훅: /pins/map
  //    points: 실제 핀, drafts: 임시/답사예정
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
          _setDraftPin(v);
          restoredDraftPinRef.current = v;
        }
      }
    } catch {}
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
      const isDraft = propertyId === "__draft__";
      setSelectedId(isDraft ? null : String(propertyId));
      setMenuTargetId(isDraft ? "__draft__" : String(propertyId));
      setDraftPin(isDraft ? position : null);
      setFitAllOnce(false);

      onChangeHideLabelForId("__draft__");
      onChangeHideLabelForId(isDraft ? "__draft__" : String(propertyId));

      setMenuAnchor(position);

      if (opts?.roadAddress || opts?.jibunAddress) {
        setMenuRoadAddr(opts.roadAddress ?? null);
        setMenuJibunAddr(opts.jibunAddress ?? null);
      } else {
        const { road, jibun } = await resolveAddress(position);
        setMenuRoadAddr(road ?? null);
        setMenuJibunAddr(jibun ?? null);
      }

      panToWithOffset(position, 180);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });
    },
    [resolveAddress, panToWithOffset, setDraftPin, onChangeHideLabelForId]
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
      setDraftPin(null);
      const sid = String(p.id);
      setSelectedId(sid);
      setMenuTargetId(sid);
      setMenuAnchor(p.position);
      setFitAllOnce(false);
      onChangeHideLabelForId(sid);

      panToWithOffset(p.position, 180);

      if (p.address) {
        setMenuRoadAddr(p.address);
        setMenuJibunAddr(null);
      } else {
        const { road, jibun } = await resolveAddress(p.position);
        setMenuRoadAddr(road ?? null);
        setMenuJibunAddr(jibun ?? null);
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });
    },
    [resolveAddress, panToWithOffset, setDraftPin, onChangeHideLabelForId]
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

      // 1) 기존 핀/장소 검색
      await runSearch(keyword);

      // 2) 주소 지오코딩 → 성공 시 해당 좌표에 메뉴 오픈(__draft__)
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
    setMenuAnchor(draftPin);
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
  }, [draftPin, resolveAddress, onChangeHideLabelForId]);

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

      setSelectedId(sid);
      setMenuTargetId(sid);
      setDraftPin(null);
      setFitAllOnce(false);
      setMenuAnchor(item.position);
      onChangeHideLabelForId(sid);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });

      panToWithOffset(item.position, 180);
      const { road, jibun } = await resolveAddress(item.position);
      setMenuRoadAddr(road ?? null);
      setMenuJibunAddr(jibun ?? null);
    },
    [
      items,
      resolveAddress,
      panToWithOffset,
      setDraftPin,
      onChangeHideLabelForId,
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

  // 메뉴 닫기 (드래프트 핀은 상황 따라 유지/해제)
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuTargetId(null);
    setMenuAnchor(null);
    setMenuRoadAddr(null);
    setMenuJibunAddr(null);
    onChangeHideLabelForId(null);

    if (!menuTargetId && draftPin) {
      setDraftPin(null);
    }
  }, [menuTargetId, draftPin, setDraftPin, onChangeHideLabelForId]);

  const openViewFromMenu = useCallback(
    (id: string) => {
      setSelectedId(id);
      closeMenu(); // ★ 메뉴 닫으면서 라벨 복구까지
      setViewOpen(true);
    },
    [closeMenu]
  );

  const openCreateFromMenu = useCallback(() => {
    closeMenu(); // ★ 메뉴 닫으면서 라벨 복구까지
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
      if (draftPin && sameCoord(draftPin, pos)) {
        setDraftPin(null);
      }
      closeMenu();
      // 실제 생성/예약은 컨텍스트 메뉴의 onReserve 흐름에서 처리되며,
      // 성공 후 refetch({ draftState: "all" })로 서버 결과 갱신하세요.
    },
    [closeMenu, draftPin, setDraftPin]
  );

  // ✅ 마커 목록: 서버 points(실핀) + drafts(임시/답사예정) + 생성용 draftPin
  const markers = useMemo(() => {
    // 실제 핀(points)
    const pointMarkers = (points ?? []).map((p) => ({
      id: String(p.id),
      position: { lat: p.lat, lng: p.lng },
      kind: "1room" as const, // 프로젝트 핀 종류에 맞게
      title: p.badge ?? "",
      isFav: false,
    }));

    // 임시/답사예정(drafts) — 🔥 숨김 목록 제외
    const draftMarkers = (drafts ?? [])
      .filter((d) => !hiddenDraftIds.has(String(d.id)))
      .map((d) => ({
        id: `__visit__${d.id}`, // 컨텍스트 메뉴에서 패턴으로 식별
        position: { lat: d.lat, lng: d.lng },
        kind: "question" as const,
        isFav: false,
      }));

    // 생성용 드래프트(있을 때만)
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
        setDraftPin(null);
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
        setDraftPin(null);
        setPrefillAddress(undefined);
        setCreateOpen(false);
      },
      // 🔥 매물 등록 직후 부모가 호출할 콜백 (PropertyCreateModalBody → onSubmit에서 호출)
      onAfterCreate: (res: { matchedDraftId?: string | number | null }) => {
        if (res?.matchedDraftId != null) {
          hideDraft(res.matchedDraftId); // 즉시 숨김(로컬)
        }
        refetch(); // 서버 재조회로 확정 반영
      },
    }),
    [setItems, setDraftPin, hideDraft, refetch]
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
    setDraftPin(null);
    setPrefillAddress(undefined);
    setMenuOpen(false);
  }, [setDraftPin]);

  /* ─────────────────────────────────────────────────────────────
     ⭐ POI 변경 시 즉시 반영: 현재 뷰포트 강제 재조회 + idle 트리거
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

  /** ───────────── 추가 파생/alias: MapHomeUI 호환 세트 ───────────── */

  // 뷰포트 체인지 alias
  const onViewportChange = useCallback(
    (vp: any, opts?: { force?: boolean }) => sendViewportQuery(vp, opts),
    [sendViewportQuery]
  );

  // 선택된 아이템을 ViewDetails로 변환
  const selectedViewItem = useMemo(
    () => (selected ? toViewDetails(selected) : null),
    [selected]
  );

  // 선택 좌표(메뉴앵커 > 드래프트 > 선택항목 순)
  const selectedPos = useMemo<LatLng | null>(() => {
    if (menuAnchor) return menuAnchor;
    if (draftPin) return draftPin;
    if (selected) return selected.position;
    return null;
  }, [menuAnchor, draftPin, selected]);

  // 뷰/에디트 닫기 & 전환
  const closeView = useCallback(() => setViewOpen(false), []);
  const closeEdit = useCallback(() => setEditOpen(false), []);
  const onEditFromView = useCallback(() => {
    setViewOpen(false);
    setEditOpen(true);
  }, []);

  // 메뉴 열기 어댑터
  const onOpenMenu = useCallback(
    (p: {
      position: { lat: number; lng: number };
      propertyId?: "__draft__" | string | number;
      propertyTitle?: string | null;
      pin?: { kind?: string; isFav?: boolean };
    }) => {
      openMenuAt(
        p.position,
        (p.propertyId ?? "__draft__") as "__draft__" | string
      );
    },
    [openMenuAt]
  );

  // 마커 클릭 alias
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

    // search/filter (원본 + alias)
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
    setDraftPin,

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

    // 🔥 숨김 제어 API
    hideDraft,
    clearHiddenDraft,
  } as const;
}
