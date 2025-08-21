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

  // 여기서만 환경변수 주입 (process.env.NAME 형태로 사용 가능)
  env: (cfgEnv) => ({
    ...cfgEnv,
    NEXT_PUBLIC_KAKAO_MAP_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "",
  }),

  core: { builder: "@storybook/builder-vite" },

  viteFinal: async (cfg) => {
    // 자동 JSX 런타임
    cfg.esbuild = {
      ...(cfg.esbuild ?? {}),
      jsx: "automatic",
      jsxImportSource: "react",
    };

    // 별칭
    const SRC = fileURLToPath(new URL("../src", import.meta.url));
    const MOCK_NAV = fileURLToPath(
      new URL("./mocks/next-navigation.ts", import.meta.url)
    );

    cfg.resolve ??= {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias ?? {}),
      "@": SRC,
      "next/navigation": MOCK_NAV,
    };

    cfg.resolve.dedupe = [...(cfg.resolve.dedupe ?? []), "react", "react-dom"];

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
