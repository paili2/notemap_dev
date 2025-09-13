import { DEFAULT_LIBS, type KakaoLib } from "./types";

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
    kakao: any;
  }
}

const isScriptLoaded = (el: HTMLScriptElement) => {
  const s = el as any;
  return (
    s.readyState === "loaded" ||
    s.readyState === "complete" ||
    s.dataset?.loaded === "true" ||
    s.__loaded === true
  );
};

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
  const ready = () => !!w.kakao?.maps && typeof w.kakao.maps.Map === "function";

  if (ready()) return Promise.resolve(w.kakao);
  if (w.__kakaoMapLoader) return w.__kakaoMapLoader;

  const existing = document.getElementById(id) as HTMLScriptElement | null;
  const libsKey = libs?.length ? `&libraries=${libs.join(",")}` : "";
  const src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=${autoload}${libsKey}`;

  w.__kakaoMapLoader = new Promise((resolve, reject) => {
    let timeoutId: any;
    let pollId: any;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (pollId) clearInterval(pollId);
    };
    const done = () => {
      cleanup();
      resolve(w.kakao);
    };
    const afterLoad = () => {
      if (autoload || ready()) return done();
      try {
        w.kakao.maps.load(done);
      } catch {
        if (ready()) return done();
        reject(new Error("Kakao SDK load hook failed"));
      }
    };
    const onError = (e: any) => {
      cleanup();
      reject(e instanceof Error ? e : new Error(String(e)));
    };

    if (existing) {
      existing.addEventListener("load", afterLoad);
      existing.addEventListener("error", onError);

      if (ready() || isScriptLoaded(existing)) {
        afterLoad();
      } else {
        // load 이벤트가 이미 지나간 케이스 대비: 폴링 백업
        pollId = setInterval(() => {
          if (ready()) afterLoad();
        }, 100);
      }
    } else {
      const script = document.createElement("script");
      script.id = id;
      script.src = src;
      script.async = true;
      if (nonce) script.nonce = nonce;

      script.addEventListener("load", () => {
        (script as any).__loaded = true;
        script.dataset.loaded = "true";
        afterLoad();
      });
      script.addEventListener("error", onError);
      document.head.appendChild(script);
    }

    if (timeoutMs > 0) {
      timeoutId = setTimeout(
        () => onError(new Error("Kakao SDK load timeout")),
        timeoutMs
      );
    }
  });

  return w.__kakaoMapLoader;
}
