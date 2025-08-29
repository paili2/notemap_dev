"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/atoms/Card/Card";
import type { LatLng, MapMarker } from "@/features/map/types/map";
import MapView from "../../map/MapView/MapView";
import type { PropertyItem } from "../types/propertyItem";
import type { AdvFilters } from "@/features/properties/types/advFilters";

import PropertyCreateModal from "../components/modal/PropertyCreateModal/PropertyCreateModal";
import PropertyViewModal from "../components/modal/PropertyViewModal/PropertyViewModal";
import PinContextMenu from "../../map/PinContextMenu/PinContextMenu";
import { PropertyViewDetails } from "../types/property-view";
import { CreatePayload } from "../types/property-dto";
import { FilterKey } from "@/features/map/top/MapTopBar/types";
import MapTopBar from "@/features/map/top/MapTopBar/MapTopBar";
import ToggleSidebar from "@/features/map/top/ToggleSidebar/ToggleSidebar";
import { Sidebar } from "@/features/sidebar";

import { distanceMeters } from "@/features/properties/lib/geo/distance";
import { ImageItem } from "../types/media";

import {
  dataUrlToBlob,
  getImageUrlFromRef,
  putImageBlob,
  type ImageRef,
} from "@/features/properties/lib/imageStore";
import PropertyEditModal from "../components/modal/PropertyEditModal/PropertyEditModal";

const STORAGE_KEY = "properties";

/** ========================= 공통 유틸 ========================= */
const okUrl = (u: string) => /^https?:|^data:|^blob:/.test(u);
const isDataLike = (s: string) => s.startsWith("data:");
const isBlobLike = (s: string) => s.startsWith("blob:");
const isHttpLike = (s: string) => s.startsWith("http");

function normalizeOneImage(it: any): ImageItem | null {
  if (!it) return null;
  if (typeof it === "string")
    return okUrl(it) ? { url: it, name: "", caption: "" } : null;

  if (typeof it === "object") {
    // (A) 저장된 레퍼런스(ImageRef) 형식: { idbKey, name, caption }  -> 아직 URL 없음
    if (typeof it.idbKey === "string" && !it.url && !it.dataUrl) {
      // hydrate 전까진 표시 불가
      return null;
    }

    // (B) url/dataUrl 보유한 일반 ImageItem
    const url =
      typeof it.url === "string"
        ? it.url
        : typeof it.dataUrl === "string"
        ? it.dataUrl
        : "";
    if (!okUrl(url)) return null;
    return {
      url,
      name: typeof it.name === "string" ? it.name : "",
      caption: typeof it.caption === "string" ? it.caption : "",
      dataUrl: typeof it.dataUrl === "string" ? it.dataUrl : undefined,
    };
  }
  return null;
}

function normalizeImages(imgs: unknown): ImageItem[] {
  if (!Array.isArray(imgs)) return [];
  return imgs.map(normalizeOneImage).filter(Boolean) as ImageItem[];
}

function normalizeImageCards(cards: unknown): ImageItem[][] {
  if (!Array.isArray(cards)) return [];
  return cards.map((g) => normalizeImages(g)).filter((g) => g.length > 0);
}

function flattenCards(cards: ImageItem[][]): ImageItem[] {
  const out: ImageItem[] = [];
  const seen = new Set<string>();
  for (const g of cards) {
    for (const it of g) {
      const key = it.dataUrl || it.url;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}

/** localStorage에 안전하게 저장 (data:/blob: 문자열은 제거해 용량 보호) */
function safeStringify(obj: any) {
  return JSON.stringify(obj, (_k, v) => {
    if (typeof v === "string") {
      if (isDataLike(v) || isBlobLike(v)) return undefined;
    }
    return v;
  });
}

function persistToLocalStorage(key: string, items: PropertyItem[]) {
  try {
    const json = safeStringify(items);
    window.localStorage.setItem(key, json);
  } catch (e) {
    console.warn("localStorage quota exceeded", e);
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          updatedAt: Date.now(),
          count: items.length,
        })
      );
    } catch {
      // ignore
    }
  }
}

