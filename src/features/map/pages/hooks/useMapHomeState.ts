"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdvFilters } from "@/features/contract-records/types/advFilters";
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

const DRAFT_PIN_STORAGE_KEY = "maphome:draftPin";
const VISIT_PINS_STORAGE_KEY = "maphome:visitPins";

// 부동소수점 비교 오차 보정
const sameCoord = (a?: LatLng | null, b?: LatLng | null, eps = 1e-7) =>
  !!a && !!b && Math.abs(a.lat - b.lat) < eps && Math.abs(a.lng - b.lng) < eps;

export function useMapHomeState({ appKey }: { appKey: string }) {
  // SDK / Map
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [kakaoSDK, setKakaoSDK] = useState<any>(null);

  // Menu
  const [menuRoadAddr, setMenuRoadAddr] = useState<string | null>(null);
  const [menuJibunAddr, setMenuJibunAddr] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<LatLng | null>(null);
  const [menuTargetId, setMenuTargetId] = useState<string | null>(null);

  // Fit once
  const [fitAllOnce, setFitAllOnce] = useState(true);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [prefillAddress, setPrefillAddress] = useState<string | undefined>();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // ✅ 생성용 단일 draft (신규 등록 모달용)
  const [draftPin, _setDraftPin] = useState<LatLng | null>(null);
  const setDraftPin = useCallback((pin: LatLng | null) => {
    _setDraftPin(pin);
    try {
      if (pin) localStorage.setItem(DRAFT_PIN_STORAGE_KEY, JSON.stringify(pin));
      else localStorage.removeItem(DRAFT_PIN_STORAGE_KEY);
    } catch {}
  }, []);
  const restoredDraftPinRef = useRef<LatLng | null>(null);

  // ✅ “답사예정” 전용 배열 (여러 개 유지)
  const [visitPins, setVisitPins] = useState<LatLng[]>([]);
  const restoredVisitPinsRef = useRef<LatLng[] | null>(null);

  // Toggles
  const [useDistrict, setUseDistrict] = useState<boolean>(false);
  const [useSidebar, setUseSidebar] = useState<boolean>(false);

  // Search / filter
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [filter, setFilter] = useState<"all" | "pins" | "units" | string>(
    "all"
  );
  const [q, setQ] = useState("");

  const { sendViewportQuery } = useViewportPost();
  const { items, setItems } = useLocalItems({ storageKey: "properties" });

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

  // 검색
  const runSearch = useRunSearch({
    kakaoSDK,
    mapInstance,
    items,
    onMatchedPin: openMenuForExistingPin,
    onNoMatch: (coords) => setDraftPin(coords), // 검색으로 신규등록 흐름일 땐 draftPin 사용
    panToWithOffset,
  });

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

  // 메뉴 닫기 (답사예정 핀은 유지)
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuTargetId(null);
    setMenuAnchor(null);
    setMenuRoadAddr(null);
    setMenuJibunAddr(null);
  }, []);

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
      closeMenu(); // 말주머니 닫고 핀은 남김
    },
    [addVisitPin, closeMenu]
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
    }),
    [setItems]
  );

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
    setDraftPin(null);
    setPrefillAddress(undefined);
    setMenuOpen(false);
  }, [setDraftPin]);

  return {
    // sdk/map
    kakaoSDK,
    mapInstance,
    onMapReady,
    sendViewportQuery,

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

    // menu
    menuOpen,
    menuAnchor,
    menuTargetId,
    menuRoadAddr,
    menuJibunAddr,
    closeMenu,
    openViewFromMenu,
    openCreateFromMenu,

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
