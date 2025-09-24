"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/atoms/Card/Card";
import { AuthPageLayoutProps } from "./AuthPageLayout.type";
import Image from "next/image";

type Vars = CSSProperties & { ["--left-col"]?: string };

export function AuthPageLayout({
  logo,
  sideImageUrl,
  sideOverlay,
  leftWidthPx = 560,

  title,
  subtitle,
  social,
  footer,

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
          <Image
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

          <div className="text-sm tracking-tight bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            © {new Date().getFullYear()} K&N
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
