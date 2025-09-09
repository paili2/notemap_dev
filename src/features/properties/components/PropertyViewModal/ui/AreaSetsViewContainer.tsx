"use client";

import AreaSetsView from "../components/AreaSetsView/AreaSetsView";

export default function AreaSetsViewContainer({
  exclusiveArea,
  realArea,
  extraExclusiveAreas,
  extraRealAreas,
  baseAreaTitle,
  extraAreaTitles,
}: {
  exclusiveArea?: any;
  realArea?: any;
  extraExclusiveAreas?: any[];
  extraRealAreas?: any[];
  baseAreaTitle: string;
  extraAreaTitles: string[];
}) {
  return (
    <AreaSetsView
      exclusiveArea={exclusiveArea}
      realArea={realArea}
      extraExclusiveAreas={extraExclusiveAreas}
      extraRealAreas={extraRealAreas}
      baseAreaTitle={baseAreaTitle}
      extraAreaTitles={extraAreaTitles}
    />
  );
}
