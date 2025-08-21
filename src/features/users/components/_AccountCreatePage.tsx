"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardTitle,
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
import { useState } from "react";

/** ========== 타입 ========== */
export type CreateAccountPayload = {
  // 기본
  email: string;
  password: string;
  name: string;
  role: "manager" | "staff";
  phone: string;
  birthday: string; // YYYY-MM-DD (빈값 허용 시 "")
  emergency_contact: string;
  address: string;
  salary_account: string;

  // 추가정보(선택)
  photo_url?: string;
  id_photo_url?: string;
  resident_register_url?: string; // 등본
  resident_extract_url?: string; // 초본
  family_relation_url?: string; // 가족관계증명서
};

const phoneRegex = /^[0-9\-+() ]{9,20}$/;

const birthdaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "형식은 YYYY-MM-DD")
  .refine((v) => !Number.isNaN(Date.parse(v)), "유효한 날짜를 입력하세요.");

/** ========== 검증 스키마 ========== */
const CreateUserSchema = z
  .object({
    email: z.string().email("이메일 형식이 올바르지 않습니다."),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
    password_confirm: z
      .string()
      .min(8, "비밀번호 확인도 8자 이상이어야 합니다."),
    name: z.string().min(1, "이름을 입력하세요.").max(100),
    role: z.enum(["manager", "staff"], {
      required_error: "역할을 선택하세요.",
    }),
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
      .max(20),
    address: z.string().min(1, "주소를 입력하세요.").max(200),
    salary_account: z.string().min(1, "급여계좌를 입력하세요.").max(50),
    photo_url: z
      .string()
      .url("URL 형식이 올바르지 않습니다.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    id_photo_url: z
      .string()
      .url("URL 형식이 올바르지 않습니다.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    resident_register_url: z
      .string()
      .url("URL 형식이 올바르지 않습니다.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    resident_extract_url: z
      .string()
      .url("URL 형식이 올바르지 않습니다.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    family_relation_url: z
      .string()
      .url("URL 형식이 올바르지 않습니다.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["password_confirm"], // 에러를 확인 필드에 표시
  });
type CreateUserValues = z.infer<typeof CreateUserSchema>;

type UploadField =
  | "photo_url"
  | "id_photo_url"
  | "resident_register_url"
  | "resident_extract_url"
  | "family_relation_url";

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
      password_confirm: "",
      name: "",
      role: "staff",
      phone: "",
      birthday: "",
      emergency_contact: "",
      address: "",
      salary_account: "",
      photo_url: "",
      id_photo_url: "",
      resident_register_url: "",
      resident_extract_url: "",
      family_relation_url: "",
    },
    mode: "onChange",
  });

  /** 업로드 상태 & 에러를 필드별로 관리 */
  const [uploading, setUploading] = useState<UploadField | null>(null);
  const [uploadErrors, setUploadErrors] = useState<
    Partial<Record<UploadField, string>>
  >({});

  const setFieldError = (field: UploadField, msg: string | null) =>
    setUploadErrors((prev) => ({ ...prev, [field]: msg || undefined }));

  /** 제출 */
  const handleSubmit = async (v: CreateUserValues) => {
    if (uploading) return;

    const payload: CreateAccountPayload = {
      email: v.email,
      password: v.password,
      name: v.name,
      role: v.role,
      phone: v.phone,
      birthday: v.birthday ?? "",
      emergency_contact: v.emergency_contact,
      address: v.address,
      salary_account: v.salary_account,
      photo_url: v.photo_url,
      id_photo_url: v.id_photo_url,
      resident_register_url: v.resident_register_url,
      resident_extract_url: v.resident_extract_url,
      family_relation_url: v.family_relation_url,
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
      address: "",
      salary_account: "",
      photo_url: "",
      id_photo_url: "",
      resident_register_url: "",
      resident_extract_url: "",
      family_relation_url: "",
    });
    setUploadErrors({});
    setUploading(null);
  };

  /** 공용 업로드 핸들러: 성공 시 해당 필드에 url 세팅 */
  const handleFileChange =
    (field: UploadField): React.ChangeEventHandler<HTMLInputElement> =>
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFieldError(field, null);

      if (file.size > maxUploadBytes) {
        setFieldError(
          field,
          `파일이 너무 큽니다. 최대 ${(maxUploadBytes / (1024 * 1024)).toFixed(
            1
          )}MB 까지 가능합니다.`
        );
        e.currentTarget.value = "";
        return;
      }

      setUploading(field);
      try {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch(uploadEndpoint, { method: "POST", body: fd });
        if (!res.ok) throw new Error(`업로드 실패 (${res.status})`);

        const data = (await res.json()) as { url?: string; [k: string]: any };
        if (!data.url) throw new Error("응답에 url이 없습니다.");

        form.setValue(field, data.url, { shouldValidate: true });
      } catch (err: any) {
        setFieldError(field, err?.message ?? "업로드 중 오류가 발생했습니다.");
      } finally {
        setUploading(null);
        e.currentTarget.value = "";
      }
    };

  const clearFile = (field: UploadField) => {
    form.setValue(field, "", { shouldValidate: true });
    setFieldError(field, null);
  };

  /** 프리뷰 유틸 */
  const isImageUrl = (url?: string) =>
    !!url && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url.split("?")[0] || "");

  /** watch 값 */
  const photoUrl = form.watch("photo_url");
  const idPhotoUrl = form.watch("id_photo_url");
  const regUrl = form.watch("resident_register_url");
  const extUrl = form.watch("resident_extract_url");
  const famUrl = form.watch("family_relation_url");

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> 새 계정 생성
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid grid-cols-1 gap-6"
          >
            {/* ===== 기본 정보 ===== */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
              {/* 생년월일 */}
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>생년월일</FormLabel>
                    <FormControl className="flex-1">
                      <BirthdayPicker
                        value={field.value ?? ""}
                        onChange={(v) =>
                          field.onChange(v === "" ? undefined : v)
                        }
                        fromYear={1960}
                        toYear={new Date().getFullYear()}
                        disabled={!!uploading}
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
              <FormField
                control={form.control}
                name="password_confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호 확인 *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="비밀번호 다시 입력"
                        {...field}
                      />
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
              {/* 비상 연락처 */}
              <FormField
                control={form.control}
                name="emergency_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비상 연락처 *</FormLabel>
                    <FormControl>
                      <Input placeholder="010-0000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* 주소 */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주소 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="서울특별시 ○○구 ○○로 12, 101호"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />{" "}
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
            </div>

            {/* ===== 추가 정보 (파일 업로드) ===== */}
            <div className="space-y-4">
              {/* 증명사진 */}
              <UploadRow
                label="증명사진"
                value={photoUrl}
                error={uploadErrors.photo_url}
                loading={uploading === "photo_url"}
                onChange={handleFileChange("photo_url")}
                onClear={() => clearFile("photo_url")}
                isImage
              />

              {/* 신분증 사진 */}
              <UploadRow
                label="신분증 사진"
                value={idPhotoUrl}
                error={uploadErrors.id_photo_url}
                loading={uploading === "id_photo_url"}
                onChange={handleFileChange("id_photo_url")}
                onClear={() => clearFile("id_photo_url")}
                isImage
              />

              {/* 등본 */}
              <UploadRow
                label="등본"
                value={regUrl}
                error={uploadErrors.resident_register_url}
                loading={uploading === "resident_register_url"}
                onChange={handleFileChange("resident_register_url")}
                onClear={() => clearFile("resident_register_url")}
                isImage={isImageUrl(regUrl)}
              />

              {/* 초본 */}
              <UploadRow
                label="초본"
                value={extUrl}
                error={uploadErrors.resident_extract_url}
                loading={uploading === "resident_extract_url"}
                onChange={handleFileChange("resident_extract_url")}
                onClear={() => clearFile("resident_extract_url")}
                isImage={isImageUrl(extUrl)}
              />

              {/* 가족관계증명서 */}
              <UploadRow
                label="가족관계증명서"
                value={famUrl}
                error={uploadErrors.family_relation_url}
                loading={uploading === "family_relation_url"}
                onChange={handleFileChange("family_relation_url")}
                onClear={() => clearFile("family_relation_url")}
                isImage={isImageUrl(famUrl)}
              />
            </div>

            {/* 액션 */}
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset({
                    email: "",
                    password: "",
                    name: "",
                    role: "staff",
                    phone: "",
                    birthday: "",
                    emergency_contact: "",
                    address: "",
                    salary_account: "",
                    photo_url: "",
                    id_photo_url: "",
                    resident_register_url: "",
                    resident_extract_url: "",
                    family_relation_url: "",
                  });
                  setUploadErrors({});
                  setUploading(null);
                }}
              >
                초기화
              </Button>
              <Button type="submit" disabled={!!uploading}>
                {uploading ? "업로드 대기…" : "계정 생성"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

/** 파일 업로드 공용 UI 블록 */
function UploadRow({
  label,
  value,
  error,
  loading,
  onChange,
  onClear,
  isImage,
}: {
  label: string;
  value?: string;
  error?: string;
  loading?: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onClear: () => void;
  isImage?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="*/*"
          onChange={onChange}
          disabled={loading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          disabled={!value || loading}
        >
          제거
        </Button>
      </div>

      {loading && (
        <p className="text-xs text-muted-foreground">업로드 중입니다…</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {value && (
        <div className="flex items-center gap-3">
          {isImage ? (
            // 이미지 미리보기
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={`${label} 미리보기`}
              className="h-20 w-20 rounded-md border object-cover"
            />
          ) : (
            <div className="rounded-md border bg-muted/40 px-2 py-1 text-xs">
              {fileNameFromUrl(value)}
            </div>
          )}
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-xs underline"
          >
            원본 보기
          </a>
        </div>
      )}
    </div>
  );
}

/** 유틸 */
function fileNameFromUrl(u: string) {
  try {
    const url = new URL(u);
    return decodeURIComponent(url.pathname.split("/").pop() || "");
  } catch {
    return u.split("?")[0].split("#")[0].split("/").pop() || u;
  }
}
