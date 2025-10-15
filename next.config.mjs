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

// ✅ .env.local 의 NEXT_PUBLIC_API_BASE 사용
const API_ORIGIN = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3050";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },

  images: {
    domains: ["placehold.co"],
  },

  async rewrites() {
    return [
      // ✅ 기본: /api/* -> 3050/*
      { source: "/api/:path*", destination: `${API_ORIGIN}/:path*` },

      // ✅ 레거시 호출 호환: /pins, /pins/* -> 3050/pins, 3050/pins/*
      { source: "/pins", destination: `${API_ORIGIN}/pins` },
      { source: "/pins/:path*", destination: `${API_ORIGIN}/pins/:path*` },
    ];
  },
};

export default nextConfig;
