"use client";

import BasicInfoSection from "../../../../sections/BasicInfoSection/BasicInfoSection";

export default function BasicInfoContainer({
  form,
}: {
  form: {
    address: string;
    setAddress: (v: string) => void;
    officePhone: string;
    setOfficePhone: (v: string) => void;
    officePhone2: string;
    setOfficePhone2: (v: string) => void;
    officeName: string;
    setOfficeName: (v: string) => void;
    moveIn: string;
    setMoveIn: (v: string) => void;
    floor: string;
    setFloor: (v: string) => void;
    roomNo: string;
    setRoomNo: (v: string) => void;
    structure: string;
    setStructure: (v: string) => void;
  };
}) {
  return (
    <BasicInfoSection
      address={form.address}
      setAddress={form.setAddress}
      officePhone={form.officePhone}
      setOfficePhone={form.setOfficePhone}
      officePhone2={form.officePhone2}
      setOfficePhone2={form.setOfficePhone2}
    />
  );
}
