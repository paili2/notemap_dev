"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LatLng, MapMarker } from "@/features/map/types/map";
import MapView from "./components/MapView/MapView";
import type { PropertyItem } from "../properties/types/propertyItem";
import type { AdvFilters } from "@/features/properties/types/advFilters";
import PropertyCreateModal from "../properties/components/PropertyCreateModal/PropertyCreateModal";
import PropertyViewModal from "../properties/components/PropertyViewModal/PropertyViewModal";
import PinContextMenu from "./components/PinContextMenu/PinContextMenu";

import { CreatePayload } from "../properties/types/property-dto";
import { FilterKey } from "@/features/map/components/top/MapTopBar/types";
import MapTopBar from "@/features/map/components/top/MapTopBar/MapTopBar";
import ToggleSidebar from "@/features/map/components/top/ToggleSidebar/ToggleSidebar";
import { Sidebar } from "@/features/sidebar";
import FilterSearch from "./FilterSearch/components/FilterSearch";
import PropertyEditModal from "../properties/components/PropertyEditModal/PropertyEditModal";
import { PropertyViewDetails } from "../properties/components/PropertyViewModal/types";

// ✅ 외부 유틸/훅
import { applyPatchToItem, toViewDetails } from "@/features/map/lib/view";
import { distanceMeters } from "./utils/distance";
import { useViewportPost } from "@/features/map/hooks/useViewportPost";
import { useLocalItems } from "./hooks/useLocalItems";
import { getMapMarkers } from "./lib/markers";
import { DEFAULT_CENTER, DEFAULT_LEVEL } from "./lib/constants";
import {
  usePanToWithOffset,
  useResolveAddress,
} from "@/features/map/hooks/useKakaoTools";

import { buildEditPatchWithMedia } from "@/features/properties/components/PropertyEditModal/lib/buildEditPatch";
import { buildCreatePatchWithMedia } from "../properties/components/PropertyCreateModal/lib/buildCreatePatch";
import { useRunSearch } from "./hooks/useRunSearch";
import MapCreateModalHost from "./components/MapCreateModalHost";
import MapEditModalHost from "./components/MapEditModalHost";

const STORAGE_KEY = "properties";

