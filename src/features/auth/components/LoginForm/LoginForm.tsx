"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import PasswordInput from "./PasswordInput";
import { LoginSchema, type LoginValues } from "../../schemas/login";
import { FormError } from "@/components/atoms/FormError/FormError";

type LoginFormProps = {
  onForgotClick?: () => void;
  onSuccess?: () => void;
};

const STORAGE_KEY = "notemap:login-remember"; // { email, password }

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
    reset,
    watch,
  } = form;

  // 최초 로드 시 저장된 계정 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { email, password } = JSON.parse(raw) as {
          email?: string;
          password?: string;
        };
        reset({
          email: email ?? "",
          password: password ?? "",
          remember: true,
        });
      }
    } catch {
      // 무시
    }
  }, [reset]);

  async function onSubmit(values: LoginValues) {
    setError(null);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
        credentials: "same-origin",
      });

      if (!res.ok) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      // ✅ 아이디·비밀번호 기억 저장/삭제
      try {
        if (values.remember) {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              email: values.email,
              password: values.password,
            })
          );
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // 저장 실패는 무시
      }

      sessionStorage.setItem("nm_session", "1");
      onSuccess?.();
      router.replace(redirect);
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  }

  const rememberChecked = watch("remember");

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
                      autoComplete="username"
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
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                  아이디, 비밀번호 기억
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

          {/* 선택: 보안 안내 */}
          {rememberChecked && (
            <p className="mt-1 text-xs text-muted-foreground">
              개인 기기에서만 사용하세요. 저장된 비밀번호는 이 브라우저의 로컬에
              보관됩니다.
            </p>
          )}
        </form>
      </Form>
    </div>
  );
}
