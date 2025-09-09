"use client";

import Field from "@/components/atoms/Field/Field";
import OrientationBadges from "./components/OrientationBadges";
import { toAspectView } from "@/features/properties/lib/orientation";
import { PropertyViewDetails } from "../../types";

export default function AspectsView({
  details,
}: {
  details: PropertyViewDetails;
}) {
  const rows = toAspectView(details.orientations, {
    aspect: details.aspect,
    aspectNo: details.aspectNo,
    aspect1: details.aspect1,
    aspect2: details.aspect2,
    aspect3: details.aspect3,
  });

  return (
    <Field label="향">
      <OrientationBadges rows={rows} />
    </Field>
  );
}
