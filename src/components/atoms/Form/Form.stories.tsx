import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "./Form";

import { Input } from "@/components/atoms/Input/Input";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Button } from "@/components/atoms/Button/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card";

const meta: Meta = {
  title: "atoms/Form",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof meta>;

const LoginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요."),
  password: z.string().min(6, "비밀번호는 최소 6자입니다."),
  remember: z.boolean().optional().default(false),
});

function Spacer({ h = 8 }: { h?: number }) {
  return <div style={{ height: h }} />;
}

export const Basic: Story = {
  name: "Basic",
  render: () => {
    const form: UseFormReturn<{ email: string }> = useForm<{ email: string }>({
      defaultValues: { email: "" },
      mode: "onChange",
    });

    const onSubmit = (values: { email: string }) =>
      alert(JSON.stringify(values, null, 2));

    return (
      <Card style={{ width: 420 }}>
        <CardHeader>
          <CardTitle>Form (Basic)</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField<{ email: string }, "email">
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Spacer />
              <Button type="submit">제출</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  },
};

export const WithValidation: Story = {
  name: "With validation (zod)",
  render: () => {
    type LoginValues = z.infer<typeof LoginSchema>;

    const form: UseFormReturn<LoginValues> = useForm<LoginValues>({
      resolver: zodResolver(LoginSchema),
      defaultValues: { email: "", password: "", remember: false },
      mode: "onSubmit",
    });

    const onSubmit = (values: LoginValues) =>
      alert("로그인 성공!\n" + JSON.stringify(values, null, 2));

    return (
      <Card style={{ width: 420 }}>
        <CardHeader>
          <CardTitle>Form + Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField<LoginValues, "email">
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      로그인에 사용하는 이메일 주소
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<LoginValues, "password">
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<LoginValues, "remember">
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        id="remember"
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                    <FormLabel htmlFor="remember">로그인 상태 유지</FormLabel>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                로그인
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  },
};

export const InlineLayout: Story = {
  name: "Inline label layout",
  render: () => {
    type InlineValues = { username: string; phone: string };

    const form: UseFormReturn<InlineValues> = useForm<InlineValues>({
      defaultValues: { username: "", phone: "" },
    });

    const onSubmit = (values: InlineValues) =>
      alert(JSON.stringify(values, null, 2));

    return (
      <Card style={{ width: 560 }}>
        <CardHeader>
          <CardTitle>Inline Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField<InlineValues, "username">
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormLabel className="w-28 shrink-0">사용자명</FormLabel>
                      <div className="flex-1">
                        <FormControl>
                          <Input placeholder="홍길동" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField<InlineValues, "phone">
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormLabel className="w-28 shrink-0">전화번호</FormLabel>
                      <div className="flex-1">
                        <FormControl>
                          <Input placeholder="010-1234-5678" {...field} />
                        </FormControl>
                        <FormDescription className="mt-1">
                          하이픈 포함 입력 예: 010-1234-5678
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit">저장</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  },
};
