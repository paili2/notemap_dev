import { applyOrderBadgeToLabel, DRAFT_ID, SELECTED_Z } from "./styles";
import type { SelectionState, KakaoDeps, RefsBag } from "./types";

export function mountClusterMode(
  deps: KakaoDeps,
  refs: RefsBag,
  selId: string | null
) {
  const { kakao, map } = deps; // ⬅️ kakao도 같이 사용
  const entries = Object.entries(refs.markerObjsRef.current) as [string, any][];
  const mkList = entries.map(([, mk]) => mk);

  // ─────────────────────────────────────────────
  // ✅ 겹라벨/겹마커 정리 리스너: 좌표가 동일한 오버레이 제거
  //   - mountClusterMode가 여러 번 호출돼도 1회만 등록
  // ─────────────────────────────────────────────
  if (
    typeof window !== "undefined" &&
    !(window as any).__cleanupOverlaysAt_installed
  ) {
    (window as any).__cleanupOverlaysAt_installed = true;

    window.addEventListener("map:cleanup-overlays-at", (e: any) => {
      const { lat, lng } = (e?.detail ?? {}) as { lat?: number; lng?: number };
      if (typeof lat !== "number" || typeof lng !== "number") return;

      const EPS = 1e-5;

      // 라벨 오버레이 정리
      Object.entries(refs.labelOvRef.current).forEach(
        ([key, ov]: [string, any]) => {
          const pos = ov?.getPosition?.();
          if (!pos) return;
          const same =
            Math.abs(pos.getLat() - lat) < EPS &&
            Math.abs(pos.getLng() - lng) < EPS;
          if (same) {
            ov.setMap?.(null);
            delete refs.labelOvRef.current[key];
          }
        }
      );

      // 히트박스 오버레이도 쓰면 함께 정리
      Object.entries(refs.hitboxOvRef.current).forEach(
        ([key, ov]: [string, any]) => {
          const pos = ov?.getPosition?.();
          if (!pos) return;
          const same =
            Math.abs(pos.getLat() - lat) < EPS &&
            Math.abs(pos.getLng() - lng) < EPS;
          if (same) {
            ov.setMap?.(null);
            delete refs.hitboxOvRef.current[key];
          }
        }
      );

      // 마커 정리
      Object.entries(refs.markerObjsRef.current).forEach(
        ([key, mk]: [string, any]) => {
          const pos = mk?.getPosition?.();
          if (!pos) return;
          const same =
            Math.abs(pos.getLat() - lat) < EPS &&
            Math.abs(pos.getLng() - lng) < EPS;
          if (same) {
            try {
              refs.clustererRef.current?.removeMarker?.(mk);
            } catch {}
            mk.setMap?.(null);
            delete refs.markerObjsRef.current[key];
          }
        }
      );
    });
  }

  // ↓↓↓ 기존 코드 + 클러스터 재구성
  Object.values(refs.labelOvRef.current).forEach((ov: any) => ov.setMap(null));
  Object.values(refs.hitboxOvRef.current).forEach((ov: any) => ov.setMap(null));
  refs.clustererRef.current?.clear?.();

  const exclude = new Set<string>();
  if (selId) exclude.add(selId);
  exclude.add(DRAFT_ID);

  const rest = entries.filter(([id]) => !exclude.has(id)).map(([, mk]) => mk);
  if (rest.length) refs.clustererRef.current?.addMarkers?.(rest);

  if (selId) {
    const sel = refs.markerObjsRef.current[selId];
    try {
      refs.clustererRef.current?.removeMarker?.(sel);
    } catch {}
    sel?.setMap?.(map);
    sel?.setZIndex?.(SELECTED_Z);
  }

  const draftMk = refs.markerObjsRef.current[DRAFT_ID];
  if (draftMk) {
    try {
      refs.clustererRef.current?.removeMarker?.(draftMk);
    } catch {}
    draftMk.setMap(map);
    draftMk.setZIndex(SELECTED_Z + 100);
  }

  // 🔹 클러스터 클릭 → 대표 마커를 골라서 onMarkerClickRef로 전달
  if (
    refs.clustererRef.current &&
    !(refs.clustererRef.current as any).__clusterClickInstalled
  ) {
    (refs.clustererRef.current as any).__clusterClickInstalled = true;

    kakao.maps.event.addListener(
      refs.clustererRef.current,
      "clusterclick",
      (cluster: any) => {
        const markers: any[] = cluster.getMarkers?.() ?? [];
        if (!markers.length) return;

        // 1) 클러스터 안의 첫 번째 마커를 대표로 사용
        const mk = markers[0];

        // 2) markerObjsRef에서 같은 객체를 찾아 id 역추적
        const entry =
          Object.entries(refs.markerObjsRef.current).find(
            ([, v]) => v === mk
          ) ?? null;
        if (!entry) return;

        const [id] = entry;

        // 3) 기존 마커 클릭과 똑같이 타게 함
        refs.onMarkerClickRef.current?.(String(id));
      }
    );
  }

  // 개별 마커는 클러스터러에서만 관리
  mkList.forEach((mk) => mk.setMap?.(null));
  refs.clustererRef.current?.redraw?.();
}