/** ============== IndexedDB 재료화(저장) / 수화(복원) ============== */
/** 업로드된 이미지(카드/파일)를 IndexedDB에 Blob으로 저장하고, refs만 반환 */
async function materializeToRefs(
  propertyId: string,
  cards: any[][],
  files: any[]
) {
  const cardRefs: ImageRef[][] = [];
  for (let gi = 0; gi < (cards?.length || 0); gi++) {
    const group = cards[gi] || [];
    const refs: ImageRef[] = [];
    for (let ii = 0; ii < group.length; ii++) {
      const it = group[ii] || {};
      const source: string | undefined = it.dataUrl || it.url;
      if (!source) continue;

      // http(s)는 굳이 IndexedDB에 안 넣어도 됨 → idbKey에 'url:' prefix로 저장
      if (isHttpLike(source)) {
        refs.push({
          idbKey: `url:${source}`,
          name: it.name,
          caption: it.caption,
        });
        continue;
      }

      // data 또는 blob은 Blob을 추출해서 보관
      let blob: Blob;
      if (isDataLike(source)) {
        blob = dataUrlToBlob(source);
      } else if (isBlobLike(source)) {
        const res = await fetch(source);
        blob = await res.blob();
      } else {
        continue;
      }

      const idbKey = `prop:${propertyId}:card:${gi}:${ii}:${Date.now()}`;
      await putImageBlob(idbKey, blob);
      refs.push({ idbKey, name: it.name, caption: it.caption });
    }
    if (refs.length) cardRefs.push(refs);
  }

  const fileRefs: ImageRef[] = [];
  for (let fi = 0; fi < (files?.length || 0); fi++) {
    const it = files[fi] || {};
    const source: string | undefined = it.dataUrl || it.url;
    if (!source) continue;

    if (isHttpLike(source)) {
      fileRefs.push({
        idbKey: `url:${source}`,
        name: it.name,
        caption: it.caption,
      });
      continue;
    }

    let blob: Blob;
    if (isDataLike(source)) {
      blob = dataUrlToBlob(source);
    } else if (isBlobLike(source)) {
      const res = await fetch(source);
      blob = await res.blob();
    } else {
      continue;
    }

    const idbKey = `prop:${propertyId}:file:${fi}:${Date.now()}`;
    await putImageBlob(idbKey, blob);
    fileRefs.push({ idbKey, name: it.name, caption: it.caption });
  }

  return { cardRefs, fileRefs };
}

/** localStorage에서 불러온 items의 imageRefs를 실제 표시 가능한 url로 수화 */
async function hydrateItems(items: PropertyItem[]) {
  const out: PropertyItem[] = [];
  for (const p of items) {
    const v: any = (p as any).view ?? {};

    // 1) 우선 ref 기준 복원
    const cardRefs: ImageRef[][] = Array.isArray(v._imageCardRefs)
      ? v._imageCardRefs
      : [];
    const fileRefs: ImageRef[] = Array.isArray(v._fileItemRefs)
      ? v._fileItemRefs
      : [];

    const hydratedCards: any[][] = [];
    if (cardRefs.length) {
      for (const group of cardRefs) {
        const arr: any[] = [];
        for (const r of group) {
          const url = await getImageUrlFromRef(r);
          if (url) arr.push({ url, name: r.name, caption: r.caption });
        }
        if (arr.length) hydratedCards.push(arr);
      }
    } else {
      // 2) (하위호환) 기존 url이 남아있다면 그대로 사용
      const cards = Array.isArray(v.imageCards) ? v.imageCards : [];
      for (const group of cards) {
        const arr = (group ?? []).filter((it: any) => it?.url);
        if (arr.length) hydratedCards.push(arr);
      }
    }

    const hydratedFiles: any[] = [];
    if (fileRefs.length) {
      for (const r of fileRefs) {
        const url = await getImageUrlFromRef(r);
        if (url) hydratedFiles.push({ url, name: r.name, caption: r.caption });
      }
    } else {
      const files = Array.isArray(v.fileItems) ? v.fileItems : [];
      for (const it of files) if (it?.url) hydratedFiles.push(it);
    }

    out.push({
      ...p,
      view: {
        ...v,
        imageCards: hydratedCards,
        images: hydratedCards.flat(),
        fileItems: hydratedFiles,
      },
    } as PropertyItem);
  }
  return out;
}

