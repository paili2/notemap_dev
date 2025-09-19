// 배포 경로(prefix) — 없는 경우 빈 문자열
const PREFIX =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_PATH) ||
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ASSET_PREFIX) ||
  "";

// 캐시/풀
const okImageCache = new Map<string, { size: number; img: any }>(); // 성공한 MarkerImage
const loadingCache = new Map<string, Promise<void>>(); // 이미지 로딩 중복 방지
const markerPool = new Map<string, any>(); // key -> kakao.maps.Marker

// 깜빡임 방지용 프레임/유예(최근 N프레임 안 보인 것만 숨김)
let tick = 0;
const seenTick = new Map<string, number>(); // key -> 마지막으로 본 tick

export function beginPoiFrame() {
  tick += 1;
}

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

function loadImageOnce(url: string) {
  if (okImageCache.has(url)) return Promise.resolve();
  const inFlight = loadingCache.get(url);
  if (inFlight) return inFlight;

  const p = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`icon load failed: ${url}`));
    img.src = url;
  })
    .catch(() => {
      // 실패 시 기본 마커 유지
    })
    .finally(() => {
      loadingCache.delete(url);
    });

  loadingCache.set(url, p);
  return p;
}

function getMarkerImage(kakao: any, url: string, sizePx: number) {
  const key = `${url}|${sizePx}`;
  const cached = okImageCache.get(key);
  if (cached) return cached.img;

  const img = new kakao.maps.MarkerImage(
    url,
    new kakao.maps.Size(sizePx, sizePx),
    { offset: new kakao.maps.Point(sizePx / 2, sizePx / 2) }
  );
  okImageCache.set(key, { size: sizePx, img });
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
  iconUrl?: string
) {
  const pos = new kakao.maps.LatLng(y, x);
  let m: any = markerPool.get(key);

  if (!m) {
    m = new kakao.maps.Marker({ map, position: pos, title });
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
    if (!m.getMap()) m.setMap(map);
    if (!m.getVisible?.()) m.setVisible(true);
  }

  // 아이콘
  const resolved = resolveIconPath(iconUrl);
  if (resolved) {
    const dpr =
      (typeof window !== "undefined" ? window.devicePixelRatio : 1) || 1;
    const base = 24;
    const size = dpr >= 1.5 ? base * 2 : base;

    loadImageOnce(resolved).then(() => {
      const nextImage = getMarkerImage(kakao, resolved, size);
      const curImage = m.getImage?.();
      if (curImage !== nextImage) m.setImage(nextImage);
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
      if (m.getVisible?.()) m.setVisible(false);
    }
  });
}

/** 배열로 받은 마커 제거(레거시 호환) */
export function clearMarkers(markers: any[]) {
  markers.forEach((m) => m?.setMap?.(null));
}

/** 전체 풀 리셋 */
export function resetPoiPool() {
  markerPool.forEach((m) => m?.setMap?.(null));
  markerPool.clear();
  okImageCache.clear();
  loadingCache.clear();
  seenTick.clear();
  tick = 0;
}
