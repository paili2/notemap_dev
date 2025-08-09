declare global {
  interface Window {
    kakao?: any;
    __kakaoMapsLoadingPromise__?: Promise<void> | null;
  }
}

export function loadKakaoMaps(appKey: string) {
  if (!appKey) {
    throw new Error(
      "Kakao Maps: appKey가 비어있습니다. .env.local을 확인하세요"
    );
  }

  if (typeof window === "undefined") return Promise.resolve();
  if (window.kakao?.maps) return Promise.resolve();

  if (window.__kakaoMapsLoadingPromise__)
    return window.__kakaoMapsLoadingPromise__;

  window.__kakaoMapsLoadingPromise__ = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-kakao="maps"]'
    );

    if (existing) {
      if (window.kakao?.maps) {
        resolve();
        return;
      }
      existing.onload = () => {
        try {
          window.kakao.maps.load(() => resolve());
        } catch (e) {
          reject(new Error("Kakao Maps SDK load callback failed"));
        }
      };
      existing.onerror = () =>
        reject(new Error("Kakao Maps SDK load failed (existing)"));
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.kakao = "maps";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${appKey}`;

    script.onload = () => {
      try {
        window.kakao.maps.load(() => resolve());
      } catch (e) {
        reject(new Error("Kakao Maps SDK load callback failed"));
      }
    };

    script.onerror = () => reject(new Error("Kakao Maps SDK load failed"));
    document.head.appendChild(script);
  });

  return window.__kakaoMapsLoadingPromise__;
}

export {};
