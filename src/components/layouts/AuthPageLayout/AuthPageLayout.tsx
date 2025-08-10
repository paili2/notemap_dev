"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/atoms/Card/Card";

export type AuthPageLayoutProps = {
  /** 카드 상단 제목 (예: 로그인, 회원가입) */
  title?: React.ReactNode;
  /** 부제목/설명 */
  subtitle?: React.ReactNode;
  /** 카드 하단(약관, 링크) */
  footer?: React.ReactNode;
  /** 상단 좌측 로고/브랜드 표시 */
  logo?: React.ReactNode;
  /** 좌측 패널 이미지 URL (모바일에서는 숨김) */
  sideImageUrl?: string;
  /** 좌측 패널에 오버레이로 겹칠 내용(문구 등) */
  sideOverlay?: React.ReactNode;
  /** 소셜 로그인 영역 (버튼들) */
  social?: React.ReactNode;
  /** 폼 영역 */
  children: React.ReactNode;
  /** 카드 너비 제약 */
  cardClassName?: string;
  /** 바깥 컨테이너 클래스 */
  className?: string;
};

export function AuthPageLayout({
  title,
  subtitle,
  footer,
  logo,
  sideImageUrl,
  sideOverlay,
  social,
  children,
  cardClassName,
  className,
}: AuthPageLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen w-full bg-background grid lg:grid-cols-2",
        className
      )}
    >
      {/* Left / Brand Panel */}
      <div className="relative hidden lg:block">
        {/* 배경 이미지 */}
        {sideImageUrl ? (
          <img
            src={sideImageUrl}
            alt="Auth side"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-zinc-900 to-zinc-700" />
        )}

        {/* 오버레이 */}
        <div className="absolute inset-0 bg-black/40" />

        {/* 내용 */}
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          <div className="opacity-90">{logo}</div>
          <div className="max-w-lg">
            {sideOverlay ?? (
              <>
                <h2 className="text-3xl font-semibold leading-tight">
                  공간을 발견하고, 매물을 연결하세요.
                </h2>
                <p className="mt-3 text-white/80">
                  직관적인 지도와 정교한 필터로 원하는 매물을 더 빠르게.
                </p>
              </>
            )}
          </div>
          <div className="text-sm text-white/70">
            © {new Date().getFullYear()} CheolpanJeong
          </div>
        </div>
      </div>

      {/* Right / Form Panel */}
      <div className="flex items-center justify-center p-6">
        <div className={cn("w-full max-w-md", cardClassName)}>
          <div className="mb-8 flex items-center justify-center lg:hidden">
            {logo}
          </div>

          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              {title ? (
                <CardTitle className="text-2xl">{title}</CardTitle>
              ) : null}
              {subtitle ? (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 소셜 로그인 버튼 영역 */}
              {social ? (
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
              ) : null}

              {/* 폼 슬롯 */}
              <div className="space-y-4">{children}</div>

              {/* 푸터 슬롯 (약관/링크 등) */}
              {footer ? (
                <div className="pt-2 text-center text-sm">{footer}</div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
