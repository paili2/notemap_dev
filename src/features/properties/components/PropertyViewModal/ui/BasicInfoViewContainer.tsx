"use client";

import BasicInfoView from "../components/BasicInfoView";

export default function BasicInfoViewContainer({
  address,
  officePhone,
  officePhone2,
}: {
  address: string;
  officePhone: string;
  officePhone2: string;
}) {
  return (
    <BasicInfoView
      address={address}
      officePhone={officePhone}
      officePhone2={officePhone2}
    />
  );
}
