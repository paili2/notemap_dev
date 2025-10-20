import axios, {
  AxiosHeaders,
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const DEV_FAKE_MODE = process.env.NEXT_PUBLIC_DEV_FAKE_MODE === "true";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3050",
  withCredentials: true,
});

/* ------------------------------------------------------------------ */
/* 🔒 전역(singleton) inflight Map: HMR/StrictMode에서도 1개만 사용    */
/* ------------------------------------------------------------------ */
type InflightMap = Map<string, Promise<AxiosResponse>>;
const G = (typeof window !== "undefined" ? window : globalThis) as any;
const INFLIGHT_KEY = "__APP__API_INFLIGHT_MAP__";
if (!G[INFLIGHT_KEY]) {
  G[INFLIGHT_KEY] = new Map() as InflightMap;
}
const inflight: InflightMap = G[INFLIGHT_KEY];

/* ------------------------------------------ */
/* 키 정규화: URL/params를 안정적으로 문자열화 */
/* ------------------------------------------ */
function normalizeUrl(url: string) {
  const u = url || "";
  return u.startsWith("/") ? u : `/${u}`;
}
function stableParams(params: Record<string, any> = {}) {
  const entries = Object.entries(params).map(([k, v]) => [k, String(v)]);
  entries.sort(([a], [b]) => a.localeCompare(b));
  const usp = new URLSearchParams(entries as [string, string][]);
  return usp.toString();
}
function keyOf(url: string, params?: any) {
  return `${normalizeUrl(url)}?${stableParams(params ?? {})}`;
}

/* -------------------------------------------- */
/* GET single-flight: 동일 url+params 병합 호출 */
/* -------------------------------------------- */
export async function getOnce<T = any>(
  url: string,
  config?: { params?: any; signal?: AbortSignal }
): Promise<AxiosResponse<T>> {
  const nu = normalizeUrl(url);
  const key = keyOf(nu, config?.params);

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(
      "[getOnce] key:",
      key,
      "mapId:",
      (inflight as any).__id || ((inflight as any).__id = Math.random())
    );
  }

  // 1) 이미 진행 중이면 그 프라미스를 그대로 반환
  const existed = inflight.get(key);
  if (existed) return existed as Promise<AxiosResponse<T>>;

  // 2) 자리를 먼저 잡는 "게이트" 프라미스 생성 후 inflight에 즉시 등록
  let resolveGate!: (v: AxiosResponse<T>) => void;
  let rejectGate!: (e: any) => void;
  const gate = new Promise<AxiosResponse<T>>((resolve, reject) => {
    resolveGate = resolve;
    rejectGate = reject;
  });
  inflight.set(key, gate as Promise<AxiosResponse>);

  // 3) 실제 요청은 게이트 등록 후 시작 → 동시 진입 시 2번째부터는 existed 로 반환됨
  api
    .get<T>(nu, config)
    .then((resp) => {
      resolveGate(resp);
    })
    .catch((err) => {
      // 실패 시에는 다음 호출이 새로 보낼 수 있도록 inflight에서 제거
      inflight.delete(key);
      rejectGate(err);
    })
    .finally(() => {
      // 성공해도 inflight 정리
      inflight.delete(key);
    });

  return gate;
}

/* ----------------------------------------------------- */
/* /pins/map 전용 세마포어(동시 1회 제한) + getOnce 결합  */
/* ----------------------------------------------------- */
let mapSemaphore = false;
export async function getPinsMapOnce<T = any>(
  params: Record<string, any>,
  signal?: AbortSignal
): Promise<AxiosResponse<T>> {
  if (mapSemaphore) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[getPinsMapOnce] dropped (semaphore)");
    }
    return Promise.reject(new AxiosError("DROPPED_BY_SEMAPHORE"));
  }
  mapSemaphore = true;
  try {
    return await getOnce<T>("/pins/map", { params, signal });
  } finally {
    mapSemaphore = false;
  }
}

/* ----------------------- */
/* DEV_FAKE_MODE 인터셉터  */
/* ----------------------- */
api.interceptors.request.use((config) => {
  const method = (config.method || "get").toUpperCase();
  const url = ((config.baseURL || "") + (config.url || "")).replace(
    /^https?:\/\/[^/]+/,
    ""
  );

  // 전체 로깅(원하면)
  console.log(
    "[REQ]",
    method,
    url,
    "params:",
    config.params,
    "data:",
    config.data
  );

  // ✅ GET /pins 탐지 + 호출자 스택
  if (method === "GET" && /^\/?pins\/?$/.test(url)) {
    console.warn(
      "[WARN] Unexpected GET /pins detected",
      "\nfrom:\n",
      new Error().stack?.split("\n").slice(2, 8).join("\n")
    );
  }
  return config;
});

/* ----------------- */
/* FAKE 헬퍼 함수들  */
/* ----------------- */
function makeFakeResponse(data: any, config: InternalAxiosRequestConfig) {
  const resp: AxiosResponse = {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  };
  return new AxiosError("FAKE_RESPONSE", undefined, config, undefined, resp);
}
function makeFakeError(
  status: number,
  message: string,
  config: InternalAxiosRequestConfig
) {
  const resp: AxiosResponse = {
    data: { message },
    status,
    statusText: "ERR",
    headers: {},
    config,
  };
  return new AxiosError(message, undefined, config, undefined, resp);
}

export async function assertAuthed() {
  try {
    const r = await api.get("/me");
    console.debug("[AUTH] /me status =", r.status, r.data);
  } catch (e) {
    console.warn("[AUTH] /me fail", e);
  }
}
