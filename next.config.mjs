/** @type {import('next').NextConfig} */

// 🔎 빌드 시점에 환경변수 확인(로그)
if (process.env.NEXT_PUBLIC_KAKAO_MAP_KEY) {
  console.log(
    "[build] NEXT_PUBLIC_KAKAO_MAP_KEY length =",
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY.length
  );
} else {
  console.warn("[build] NEXT_PUBLIC_KAKAO_MAP_KEY is MISSING at build time");
}

// ❗배포(production)에서 키가 없으면 빌드 실패시키기(임시)
if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
) {
  throw new Error("Missing NEXT_PUBLIC_KAKAO_MAP_KEY at build time");
}

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // (선택) 굳이 필요하진 않지만, 명시적으로 주입하고 싶다면:
  // env: { NEXT_PUBLIC_KAKAO_MAP_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY },
};

export default nextConfig;
