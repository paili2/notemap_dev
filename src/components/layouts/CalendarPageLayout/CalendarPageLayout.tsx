"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/atoms/Card/Card";

export type CalendarPageLayoutProps = {
  /** 페이지 상단 제목 */
  title?: React.ReactNode;
  /** 제목 아래 보조 설명 */
  subtitle?: React.ReactNode;
  /** 좌측 사이드바 콘텐츠 (필터, 메뉴 등) */
  sidebar?: React.ReactNode;
  /** 메인 캘린더 영역 */
  children: React.ReactNode;
  /** 레이아웃 클래스 */
  className?: string;
};

/**
 * 좌측 필터/메뉴 + 우측 캘린더 화면 레이아웃
 */
export function CalendarPageLayout({
  title,
  subtitle,
  sidebar,
  children,
  className,
}: CalendarPageLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-6 lg:flex-row lg:gap-8", className)}>
      {/* Sidebar */}
      {sidebar ? (
        <aside className="lg:w-64 flex-shrink-0 space-y-4">
          <Card className="p-4">{sidebar}</Card>
        </aside>
      ) : null}

      {/* Main content */}
      <main className="flex-1 space-y-4">
        {(title || subtitle) && (
          <header>
            {title ? (
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            ) : null}
            {subtitle ? (
              <p className="text-muted-foreground">{subtitle}</p>
            ) : null}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}
