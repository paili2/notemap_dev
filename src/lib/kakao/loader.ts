import { DEFAULT_LIBS, type KakaoLib } from "./types"; // 네가 가진 types에 맞춰 import

type LoadKakaoMapsOptions = {
  id?: string;
  libs?: readonly KakaoLib[];
  autoload?: boolean;
  timeoutMs?: number;
  nonce?: string;
};

declare global {
  interface Window {
    __kakaoMapLoader?: Promise<any>;
  }
}

export function loadKakaoOnce(
  appKey: string,
  opts: LoadKakaoMapsOptions = {}
): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("SSR");

  const {
    id = "kakao-maps-sdk",
    libs = DEFAULT_LIBS,
    autoload = false,
    timeoutMs = 15000,
    nonce,
  } = opts;

  const w = window as any;

  // 이미 로드됨
  if (w.kakao?.maps) return Promise.resolve(w.kakao);
  if (window.__kakaoMapLoader) return window.__kakaoMapLoader;

  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    // 이미 스크립트가 있으면 onload 체인만 걸기
    window.__kakaoMapLoader = new Promise((resolve, reject) => {
      const done = () =>
        w.kakao?.maps ? resolve(w.kakao) : reject("Kakao SDK missing maps");
      if ((existing as any).__loaded) return done();
      existing.addEventListener("load", () => {
        (existing as any).__loaded = true;
        if (autoload) done();
        else w.kakao.maps.load(done);
      });
      existing.addEventListener("error", reject);
    });
    return window.__kakaoMapLoader;
  }

  const libsKey = libs?.length ? `&libraries=${libs.join(",")}` : "";
  const src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=${autoload}${libsKey}`;

  window.__kakaoMapLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    if (nonce) script.nonce = nonce;

    const onLoad = () => {
      (script as any).__loaded = true;
      const finish = () => resolve(w.kakao);
      if (autoload) finish();
      else w.kakao.maps.load(finish);
    };
    const onError = (e: any) => reject(e);

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    document.head.appendChild(script);

    // 타임아웃
    if (timeoutMs > 0) {
      setTimeout(() => reject(new Error("Kakao SDK load timeout")), timeoutMs);
    }
  });

  return window.__kakaoMapLoader;
}
