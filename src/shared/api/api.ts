import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

/* ────────────────────────────────────────────────────────────
   환경 플래그
   ──────────────────────────────────────────────────────────── */
const DEV_FAKE_MODE = process.env.NEXT_PUBLIC_DEV_FAKE_MODE === "true";

/* ────────────────────────────────────────────────────────────
   Axios 인스턴스
   ──────────────────────────────────────────────────────────── */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE ?? "/api",
  withCredentials: true,
});

if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.log("[api baseURL]", api.defaults.baseURL);
}

/* ────────────────────────────────────────────────────────────
   🔒 전역(singleton) inflight Map: HMR/StrictMode에서도 1개만 사용
   ──────────────────────────────────────────────────────────── */
type InflightMap = Map<string, Promise<AxiosResponse>>;
const G = (typeof window !== "undefined" ? window : globalThis) as any;
const INFLIGHT_KEY = "__APP__API_INFLIGHT_MAP__";
if (!G[INFLIGHT_KEY]) {
  G[INFLIGHT_KEY] = new Map() as InflightMap;
}
const inflight: InflightMap = G[INFLIGHT_KEY];

/* ────────────────────────────────────────────────────────────
   키 정규화: URL/params를 안정적으로 문자열화
   ──────────────────────────────────────────────────────────── */
function normalizeUrl(url: string) {
  const u = url || "";
  return u.startsWith("/") ? u : `/${u}`;
}

function stableParams(params: Record<string, any> = {}) {
  const entries: [string, string][] = [];

  const push = (k: string, v: any) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      v.forEach((vv) => push(k, vv));
      return;
    }
    if (typeof v === "object") {
      entries.push([k, JSON.stringify(v)]);
    } else {
      entries.push([k, String(v)]);
    }
  };

  Object.keys(params)
    .sort((a, b) => a.localeCompare(b))
    .forEach((k) => push(k, (params as any)[k]));

  const usp = new URLSearchParams(entries);
  return usp.toString();
}

function keyOf(url: string, params?: any) {
  return `${normalizeUrl(url)}?${stableParams(params ?? {})}`;
}

/* ────────────────────────────────────────────────────────────
   GET single-flight: 동일 url+params 병합 호출
   ──────────────────────────────────────────────────────────── */
async function getOnce<T = any>(
  url: string,
  config?: { params?: any; signal?: AbortSignal }
): Promise<AxiosResponse<T>> {
  const nu = normalizeUrl(url);
  const key = keyOf(nu, config?.params);

  // 이미 진행 중이면 그 프라미스를 그대로 반환
  const existed = inflight.get(key);
  if (existed) return existed as Promise<AxiosResponse<T>>;

  // "게이트" 프라미스 생성 후 inflight에 즉시 등록
  let resolveGate!: (v: AxiosResponse<T>) => void;
  let rejectGate!: (e: any) => void;
  const gate = new Promise<AxiosResponse<T>>((resolve, reject) => {
    resolveGate = resolve;
    rejectGate = reject;
  });
  inflight.set(key, gate as Promise<AxiosResponse>);

  // 실제 요청 시작
  api
    .get<T>(nu, config)
    .then((resp) => {
      resolveGate(resp);
    })
    .catch((err) => {
      rejectGate(err);
    })
    .finally(() => {
      // 성공/실패 관계없이 inflight 정리 (한 곳만)
      inflight.delete(key);
    });

  return gate;
}

/* ────────────────────────────────────────────────────────────
   /pins/map 전용 세마포어(동시 1회 제한) + getOnce 결합
   ──────────────────────────────────────────────────────────── */
let mapSemaphore = false;
export async function getPinsMapOnce<T = any>(
  params: Record<string, any>,
  signal?: AbortSignal
): Promise<AxiosResponse<T>> {
  if (mapSemaphore) {
    // 호출부에서 식별 가능하도록 code 부여
    const err = new AxiosError("DROPPED_BY_SEMAPHORE");
    (err as any).code = "E_SEMAPHORE";
    return Promise.reject(err);
  }
  mapSemaphore = true;
  try {
    return await getOnce<T>("/pins/map", { params, signal });
  } finally {
    mapSemaphore = false;
  }
}

