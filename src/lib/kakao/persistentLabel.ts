import { KakaoLatLngLiteral } from "./types";

export type PersistentLabelOptions = {
  kakao: any;
  map: any;
  position: KakaoLatLngLiteral;
  text: string;
  /** 라벨을 보이게 할 최대 level (예: 5 → 5 이하에서 표시, 6 이상에서 숨김). null이면 항상 표시 */
  maxVisibleLevel?: number | null;
  zIndex?: number;
};

export function createPersistentLabel({
  kakao,
  map,
  position,
  text,
  maxVisibleLevel = 5, // ✅ 300m 근사(= level 5)에서도 보이게
  zIndex = 10_000,
}: PersistentLabelOptions) {
  const el = document.createElement("div");
  el.className = "kakao-label";
  el.innerText = text;

  // 간단한 기본 스타일 (원하면 Tailwind로 클래스 주입해서 꾸며도 됨)
  Object.assign(el.style, {
    position: "relative",
    transform: "translate(-50%, -100%)",
    padding: "4px 8px",
    borderRadius: "6px",
    background: "white",
    border: "1px solid rgba(0,0,0,0.12)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    fontSize: "12px",
    lineHeight: "1",
    whiteSpace: "nowrap",
    pointerEvents: "none", // 지도 인터랙션 방해 X
  } as CSSStyleDeclaration);

  const overlay = new kakao.maps.CustomOverlay({
    position: new kakao.maps.LatLng(position.lat, position.lng),
    content: el,
    yAnchor: 1, // 말풍선처럼 위에 붙게
    zIndex,
  });

  const applyVisibility = () => {
    if (maxVisibleLevel == null) {
      overlay.setMap(map); // 항상 표시
      return;
    }
    const level = map.getLevel();
    if (level <= maxVisibleLevel) {
      overlay.setMap(map);
    } else {
      overlay.setMap(null);
    }
  };

  // 초기 표시
  applyVisibility();

  // 줌 변화에 맞춰 표시/숨김
  const zoomListener = kakao.maps.event.addListener(
    map,
    "zoom_changed",
    applyVisibility
  );
  // 위치가 바뀌었을 때 라벨도 옮기고 싶다면 center_changed 등 추가로 리스너 연결 가능

  return {
    overlay,
    setText(next: string) {
      el.innerText = next;
    },
    setPosition(next: { lat: number; lng: number }) {
      overlay.setPosition(new kakao.maps.LatLng(next.lat, next.lng));
    },
    showAlways() {
      maxVisibleLevel = null;
      applyVisibility();
    },
    setMaxVisibleLevel(n: number | null) {
      maxVisibleLevel = n;
      applyVisibility();
    },
    destroy() {
      kakao.maps.event.removeListener(zoomListener);
      overlay.setMap(null);
    },
  };
}
