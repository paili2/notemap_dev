"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ToggleSidebar from "../../../view/top/ToggleSidebar/ToggleSidebar";
import { PoiKind } from "@/features/map/shared/overlays/poiOverlays";
import Portal from "@/components/Portal";
import { usePlannedDrafts } from "../hooks/usePlannedDrafts";
import { MapMenu, MapMenuKey } from "@/features/map/menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/Dialog/Dialog";
import { useMemoViewMode } from "@/features/properties/store/useMemoViewMode"; // ✅ 추가

function isPlannedKey(k: MapMenuKey | string) {
  return k === "planned"; // ← 실제 키로 교체
}

// 편의시설이 보이기 시작하는 축척(단위 m)
const POI_VISIBLE_MIN_SCALE_M = 50;

// 카카오맵 level → 대략적인 m 단위로 변환
const getScaleMetersFromLevel = (level: number) => {
  switch (level) {
    case 1:
      return 10;
    case 2:
      return 20;
    case 3:
      return 50;
    case 4:
      return 100;
    case 5:
      return 250;
    default:
      return 500;
  }
};

export default function TopRightControls(props: {
  activeMenu: MapMenuKey;
  onChangeFilter: (next: MapMenuKey) => void;
  isDistrictOn: boolean;
  setIsDistrictOn: (v: boolean) => void;
  poiKinds: readonly PoiKind[];
  onChangePoiKinds: (next: PoiKind[]) => void;
  roadviewVisible: boolean;
  onToggleRoadview: () => void;
  rightOpen: boolean;
  setRightOpen: (v: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  getBounds: () => kakao.maps.LatLngBounds | undefined;
  getLevel: () => number | undefined;
}) {
  const stop = (e: any) => {
    e.stopPropagation?.();
    e.nativeEvent?.stopPropagation?.();
    e.nativeEvent?.stopImmediatePropagation?.();
  };

  // kakao Bounds -> 커스텀 Bounds 어댑터
  const getBoundsForHook = () => {
    const b = props.getBounds?.();
    if (!b) return undefined;
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    return {
      swLat: sw.getLat(),
      swLng: sw.getLng(),
      neLat: ne.getLat(),
      neLng: ne.getLng(),
    };
  };

  const { reloadPlanned } = usePlannedDrafts({
    filter: isPlannedKey(props.activeMenu) ? "planned" : "all",
    getBounds: getBoundsForHook,
  });

  const loadingRef = useRef(false);

  // 메뉴가 planned일 때만 데이터 로드
  useEffect(() => {
    const run = async () => {
      if (isPlannedKey(props.activeMenu)) {
        if (loadingRef.current) return;
        loadingRef.current = true;
        try {
          await Promise.resolve(reloadPlanned());
        } finally {
          loadingRef.current = false;
        }
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.activeMenu, reloadPlanned]);

  // 로드뷰가 열리면 z-index / pointer-events 조정
  const rootClass =
    "fixed top-3 right-3 " +
    (props.roadviewVisible
      ? "z-[5] pointer-events-none opacity-40"
      : "z-[10] pointer-events-auto");

  // ✅ 편의시설 모달 상태
  const [poiWarningOpen, setPoiWarningOpen] = useState(false);

  // ✅ 편의시설 토글을 가로채서 축척 체크
  const handleChangePoiKinds = useCallback(
    (next: PoiKind[]) => {
      // 모두 꺼져있다가 처음 켜는 상황에서만 체크
      const turningOn = props.poiKinds.length === 0 && next.length > 0;

      if (turningOn) {
        const level = props.getLevel?.();
        if (typeof level === "number") {
          const scaleM = getScaleMetersFromLevel(level);

          // 50m보다 축소(= 숫자 큼)면 모달만 띄우고 실제 토글은 막기
          if (scaleM > POI_VISIBLE_MIN_SCALE_M) {
            setPoiWarningOpen(true);
            return;
          }
        }
      }

      props.onChangePoiKinds(next);
    },
    [props.poiKinds.length, props.getLevel, props.onChangePoiKinds]
  );

  // ✅ 전역 메모 보기 모드 (K&N / R)
  const { mode: memoMode, setMode: setMemoMode } = useMemoViewMode();

  return (
    <>
      {/* 오른쪽 상단 메뉴 영역 */}
      <Portal>
        <div
          id="top-right-controls"
          className={rootClass}
          aria-hidden={props.roadviewVisible}
        >
          <div
            className="relative flex items-center gap-2"
            onPointerDown={stop}
            onMouseDown={stop}
            onTouchStart={stop}
          >
            {/* 🟡 전역 메모 보기 토글 (K&N / R) */}
            <div className="relative z-[2] shrink-0">
              <div className="inline-flex rounded-md border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMemoMode("public")}
                  className={`px-3 h-8 text-sm ${
                    memoMode === "public"
                      ? "bg-amber-500 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  K&N
                </button>
                <button
                  type="button"
                  onClick={() => setMemoMode("secret")}
                  className={`px-3 h-8 text-sm border-l ${
                    memoMode === "secret"
                      ? "bg-rose-600 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  R
                </button>
              </div>
            </div>

            {/* 🔵 지도 메뉴 (등록/답사/임시핀 등 필터) - 가운데 */}
            <div className="relative z-[2] shrink-0">
              <MapMenu
                active={props.activeMenu}
                onChange={(next) => {
                  const resolved = next === props.activeMenu ? "all" : next;
                  if (isPlannedKey(resolved)) reloadPlanned();
                  props.onChangeFilter(resolved as MapMenuKey);
                }}
                isDistrictOn={props.isDistrictOn}
                onToggleDistrict={props.setIsDistrictOn}
                poiKinds={props.poiKinds}
                onChangePoiKinds={handleChangePoiKinds}
                roadviewVisible={props.roadviewVisible}
                onToggleRoadview={props.onToggleRoadview}
                expanded={props.rightOpen}
                onExpandChange={(expanded) => {
                  props.setRightOpen(expanded);
                  if (expanded && props.sidebarOpen)
                    props.setSidebarOpen(false);
                }}
              />
            </div>

            {/* 🟢 사이드바 토글 버튼 - 오른쪽 */}
            <div className="relative z-[3] shrink-0">
              <ToggleSidebar
                overlay={false}
                controlledOpen={props.sidebarOpen}
                onChangeOpen={(open) => {
                  props.setSidebarOpen(open);
                  if (open) props.setRightOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      </Portal>

      {/* ✅ 편의시설 안내 모달 (Dialog 사용) */}
      <Dialog open={poiWarningOpen} onOpenChange={setPoiWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>편의시설 보기</DialogTitle>
            <DialogDescription asChild>
              <p className="mt-1 text-sm leading-relaxed">
                편의시설(지하철, 학교, 편의점, 카페, 약국)은
                <br />
                지도 축척이 <b>50m 이상으로 확대</b>되었을 때만 표시됩니다.
                <br /> <br />
                지도를 조금 더 확대한 뒤 다시 시도해 주세요.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setPoiWarningOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
            >
              확인
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
