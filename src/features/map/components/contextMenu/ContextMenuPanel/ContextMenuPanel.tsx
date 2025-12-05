"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Plus, Star, Trash2 } from "lucide-react";

import type React from "react";
import type { ContextMenuPanelProps } from "./types";

import { useContextMenuPanelLogic } from "./hooks/useContextMenuPanel";

export default function ContextMenuPanel(props: ContextMenuPanelProps) {
  const {
    roadAddress,
    jibunAddress,
    showFav,
    onAddFav,
    canDelete,
    onDelete,
    onClose,
  } = props;

  const {
    // refs
    panelRef,
    firstFocusableRef,

    // aria
    headingId,
    descId,

    // 상태
    headerTitle,
    draft,
    planned,
    reserved,
    canView,

    // 핸들러
    stopAll,
    handleCreateClick,
    handleViewClick,
    handleReserveClick,
    handleHoverPrefetch,
  } = useContextMenuPanelLogic(props);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descId}
      tabIndex={-1}
      onPointerDown={stopAll}
      onMouseDown={stopAll}
      onClick={stopAll}
      className="rounded-2xl bg-white shadow-xl border border-gray-200 p-3 w-[280px] sm:w-[320px] max-w-[90vw] outline-none"
    >
      {/* ---------------- 헤더 ---------------- */}
      <div className="flex items-center justify-between gap-3">
        <div
          id={headingId}
          className="font-semibold text-base truncate min-w-0"
        >
          {headerTitle}
        </div>

        <div className="flex items-center sm:gap-2 shrink-0">
          {/* 모바일 즐겨찾기 아이콘 */}
          {showFav && (
            <Button
              type="button"
              onClick={onAddFav}
              aria-label="즐겨찾기"
              variant="ghost"
              size="icon"
              className="sm:hidden -mr-[10px]"
              ref={firstFocusableRef}
            >
              <Star className="w-5 h-5" />
            </Button>
          )}

          {/* 모바일 삭제 */}
          {canDelete && (
            <Button
              type="button"
              onClick={onDelete}
              aria-label="매물삭제"
              variant="ghost"
              size="icon"
              className="sm:hidden text-red-500"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}

          {/* PC 즐겨찾기 */}
          {showFav && (
            <Button
              type="button"
              onClick={onAddFav}
              aria-label="즐겨찾기"
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              즐겨찾기 <Plus />
            </Button>
          )}

          {/* PC 삭제 */}
          {canDelete && (
            <Button
              type="button"
              onClick={onDelete}
              aria-label="매물삭제"
              variant="destructive"
              size="sm"
              className="hidden sm:flex"
            >
              삭제
            </Button>
          )}

          {/* 닫기 버튼 */}
          <Button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            variant="outline"
            size="sm"
          >
            닫기
          </Button>
        </div>
      </div>

      {/* ---------------- 주소 설명 ---------------- */}
      <div id={descId} className="sr-only">
        {roadAddress || jibunAddress
          ? "선택된 위치의 주소가 표시됩니다."
          : "선택된 위치의 주소 정보가 없습니다."}
      </div>

      {(roadAddress || jibunAddress) && (
        <div className="mt-2 mb-3">
          {roadAddress && (
            <div className="text-[13px] text-gray-700 leading-snug">
              {roadAddress}
            </div>
          )}
          {jibunAddress && (
            <div className="text-[12px] text-gray-500 mt-0.5 leading-snug">
              (지번) {jibunAddress}
            </div>
          )}
        </div>
      )}

      {/* ---------------- 액션 구역 ---------------- */}
      {reserved ? (
        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={handleCreateClick}
          className="w-full"
        >
          매물 정보 입력
        </Button>
      ) : planned ? (
        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={handleReserveClick}
          className="w-full"
        >
          답사지 예약
        </Button>
      ) : draft ? (
        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={handleCreateClick}
          className="w-full"
        >
          답사예정지 등록
        </Button>
      ) : (
        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={handleViewClick}
          onMouseEnter={handleHoverPrefetch}
          className="w-full"
          disabled={!canView}
        >
          상세 보기
        </Button>
      )}
    </div>
  );
}
