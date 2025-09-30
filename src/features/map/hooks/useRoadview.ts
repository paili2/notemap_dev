"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Kakao = typeof window.kakao;

/**
 * 두 좌표 간 거리(m) 계산 (Haversine)
 */
function getDistance(a: kakao.maps.LatLng, b: kakao.maps.LatLng): number {
  const R = 6371000; // meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat1 = a.getLat();
  const lng1 = a.getLng();
  const lat2 = b.getLat();
  const lng2 = b.getLng();

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);

  const h = s1 * s1 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Kakao Roadview 훅
 * - openAtCenter: 현재 지도 중심에서 로드뷰 열기
 * - openAt: 임의 좌표에서 로드뷰 열기
 * - setAt: 로드뷰 위치 업데이트 (주변 도로 스냅 + 반경 단계적 확대, 모든 후보 중 최적 1회 선택)
 * - autoSync: true면 map idle때마다(보이는 동안) 지도 중심으로 자동 동기화
 */
export function useRoadview(opts: {
  kakaoSDK: Kakao | null;
  map: kakao.maps.Map | null;
  autoSync?: boolean;
}) {
  const { kakaoSDK, map, autoSync = true } = opts;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const roadviewRef = useRef<any>(null);
  const clientRef = useRef<any>(null);

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // 컨테이너/SDK 준비 전 요청 보관
  const pendingRef = useRef<{
    lat: number;
    lng: number;
    radius: number;
  } | null>(null);

  /** 주어진 미터를 위도/경도 오프셋(도)로 변환 */
  const meterToDeg = (meters: number, atLatDeg: number) => {
    const dLat = meters / 111_320; // ~m per degree latitude
    const dLng = meters / (111_320 * Math.cos((atLatDeg * Math.PI) / 180));
    return { dLat, dLng };
  };

  /**
   * ✅ 핵심: 주변 도로 스냅 + 반경 단계적 확대
   * - base 좌표에서 8방향 * (20m/40m) 오프셋 좌표 후보 생성
   * - 각 후보 좌표마다 반경 [r,100,150,250,400,600] 순으로 pano 탐색
   * - 모든 시도 중 "가장 가까운" pano 한 번만 선택 → 깜빡임/재점프 방지
   */
  const setAt = useCallback(
    (lat: number, lng: number, radius = 70) => {
      if (!kakaoSDK) return;

      // 준비 전이면 펜딩 저장 + 컨테이너부터 띄우기
      if (!clientRef.current || !roadviewRef.current) {
        pendingRef.current = { lat, lng, radius };
        setVisible(true);
        return;
      }

      setLoading(true);

      const baseLat = lat;
      const baseLng = lng;

      // 후보 좌표 생성
      const dirs = [
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [-1, -1],
        [0, -1],
        [1, -1],
      ] as const;
      const offsetsM = [0, 20, 40]; // 0m(원점) → 20m → 40m
      const candidates: { lat: number; lng: number }[] = [];

      for (const m of offsetsM) {
        if (m === 0) {
          candidates.push({ lat: baseLat, lng: baseLng });
          continue;
        }
        const { dLat, dLng } = meterToDeg(m, baseLat);
        for (const [dx, dy] of dirs) {
          candidates.push({
            lat: baseLat + dy * dLat,
            lng: baseLng + dx * dLng,
          });
        }
      }

      const radii = [radius, 100, 150, 250, 400, 600];

      // ✅ 모든 후보 검사 후 제일 가까운 panoId 선택
      let best: {
        panoId: number;
        pos: kakao.maps.LatLng;
        dist: number;
      } | null = null;
      let pending = candidates.length * radii.length;

      const finish = () => {
        setLoading(false);
        if (best) {
          roadviewRef.current!.setPanoId(best.panoId, best.pos);
          setTimeout(() => roadviewRef.current?.relayout?.(), 0);
        } else {
          // 못 찾았으면 유지 (원하면 setVisible(false)로 닫기)
        }
      };

      for (const c of candidates) {
        const pos = new kakaoSDK.maps.LatLng(c.lat, c.lng);

        for (const r of radii) {
          clientRef.current!.getNearestPanoId(pos, r, (panoId: number) => {
            pending--;
            if (panoId) {
              const d = getDistance(
                pos,
                new kakaoSDK.maps.LatLng(c.lat, c.lng)
              );
              if (!best || d < best.dist) {
                best = { panoId, pos, dist: d };
              }
            }
            if (pending === 0) finish();
          });
        }
      }
    },
    [kakaoSDK]
  );

  /** 컨테이너 mount/visible 직후 인스턴스 준비 + 펜딩 처리 */
  useEffect(() => {
    if (!kakaoSDK) return;
    if (!containerRef.current) return;

    if (!clientRef.current)
      clientRef.current = new kakaoSDK.maps.RoadviewClient();
    if (!roadviewRef.current)
      roadviewRef.current = new kakaoSDK.maps.Roadview(containerRef.current);

    if (visible) {
      // 보이자마자 레이아웃 정리
      setTimeout(() => roadviewRef.current?.relayout?.(), 0);
      // 펜딩 요청 처리
      if (pendingRef.current) {
        const { lat, lng, radius } = pendingRef.current;
        pendingRef.current = null;
        setAt(lat, lng, radius);
      }
    }
  }, [kakaoSDK, visible, setAt]);

  const openAtCenter = useCallback(
    (radius = 70) => {
      if (!map) return;
      const c = map.getCenter();
      setVisible(true);
      setAt(c.getLat(), c.getLng(), radius);
    },
    [map, setAt]
  );

  const openAt = useCallback(
    (lat: number, lng: number, radius = 70) => {
      setVisible(true);
      setAt(lat, lng, radius);
    },
    [setAt]
  );

  const close = useCallback(() => setVisible(false), []);

  // 보이는 동안 지도 이동/줌 시 자동 동기화
  useEffect(() => {
    if (!kakaoSDK || !map || !autoSync) return;
    const handler = () => {
      if (!visible) return;
      const c = map.getCenter();
      // 지도 중심 기준으로 도로 스냅 + 반경 단계 확대
      setAt(c.getLat(), c.getLng(), 70);
    };
    kakaoSDK.maps.event.addListener(map, "idle", handler);
    return () => kakaoSDK.maps.event.removeListener(map, "idle", handler);
  }, [kakaoSDK, map, autoSync, visible, setAt]);

  // 창 리사이즈 시 레이아웃 보정
  useEffect(() => {
    if (!visible) return;
    const onResize = () => roadviewRef.current?.relayout?.();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [visible]);

  return {
    roadviewContainerRef: containerRef,
    visible,
    loading,
    openAtCenter,
    openAt,
    close,
    setAt,
    setVisible,
  };
}
