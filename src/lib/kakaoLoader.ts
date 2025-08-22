let loading: Promise<typeof window.kakao> | null = null;

const SCRIPT_ID = "kakao-maps-sdk";
const DEFAULT_LIBS = ["services", "clusterer"] as const;

type KakaoLib = (typeof DEFAULT_LIBS)[number] | string;

function getNonce() {
  const s = document.querySelector("script[nonce]") as HTMLScriptElement | null;
  return s?.nonce ?? undefined;
}

export function loadKakaoMaps(
  appKey: string,
  libs: readonly string[] = DEFAULT_LIBS
) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SSR: window is undefined"));
  }

  // 이미 완전히 로드됨
  if (window.kakao?.maps) return Promise.resolve(window.kakao);

  // 진행 중 프라미스 재사용
  if (loading) return loading;

  // 중복 스크립트 태그 확인
  const exist = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

  loading = new Promise<typeof window.kakao>((resolve, reject) => {
    let timeoutId: any;

    const finish = () => {
      try {
        // autoload=false 이므로 여기서 엔진 초기화
        if (window.kakao?.maps?.load) {
          window.kakao.maps.load(() => {
            clearTimeout(timeoutId);
            resolve(window.kakao);
          });
        } else if (window.kakao?.maps) {
          // autoload=true 케이스거나 이미 사용 가능
          clearTimeout(timeoutId);
          resolve(window.kakao);
        } else {
          throw new Error("Kakao object not ready after script load");
        }
      } catch (e) {
        clearTimeout(timeoutId);
        loading = null; // 실패 시 재시도 가능
        reject(e);
      }
    };

    const onError = () => {
      clearTimeout(timeoutId);
      if (exist?.parentNode) exist.parentNode.removeChild(exist);
      loading = null;
      reject(new Error("Kakao Maps SDK load failed"));
    };

    // 타임아웃 (예: 20초)
    timeoutId = setTimeout(() => {
      loading = null;
      reject(new Error("Kakao Maps SDK load timeout"));
    }, 20000);

    if (exist) {
      // 이미 태그가 있으면 로드 완료/미완료만 분기
      if ((exist as any).dataset.loaded === "true") {
        finish();
      } else {
        exist.addEventListener(
          "load",
          () => {
            (exist as any).dataset.loaded = "true";
            finish();
          },
          { once: true }
        );
        exist.addEventListener("error", onError, { once: true });
      }
      return;
    }

    // 신규 삽입
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    const nonce = getNonce();
    if (nonce) script.nonce = nonce;

    const uniqLibs = Array.from(new Set(libs)).filter(Boolean);
    const libQuery = uniqLibs.length ? `&libraries=${uniqLibs.join(",")}` : "";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false${libQuery}`;

    script.addEventListener(
      "load",
      () => {
        (script as any).dataset.loaded = "true";
        finish();
      },
      { once: true }
    );
    script.addEventListener("error", onError, { once: true });

    document.head.appendChild(script);
  });

  return loading;
}
