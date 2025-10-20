"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/atoms/Form/Form";
import { useState } from "react";
import PasswordInput from "./PasswordInput";
import { LoginSchema, type LoginValues } from "../../schemas/login";
import { FormError } from "@/components/atoms/FormError/FormError";
import { api } from "@/shared/api/api"; // ✅ axios 인스턴스
// 서버 타입이 있다면 import 해서 써도 됨 (예: SignInResp)

type LoginFormProps = {
  onForgotClick?: () => void;
  onSuccess?: () => void; // ✅ 추가
};

export function LoginForm({ onForgotClick, onSuccess }: LoginFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", remember: false },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = form;

  async function onSubmit(values: LoginValues) {
    setError(null);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        // ✅ 필요한 필드만 전송
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
        // 같은 오리진이면 생략 가능하지만 명시해도 무방
        credentials: "same-origin",
      });

      if (!res.ok) {
        // 에러 메시지 확인해보고 싶으면 아래 두 줄 잠깐 켜서 보세요
        // const err = await res.json().catch(() => null);
        // console.log("signin error:", err);
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      sessionStorage.setItem("nm_session", "1");
      router.replace(redirect);
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  }

  return (
    <div className="space-y-5">
      <FormError message={error} />

      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* Email */}
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="email">이메일</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      autoComplete="email"
                      autoFocus
                      disabled={isSubmitting}
                      className="pr-9"
                      {...field}
                    />
                    <Mail
                      aria-hidden
                      className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 opacity-60"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="password">비밀번호</FormLabel>
                  <button
                    type="button"
                    onClick={onForgotClick}
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                </div>
                <FormControl>
                  <PasswordInput
                    id="password"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Remember */}
          <FormField
            control={control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    id="remember"
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <Label htmlFor="remember" className="text-sm font-normal">
                  로그인 상태 유지
                </Label>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                로그인 중...
              </>
            ) : (
              "로그인"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
