"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms/Select/Select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/atoms/Form/Form";
import { Plus } from "lucide-react";
import BirthdayPicker from "@/components/organisms/BirthdayPicker/BirthdayPicker";

/** DB 스펙 기반 payload (id/created_at/updated_at/is_deleted/deleted_at 제외) */
export type CreateAccountPayload = {
  email: string;
  password: string;
  name: string;
  role: "manager" | "staff"; // admin(owner) 생성은 화면에서 금지
  phone: string;
  birthday: string; // YYYY-MM-DD (빈값 허용 시 ""로 전달)
  emergency_contact?: string;
  salary_account: string;
  photo_url?: string;
};

const phoneRegex = /^[0-9\-+() ]{9,20}$/;

// ✅ birthday 전용 스키마 분리 (빈문자열 허용)
const birthdaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "형식은 YYYY-MM-DD")
  .refine(
    (v: string) => !Number.isNaN(Date.parse(v)),
    "유효한 날짜를 입력하세요."
  );

const CreateUserSchema = z.object({
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  name: z.string().min(1, "이름을 입력하세요.").max(100),
  role: z.enum(["manager", "staff"], { required_error: "역할을 선택하세요." }),
  phone: z
    .string()
    .regex(phoneRegex, "연락처 형식이 올바르지 않습니다.")
    .max(20),
  birthday: z
    .union([birthdaySchema, z.literal("")])
    .transform((v) => (v === "" ? undefined : v)),
  emergency_contact: z
    .string()
    .regex(phoneRegex, "연락처 형식이 올바르지 않습니다.")
    .max(20)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  salary_account: z.string().min(1, "급여계좌를 입력하세요.").max(50),
  photo_url: z
    .string()
    .url("URL 형식이 올바르지 않습니다.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
type CreateUserValues = z.infer<typeof CreateUserSchema>;

export default function AccountCreatePage({
  onCreate,
  uploadEndpoint = "/api/upload",
  maxUploadBytes = 5 * 1024 * 1024,
}: {
  onCreate: (payload: CreateAccountPayload) => void | Promise<void>;
  uploadEndpoint?: string;
  maxUploadBytes?: number;
}) {
  const form = useForm<CreateUserValues>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "staff",
      phone: "",
      birthday: "",
      emergency_contact: "",
      salary_account: "",
      photo_url: "",
    },
    mode: "onChange",
  });

  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleSubmit = async (v: CreateUserValues) => {
    if (uploading) return;

    // ✅ CreateUserValues → CreateAccountPayload 변환
    const payload: CreateAccountPayload = {
      email: v.email,
      password: v.password,
      name: v.name,
      role: v.role,
      phone: v.phone,
      birthday: v.birthday ?? "", // 빈값 허용 시 ""로 전달
      emergency_contact: v.emergency_contact,
      salary_account: v.salary_account,
      photo_url: v.photo_url,
    };

    await onCreate(payload);

    form.reset({
      email: "",
      password: "",
      name: "",
      role: "staff",
      phone: "",
      birthday: "",
      emergency_contact: "",
      salary_account: "",
      photo_url: "",
    });
    setUploadError(null);
  };

  /** 파일 선택 → 업로드 → URL 응답 → photo_url 세팅 */
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxUploadBytes) {
      setUploadError(
        `파일이 너무 큽니다. 최대 ${(maxUploadBytes / (1024 * 1024)).toFixed(
          1
        )}MB 까지 가능합니다.`
      );
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(uploadEndpoint, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`업로드 실패 (${res.status})`);

      const data = (await res.json()) as { url?: string; [k: string]: any };
      if (!data.url) throw new Error("응답에 url이 없습니다.");

      form.setValue("photo_url", data.url, { shouldValidate: true });
    } catch (err: any) {
      setUploadError(err?.message ?? "업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      e.currentTarget.value = "";
    }
  };

  const clearPhoto = () => {
    form.setValue("photo_url", "", { shouldValidate: true });
    setUploadError(null);
  };

  const photoUrl = form.watch("photo_url");

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> 새 계정 생성
        </CardTitle>
        <CardDescription>
          메인관리자(owner/admin)는 개발자가 1회만 생성합니다. (화면에서 생성
          불가)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* 이메일 */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일 *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 비밀번호 */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호 *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="8자 이상"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 이름 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름 *</FormLabel>
                  <FormControl>
                    <Input placeholder="홍길동" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 권한 */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>권한 *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">팀장</SelectItem>
                        <SelectItem value="staff">사원</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 연락처 */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>연락처 *</FormLabel>
                  <FormControl>
                    <Input placeholder="010-1234-5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 생년월일 (커스텀: 수기 + 캘린더) */}
            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormLabel className="w-24 shrink-0">생년월일</FormLabel>
                  <FormControl className="flex-1">
                    <BirthdayPicker
                      value={field.value ?? ""} // undefined 허용
                      onChange={(v) => field.onChange(v === "" ? undefined : v)}
                      fromYear={1960}
                      toYear={new Date().getFullYear()}
                      disabled={uploading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 비상 연락처 (선택) */}
            <FormField
              control={form.control}
              name="emergency_contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비상 연락처</FormLabel>
                  <FormControl>
                    <Input placeholder="010-0000-0000 (선택)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 급여계좌 */}
            <FormField
              control={form.control}
              name="salary_account"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>급여계좌 *</FormLabel>
                  <FormControl>
                    <Input placeholder="국민 123456-78-901234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 증명사진 */}
            <FormField
              control={form.control}
              name="photo_url"
              render={() => (
                <FormItem className="md:col-span-2">
                  <FormLabel>증명사진</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={uploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={clearPhoto}
                          disabled={!photoUrl || uploading}
                        >
                          제거
                        </Button>
                      </div>
                      {uploading && (
                        <p className="text-xs text-muted-foreground">
                          업로드 중입니다…
                        </p>
                      )}
                      {uploadError && (
                        <p className="text-xs text-destructive">
                          {uploadError}
                        </p>
                      )}
                      {photoUrl && (
                        <div className="flex items-center gap-3">
                          <img
                            src={photoUrl}
                            alt="증명사진 미리보기"
                            className="h-20 w-20 object-cover rounded-md border"
                          />
                          <span className="text-xs text-muted-foreground break-all">
                            {photoUrl}
                          </span>
                        </div>
                      )}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setUploadError(null);
                }}
              >
                초기화
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "업로드 대기…" : "계정 생성"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
