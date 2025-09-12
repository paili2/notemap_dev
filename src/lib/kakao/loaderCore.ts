// 스크립트 삽입/Promise 관리

import { loadingMap, DEFAULT_SCRIPT_ID } from "./state";
import { getNonceAttr, getExistingScript, buildSrc, sameQuery } from "./utils";
import { DEFAULT_LIBS, LoadKakaoMapsOptions } from "./types";

export function loadKakaoMaps(appKey: string, opts: LoadKakaoMapsOptions = {}) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SSR: window is undefined"));
  }

  const {
    id = DEFAULT_SCRIPT_ID,
    libs = DEFAULT_LIBS,
    autoload = false,
    timeoutMs = 20000,
    nonce,
  } = opts;

  if (window.kakao?.maps) return Promise.resolve(window.kakao);

  const inFlight = loadingMap.get(id);
  if (inFlight) return inFlight;

  const script = getExistingScript(id);
  const desiredSrc = buildSrc(appKey, libs, autoload);

  if (script && !sameQuery(script.src, desiredSrc)) {
    script.parentNode?.removeChild(script);
  }

  const p = new Promise<typeof window.kakao>((resolve, reject) => {
    let timeoutId: any;

    const finish = () => {
      try {
        if (window.kakao?.maps?.load && !autoload) {
          window.kakao.maps.load(() => {
            clearTimeout(timeoutId);
            resolve(window.kakao!);
          });
        } else if (window.kakao?.maps) {
          clearTimeout(timeoutId);
          resolve(window.kakao!);
        } else {
          throw new Error("Kakao object not ready after script load");
        }
      } catch (e) {
        clearTimeout(timeoutId);
        loadingMap.delete(id);
        reject(e);
      }
    };

    const onError = () => {
      clearTimeout(timeoutId);
      const exist = getExistingScript(id);
      exist?.parentNode?.removeChild(exist);
      loadingMap.delete(id);
      reject(new Error("Kakao Maps SDK load failed"));
    };

    timeoutId = setTimeout(() => {
      loadingMap.delete(id);
      reject(new Error("Kakao Maps SDK load timeout"));
    }, timeoutMs);

    if (script) {
      script.addEventListener("load", finish, { once: true });
      script.addEventListener("error", onError, { once: true });
      return;
    }

    const tag = document.createElement("script");
    tag.id = id;
    tag.async = true;
    const n = getNonceAttr(nonce);
    if (n) tag.nonce = n;
    tag.src = desiredSrc;
    tag.addEventListener("load", finish, { once: true });
    tag.addEventListener("error", onError, { once: true });
    document.head.appendChild(tag);
  });

  loadingMap.set(id, p);
  return p;
}
