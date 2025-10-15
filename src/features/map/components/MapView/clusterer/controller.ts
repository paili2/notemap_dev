import { DRAFT_ID, SELECTED_Z } from "./style";
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

  if (level <= safeLabelMax) {
    refs.clustererRef.current?.clear?.();
    mkList.forEach((mk) => mk.setMap(map));
    const cleared = selectedKey == null;
    labelEntries.forEach(([id, ov]) =>
      ov.setMap(!cleared && id === selectedKey ? null : map)
    );
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

  labelEntries.forEach(([, ov]) => ov.setMap(null));
  refs.clustererRef.current?.clear?.();
  mkList.forEach((mk) => mk.setMap(map));
  hitEntries.forEach(([, ov]) => ov.setMap(map));
}
