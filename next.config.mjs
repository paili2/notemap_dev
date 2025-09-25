/** @type {import('next').NextConfig} */

// 🔎 빌드 시점 로그 (그대로 유지)
if (process.env.NEXT_PUBLIC_KAKAO_MAP_KEY) {
  console.log(
    "[build] NEXT_PUBLIC_KAKAO_MAP_KEY length =",
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY.length
  );
} else {
  console.warn("[build] NEXT_PUBLIC_KAKAO_MAP_KEY is MISSING at build time");
}
if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
) {
  throw new Error("Missing NEXT_PUBLIC_KAKAO_MAP_KEY at build time");
}

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },

  images: {
    // 간단 버전
    domains: ["placehold.co"],
    // 또는 더 엄격한 패턴
    // remotePatterns: [{ protocol: "https", hostname: "placehold.co" }],
  },

  // env: { NEXT_PUBLIC_KAKAO_MAP_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY }, // 선택
};

export default nextConfig;
