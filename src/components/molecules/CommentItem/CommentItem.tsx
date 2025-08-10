import * as React from "react";
import clsx from "clsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/atoms/Avatar/Avatar";
import { Button } from "@/components/atoms/Button/Button";
import { Badge } from "@/components/atoms/Badge/Badge";
import {
  MoreHorizontal,
  Heart,
  Reply as ReplyIcon,
  Pencil,
  Trash2,
} from "lucide-react";

export interface CommentItemProps {
  id?: string | number;
  author: {
    name: string;
    avatarUrl?: string;
    isOwner?: boolean;
    badgeText?: string;
  };
  content: string;
  createdAt?: Date | string | number;
  liked?: boolean;
  likeCount?: number;
  mine?: boolean;
  disabled?: boolean;
  className?: string;
  onReply?: (id?: string | number) => void;
  onEdit?: (id?: string | number) => void;
  onDelete?: (id?: string | number) => void;
  onLike?: (id: string | number | undefined, nextLiked?: boolean) => void;
}

export function CommentItem(props: CommentItemProps) {
  const {
    id,
    author,
    content,
    createdAt,
    liked = false,
    likeCount = 0,
    mine = false,
    disabled,
    className,
    onReply,
    onEdit,
    onDelete,
    onLike,
  } = props;

  const [internalLiked, setInternalLiked] = React.useState<boolean>(liked);
  const [internalLikeCount, setInternalLikeCount] =
    React.useState<number>(likeCount);

  React.useEffect(() => setInternalLiked(liked), [liked]);
  React.useEffect(() => setInternalLikeCount(likeCount), [likeCount]);

  const handleLike = () => {
    if (disabled) return;
    const nextLiked = !internalLiked;
    setInternalLiked(nextLiked);
    setInternalLikeCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));
    onLike?.(id, nextLiked);
  };

  const timeText = createdAt ? formatTimeAgo(createdAt) : undefined;

  return (
    <div
      className={clsx(
        "flex w-full gap-3 rounded-2xl border bg-background p-3 md:p-4",
        mine && "flex-row-reverse text-right",
        disabled && "opacity-60",
        className
      )}
      aria-disabled={disabled}
    >
      <Avatar className="h-10 w-10 shrink-0">
        {author.avatarUrl && (
          <AvatarImage src={author.avatarUrl} alt={author.name} />
        )}
        <AvatarFallback>{getInitials(author.name)}</AvatarFallback>
      </Avatar>

      <div className={clsx("min-w-0 flex-1", mine && "items-end")}>
        <div className={clsx("flex items-center gap-2", mine && "justify-end")}>
          <p
            className="truncate text-sm font-semibold text-foreground"
            title={author.name}
          >
            {author.name}
          </p>
          {author.badgeText && (
            <Badge variant="secondary" className="h-5 px-2 text-[10px]">
              {author.badgeText}
            </Badge>
          )}
          {timeText && (
            <span className="text-xs text-muted-foreground">· {timeText}</span>
          )}
        </div>

        <div
          className={clsx(
            "mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground"
          )}
        >
          {content}
        </div>

        <div
          className={clsx(
            "mt-2 flex items-center gap-1",
            mine && "justify-end"
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={disabled}
            className={clsx("h-8 px-2")}
            aria-pressed={internalLiked}
          >
            <Heart
              className={clsx("mr-1 h-4 w-4", internalLiked && "fill-current")}
            />{" "}
            {internalLikeCount}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onReply?.(id)}
            disabled={disabled}
            className="h-8 px-2"
          >
            <ReplyIcon className="mr-1 h-4 w-4" /> 답글
          </Button>

          {(mine || onEdit || onDelete) && (
            <div
              className={clsx(
                "ml-1 flex items-center gap-1",
                mine && "order-first ml-0 mr-1"
              )}
            >
              {onEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(id)}
                  disabled={disabled}
                  className="h-8 px-2"
                >
                  <Pencil className="mr-1 h-4 w-4" /> 편집
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(id)}
                  disabled={disabled}
                  className="h-8 px-2 text-destructive"
                >
                  <Trash2 className="mr-1 h-4 w-4" /> 삭제
                </Button>
              )}
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            aria-label="more"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0]!)
    .join("")
    .toUpperCase();
}

function formatTimeAgo(input: Date | string | number) {
  const date = input instanceof Date ? input : new Date(input);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d`;
  return date.toLocaleDateString();
}

export default CommentItem;
