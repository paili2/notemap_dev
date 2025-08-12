let loading: Promise<typeof window.kakao> | null = null;

export function loadKakaoMaps(appKey: string) {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));

  if (window.kakao?.maps) {
    // 이미 로드됨
    return Promise.resolve(window.kakao);
  }
  if (loading) return loading;

  loading = new Promise<typeof window.kakao>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services,clusterer`;
    s.async = true;

    s.onload = () => {
      // autoload=false 이므로 여기서 한 번 더 load 필요
      window.kakao.maps.load(() => {
        resolve(window.kakao);
      });
    };
    s.onerror = () => {
      document.head.removeChild(s);
      loading = null;
      reject(new Error("Kakao Maps SDK load failed"));
    };

    document.head.appendChild(s);
  });

  return loading;
}
