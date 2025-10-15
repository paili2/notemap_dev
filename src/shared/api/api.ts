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

// ✅ 요청 인터셉터
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.headers) config.headers = new AxiosHeaders();
  if (!DEV_FAKE_MODE) return config;

  const url = (config.url || "").replace(/^https?:\/\/[^/]+/, "");
  const method = (config.method || "get").toLowerCase();

  if (method === "post" && url === "/auth/signin") {
    localStorage.setItem(
      "me",
      JSON.stringify({ credentialId: "42", username: "dev" })
    );
    throw makeFakeResponse(
      { message: "로그인 성공", data: { credentialId: "42", username: "dev" } },
      config
    );
  }

  if (method === "get" && url === "/auth/me") {
    const me = JSON.parse(localStorage.getItem("me") || "null");
    throw makeFakeResponse({ data: me }, config);
  }

  if (method === "get" && url === "/survey-reservations/scheduled") {
    const me = JSON.parse(localStorage.getItem("me") || "null");
    if (!me) throw makeFakeError(401, "DEV_FAKE_MODE: 미로그인", config);
    const data = [
      { id: 1, title: "A동 101호", dateISO: "2025-10-20" },
      { id: 2, title: "B동 302호", dateISO: "2025-10-22" },
    ];
    throw makeFakeResponse({ message: "내 답사예정 목록", data }, config);
  }

  return config;
});

// ✅ 아래에 이 두 함수 함께 둠
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
