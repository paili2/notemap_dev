"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type LatLng = { lat: number; lng: number };

type Options = {
  kakaoSDK?: any; // window.kakao를 주입받을 수도 있음
  map?: any; // kakao.maps.Map 인스턴스
  autoSync?: boolean; // true면 openAtCenter()가 map 중심 사용
};

export type UseRoadview = {
  /** 로드뷰 DOM 컨테이너 ref (필수) */
  roadviewContainerRef: React.RefObject<HTMLDivElement>;
  /** 현재 패널 표시 여부 */
  visible: boolean;
  /** 파노라마 찾는 중 */
  loading: boolean;
  /** 맵 중심(또는 마지막 좌표)에서 열기 */
  openAtCenter: () => void;
  /** 특정 좌표에서 열기 (face: 바라볼 좌표) */
  openAt: (pos: LatLng, opts?: { face?: LatLng }) => void;
  /** 닫기 */
  close: () => void;
  /** 컨테이너 사이즈 변경 시 relayout */
  resize: () => void;
};

declare global {
  interface Window {
    kakao: any;
  }
}

/* ---- heading 계산 유틸: pano(시작) -> face(대상) 방위각 ---- */
function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function toDeg(r: number) {
  return (r * 180) / Math.PI;
}
/** -180~180 범위의 pan 각도로 변환 */
function heading(from: LatLng, to: LatLng) {
  const φ1 = toRad(from.lat),
    φ2 = toRad(to.lat);
  const Δλ = toRad(to.lng - from.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ) + Math.sin(φ1) * Math.sin(φ2);
  const θ = Math.atan2(y, x); // -π~π
  const deg0_360 = (toDeg(θ) + 360) % 360;
  return deg0_360 > 180 ? deg0_360 - 360 : deg0_360; // -180~180
}

export function useRoadview(opts: Options = {}): UseRoadview {
  const { kakaoSDK, map, autoSync = true } = opts;

  const roadviewContainerRef = useRef<HTMLDivElement>(null);
  const roadviewRef = useRef<any>(null);
  const initListenerRef = useRef<any>(null);

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastPosRef = useRef<LatLng | null>(null);

  const getKakao = () =>
    kakaoSDK ?? (typeof window !== "undefined" ? window.kakao : undefined);

  const ensureInstance = useCallback(() => {
    const el = roadviewContainerRef.current;
    const kakao = getKakao();
    if (!el || !kakao?.maps) return false;
    if (!roadviewRef.current) {
      roadviewRef.current = new kakao.maps.Roadview(el);
    }
    return true;
  }, [kakaoSDK]);

  /** pos 주변에서 가장 가까운 파노라마를 찾아 로드뷰 세팅 + face 방향으로 카메라 회전 */
  const renderAt = useCallback(
    async (pos: LatLng, face?: LatLng) => {
      const kakao = getKakao();
      if (!kakao?.maps) return;
      if (!ensureInstance()) return;

      setLoading(true);
      lastPosRef.current = pos;

      const rvClient = new kakao.maps.RoadviewClient();
      const target = new kakao.maps.LatLng(pos.lat, pos.lng);

      const radii = [50, 100, 200, 400]; // 반경 확장
      let found = false;

      // init 리스너 중복 방지
      if (initListenerRef.current) {
        kakao.maps.event.removeListener(
          roadviewRef.current,
          "init",
          initListenerRef.current
        );
        initListenerRef.current = null;
      }

      for (const r of radii) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise<void>((done) => {
          rvClient.getNearestPanoId(target, r, (panoId: number | null) => {
            if (panoId) {
              roadviewRef.current.setPanoId(panoId, target);
              setVisible(true);

              // pano 변경 후 초기화 시점에 카메라 방향 설정
              const listener = kakao.maps.event.addListener(
                roadviewRef.current,
                "init",
                () => {
                  try {
                    if (face) {
                      const panoPos = roadviewRef.current.getPosition();
                      const pan = heading(
                        { lat: panoPos.getLat(), lng: panoPos.getLng() },
                        face
                      );
                      roadviewRef.current.setViewpoint({
                        pan,
                        tilt: 0,
                        zoom: 0,
                      });
                    }
                    // 살짝 지연 후 레이아웃 보정
                    setTimeout(() => {
                      roadviewRef.current?.relayout?.();
                    }, 150);
                  } catch {}
                }
              );
              initListenerRef.current = listener;

              found = true;
            }
            done();
          });
        });
        if (found) break;
      }

      if (!found) setVisible(false);
      setLoading(false);
    },
    [ensureInstance, kakaoSDK]
  );

  const openAtCenter = useCallback(() => {
    if (autoSync && map?.getCenter) {
      try {
        const c = map.getCenter();
        const pos = { lat: c.getLat(), lng: c.getLng() };
        return renderAt(pos, pos); // 중심을 바라보게
      } catch {}
    }
    if (lastPosRef.current)
      return renderAt(lastPosRef.current, lastPosRef.current);
  }, [autoSync, map, renderAt]);

  const openAt = useCallback(
    (pos: LatLng, opts?: { face?: LatLng }) => {
      const face = opts?.face ?? pos;
      renderAt(pos, face);
    },
    [renderAt]
  );

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const resize = useCallback(() => {
    try {
      roadviewRef.current?.relayout?.();
    } catch {}
  }, []);

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (visible) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, close]);

  return {
    roadviewContainerRef,
    visible,
    loading,
    openAtCenter,
    openAt,
    close,
    resize,
  };
}
