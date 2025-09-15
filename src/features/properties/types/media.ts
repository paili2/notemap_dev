// ✅ UI(입력/미리보기)에서 쓰는 이미지 타입: url은 선택적
export type ImageItem = {
  url?: string; // 미리보기 objectURL 또는 외부 URL (선택)
  name?: string;
  caption?: string;
  idbKey?: string; // IndexedDB 키
  dataUrl?: string; // (선택) base64 등
  file?: File; // (선택) 새로 추가된 파일
};

// ✅ 서버 전송/저장용 최소 스키마
export type StoredMediaItem = {
  url?: string;
  name?: string;
  caption?: string;
  idbKey?: string;
};

// (기존 유지) 어디서든 참조 가능한 레퍼런스 유니온
export type AnyImageRef =
  | string
  | { url?: string; name?: string; caption?: string }
  | { idbKey: string; name?: string; caption?: string };
