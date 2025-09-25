import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let email = "";
  let password = "";

  // JSON 또는 form-urlencoded 모두 처리
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    email = body.email ?? "";
    password = body.password ?? "";
  } else {
    const form = await req.formData();
    email = String(form.get("email") ?? "");
    password = String(form.get("password") ?? "");
  }

  // 데모 계정 (원하면 .env 로 덮어쓰기)
  const DEMO_EMAIL = process.env.DEMO_EMAIL || "user01@example.com";
  const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "notemap123!";

  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // 배포 식별자(재배포 시 자동 무효화하고 싶을 때 사용)
  const BOOT_ID = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";

  const res = NextResponse.json({ ok: true });

  // ✅ 세션 쿠키: maxAge / expires 를 넣지 않습니다.
  //    → 브라우저(앱)를 완전히 종료하면 삭제됩니다.
  res.cookies.set("session_v2", JSON.stringify({ u: "demo", boot: BOOT_ID }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || !!process.env.VERCEL,
    path: "/",
    // ❌ no maxAge / no expires
  });

  return res;
}
