import React from "react";
import { MapPin } from "lucide-react";
import { IconBase, IconBaseProps } from "./IconBase";

export const MapPinIcon = (props: IconBaseProps) => {
  return (
    <IconBase {...props}>
      <MapPin />
    </IconBase>
  );
};
