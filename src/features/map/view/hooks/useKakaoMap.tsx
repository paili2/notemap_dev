import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { loadKakaoOnce } from "@/lib/kakao/loader";
import { KOREA_BOUNDS } from "@/features/map/shared/constants";
import type { LatLng } from "@/lib/geo/types";

type Args = {
  appKey: string;
  center: LatLng;
  level?: number;
  /** 초기 로드시 전국 bounds에 맞추기 */
  fitKoreaBounds?: boolean;
  /** 최초 로드시 브라우저 현재 위치를 center로 사용 */
  useCurrentLocationOnInit?: boolean;
  /** 우리가 허용하는 최대 축소 레벨 */
  maxLevel?: number;
  /** center prop 변경 시 자동 panTo 비활성화 */
  disableAutoPan?: boolean;
  /** idle 콜백 디바운스(ms). 기본 120ms */
  viewportDebounceMs?: number;
  onMapReady?: (args: { kakao: any; map: any }) => void;
  onViewportChange?: (query: {
    leftTop: LatLng;
    leftBottom: LatLng;
    rightTop: LatLng;
    rightBottom: LatLng;
    zoomLevel: number;
  }) => void;
};

type SearchOptions = {
  clearPrev?: boolean;
  recenter?: boolean;
  fitZoom?: boolean;
  /** 입력이 ‘…역’일 때 지하철역(SW8)부터 우선 검색 */
  preferStation?: boolean;
  /** 기본 검색 마커(파란핀) 표시 여부 (기본 true) */
  showMarker?: boolean;
  /** 좌표를 받아서 추가 행동(로드뷰 열기 등) 수행 */
  onFound?: (pos: LatLng) => void;
};

const DEFAULT_VIEWPORT_DEBOUNCE = 120;

// ─────────────────────────────────────────────
// HTTPS 유틸
// ─────────────────────────────────────────────
const forceHttps = (u?: string) =>
  typeof u === "string" ? u.replace(/^http:\/\//, "https://") : u;

/** 지도 DOM 하위에서 http 이미지를 실시간 https로 치환 */
function installHttpsImagePatch(root: HTMLElement) {
  const toHttps = (s: string) => s.replaceAll("http://", "https://");

  const fixElement = (el: Element) => {
    // <img src="http://...">
    if (el instanceof HTMLImageElement) {
      const raw = el.getAttribute("src");
      if (raw && raw.startsWith("http://")) {
        el.setAttribute("src", toHttps(raw));
      }
    }
    // inline style에 background: url("http://...")
    if (el instanceof HTMLElement) {
      const styleAttr = el.getAttribute("style");
      if (styleAttr && styleAttr.includes("http://")) {
        el.setAttribute("style", toHttps(styleAttr));
      }
    }
  };

  // 초기 스캔
  root.querySelectorAll("*").forEach(fixElement);

  // 이후 변경 감시
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "attributes") {
        if (
          (m.target instanceof HTMLImageElement && m.attributeName === "src") ||
          (m.target instanceof HTMLElement && m.attributeName === "style")
        ) {
          fixElement(m.target as Element);
        }
      }
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) {
            const el = n as Element;
            fixElement(el);
            el.querySelectorAll?.("*").forEach(fixElement);
          }
        });
      }
    }
  });

  mo.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["src", "style"],
  });

  return () => mo.disconnect();
}

function useStableRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

