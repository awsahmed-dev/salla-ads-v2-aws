import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { MetaAdFormat, MetaAd, MetaCarouselCard } from "@/lib/meta/campaign-types";
import { Image as ImageIcon, Video, Film, Layers, Wand2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  UI helpers                                                         */
/* ------------------------------------------------------------------ */

export function CharCounter({
  current,
  min,
  max,
}: {
  current: number;
  min?: number;
  max: number;
}) {
  const over = current > max;
  const under = min != null && current > 0 && current < min;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        over
          ? "font-medium text-destructive"
          : under
            ? "font-medium text-amber-600"
            : "text-muted-foreground"
      )}
    >
      {current}/{max}
    </span>
  );
}

export function ApiBadge({ field }: { field: string }) {
  return (
    <Badge
      variant="secondary"
      className="rounded-full px-1 py-0 font-mono text-[8px]"
    >
      {field}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Data factories                                                     */
/* ------------------------------------------------------------------ */

export function makeCarouselCard(index: number): MetaCarouselCard {
  return {
    id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${index}`,
    imageUrl: "",
    headline: "",
    description: "",
    link: "",
  };
}

export function makeDefaultAd(format: MetaAdFormat, index: number): MetaAd {
  return {
    id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: `Ad ${index + 1}`,
    adFormat: format,
    assets: [],
    carouselCards:
      format === "CAROUSEL"
        ? [makeCarouselCard(0), makeCarouselCard(1)]
        : [],
    primaryText: "",
    headline: "",
    description: "",
    websiteUrl: "",
    displayLink: "",
    callToAction: "SHOP_NOW",
    utmSource: "facebook",
    utmMedium: "paid",
    utmCampaign: "",
    urlParameters: "",
  };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export const FORMAT_ICONS: Record<MetaAdFormat, React.ReactNode> = {
  SINGLE_IMAGE: <ImageIcon className="size-5" />,
  SINGLE_VIDEO: <Video className="size-5" />,
  CAROUSEL: <Film className="size-5" />,
  COLLECTION: <Layers className="size-5" />,
  DYNAMIC: <Wand2 className="size-5" />,
};

