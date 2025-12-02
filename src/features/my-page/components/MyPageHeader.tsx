"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";

interface MyPageHeaderProps {
  className?: string;
}

export function MyPageHeader({ className }: MyPageHeaderProps) {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<string>("");

  const menuItems = [
    { key: "profile", label: "프로필", href: "/my-page" },
    { key: "my-team", label: "팀관리", href: "/my-page/my-team" },
    { key: "my-contracts", label: "내 계약", href: "/my-page/my-contracts" },
  ];

  // 현재 경로에 따라 activeMenu 자동 설정
  useEffect(() => {
    if (pathname === "/my-page" || pathname === "/my-page/profile") {
      setActiveMenu("profile");
    } else if (pathname.startsWith("/my-page/my-team")) {
      setActiveMenu("my-team");
    } else if (pathname.startsWith("/my-page/my-contracts")) {
      setActiveMenu("my-contracts");
    }
  }, [pathname]);

  return (
    <header
      className={`flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 ${
        className || ""
      }`}
    >
      {/* 로고와 돌아가기 버튼 */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-100"
            title="메인화면으로 돌아가기"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
        </Link>
        <Link href="/my-page" className="flex items-center">
          <Image
            src="/mainlogo.webp"
            alt="로고"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
        </Link>
      </div>

      {/* 메뉴 */}
      <nav className="flex items-center gap-4">
        {menuItems.map((item) => (
          <Link key={item.key} href={item.href}>
            <Button
              variant={activeMenu === item.key ? "default" : "ghost"}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeMenu === item.key
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
    </header>
  );
}
