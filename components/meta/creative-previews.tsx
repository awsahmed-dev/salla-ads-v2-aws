"use client";

import type { MetaAd } from "@/lib/meta/campaign-types";
import { CTA_OPTIONS, type PreviewPlacement, PLACEMENT_SPECS } from "@/lib/meta/creative-constants";
import { cn } from "@/lib/utils";
import {
  ImagePlus,
  Heart,
  Share2,
  Smartphone,
  MessageCircle,
  ChevronRight,
  ChevronUp,
  Globe,
  Store,
  MoreHorizontal,
  ThumbsUp,
  Send,
  Bookmark,
  Music,
  ShoppingBag,
  Grid3X3,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

function getCtaLabel(ad: MetaAd) {
  return CTA_OPTIONS.find((c) => c.value === ad.callToAction)?.label || "Shop Now";
}

function hasMedia(ad: MetaAd) {
  return ad.assets.length > 0 && ad.assets[0]?.url;
}

function MediaRenderer({
  ad,
  className,
}: {
  ad: MetaAd;
  className?: string;
}) {
  if (!hasMedia(ad)) {
    return (
      <div className={cn("flex size-full flex-col items-center justify-center gap-2 text-muted-foreground", className)}>
        <ImagePlus className="size-10" />
        <span className="text-xs">Ad preview</span>
      </div>
    );
  }
  const asset = ad.assets[0];
  if (asset.type === "VIDEO") {
    return (
      <video src={asset.url} muted autoPlay loop playsInline className={cn("size-full object-cover", className)} />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={asset.url} alt="Ad creative" className={cn("size-full object-cover", className)} crossOrigin="anonymous" />;
}

/* ------------------------------------------------------------------ */
/*  Facebook Feed Preview                                              */
/* ------------------------------------------------------------------ */

export function FacebookFeedPreview({
  ad,
  pageName,
  isCatalog,
}: {
  ad: MetaAd;
  pageName: string;
  isCatalog?: boolean;
}) {
  const ctaLabel = getCtaLabel(ad);
  const isCarousel = ad.adFormat === "CAROUSEL";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Post header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="flex size-9 items-center justify-center rounded-full bg-[#1877F2]">
          <Store className="size-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">{pageName || "Your Store"}</p>
          <p className="text-[10px] text-muted-foreground">
            Sponsored &middot; <Globe className="mb-px inline size-2.5" />
          </p>
        </div>
        <MoreHorizontal className="size-4 text-muted-foreground" />
      </div>

      {/* Primary text */}
      <div className="px-3 pb-2">
        <p className="text-xs leading-relaxed text-foreground">
          {ad.primaryText || "Your primary text will appear here..."}
        </p>
      </div>

      {/* Media area */}
      {isCatalog ? (
        <CatalogProductGrid />
      ) : isCarousel && ad.carouselCards.length > 0 ? (
        <div className="flex gap-0.5 overflow-x-auto">
          {ad.carouselCards.map((card, ci) => (
            <div key={card.id} className="w-[65%] shrink-0 first:ml-0">
              <div className="aspect-square bg-muted">
                {card.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.imageUrl} alt={`Card ${ci + 1}`} className="size-full object-cover" crossOrigin="anonymous" />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ImagePlus className="size-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-border bg-muted/30 px-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold text-foreground">{card.headline || `Card ${ci + 1}`}</p>
                  {card.description && <p className="truncate text-[9px] text-muted-foreground">{card.description}</p>}
                </div>
                <div className="ml-2 shrink-0 rounded bg-muted px-2 py-1 text-[9px] font-semibold text-foreground">{ctaLabel}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative aspect-square bg-muted">
          <MediaRenderer ad={ad} />
        </div>
      )}

      {/* Link footer */}
      {!isCarousel && !isCatalog && (
        <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] uppercase text-muted-foreground">{ad.displayLink || ad.websiteUrl || "your-store.salla.sa"}</p>
            <p className="truncate text-xs font-semibold text-foreground">{ad.headline || "Your headline here"}</p>
            <p className="truncate text-[10px] text-muted-foreground">{ad.description || "Description text"}</p>
          </div>
          {ad.callToAction !== "NO_BUTTON" && (
            <div className="ml-2 shrink-0 rounded-md bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">{ctaLabel}</div>
          )}
        </div>
      )}

      {/* Engagement bar */}
      <div className="flex items-center justify-around border-t border-border px-3 py-2">
        <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground"><ThumbsUp className="size-3.5" /> Like</button>
        <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground"><MessageCircle className="size-3.5" /> Comment</button>
        <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground"><Send className="size-3.5" /> Send</button>
        <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground"><Share2 className="size-3.5" /> Share</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Instagram Feed Preview                                             */
/* ------------------------------------------------------------------ */

export function InstagramFeedPreview({
  ad,
  accountName,
  isCatalog,
}: {
  ad: MetaAd;
  accountName: string;
  isCatalog?: boolean;
}) {
  const ctaLabel = getCtaLabel(ad);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#dc2743]">
          <Store className="size-3.5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">{accountName || "yourstore"}</p>
          <p className="text-[10px] text-muted-foreground">Sponsored</p>
        </div>
        <MoreHorizontal className="size-4 text-muted-foreground" />
      </div>

      <div className="relative aspect-square bg-muted">
        {isCatalog ? <CatalogProductGrid /> : <MediaRenderer ad={ad} />}
      </div>

      {ad.callToAction !== "NO_BUTTON" && (
        <div className="flex items-center justify-between border-y border-border bg-muted/30 px-3 py-2">
          <span className="text-[11px] font-semibold text-[#1877F2]">{ctaLabel}</span>
          <ChevronRight className="size-3.5 text-[#1877F2]" />
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <Heart className="size-4 text-foreground" />
          <MessageCircle className="size-4 text-foreground" />
          <Send className="size-4 text-foreground" />
        </div>
        <Bookmark className="size-4 text-foreground" />
      </div>

      <div className="px-3 pb-2.5">
        <p className="text-xs leading-relaxed text-foreground">
          <span className="font-semibold">{accountName || "yourstore"}</span>{" "}
          {ad.primaryText || "Your caption will appear here..."}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reels / Stories Preview (9:16 phone frame)                         */
/* ------------------------------------------------------------------ */

export function ReelsStoriesPreview({
  ad,
  placement,
  pageName,
  accountName,
  isCatalog,
}: {
  ad: MetaAd;
  placement: PreviewPlacement;
  pageName: string;
  accountName: string;
  isCatalog?: boolean;
}) {
  const ctaLabel = getCtaLabel(ad);
  const isIG = placement.startsWith("INSTAGRAM");
  const isReels = placement.includes("REELS");
  const name = isIG ? accountName || "yourstore" : pageName || "Your Store";

  return (
    <div className="mx-auto w-[220px]">
      <div className="relative overflow-hidden rounded-[24px] border-2 border-foreground/20 bg-black shadow-lg">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1.5">
          <span className="text-[9px] font-medium text-white/80">9:41</span>
          <div className="flex items-center gap-1">
            <div className="h-2 w-3 rounded-sm border border-white/60" />
          </div>
        </div>

        {/* 9:16 content */}
        <div className="relative aspect-[9/16] bg-muted/20">
          {isCatalog ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-muted/40 to-muted/80">
              <ShoppingBag className="size-8 text-muted-foreground/40" />
              <span className="text-[10px] text-muted-foreground/60">Catalog Ad</span>
            </div>
          ) : hasMedia(ad) ? (
            ad.assets[0].type === "VIDEO" ? (
              <video src={ad.assets[0].url} muted autoPlay loop playsInline className="absolute inset-0 size-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.assets[0].url} alt="Ad creative" className="absolute inset-0 size-full object-cover" crossOrigin="anonymous" />
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-muted/40 to-muted/80">
              <Smartphone className="size-8 text-muted-foreground/40" />
              <span className="text-[10px] text-muted-foreground/60">9:16 Preview</span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {!isReels && (
            <div className="absolute inset-x-0 top-0 px-3 pt-2">
              <div className="h-0.5 w-full rounded-full bg-white/30">
                <div className="h-full w-1/3 rounded-full bg-white" />
              </div>
            </div>
          )}

          {isReels && (
            <div className="absolute bottom-20 right-2 flex flex-col items-center gap-3.5">
              <div className="flex flex-col items-center gap-0.5">
                <Heart className="size-5 text-white" />
                <span className="text-[8px] text-white/80">12.3K</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <MessageCircle className="size-5 text-white" />
                <span className="text-[8px] text-white/80">234</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Send className="size-5 text-white" />
                <span className="text-[8px] text-white/80">Share</span>
              </div>
              <MoreHorizontal className="size-5 text-white" />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className={cn("flex size-7 items-center justify-center rounded-full", isIG ? "bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#dc2743]" : "bg-[#1877F2]")}>
                <Store className="size-3 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-white">{name}</p>
                <p className="text-[8px] text-white/60">Sponsored</p>
              </div>
            </div>
            {ad.primaryText && <p className="mb-2 line-clamp-2 text-[10px] leading-relaxed text-white/90">{ad.primaryText}</p>}
            {ad.callToAction !== "NO_BUTTON" && (
              <button type="button" className="flex w-full items-center justify-center gap-1 rounded-lg bg-white py-2 text-[11px] font-semibold text-black">
                {ctaLabel}
                <ChevronUp className="size-3" />
              </button>
            )}
            {isReels && (
              <div className="mt-2 flex items-center gap-1.5">
                <Music className="size-3 text-white/60" />
                <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-white/60" />
                </div>
              </div>
            )}
          </div>

          {isReels && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[35%] border-t border-dashed border-amber-400/30">
              <span className="absolute right-1 top-0.5 rounded bg-amber-500/20 px-1 py-0.5 text-[7px] text-amber-300">Safe zone</span>
            </div>
          )}
        </div>

        <div className="flex justify-center py-1.5">
          <div className="h-1 w-8 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Catalog Product Grid (used inside feed previews for DYNAMIC)       */
/* ------------------------------------------------------------------ */

function CatalogProductGrid() {
  const products = [
    { name: "Product 1", price: "SAR 149" },
    { name: "Product 2", price: "SAR 89" },
    { name: "Product 3", price: "SAR 199" },
    { name: "Product 4", price: "SAR 129" },
  ];

  return (
    <div className="bg-muted/30">
      {/* Hero area */}
      <div className="relative aspect-video bg-gradient-to-br from-muted/60 to-muted">
        <div className="flex size-full flex-col items-center justify-center gap-1.5">
          <ShoppingBag className="size-8 text-muted-foreground/30" />
          <span className="text-[10px] font-medium text-muted-foreground/50">Catalog Cover</span>
        </div>
        <div className="absolute left-2 top-2">
          <div className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5">
            <Grid3X3 className="size-2.5 text-white/80" />
            <span className="text-[8px] text-white/80">Collection</span>
          </div>
        </div>
      </div>
      {/* Product grid */}
      <div className="grid grid-cols-4 gap-px bg-border">
        {products.map((p, i) => (
          <div key={i} className="flex flex-col bg-card">
            <div className="aspect-square bg-gradient-to-br from-muted/40 to-muted/80">
              <div className="flex size-full items-center justify-center">
                <ShoppingBag className="size-4 text-muted-foreground/20" />
              </div>
            </div>
            <div className="px-1 py-1.5">
              <p className="truncate text-[8px] text-muted-foreground">{p.name}</p>
              <p className="text-[9px] font-semibold text-foreground">{p.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
