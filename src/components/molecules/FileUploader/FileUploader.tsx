import * as React from "react";
import clsx from "clsx";
import { Button } from "@/components/atoms/Button/Button"; // shadcn/ui
import { Progress } from "@/components/atoms/Progress/Progress"; // 선택: 진행률 표시용(없으면 주석 처리)
import {
  X as XIcon,
  Upload as UploadIcon,
  File as FileIcon,
  Image as ImageIcon,
} from "lucide-react";

/**
 * FileUploader (shadcn 스타일)
 * - 드래그앤드롭 + 클릭 업로드
 * - 멀티/단일 파일, 타입/사이즈 제한, 썸네일, 삭제, 진행률 표시(옵션)
 * - 네이티브 <input type="file"/>를 접근성 고려해 감쌈
 */

export type FileLike = File & { previewUrl?: string };

interface FileUploaderProps {
  /** multiple 허용 여부 */
  multiple?: boolean;
  /** accept: MIME 타입/확장자 (예: "image/*" 혹은 "image/png,.jpg") */
  accept?: string;
  /** 최대 파일 개수 (multiple일 때만 의미) */
  maxFiles?: number;
  /** 최대 바이트 크기 (1MB = 1024 * 1024) */
  maxSize?: number;
  /** 비활성화 */
  disabled?: boolean;
  /** 외부 제어: 현재 파일 목록 (controlled) */
  value?: FileLike[];
  /** 외부 제어: 파일 목록 변경 콜백 */
  onChange?: (files: FileLike[]) => void;
  /** 파일이 새로 추가될 때 콜백 (유효성 통과한 파일만) */
  onFilesAdded?: (added: FileLike[]) => void;
  /** 파일 제거 콜백 */
  onRemove?: (file: FileLike, index: number) => void;
  /** 진행률 (0~100), 개별 업로드 UI는 프로젝트에 맞게 확장 */
  progress?: number | null;
  /** 라벨/힌트 */
  label?: string;
  hint?: string;
  /** 크기: 높이/아이콘 사이즈 */
  size?: "sm" | "md" | "lg";
  /** className 커스터마이즈 */
  className?: string;
}

export function FileUploader({
  multiple = true,
  accept,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled,
  value,
  onChange,
  onFilesAdded,
  onRemove,
  progress = null,
  label = "파일 업로드",
  hint,
  size = "md",
  className,
}: FileUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [internalFiles, setInternalFiles] = React.useState<FileLike[]>([]);
  const files = value ?? internalFiles;

  React.useEffect(() => {
    // 정리: 컴포넌트 unmount 시 objectURL revoke
    return () => {
      files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFiles = (next: FileLike[]) => {
    if (onChange) onChange(next);
    else setInternalFiles(next);
  };

  const isImage = (f: File) => f.type.startsWith("image/");

  const validate = (selected: File[]) => {
    const valid: FileLike[] = [];
    for (const file of selected) {
      if (file.size > maxSize) continue;
      if (accept && !matchesAccept(file, accept)) continue;
      valid.push(
        Object.assign(file, {
          previewUrl: isImage(file) ? URL.createObjectURL(file) : undefined,
        })
      );
    }
    return valid;
  };

  const handleSelect = (selectedList: FileList | null) => {
    if (!selectedList) return;
    const selected = Array.from(selectedList);
    const valid = validate(selected);

    let next: FileLike[];
    if (multiple) {
      const merged = [...files, ...valid].slice(0, maxFiles);
      next = merged;
    } else {
      next = valid.slice(0, 1);
    }

    setFiles(next);
    onFilesAdded?.(valid);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    handleSelect(e.dataTransfer.files);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const removeAt = (idx: number) => {
    const target = files[idx];
    if (!target) return;
    target.previewUrl && URL.revokeObjectURL(target.previewUrl);
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    onRemove?.(target, idx);
  };

  const heightCls = size === "sm" ? "h-28" : size === "lg" ? "h-48" : "h-40";
  const iconSizeCls =
    size === "sm" ? "h-5 w-5" : size === "lg" ? "h-8 w-8" : "h-6 w-6";

  return (
    <div className={clsx("w-full space-y-2", className)}>
      {label && (
        <div className="text-sm font-medium text-foreground">{label}</div>
      )}

      <div
        role="button"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        aria-disabled={disabled}
        className={clsx(
          "relative flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/40 text-muted-foreground transition",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          disabled
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer hover:bg-muted/60",
          heightCls
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          onChange={(e) => handleSelect(e.currentTarget.files)}
        />

        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <UploadIcon className={clsx(iconSizeCls)} aria-hidden />
          <div className="text-sm">
            <span className="font-medium text-foreground">클릭</span> 또는
            드래그하여 업로드
          </div>
          {accept && (
            <p className="text-xs text-muted-foreground">허용 형식: {accept}</p>
          )}
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>

      {!!files.length && (
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {files.map((f, idx) => (
            <li
              key={`${f.name}-${idx}`}
              className="flex items-center gap-3 rounded-xl border bg-background p-3"
            >
              {/* 썸네일 */}
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {isImage(f) && f.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.previewUrl}
                    alt={f.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {isImage(f) ? (
                      <ImageIcon className="h-5 w-5" />
                    ) : (
                      <FileIcon className="h-5 w-5" />
                    )}
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium text-foreground"
                  title={f.name}
                >
                  {f.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(f.size)}
                </p>
                {typeof progress === "number" && (
                  <div className="mt-2">
                    <Progress value={progress} />
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAt(idx)}
                aria-label={`${f.name} 제거`}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function matchesAccept(file: File, accept: string) {
  // accept 예: "image/*,application/pdf,.csv"
  const list = accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!list.length) return true;

  const mime = file.type.toLowerCase();
  const ext = "." + file.name.split(".").pop()!.toLowerCase();

  return list.some((rule) => {
    if (rule.endsWith("/*")) {
      // image/*
      return mime.startsWith(rule.slice(0, -1));
    }
    if (rule.startsWith(".")) {
      // .png / .jpg
      return ext === rule;
    }
    // application/pdf 등 정확 매칭
    return mime === rule;
  });
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default FileUploader;
