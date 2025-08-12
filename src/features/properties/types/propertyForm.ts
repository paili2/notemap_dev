import type { z } from "zod";
import { propertyFormSchema } from "@/features/properties/schemas/propertyForm";

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export type PropertyFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<PropertyFormValues>;
  onSubmit?: (values: PropertyFormValues) => Promise<void> | void;
  className?: string;
};
