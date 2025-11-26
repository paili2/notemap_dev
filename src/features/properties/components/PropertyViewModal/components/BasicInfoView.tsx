"use client";

import { useEffect, useState } from "react";
import Field from "@/components/atoms/Field/Field";
import { Phone, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BasicInfoViewProps {
  address?: string;
  officePhone?: string; // 대표번호
  officePhone2?: string; // 추가번호(선택)
}

export default function BasicInfoView({
  address,
  officePhone,
  officePhone2,
}: BasicInfoViewProps) {
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 여부 감지
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mobileCheck = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
  }, []);

  const phones = [officePhone, officePhone2]
    .map((p) => (p ?? "").trim())
    .filter((p) => p.length > 0);

  const toTel = (phone: string) => phone.replace(/[^0-9+]/g, "");

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: "전화번호가 복사되었습니다.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "복사에 실패했습니다. 다시 시도해주세요.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 주소 */}
      <Field label="주소">
        <div className="h-9 flex items-center text-sm text-slate-800">
          {(address ?? "").trim() || "-"}
        </div>
      </Field>

      {/* 분양사무실 번호 */}
      <Field label="분양사무실">
        {phones.length === 0 ? (
          <div className="h-9 flex items-center text-sm text-slate-800">-</div>
        ) : (
          <div className="h-9 flex items-center text-sm text-slate-800 gap-6">
            {phones.map((phone) => (
              <div key={phone} className="flex items-center gap-1">
                <span>{phone}</span>

                {/* 모바일 → 전화걸기 수화기 아이콘 */}
                {isMobile && (
                  <a
                    href={`tel:${toTel(phone)}`}
                    aria-label={`${phone}로 전화 걸기`}
                  >
                    <Phone className="w-4 h-4 text-blue-500 hover:text-blue-600" />
                  </a>
                )}

                {/* 데스크탑 → 복사 아이콘 + 토스트 */}
                {!isMobile && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(phone)}
                    className="cursor-pointer"
                    aria-label={`${phone} 복사하기`}
                  >
                    <Copy className="w-4 h-4 text-slate-500 hover:text-slate-700" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Field>
    </div>
  );
}
