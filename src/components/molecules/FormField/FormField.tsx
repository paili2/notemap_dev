"use client";

import Input, { InputProps } from "@/components/atoms/Input/Input";
import { FC } from "react";

interface FormFieldProps extends InputProps {
  label: string;
  error?: string;
}

const FormField: FC<FormFieldProps> = ({ label, error, ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="w-full flex items-center gap-3">
        <label
          htmlFor={props.name}
          className="text-sm font-medium text-gray-700 shrink-0"
        >
          {label}
        </label>
        <div className="flex flex-col">
          <Input {...props} />
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
};

export default FormField;
