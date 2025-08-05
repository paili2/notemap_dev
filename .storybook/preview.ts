import type { Preview } from "@storybook/react";
import "../app/globals.css"; // Tailwind 글로벌 스타일

const preview: Preview = {
  parameters: {
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
