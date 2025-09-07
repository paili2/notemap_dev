export type ImageItem = {
  url: string; // 미리보기 objectURL 또는 외부 URL
  name: string;
  caption?: string;
  idbKey?: string;
  dataUrl?: string;
};

export type AnyImageRef =
  | string
  | { url?: string; name?: string; caption?: string }
  | { idbKey: string; name?: string; caption?: string };
