import { cn } from "@/lib/utils";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Separator } from "@/components/atoms/Separator/Separator";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/atoms/HoverCard/HoverCard";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/atoms/Popover/Popover";
import { MapPin, Star } from "lucide-react";
import { MapPinTooltipProps } from "./MapPinTooltip.types";

export function MapPinTooltip({
  mode = "hover",
  trigger,
  thumbnailUrl,
  title,
  priceText,
  status,
  address,
  distanceText,
  tags,
  favorite = false,
  onClickView,
  onToggleFavorite,
  side = "top",
  align = "center",
  sideOffset = 8,
  className,
}: MapPinTooltipProps) {
  const content = (
    <div
      className={cn("w-80 select-none", className)}
      role="dialog"
      aria-label="pin tooltip"
    >
      <div className="flex gap-3">
        <div className="h-20 w-28 overflow-hidden rounded-lg border bg-muted">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <MapPin className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p
              className="truncate text-sm font-semibold text-foreground"
              title={title}
            >
              {title}
            </p>
            {status && <StatusBadge status={status} />}
          </div>
          {priceText && <p className="text-sm text-foreground">{priceText}</p>}
          {(address || distanceText) && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {address}
              {address && distanceText ? " · " : ""}
              {distanceText}
            </p>
          )}
          {tags && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.slice(0, 4).map((t, i) => (
                <Badge
                  key={`${t}-${i}`}
                  variant="outline"
                  className="rounded-md text-[10px]"
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator className="my-3" />

      <div className="flex items-center gap-2">
        <Button size="sm" className="h-8" onClick={onClickView}>
          상세보기
        </Button>
        <Button
          size="sm"
          variant={favorite ? "default" : "outline"}
          className={cn(
            "h-8",
            favorite && "bg-yellow-500/90 hover:bg-yellow-500 text-black"
          )}
          onClick={() => onToggleFavorite?.(!favorite)}
        >
          <Star className={cn("mr-1 h-4 w-4", favorite && "fill-current")} />
          {favorite ? "즐겨찾기됨" : "즐겨찾기"}
        </Button>
        <div className="ml-auto text-xs text-muted-foreground">핀 툴팁</div>
      </div>
    </div>
  );

  if (mode === "click") {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          side={side}
          align={align}
          sideOffset={sideOffset}
          className="p-3"
        >
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="p-3"
      >
        {content}
      </HoverCardContent>
    </HoverCard>
  );
}

/** 타입 안전한 상태 배지 (as any 제거) */
function StatusBadge({ status }: { status: string }) {
  const MAP = {
    available: { label: "공실", variant: "success" },
    pending: { label: "계약중", variant: "secondary" },
    sold: { label: "완료", variant: "destructive" },
  } as const satisfies Record<
    string,
    { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
  >;

  const fallback = {
    label: status,
    variant: "secondary" as React.ComponentProps<typeof Badge>["variant"],
  };
  const { label, variant } = MAP[status as keyof typeof MAP] ?? fallback;

  return (
    <Badge variant={variant} className="h-5 px-2 text-[10px]">
      {label}
    </Badge>
  );
}

export default MapPinTooltip;
