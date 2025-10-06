import { useEffect, useMemo, useRef, useState } from "react";
import type { MapMarker } from "@/features/map/types/map";
import { PinKind } from "@/features/pins/types";
import { getPinUrl } from "@/features/pins/lib/assets";
// import { styleHitboxEl, styleLabelEl } from "@/features/map/lib/overlays/style"; // ← 임시 비활성화(런타임 이슈 회피)
import { HITBOX, LABEL, PIN_MARKER, Z } from "@/features/map/lib/constants";
import { useSidebar } from "@/features/sidebar";

export type ClustererWithLabelsOptions = {
  labelMaxLevel?: number; // 라벨/핀 보이는 최대 레벨 (이하: 라벨모드)
  clusterMinLevel?: number; // 클러스터 시작 레벨 (이상: 클러스터모드)
  onMarkerClick?: (id: string) => void;
  fitToMarkers?: boolean;
  labelGapPx?: number; // 라벨을 핀 머리 위로 띄우는 여백(px)
  hitboxSizePx?: number; // 핀 클릭 판정 원(투명) 지름(px)
  defaultPinKind?: PinKind; // 마커에 kind 없을 때 기본 핀
  hideLabelForId?: string | null; // 말풍선 열린 핀 id (선택됨)
};

const ACCENT = "#3B82F6"; // 라벨 배경 고정(파랑)
const DRAFT_ID = "__draft__"; // ✅ 드래프트 핀 고정 표시용
const SELECTED_Z = 2000; // 선택된 마커를 항상 최상위로

// ── 로컬 스타일 헬퍼 (임포트 이슈 우회) ─────────────────────────────────────────
const applyLabelStyles = (el: HTMLDivElement, gapPx = 12) => {
  Object.assign(el.style, {
    transform: `translateY(calc(-150% - ${gapPx}px))`,
    padding: "6px 10px",
    borderRadius: "8px",
    background: ACCENT,
    color: "#ffffff",
    fontWeight: "700",
    border: "1px solid rgba(0,0,0,0.12)",
    boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
    fontSize: "12px",
    lineHeight: "1",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    userSelect: "none",
  } as CSSStyleDeclaration);
};

const applyHitboxStyles = (el: HTMLDivElement, sizePx = 48) => {
  const size = `${sizePx}px`;
  Object.assign(el.style, {
    width: size,
    height: size,
    borderRadius: "9999px",
    background: "rgba(0,0,0,0)",
    pointerEvents: "auto",
    cursor: "pointer",
    touchAction: "manipulation",
  } as CSSStyleDeclaration);
};

// ✅ 순번 배지 + 텍스트를 labelEl에 구성 (order 없으면 텍스트만)
const applyOrderBadgeToLabel = (
  el: HTMLDivElement,
  text: string,
  order?: number | null
) => {
  el.innerHTML = ""; // 기존 내용 초기화

  if (order) {
    const badge = document.createElement("span");
    Object.assign(badge.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "18px",
      height: "18px",
      minWidth: "18px",
      borderRadius: "9999px",
      fontSize: "10px",
      fontWeight: "800",
      background: "#fff",
      color: "#000",
      marginRight: "6px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
    } as CSSStyleDeclaration);
    badge.textContent = String(order);
    el.appendChild(badge);
  }

  const textSpan = document.createElement("span");
  textSpan.textContent = text ?? "";
  el.appendChild(textSpan);
};
// ────────────────────────────────────────────────────────────────────────────────

