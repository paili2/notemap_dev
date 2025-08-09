import type { StorybookConfig } from "@storybook/nextjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  docs: { autodocs: "tag" },

  // ✅ 여기서 환경변수 주입 (preview iframe에 들어감)
  env: (cfgEnv) => ({
    ...cfgEnv,
    NEXT_PUBLIC_KAKAO_MAP_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "",
  }),
};

export default config;