/** ========================= 컴포넌트 ========================= */
const MapHomePage: React.FC = () => {
  const [, setFavOpen] = useState(false);

  const [mapInstance, setMapInstance] = useState<any>(null);
  const [kakaoSDK, setKakaoSDK] = useState<any>(null);
  const [menuAddress, setMenuAddress] = useState<string | null>(null);
  const [fitAllOnce, setFitAllOnce] = useState(true);
  const geocoderRef = useRef<any>(null);

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

  // 1) 최초 로드: localStorage → items
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

  // 2) 수화: refs → url (최초 1회)
  useEffect(() => {
    (async () => {
      if (!items.length) return;
      const hydrated = await hydrateItems(items);
      setItems(hydrated);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3) 저장: items가 변경될 때 localStorage에 (refs만 들어가므로 가벼움)
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

  const mapMarkers: MapMarker[] = useMemo(() => {
    const base = filtered.map((p) => ({
      id: p.id,
      title: p.title,
      position: { lat: p.position.lat, lng: p.position.lng },
    }));
    if (draftPin) {
      base.unshift({
        id: "__draft__",
        title: "신규 등록 위치",
        position: { lat: draftPin.lat, lng: draftPin.lng },
      });
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
    const extra = (selected as any).view ?? {};
    return { ...toViewDetails(selected), ...extra } as PropertyViewDetails;
  }, [selected]);

  /** 지도 관련 */
  const [fixedCenter] = useState<LatLng>({ lat: 37.5665, lng: 126.978 });
  const resolveAddress = useCallback(async (latlng: LatLng) => {
    try {
      const kakao = (window as any).kakao;
      if (!kakao) return null;
      if (!geocoderRef.current)
        geocoderRef.current = new kakao.maps.services.Geocoder();
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
            } else resolve(null);
          }
        );
      });
      return addr;
    } catch {
      return null;
    }
  }, []);

  const markerClickShieldRef = useRef(0);
  const handleMarkerClick = useCallback(
    async (id: string) => {
      markerClickShieldRef.current = Date.now();
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

  /** patch 반영 */
  function applyPatchToItem(
    p: PropertyItem,
    patch: Partial<PropertyViewDetails>
  ): PropertyItem {
    return {
      ...p,
      status: (patch as any).status ?? (p as any).status,
      dealStatus: (patch as any).dealStatus ?? (p as any).dealStatus,
      title: patch.title ?? p.title,
      address: patch.address ?? p.address,
      priceText: (patch as any).salePrice ?? p.priceText,
      view: {
        ...(p as any).view,

        listingStars:
          typeof patch.listingStars === "number"
            ? patch.listingStars
            : (p as any).view?.listingStars,
        elevator: (patch as any).elevator ?? (p as any).view?.elevator,

        // 미디어 (카드/평탄)
        ...(() => {
          const cand = (patch as any).imageCards ?? (patch as any).imagesByCard;
          if (Array.isArray(cand)) {
            const cards = normalizeImageCards(cand);
            return { imageCards: cards, images: flattenCards(cards) };
          }
          if ("images" in patch && Array.isArray((patch as any).images)) {
            return { images: normalizeImages((patch as any).images) };
          }
          return {
            images: (p as any).view?.images,
            imageCards: (p as any).view?.imageCards,
          };
        })(),

        // 파일(세로)
        fileItems: Array.isArray((patch as any).fileItems)
          ? normalizeImages((patch as any).fileItems)
          : (p as any).view?.fileItems,

        publicMemo: (patch as any).publicMemo ?? (p as any).view?.publicMemo,
        secretMemo: (patch as any).secretMemo ?? (p as any).view?.secretMemo,
        officePhone: (patch as any).officePhone ?? (p as any).view?.officePhone,
        officePhone2:
          (patch as any).officePhone2 ?? (p as any).view?.officePhone2,

        options: (patch as any).options ?? (p as any).view?.options,
        optionEtc: (patch as any).optionEtc ?? (p as any).view?.optionEtc,
        registry: (patch as any).registry ?? (p as any).view?.registry,
        unitLines: (patch as any).unitLines ?? (p as any).view?.unitLines,

        parkingType: (patch as any).parkingType ?? (p as any).view?.parkingType,
        parkingCount:
          (patch as any).parkingCount ?? (p as any).view?.parkingCount,

        slopeGrade: (patch as any).slopeGrade ?? (p as any).view?.slopeGrade,
        structureGrade:
          (patch as any).structureGrade ?? (p as any).view?.structureGrade,

        aspect: (patch as any).aspect ?? (p as any).view?.aspect,
        aspectNo: (patch as any).aspectNo ?? (p as any).view?.aspectNo,
        aspect1: (patch as any).aspect1 ?? (p as any).view?.aspect1,
        aspect2: (patch as any).aspect2 ?? (p as any).view?.aspect2,
        aspect3: (patch as any).aspect3 ?? (p as any).view?.aspect3,

        totalBuildings:
          (patch as any).totalBuildings ?? (p as any).view?.totalBuildings,
        totalFloors: (patch as any).totalFloors ?? (p as any).view?.totalFloors,
        totalHouseholds:
          (patch as any).totalHouseholds ?? (p as any).view?.totalHouseholds,
        remainingHouseholds:
          (patch as any).remainingHouseholds ??
          (p as any).view?.remainingHouseholds,

        completionDate:
          (patch as any).completionDate ?? (p as any).view?.completionDate,
        exclusiveArea:
          (patch as any).exclusiveArea ?? (p as any).view?.exclusiveArea,
        realArea: (patch as any).realArea ?? (p as any).view?.realArea,

        dealStatus: (patch as any).dealStatus ?? (p as any).view?.dealStatus,
      },
    };
  }

  /** 보기 어댑터 */
  function toViewDetails(p: PropertyItem): PropertyViewDetails {
    const v = (p as any).view ?? {};

    const cards: ImageItem[][] = Array.isArray(v.imageCards)
      ? normalizeImageCards((v as any).imageCards)
      : Array.isArray((v as any).imagesByCard)
      ? normalizeImageCards((v as any).imagesByCard)
      : [];

    const imagesSafe: ImageItem[] =
      cards.length > 0
        ? flattenCards(cards)
        : Array.isArray(v.images)
        ? (v.images.map(normalizeOneImage).filter(Boolean) as ImageItem[])
        : [];

    const filesSafe: ImageItem[] = Array.isArray((v as any).fileItems)
      ? normalizeImages((v as any).fileItems)
      : [];

    const ori: { ho: number; value: string }[] = Array.isArray(v.orientations)
      ? (v.orientations as any[]).map((o) => ({
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
      status: (p as any).status ?? "공개",
      dealStatus: (p as any).dealStatus ?? "분양중",
      title: p.title,
      address: p.address ?? "",
      type: (p as any).type ?? "주택",
      salePrice: (p as any).priceText ?? "",

      images: imagesSafe,
      imageCards: cards,
      fileItems: filesSafe,

      options: [],
      optionEtc: "",
      registry: "주택",
      unitLines: [],

      listingStars: typeof v.listingStars === "number" ? v.listingStars : 0,
      elevator: (v.elevator as "O" | "X") ?? "O",
      parkingType: "답사지 확인",
      parkingCount: v.parkingCount ?? "",
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

      createdByName: "여준호",
      createdAt: "2025-08-16 09:05",
      inspectedByName: "홍길동",
      inspectedAt: "2025.08.16 10:30",
      updatedByName: "이수정",
      updatedAt: "2025/08/16 11:40",
    } as any;
  }

  /** 저장 */
  function saveProperties(next: PropertyItem[]) {
    if (typeof window === "undefined") return;
    persistToLocalStorage(STORAGE_KEY, next);
  }

  const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

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
          onMarkerClick={handleMarkerClick}
          onMapClick={handleMapClick}
          onMapReady={({ kakao, map }) => {
            setKakaoSDK(kakao);
            setMapInstance(map);
            requestAnimationFrame(() => setFitAllOnce(false));
            setTimeout(() => {
              map.relayout?.();
              kakao.maps.event.trigger(map, "resize");
            }, 0);
          }}
          allowCreateOnMapClick={false}
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
            const pick =
              looksLikeJibeon && r0.address
                ? r0.address
                : r0.road_address || r0.address;

            let latlng = {
              lat: parseFloat(pick.y ?? r0.y),
              lng: parseFloat(pick.x ?? r0.x),
            };

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

            let nearest: { item: PropertyItem; dist: number } | null = null;
            for (const it of items) {
              const d = distanceMeters(latlng, it.position);
              if (!nearest || d < nearest.dist) nearest = { item: it, dist: d };
            }

            setSelectedId(null);
            setMenuTargetId(null);
            setFitAllOnce(false);

            const SNAP_M = 50;
            if (nearest && nearest.dist <= SNAP_M) {
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
          onEdit={() => {
            setEditOpen(true);
          }}
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

            // 1) 업로드 들어온 이미지들 정규화
            const cardsRaw =
              (payload as any).imageCards ??
              (payload as any).imagesByCard ??
              (Array.isArray((payload as any).images)
                ? [(payload as any).images]
                : []);
            const filesRaw = (payload as any).fileItems;

            const cards = normalizeImageCards(cardsRaw);
            const files = normalizeImages(filesRaw);

            // 2) IndexedDB에 저장 → refs만 얻음
            const { cardRefs, fileRefs } = await materializeToRefs(
              id,
              cards,
              files
            );

            // 3) 뷰에서 바로 보이도록, refs를 즉시 수화해서 url도 같이 채운 버전
            const hydratedCards: any[][] = [];
            for (let gi = 0; gi < cardRefs.length; gi++) {
              const g = cardRefs[gi];
              const arr: any[] = [];
              for (const r of g) {
                const url = await getImageUrlFromRef(r);
                if (url) arr.push({ url, name: r.name, caption: r.caption });
              }
              if (arr.length) hydratedCards.push(arr);
            }
            const hydratedFiles: any[] = [];
            for (const r of fileRefs) {
              const url = await getImageUrlFromRef(r);
              if (url)
                hydratedFiles.push({ url, name: r.name, caption: r.caption });
            }

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

                _imageCardRefs: cardRefs,
                _fileItemRefs: fileRefs,

                // 화면 포맷: 즉시 수화된 url도 함께 둠
                imageCards: hydratedCards,
                images: hydratedCards.flat(),
                fileItems: hydratedFiles,

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
      )}
      {editOpen && selectedViewItem && (
        <PropertyEditModal
          open={true}
          // 뷰 모달과 겹칠 수 있으므로, DOM상 아래에 렌더해서 위에 보이게 함
          initialData={selectedViewItem}
          onClose={() => setEditOpen(false)}
          onSubmit={async (payload) => {
            // Edit 모달에서 올라온 payload → 기존 아이템에 patch 반영
            const patch: Partial<PropertyViewDetails> = {
              id: (payload as any).id, // 아이디 유지용 (applyPatchToItem 내부에선 사용X)
              title: (payload as any).title,
              address: (payload as any).address,
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

              // 이미지: Edit 모달은 images(평탄)만 보내고 있음
              images: (payload as any).images,
              // 필요하면 imageCards/fileItems도 여기에 세팅 가능
            };

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
