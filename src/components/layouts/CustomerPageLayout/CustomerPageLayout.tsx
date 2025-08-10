"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/atoms/Card/Card";

export type CustomerPageLayoutProps = {
  /** 페이지 상단 제목 (예: 고객 관리) */
  title?: React.ReactNode;
  /** 보조 설명 */
  subtitle?: React.ReactNode;
  /** 우측 상단 액션 영역 (버튼들) */
  actions?: React.ReactNode;
  /** 좌측 사이드바 콘텐츠 (필터/태그/그룹 등) */
  sidebar?: React.ReactNode;
  /** 메인 본문(테이블/그리드 등) */
  children: React.ReactNode;
  /** 바깥 컨테이너 클래스 */
  className?: string;
};

export function CustomerPageLayout({
  title,
  subtitle,
  actions,
  sidebar,
  children,
  className,
}: CustomerPageLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-6 lg:flex-row lg:gap-8", className)}>
      {/* Sidebar */}
      {sidebar ? (
        <aside className="lg:w-72 flex-shrink-0 space-y-4">
          <Card className="p-4">{sidebar}</Card>
        </aside>
      ) : null}

      {/* Main */}
      <main className="flex-1 space-y-4">
        {(title || subtitle || actions) && (
          <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {title ? (
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              ) : null}
              {subtitle ? (
                <p className="text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {actions ? <div className="flex gap-2">{actions}</div> : null}
          </header>
        )}

        {children}
      </main>
    </div>
  );
}