const useKakaoMap = ({
  appKey,
  center,
  level = 5,
  fitKoreaBounds = false,
  /** 기본값: false */
  useCurrentLocationOnInit = false,
  maxLevel = 11,
  disableAutoPan = false,
  viewportDebounceMs = DEFAULT_VIEWPORT_DEBOUNCE,
  onMapReady,
  onViewportChange,
}: Args) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const kakaoRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  const [ready, setReady] = useState(false);

  // 옵션/콜백 ref로 고정
  const maxLevelRef = useRef<number>(maxLevel);
  const onViewportChangeRef = useStableRef(onViewportChange);

  // Kakao services 재사용
  const geocoderRef = useRef<any>(null);
  const placesRef = useRef<any>(null);

  // 검색 마커 1개 유지
  const lastSearchMarkerRef = useRef<any>(null);

  // 리스너/타이머
  const zoomListenerRef = useRef<((...a: any[]) => void) | null>(null);
  const idleListenerRef = useRef<((...a: any[]) => void) | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  // center prop → map.panTo 동기화 시 첫 호출은 스킵(초기값은 생성자에서 이미 반영됨)
  const firstCenterSyncRef = useRef(true);

  // ─────────────────────────────────────────────
  // 1) 지도 초기화: 최초 1회만 생성
  // ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;

    (async () => {
      try {
        const kakao = await loadKakaoOnce(appKey, {
          autoload: false,
          libs: ["services", "clusterer"],
        });
        if (cancelled || !containerRef.current) return;

        kakaoRef.current = kakao;

        // (A) HTTP → HTTPS 패치 (SDK 기본 리소스)
        try {
          // 1) 클러스터 기본 스프라이트 경로 https로 고정
          if (kakao?.maps?.MarkerClusterer) {
            kakao.maps.MarkerClusterer.prototype.IMAGE_PATH =
              "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerCluster";
          }
          // 2) 타일 URL이 http로 반환되면 https로 치환
          if (kakao?.maps?.services?.TileUrl) {
            const origin = kakao.maps.services.TileUrl;
            kakao.maps.services.TileUrl = (...args: any[]) =>
              forceHttps(origin(...args));
          }
        } catch (patchErr) {
          console.warn("[Kakao HTTPS patch] skipped:", patchErr);
        }

        if (!mapRef.current) {
          const map = new kakao.maps.Map(containerRef.current, {
            center: new kakao.maps.LatLng(center.lat, center.lng),
            level,
          });
          mapRef.current = map;

          // (B) 지도 DOM 아래 http→https 강제 옵저버 설치
          try {
            const node: HTMLElement = map.getNode();
            const detach = installHttpsImagePatch(node);
            (map as any).__detachHttpsPatch__ = detach;
          } catch (e) {
            console.warn("[https image patch] attach failed:", e);
          }

          // services 준비 (전역 재사용)
          geocoderRef.current = new kakao.maps.services.Geocoder();
          placesRef.current = new kakao.maps.services.Places();

          // 축소 상한
          maxLevelRef.current = maxLevel;
          map.setMaxLevel(maxLevelRef.current);

          // 전국 보기 옵션 (초기 1회)
          if (fitKoreaBounds) {
            const bounds = new kakao.maps.LatLngBounds(
              new kakao.maps.LatLng(KOREA_BOUNDS.sw.lat, KOREA_BOUNDS.sw.lng),
              new kakao.maps.LatLng(KOREA_BOUNDS.ne.lat, KOREA_BOUNDS.ne.lng)
            );
            map.setBounds(bounds);
            const lv = map.getLevel();
            maxLevelRef.current = lv;
            map.setMaxLevel(lv);
          }

          // ✅ 최초 로드시 현재 위치로 지도 중심 이동 (옵션 켰을 때만)
          if (useCurrentLocationOnInit && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude, longitude } = pos.coords;
                const next = new kakao.maps.LatLng(latitude, longitude);
                const cur = map.getCenter?.();

                if (
                  !cur ||
                  cur.getLat() !== next.getLat() ||
                  cur.getLng() !== next.getLng()
                ) {
                  map.setCenter(next);
                }
              },
              (err) => {
                console.warn("[useKakaoMap] 현재 위치 가져오기 실패:", err);
                // 실패 시에는 그냥 center/fitKoreaBounds 값 유지
              },
              {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 60_000, // 1분 이내 캐시된 위치 허용
              }
            );
          }
        }

        setReady(true);
        onMapReady?.({ kakao, map: mapRef.current });
      } catch (e) {
        console.error("Kakao SDK load failed:", e);
      }
    })();

    return () => {
      cancelled = true;

      // 정리(언마운트 시)
      const kakao = kakaoRef.current;
      const map = mapRef.current;

      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }

      if (kakao?.maps?.event && map) {
        if (zoomListenerRef.current) {
          kakao.maps.event.removeListener(
            map,
            "zoom_changed",
            zoomListenerRef.current
          );
          zoomListenerRef.current = null;
        }
        if (idleListenerRef.current) {
          kakao.maps.event.removeListener(map, "idle", idleListenerRef.current);
          idleListenerRef.current = null;
        }
      }

      if (lastSearchMarkerRef.current) {
        lastSearchMarkerRef.current.setMap(null);
        lastSearchMarkerRef.current = null;
      }

      // https 패치 옵저버 해제
      try {
        (map as any)?.__detachHttpsPatch__?.();
      } catch {}

      // mapRef는 언마운트 시에만 null
      mapRef.current = null;
      // kakaoRef는 SDK 전역이므로 유지
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 최초 1회

  // ─────────────────────────────────────────────
  // 2) 이벤트 리스너 등록 (1회)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!ready || !kakao || !map) return;

    // 최대 확대 제한
    if (!zoomListenerRef.current) {
      const onZoomChanged = () => {
        const lv = map.getLevel();
        if (lv > maxLevelRef.current) map.setLevel(maxLevelRef.current);
      };
      kakao.maps.event.addListener(map, "zoom_changed", onZoomChanged);
      zoomListenerRef.current = onZoomChanged;
    }

    // idle 시 디바운스된 뷰포트 변경 콜백
    if (!idleListenerRef.current) {
      const onIdle = () => {
        if (!onViewportChangeRef.current) return;

        if (idleTimerRef.current) {
          window.clearTimeout(idleTimerRef.current);
        }
        idleTimerRef.current = window.setTimeout(() => {
          if (!mapRef.current) return;
          const b = mapRef.current.getBounds();
          const sw = b.getSouthWest(); // 좌하
          const ne = b.getNorthEast(); // 우상
          onViewportChangeRef.current?.({
            leftTop: { lat: ne.getLat(), lng: sw.getLng() },
            leftBottom: { lat: sw.getLat(), lng: sw.getLng() },
            rightTop: { lat: ne.getLat(), lng: ne.getLng() },
            rightBottom: { lat: sw.getLat(), lng: ne.getLng() },
            zoomLevel: mapRef.current.getLevel(),
          });
        }, viewportDebounceMs);
      };
      kakao.maps.event.addListener(map, "idle", onIdle);
      idleListenerRef.current = onIdle;
    }
  }, [ready, viewportDebounceMs, onViewportChangeRef]);

  // ─────────────────────────────────────────────
  // 3) center/level은 조작으로만 반영
  // ─────────────────────────────────────────────
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!ready || !kakao || !map || disableAutoPan) return;

    // 첫 호출은 스킵 (초기 center는 생성자/현재위치 로직에서 처리)
    if (firstCenterSyncRef.current) {
      firstCenterSyncRef.current = false;
      return;
    }

    const current = map.getCenter?.();
    const next = new kakao.maps.LatLng(center.lat, center.lng);

    if (
      current &&
      current.getLat() === next.getLat() &&
      current.getLng() === next.getLng()
    ) {
      return;
    }

    const raf = requestAnimationFrame(() => {
      map.panTo(next);
    });
    return () => cancelAnimationFrame(raf);
  }, [center.lat, center.lng, disableAutoPan, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const desired = Math.min(level, maxLevelRef.current);
    if (map.getLevel?.() !== desired) {
      map.setLevel(desired);
    }
  }, [level, ready]);

  // ─────────────────────────────────────────────
  // 4) 유틸
  // ─────────────────────────────────────────────
  const clearLastMarker = useCallback(() => {
    if (lastSearchMarkerRef.current) {
      lastSearchMarkerRef.current.setMap(null);
      lastSearchMarkerRef.current = null;
    }
  }, []);

  const placeMarkerAt = useCallback((coords: any, opts?: SearchOptions) => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    const {
      clearPrev = true,
      recenter = true,
      fitZoom = false,
      showMarker = true,
    } = opts || {};

    if ((clearPrev || showMarker === false) && lastSearchMarkerRef.current) {
      lastSearchMarkerRef.current.setMap(null);
      lastSearchMarkerRef.current = null;
    }

    if (recenter) {
      const current = map.getCenter?.();
      if (
        !current ||
        current.getLat() !== coords.getLat() ||
        current.getLng() !== coords.getLng()
      ) {
        map.setCenter(coords);
      }
    }

    if (fitZoom) {
      const targetLevel = Math.min(5, maxLevelRef.current);
      if (map.getLevel?.() !== targetLevel) map.setLevel(targetLevel);
    }

    if (showMarker === false) return;

    // 기본 스프라이트 대신 https 아이콘을 명시해 Mixed Content 방지
    const imgUrl =
      "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
    const image = new kakao.maps.MarkerImage(
      imgUrl,
      new kakao.maps.Size(24, 35),
      { offset: new kakao.maps.Point(12, 35) }
    );

    const marker = new kakao.maps.Marker({
      map,
      position: coords,
      image,
    });
    lastSearchMarkerRef.current = marker;
  }, []);

  const searchPlace = useCallback(
    (query: string, opts?: SearchOptions) => {
      if (!ready || !kakaoRef.current || !mapRef.current || !query) return;

      const kakao = kakaoRef.current;
      const geocoder =
        geocoderRef.current ?? new kakao.maps.services.Geocoder();
      const places = placesRef.current ?? new kakao.maps.services.Places();
      geocoderRef.current = geocoder;
      placesRef.current = places;

      const { preferStation = false, onFound } = opts || {};
      const endsWithStation = query.trim().endsWith("역");

      const tryStationFirst = (): Promise<{
        lat: number;
        lng: number;
      } | null> =>
        new Promise((resolve) => {
          places.keywordSearch(query, (data: any[], status: string) => {
            if (status === kakao.maps.services.Status.OK && data?.length) {
              const station =
                data.find(
                  (d) =>
                    d.category_group_code === "SW8" ||
                    d.category_name?.includes("지하철역")
                ) || null;
              if (station) {
                resolve({
                  lat: parseFloat(station.y),
                  lng: parseFloat(station.x),
                });
                return;
              }
            }
            resolve(null);
          });
        });

      const tryKeyword = (): Promise<{ lat: number; lng: number } | null> =>
        new Promise((resolve) => {
          places.keywordSearch(query, (data: any[], status: string) => {
            if (status === kakao.maps.services.Status.OK && data?.[0]) {
              resolve({
                lat: parseFloat(data[0].y),
                lng: parseFloat(data[0].x),
              });
            } else {
              resolve(null);
            }
          });
        });

      const tryAddress = (): Promise<{ lat: number; lng: number } | null> =>
        new Promise((resolve) => {
          geocoder.addressSearch(query, (res: any[], status: string) => {
            if (status === kakao.maps.services.Status.OK && res?.[0]) {
              resolve({
                lat: parseFloat(res[0].y),
                lng: parseFloat(res[0].x),
              });
            } else {
              resolve(null);
            }
          });
        });

      (async () => {
        let found: { lat: number; lng: number } | null = null;

        if (endsWithStation || preferStation) {
          found = await tryStationFirst();
          if (!found) found = await tryKeyword();
          if (!found) found = await tryAddress();
        } else {
          found = await tryAddress();
          if (!found) found = await tryKeyword();
        }

        if (!found) {
          console.warn("검색 결과 없음:", query);
          return;
        }

        placeMarkerAt(new kakao.maps.LatLng(found.lat, found.lng), opts);
        onFound?.({ lat: found.lat, lng: found.lng });
      })();
    },
    [placeMarkerAt, ready]
  );

  // 외부 제어 API
  const panTo = useCallback((p: LatLng) => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;
    const next = new kakao.maps.LatLng(p.lat, p.lng);
    const cur = map.getCenter?.();
    if (
      !cur ||
      cur.getLat() !== next.getLat() ||
      cur.getLng() !== next.getLng()
    ) {
      map.panTo(next);
    }
  }, []);

  const fitBounds = useCallback((points: LatLng[]) => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map || !points?.length) return;
    const b = new kakao.maps.LatLngBounds();
    points.forEach((p) => b.extend(new kakao.maps.LatLng(p.lat, p.lng)));
    map.setBounds(b);
  }, []);

  const setMaxLevel = useCallback((maxLv: number) => {
    const map = mapRef.current;
    if (!map) return;
    maxLevelRef.current = maxLv;
    map.setMaxLevel(maxLv);
    const lv = map.getLevel?.();
    if (typeof lv === "number" && lv > maxLv) {
      map.setLevel(maxLv);
    }
  }, []);

  const api = useMemo(
    () => ({
      containerRef,
      kakao: kakaoRef.current,
      map: mapRef.current,
      ready,
      searchPlace,
      clearLastMarker,
      panTo,
      fitBounds,
      setMaxLevel,
    }),
    [ready, searchPlace, clearLastMarker, panTo, fitBounds, setMaxLevel]
  );

  return api;
};

export default useKakaoMap;
