export type KakaoLatLngLiteral = { lat: number; lng: number };

export const DEFAULT_LIBS = ["services", "clusterer"] as const;
export type KakaoLib = (typeof DEFAULT_LIBS)[number] | string;

export type LoadKakaoMapsOptions = {
  id?: string;
  libs?: readonly KakaoLib[];
  autoload?: boolean;
  timeoutMs?: number;
  nonce?: string;
};

export type LastConfig = {
  appKey: string;
  libsKey: string;
  autoload: boolean;
};
