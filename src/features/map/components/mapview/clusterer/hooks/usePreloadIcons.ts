"use client";

import { useEffect, useRef } from "react";
import type { MapMarker } from "@/features/map/shared/types/mapMarker.type";
import type { PinKind } from "@/features/pins/types";

export function usePreloadIcons(
  isReady: boolean,
  markers: readonly MapMarker[],
  defaultPinKind: PinKind,
  depsKey: string
) {
  const preloadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isReady) return;

    const urls = new Set<string>();
    markers.forEach((m: any) => {
      const kind: PinKind = (m?.kind ?? defaultPinKind) as PinKind;
      try {
        const { getPinUrl } = require("@/features/pins/lib/assets");
        const url = getPinUrl(kind);
        if (typeof url === "string" && url) urls.add(url);
      } catch {
        /* ignore */
      }
    });

    urls.forEach((url) => {
      if (preloadedRef.current.has(url)) return;
      const img = new Image();
      img.src = url;
      preloadedRef.current.add(url);
    });
  }, [isReady, defaultPinKind, depsKey, markers]);
}
