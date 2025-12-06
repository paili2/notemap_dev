import { mountClusterMode } from "./mountClusterMode";
import type { SelectionState, KakaoDeps, RefsBag } from "./clusterer.types";
import { applyOrderBadgeToLabel, SELECTED_Z } from "./overlays/overlayStyles";

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
