"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";

import { LatLng } from "@/lib/geo/types";
import { applyPatchToItem } from "@/features/properties/lib/view/applyPatchToItem";
import { toViewDetails } from "@/features/properties/lib/view/toViewDetails";
import type { ViewSource } from "@/features/properties/lib/view/types";
import { CreatePayload } from "@/features/properties/types/property-dto";
import { buildEditPatchWithMedia } from "@/features/properties/components/PropertyEditModal/lib/buildEditPatch";
import { PoiKind } from "../../shared/overlays/poiOverlays";

/* ⬇️ 라벨 숨김/복원 유틸 */
import {
  hideLabelsAround,
  showLabelsAround,
} from "@/features/map/shared/overlays/labelRegistry";
import { useViewportPost } from "../../shared/hooks/useViewportPost";
import { usePinsMap } from "../../shared/hooks/usePinsMap";
import {
  usePanToWithOffset,
  useResolveAddress,
} from "../../shared/hooks/useKakaoTools";
import { useRunSearch } from "../../shared/hooks/useRunSearch";

const DRAFT_PIN_STORAGE_KEY = "maphome:draftPin";

/** 부동소수점 비교 오차 보정 */
const sameCoord = (a?: LatLng | null, b?: LatLng | null, eps = 1e-7) =>
  !!a && !!b && Math.abs(a.lat - b.lat) < eps && Math.abs(a.lng - b.lng) < eps;

type Viewport = {
  leftTop: LatLng;
  leftBottom: LatLng;
  rightTop: LatLng;
  rightBottom: LatLng;
  zoomLevel: number;
};

const sameViewport = (a?: Viewport | null, b?: Viewport | null, eps = 1e-7) => {
  if (!a || !b) return false;
  const eq = (p: LatLng, q: LatLng) =>
    Math.abs(p.lat - q.lat) < eps && Math.abs(p.lng - q.lng) < eps;
  return (
    a.zoomLevel === b.zoomLevel &&
    eq(a.leftTop, b.leftTop) &&
    eq(a.leftBottom, b.leftBottom) &&
    eq(a.rightTop, b.rightTop) &&
    eq(a.rightBottom, b.rightBottom)
  );
};

/** Kakao LatLng 객체/POJO 모두 대응 정규화 */
function normalizeLL(v: any): LatLng {
  if (v && typeof v.getLat === "function" && typeof v.getLng === "function") {
    return { lat: v.getLat(), lng: v.getLng() };
  }
  return { lat: Number(v?.lat), lng: Number(v?.lng) };
}

/** PropertyItem -> ViewSource (얇은 어댑터) */
function toViewSourceFromPropertyItem(p: PropertyItem): ViewSource {
  const anyP = p as any;
  return {
    title: p.title,
    address:
      (anyP.address && String(anyP.address)) ||
      (anyP.addressLine && String(anyP.addressLine)) ||
      undefined,
    status: anyP.status ?? null,
    dealStatus: anyP.dealStatus ?? null,
    type: anyP.type ?? null,
    priceText: anyP.priceText ?? null,
    view: anyP.view ?? undefined,
  };
}

/** 지도 도구 모드 (지적/로드뷰 배타적 관리) */
type MapToolMode = "none" | "district" | "roadview";

