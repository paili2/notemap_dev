import * as React from "react";
import { BellIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Badge } from "@/components/atoms/Badge/Badge";
import { cn } from "@/lib/utils";
// shadcn ui (dropdown) — 프로젝트에 없다면 ui에 추가해 쓰면 됩니다.
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/molecules/DropdownMenu/DropdownMenu";

type SidebarHeaderProps = {
  logo?: React.ReactNode; // 로고 영역 (이미지/텍스트)
  notificationsCount?: number;
  user: {
    name: string;
    email?: string;
    role?: string;
    avatarUrl?: string;
  };
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
  className?: string;
};

export function SidebarHeader({
  logo,
  notificationsCount = 0,
  user,
  onOpenNotifications,
  onOpenProfile,
  onOpenSettings,
  onSignOut,
  className,
}: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-3 py-2 bg-background",
        className
      )}
    >
      {/* 로고 */}
      <div className="min-w-0 flex-1">
        {logo ?? (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary/10" />
            <span className="truncate text-sm font-semibold">Your Brand</span>
          </div>
        )}
      </div>

      {/* 알림 버튼 */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          aria-label="알림"
          onClick={onOpenNotifications}
        >
          <BellIcon className="h-5 w-5" />
        </Button>
        {notificationsCount > 0 && (
          <span className="absolute -right-1 -top-1">
            <Badge className="bg-red-500 text-white px-1 py-0 text-[10px] leading-none">
              {notificationsCount > 99 ? "99+" : notificationsCount}
            </Badge>
          </span>
        )}
      </div>

      {/* 프로필 드롭다운 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent"
            aria-label="프로필 메뉴 열기"
          >
            <SimpleAvatar
              name={user.name}
              src={user.avatarUrl}
              className="h-7 w-7"
            />
            <div className="hidden min-w-0 flex-col md:flex text-left">
              <span className="truncate text-sm font-medium leading-4">
                {user.name}
              </span>
              <span className="truncate text-[11px] text-muted-foreground leading-3">
                {user.role ?? user.email ?? ""}
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end" className="w-56">
          <DropdownMenuLabel className="truncate">
            {user.name}
          </DropdownMenuLabel>
          {(user.email || user.role) && (
            <div className="px-2 pb-1 text-xs text-muted-foreground truncate">
              {user.email ?? user.role}
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onOpenProfile}>
            <UserIcon className="mr-2 h-4 w-4" />
            프로필
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenSettings}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            설정
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={onSignOut}
          >
            <LogOutIcon className="mr-2 h-4 w-4" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** 내부에서만 쓰는 간단한 아바타(초기값 폴백 포함) */
function SimpleAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  const initials = getInitials(name);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${name} avatar`}
      className={cn("rounded-full object-cover", className)}
    />
  ) : (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground",
        className
      )}
    >
      {initials}
    </div>
  );
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
