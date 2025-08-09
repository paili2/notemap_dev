import * as React from "react";
import { Label } from "@/components/atoms/Label/Label";
import { Input } from "@/components/atoms/Input/Input";

export interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  labelWidth?: string; // 라벨 너비 조정 옵션
}

export function FormField({
  label,
  name,
  type = "text",
  className,
  labelWidth = "w-24", // 기본 96px
  ...props
}: FormFieldProps) {
  return (
    <div className="flex items-center gap-3 w-full">
      <Label
        htmlFor={name}
        className={`text-sm font-medium ${labelWidth} shrink-0`}
      >
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        className={className}
        {...props}
      />
    </div>
  );
}

export default FormField;
