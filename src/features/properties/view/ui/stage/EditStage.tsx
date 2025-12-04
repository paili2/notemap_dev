// features/properties/view/.../EditStage.tsx

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

  // ⭐ 지도 핀 다시 불러오는 콜백 (label/pinKind 실제 변경 시에만 호출됨)
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
  return (
    <PropertyEditModalBody
      embedded // ✅ 카드 안에서 쓰는 모드
      initialData={initialData}
      onClose={onClose}
      onSubmit={onSubmit}
      // ⭐ Body로 그대로 넘김 (인자 없는 콜백)
      onLabelChanged={onLabelChanged}
    />
  );
}