export function useMapHomeState() {
  // 지도/SDK
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [kakaoSDK, setKakaoSDK] = useState<any>(null);

  // 라벨 숨김
  const [hideLabelForId, setHideLabelForId] = useState<string | null>(null);
  const onChangeHideLabelForId = useCallback((id: string | null) => {
    setHideLabelForId(id);
  }, []);

  // 모달/메뉴
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [createFromDraftId, setCreateFromDraftId] = useState<string | null>(
    null
  );

  const [menuRoadAddr, setMenuRoadAddr] = useState<string | null>(null);
  const [menuJibunAddr, setMenuJibunAddr] = useState<string | null>(null);

  const [menuAnchor, setMenuAnchor] = useState<LatLng | null>(null);
  const [menuTargetId, setMenuTargetId] = useState<string | null>(null);

  // 1회 전체 맞춤
  const [fitAllOnce, setFitAllOnce] = useState(false);

  // 생성 시 주소 프리필
  const [prefillAddress, setPrefillAddress] = useState<string | undefined>();

  // 생성용 draft 핀 복원
  const [draftPin, _setDraftPin] = useState<LatLng | null>(null);
  const restoredDraftPinRef = useRef<LatLng | null>(null);

  // ✅ 매물등록용 좌표 캡쳐
  const [createPos, setCreatePos] = useState<LatLng | null>(null);

  // 좌표 세터(정규화만)
  const setRawMenuAnchor = useCallback((ll: LatLng | any) => {
    const p = normalizeLL(ll);
    setMenuAnchor(p);
  }, []);

  const setDraftPinSafe = useCallback((pin: LatLng | null) => {
    if (pin) {
      const p = normalizeLL(pin);
      _setDraftPin(p);
      try {
        localStorage.setItem(DRAFT_PIN_STORAGE_KEY, JSON.stringify(p));
      } catch {}
    } else {
      _setDraftPin(null);
      try {
        localStorage.removeItem(DRAFT_PIN_STORAGE_KEY);
      } catch {}
    }
  }, []);

  // 토글/필터
  const [mapToolMode, setMapToolMode] = useState<MapToolMode>("none");
  const [useSidebar, setUseSidebar] = useState<boolean>(false);

  /** 파생: 지적편집도 / 로드뷰 상태 */
  const useDistrict = mapToolMode === "district";
  const roadviewVisible = mapToolMode === "roadview";

  /** 지적편집도 토글 (배타적) */
  const toggleDistrict = useCallback(() => {
    setMapToolMode((prev) => (prev === "district" ? "none" : "district"));
  }, []);

  /** 로드뷰 토글 (배타적) */
  const toggleRoadview = useCallback(() => {
    setMapToolMode((prev) => (prev === "roadview" ? "none" : "roadview"));
  }, []);

  /** 기존 setUseDistrict 인터페이스 호환용 */
  const setUseDistrict = useCallback((next: boolean) => {
    setMapToolMode((prev) => {
      if (next) return "district";
      // 끄는 경우, 현재 district일 때만 none으로
      return prev === "district" ? "none" : prev;
    });
  }, []);

  /** 필요 시 로드뷰도 직접 세트할 수 있게 */
  const setRoadviewVisible = useCallback((next: boolean) => {
    setMapToolMode((prev) => {
      if (next) return "roadview";
      return prev === "roadview" ? "none" : prev;
    });
  }, []);

  // POI
  const [poiKinds, setPoiKinds] = useState<PoiKind[]>([]);
  const onChangePoiKinds = useCallback(
    (next: PoiKind[]) => setPoiKinds(next),
    []
  );

  // 데이터
  const [items, setItems] = useState<PropertyItem[]>([]);
  const [addFav, setAddFav] = useState<boolean>(false);

  // 검색/필터 값
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [filter, setFilter] = useState<"all" | "pins" | "units" | string>(
    "all"
  );
  const [q, setQ] = useState("");

  const onChangeQ = useCallback((v: string) => setQ(v), []);
  const onChangeFilter = useCallback((v: any) => setFilter(v), []);

  // 파생: 필터링 목록
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

  // 선택 상태
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => items.find((x) => x.id === selectedId) ?? null,
    [items, selectedId]
  );

  // 뷰포스트
  const postViewport = useViewportPost();
  const lastViewportRef = useRef<Viewport | null>(null);

  // 서버 핀
  const { points, drafts, setBounds, refetch } = usePinsMap();

  // 방금 등록된 draft 숨김 관리
  const [hiddenDraftIds, setHiddenDraftIds] = useState<Set<string>>(new Set());
  const hideDraft = useCallback(
    (draftId: string | number | null | undefined) => {
      if (draftId == null) return;
      const key = String(draftId);
      setHiddenDraftIds((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    },
    []
  );
  const clearHiddenDraft = useCallback((draftId: string | number) => {
    const key = String(draftId);
    setHiddenDraftIds((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const sendViewportQuery = useCallback(
    (vp: Viewport, opts?: { force?: boolean }) => {
      if (!opts?.force && sameViewport(vp, lastViewportRef.current)) return;
      lastViewportRef.current = vp;

      (postViewport as any)?.sendViewportQuery
        ? (postViewport as any).sendViewportQuery(vp)
        : (postViewport as any)(vp);

      if (kakaoSDK && mapInstance) {
        kakaoSDK.maps.event.trigger(mapInstance, "idle");
        requestAnimationFrame(() =>
          kakaoSDK.maps.event.trigger(mapInstance, "idle")
        );
      }

      try {
        const sw = vp.leftBottom;
        const ne = vp.rightTop;
        setBounds({
          swLat: sw.lat,
          swLng: sw.lng,
          neLat: ne.lat,
          neLng: ne.lng,
        });
      } catch {}
    },
    [postViewport, kakaoSDK, mapInstance, setBounds]
  );

  const lastViewport = lastViewportRef.current;

  // 유틸
  const resolveAddress = useResolveAddress(kakaoSDK);
  const panToWithOffset = usePanToWithOffset(kakaoSDK, mapInstance);

  const openMenuAt = useCallback(
    async (
      position: LatLng,
      propertyId: "__draft__" | string,
      opts?: { roadAddress?: string | null; jibunAddress?: string | null }
    ) => {
      const p = normalizeLL(position);
      const isDraft = propertyId === "__draft__";
      const sid = String(propertyId);

      setSelectedId(isDraft ? null : sid);
      setMenuTargetId(isDraft ? "__draft__" : sid);
      setDraftPinSafe(isDraft ? p : null);
      setFitAllOnce(false);

      // ✅ 임시 방문핀(__visit__123)에서 온 경우, draftId 기억
      if (sid.startsWith("__visit__")) {
        const rawId = sid.replace("__visit__", "");
        setCreateFromDraftId(rawId || null);
      } else {
        setCreateFromDraftId(null);
      }

      onChangeHideLabelForId("__draft__");
      onChangeHideLabelForId(isDraft ? "__draft__" : sid);

      setRawMenuAnchor(p);

      // 이하 그대로
      try {
        if (mapInstance) hideLabelsAround(mapInstance, p.lat, p.lng, 40);
      } catch {}

      if (opts?.roadAddress || opts?.jibunAddress) {
        setMenuRoadAddr(opts.roadAddress ?? null);
        setMenuJibunAddr(opts.jibunAddress ?? null);
      } else {
        const { road, jibun } = await resolveAddress(p);
        setMenuRoadAddr(road ?? null);
        setMenuJibunAddr(jibun ?? null);
      }

      panToWithOffset(p, 180);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });
    },
    [
      resolveAddress,
      panToWithOffset,
      setDraftPinSafe,
      onChangeHideLabelForId,
      setRawMenuAnchor,
      mapInstance,
    ]
  );

  const geocodeAddress = useCallback(
    async (q: string): Promise<LatLng | null> => {
      if (!kakaoSDK?.maps?.services || !q?.trim()) return null;
      const geocoder = new kakaoSDK.maps.services.Geocoder();
      return await new Promise<LatLng | null>((resolve) => {
        geocoder.addressSearch(q.trim(), (result: any[], status: string) => {
          if (status !== kakaoSDK.maps.services.Status.OK || !result?.length) {
            resolve(null);
            return;
          }
          const { x, y } = result[0];
          resolve({ lat: Number(y), lng: Number(x) });
        });
      });
    },
    [kakaoSDK]
  );

  const openMenuForExistingPin = useCallback(
    async (p: PropertyItem) => {
      const pos = normalizeLL(p.position);
      setDraftPinSafe(null);
      const sid = String(p.id);
      setSelectedId(sid);
      setMenuTargetId(sid);
      setRawMenuAnchor(pos);
      setFitAllOnce(false);
      onChangeHideLabelForId(sid);

      // ✅ 기존 핀에서는 draft 매칭 X
      setCreateFromDraftId(null);

      // 이하 그대로
      try {
        if (mapInstance) hideLabelsAround(mapInstance, pos.lat, pos.lng, 40);
      } catch {}

      panToWithOffset(pos, 180);

      if ((p as any).address) {
        setMenuRoadAddr((p as any).address);
        setMenuJibunAddr(null);
      } else {
        const { road, jibun } = await resolveAddress(pos);
        setMenuRoadAddr(road ?? null);
        setMenuJibunAddr(jibun ?? null);
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });
    },
    [
      resolveAddress,
      panToWithOffset,
      setDraftPinSafe,
      onChangeHideLabelForId,
      setRawMenuAnchor,
      mapInstance,
    ]
  );

  const runSearchRaw = useRunSearch({
    kakaoSDK,
    mapInstance,
    items,
    onMatchedPin: (p: PropertyItem) => openMenuForExistingPin(p),
    onNoMatch: (coords: LatLng) => openMenuAt(coords, "__draft__"),
    panToWithOffset,
    poiKinds,
  } as any);

  const runSearch = useCallback(
    (keyword?: string) => runSearchRaw(keyword ?? q),
    [runSearchRaw, q]
  );

  const handleSearchSubmit = useCallback(
    async (kw?: string) => {
      const keyword = kw ?? q;
      await runSearch(keyword);
      const pos = await geocodeAddress(keyword);
      if (pos) {
        await openMenuAt(pos, "__draft__");
      }
    },
    [q, runSearch, geocodeAddress, openMenuAt]
  );

  const onSubmitSearch = useCallback(
    (v?: string) => handleSearchSubmit(v),
    [handleSearchSubmit]
  );

  // draftPin 세팅 시 말주머니 처리
  useEffect(() => {
    if (!draftPin) return;

    setSelectedId(null);
    setMenuTargetId("__draft__");
    setRawMenuAnchor(draftPin);
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
  }, [draftPin, resolveAddress, onChangeHideLabelForId, setRawMenuAnchor]);

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

      const pos = normalizeLL(item.position);

      setSelectedId(sid);
      setMenuTargetId(sid);
      setDraftPinSafe(null);
      setFitAllOnce(false);
      setRawMenuAnchor(pos);
      onChangeHideLabelForId(sid);

      setCreateFromDraftId(null);

      // ✅ 클릭 경로에서도 즉시 숨김(안전)
      try {
        if (mapInstance) hideLabelsAround(mapInstance, pos.lat, pos.lng, 40);
      } catch {}

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });

      panToWithOffset(pos, 180);
      const { road, jibun } = await resolveAddress(pos);
      setMenuRoadAddr(road ?? null);
      setMenuJibunAddr(jibun ?? null);
    },
    [
      items,
      resolveAddress,
      panToWithOffset,
      setDraftPinSafe,
      onChangeHideLabelForId,
      setRawMenuAnchor,
      mapInstance,
    ]
  );

  // 지도 준비
  const onMapReady = useCallback(
    ({ kakao, map }: any) => {
      setKakaoSDK(kakao);
      setMapInstance(map);
      requestAnimationFrame(() => setFitAllOnce(false));
      setTimeout(() => {
        map.relayout?.();
        kakao.maps.event.trigger(map, "resize");
        kakao.maps.event.trigger(map, "idle");
      }, 0);

      try {
        const b = map.getBounds();
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        setBounds({
          swLat: sw.getLat(),
          swLng: sw.getLng(),
          neLat: ne.getLat(),
          neLng: ne.getLng(),
        });
        refetch();
      } catch {}

      /** ⭐ 지도 드래그/줌 시작할 때 임시 검색핀 & 메뉴 제거 */
      const clearDraftAndMenu = () => {
        setDraftPinSafe(null);
        setMenuOpen(false);
        setMenuTargetId(null);
        setMenuAnchor(null);
        setMenuRoadAddr(null);
        setMenuJibunAddr(null);
        onChangeHideLabelForId(null);
      };

      kakao.maps.event.addListener(map, "dragstart", clearDraftAndMenu);
      kakao.maps.event.addListener(map, "zoom_start", clearDraftAndMenu);
    },
    [refetch, setBounds, setDraftPinSafe, onChangeHideLabelForId]
  );

  // ViewModal 패치/삭제 핸들러
  const onSaveViewPatch = useCallback(
    async (patch: Partial<PropertyViewDetails>) => {
      setItems((prev) =>
        prev.map((p) => (p.id === selectedId ? applyPatchToItem(p, patch) : p))
      );
    },
    [selectedId]
  );

  const onDeleteFromView = useCallback(async () => {
    setItems((prev) => prev.filter((p) => p.id !== selectedId));
    setViewOpen(false);
    setSelectedId(null);
  }, [selectedId]);

  const onSubmitEdit = useCallback(
    async (payload: CreatePayload) => {
      if (!selectedId) return;
      const patch = await buildEditPatchWithMedia(payload, String(selectedId));
      setItems((prev) =>
        prev.map((p) =>
          String(p.id) === String(selectedId)
            ? applyPatchToItem(p as any, patch as any)
            : p
        )
      );
      setEditOpen(false);
    },
    [selectedId]
  );

  // 메뉴 닫기
  const closeMenu = useCallback(() => {
    // ✅ 닫으면서 반경 내 라벨 복구
    try {
      if (mapInstance && menuAnchor) {
        showLabelsAround(mapInstance, menuAnchor.lat, menuAnchor.lng, 56);
      }
    } catch {}

    setMenuOpen(false);
    setMenuTargetId(null);
    setMenuAnchor(null);
    setMenuRoadAddr(null);
    setMenuJibunAddr(null);
    onChangeHideLabelForId(null);

    // draft 핀인 경우엔 같이 제거
    if (draftPin) {
      setDraftPinSafe(null);
    }
  }, [
    draftPin,
    setDraftPinSafe,
    onChangeHideLabelForId,
    mapInstance,
    menuAnchor,
  ]);

  const openViewFromMenu = useCallback(
    (id: string) => {
      setSelectedId(id);
      closeMenu();
      setViewOpen(true);
    },
    [closeMenu]
  );

  const openCreateFromMenu = useCallback(() => {
    // ✅ 메뉴가 닫히기 전에 현재 위치 캡쳐
    const anchor: LatLng | null =
      menuAnchor ??
      draftPin ??
      (selected ? normalizeLL((selected as any).position) : null);

    setCreatePos(anchor);

    closeMenu();
    setPrefillAddress(menuRoadAddr ?? menuJibunAddr ?? undefined);
    setCreateOpen(true);
  }, [menuAnchor, draftPin, selected, menuRoadAddr, menuJibunAddr, closeMenu]);

  // alias들
  const onCloseMenu = closeMenu;
  const onViewFromMenu = useCallback(
    (id: string | number) => openViewFromMenu(String(id)),
    [openViewFromMenu]
  );
  const onCreateFromMenu = openCreateFromMenu;

  const onPlanFromMenu = useCallback(
    (pos: LatLng) => {
      const p = normalizeLL(pos);
      if (draftPin && sameCoord(draftPin, p)) {
        setDraftPinSafe(null);
      }
      closeMenu();
    },
    [closeMenu, draftPin, setDraftPinSafe]
  );

  // ⭐ 마커 목록 (필터 반영)
  const markers = useMemo(() => {
    // 0) drafts 배열에서 숨긴 것 제외
    const visibleDraftsRaw = (drafts ?? []).filter(
      (d: any) => !hiddenDraftIds.has(String(d.id))
    );

    // 1) 필터 모드 판별
    //    plannedOnly = 답사예정 탭 (답사 전 드래프트만 보고 싶을 때)
    const isPlannedOnlyMode = filter === "plannedOnly";

    // 2) 매물핀: plannedOnly 모드에서는 안 보이게
    const visiblePoints = isPlannedOnlyMode ? [] : points ?? [];

    // 3) 임시핀: plannedOnly 모드일 때는 draftState === "BEFORE" 만 남기기
    const visibleDrafts = visibleDraftsRaw.filter((d: any) => {
      if (!isPlannedOnlyMode) return true; // 평소에는 전부 사용

      const state = d.draftState as "BEFORE" | "SCHEDULED" | undefined;
      return state === "BEFORE"; // ⇐ 답사 전 드래프트만
    });

    // 4) 매물핀 마커 변환
    const pointMarkers = visiblePoints.map((p: any) => ({
      id: String(p.id),
      position: { lat: p.lat, lng: p.lng },
      kind: "1room" as const,
      title: p.badge ?? "",
      isFav: false,
    }));

    // 5) 임시핀 마커 변환 (__visit__ 접두사)
    const draftMarkers = visibleDrafts.map((d: any) => ({
      id: `__visit__${d.id}`,
      position: { lat: d.lat, lng: d.lng },
      kind: "question" as const,
      isFav: false,
    }));

    // 6) 화면에서 선택한 임시 draftPin (메뉴 열릴 때 생기는 말풍선용)
    const draftPinMarker = draftPin
      ? [
          {
            id: "__draft__",
            position: draftPin,
            kind: "question" as const,
            isFav: false,
          },
        ]
      : [];

    return [...pointMarkers, ...draftMarkers, ...draftPinMarker];
  }, [points, drafts, draftPin, hiddenDraftIds, filter]);

  // Create/Edit Host 브리지
  const createHostHandlers = useMemo(
    () => ({
      onClose: () => {
        setCreateOpen(false);
        setDraftPinSafe(null);
        setPrefillAddress(undefined);
        setMenuOpen(false);
        setCreateFromDraftId(null);
        setCreatePos(null); // ✅ 생성 좌표 초기화
      },
      appendItem: (item: PropertyItem) => setItems((prev) => [item, ...prev]),
      selectAndOpenView: (id: string | number) => {
        const sid = String(id);
        setSelectedId(sid);
        setViewOpen(true);
        setMenuTargetId(null);
      },
      resetAfterCreate: () => {
        setDraftPinSafe(null);
        setPrefillAddress(undefined);
        setCreateOpen(false);
        setCreateFromDraftId(null);
        setCreatePos(null); // ✅ 생성 좌표 초기화
      },
      onAfterCreate: (res: { matchedDraftId?: string | number | null }) => {
        if (res?.matchedDraftId != null) {
          hideDraft(res.matchedDraftId);
        }
        refetch();
      },
    }),
    [hideDraft, refetch, setDraftPinSafe, setCreatePos]
  );

  const editHostHandlers = useMemo(
    () => ({
      onClose: () => setEditOpen(false),
      updateItems: setItems,
      onSubmit: onSubmitEdit,
    }),
    [onSubmitEdit]
  );

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
    setDraftPinSafe(null);
    setPrefillAddress(undefined);
    setMenuOpen(false);
    setCreateFromDraftId(null);
    setCreatePos(null); // ✅ 생성 좌표 초기화
  }, [setDraftPinSafe, setCreatePos]);

  // POI 변경 즉시 반영
  useEffect(() => {
    if (lastViewportRef.current) {
      sendViewportQuery(lastViewportRef.current, { force: true });
      refetch();
    } else {
      runSearch();
      if (kakaoSDK && mapInstance) {
        kakaoSDK.maps.event.trigger(mapInstance, "idle");
        requestAnimationFrame(() =>
          kakaoSDK.maps.event.trigger(mapInstance, "idle")
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poiKinds]);

  const onViewportChange = useCallback(
    (vp: any, opts?: { force?: boolean }) => sendViewportQuery(vp, opts),
    [sendViewportQuery]
  );

  // selectedViewItem (ViewModal용)
  const selectedViewItem = useMemo(() => {
    if (!selected) return null;
    const id = String(selected.id);
    const view = toViewDetails(toViewSourceFromPropertyItem(selected)) as any;

    if (!view.id) view.id = id;
    if (!view.propertyId) view.propertyId = id;

    const withEditInitial = {
      ...view,
      editInitial: { view: { ...view } },
    };

    return withEditInitial as PropertyViewDetails & { editInitial: any };
  }, [selected]);

  const selectedPos = useMemo<LatLng | null>(() => {
    // ✅ 매물등록을 눌렀을 때 캡쳐한 좌표가 있으면 최우선 사용
    if (createPos) return createPos;
    if (menuAnchor) return menuAnchor;
    if (draftPin) return draftPin;
    if (selected) return normalizeLL((selected as any).position);
    return null;
  }, [createPos, menuAnchor, draftPin, selected]);

  const closeView = useCallback(() => setViewOpen(false), []);
  const closeEdit = useCallback(() => setEditOpen(false), []);
  const onEditFromView = useCallback(() => {
    setViewOpen(false);
    setEditOpen(true);
  }, []);

  const onOpenMenu = useCallback(
    (p: {
      position: { lat: number; lng: number } | any;
      propertyId?: "__draft__" | string | number;
      propertyTitle?: string | null;
      pin?: { kind?: string; isFav?: boolean };
    }) => {
      openMenuAt(
        normalizeLL(p.position),
        (p.propertyId ?? "__draft__") as "__draft__" | string
      );
    },
    [openMenuAt]
  );

  const onMarkerClick = handleMarkerClick;

  return {
    // sdk/map
    kakaoSDK,
    mapInstance,
    onMapReady,
    sendViewportQuery,
    lastViewport,

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
    handleSearchSubmit,
    onChangeQ,
    onChangeFilter,
    onSubmitSearch,

    // toggles
    useSidebar,
    setUseSidebar,
    mapToolMode,
    useDistrict,
    setUseDistrict,
    roadviewVisible,
    setRoadviewVisible,
    toggleDistrict,
    toggleRoadview,

    // POI
    poiKinds,
    setPoiKinds,
    onChangePoiKinds,

    // menu
    menuOpen,
    menuAnchor,
    menuTargetId,
    menuRoadAddr,
    menuJibunAddr,
    closeMenu,
    openViewFromMenu,
    openCreateFromMenu,
    onCloseMenu,
    onViewFromMenu,
    onCreateFromMenu,
    onOpenMenu,
    onPlanFromMenu,

    // draft
    draftPin,
    setDraftPin: setDraftPinSafe,

    // marker / viewport
    handleMarkerClick,
    onMarkerClick,
    onViewportChange,

    // modals
    addFav,
    viewOpen,
    setViewOpen,
    editOpen,
    setEditOpen,
    createOpen,
    setCreateOpen,
    prefillAddress,
    closeCreate,
    closeView,
    closeEdit,
    onEditFromView,

    // view handlers
    onSaveViewPatch,
    onDeleteFromView,
    selectedViewItem,

    // host bridges
    createHostHandlers,
    editHostHandlers,

    // misc
    selectedPos,
    hideLabelForId,
    onChangeHideLabelForId,

    // 숨김 제어
    hideDraft,
    clearHiddenDraft,
    createFromDraftId,
  } as const;
}
