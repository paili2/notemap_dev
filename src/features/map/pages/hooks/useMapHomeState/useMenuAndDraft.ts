// features/map/pages/hooks/useMapHomeState/useMenuAndDraft.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import type { LatLng } from "@/lib/geo/types";
import {
  hideLabelsAround,
  showLabelsAround,
} from "@/features/map/view/overlays/labelRegistry";
import {
  normalizeLL,
  PIN_MENU_MAX_LEVEL,
  DRAFT_PIN_STORAGE_KEY,
  sameCoord,
} from "./mapHome.utils";
import type { OpenMenuOpts } from "./mapHome.types";

type UseMenuAndDraftArgs = {
  kakaoSDK: any;
  mapInstance: any;
  items: PropertyItem[];
  drafts: any[] | undefined;
  toast: (opts: { title: string; description?: string; variant?: any }) => void;
  resolveAddress: (
    pos: LatLng
  ) => Promise<{ road?: string | null; jibun?: string | null }>;
  panToWithOffset: (pos: LatLng, yOffset: number) => void;
  /** 답사예정 등록/삭제 후 서버 핀을 다시 불러오는 함수 (usePinsMap.refetch) */
  refetchPins?: () => void;
};

export function useMenuAndDraft({
  kakaoSDK,
  mapInstance,
  items,
  drafts,
  toast,
  resolveAddress,
  panToWithOffset,
  refetchPins,
}: UseMenuAndDraftArgs) {
  // 라벨 숨김
  const [hideLabelForId, setHideLabelForId] = useState<string | null>(null);
  const onChangeHideLabelForId = useCallback((id: string | null) => {
    setHideLabelForId(id);
  }, []);

  // 메뉴 상태
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<LatLng | null>(null);
  const [menuTargetId, setMenuTargetId] = useState<string | null>(null);
  const [menuRoadAddr, setMenuRoadAddr] = useState<string | null>(null);
  const [menuJibunAddr, setMenuJibunAddr] = useState<string | null>(null);

  // draftPin
  const [draftPin, _setDraftPin] = useState<LatLng | null>(null);
  const restoredDraftPinRef = useRef<LatLng | null>(null);

  const [createFromDraftId, setCreateFromDraftId] = useState<string | null>(
    null
  );

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

  /** 메뉴 오픈 공통 로직 */
  const openMenuAt = useCallback(
    async (
      position: LatLng,
      propertyId: "__draft__" | string,
      opts?: OpenMenuOpts
    ) => {
      const level = mapInstance?.getLevel?.();

      if (
        !opts?.forceOpen &&
        typeof level === "number" &&
        level > PIN_MENU_MAX_LEVEL
      ) {
        toast({
          title: "지도를 더 확대해 주세요",
          description:
            "핀을 선택하거나 위치를 지정하려면 지도를 250m 수준까지 확대해 주세요.",
        });
        return;
      }

      const p = normalizeLL(position);
      const isDraft = propertyId === "__draft__";
      const sid = String(propertyId);

      setMenuTargetId(isDraft ? "__draft__" : sid);
      setDraftPinSafe(isDraft ? p : null);

      if (sid.startsWith("__visit__")) {
        const rawId = sid.replace("__visit__", "");
        setCreateFromDraftId(rawId || null);
      } else {
        setCreateFromDraftId(null);
      }

      // ✅ 여기서 바로 최종 id 로만 세팅 (더 이상 "__draft__" 중간값 안 씀)
      onChangeHideLabelForId(isDraft ? "__draft__" : sid);

      setRawMenuAnchor(p);

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

      if (!opts?.skipPan) {
        panToWithOffset(p, 180);
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });
    },
    [
      toast,
      resolveAddress,
      panToWithOffset,
      setDraftPinSafe,
      onChangeHideLabelForId,
      setRawMenuAnchor,
      mapInstance,
    ]
  );

  const focusAndOpenAt = useCallback(
    async (pos: LatLng, propertyId: "__draft__" | string) => {
      const map = mapInstance;
      const targetLevel = PIN_MENU_MAX_LEVEL;
      const p = normalizeLL(pos);

      if (!map) {
        await openMenuAt(p, propertyId, { forceOpen: true });
        return;
      }

      const ev = kakaoSDK?.maps?.event;
      const currentLevel = map.getLevel?.();
      const needsZoom =
        typeof currentLevel === "number" && currentLevel > targetLevel;

      if (needsZoom) {
        try {
          map.setLevel(targetLevel, { animate: true });
        } catch {
          map.setLevel(targetLevel);
        }

        await new Promise<void>((resolve) => {
          if (!ev || typeof ev.addListener !== "function") {
            setTimeout(resolve, 250);
            return;
          }
          const handler = () => {
            try {
              ev.removeListener(map, "idle", handler);
            } catch {}
            resolve();
          };
          ev.addListener(map, "idle", handler);
        });
      }

      panToWithOffset(p, 180);

      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      );

      await openMenuAt(p, propertyId, { forceOpen: true, skipPan: true });
    },
    [mapInstance, kakaoSDK, panToWithOffset, openMenuAt]
  );

  const focusMapTo = useCallback(
    async (
      pos: LatLng | { lat: number; lng: number } | any,
      opts?: {
        openMenu?: boolean;
        propertyId?: string | "__draft__";
        level?: number;
      }
    ) => {
      const p = normalizeLL(pos);
      const map = mapInstance;
      if (!map) return;

      const targetLevel =
        typeof opts?.level === "number" ? opts.level : PIN_MENU_MAX_LEVEL;

      const currentLevel = map.getLevel?.();
      const needsZoom =
        typeof currentLevel === "number" && currentLevel > targetLevel;

      if (needsZoom) {
        map.setLevel(targetLevel, { animate: true });
      }

      panToWithOffset(p, 180);

      if (opts?.openMenu) {
        await focusAndOpenAt(
          p,
          (opts.propertyId as "__draft__" | string) ?? "__draft__"
        );
      }
    },
    [mapInstance, panToWithOffset, focusAndOpenAt]
  );

  // 마커 클릭
  const handleMarkerClick = useCallback(
    async (id: string | number) => {
      const sid = String(id);

      const item = items.find((p) => String(p.id) === sid);
      if (item) {
        const pos = normalizeLL(item.position);
        await focusAndOpenAt(pos, sid);
        return;
      }

      if (sid.startsWith("__visit__")) {
        const rawId = sid.replace("__visit__", "");
        const draft = (drafts ?? []).find((d: any) => String(d.id) === rawId);
        if (draft) {
          const pos = { lat: draft.lat, lng: draft.lng };
          await focusAndOpenAt(pos as any, `__visit__${rawId}`);
          return;
        }
      }

      if (sid === "__draft__" && draftPin) {
        await focusAndOpenAt(draftPin, "__draft__");
        return;
      }
    },
    [items, drafts, draftPin, focusAndOpenAt]
  );

  useEffect(() => {
    if (!draftPin) return;

    setMenuTargetId("__draft__");
    setRawMenuAnchor(draftPin);

    (async () => {
      const { road, jibun } = await resolveAddress(draftPin);
      setMenuRoadAddr(road ?? null);
      setMenuJibunAddr(jibun ?? null);
    })();

    if (!sameCoord(draftPin, restoredDraftPinRef.current)) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuOpen(true));
      });
    } else {
      setMenuOpen(false);
    }
  }, [draftPin, resolveAddress, setRawMenuAnchor]);

  const closeMenu = useCallback(() => {
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

  /** 답사예정지 등록 완료 시 호출되는 콜백 */
  const onPlanFromMenu = useCallback(
    (pos: LatLng | { lat: number; lng: number } | any) => {
      const p = normalizeLL(pos);

      console.log("[useMenuAndDraft] onPlanFromMenu, call refetchPins", {
        pos,
        normalized: p,
        hasDraftPin: !!draftPin,
      });

      // 메뉴를 열었던 draft 위치와 동일하면 draftPin 비우기
      if (draftPin && sameCoord(draftPin, p)) {
        setDraftPinSafe(null);
      }

      // 메뉴 닫기 및 라벨 복원
      closeMenu();

      console.log("[useMenuAndDraft] onPlanFromMenu, call refetchPins", {
        pos: p,
        hasRefetchPins: typeof refetchPins === "function",
      });

      try {
        refetchPins?.();
        setTimeout(() => {
          refetchPins?.();
        }, 0);
      } catch (e) {
        console.error("[useMenuAndDraft/onPlanFromMenu] refetchPins error:", e);
      }
    },
    [closeMenu, draftPin, setDraftPinSafe, refetchPins]
  );

  const onOpenMenu = useCallback(
    (p: {
      position: { lat: number; lng: number } | any;
      propertyId?: "__draft__" | string | number;
    }) => {
      const pos = normalizeLL(p.position);
      const id = (p.propertyId ?? "__draft__") as "__draft__" | string;
      focusAndOpenAt(pos, id);
    },
    [focusAndOpenAt]
  );

  return {
    // 상태
    hideLabelForId,
    onChangeHideLabelForId,
    menuOpen,
    menuAnchor,
    menuTargetId,
    menuRoadAddr,
    menuJibunAddr,
    draftPin,
    setDraftPin: setDraftPinSafe,
    createFromDraftId,
    setCreateFromDraftId,

    // 핸들러
    setRawMenuAnchor,
    openMenuAt,
    focusAndOpenAt,
    focusMapTo,
    handleMarkerClick,
    closeMenu,
    onPlanFromMenu,
    onOpenMenu,
  } as const;
}
