import type { Preview } from "@storybook/react";
import "../app/globals.css";

// 브라우저 런타임에서 process가 없을 때 대비 (Next 모듈 보호)
(globalThis as any).process ??= { env: {} };

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "plain-white",
      values: [
        { name: "plain-white", value: "#ffffff" },
        { name: "dark", value: "#333333" },
      ],
    },
    viewport: {},
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
};

export default preview;
