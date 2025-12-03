"use client";

import type { PropertyViewDetails } from "../../types";
import type {
  CreatePayload,
  UpdatePayload,
} from "@/features/properties/types/property-dto";
import PropertyEditModalBody from "../../../edit/PropertyEditModalBody";

type Props = {
  initialData: PropertyViewDetails | any;
  onClose: () => void;
  onSubmit: (p: UpdatePayload & Partial<CreatePayload>) => void | Promise<void>;

  // ⭐ 지도 핀 다시 불러오는 콜백 (ex. usePinsMap.refetch)
  onLabelChanged?: () => void | Promise<void>;

  asInner?: boolean;
};

export default function EditStage({
  initialData,
  onClose,
  onSubmit,
  onLabelChanged,
  asInner,
}: Props) {
  // asInner는 나중에 PropertyEditModalBody에서 또 쓸 수 있으면 같이 넘겨도 됨
  return (
    <PropertyEditModalBody
      embedded // ✅ 카드 안에서 쓰는 모드
      initialData={initialData}
      onClose={onClose}
      onSubmit={onSubmit}
      // ⭐ 여기에서 Body로 연결
      onLabelChanged={onLabelChanged}
    />
  );
}
