"use client";

import PropertyEditModalBody from "./PropertyEditModalBody";
import type { PropertyEditModalProps } from "./types";

export default function PropertyEditModal(props: PropertyEditModalProps) {
  if (!props.open) return null;
  return <PropertyEditModalBody {...props} />;
}
