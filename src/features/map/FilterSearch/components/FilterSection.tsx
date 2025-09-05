import { FilterSectionProps } from "../utils/types";

export const FilterSection = ({ title, children }: FilterSectionProps) => (
  <div>
    <h2 className="text-sm font-medium text-gray-900 mb-2">{title}</h2>
    {children}
  </div>
);
