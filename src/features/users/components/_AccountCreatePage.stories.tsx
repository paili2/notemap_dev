import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
// ⬇변경: rest -> http, HttpResponse (+ delay)
import { http, HttpResponse, delay } from "msw";
import AccountCreatePage, { CreateAccountPayload } from "./_AccountCreatePage";

const meta: Meta<typeof AccountCreatePage> = {
  title: "pages/Settings/AccountCreatePage",
  component: AccountCreatePage,
  parameters: {
    react: { strictMode: false },
    msw: {
      handlers: [
        // rest.post -> http.post
        http.post("/api/upload", async (req) => {
          // ctx.delay -> await delay
          await delay(300);
          // res(ctx.status, ctx.json) -> return HttpResponse.json(data, { status })
          return HttpResponse.json(
            {
              url: "https://example-bucket.s3.amazonaws.com/mock/photo-uuid.jpg",
            },
            { status: 200 }
          );
        }),
      ],
    },
  },
};
export default meta;

type Story = StoryObj<typeof AccountCreatePage>;

const onCreate = async (payload: CreateAccountPayload) => {
  action("onCreate")(payload);
};

export const Default: Story = {
  args: {
    onCreate,
  },
};

export const CustomMaxUpload: Story = {
  args: {
    onCreate,
    maxUploadBytes: 2 * 1024 * 1024, // 2MB 제한
  },
};

export const CustomEndpoint: Story = {
  args: {
    onCreate,
    uploadEndpoint: "/api/custom-upload",
  },
  parameters: {
    msw: {
      handlers: [
        http.post("/api/custom-upload", async (req) => {
          await delay(200);
          return HttpResponse.json(
            {
              url: "https://example-bucket.s3.amazonaws.com/custom/photo-uuid.jpg",
            },
            { status: 200 }
          );
        }),
      ],
    },
  },
};
