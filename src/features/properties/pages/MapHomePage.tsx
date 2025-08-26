"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/atoms/Card/Card";
import type { LatLng, MapMarker } from "@/features/map/types/map";
import MapView from "../../map/MapView/MapView";
import type { PropertyItem } from "../types/propertyItem";
import TopRightButtons from "../../map/top/TopRightButtons/TopRightButtons";
import MapQuickControls from "../../map/top/MapQuickControls/MapQuickControls";
import type { AdvFilters } from "@/features/properties/types/advFilters";

import PropertyCreateModal from "../components/modal/PropertyCreateModal/PropertyCreateModal";
import PropertyViewModal from "../components/modal/PropertyViewModal/PropertyViewModal";
import PinContextMenu from "../../map/PinContextMenu/PinContextMenu";
import { PropertyViewDetails } from "../types/property-view";
import { CreatePayload } from "../types/property-dto";
import { FilterKey } from "@/features/map/top/MapTopBar/types";
import MapTopBar from "@/features/map/top/MapTopBar/MapTopBar";

// === 거리 유틸 & 근접 매물 찾기 ===
type LL = { lat: number; lng: number };

function distanceMeters(a: LL, b: LL) {
  const R = 6371000; // m
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

/** target에서 가장 가까운 매물(임계값 m 이내만 인정) 찾기 */
function findNearestItem(
  target: LL,
  items: PropertyItem[],
  maxMeters = 30 // ← 필요시 20~50m로 조정
) {
  if (!items?.length) return null;
  let best: { item: PropertyItem; dist: number } | null = null;
  for (const it of items) {
    const d = distanceMeters(target, it.position);
    if (!best || d < best.dist) best = { item: it, dist: d };
  }
  return best && best.dist <= maxMeters ? best : null;
}

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
      images: [],
      options: [],
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

  const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

  // ✅ 마커 클릭 쉴드: 마커 클릭 직후 지도 클릭 무시
  const markerClickShieldRef = useRef(0);

  const handleMarkerClick = useCallback(
    async (id: string) => {
      markerClickShieldRef.current = Date.now(); // 마커 클릭 시각 기록

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
    },
    [items, resolveAddress]
  );

  const handleMapClick = useCallback(
    async (latlng: LatLng) => {
      // 마커 클릭 직후 250ms 내 지도 클릭은 무시 (버블/연속 클릭 방지)
      if (Date.now() - markerClickShieldRef.current < 250) return;

      setSelectedId(null);
      setMenuTargetId(null);
      setDraftPin(latlng);
      setFitAllOnce(false);

      setMenuAnchor(latlng);
      setMenuAddress("선택 위치");
      setMenuOpen(true);

      const addr = await resolveAddress(latlng);
      setMenuAddress(addr || "선택 위치");
    },
    [resolveAddress]
  );

  if (!KAKAO_MAP_KEY) {
    return (
      <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
        NEXT_PUBLIC_KAKAO_JS_KEY 환경변수가 설정되지 않았습니다. (Vercel
        프로젝트 환경변수에 추가 후 재배포 필요)
      </div>
    );
  }

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
          onMarkerClick={handleMarkerClick} // ✅ 쉴드 적용 핸들러
          onMapClick={handleMapClick} // ✅ 쉴드 적용 핸들러
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
        onSubmitSearch={async (v) => {
          if (!v.trim()) return;
          const kakao = (window as any).kakao;
          if (!kakao) return;

          if (!geocoderRef.current) {
            geocoderRef.current = new kakao.maps.services.Geocoder();
          }
          const geocoder = geocoderRef.current as any;

          const looksLikeJibeon =
            /(?:산\s*)?\d+-?\d*/.test(v) || /동\s*\d+/.test(v);

          geocoder.addressSearch(v, async (result: any[], status: string) => {
            if (status !== kakao.maps.services.Status.OK || !result?.[0]) {
              alert("주소를 찾을 수 없어요.");
              return;
            }

            const r0 = result[0];

            // 1) 지번 좌표 우선: 사용자가 지번을 입력했거나, road_address가 빈 경우
            const pick =
              looksLikeJibeon && r0.address
                ? r0.address
                : r0.road_address || r0.address;

            // 좌표 선택 (x=lng, y=lat)
            let latlng = {
              lat: parseFloat(pick.y ?? r0.y),
              lng: parseFloat(pick.x ?? r0.x),
            };

            // 2) 역지오코딩으로 표시 주소 정규화
            const normAddr: { road?: string; jibun?: string } = {};
            await new Promise<void>((resolve) => {
              geocoder.coord2Address(
                latlng.lng,
                latlng.lat,
                (res: any, s: string) => {
                  if (s === kakao.maps.services.Status.OK && res?.[0]) {
                    normAddr.road =
                      res[0].road_address?.address_name || undefined;
                    normAddr.jibun = res[0].address?.address_name || undefined;
                  }
                  resolve();
                }
              );
            });

            // 3) 기존 매물 근접 여부 (산지/필지 오차 고려 50m 권장)
            let nearest: { item: PropertyItem; dist: number } | null = null;
            for (const it of items) {
              const d = distanceMeters(latlng, it.position);
              if (!nearest || d < nearest.dist) nearest = { item: it, dist: d };
            }

            // 공통 초기화
            setSelectedId(null);
            setMenuTargetId(null);
            setFitAllOnce(false);

            // 4) 스냅/분기
            const SNAP_M = 50; // ← 환경 맞게 30~50m 조절
            if (nearest && nearest.dist <= SNAP_M) {
              // 기존 매물로 스냅 + 매물보기
              latlng = nearest.item.position;
              setDraftPin(null);
              setSelectedId(nearest.item.id);
              setMenuTargetId(nearest.item.id);
              setMenuAnchor(nearest.item.position);
              setMenuAddress(
                nearest.item.address ?? normAddr.road ?? normAddr.jibun ?? v
              );
              setMenuOpen(true);
            } else {
              // 신규 장소 등록
              setDraftPin(latlng);
              setMenuAnchor(latlng);
              const display = looksLikeJibeon
                ? normAddr.jibun ?? normAddr.road ?? v
                : normAddr.road ?? normAddr.jibun ?? v;
              setMenuAddress(display);
              setMenuOpen(true);
            }
          });
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

          const next: PropertyItem = {
            id,
            title: payload.title,
            address: payload.address,
            priceText: payload.jeonsePrice ?? undefined,
            status: payload.status,
            dealStatus: payload.dealStatus,
            type: "아파트",
            position: pos,
            favorite: false,
            view: {
              officePhone: payload.officePhone,
              officePhone2: payload.officePhone2,
              elevator: payload.elevator,
              parkingType: payload.parkingType,
              parkingGrade: payload.parkingGrade,
              completionDate: payload.completionDate,
              exclusiveArea: payload.exclusiveArea,
              realArea: payload.realArea,
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
              images: payload.images,
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
