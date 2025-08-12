import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    // ✅ 이 줄 추가
    typecheck: { tsconfig: "tsconfig.vitest.json" },
    projects: [
      {
        extends: true,
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [".storybook/vitest.setup.ts"], // ← Vitest만 사용 (스토리북 preview에서 import 금지)
        },
      },
    ],
  },
});
