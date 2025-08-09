import React from "react";
import { User } from "lucide-react";
import { IconBase, IconBaseProps } from "./IconBase";

export const UserIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <User />
    </IconBase>
  );
};
