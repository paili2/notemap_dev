// Label + Input + Validation Message

"use client";

import { FC, ReactNode } from "react";

interface FormGroupProps {
  title?: string;
  children: ReactNode;
}

const FormGroup: FC<FormGroupProps> = ({ title, children }) => {
  return (
    <fieldset className="border border-gray-200 rounded p-4 w-full">
      {title && (
        <legend className="px-2 text-sm font-semibold text-gray-700">
          {title}
        </legend>
      )}
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  );
};

export default FormGroup;
