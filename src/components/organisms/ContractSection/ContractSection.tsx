// 계약 관리 (FormGroup + FileUploader + 첨부파일 리스트 + Button)

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/atoms/Card/Card";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { ScrollArea } from "@/components/atoms/ScrollArea/ScrollArea";
import { Input } from "@/components/atoms/Input/Input";
import { cn } from "@/lib/utils";
import { PaperclipIcon, UploadIcon, XIcon, Trash2Icon } from "lucide-react";

type ContractStatus = "pending" | "active" | "completed" | "canceled";

interface AttachmentLite {
  id: string;
  name: string;
  size: number; // bytes
}

interface Contract {
  id: string;
  name: string;
  date: string; // ISO or yyyy-mm-dd
  status: ContractStatus;
  attachments?: AttachmentLite[];
}

const statusColors: Record<ContractStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  canceled: "bg-red-100 text-red-800",
};

function formatBytes(size: number) {
  if (size === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return `${(size / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

export function ContractSection() {
  // 목록 상태
  const [contracts, setContracts] = React.useState<Contract[]>([
    {
      id: crypto.randomUUID(),
      name: "오피스텔 임대차 계약",
      date: "2025-08-15",
      status: "active",
      attachments: [
        { id: crypto.randomUUID(), name: "임대차계약서.pdf", size: 384000 },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: "상가 매매 계약",
      date: "2025-07-20",
      status: "completed",
      attachments: [],
    },
  ]);

  // 폼 상태
  const [name, setName] = React.useState("");
  const [date, setDate] = React.useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [status, setStatus] = React.useState<ContractStatus>("pending");
  const [files, setFiles] = React.useState<AttachmentLite[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePickFiles = () => fileInputRef.current?.click();

  const appendFiles = (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    const next = Array.from(fileList).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
    }));
    setFiles((prev) => [...prev, ...next]);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    appendFiles(e.dataTransfer.files);
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeTempFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const resetForm = () => {
    setName("");
    setDate(new Date().toISOString().slice(0, 10));
    setStatus("pending");
    setFiles([]);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    // 실제 업로드는 백엔드 연동 시 presigned URL 등을 사용해 업로드한 뒤,
    // 반환된 파일 메타를 attachments로 저장하면 됩니다. (여기선 로컬 상태만 반영)
    const newContract: Contract = {
      id: crypto.randomUUID(),
      name: name || "무제 계약",
      date,
      status,
      attachments: files,
    };
    setContracts((prev) => [newContract, ...prev]);
    resetForm();
  };

  const removeContract = (id: string) =>
    setContracts((prev) => prev.filter((c) => c.id !== id));

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="flex flex-col gap-1">
        <CardTitle>📄 계약 관리</CardTitle>
        <p className="text-sm text-muted-foreground">
          새로운 계약을 등록하고 첨부파일을 업로드하세요.
        </p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* FormGroup */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">계약명</label>
              <Input
                placeholder="예) 오피스텔 임대차 계약"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">계약일</label>
              <Input
                type="date"
                value={date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">상태</label>
              {/* 필요 시 atoms/Select로 교체 */}
              <select
                className={cn(
                  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background",
                  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                value={status}
                onChange={(e) => setStatus(e.target.value as ContractStatus)}
              >
                <option value="pending">대기(pending)</option>
                <option value="active">진행(active)</option>
                <option value="completed">완료(completed)</option>
                <option value="canceled">취소(canceled)</option>
              </select>
            </div>
          </div>

          {/* FileUploader */}
          <div className="space-y-2">
            <label className="text-sm font-medium">첨부파일</label>
            <div
              role="button"
              tabIndex={0}
              onClick={handlePickFiles}
              onKeyDown={(e) => e.key === "Enter" && handlePickFiles()}
              onDrop={onDrop}
              onDragOver={onDragOver}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center",
                "hover:bg-accent/40 cursor-pointer"
              )}
            >
              <UploadIcon className="h-5 w-5" />
              <div className="text-sm">
                파일을 드래그하여 업로드하거나{" "}
                <span className="font-medium">클릭</span>하세요.
              </div>
              <div className="text-xs text-muted-foreground">
                PDF, 이미지 등. 여러 개 선택 가능
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => appendFiles(e.target.files)}
              />
            </div>

            {/* 첨부파일 리스트 (임시 큐) */}
            {files.length > 0 && (
              <div className="rounded-md border p-3">
                <div className="mb-2 text-sm font-medium">업로드 대기 파일</div>
                <ul className="space-y-2">
                  {files.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <PaperclipIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate text-sm">{f.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatBytes(f.size)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="remove file"
                        onClick={() => removeTempFile(f.id)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              초기화
            </Button>
            <Button type="submit">계약 등록</Button>
          </div>
        </form>

        {/* 계약 목록 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">등록된 계약</h3>
            <span className="text-sm text-muted-foreground">
              총 {contracts.length}건
            </span>
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-2">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex flex-col gap-2 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{contract.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(contract.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[contract.status]}>
                        {contract.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="delete contract"
                        onClick={() => removeContract(contract.id)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 첨부파일 리스트 */}
                  {contract.attachments && contract.attachments.length > 0 ? (
                    <ul className="space-y-1">
                      {contract.attachments.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <PaperclipIcon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{a.name}</span>
                          <span className="shrink-0 text-xs">
                            {formatBytes(a.size)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      첨부파일 없음
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
