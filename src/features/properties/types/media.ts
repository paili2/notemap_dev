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

// ✅ 어디서든 참조 가능한 레퍼런스 유니온
export type AnyImageRef =
  | string
  | { url?: string; name?: string; caption?: string }
  | { idbKey: string; name?: string; caption?: string };

// ✅ UI 섹션 컴포넌트가 요구하는 확정 타입 (url/dataUrl/file 중 하나는 필수) - (참고용 유니온)
export type FileItem =
  | { name: string; url: string; caption?: string }
  | { name: string; dataUrl: string; caption?: string }
  | { name: string; file: File; caption?: string };

// 아직 준비/미해결 상태도 표현 (url/dataUrl/file 중 뭘 가져올지 미정)
export type RawFileItem = {
  name?: string;
  url?: string;
  caption?: string;
  dataUrl?: string;
  file?: File;
};

// ✅ 컴포넌트에서 '확정적으로' 쓰는 타입 (url이 반드시 존재)
export type ResolvedFileItem = {
  name: string;
  url: string;
  caption?: string;
  idbKey?: string;
};
