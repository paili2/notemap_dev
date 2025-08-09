"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  CalendarDaysIcon,
  FileStackIcon,
  SettingsIcon,
  MenuIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button/Button";
import { SidebarHeader } from "@/components/organisms/SidebarHeader/SidebarHeader";

// shadcn sheet (모바일 드로어)
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/atoms/Sheet/Sheet";

type NavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

type ResponsiveSidebarProps = {
  logo?: React.ReactNode;
  notificationsCount?: number;
  user: {
    name: string;
    email?: string;
    role?: string;
    avatarUrl?: string;
  };
  sections?: NavSection[];
  className?: string;
  /** 데스크톱 사이드바 너비(px) */
  width?: number;
};

export function ResponsiveSidebar({
  logo,
  notificationsCount = 0,
  user,
  sections = defaultSections,
  className,
  width = 280,
}: ResponsiveSidebarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* 상단 바 (모바일 전용) */}
      <div className="flex items-center justify-between border-b px-3 py-2 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          {logo ?? (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-primary/10" />
              <span className="truncate text-sm font-semibold">Your Brand</span>
            </div>
          )}
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="메뉴 열기">
              <MenuIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[85vw] max-w-[360px]">
            <SheetHeader className="sr-only">
              <SheetTitle>사이드바</SheetTitle>
            </SheetHeader>
            <SidebarContent
              logo={logo}
              notificationsCount={notificationsCount}
              user={user}
              sections={sections}
              onNavigate={() => setOpen(false)}
              style={{ width: "100%" }}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* 데스크톱 고정 사이드바 */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:shrink-0 md:border-r md:bg-background",
          className
        )}
        style={{ width }}
      >
        <SidebarContent
          logo={logo}
          notificationsCount={notificationsCount}
          user={user}
          sections={sections}
          style={{ width }}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  logo,
  notificationsCount,
  user,
  sections,
  onNavigate,
  style,
}: {
  logo?: React.ReactNode;
  notificationsCount?: number;
  user: ResponsiveSidebarProps["user"];
  sections: NavSection[];
  onNavigate?: () => void;
  style?: React.CSSProperties;
}) {
  const pathname = usePathname();
  return (
    <div className="flex h-full min-h-0 flex-col" style={style}>
      <SidebarHeader
        logo={logo}
        notificationsCount={notificationsCount}
        user={user}
        onOpenNotifications={() => console.log("알림")}
        onOpenProfile={() => console.log("프로필")}
        onOpenSettings={() => console.log("설정")}
        onSignOut={() => console.log("로그아웃")}
        className="px-3 py-2"
      />

      <nav className="flex-1 space-y-4 overflow-auto px-2 py-3">
        {sections.map((sec, i) => (
          <div key={i} className="space-y-1">
            {sec.title && (
              <div className="px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
                {sec.title}
              </div>
            )}
            {sec.items.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                active={pathname === item.href}
                icon={item.icon}
                onClick={onNavigate}
              >
                {item.label}
              </SidebarLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t p-3 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Cheolpanjeong
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  children,
  icon,
  active,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground"
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}

/** 기본 네비게이션(부동산 프로젝트 예시) */
const defaultSections: NavSection[] = [
  {
    items: [
      { label: "대시보드", href: "/", icon: <HomeIcon className="h-4 w-4" /> },
      {
        label: "고객 관리",
        href: "/customers",
        icon: <UsersIcon className="h-4 w-4" />,
      },
      {
        label: "계약 관리",
        href: "/contracts",
        icon: <FileStackIcon className="h-4 w-4" />,
      },
      {
        label: "일정",
        href: "/calendar",
        icon: <CalendarDaysIcon className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "설정",
    items: [
      {
        label: "환경설정",
        href: "/settings",
        icon: <SettingsIcon className="h-4 w-4" />,
      },
    ],
  },
];
