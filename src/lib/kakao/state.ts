import type { LastConfig } from "./types";

export const DEFAULT_SCRIPT_ID = "kakao-maps-sdk";

export let loadingMap = new Map<string, Promise<typeof window.kakao>>();
export let cachedKakao: typeof window.kakao | null = null;
export let lastConfig: LastConfig | null = null;

export function resetKakaoLoader(id: string = DEFAULT_SCRIPT_ID) {
  const exist = document.getElementById(id);
  exist?.parentNode?.removeChild(exist);
  loadingMap.delete(id);
  cachedKakao = null;
  lastConfig = null;
}
