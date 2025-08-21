"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/atoms/Card/Card";
import type { LatLng, MapMarker } from "@/features/properties/types/map";
import MapView from "../components/MapView/MapView";
import type { PropertyItem } from "../types/propertyItem";
import TopRightButtons from "../components/top/TopRightButtons";
import MapQuickControls from "../components/top/MapQuickControls";
import type { AdvFilters } from "@/features/properties/types/advFilters";
import MapTopBar, { FilterKey } from "../components/top/MapTopBar";
import { CreatePayload, PropertyViewDetails } from "../types/property-domain";
import PropertyCreateModal from "../components/modal/PropertyCreateModal/PropertyCreateModal";
import PropertyViewModal from "../components/modal/PropertyViewModal/PropertyViewModal";
import PinContextMenu from "../components/MapView/PinContextMenu/PinContextMenu";

const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "YOUR_KEY";

const STORAGE_KEY = "properties";

const MapHomePage: React.FC = () => {
  const [favOpen, setFavOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [kakaoSDK, setKakaoSDK] = useState<any>(null);
  const [menuAddress, setMenuAddress] = useState<string | null>(null);
  const [fitAllOnce, setFitAllOnce] = useState(true);
  const geocoderRef = useRef<any>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [prefillAddress, setPrefillAddress] = useState<string | undefined>(
    undefined
  );
  const [viewOpen, setViewOpen] = useState(false);

  const [draftPin, setDraftPin] = useState<LatLng | null>(null);

  // 메뉴(핀 위·오른쪽)
  const [menuAnchor, setMenuAnchor] = useState<LatLng | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTargetId, setMenuTargetId] = useState<string | null>(null);

  // 지도 상태
  const [useDistrict, setUseDistrict] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 기본 검색/필터
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
  const [fabOpen, setFabOpen] = useState(false);

  // 데이터
  const [items, setItems] = useState<PropertyItem[]>(loadProperties);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    saveProperties(items);
  }, [items]);

  // 파생
  const filtered = useMemo(() => {
    return items.filter((p) => {
      const qq = query.trim().toLowerCase();
      const matchQ =
        !qq ||
        p.title.toLowerCase().includes(qq) ||
        (p.address?.toLowerCase().includes(qq) ?? false);
      const matchType = type === "all" || p.type === type;
      const matchStatus = status === "all" || p.status === status;
      return matchQ && matchType && matchStatus;
    });
  }, [items, query, type, status]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    const base = filtered.map((p) => ({
      id: p.id,
      title: p.title,
      position: { lat: p.position.lat, lng: p.position.lng },
    }));
    if (draftPin) {
      base.unshift({
        id: "__draft__", // 임시 ID
        title: "신규 등록 위치",
        position: { lat: draftPin.lat, lng: draftPin.lng },
      });
    }
    return base;
  }, [filtered, draftPin]);

  const selected = useMemo(
    () => items.find((x) => x.id === selectedId) ?? null,
    [items, selectedId]
  );

  // 기존의 merge 로직 대신 어댑터 사용
  const selectedViewItem = useMemo(() => {
    if (!selected) return null;
    const extra = (selected as any).view ?? {};
    return { ...toViewDetails(selected), ...extra } as PropertyViewDetails;
  }, [selected]);

  // 지도 센터
  const [fixedCenter] = useState<LatLng>({ lat: 37.5665, lng: 126.978 });

  const handleToggleDistrict = useCallback(() => {
    setUseDistrict((prev) => {
      const next = !prev;
      if (next) setDrawerOpen(true);
      return next;
    });
  }, []);

  const resolveAddress = useCallback(async (latlng: LatLng) => {
    try {
      const kakao = (window as any).kakao;
      if (!kakao) return null;
      if (!geocoderRef.current) {
        geocoderRef.current = new kakao.maps.services.Geocoder();
      }
      const geocoder = geocoderRef.current as any;

      const coord = new kakao.maps.LatLng(latlng.lat, latlng.lng);
      const addr: string | null = await new Promise((resolve) => {
        geocoder.coord2Address(
          coord.getLng(),
          coord.getLat(),
          (res: any, status: any) => {
            if (status === kakao.maps.services.Status.OK && res?.[0]) {
              const r0 = res[0];
              const road = r0.road_address?.address_name;
              const jibun = r0.address?.address_name;
              resolve(road || jibun || null);
            } else {
              resolve(null);
            }
          }
        );
      });
      return addr;
    } catch {
      return null;
    }
  }, []);

  function applyPatchToItem(
    p: PropertyItem,
    patch: Partial<PropertyViewDetails>
  ): PropertyItem {
    return {
      ...p,
      // 헤더(상태/제목/주소/가격)
      status: (patch as any).status ?? p.status,
      dealStatus: (patch as any).dealStatus ?? (p as any).dealStatus,
      title: patch.title ?? p.title,
      address: patch.address ?? p.address,
      priceText: patch.jeonsePrice ?? p.priceText,

      // 상세 보기 필드
      view: {
        ...(p as any).view,

        // 미디어/메모/연락처
        images: patch.images ?? (p as any).view?.images,
        publicMemo: patch.publicMemo ?? (p as any).view?.publicMemo,
        secretMemo: patch.secretMemo ?? (p as any).view?.secretMemo,
        officePhone: (patch as any).officePhone ?? (p as any).view?.officePhone,
        officePhone2:
          (patch as any).officePhone2 ?? (p as any).view?.officePhone2,

        // 옵션/등기/구조별
        options: patch.options ?? (p as any).view?.options,
        optionEtc: patch.optionEtc ?? (p as any).view?.optionEtc,
        registry: (patch as any).registry ?? (p as any).view?.registry,
        unitLines: patch.unitLines ?? (p as any).view?.unitLines,

        // 설비/주차
        elevator: patch.elevator ?? (p as any).view?.elevator,
        parkingType: patch.parkingType ?? (p as any).view?.parkingType,
        parkingGrade:
          (patch as any).parkingGrade ?? (p as any).view?.parkingGrade,

        // 등급
        slopeGrade: patch.slopeGrade ?? (p as any).view?.slopeGrade,
        structureGrade: patch.structureGrade ?? (p as any).view?.structureGrade,

        // 향 (신규 필드) + 하위호환
        aspect: (patch as any).aspect ?? (p as any).view?.aspect,
        aspectNo: (patch as any).aspectNo ?? (p as any).view?.aspectNo,
        aspect1: (patch as any).aspect1 ?? (p as any).view?.aspect1,
        aspect2: (patch as any).aspect2 ?? (p as any).view?.aspect2,
        aspect3: (patch as any).aspect3 ?? (p as any).view?.aspect3,

        // 단지 숫자들
        totalBuildings:
          (patch as any).totalBuildings ?? (p as any).view?.totalBuildings,
        totalFloors: (patch as any).totalFloors ?? (p as any).view?.totalFloors,
        totalHouseholds:
          patch.totalHouseholds ?? (p as any).view?.totalHouseholds,
        remainingHouseholds:
          (patch as any).remainingHouseholds ??
          (p as any).view?.remainingHouseholds,

        // 날짜/면적
        completionDate: patch.completionDate ?? (p as any).view?.completionDate,
        exclusiveArea: patch.exclusiveArea ?? (p as any).view?.exclusiveArea,
        realArea: patch.realArea ?? (p as any).view?.realArea,

        // 보기 쪽에서 dealStatus를 참조할 수도 있으니 동기화
        dealStatus: (patch as any).dealStatus ?? (p as any).view?.dealStatus,
      },
    };
  }

  function toViewDetails(p: PropertyItem): PropertyViewDetails {
    const v = (p as any).view ?? {};

    const ori: { ho: number; value: string }[] = Array.isArray(v.orientations)
      ? [...v.orientations].map((o: any) => ({
          ho: Number(o.ho),
          value: String(o.value),
        }))
      : [];

    const pick = (ho: number) => ori.find((o) => o.ho === ho)?.value;

    const a1 =
      pick(1) ??
      v.aspect1 ??
      (v.aspectNo === "1호" ? v.aspect : undefined) ??
      "남";
    const a2 =
      pick(2) ??
      v.aspect2 ??
      (v.aspectNo === "2호" ? v.aspect : undefined) ??
      "북";
    const a3 =
      pick(3) ??
      v.aspect3 ??
      (v.aspectNo === "3호" ? v.aspect : undefined) ??
      "남동";

    return {
      // 기본 식별/표시 필드
      status: (p.status as any) ?? "공개",
      dealStatus: (p as any).dealStatus ?? "분양중",
      title: p.title,
      address: p.address ?? "",
      type: (p.type as any) ?? "주택",
      jeonsePrice: p.priceText ?? "",

      // 선택/예비 필드(없으면 보기에서 기본값으로 보이도록)
      images: [], // p에 이미지 없으니 일단 빈 배열
      options: [], // 보기에서 기본 3개(에어컨/냉장고/세탁기) 강제 노출됨
      optionEtc: "",
      registry: "주택",
      unitLines: [],

      elevator: "O",
      parkingType: "답사지 확인",
      completionDate: undefined,

      aspect1: a1,
      aspect2: a2,
      aspect3: a3,

      totalBuildings: 2,
      totalFloors: 10,
      totalHouseholds: 50,
      remainingHouseholds: 10,

      slopeGrade: "상",
      structureGrade: "상",

      publicMemo: "",
      secretMemo: "",

      // 메타(임시)
      createdByName: "여준호",
      createdAt: "2025-08-16 09:05",
      inspectedByName: "홍길동",
      inspectedAt: "2025.08.16 10:30",
      updatedByName: "이수정",
      updatedAt: "2025/08/16 11:40",
    };
  }

  function normalizeLoaded(value: unknown): PropertyItem[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return Array.isArray(value[0])
        ? (value[0] as any[]).concat((value as any[]).slice(1))
        : (value as PropertyItem[]);
    }
    if (typeof value === "object") {
      const obj = value as Record<string, any>;
      const keys = Object.keys(obj).filter((k) => /^\d+$/.test(k));
      if (keys.length) {
        keys.sort((a, b) => +a - +b);
        return keys.map((k) => obj[k]) as PropertyItem[];
      }
    }
    return [];
  }

  function loadProperties(): PropertyItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const arr = normalizeLoaded(parsed);

      return arr.map((p: any) => ({
        ...p,
        view: p.view
          ? {
              ...p.view,
              registry:
                typeof p.view.registry === "string" ? p.view.registry : "주택",
            }
          : undefined,
      })) as PropertyItem[];
    } catch {
      return [];
    }
  }

  function saveProperties(items: PropertyItem[]) {
    const plain = items.map((p) => ({
      ...p,
      view: p.view
        ? {
            ...p.view,
            // 혹시 잘못 들어온 형태를 방지
            registry:
              typeof (p as any).view?.registry === "string"
                ? (p as any).view?.registry
                : "주택",
          }
        : undefined,
    }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plain));
  }

  useEffect(() => {
    // 얕은 복사로 순수 POJO 보장(Proxy/희박배열 방지용)
    const plain = items.map((p) => ({
      ...p,
      view: p.view
        ? {
            ...p.view,
            registry:
              typeof (p as any).view?.registry === "string"
                ? (p as any).view?.registry
                : "주택",
          }
        : undefined,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plain));
  }, [items]);

  return (
    <div className="fixed inset-0">
      {/* 지도 */}
      <div className="absolute inset-0">
        <MapView
          appKey={KAKAO_MAP_KEY}
          center={fixedCenter}
          level={5}
          markers={mapMarkers}
          fitToMarkers={fitAllOnce}
          useDistrict={useDistrict}
          showNativeLayerControl={false}
          controlRightOffsetPx={32}
          controlTopOffsetPx={10}
          onMarkerClick={async (id) => {
            if (id === "__draft__") return;
            const item = items.find((p) => p.id === id);
            if (!item) return;

            setMenuTargetId(id);
            setSelectedId(id);
            setDraftPin(null);
            setFitAllOnce(false);

            setMenuAnchor(item.position);
            setMenuAddress(item.address ?? null);
            setMenuOpen(true);

            if (!item.address) {
              const addr = await resolveAddress(item.position);
              setMenuAddress((prev) => prev ?? addr ?? null);
            }
          }}
          onMapClick={async (latlng) => {
            setSelectedId(null);
            setMenuTargetId(null);
            setDraftPin(latlng);
            setFitAllOnce(false);

            setMenuAnchor(latlng);
            setMenuAddress("선택 위치");
            setMenuOpen(true);

            const addr = await resolveAddress(latlng);
            setMenuAddress(addr || "선택 위치");
          }}
          onMapReady={({ kakao, map }) => {
            setKakaoSDK(kakao);
            setMapInstance(map);
            requestAnimationFrame(() => setFitAllOnce(false));
            setTimeout(() => {
              map.relayout?.();
              kakao.maps.event.trigger(map, "resize");
            }, 0);
          }}
        />

        {mapInstance && kakaoSDK && menuAnchor && menuOpen && (
          <PinContextMenu
            key={`${menuAnchor.lat},${menuAnchor.lng}-${
              menuTargetId ?? "draft"
            }`}
            kakao={kakaoSDK}
            map={mapInstance}
            position={menuAnchor}
            address={menuAddress ?? undefined}
            propertyId={menuTargetId ?? undefined}
            onClose={() => {
              setMenuOpen(false);
              if (!menuTargetId) {
                // 신규핀일 때만 핀/앵커/주소 같이 정리
                setDraftPin(null);
                setMenuAnchor(null);
                setMenuAddress(null);
              }
            }}
            onView={(id) => {
              setSelectedId(id);
              setMenuOpen(false);
              setViewOpen(true);
            }}
            onCreate={() => {
              setMenuOpen(false);
              setPrefillAddress(menuAddress ?? undefined);
              setCreateOpen(true);
            }}
            offsetX={12}
            offsetY={-12}
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
          console.log("search:", v);
        }}
      />

      {/* 지적편집도 */}
      <MapQuickControls
        isDistrictOn={useDistrict}
        onToggleDistrict={handleToggleDistrict}
        offsetTopPx={12}
      />

      {/* 우상단: K&N/즐겨찾기 */}
      <TopRightButtons
        onOpenKN={() => {
          if (!selectedId && filtered[0]) setSelectedId(filtered[0].id);
          setViewOpen(true);
        }}
        onOpenFavorites={() => setFavOpen(true)}
        mapTypeOffsetTop={72}
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

      {/* 모달들 */}
      {viewOpen && selectedViewItem && (
        <PropertyViewModal
          open={true}
          onClose={() => setViewOpen(false)}
          item={selectedViewItem}
          onSave={async (patch) => {
            setItems((prev) =>
              prev.map((p) =>
                p.id === selectedId ? applyPatchToItem(p, patch) : p
              )
            );
          }}
          onDelete={async () => {
            setItems((prev) => prev.filter((p) => p.id !== selectedId));
            setViewOpen(false);
            setSelectedId(null);
          }}
        />
      )}

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
        onSubmit={(payload: CreatePayload) => {
          const id = `${Date.now()}`;
          const pos = draftPin ??
            (selected ? selected.position : undefined) ?? {
              lat: 37.5665,
              lng: 126.978,
            };

          const orientations = (payload.orientations ?? [])
            .map((o) => ({ ho: Number(o.ho), value: o.value })) // 숫자 보정
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

          const next: PropertyItem = {
            id,
            title: payload.title,
            address: payload.address,
            priceText: payload.jeonsePrice ?? undefined,
            status: payload.status, // 게시상태(공개/보류/비공개)
            dealStatus: payload.dealStatus,
            type: "아파트",
            position: pos,
            favorite: false,
            view: {
              // 연락처 (보기에서 필요시 표시)
              officePhone: payload.officePhone,
              officePhone2: payload.officePhone2,

              // 시설/주차
              elevator: payload.elevator,
              parkingType: payload.parkingType,
              parkingGrade: payload.parkingGrade,

              // 날짜/면적
              completionDate: payload.completionDate,
              exclusiveArea: payload.exclusiveArea,
              realArea: payload.realArea,

              // 단지 정보 (CreatePayload에 없으면 any 캐스팅)
              totalBuildings: (payload as any).totalBuildings,
              totalFloors: (payload as any).totalFloors,
              totalHouseholds: payload.totalHouseholds,
              remainingHouseholds: (payload as any).remainingHouseholds,

              // 향
              orientations,
              aspect: payload.aspect,
              aspectNo: payload.aspectNo,

              // 등급
              slopeGrade: payload.slopeGrade,
              structureGrade: payload.structureGrade,

              // 옵션
              options: payload.options,
              optionEtc: payload.optionEtc,

              // 등기/구조별
              registry:
                typeof (payload as any).registry === "string"
                  ? (payload as any).registry
                  : "주택",
              unitLines: payload.unitLines,

              // 메모/이미지
              publicMemo: payload.publicMemo,
              secretMemo: payload.secretMemo,
              images: payload.images,

              // (선택) 보기 로직에서 참조한다면 중복 저장
              dealStatus: payload.dealStatus,

              aspect1,
              aspect2,
              aspect3,
            },
          };

          setItems((prev) => [next, ...prev]);
          setSelectedId(id);
          setMenuTargetId(id);
          setDraftPin(null);
          setPrefillAddress(undefined);
          setCreateOpen(false);
        }}
      />
    </div>
  );
};

export default MapHomePage;