export function applyMode(
  deps: KakaoDeps,
  refs: RefsBag,
  state: SelectionState
) {
  const { kakao, map } = deps;
  const { selectedKey, safeLabelMax, clusterMinLevel } = state;

  const level = map.getLevel();
  const mkList = Object.values(refs.markerObjsRef.current) as any[];
  const labelEntries = Object.entries(refs.labelOvRef.current) as [
    string,
    any
  ][];
  const hitEntries = Object.entries(refs.hitboxOvRef.current) as [
    string,
    any
  ][];

  // ✅ 라벨 원문 복원 유틸(라벨을 화면에 붙이기 직전에 호출)
  const restoreLabel = (id: string, ov: any) => {
    const el = ov?.getContent?.() as HTMLDivElement | null;
    if (!el) return;
    const ds = (el as any).dataset ?? ((el as any).dataset = {});
    // rawLabel이 없다면 현재 텍스트를 원문으로 승격
    if (!ds.rawLabel || ds.rawLabel.trim() === "") {
      ds.rawLabel = el.textContent ?? "";
    }
    const raw = ds.rawLabel ?? "";
    const currentText = el.textContent ?? "";
    if (currentText !== raw) {
      el.textContent = "";
      // 예약 순번 배지까지 포함해서 재합성
      applyOrderBadgeToLabel(el, raw, null);
      el.style.transition =
        el.style.transition || "opacity 120ms ease, transform 120ms ease";
      el.style.willChange = "opacity, transform";
      if (!el.dataset._fadedIn) {
        el.style.opacity = "0";
        el.style.transform = "translateY(2px)";
        requestAnimationFrame(() => {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          el.dataset._fadedIn = "1";
        });
      }
    }
  };

  if (level <= safeLabelMax) {
    refs.clustererRef.current?.clear?.();
    mkList.forEach((mk) => mk.setMap(map));
    const cleared = selectedKey == null;

    const showOv = (ov: any, map: any) => {
      if (ov.getMap?.() !== map) ov.setMap?.(map);
    };
    const hideOv = (ov: any) => {
      if (ov.getMap?.()) ov.setMap?.(null);
    };

    // ✅ 라벨을 보이게 하기 직전에 항상 원문으로 복구
    labelEntries.forEach(([id, ov]) => {
      if (!cleared && id === selectedKey) {
        hideOv(ov);
      } else {
        restoreLabel(id, ov);
        showOv(ov, map);
      }
    });

    hitEntries.forEach(([id, ov]) =>
      ov.setMap(!cleared && id === selectedKey ? null : map)
    );
    if (!cleared)
      refs.markerObjsRef.current[selectedKey!]?.setZIndex?.(SELECTED_Z);
    return;
  }

  if (level >= clusterMinLevel) {
    // 🔹 클러스터 모드 진입 시 kakao도 함께 전달
    mountClusterMode({ kakao, map }, refs, selectedKey);
    return;
  }

  // 중간 줌 레벨: 라벨 숨김, 마커/히트박스만 표시
  labelEntries.forEach(([, ov]) => ov.setMap(null));
  refs.clustererRef.current?.clear?.();
  mkList.forEach((mk) => mk.setMap(map));
  hitEntries.forEach(([, ov]) => ov.setMap(map));
}
