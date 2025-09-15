"use client";

import { useEffect, useState } from "react";

import MapTopBar from "@/features/map/components/top/MapTopBar/MapTopBar";
import ToggleSidebar from "@/features/map/components/top/ToggleSidebar/ToggleSidebar";
import MapMenu from "@/features/map/components/MapMenu/MapMenu";
import { Sidebar } from "@/features/sidebar";

import PropertyViewModal from "@/features/properties/components/PropertyViewModal/PropertyViewModal";

import MapView from "../../components/MapView/MapView";
import { DEFAULT_CENTER, DEFAULT_LEVEL } from "../../lib/constants";
import { FilterSearch } from "../../FilterSearch";
import MapCreateModalHost from "../../components/MapCreateModalHost";
import MapEditModalHost from "../../components/MapEditModalHost";
import PinContextMenu from "@/features/map/components/PinContextMenu/PinContextMenu";
import { MapHomeUIProps } from "./types";

export function MapHomeUI(props: MapHomeUIProps) {
  const {
    appKey,
    kakaoSDK,
    mapInstance,
    markers,
    fitAllOnce,

    q,
    filter,
    onChangeQ,
    onChangeFilter,
    onSubmitSearch,

    useSidebar,
    setUseSidebar,

    menuOpen,
    menuAnchor,
    menuTargetId,
    menuRoadAddr,
    menuJibunAddr,
    menuTitle,
    onCloseMenu,
    onViewFromMenu,
    onCreateFromMenu,
    onPlanFromMenu,

    onMarkerClick,
    onMapReady,
    onViewportChange,

    viewOpen,
    editOpen,
    createOpen,
    selectedViewItem,
    selectedId,
    prefillAddress,
    draftPin,
    selectedPos,
    closeView,
    onSaveViewPatch,
    onEditFromView,
    onDeleteFromView,
    createHostHandlers,
    editHostHandlers,

    hideLabelForId,
  } = props;

  // UI 전용(프레젠테이션 상태): 필터 검색 모달
  const [filterSearchOpen, setFilterSearchOpen] = useState(false);

  // 지적편집도 상태
  const [isDistrictOn, setIsDistrictOn] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  useEffect(() => {
    if (menuOpen && menuAnchor && kakaoSDK && mapInstance) {
      const ids: number[] = [];
      const id1 = requestAnimationFrame(() => {
        const id2 = requestAnimationFrame(() => setShowMenu(true));
        ids.push(id2);
      });
      ids.push(id1);
      return () => {
        ids.forEach((n) => cancelAnimationFrame(n));
        setShowMenu(false);
      };
    } else {
      setShowMenu(false);
    }
  }, [menuOpen, menuAnchor, kakaoSDK, mapInstance]);
  return (
    <div className="fixed inset-0">
      {/* 지도 */}
      <div className="absolute inset-0">
        <MapView
          appKey={appKey}
          center={DEFAULT_CENTER}
          level={DEFAULT_LEVEL}
          markers={markers}
          fitToMarkers={fitAllOnce}
          useDistrict={isDistrictOn}
          onMarkerClick={onMarkerClick}
          onMapReady={onMapReady}
          onViewportChange={onViewportChange}
          allowCreateOnMapClick={false}
          hideLabelForId={hideLabelForId}
        />

        {mapInstance && kakaoSDK && menuAnchor && showMenu && (
          <PinContextMenu
            key={
              menuTargetId
                ? `bubble-${menuTargetId}`
                : `bubble-draft-${menuAnchor.lat},${menuAnchor.lng}`
            }
            kakao={kakaoSDK}
            map={mapInstance}
            position={new kakaoSDK.maps.LatLng(menuAnchor.lat, menuAnchor.lng)}
            roadAddress={menuRoadAddr ?? undefined}
            jibunAddress={menuJibunAddr ?? undefined}
            propertyId={menuTargetId ?? "__draft__"}
            propertyTitle={menuTitle ?? undefined}
            onClose={onCloseMenu}
            onView={onViewFromMenu}
            onCreate={onCreateFromMenu}
            onPlan={onPlanFromMenu}
            zIndex={10000}
          />
        )}
      </div>

      {/* 상단 바 */}
      <MapTopBar
        value={q}
        onChangeSearch={onChangeQ}
        onSubmitSearch={(v) => v.trim() && onSubmitSearch(v)}
      />

      {/* 맵 메뉴 - 사이드바 왼쪽 고정 위치 */}
      <div className="fixed top-3 right-16 z-[60]">
        <MapMenu
          active={filter as any}
          onChange={onChangeFilter as any}
          isDistrictOn={isDistrictOn}
          onToggleDistrict={setIsDistrictOn}
        />
      </div>

      {/* 사이드바 토글 */}
      <ToggleSidebar controlledOpen={useSidebar} onChangeOpen={setUseSidebar} />
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
          onClose={closeView}
          data={selectedViewItem}
          onSave={onSaveViewPatch}
          onEdit={onEditFromView}
          onDelete={onDeleteFromView}
        />
      )}

      {/* 신규 등록 모달 */}
      {createOpen && (
        <MapCreateModalHost
          open={createOpen}
          prefillAddress={prefillAddress}
          draftPin={draftPin}
          selectedPos={selectedPos}
          onClose={createHostHandlers.onClose}
          appendItem={createHostHandlers.appendItem}
          selectAndOpenView={createHostHandlers.selectAndOpenView}
          resetAfterCreate={createHostHandlers.resetAfterCreate}
        />
      )}

      {/* 수정 모달 */}
      {editOpen && selectedViewItem && selectedId && (
        <MapEditModalHost
          open={true}
          data={selectedViewItem}
          selectedId={selectedId}
          onClose={editHostHandlers.onClose}
          updateItems={editHostHandlers.updateItems}
          onSubmit={editHostHandlers.onSubmit}
        />
      )}
    </div>
  );
}
