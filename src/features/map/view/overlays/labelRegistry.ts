type Entry = {
  el: HTMLElement;
  lat: number;
  lng: number;
  map: kakao.maps.Map;
};

type Zone = {
  map?: kakao.maps.Map; // ← 맵 미지정(글로벌)도 허용
  lat: number;
  lng: number;
  radius: number; // px
};

const entries = new Set<Entry>();
const activeZones = new Set<Zone>();

function containerPointFromLatLng(
  map: kakao.maps.Map,
  lat: number,
  lng: number
) {
  const proj = map.getProjection();
  const pt = proj.containerPointFromCoords(new kakao.maps.LatLng(lat, lng));
  return { x: pt.x, y: pt.y };
}

function distPx(
  map: kakao.maps.Map,
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const p1 = containerPointFromLatLng(map, a.lat, a.lng);
  const p2 = containerPointFromLatLng(map, b.lat, b.lng);
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export function registerLabel(
  el: HTMLElement,
  lat: number,
  lng: number,
  map: kakao.maps.Map
) {
  console.log("[registerLabel]", { lat, lng, text: el.textContent });
  entries.add({ el, lat, lng, map });
  el.dataset.mapLabel = "1";
  el.style.pointerEvents = "none";

  // 이미 존재하는 억제영역에 들어오면 즉시 숨김 (map 지정/미지정 모두 체크)
  for (const z of activeZones) {
    if (z.map && z.map !== map) continue;
    if (distPx(map, { lat, lng }, { lat: z.lat, lng: z.lng }) <= z.radius) {
      el.classList.add("hidden");
      break;
    }
  }
}

export function unregisterLabel(el: HTMLElement) {
  for (const e of Array.from(entries)) {
    if (e.el === el) {
      entries.delete(e);
    }
  }
}

/** 특정 map에만 적용 */
export function hideLabelsAround(
  map: kakao.maps.Map,
  lat: number,
  lng: number,
  radiusPx = 36
) {
  activeZones.add({ map, lat, lng, radius: radiusPx });

  for (const e of entries) {
    if (e.map !== map) continue;
    if (distPx(map, { lat: e.lat, lng: e.lng }, { lat, lng }) <= radiusPx) {
      e.el.classList.add("hidden");
    }
  }
}

/** map 미지정: 모든 엔트리에 적용 (fallback) */
export function hideLabelsAroundAny(lat: number, lng: number, radiusPx = 36) {
  activeZones.add({ lat, lng, radius: radiusPx }); // map 없음 = 글로벌 영역

  for (const e of entries) {
    if (distPx(e.map, { lat: e.lat, lng: e.lng }, { lat, lng }) <= radiusPx) {
      e.el.classList.add("hidden");
    }
  }
}

export function showLabelsAround(
  map: kakao.maps.Map,
  lat: number,
  lng: number,
  radiusPx = 48
) {
  // 근처 억제영역 제거
  for (const z of Array.from(activeZones)) {
    if (z.map && z.map !== map) continue;

    if (
      distPx(map, { lat: z.lat, lng: z.lng }, { lat, lng }) <=
      Math.max(4, Math.min(radiusPx, z.radius))
    ) {
      activeZones.delete(z);
    }
  }

  // 라벨 다시 보이게
  for (const e of entries) {
    if (e.map !== map) continue;
    if (distPx(map, { lat: e.lat, lng: e.lng }, { lat, lng }) <= radiusPx) {
      e.el.classList.remove("hidden");
    }
  }
}

export function showLabelsAroundAny(lat: number, lng: number, radiusPx = 48) {
  // 글로벌 억제영역 중, 근처 것들 제거
  for (const z of Array.from(activeZones)) {
    if (z.map) continue; // 글로벌 영역만

    // 가장 가까운 엔트리 기준으로 거리 계산 (느슨하게)
    for (const e of entries) {
      if (
        distPx(e.map, { lat: z.lat, lng: z.lng }, { lat, lng }) <=
        Math.max(4, Math.min(radiusPx, z.radius))
      ) {
        activeZones.delete(z);
        break;
      }
    }
  }

  // 라벨 다시 보이게
  for (const e of entries) {
    if (distPx(e.map, { lat: e.lat, lng: e.lng }, { lat, lng }) <= radiusPx) {
      e.el.classList.remove("hidden");
    }
  }
}

// 전역 이벤트 핸들러 중복 등록 방지 플래그
let handlersAttached = false;

// 전역 이벤트 핸들러
export function attachLabelRegistryGlobalHandlers() {
  if (typeof window === "undefined") return;
  if (handlersAttached) return;
  handlersAttached = true;

  const hideHandler = (ev: Event) => {
    const d = (ev as CustomEvent).detail ?? {};
    const { map, lat, lng, radiusPx } = d;
    if (typeof lat === "number" && typeof lng === "number") {
      if (map) hideLabelsAround(map, lat, lng, radiusPx ?? 36);
      else hideLabelsAroundAny(lat, lng, radiusPx ?? 36);
    }
  };

  const showHandler = (ev: Event) => {
    const d = (ev as CustomEvent).detail ?? {};
    const { map, lat, lng, radiusPx } = d;
    if (typeof lat === "number" && typeof lng === "number") {
      if (map) showLabelsAround(map, lat, lng, radiusPx ?? 48);
      else showLabelsAroundAny(lat, lng, radiusPx ?? 48);
    }
  };

  window.addEventListener(
    "map:hide-labels-around",
    hideHandler as EventListener
  );
  window.addEventListener(
    "map:cleanup-overlays-at",
    showHandler as EventListener
  );
}
