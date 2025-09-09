"use client";
import HeaderSection from "../../sections/HeaderSection/HeaderSection";
import type { EditFormAPI } from "../hooks/useEditForm";

export default function HeaderContainer({
  form,
  onClose,
}: {
  form: EditFormAPI;
  onClose: () => void;
}) {
  return (
    <HeaderSection
      title={form.title}
      setTitle={form.setTitle}
      listingStars={form.listingStars}
      setListingStars={form.setListingStars}
      elevator={form.elevator}
      setElevator={form.setElevator}
      onClose={onClose}
      onRefreshStars={() => form.setListingStars(0)}
      pinKind={form.pinKind}
      setPinKind={form.setPinKind}
    />
  );
}
