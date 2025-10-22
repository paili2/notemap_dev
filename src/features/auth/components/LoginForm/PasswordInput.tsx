"use client";

import { Input } from "@/components/atoms/Input/Input";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

type Props = React.ComponentProps<typeof Input>; // ← id 포함 모든 인풋 프롭

const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          className={["pr-9", className].filter(Boolean).join(" ")}
          autoComplete="current-password"
          placeholder="12345678"
          {...props} // ← id, disabled, name, onChange, value 등 전부 허용
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-accent"
          aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
          disabled={props.disabled}
        >
          {show ? (
            <EyeOff className="size-4 opacity-60" />
          ) : (
            <Eye className="size-4 opacity-60" />
          )}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
