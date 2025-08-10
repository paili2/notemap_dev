import type { Meta, StoryObj } from "@storybook/react";
import { PropertyPageLayout } from "./PropertyPageLayout";
import { Card } from "@/components/atoms/Card/Card";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";

const meta: Meta<typeof PropertyPageLayout> = {
  title: "layouts/PropertyPageLayout",
  component: PropertyPageLayout,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof PropertyPageLayout>;

export const Default: Story = {
  args: {
    toolbar: (
      <div className="flex gap-2">
        <Input placeholder="매물 검색..." className="max-w-xs" />
        <Button>필터</Button>
      </div>
    ),
    list: (
      <div className="p-4 space-y-2">
        {[...Array(10)].map((_, i) => (
          <Card key={i} className="p-4">
            매물 {i + 1}
          </Card>
        ))}
      </div>
    ),
    map: (
      <div className="h-full bg-muted flex items-center justify-center text-muted-foreground">
        지도 영역
      </div>
    ),
  },
};
