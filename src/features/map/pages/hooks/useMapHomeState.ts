"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import {
  usePanToWithOffset,
  useResolveAddress,
} from "@/features/map/hooks/useKakaoTools";
import { useViewportPost } from "@/features/map/hooks/useViewportPost";
import { useLocalItems } from "../../hooks/useLocalItems";
import { useRunSearch } from "../../hooks/useRunSearch";
import { getMapMarkers } from "../../lib/markers";
import { LatLng } from "@/lib/geo/types";
import { applyPatchToItem } from "@/features/properties/lib/view/applyPatchToItem";
import { toViewDetails } from "@/features/properties/lib/view/toViewDetails";
import { CreatePayload } from "@/features/properties/types/property-dto";
import { buildEditPatchWithMedia } from "@/features/properties/components/PropertyEditModal/lib/buildEditPatch";
import { PoiKind } from "../../lib/poiOverlays";

const DRAFT_PIN_STORAGE_KEY = "maphome:draftPin";
const VISIT_PINS_STORAGE_KEY = "maphome:visitPins";

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

export function useMapHomeState({ appKey }: { appKey: string }) {
  // 지도 관련 상태
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [kakaoSDK, setKakaoSDK] = useState<any>(null);

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

  /* ✅ 핀 관련 상태 (답사예정 & 임시핀) S*/
  // 생성용 단일 draft (신규 등록 모달용)
  const [draftPin, _setDraftPin] = useState<LatLng | null>(null);
  const setDraftPin = useCallback((pin: LatLng | null) => {
    _setDraftPin(pin);
    try {
      if (pin) localStorage.setItem(DRAFT_PIN_STORAGE_KEY, JSON.stringify(pin));
      else localStorage.removeItem(DRAFT_PIN_STORAGE_KEY);
    } catch {}
  }, []);
  const restoredDraftPinRef = useRef<LatLng | null>(null);

  // “답사예정” 전용 배열 (여러 개 유지)
  const [visitPins, setVisitPins] = useState<LatLng[]>([]);
  const restoredVisitPinsRef = useRef<LatLng[] | null>(null);
  /* 핀 관련 상태 (답사예정 & 임시핀) E*/

  // Toggles
  const [useDistrict, setUseDistrict] = useState<boolean>(false);
  const [useSidebar, setUseSidebar] = useState<boolean>(false);

  // ⭐ POI 선택 상태
  const [poiKinds, setPoiKinds] = useState<PoiKind[]>([]);

  const { items, setItems } = useLocalItems({ storageKey: "properties" });

  // Search / filter
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [filter, setFilter] = useState<"all" | "pins" | "units" | string>(
    "all"
  );
  const [q, setQ] = useState("");

  // ─ Viewport post (기존 훅 래핑해서 force 옵션 추가)
  const postViewport = useViewportPost(); // 기존 훅(프로젝트 구현에 맞춤)
  const lastViewportRef = useRef<Viewport | null>(null);

  const sendViewportQuery = useCallback(
    (vp: Viewport, opts?: { force?: boolean }) => {
      // 변경 없고 force도 아니면 스킵
      if (!opts?.force && sameViewport(vp, lastViewportRef.current)) return;
      lastViewportRef.current = vp;

      // 기존 훅 호출
      postViewport.sendViewportQuery
        ? postViewport.sendViewportQuery(vp)
        : (postViewport as any)(vp);

      // 즉시 렌더 동기화를 위해 idle 한 번 더
      if (kakaoSDK && mapInstance) {
        kakaoSDK.maps.event.trigger(mapInstance, "idle");
        requestAnimationFrame(() =>
          kakaoSDK.maps.event.trigger(mapInstance, "idle")
        );
      }
    },
    [postViewport, kakaoSDK, mapInstance]
  );

  const lastViewport = lastViewportRef.current;

  // ▸ 초기 복원 (draftPin)
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

  // ▸ 초기 복원 (visitPins)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(VISIT_PINS_STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const pins = arr.filter(
            (p) => p && typeof p.lat === "number" && typeof p.lng === "number"
          );
          setVisitPins(pins);
          restoredVisitPinsRef.current = pins;
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

  // 기존 핀 말주머니 열기
  const openMenuForExistingPin = useCallback(
    async (p: PropertyItem) => {
      setDraftPin(null); // 생성용 draft는 해제
      const sid = String(p.id);
      setSelectedId(sid);
      setMenuTargetId(sid);
      setMenuAnchor(p.position);
      setFitAllOnce(false);

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
    [resolveAddress, panToWithOffset, setDraftPin]
  );

  // 검색 훅 원본 (keyword: string)
  const runSearchRaw = useRunSearch({
    kakaoSDK,
    mapInstance,
    items,
    onMatchedPin: (p: PropertyItem) => openMenuForExistingPin(p),
    onNoMatch: (coords: LatLng) => setDraftPin(coords),
    panToWithOffset,
    // useRunSearch 내부 queryKey에서 poiKinds를 쓰는 경우를 대비해 전달
    poiKinds,
  } as any);

  // 선택형 래퍼: 인자 없으면 현재 q를 사용
  const runSearch = useCallback(
    (keyword?: string) => runSearchRaw(keyword ?? q),
    [runSearchRaw, q]
  );

  // ▸ draftPin 세팅 시(생성용) — 말주머니 처리(복원 시 자동 오픈 금지)
  useEffect(() => {
    if (!draftPin) return;

    setSelectedId(null);
    setMenuTargetId(null);
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
  }, [draftPin, resolveAddress]);

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

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });

      panToWithOffset(item.position, 180);
      const { road, jibun } = await resolveAddress(item.position);
      setMenuRoadAddr(road ?? null);
      setMenuJibunAddr(jibun ?? null);
    },
    [items, resolveAddress, panToWithOffset, setDraftPin]
  );

  const openMenuAt = useCallback(
    async (
      position: LatLng,
      propertyId: "__draft__" | string,
      opts?: { roadAddress?: string | null; jibunAddress?: string | null }
    ) => {
      // 기존 선택/드래프트 정리
      const isDraft = propertyId === "__draft__";
      setSelectedId(isDraft ? null : String(propertyId));
      setMenuTargetId(isDraft ? null : String(propertyId));
      setDraftPin(isDraft ? position : null);
      setFitAllOnce(false);

      setMenuAnchor(position);

      // 주소 세팅 (옵션 우선, 없으면 역지오코딩)
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
    [resolveAddress, panToWithOffset, setDraftPin]
  );

  // Map ready
  const onMapReady = useCallback(({ kakao, map }: any) => {
    setKakaoSDK(kakao);
    setMapInstance(map);
    requestAnimationFrame(() => setFitAllOnce(false));
    setTimeout(() => {
      map.relayout?.();
      kakao.maps.event.trigger(map, "resize");
      kakao.maps.event.trigger(map, "idle");
    }, 0);
  }, []);

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

  // 메뉴 닫기 (답사예정 핀은 유지)
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuTargetId(null);
    setMenuAnchor(null);
    setMenuRoadAddr(null);
    setMenuJibunAddr(null);

    // 말주머니가 특정 핀 대상이 아닌(= 신규 좌표 기반) 경우, 남아있는 draftPin 제거
    if (!menuTargetId && draftPin) {
      setDraftPin(null);
    }
  }, [menuTargetId, draftPin, setDraftPin]);

  const openViewFromMenu = useCallback((id: string) => {
    setSelectedId(id);
    setMenuOpen(false);
    setViewOpen(true);
  }, []);

  const openCreateFromMenu = useCallback(() => {
    setMenuOpen(false);
    setPrefillAddress(menuRoadAddr ?? menuJibunAddr ?? undefined);
    setCreateOpen(true);
  }, [menuRoadAddr, menuJibunAddr]);

  // ✅ 답사예정 핀 추가/삭제 (+ 영속화)
  const persistVisitPins = (pins: LatLng[]) => {
    try {
      localStorage.setItem(VISIT_PINS_STORAGE_KEY, JSON.stringify(pins));
    } catch {}
  };

  const addVisitPin = useCallback((pos: LatLng) => {
    setVisitPins((prev) => {
      if (prev.some((p) => sameCoord(p, pos))) return prev; // 중복 방지
      const next = [...prev, pos];
      persistVisitPins(next);
      return next;
    });
  }, []);

  const removeVisitPin = useCallback((pos: LatLng) => {
    setVisitPins((prev) => {
      const next = prev.filter((p) => !sameCoord(p, pos));
      persistVisitPins(next);
      return next;
    });
  }, []);

  // ✅ 메뉴에서 “답사예정” 선택 시 호출할 핸들러(좌표 받음)
  const onPlanFromMenu = useCallback(
    (pos: LatLng) => {
      addVisitPin(pos);
      if (draftPin && sameCoord(draftPin, pos)) {
        setDraftPin(null);
      }
      closeMenu();
    },
    [addVisitPin, closeMenu, draftPin, setDraftPin]
  );

  // ✅ 마커 목록: 기존 + 방문예정(여러개) + 생성용 드래프트(있을 때만)
  const markers = useMemo(
    () => getMapMarkers(filtered, visitPins, draftPin),
    [filtered, visitPins, draftPin]
  );

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
    }),
    [setItems, setDraftPin]
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
    } else {
      // 초기엔 검색 훅으로도 보조
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

    // toggles
    useSidebar,
    setUseSidebar,
    useDistrict,
    setUseDistrict,

    // ⭐ POI
    poiKinds,
    setPoiKinds,

    // menu
    menuOpen,
    menuAnchor,
    menuTargetId,
    menuRoadAddr,
    menuJibunAddr,
    closeMenu,
    openViewFromMenu,
    openCreateFromMenu,

    openMenuAt,

    // draft & visit
    draftPin, // 생성용 단일
    setDraftPin,
    visitPins, // ✅ 답사예정(여러개)
    addVisitPin,
    removeVisitPin,
    onPlanFromMenu, // ✅ PinContextMenu -> MapHomeUI -> 여기로 전달해 호출

    // marker click
    handleMarkerClick,

    // modals
    viewOpen,
    setViewOpen,
    editOpen,
    setEditOpen,
    createOpen,
    setCreateOpen,
    prefillAddress,
    closeCreate,

    // view handlers
    onSaveViewPatch,
    onDeleteFromView,

    // host bridges
    createHostHandlers,
    editHostHandlers,

    // utils
    panToWithOffset,
    toViewDetails,
  } as const;
}
