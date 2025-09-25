"use client";

import { AuthPageLayout } from "@/features/auth/layouts/AuthPageLayout";
import { LoginForm } from "@/features/auth/components/LoginForm/LoginForm";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import KNLogo from "@/components/atoms/KNLogo";
import { useState } from "react";
import { DefaultLayout } from "@/components/layouts/DefaultLayout/DefaultLayout";

export default function SignInPage() {
  type Mode = "login" | "forgot";
  const [mode, setMode] = useState<Mode>("login");

  const title = mode === "login" ? "로그인" : "비밀번호 찾기";

  const subtitle =
    mode === "login"
      ? "계정에 로그인하고 매물 관리를 시작하세요."
      : "가입하신 이메일로 재설정 링크를 받아보세요.";

  return (
    <AuthPageLayout>
      <LoginForm onForgotClick={() => setMode("forgot")} />
    </AuthPageLayout>
  );
}
