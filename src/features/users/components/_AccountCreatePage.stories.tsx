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
        http.post("*/photo/upload", async () => {
          await delay(300);
          return HttpResponse.json(
            {
              message: "ok",
              data: {
                urls: [
                  "https://example-bucket.s3.amazonaws.com/mock/photo-uuid.jpg",
                ],
                domain: "profile",
                userId: "1",
              },
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
