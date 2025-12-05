"use client";

import { useState } from "react";
import { AuthPageLayout } from "@/features/auth/layouts/AuthPageLayout";
import { LoginForm } from "@/features/auth/components/LoginForm/LoginForm";
import { ForgotPasswordForm } from "../components/ForgotPasswordForm";

export default function SignInPage() {
  type Mode = "login" | "forgot";
  const [mode, setMode] = useState<Mode>("login");

  const title = mode === "login" ? "로그인" : "비밀번호 찾기";
  const subtitle =
    mode === "login"
      ? "계정에 로그인하고 매물 관리를 시작하세요."
      : "가입하신 이메일로 재설정 링크를 받아보세요.";

  return (
    <AuthPageLayout title={title} subtitle={subtitle}>
      {mode === "login" ? (
        <LoginForm
          onForgotClick={() => setMode("forgot")} // 비번찾기로 전환
        />
      ) : (
        <ForgotPasswordForm
          onBackToLogin={() => setMode("login")} // 로그인으로 돌아가기
        />
      )}
    </AuthPageLayout>
  );
}
