import React from "react";
import { Search } from "lucide-react";
import { IconBase, IconBaseProps } from "./IconBase";

export const SearchIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <Search />
    </IconBase>
  );
};
