import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { FileLike, FileUploader } from "./FileUploader";

const meta: Meta<typeof FileUploader> = {
  title: "Molecules/FileUploader",
  component: FileUploader,
  tags: ["autodocs"],
  argTypes: {
    multiple: { control: "boolean" },
    accept: { control: "text" },
    maxFiles: { control: { type: "number", min: 1, step: 1 } },
    maxSize: { control: { type: "number", min: 1024 } },
    disabled: { control: "boolean" },
    label: { control: "text" },
    hint: { control: "text" },
    size: { control: { type: "radio" }, options: ["sm", "md", "lg"] },
  },
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof FileUploader>;

export const Basic: Story = {
  args: {
    label: "파일 업로드",
    hint: "최대 10MB, 이미지/PDF 허용",
    multiple: true,
    accept: "image/*,application/pdf",
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
  },
};

export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
  args: {
    label: "제어형 업로더",
    accept: "image/*",
    multiple: true,
  },
};

function ControlledExample(props: React.ComponentProps<typeof FileUploader>) {
  const [files, setFiles] = React.useState<FileLike[]>([]);
  const [progress, setProgress] = React.useState<number | null>(null);

  // 데모: 업로드 버튼 누르면 가짜 진행률
  const startFakeUpload = async () => {
    setProgress(0);
    for (let p = 0; p <= 100; p += 10) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 100));
      setProgress(p);
    }
    setTimeout(() => setProgress(null), 500);
  };

  return (
    <div className="w-[560px] space-y-4">
      <FileUploader
        {...props}
        value={files}
        onChange={setFiles}
        progress={progress}
        hint="이미지 파일만 허용"
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted"
          onClick={startFakeUpload}
          disabled={!files.length}
        >
          업로드 시작(데모)
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted"
          onClick={() => setFiles([])}
          disabled={!files.length}
        >
          초기화
        </button>
      </div>
      {!!files.length && (
        <p className="text-xs text-muted-foreground">
          선택된 파일 {files.length}개
        </p>
      )}
    </div>
  );
}