/** ========================= 컴포넌트 ========================= */
const MapHomePage: React.FC = () => {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [kakaoSDK, setKakaoSDK] = useState<any>(null);

  // 컨텍스트 메뉴 주소
  const [menuRoadAddr, setMenuRoadAddr] = useState<string | null>(null);
  const [menuJibunAddr, setMenuJibunAddr] = useState<string | null>(null);

  // 최초 fit once
  const [fitAllOnce, setFitAllOnce] = useState(true);

  // 모달 상태
  const [createOpen, setCreateOpen] = useState(false);
  const [prefillAddress, setPrefillAddress] = useState<string | undefined>();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // 드래프트 핀 & 메뉴
  const [draftPin, setDraftPin] = useState<LatLng | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<LatLng | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTargetId, setMenuTargetId] = useState<string | null>(null);

  // 좌상단 토글
  const [useDistrict, setUseDistrict] = useState<boolean>(false);
  const [useSidebar, setUseSidebar] = useState<boolean>(false);

  // 필터/검색
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [adv, setAdv] = useState<AdvFilters>({
    floors: [],
    area17: "any",
    categories: [],
    elevator: "any",
  });
  const [filter, setFilter] = useState<FilterKey>("all");
  const [q, setQ] = useState("");

  // 뷰포트 POST
  const { sendViewportQuery } = useViewportPost();

  // FilterSearch 모달
  const [filterSearchOpen, setFilterSearchOpen] = useState(false);

  // 로컬 저장/복원 훅 (localStorage)
  const { items, setItems } = useLocalItems({ storageKey: STORAGE_KEY });

  /** 파생: 필터링 */
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

  // 지도 마커
  const mapMarkers: MapMarker[] = useMemo(
    () => getMapMarkers(filtered, draftPin),
    [filtered, draftPin]
  );

  // 선택
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => items.find((x) => x.id === selectedId) ?? null,
    [items, selectedId]
  );

  const selectedViewItem = useMemo(() => {
    if (!selected) return null;
    const extra = ((selected as any).view ?? {}) as Record<string, unknown>;
    const definedExtra = Object.fromEntries(
      Object.entries(extra).filter(([, v]) => v !== undefined)
    );
    return {
      ...toViewDetails(selected),
      ...definedExtra,
    } as PropertyViewDetails;
  }, [selected]);

  // kakao 도구 훅
  const resolveAddress = useResolveAddress(kakaoSDK);
  const panToWithOffset = usePanToWithOffset(kakaoSDK, mapInstance);

  const openMenuForExistingPin = useCallback(
    async (p: PropertyItem) => {
      setDraftPin(null);
      setSelectedId(p.id);
      setMenuTargetId(p.id);
      setMenuAnchor(p.position);
      setFitAllOnce(false);

      // 클릭 시에도 지도 이동 (검색으로 열린 케이스 대응)
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

  // ── 검색 (주소→좌표, 실패 시 키워드) ──
  const runSearch = useRunSearch({
    kakaoSDK,
    mapInstance,
    items,
    onMatchedPin: openMenuForExistingPin,
    onNoMatch: (coords) => setDraftPin(coords),
    panToWithOffset, // 없으면 이 줄 빼도 됨
  });

  // 신규핀(draftPin) 생기면 자동으로 컨텍스트메뉴 열기 + 카메라 오프셋 이동
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

  // 마커 클릭 핸들러(쉴드)
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

  const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!KAKAO_MAP_KEY) {
    return (
      <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
        NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수가 설정되지 않았습니다. (Vercel
        프로젝트 환경변수에 추가 후 재배포 필요)
      </div>
    );
  }

  const menuTitle = menuTargetId
    ? items.find((p) => p.id === menuTargetId)?.title ?? null
    : null;

  return (
    <div className="fixed inset-0">
      {/* 지도 */}
      <div className="absolute inset-0">
        <MapView
          appKey={KAKAO_MAP_KEY}
          center={DEFAULT_CENTER}
          level={DEFAULT_LEVEL}
          markers={mapMarkers}
          fitToMarkers={fitAllOnce}
          useDistrict={useDistrict}
          showNativeLayerControl={false}
          controlRightOffsetPx={32}
          controlTopOffsetPx={10}
          onMarkerClick={handleMarkerClick}
          onMapReady={({ kakao, map }) => {
            setKakaoSDK(kakao);
            setMapInstance(map);
            requestAnimationFrame(() => setFitAllOnce(false));
            setTimeout(() => {
              map.relayout?.();
              kakao.maps.event.trigger(map, "resize");
              kakao.maps.event.trigger(map, "idle");
            }, 0);
          }}
          onViewportChange={sendViewportQuery}
          allowCreateOnMapClick={false}
          hideLabelForId={menuOpen ? menuTargetId ?? "__draft__" : null}
        />

        {mapInstance && kakaoSDK && menuAnchor && menuOpen && (
          <PinContextMenu
            key={`${menuAnchor.lat},${menuAnchor.lng}-${
              menuTargetId ?? "draft"
            }`}
            kakao={kakaoSDK}
            map={mapInstance}
            position={new kakaoSDK.maps.LatLng(menuAnchor.lat, menuAnchor.lng)}
            roadAddress={menuRoadAddr ?? undefined}
            jibunAddress={menuJibunAddr ?? undefined}
            propertyId={menuTargetId ?? "__draft__"}
            propertyTitle={menuTitle}
            onClose={() => {
              setMenuOpen(false);
              if (!menuTargetId) {
                setDraftPin(null);
                setMenuAnchor(null);
                setMenuRoadAddr(null);
                setMenuJibunAddr(null);
              }
            }}
            onView={(id) => {
              setSelectedId(id);
              setMenuOpen(false);
              setViewOpen(true);
            }}
            onCreate={() => {
              setMenuOpen(false);
              setPrefillAddress(menuRoadAddr ?? menuJibunAddr ?? undefined);
              setCreateOpen(true);
            }}
            zIndex={10000}
          />
        )}
      </div>
      <MapTopBar
        active={filter}
        onChangeFilter={setFilter}
        value={q}
        onChangeSearch={setQ}
        onSubmitSearch={(v) => {
          if (!v.trim()) return;
          runSearch(v);
        }}
      />
      {/* 사이드바 버튼 */}
      <ToggleSidebar
        isSidebarOn={useSidebar}
        onToggleSidebar={() => setUseSidebar(!useSidebar)}
        offsetTopPx={12}
      />
      {/* 사이드바 */}
      <Sidebar
        isSidebarOn={useSidebar}
        onToggleSidebar={() => setUseSidebar(!useSidebar)}
      />
      {/* 좌측 하단 필터 검색 버튼 */}
      <div className="absolute bottom-4 left-4 z-30">
        <button
          onClick={() => setFilterSearchOpen(true)}
          className="bg-gray-900 shadow-2xl border-2 border-gray-800 hover:bg-gray-800 p-3 rounded-lg transition-all duration-200 hover:scale-105"
          title="필터 검색"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        </button>
      </div>
      {/* FilterSearch 모달 */}
      <FilterSearch
        isOpen={filterSearchOpen}
        onClose={() => setFilterSearchOpen(false)}
      />
      {/* 상세 보기 모달 */}
      {viewOpen && selectedViewItem && (
        <PropertyViewModal
          open={true}
          onClose={() => setViewOpen(false)}
          data={selectedViewItem}
          onSave={async (patch: Partial<PropertyViewDetails>) => {
            setItems((prev) =>
              prev.map((p) =>
                p.id === selectedId ? applyPatchToItem(p, patch) : p
              )
            );
          }}
          onEdit={() => setEditOpen(true)}
          onDelete={async () => {
            setItems((prev) => prev.filter((p) => p.id !== selectedId));
            setViewOpen(false);
            setSelectedId(null);
          }}
        />
      )}
      {/* 신규 등록 모달 */}
      {createOpen && (
        <MapCreateModalHost
          open={createOpen}
          prefillAddress={prefillAddress}
          draftPin={draftPin}
          selectedPos={selected ? selected.position : null}
          onClose={() => {
            setCreateOpen(false);
            setDraftPin(null);
            setPrefillAddress(undefined);
            setMenuOpen(false);
          }}
          appendItem={(item) => setItems((prev) => [item, ...prev])}
          selectAndOpenView={(id) => {
            setSelectedId(id);
            setViewOpen(true);
            setMenuTargetId("draft");
          }}
          resetAfterCreate={() => {
            setDraftPin(null);
            setPrefillAddress(undefined);
            setCreateOpen(false);
          }}
        />
      )}
      {/* 수정 모달 */}
      {editOpen && selectedViewItem && selectedId && (
        <MapEditModalHost
          open={true}
          data={selectedViewItem}
          selectedId={selectedId}
          onClose={() => setEditOpen(false)}
          updateItems={setItems}
        />
      )}
    </div>
  );
};

export default MapHomePage;
