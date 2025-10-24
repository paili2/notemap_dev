import { DRAFT_ID, SELECTED_Z, applyOrderBadgeToLabel } from "./style";
import type { SelectionState, KakaoDeps, RefsBag } from "./types";

export function mountClusterMode(
  deps: KakaoDeps,
  refs: RefsBag,
  selId: string | null
) {
  const { map } = deps;
  const entries = Object.entries(refs.markerObjsRef.current) as [string, any][];
  const mkList = entries.map(([, mk]) => mk);

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
    }
  };

  if (level <= safeLabelMax) {
    refs.clustererRef.current?.clear?.();
    mkList.forEach((mk) => mk.setMap(map));
    const cleared = selectedKey == null;

    // ✅ 라벨을 보이게 하기 직전에 항상 원문으로 복구
    labelEntries.forEach(([id, ov]) => {
      if (!cleared && id === selectedKey) {
        ov.setMap(null);
      } else {
        restoreLabel(id, ov);
        ov.setMap(map);
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
    mountClusterMode({ kakao, map }, refs, selectedKey);
    return;
  }

  // 중간 줌 레벨: 라벨 숨김, 마커/히트박스만 표시
  labelEntries.forEach(([, ov]) => ov.setMap(null));
  refs.clustererRef.current?.clear?.();
  mkList.forEach((mk) => mk.setMap(map));
  hitEntries.forEach(([, ov]) => ov.setMap(map));
}
