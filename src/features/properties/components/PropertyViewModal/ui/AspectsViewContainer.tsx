"use client";
import AspectsView from "../components/AspectsView/AspectsView";
import { PropertyViewDetails } from "../types";

export default function AspectsViewContainer({
  details,
}: {
  details: PropertyViewDetails;
}) {
  return <AspectsView details={details} />;
}
