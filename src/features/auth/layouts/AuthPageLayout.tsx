"use client";

import * as React from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/atoms/Card/Card";

type Vars = CSSProperties & { ["--left-col"]?: string };

export type AuthPageLayoutProps = {
  // 좌측
  logo?: React.ReactNode;
  sideImageUrl?: string;
  sideOverlay?: React.ReactNode;
  leftWidthPx?: number; // 데스크톱 고정폭(px), 기본 560

  // 우측(카드 모드에서만 사용)
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  social?: React.ReactNode;
  footer?: React.ReactNode;

  // 공통
  children: React.ReactNode;
  className?: string;
  rightClassName?: string;
  cardClassName?: string;

  /** 우측을 카드로 감쌀지 선택 (기본: card) */
  frame?: "card" | "none";
};

export function AuthPageLayout({
  // 좌측
  logo,
  sideImageUrl,
  sideOverlay,
  leftWidthPx = 560,

  // 우측(카드 모드에서만)
  title,
  subtitle,
  social,
  footer,

  // 공통
  children,
  className,
  rightClassName,
  cardClassName,
  frame = "card",
}: AuthPageLayoutProps) {
  const style: Vars = { "--left-col": `${leftWidthPx}px` };

  return (
    <div
      style={style}
      className={cn(
        "h-[100dvh] w-full overflow-hidden bg-background",
        "grid grid-cols-1 lg:[grid-template-columns:var(--left-col)_1fr]",
        className
      )}
    >
      {/* Left / Brand Panel */}
      <div className="relative hidden h-full lg:block">
        {sideImageUrl ? (
          <img
            src={sideImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-zinc-900 to-zinc-700" />
        )}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 flex h-full flex-col justify-between px-12 py-10 text-white">
          <div className="opacity-90">{logo}</div>

          <div className="max-w-2xl">
            {sideOverlay ?? (
              <>
                <h2 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl xl:text-6xl">
                  공간을 발견하고, 매물을 연결하세요.
                </h2>
                <p className="mt-4 text-white/80 text-lg md:text-xl">
                  직관적인 지도와 정교한 필터로 원하는 매물을 더 빠르게.
                </p>
              </>
            )}
          </div>

          <div className="text-sm text-white/70">
            © {new Date().getFullYear()} NoteMap
          </div>
        </div>
      </div>

      {/* Right / Content Panel */}
      <div
        className={cn(
          "flex h-full items-center justify-center px-6 py-8 overflow-y-auto",
          rightClassName
        )}
      >
        <div className={cn("w-full max-w-lg", cardClassName)}>
          {/* 모바일 상단 로고 */}
          <div className="mb-8 flex items-center justify-center lg:hidden">
            {logo}
          </div>

          {frame === "card" ? (
            <Card className="rounded-2xl shadow-xl px-3">
              {(title || subtitle) && (
                <CardHeader className="space-y-2">
                  {title && (
                    <CardTitle className="text-3xl font-extrabold text-center">
                      {title}
                    </CardTitle>
                  )}
                  {subtitle && (
                    <p className="text-base text-muted-foreground text-center">
                      {subtitle}
                    </p>
                  )}
                </CardHeader>
              )}

              <CardContent className="space-y-6">
                {social && (
                  <>
                    <div className="grid gap-2">{social}</div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          또는 이메일로 계속하기
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-4">{children}</div>

                {footer && (
                  <div className="pt-2 text-center text-sm text-muted-foreground">
                    {footer}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // frame="none" → 카드 없이 바로 children만
            <div className="w-full">{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