/* ────────────────────────────────────────────────────────────
   DEV 경고: GET /pins 탐지 (의도치 않은 호출 추적)
   ──────────────────────────────────────────────────────────── */
api.interceptors.request.use((config) => {
  const method = (config.method || "get").toUpperCase();
  const url = ((config.baseURL || "") + (config.url || "")).replace(
    /^https?:\/\/[^/]+/,
    ""
  );

  if (method === "GET" && /^\/?pins\/?$/.test(url)) {
    console.warn(
      "[WARN] Unexpected GET /pins detected",
      "\nfrom:\n",
      new Error().stack?.split("\n").slice(2, 8).join("\n")
    );
  }
  return config;
});

/* ────────────────────────────────────────────────────────────
   FAKE 헬퍼 (성공/실패 분리)
   ──────────────────────────────────────────────────────────── */
function makeFakeOk<T>(
  data: T,
  config: InternalAxiosRequestConfig
): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  };
}

function makeFakeErr(
  status: number,
  message: string,
  config: InternalAxiosRequestConfig
): AxiosError {
  const resp: AxiosResponse = {
    data: { message },
    status,
    statusText: "ERR",
    headers: {},
    config,
  };
  return new AxiosError(message, undefined, config, undefined, resp);
}

/* ────────────────────────────────────────────────────────────
   유틸: 인증 상태 체크
   ──────────────────────────────────────────────────────────── */
export async function assertAuthed() {
  try {
    const r = await api.get("/me");
    console.debug("[AUTH] /me status =", r.status, r.data);
  } catch (e) {
    console.warn("[AUTH] /me fail", e);
  }
}

/* ────────────────────────────────────────────────────────────
   ✅ 세션 프리플라이트 1회 보장 + 401/419에 한해 1회 재시도
   ──────────────────────────────────────────────────────────── */
// 전역 공유 Promise (HMR/StrictMode에서도 1개만)
let __ensureSessionPromise: Promise<void> | null = null;

async function ensureSessionOnce() {
  if (!__ensureSessionPromise) {
    __ensureSessionPromise = api
      .get("/me", {
        headers: { "x-skip-auth": "1" }, // 자기 자신은 인터셉터 건너뜀
        validateStatus: (s) => s >= 200 && s < 500,
        withCredentials: true,
      })
      .then(() => void 0)
      .finally(() => {
        __ensureSessionPromise = null;
      });
  }
  return __ensureSessionPromise;
}

// ✔ 요청 전: 필요 시 세션 핑 (원치 않으면 비활성 — 기본 비활성)
api.interceptors.request.use(async (config) => {
  if (config.headers?.["x-skip-auth"] === "1") return config;
  // 필요하면 주석 해제:
  // await ensureSessionOnce();
  return config;
});

// ✔ 응답 후: 401/419에서만 1회 재시도, 그 외엔 절대 재전송 금지
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error || {};
    if (!config) throw error;

    // 클라이언트에서 재시도 금지 플래그가 있으면 그대로 실패
    if (config.headers && (config.headers as any)["x-no-retry"] === "1") {
      throw error;
    }

    // 한 번만 재시도
    if (
      response &&
      (response.status === 401 || response.status === 419) &&
      !(config as any).__retried
    ) {
      (config as any).__retried = true;
      await ensureSessionOnce();
      return api.request(config);
    }

    // ✅ 2xx 성공이거나 그 외 상태면 절대 재요청하지 않음
    throw error;
  }
);

/* ────────────────────────────────────────────────────────────
   (선택) DEV_FAKE_MODE 사용 예시
   ──────────────────────────────────────────────────────────── */
// 사용하려면 적절한 위치에서:
// if (DEV_FAKE_MODE) {
//   return Promise.resolve(makeFakeOk({ ok: true }, someConfig));
//   // 혹은
//   // throw makeFakeErr(400, "bad request", someConfig);
// }
