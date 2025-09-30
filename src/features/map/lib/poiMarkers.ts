"use client";

/**
 * POI 마커 풀/캐시 관리 유틸
 * - upsertPoiMarker: 마커 생성/업데이트
 * - reconcilePoiMarkers: 최근 N프레임 동안 보지 못한 마커 숨김
 * - clearMarkers: 배열로 받은 마커들 숨김/해제
 * - resetPoiPool: 전체 리셋
 * - beginPoiFrame: 프레임 틱 증가(깜빡임 억제용)
 */

// 배포 경로(prefix) — 없는 경우 빈 문자열
const PREFIX =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_PATH) ||
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ASSET_PREFIX) ||
  "";

/** 성공적으로 로드된 URL 집합(중복 네트워크 로딩 방지) */
const okUrlSet = new Set<string>();

/** 로딩 중복 방지 */
const loadingCache = new Map<string, Promise<void>>();

/** url|sizePx -> kakao.maps.MarkerImage */
const markerImageCache = new Map<string, any>();

/** key(kind:id) -> kakao.maps.Marker */
const markerPool = new Map<string, any>();

// 깜빡임 방지용 프레임/유예(최근 N프레임 안 보인 것만 숨김)
let tick = 0;
const seenTick = new Map<string, number>(); // key -> 마지막으로 본 tick

/** 프레임 시작 시 호출(렌더 루프 외부에서 수동 호출) */
export function beginPoiFrame() {
  tick += 1;
}

/** 아이콘 경로 정규화: prefix 붙이기 / data:, blob:, http(s) 유지 */
function resolveIconPath(url?: string) {
  if (!url) return undefined;

  // data:, blob:, http(s):, //cdn 경로는 그대로
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    /^https?:\/\//.test(url) ||
    url.startsWith("//")
  ) {
    return url;
  }

  // 절대경로면 prefix만 붙여 반환
  if (url.startsWith("/")) {
    const p = PREFIX.replace(/\/$/, "");
    return `${p}${url}`;
  }

  // 상대경로("icons/...")는 prefix 붙여 반환
  const clean = url.replace(/^public\//, "").replace(/^\//, "");
  const p = PREFIX.replace(/\/$/, "");
  return `${p}/${clean}`;
}

/** 단일 URL 이미지 로딩(성공/실패 결과를 캐시) */
function loadImageOnce(url: string) {
  if (okUrlSet.has(url)) return Promise.resolve();
  const inFlight = loadingCache.get(url);
  if (inFlight) return inFlight;

  const p = new Promise<void>((resolve, reject) => {
    // 브라우저 환경 보장
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => {
      okUrlSet.add(url);
      resolve();
    };
    img.onerror = () => {
      // 실패 시 기본 마커 유지
      reject(new Error(`icon load failed: ${url}`));
    };
    img.src = url;
  })
    .catch(() => {
      // 실패는 무시(기본 마커 유지)
    })
    .finally(() => {
      loadingCache.delete(url);
    });

  loadingCache.set(url, p);
  return p;
}

/** url+size로 kakao MarkerImage 가져오기(캐시) */
function getMarkerImage(kakao: any, url: string, sizePx: number) {
  const key = `${url}|${sizePx}`;
  const cached = markerImageCache.get(key);
  if (cached) return cached;

  const img = new kakao.maps.MarkerImage(
    url,
    new kakao.maps.Size(sizePx, sizePx),
    { offset: new kakao.maps.Point(sizePx / 2, sizePx / 2) }
  );
  markerImageCache.set(key, img);
  return img;
}

/** 업서트(재사용) — 마커를 만들거나 업데이트. 실패 시 기본 마커 유지 */
export function upsertPoiMarker(
  kakao: any,
  map: any,
  key: string, // kind:id 또는 kind:x,y
  x: number,
  y: number,
  title: string,
  iconUrl?: string, // 문자열 URL만 받습니다(객체를 넘기면 startsWith 에러).
  opts?: { zIndex?: number }
) {
  const pos = new kakao.maps.LatLng(y, x);
  let m: any = markerPool.get(key);

  if (!m) {
    m = new kakao.maps.Marker({ map, position: pos, title });
    if (opts?.zIndex != null && typeof m.setZIndex === "function") {
      m.setZIndex(opts.zIndex);
    }
    markerPool.set(key, m);
  } else {
    // 위치가 크게 바뀐 경우에만 업데이트(미세 변화로 인한 잔떨림 감소)
    const cur = m.getPosition?.();
    if (
      !cur ||
      Math.abs(cur.getLat() - y) > 1e-7 ||
      Math.abs(cur.getLng() - x) > 1e-7
    ) {
      m.setPosition(pos);
    }
    if (!m.getMap?.()) m.setMap?.(map);
    // ✅ setVisible 안전 호출(없으면 setMap로 대체)
    if (m.setVisible) m.setVisible(true);
    else if (!m.getMap?.()) m.setMap?.(map);
    if (opts?.zIndex != null && typeof m.setZIndex === "function") {
      m.setZIndex(opts.zIndex);
    }
  }

  // 아이콘 교체
  const resolved = resolveIconPath(iconUrl);
  if (resolved) {
    const dpr =
      (typeof window !== "undefined" ? window.devicePixelRatio : 1) || 1;
    const base = 24;
    const size = dpr >= 1.5 ? base * 2 : base;

    loadImageOnce(resolved).then(() => {
      const nextImage = getMarkerImage(kakao, resolved, size);
      const curImage = m.getImage?.();
      if (curImage !== nextImage) m.setImage?.(nextImage);
    });
  }

  // 이번 프레임에 보였음을 기록
  seenTick.set(key, tick);

  return m;
}

/** 이번 프레임에서 '보지 못한' 마커를 N프레임 유예 뒤 숨김 */
export function reconcilePoiMarkers(
  keepKeys: Set<string>,
  opts?: { graceFrames?: number }
) {
  const grace = Math.max(1, opts?.graceFrames ?? 2); // 기본 2프레임 유예
  // keepKeys는 이미 upsert 시 seenTick을 찍었으므로 여기선 숨김만 처리
  markerPool.forEach((m, key) => {
    if (keepKeys.has(key)) return;
    const last = seenTick.get(key) ?? -9999;
    const stale = tick - last >= grace;
    if (stale) {
      // ✅ setVisible이 없으면 setMap(null)로 폴백
      if (typeof m.setVisible === "function") {
        if (m.getVisible?.()) m.setVisible(false);
      } else {
        m.setMap?.(null);
      }
    }
  });
}

/** 배열로 받은 마커 제거(레거시 호환) */
export function clearMarkers(markers: any[]) {
  markers.forEach((m) => {
    // 가급적 setVisible(false)로 숨기고, 없으면 setMap(null)
    if (typeof m?.setVisible === "function") m.setVisible(false);
    else m?.setMap?.(null);
  });
}

/** 전체 풀 리셋 */
export function resetPoiPool() {
  markerPool.forEach((m) => {
    if (typeof m?.setVisible === "function") m.setVisible(false);
    else m?.setMap?.(null);
  });
  markerPool.clear();
  markerImageCache.clear();
  loadingCache.clear();
  okUrlSet.clear();
  seenTick.clear();
  tick = 0;
}