export function useClustererWithLabels(
  kakao: any,
  map: any,
  markers: MapMarker[],
  {
    labelMaxLevel = 5,
    clusterMinLevel = 6,
    onMarkerClick,
    fitToMarkers = false,
    labelGapPx = LABEL.GAP_PX,
    hitboxSizePx = HITBOX.DIAMETER_PX,
    defaultPinKind = "1room",
    hideLabelForId = null,
  }: ClustererWithLabelsOptions = {}
) {
  const { reservationOrderMap } = useSidebar();

  // 의도적 재생성 tick (필요시 setRerenderTick(+1)로 강제 재빌드 가능)
  const [rerenderTick] = useState(0);

  // 마커 구성 키(순서 영향 제거)
  const markersKey = useMemo(() => {
    return [...markers]
      .map(
        (m) =>
          `${String(m.id)}:${m.position.lat.toFixed(
            6
          )},${m.position.lng.toFixed(6)}`
      )
      .sort()
      .join("|");
  }, [markers]);

  const realMarkersKey = useMemo(
    () => `${markersKey}_${rerenderTick}`,
    [markersKey, rerenderTick]
  );

  // ✅ 부모에서 내려오는 선택 id를 문자열로 표준화
  const selectedKey = useMemo(
    () => (hideLabelForId == null ? null : String(hideLabelForId)),
    [hideLabelForId]
  );

  const markerObjsRef = useRef<Record<string, any>>({});
  const markerClickHandlersRef = useRef<
    Record<string, ((...args: any[]) => void) | null>
  >({});
  const labelOvRef = useRef<Record<string, any>>({});
  const hitboxOvRef = useRef<Record<string, any>>({});
  const clustererRef = useRef<any>(null);

  // onMarkerClick을 ref로 고정
  const onMarkerClickRef = useRef<typeof onMarkerClick>();
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // 핀 아이콘 프리로드
  const preloadedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!kakao || !map) return;
    const urls = new Set<string>();
    markers.forEach((m) => {
      const kind: PinKind = ((m as any).kind ?? defaultPinKind) as PinKind;
      const url = getPinUrl(kind);
      if (typeof url === "string" && url) urls.add(url);
    });
    urls.forEach((url) => {
      if (preloadedRef.current.has(url)) return;
      const img = new Image();
      img.src = url;
      preloadedRef.current.add(url);
    });
  }, [kakao, map, realMarkersKey, defaultPinKind]);

  // 이전 선택 id 기억
  const prevSelectedIdRef = useRef<string | null>(null);

  // 안전 경계
  const safeLabelMax = Math.min(labelMaxLevel, clusterMinLevel - 1);

  /** 클러스터 모드에서 선택 마커/드래프트 핀은 지도에 직접 올리고 나머지는 클러스터러로 */
  const mountClusterMode = (selId: string | null) => {
    const entries = Object.entries(markerObjsRef.current) as [string, any][];
    const mkList = entries.map(([, mk]) => mk);

    // 라벨/히트박스 숨김
    (Object.values(labelOvRef.current) as any[]).forEach((ov) =>
      ov.setMap(null)
    );
    (Object.values(hitboxOvRef.current) as any[]).forEach((ov) =>
      ov.setMap(null)
    );

    // 클리어 후 재배치
    clustererRef.current?.clear?.();

    // ✅ 선택/드래프트는 클러스터에서 제외
    const exclude = new Set<string>();
    if (selId) exclude.add(selId);
    exclude.add(DRAFT_ID);

    const rest = entries.filter(([id]) => !exclude.has(id)).map(([, mk]) => mk);

    if (rest.length) clustererRef.current?.addMarkers?.(rest);

    // ✅ 선택 마커는 지도에 직접
    if (selId) {
      const sel = markerObjsRef.current[selId];
      try {
        clustererRef.current?.removeMarker?.(sel);
      } catch {}
      sel?.setMap?.(map);
      sel?.setZIndex?.(SELECTED_Z);
    }

    // ✅ 드래프트 핀도 항상 지도에 직접
    const draftMk = markerObjsRef.current[DRAFT_ID];
    if (draftMk) {
      try {
        clustererRef.current?.removeMarker?.(draftMk);
      } catch {}
      draftMk.setMap(map);
      draftMk.setZIndex(SELECTED_Z + 100);
    }

    // 나머지 마커는 지도에서 제거(클러스터만 보이도록)
    mkList.forEach((mk) => mk.setMap?.(null));

    clustererRef.current?.redraw?.();
  };

  // 1) 클러스터러 초기화 및 clusterclick 리스너
  useEffect(() => {
    if (!kakao || !map) return;

    if (!clustererRef.current) {
      clustererRef.current = new kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: clusterMinLevel,
      });
    } else {
      try {
        clustererRef.current.setMinLevel?.(clusterMinLevel);
      } catch {}
    }

    const handler = (cluster: any) => {
      try {
        const center = cluster.getCenter();
        const nextLevel = Math.max(1, map.getLevel() - 1);
        map.setLevel(nextLevel, { anchor: center });
      } catch {}
    };

    kakao.maps.event.addListener(clustererRef.current, "clusterclick", handler);
    return () => {
      kakao?.maps?.event?.removeListener?.(
        clustererRef.current,
        "clusterclick",
        handler
      );
    };
  }, [kakao, map, clusterMinLevel]);

  // 2) 마커/라벨/히트박스 생성 및 정리 (무거운 이펙트)
  // ⚠ selectedKey, onMarkerClick, fitToMarkers 는 deps에서 제외 (라이트 이펙트에서 처리)
  useEffect(() => {
    if (!kakao || !map) return;

    // 이전 리소스 정리
    Object.entries(markerClickHandlersRef.current).forEach(([id, handler]) => {
      const mk = markerObjsRef.current[id];
      if (mk && handler) kakao.maps.event.removeListener(mk, "click", handler);
    });
    markerClickHandlersRef.current = {};
    Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
    labelOvRef.current = {};
    Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(null));
    hitboxOvRef.current = {};
    clustererRef.current?.clear?.();
    Object.values(markerObjsRef.current).forEach((mk: any) => mk.setMap(null));
    markerObjsRef.current = {};

    // 생성
    markers.forEach((m) => {
      const key = String(m.id);
      const pos = new kakao.maps.LatLng(m.position.lat, m.position.lng);
      const order = reservationOrderMap?.[key] ?? null; // ✅ 예약 순번(1-base)
      const isDraft = key === DRAFT_ID;

      // 마커
      const mkOptions: any = {
        position: pos,
        title: isDraft ? "답사예정" : m.title ?? key,
        zIndex: key === DRAFT_ID ? Z.DRAFT_PIN : 0,
      };

      // 아이콘 이미지 (있으면)
      const kind: PinKind = ((m as any).kind ?? defaultPinKind) as PinKind;
      const iconUrl = getPinUrl(kind);
      if (iconUrl && typeof iconUrl === "string") {
        try {
          const markerSize = new kakao.maps.Size(
            PIN_MARKER.size.w,
            PIN_MARKER.size.h
          );
          const markerOffset = new kakao.maps.Point(
            PIN_MARKER.offset.x,
            PIN_MARKER.offset.y
          );
          mkOptions.image = new kakao.maps.MarkerImage(iconUrl, markerSize, {
            offset: markerOffset,
          });
        } catch {
          /* 폴백: 기본 마커 */
        }
      }

      const mk = new kakao.maps.Marker(mkOptions);
      markerObjsRef.current[key] = mk;

      // ✅ 예약 순서 기반 zIndex (1번이 가장 위, 선택은 별도 2000)
      if (!isDraft) {
        const BASE_Z = 1000;
        const z = order ? BASE_Z + (1000 - order) : BASE_Z;
        try {
          mk.setZIndex(z);
        } catch {}
      }

      // 클릭 리스너: ref 사용
      const handler = () => onMarkerClickRef.current?.(key);
      kakao.maps.event.addListener(mk, "click", handler);
      markerClickHandlersRef.current[key] = handler;

      // 라벨 (항상 파란 배경 + 흰 글씨)
      const labelEl = document.createElement("div");
      labelEl.className = "kakao-label";
      const labelText = isDraft ? "답사예정" : m.title ?? key;
      (labelEl as any).dataset.rawLabel = labelText; // 원문 보관
      applyLabelStyles(labelEl, labelGapPx);
      labelEl.style.color = "#FFFFFF";

      // 순번 배지 적용 (답사예정 왼쪽에 숫자)
      applyOrderBadgeToLabel(labelEl as HTMLDivElement, labelText, order);

      // 가시성 확정
      labelEl.style.visibility = "visible";
      labelEl.style.display = "";
      labelEl.classList?.remove(
        "is-hidden",
        "hidden",
        "opacity-0",
        "pointer-events-none"
      );

      const labelOv = new kakao.maps.CustomOverlay({
        position: pos,
        content: labelEl,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: LABEL.Z_INDEX,
      });
      labelOvRef.current[key] = labelOv;

      // 히트박스
      const hitEl = document.createElement("div");
      hitEl.className = "kakao-hitbox";
      applyHitboxStyles(hitEl, hitboxSizePx);
      hitEl.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        onMarkerClickRef.current?.(key);
      });

      const hitOv = new kakao.maps.CustomOverlay({
        position: pos,
        content: hitEl,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: HITBOX.Z_INDEX,
        clickable: true,
      });
      hitboxOvRef.current[key] = hitOv;
    });

    // 초기 모드 적용
    const applyMode = () => {
      const level = map.getLevel();

      const entries = Object.entries(markerObjsRef.current) as [string, any][];
      const mkList = entries.map(([, mk]) => mk);
      const labelEntries = Object.entries(labelOvRef.current) as [
        string,
        any
      ][];
      const hitEntries = Object.entries(hitboxOvRef.current) as [string, any][];

      if (level <= safeLabelMax) {
        // 라벨 모드
        clustererRef.current?.clear?.();
        mkList.forEach((mk) => mk.setMap(map));
        const cleared = selectedKey == null; // null/undefined 모두 해제
        labelEntries.forEach(([id, ov]) =>
          ov.setMap(!cleared && id === selectedKey ? null : map)
        );
        hitEntries.forEach(([id, ov]) =>
          ov.setMap(!cleared && id === selectedKey ? null : map)
        );
        if (!cleared)
          markerObjsRef.current[selectedKey!]?.setZIndex?.(SELECTED_Z);
        return;
      }

      if (level >= clusterMinLevel) {
        // 클러스터 모드: 선택/드래프트는 지도에 직접
        mountClusterMode(selectedKey);
        return;
      }

      // 중간 모드: 마커 + 히트박스 (라벨 숨김)
      (Object.values(labelOvRef.current) as any[]).forEach((ov) =>
        ov.setMap(null)
      );
      clustererRef.current?.clear?.();
      mkList.forEach((mk) => mk.setMap(map));
      hitEntries.forEach(([, ov]) => ov.setMap(map));
    };

    applyMode();

    // 정리
    return () => {
      Object.entries(markerClickHandlersRef.current).forEach(
        ([id, handler]) => {
          const mk = markerObjsRef.current[id];
          if (mk && handler)
            kakao.maps.event.removeListener(mk, "click", handler);
        }
      );
      markerClickHandlersRef.current = {};

      clustererRef.current?.clear?.();
      Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
      Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(null));
      Object.values(markerObjsRef.current).forEach((mk: any) =>
        mk.setMap(null)
      );

      labelOvRef.current = {};
      hitboxOvRef.current = {};
      markerObjsRef.current = {};
    };
  }, [
    kakao,
    map,
    realMarkersKey, // ✅ 강제 재생성 키 사용
    safeLabelMax,
    clusterMinLevel,
    labelGapPx,
    hitboxSizePx,
    defaultPinKind,
    reservationOrderMap, // 순서가 변해도 라벨/마커 갱신 용이하도록 포함(무거운 이펙트이긴 함)
    // selectedKey, onMarkerClick, fitToMarkers 제외 (라이트/가벼운 이펙트에서 처리)
  ]);

  // 2.5) fitToMarkers: bounds만 맞춤 (가벼운 이펙트)
  useEffect(() => {
    if (!kakao || !map) return;
    if (!fitToMarkers) return;
    if (!markers.length) return;

    const bounds = new kakao.maps.LatLngBounds();
    markers.forEach((m) =>
      bounds.extend(new kakao.maps.LatLng(m.position.lat, m.position.lng))
    );
    map.setBounds(bounds);
  }, [kakao, map, fitToMarkers, realMarkersKey]);

  // 3) 줌 변화에 따른 표시 모드 적용(가벼운 이펙트)
  useEffect(() => {
    if (!kakao || !map) return;

    const applyMode = () => {
      const level = map.getLevel();
      const mkList = Object.values(markerObjsRef.current) as any[];
      const labelEntries = Object.entries(labelOvRef.current) as [
        string,
        any
      ][];
      const hitEntries = Object.entries(hitboxOvRef.current) as [string, any][];

      if (level <= safeLabelMax) {
        clustererRef.current?.clear?.();
        mkList.forEach((mk) => mk.setMap(map));
        const cleared = selectedKey == null;
        labelEntries.forEach(([id, ov]) =>
          ov.setMap(!cleared && id === selectedKey ? null : map)
        );
        hitEntries.forEach(([id, ov]) =>
          ov.setMap(!cleared && id === selectedKey ? null : map)
        );
        if (!cleared)
          markerObjsRef.current[selectedKey!]?.setZIndex?.(SELECTED_Z);
        return;
      }

      if (level >= clusterMinLevel) {
        // 클러스터 모드
        mountClusterMode(selectedKey);
        return;
      }

      // 중간 모드
      labelEntries.forEach(([, ov]) => ov.setMap(null));
      clustererRef.current?.clear?.();
      mkList.forEach((mk) => mk.setMap(map));
      hitEntries.forEach(([, ov]) => ov.setMap(map));
    };

    kakao.maps.event.addListener(map, "zoom_changed", applyMode);
    applyMode();
    return () => {
      kakao?.maps?.event?.removeListener?.(map, "zoom_changed", applyMode);
    };
  }, [kakao, map, safeLabelMax, clusterMinLevel, selectedKey]);

  // 4) 선택된 핀 변경 시 라벨/히트박스 토글 + 클러스터러↔지도 이동 (라이트 이펙트)
  useEffect(() => {
    if (!kakao || !map) return;

    const level = map.getLevel();
    const prevId = prevSelectedIdRef.current;

    // 라벨 모드: 라벨/히트박스만 토글 + zIndex
    if (level <= safeLabelMax) {
      const labelEntries = Object.entries(labelOvRef.current) as [
        string,
        any
      ][];
      labelEntries.forEach(([id, ov]) => {
        ov.setMap(selectedKey && id === selectedKey ? null : map);
      });
      const hitEntries = Object.entries(hitboxOvRef.current) as [string, any][];
      hitEntries.forEach(([id, ov]) => {
        ov.setMap(selectedKey && id === selectedKey ? null : map);
      });

      // 이전 선택 복구
      if (prevId && prevId !== selectedKey) {
        labelOvRef.current[prevId]?.setMap(map);
        hitboxOvRef.current[prevId]?.setMap(map);
      }

      // 선택된 마커 맨앞으로
      if (selectedKey) {
        const mk = markerObjsRef.current[selectedKey];
        mk?.setMap?.(map);
        mk?.setZIndex?.(SELECTED_Z);
      }

      prevSelectedIdRef.current = selectedKey;
      return;
    }

    // 클러스터 모드: 선택 마커는 클러스터러에서 제거하고 지도에 직접 올림 + 드래프트 고정
    if (level >= clusterMinLevel) {
      const clusterer = clustererRef.current;
      if (prevId && prevId !== selectedKey) {
        const prevMk = markerObjsRef.current[prevId];
        try {
          prevMk?.setMap?.(null);
          clusterer?.addMarker?.(prevMk);
        } catch {}
      }
      if (selectedKey) {
        const sel = markerObjsRef.current[selectedKey];
        try {
          clusterer?.removeMarker?.(sel);
        } catch {}
        sel?.setMap?.(map);
        sel?.setZIndex?.(SELECTED_Z);
      }

      // ✅ 드래프트 핀은 항상 지도에 직접
      const draftMk = markerObjsRef.current[DRAFT_ID];
      if (draftMk) {
        try {
          clusterer?.removeMarker?.(draftMk);
        } catch {}
        draftMk.setMap(map);
        draftMk.setZIndex(SELECTED_Z + 100);
      }

      clusterer?.redraw?.();
      prevSelectedIdRef.current = selectedKey;
      return;
    }

    // 중간 모드: 별도 처리 없음
    prevSelectedIdRef.current = selectedKey;
  }, [kakao, map, selectedKey, safeLabelMax, clusterMinLevel]);

  // 5) 말주머니 닫힘(selectedKey 해제) 시 라벨/히트박스 전부 다시 보이게 (라벨 모드에서만 의미)
  useEffect(() => {
    if (!kakao || !map) return;
    if (selectedKey != null) return; // 아직 선택이 유지 중이면 패스
    const level = map.getLevel();
    if (level > safeLabelMax) return;

    const labels = Object.values(labelOvRef.current) as any[];
    const hits = Object.values(hitboxOvRef.current) as any[];
    labels.forEach((ov) => ov.setMap(map));
    hits.forEach((ov) => ov.setMap(map));
  }, [selectedKey, kakao, map, safeLabelMax]);

  // 6) ✅ 답사지예약 순서 변경 시 라벨 배지/마커 zIndex만 가볍게 갱신
  useEffect(() => {
    if (!kakao || !map) return;

    const BASE_Z = 1000;

    // z-index 업데이트
    Object.entries(markerObjsRef.current).forEach(([id, mk]) => {
      if (id === DRAFT_ID) return;
      const order = reservationOrderMap?.[id] ?? null;
      const z = order ? BASE_Z + (1000 - order) : BASE_Z;
      try {
        // 선택된 마커는 별도 SELECTED_Z 유지
        if (selectedKey && id === selectedKey) {
          mk.setZIndex?.(SELECTED_Z);
        } else {
          mk.setZIndex?.(z);
        }
      } catch {}
    });

    // 라벨 내용 업데이트 (배지 + 텍스트)
    Object.entries(labelOvRef.current).forEach(([id, ov]) => {
      const el = ov.getContent?.() as HTMLDivElement | null;
      if (!el) return;
      const raw = (el as any).dataset?.rawLabel ?? el.textContent ?? "";
      const order = reservationOrderMap?.[id] ?? null;
      applyOrderBadgeToLabel(el, raw, order);
    });
  }, [reservationOrderMap, selectedKey, kakao, map]);
}

export default useClustererWithLabels;
