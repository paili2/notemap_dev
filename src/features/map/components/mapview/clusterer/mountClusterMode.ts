import { KakaoDeps, RefsBag } from "./clusterer.types";
import { DRAFT_ID, SELECTED_Z } from "./overlays/overlayStyles";

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
