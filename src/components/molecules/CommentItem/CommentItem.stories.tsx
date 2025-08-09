import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { CommentItem } from "./CommentItem";

const meta: Meta<typeof CommentItem> = {
  title: "Molecules/CommentItem",
  component: CommentItem,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    mine: { control: "boolean" },
    liked: { control: "boolean" },
    likeCount: { control: { type: "number", min: 0 } },
    disabled: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof CommentItem>;

export const Basic: Story = {
  args: {
    id: "c1",
    author: { name: "홍길동", avatarUrl: "" },
    content: "좋은 글 감사합니다! 도움이 많이 되었어요.",
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5분 전
    likeCount: 2,
  },
};

export const Liked: Story = {
  args: {
    id: "c2",
    author: { name: "김서령", avatarUrl: "" },
    content: "파일 업로더 컴포넌트 너무 깔끔하네요 👏",
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1시간 전
    liked: true,
    likeCount: 11,
  },
};

export const MineWithActions: Story = {
  args: {
    id: "c3",
    author: { name: "나", avatarUrl: "", badgeText: "작성자" },
    content: "추가로 에러 핸들링 예시도 곧 올릴게요.",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    mine: true,
    likeCount: 0,
  },
  render: (args) => {
    const [state, setState] = React.useState(args);
    return (
      <CommentItem
        {...state}
        onLike={() =>
          setState((s: any) => ({
            ...s,
            liked: !s.liked,
            likeCount: s.liked
              ? Math.max(0, (s.likeCount || 0) - 1)
              : (s.likeCount || 0) + 1,
          }))
        }
        onReply={() => alert("reply")}
        onEdit={() => alert("edit")}
        onDelete={() => alert("delete")}
      />
    );
  },
};

export const LongContent: Story = {
  args: {
    id: "c4",
    author: { name: "이커머스 PM", badgeText: "관리자" },
    content:
      "요구사항 확인했습니다. 다음 릴리즈에서 업로드 제한을 20MB로 올리고, PDF 미리보기는 별도 워커로 처리할게요. 길게 써도 줄바꿈/개행, 긴 단어 줄바꿈이 잘 되는지 확인하려고 의도적으로 문장을 길게 작성합니다. SupercalifragilisticexpialidociousSupercalifragilisticexpialidocious",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2일 전
  },
};
