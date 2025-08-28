// features/properties/components/modal/PropertyViewModal/view/AspectsView.tsx
"use client";

import Field from "../../common/Field";
import OrientationBadges from "../OrientationBadges";
import { toAspectView } from "@/features/properties/lib/orientation";
import type { PropertyViewDetails } from "@/features/properties/types/property-view";

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
