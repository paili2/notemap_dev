"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/atoms/Card/Card";
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
import { hydrateRefsToMedia, materializeToRefs } from "./lib/idbMedia";
import { applyPatchToItem, toViewDetails } from "@/features/map/lib/view";
import { distanceMeters } from "./utils/distance";
import { persistToLocalStorage } from "@/features/map/utils/storage";
import {
  usePanToWithOffset,
  useResolveAddress,
} from "@/features/map/hooks/useKakaoTools";
import { useViewportPost } from "@/features/map/hooks/useViewportPost";

const STORAGE_KEY = "properties";

/** ========================= 컴포넌트 ========================= */
const MapHomePage: React.FC = () => {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [kakaoSDK, setKakaoSDK] = useState<any>(null);
  const [menuRoadAddr, setMenuRoadAddr] = useState<string | null>(null);
  const [menuJibunAddr, setMenuJibunAddr] = useState<string | null>(null);
  const [fitAllOnce, setFitAllOnce] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [prefillAddress, setPrefillAddress] = useState<string | undefined>();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [draftPin, setDraftPin] = useState<LatLng | null>(null);

  const [menuAnchor, setMenuAnchor] = useState<LatLng | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTargetId, setMenuTargetId] = useState<string | null>(null);

  const [useDistrict, setUseDistrict] = useState<boolean>(false);
  const [useSidebar, setUseSidebar] = useState<boolean>(false);

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

  // ✅ 뷰포트 POST 훅
  const { sendViewportQuery } = useViewportPost();

  // FilterSearch 모달 상태 (khj 브랜치 추가)
  const [filterSearchOpen, setFilterSearchOpen] = useState(false);

  // 1) 최초 로드: localStorage → items  (⟵ runSearch보다 위!)
  const [items, setItems] = useState<PropertyItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as PropertyItem[]) : [];
    } catch {
      return [];
    }
  });

  // 2) 수화 (IndexedDB refs → blob/url)
  useEffect(() => {
    (async () => {
      if (!items.length) return;

      const hydrated = await Promise.all(
        items.map(async (p) => {
          const v: any = (p as any).view ?? {};
          const cardRefs = Array.isArray(v._imageCardRefs)
            ? v._imageCardRefs
            : [];
          const fileRefs = Array.isArray(v._fileItemRefs)
            ? v._fileItemRefs
            : [];

          if (!cardRefs.length && !fileRefs.length) return p;

          const { hydratedCards, hydratedFiles } = await hydrateRefsToMedia(
            cardRefs,
            fileRefs
          );

          return {
            ...p,
            view: {
              ...v,
              imageCards: hydratedCards,
              images: hydratedCards.flat(),
              fileItems: hydratedFiles,
            },
          } as PropertyItem;
        })
      );

      setItems(hydrated);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3) 저장
  useEffect(() => {
    persistToLocalStorage(STORAGE_KEY, items);
  }, [items]);

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
  const mapMarkers: MapMarker[] = useMemo(() => {
    const base = filtered.map((p) => ({
      id: p.id,
      title: p.title,
      position: { lat: p.position.lat, lng: p.position.lng },
      kind: ((p as any).pinKind ??
        (p as any).markerKind ??
        (p as any).kind ??
        (p as any).view?.pinKind ??
        "1room") as any,
    }));
    if (draftPin) {
      base.unshift({
        id: "__draft__",
        title: "신규 등록 위치",
        position: { lat: draftPin.lat, lng: draftPin.lng },
        kind: (draftPin as any).pinKind ?? "question",
      } as any);
    }
    return base;
  }, [filtered, draftPin]);

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

  /** 지도 관련 */
  const [fixedCenter] = useState<LatLng>({ lat: 37.5665, lng: 126.978 });

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

  // ── 검색 (주소→좌표, 실패 시 키워드) ──  (⟵ items, openMenuForExistingPin 이후!)
  const runSearch = useCallback(
    async (keyword: string) => {
      if (!kakaoSDK || !mapInstance || !keyword.trim()) return;
      const geocoder = new kakaoSDK.maps.services.Geocoder();
      const places = new kakaoSDK.maps.services.Places();

      const afterLocate = async (lat: number, lng: number) => {
        const coords = { lat, lng };

        // 근접 기존 핀 자동 매칭 (35m)
        const THRESHOLD_M = 35;
        let nearest: PropertyItem | null = null;
        let best = Infinity;
        for (const p of items) {
          const d = distanceMeters(coords, p.position);
          if (d < THRESHOLD_M && d < best) {
            best = d;
            nearest = p;
          }
        }
        if (nearest) {
          await openMenuForExistingPin(nearest);
        } else {
          setDraftPin(coords); // draftPin effect가 메뉴 자동 오픈
        }

        const center = new kakaoSDK.maps.LatLng(lat, lng);
        mapInstance.setCenter(center);
        mapInstance.setLevel(Math.min(5, 11));
        kakaoSDK.maps.event.trigger(mapInstance, "idle");
        requestAnimationFrame(() =>
          kakaoSDK.maps.event.trigger(mapInstance, "idle")
        );
      };

      await new Promise<void>((resolve) => {
        geocoder.addressSearch(
          keyword,
          async (addrResult: any[], addrStatus: string) => {
            if (
              addrStatus === kakaoSDK.maps.services.Status.OK &&
              addrResult?.length
            ) {
              const r0 = addrResult[0];
              const lat = parseFloat(
                (r0.road_address?.y ?? r0.address?.y ?? r0.y) as string
              );
              const lng = parseFloat(
                (r0.road_address?.x ?? r0.address?.x ?? r0.x) as string
              );
              await afterLocate(lat, lng);
              resolve();
            } else {
              places.keywordSearch(
                keyword,
                async (kwResult: any[], kwStatus: string) => {
                  if (
                    kwStatus === kakaoSDK.maps.services.Status.OK &&
                    kwResult?.length
                  ) {
                    const r0 = kwResult[0];
                    await afterLocate(parseFloat(r0.y), parseFloat(r0.x));
                  } else {
                    alert("검색 결과가 없습니다.");
                  }
                  resolve();
                }
              );
            }
          }
        );
      });
    },
    [kakaoSDK, mapInstance, items, openMenuForExistingPin]
  );

  // 🔥 신규핀(draftPin) 생기면 자동으로 컨텍스트메뉴 열기
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
    // 신규핀도 화면에 보기 좋게 이동
    panToWithOffset(draftPin, 180);

    if (kakaoSDK && mapInstance) {
      kakaoSDK.maps.event.trigger(mapInstance, "idle");
      requestAnimationFrame(() =>
        kakaoSDK.maps.event.trigger(mapInstance, "idle")
      );
    }
  }, [draftPin, resolveAddress, kakaoSDK, mapInstance, panToWithOffset]);

  const markerClickShieldRef = useRef(0);
  const handleMarkerClick = useCallback(
    async (id: string) => {
      markerClickShieldRef.current = Date.now();
      if (id === "__draft__") return;
      const item = items.find((p) => p.id === id);
      if (!item) return;

      // ✅ 클릭한 핀으로 지도 이동 (말풍선 고려해 위로 약간 올림)
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

  const handleMapClick = useCallback(
    async (latlng: LatLng) => {
      if (Date.now() - markerClickShieldRef.current < 250) return;

      // ✅ 빈 지도 클릭으로 신규핀 생성 시에도 카메라 이동
      panToWithOffset(latlng, 180);

      setSelectedId(null);
      setMenuTargetId(null);
      setDraftPin(latlng);
      setFitAllOnce(false);
      setMenuAnchor(latlng);

      const { road, jibun } = await resolveAddress(latlng);
      setMenuRoadAddr(road ?? null);
      setMenuJibunAddr(jibun ?? null);

      setMenuOpen(true);
    },
    [resolveAddress, panToWithOffset]
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
          center={fixedCenter}
          level={4}
          markers={mapMarkers}
          fitToMarkers={fitAllOnce}
          useDistrict={useDistrict}
          showNativeLayerControl={false}
          controlRightOffsetPx={32}
          controlTopOffsetPx={10}
          onMarkerClick={handleMarkerClick}
          onMapClick={handleMapClick}
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

      {/* 좌상단 선택 미니 카드 */}
      <div className="absolute left-3 top-3 z-20">
        {selected && (
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">
                선택됨: {selected.title}
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

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

      {/* 모달들 */}
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

      {createOpen && (
        <PropertyCreateModal
          open={createOpen}
          key={prefillAddress ?? "blank"}
          initialAddress={prefillAddress}
          onClose={() => {
            setCreateOpen(false);
            setDraftPin(null);
            setPrefillAddress(undefined);
            setMenuOpen(false);
          }}
          onSubmit={async (payload: CreatePayload) => {
            const id = `${Date.now()}`;
            const pos = draftPin ??
              (selected ? selected.position : undefined) ?? {
                lat: 37.5665,
                lng: 126.978,
              };

            const orientations = (payload.orientations ?? [])
              .map((o) => ({ ho: Number(o.ho), value: o.value }))
              .sort((a, b) => a.ho - b.ho);

            const pick = (ho: number) =>
              orientations.find((o) => o.ho === ho)?.value;
            const aspect1 =
              pick(1) ??
              (payload.aspectNo === "1호" ? payload.aspect : undefined);
            const aspect2 =
              pick(2) ??
              (payload.aspectNo === "2호" ? payload.aspect : undefined);
            const aspect3 =
              pick(3) ??
              (payload.aspectNo === "3호" ? payload.aspect : undefined);

            const refsCardsRaw = Array.isArray((payload as any).imageFolders)
              ? ((payload as any).imageFolders as any[][])
              : undefined;
            const refsFilesRaw = Array.isArray((payload as any).verticalImages)
              ? ((payload as any).verticalImages as any[])
              : undefined;

            const cardsUiRaw =
              (payload as any).imageCards ??
              (payload as any).imagesByCard ??
              (Array.isArray((payload as any).images)
                ? [(payload as any).images]
                : []);
            const filesUiRaw = (payload as any).fileItems;

            const cardsInput = refsCardsRaw ?? cardsUiRaw;
            const filesInput = refsFilesRaw ?? filesUiRaw;

            // 저장 + 한 번에 수화
            const { cardRefs, fileRefs } = await materializeToRefs(
              id,
              cardsInput,
              filesInput
            );
            const { hydratedCards, hydratedFiles } = await hydrateRefsToMedia(
              cardRefs,
              fileRefs
            );

            const next: PropertyItem = {
              id,
              title: payload.title,
              address: payload.address,
              priceText: payload.salePrice ?? undefined,
              status: (payload as any).status,
              dealStatus: (payload as any).dealStatus,
              type: "아파트",
              position: pos,
              favorite: false,
              ...((payload as any).pinKind
                ? ({ pinKind: (payload as any).pinKind } as any)
                : ({} as any)),
              view: {
                officePhone: (payload as any).officePhone,
                officePhone2: (payload as any).officePhone2,
                listingStars: payload.listingStars ?? 0,
                elevator: payload.elevator,
                parkingType: payload.parkingType,
                parkingCount: payload.parkingCount,
                completionDate: payload.completionDate,
                exclusiveArea: payload.exclusiveArea,
                realArea: payload.realArea,
                extraExclusiveAreas: (payload as any).extraExclusiveAreas ?? [],
                extraRealAreas: (payload as any).extraRealAreas ?? [],
                totalBuildings: (payload as any).totalBuildings,
                totalFloors: (payload as any).totalFloors,
                totalHouseholds: payload.totalHouseholds,
                remainingHouseholds: (payload as any).remainingHouseholds,
                orientations,
                aspect: payload.aspect,
                aspectNo: payload.aspectNo,
                slopeGrade: payload.slopeGrade,
                structureGrade: payload.structureGrade,
                options: payload.options,
                optionEtc: payload.optionEtc,
                registry:
                  typeof (payload as any).registry === "string"
                    ? (payload as any).registry
                    : "주택",
                unitLines: payload.unitLines,
                publicMemo: payload.publicMemo,
                secretMemo: payload.secretMemo,
                ...((payload as any).pinKind
                  ? ({ pinKind: (payload as any).pinKind } as any)
                  : ({} as any)),
                baseAreaTitle:
                  (payload as any).baseAreaTitle ??
                  (payload as any).areaSetTitle ??
                  "",
                extraAreaTitles:
                  (payload as any).extraAreaTitles ??
                  (payload as any).areaSetTitles ??
                  [],
                _imageCardRefs: cardRefs,
                _fileItemRefs: fileRefs,
                imageCards: hydratedCards,
                images: hydratedCards.flat(),
                fileItems: hydratedFiles,
                aspect1,
                aspect2,
                aspect3,
              },
            };

            setItems((prev) => [next, ...prev]);
            setSelectedId(id);
            setViewOpen(true);
            setMenuTargetId("draft");
            setDraftPin(null);
            setPrefillAddress(undefined);
            setCreateOpen(false);
          }}
        />
      )}
      {editOpen && selectedViewItem && (
        <PropertyEditModal
          open={true}
          initialData={selectedViewItem}
          onClose={() => setEditOpen(false)}
          onSubmit={async (payload) => {
            const patch: Partial<PropertyViewDetails> & { pinKind?: string } = {
              id: (payload as any).id,
              title: (payload as any).title,
              address: (payload as any).address,
              officePhone: (payload as any).officePhone,
              officePhone2: (payload as any).officePhone2,
              salePrice: (payload as any).salePrice,
              listingStars: (payload as any).listingStars,
              elevator: (payload as any).elevator,
              parkingType: (payload as any).parkingType,
              parkingCount: (payload as any).parkingCount,
              completionDate: (payload as any).completionDate,
              exclusiveArea: (payload as any).exclusiveArea,
              realArea: (payload as any).realArea,
              extraExclusiveAreas: (payload as any).extraExclusiveAreas,
              extraRealAreas: (payload as any).extraRealAreas,
              totalBuildings: (payload as any).totalBuildings,
              totalFloors: (payload as any).totalFloors,
              totalHouseholds: (payload as any).totalHouseholds,
              remainingHouseholds: (payload as any).remainingHouseholds,
              orientations: (payload as any).orientations,
              aspect: (payload as any).aspect,
              aspectNo: (payload as any).aspectNo,
              aspect1: (payload as any).aspect1,
              aspect2: (payload as any).aspect2,
              aspect3: (payload as any).aspect3,
              slopeGrade: (payload as any).slopeGrade,
              structureGrade: (payload as any).structureGrade,
              options: (payload as any).options,
              optionEtc: (payload as any).optionEtc,
              registry: (payload as any).registry,
              unitLines: (payload as any).unitLines,
              publicMemo: (payload as any).publicMemo,
              secretMemo: (payload as any).secretMemo,
              images: (payload as any).images,
              pinKind: (payload as any).pinKind,

              // ✅ 면적 세트 제목들 추가 (호환 키 포함)
              baseAreaTitle:
                (payload as any).baseAreaTitle ??
                (payload as any).areaTitle ??
                (payload as any).areaSetTitle ??
                "",
              extraAreaTitles:
                (payload as any).extraAreaTitles ??
                (payload as any).areaSetTitles ??
                [],
            };

            const cardsFromPayload =
              (payload as any).imageCards ?? (payload as any).imagesByCard;
            if (Array.isArray(cardsFromPayload)) {
              (patch as any).imageCards = cardsFromPayload;
            } else if (Array.isArray((payload as any).images)) {
              (patch as any).imageCards = [(payload as any).images];
            }
            if (Array.isArray((payload as any).fileItems)) {
              (patch as any).fileItems = (payload as any).fileItems;
            }

            // 저장 + 한 번에 수화
            try {
              const propertyId = String(
                (payload as any).id ?? selectedId ?? ""
              );
              const refsCardsRaw = Array.isArray((payload as any).imageFolders)
                ? ((payload as any).imageFolders as any[][])
                : (patch as any).imageCards ?? [];
              const refsFilesRaw = Array.isArray(
                (payload as any).verticalImages
              )
                ? ((payload as any).verticalImages as any[])
                : (patch as any).fileItems ?? [];

              const { cardRefs, fileRefs } = await materializeToRefs(
                propertyId,
                refsCardsRaw,
                refsFilesRaw
              );
              const { hydratedCards, hydratedFiles } = await hydrateRefsToMedia(
                cardRefs,
                fileRefs
              );

              (patch as any)._imageCardRefs = cardRefs;
              (patch as any)._fileItemRefs = fileRefs;

              if (hydratedCards.length) {
                (patch as any).imageCards = hydratedCards;
                (patch as any).images = hydratedCards.flat();
              }
              if (hydratedFiles.length) {
                (patch as any).fileItems = hydratedFiles;
              }
            } catch (e) {
              console.warn("[edit] materialize/hydrate 실패:", e);
            }

            setItems((prev) =>
              prev.map((p) =>
                p.id === selectedId ? applyPatchToItem(p, patch) : p
              )
            );
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default MapHomePage;
