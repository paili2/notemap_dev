"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdvFilters } from "@/features/filters/types/advFilters";
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

export function useMapHomeState({ appKey }: { appKey: string }) {
  // SDK / Map
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [kakaoSDK, setKakaoSDK] = useState<any>(null);

  // Context menu addresses
  const [menuRoadAddr, setMenuRoadAddr] = useState<string | null>(null);
  const [menuJibunAddr, setMenuJibunAddr] = useState<string | null>(null);

  // Fit markers once on first render
  const [fitAllOnce, setFitAllOnce] = useState(true);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [prefillAddress, setPrefillAddress] = useState<string | undefined>();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Draft pin & menu
  const [draftPin, setDraftPin] = useState<LatLng | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<LatLng | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTargetId, setMenuTargetId] = useState<string | null>(null);

  // Toggles
  const [useDistrict, setUseDistrict] = useState<boolean>(false);
  const [useSidebar, setUseSidebar] = useState<boolean>(false);

  // Search / filter (keep types compatible with existing components)
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [adv, setAdv] = useState<AdvFilters>({
    floors: [],
    area17: "any",
    categories: [],
    elevator: "any",
  });
  const [filter, setFilter] = useState<"all" | "pins" | "units" | string>(
    "all"
  );
  const [q, setQ] = useState("");

  // Backend viewport POST
  const { sendViewportQuery } = useViewportPost();

  // Local storage items
  const { items, setItems } = useLocalItems({ storageKey: "properties" });

  // Derived: filtered list
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

  // Kakao tools
  const resolveAddress = useResolveAddress(kakaoSDK);
  const panToWithOffset = usePanToWithOffset(kakaoSDK, mapInstance);

  // Open context menu for existing pin
  const openMenuForExistingPin = useCallback(
    async (p: PropertyItem) => {
      setDraftPin(null);
      setSelectedId(p.id);
      setMenuTargetId(p.id);
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
      setMenuOpen(true);
    },
    [resolveAddress, panToWithOffset]
  );

  // Search (address->coords, fallback keyword)
  const runSearch = useRunSearch({
    kakaoSDK,
    mapInstance,
    items,
    onMatchedPin: openMenuForExistingPin,
    onNoMatch: (coords) => setDraftPin(coords),
    panToWithOffset,
  });

  // When draftPin appears, open menu & pan
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

    setMenuOpen(true);
    panToWithOffset(draftPin, 180);

    if (kakaoSDK && mapInstance) {
      kakaoSDK.maps.event.trigger(mapInstance, "idle");
      requestAnimationFrame(() =>
        kakaoSDK.maps.event.trigger(mapInstance, "idle")
      );
    }
  }, [draftPin, resolveAddress, kakaoSDK, mapInstance, panToWithOffset]);

  // Marker click
  const markerClickShieldRef = useRef(0);
  const handleMarkerClick = useCallback(
    async (id: string) => {
      markerClickShieldRef.current = Date.now();
      if (id === "__draft__") return;
      const item = items.find((p) => p.id === id);
      if (!item) return;

      panToWithOffset(item.position, 180);

      setMenuTargetId(id);
      setSelectedId(id);
      setDraftPin(null);
      setFitAllOnce(false);
      setMenuAnchor(item.position);
      setMenuOpen(true);

      const { road, jibun } = await resolveAddress(item.position);
      setMenuRoadAddr(road ?? null);
      setMenuJibunAddr(jibun ?? null);
    },
    [items, resolveAddress, panToWithOffset]
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

  // View modal handlers
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

  // Menu helpers
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    if (!menuTargetId) {
      setDraftPin(null);
      setMenuAnchor(null);
      setMenuRoadAddr(null);
      setMenuJibunAddr(null);
    }
  }, [menuTargetId]);

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

  const markers = useMemo(
    () => getMapMarkers(filtered, draftPin),
    [filtered, draftPin]
  );

  // Create host handlers passed to UI
  const createHostHandlers = useMemo(
    () => ({
      onClose: () => {
        setCreateOpen(false);
        setDraftPin(null);
        setPrefillAddress(undefined);
        setMenuOpen(false);
      },
      appendItem: (item: PropertyItem) => setItems((prev) => [item, ...prev]),
      selectAndOpenView: (id: string) => {
        setSelectedId(id);
        setViewOpen(true);
        setMenuTargetId("draft");
      },
      resetAfterCreate: () => {
        setDraftPin(null);
        setPrefillAddress(undefined);
        setCreateOpen(false);
      },
    }),
    [setItems]
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
  }, []);

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

    // draft & marker click
    draftPin,
    setDraftPin,
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
