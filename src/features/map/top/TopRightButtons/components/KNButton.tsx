"use client";

import { Button } from "@/components/atoms/Button/Button";

type Props = {
  onClick: () => void;
};

export default function KNButton({ onClick }: Props) {
  return (
    <Button
      type="button"
      onClick={onClick}
      title="K&N"
      aria-label="K&N 열기"
      className="rounded-xl shadow"
    >
      K&N
    </Button>
  );
}
