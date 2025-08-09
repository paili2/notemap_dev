// 이미지, 제목, 가격, 상태 Badge
import Image from "next/image";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  imageUrl: string;
  title: string;
  address: string;
  price: string;
  status?: "판매중" | "계약중" | "거래완료";
  onClick?: () => void;
}

export function PropertyCard({
  imageUrl,
  title,
  address,
  price,
  status = "판매중",
  onClick,
}: PropertyCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden"
      )}
    >
      <div className="relative w-full h-40">
        <Image src={imageUrl} alt={title} fill className="object-cover" />
        <div className="absolute top-2 left-2">
          <Badge
            variant={
              status === "판매중"
                ? "default"
                : status === "계약중"
                ? "secondary"
                : "destructive"
            }
          >
            {status}
          </Badge>
        </div>
      </div>
      <div className="p-4 space-y-1">
        <h3 className="text-lg font-semibold leading-none">{title}</h3>
        <p className="text-sm text-muted-foreground">{address}</p>
        <p className="text-base font-bold mt-2">{price}</p>
        <Button className="mt-3 w-full" onClick={onClick}>
          상세보기
        </Button>
      </div>
    </div>
  );
}
