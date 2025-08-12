declare global {
  interface Window {
    kakao?: any;
  }
}

let loading: Promise<any> | null = null;

export function loadKakaoMaps(appKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window unavailable"));
  }

  // 이미 로드됨
  if (window.kakao?.maps) return Promise.resolve(window.kakao);

  // 이전에 실패한 script 잔존 시 제거
  const prev = document.querySelector<HTMLScriptElement>(
    'script[data-kakao="sdk"]'
  );
  if (prev && !window.kakao?.maps) prev.remove();

  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.dataset.kakao = "sdk";
    s.async = true;
    s.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
        appKey
      )}` + `&autoload=false&libraries=services,clusterer`;

    const fail = () => {
      s.remove();
      loading = null;
      reject(new Error("Kakao Maps SDK load failed"));
    };

    s.onerror = fail;
    s.onload = () => {
      const k = (window as any).kakao;
      if (!k?.maps?.load) return fail();
      k.maps.load(() => resolve(k));
    };

    document.head.appendChild(s);

    // 안전 타임아웃 (선택)
    setTimeout(() => {
      if (!window.kakao?.maps) fail();
    }, 15000);
  });

  return loading;
}
