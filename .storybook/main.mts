import type { StorybookConfig } from "@storybook/nextjs";
import dotenv from "dotenv";
import type { UserConfig as ViteConfig } from "vite";
import { fileURLToPath } from "node:url";

dotenv.config({ path: ".env.local" });

type SBConfigWithVite = StorybookConfig & {
  core?: { builder?: "@storybook/builder-vite" | string };
  viteFinal?: (config: ViteConfig) => Promise<ViteConfig> | ViteConfig;
};

const config: SBConfigWithVite = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: { name: "@storybook/nextjs", options: {} },
  docs: { autodocs: "tag" },

  // ✅ 여기서만 환경변수 주입 (process.env.NAME 형태로 사용 가능)
  env: (cfgEnv) => ({
    ...cfgEnv,
    NEXT_PUBLIC_KAKAO_MAP_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "",
  }),

  core: { builder: "@storybook/builder-vite" },

  viteFinal: async (cfg) => {
    // ✅ 자동 JSX 런타임
    cfg.esbuild = {
      ...(cfg.esbuild ?? {}),
      jsx: "automatic",
      jsxImportSource: "react",
    };

    // 별칭
    const SRC = fileURLToPath(new URL("../src", import.meta.url));
    const MOCK_NAV = fileURLToPath(
      new URL("./mocks/next-navigation.ts", import.meta.url) // 파일명/경로 일치 확인
    );

    cfg.resolve ??= {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias ?? {}),
      "@": SRC,
      "next/navigation": MOCK_NAV,
    };

    // react 중복 로딩 방지
    cfg.resolve.dedupe = [...(cfg.resolve.dedupe ?? []), "react", "react-dom"];

    // ✅ 스토리 번들에 NEXT_PUBLIC_KAKAO_MAP_KEY를 명시적으로 인라인 주입
    cfg.define = {
      ...(cfg.define ?? {}),
      "process.env.NEXT_PUBLIC_KAKAO_MAP_KEY": JSON.stringify(
        process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || ""
      ),
    };

    return cfg;
  },
};

export default config;
