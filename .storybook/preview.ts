import type { Preview } from "@storybook/react";
import "../app/globals.css"; // Tailwind 글로벌 스타일

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "plain-white",
      values: [
        { name: "plain-white", value: "#ffffff" },
        { name: "dark", value: "#333333" },
      ],
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
