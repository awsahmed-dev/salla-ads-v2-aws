"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTikTokCampaign } from "@/lib/tiktok/campaign-context";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { ProductPickerDialog, type SallaProduct } from "@/components/shared/product-picker";
import { PREVIEW_PRODUCTS } from "@/lib/salla/store-api";
import {
  ImagePlus,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  User,
  LayoutGrid,
  Layers,
  Copy,
  Video,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Film,
  Link2,
  CheckCircle2,
  X,
  Heart,
  Share2,
  Pencil,
  Wifi,
  Signal,
  Smartphone,
  Music,
  MessageCircle,
  Bookmark,
  Tag,
  Store,
  Zap,
  Package,
  ShoppingBag,
  Check,
  GripVertical,
  Download,
  ClipboardList,
  MessageSquare,
  Lock,
  Globe,
  FileText,
  Radio,
  Info,
  Eye,
  Shield,
  Settings2,
} from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
import { UploadZone } from "@/components/shared/upload-zone";
import { LinkTypeSection } from "@/components/shared/link-type-section";
import { MusicLibrarySheet } from "@/components/shared/music-library-sheet";
import type {
  TikTokAdFormat,
  TikTokCTA,
  TikTokAd,
  CreativeAsset,
  CarouselCard,
} from "@/lib/tiktok/campaign-types";
import {
  OBJECTIVE_CONFIGS,
  type InstantFormQuestion,
  type InstantFormQuestionType,
  type PersonalInfoField,
  type InstantFormConfig,
  type LeadOptimizationLocation,
} from "@/lib/tiktok/campaign-types";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const AD_FORMAT_OPTIONS: {
  value: TikTokAdFormat;
  label: string;
  desc: string;
  icon: React.ReactNode;
  recommended?: boolean;
}[] = [
  {
    value: "SINGLE_VIDEO",
    label: "Single Video",
    desc: "Full-screen vertical video ad. 9:16 recommended. Best performing format on TikTok.",
    icon: <Video className="size-5" />,
    recommended: true,
  },
  {
    value: "SINGLE_IMAGE",
    label: "Single Image",
    desc: "Static image ad. Supports 9:16, 1:1, or 16:9 aspect ratios.",
    icon: <ImageIcon className="size-5" />,
  },
  {
    value: "CAROUSEL",
    label: "Carousel",
    desc: "2-35 swipeable image cards. Great for showcasing multiple products.",
    icon: <Film className="size-5" />,
  },
  {
    value: "SPARK_AD",
    label: "Spark Ad",
    desc: "Promote an existing organic TikTok post via authorization code (tiktok_item_id).",
    icon: <Sparkles className="size-5" />,
  },
];

/** Maps to TikTok API call_to_action field */
const CTA_OPTIONS: { value: TikTokCTA; label: string }[] = [
  { value: "SHOP_NOW", label: "Shop Now" },
  { value: "BUY_NOW", label: "Buy Now" },
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "ORDER_NOW", label: "Order Now" },
  { value: "GET_OFFER", label: "Get Offer" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "CONTACT_US", label: "Contact Us" },
  { value: "SUBSCRIBE", label: "Subscribe" },
  { value: "DOWNLOAD", label: "Download" },
  { value: "VIEW_NOW", label: "View Now" },
  { value: "APPLY_NOW", label: "Apply Now" },
  { value: "BOOK_NOW", label: "Book Now" },
  { value: "GET_QUOTE", label: "Get Quote" },
];

const RECOMMENDED_CTAS = CTA_OPTIONS.filter((c) =>
  ["SHOP_NOW", "BUY_NOW", "ORDER_NOW", "LEARN_MORE", "SIGN_UP"].includes(c.value)
);
const OTHER_CTAS = CTA_OPTIONS.filter((c) =>
  !["SHOP_NOW", "BUY_NOW", "ORDER_NOW", "LEARN_MORE", "SIGN_UP"].includes(c.value)
);

const MEDIA_SPECS = {
  IMAGE: { maxSize: 100 * 1024 * 1024, dimLabel: "1080 x 1920 px (9:16)" },
  VIDEO: { maxSize: 500 * 1024 * 1024, dimLabel: "1080 x 1920 px (9:16)" },
  CAROUSEL_IMAGE: { maxSize: 5 * 1024 * 1024, suggestedSize: 100 * 1024, dimLabel: "640 x 640 / 1200 x 628 / 720 x 1280" },
  MUSIC: { maxSize: 10 * 1024 * 1024, minDuration: 2 },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function CharCounter({ current, max }: { current: number; max: number }) {
  const over = current > max;
  return <span className={cn("text-xs tabular-nums", over ? "font-medium text-destructive" : "text-muted-foreground")}>{current}/{max}</span>;
}

function makeDefaultAd(format: TikTokAdFormat, index: number, defaultCTA: TikTokCTA = "SHOP_NOW"): TikTokAd {
  return {
    id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: `Ad ${index + 1}`,
    adFormat: format,
    assets: [],
    carouselCards: [],
    adText: "",
    displayName: "",
    callToAction: defaultCTA,
    landingPageUrl: "",
    sparkAdEnabled: format === "SPARK_AD",
    sparkAdAuthCode: "",
    promotionalMusicDisabled: format !== "CAROUSEL",
    instantProductPageUsed: false,
  };
}

function makeCarouselCard(): CarouselCard {
  return {
    id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    imageUrl: "",
  };
}

function getFormatLabel(format: TikTokAdFormat): string {
  return AD_FORMAT_OPTIONS.find((o) => o.value === format)?.label ?? format;
}

/* ------------------------------------------------------------------ */
/*  TikTok Campaign Readiness (matches Snapchat pattern)               */
/* ------------------------------------------------------------------ */

function ReadinessRing({ percent }: { percent: number }) {
  const color = percent >= 90 ? "#059669" : percent >= 60 ? "#004956" : percent >= 30 ? "#d97706" : "#ef4444";
  return (
    <div className="relative flex size-11 items-center justify-center">
      <svg className="size-11 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#eee" strokeWidth="3.5" />
        <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(percent / 100) * 113} 113`} className="transition-all duration-500" />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color }}>{percent}%</span>
    </div>
  );
}

function TikTokCampaignReadiness({
  ads,
  totalCreatives,
  allChecks,
  passingChecks,
  isCatalogListing,
  objective,
}: {
  ads: TikTokAd[];
  totalCreatives: number;
  allChecks: { label: string; ok: boolean }[];
  passingChecks: number;
  isCatalogListing: boolean;
  objective: string;
}) {
  const [showAllChecks, setShowAllChecks] = useState(false);
  const failingChecks = allChecks.filter((c) => !c.ok);
  const allPassed = passingChecks === allChecks.length && allChecks.length > 0;

  /* ── Best-practice signals ── */
  const hasMultipleAds = ads.length >= 2;
  const hasVideoAd = isCatalogListing || ads.some((a) => a.adFormat === "SINGLE_VIDEO" || a.adFormat === "SPARK_AD");
  const hasImageAd = isCatalogListing || ads.some((a) => a.adFormat === "SINGLE_IMAGE" || a.adFormat === "CAROUSEL");
  const hasBothMediaTypes = hasVideoAd && hasImageAd;

  const bestPractices: { label: string; met: boolean; tip: string; metTip: string }[] = [];

  if (!isCatalogListing) {
    bestPractices.push({
      label: "Multiple ads",
      met: hasMultipleAds,
      tip: objective === "PRODUCT_SALES"
        ? "Each ad supports one creative — add 2+ ads with different visuals or formats to find the best-performing sales driver"
        : objective === "LEAD_GENERATION"
          ? "Each ad supports one creative — add multiple ads to test different lead form approaches"
          : "Each ad supports one creative — add 2+ ads to test different formats and creatives",
      metTip: `${ads.length} ads — great for A/B testing`,
    });
  }

  if (!isCatalogListing) {
    bestPractices.push({
      label: "Video + Image ads",
      met: hasBothMediaTypes,
      tip: objective === "VIDEO_VIEWS"
        ? "Create one video ad and one image ad — video gets 3x more engagement, images provide broader reach"
        : "Create both a video ad and an image ad — video drives engagement while images extend your reach",
      metTip: "Both video and image ads included",
    });
  }

  const bpMet = bestPractices.filter((bp) => bp.met).length;
  const bpTotal = bestPractices.length;

  const totalWeight = allChecks.length + bpTotal;
  const totalScore = passingChecks + bpMet;
  const overallPercent = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  return (
    <div className="rounded-xl bg-card p-6">
      {/* ── Header with progress ring ── */}
      <div className="mb-6 flex items-center gap-4">
        <ReadinessRing percent={overallPercent} />
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Campaign Readiness</p>
          <p className="text-xs text-muted-foreground">
            {allPassed
              ? "All requirements met"
              : `${failingChecks.length} required items need attention before launch`
            }
          </p>
        </div>
      </div>

      {/* ── Required Steps ── */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Required Steps</p>
          <span className="text-xs font-bold text-[#004956]">{passingChecks}/{allChecks.length}</span>
        </div>
        <div className="flex flex-col gap-3">
          {allChecks.slice(0, showAllChecks ? allChecks.length : 6).map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-3">
              <div className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                c.ok ? "border-[#004956] bg-[#004956]" : "border-muted-foreground/30"
              )}>
                {c.ok && <Check className="size-3 text-white" strokeWidth={3} />}
              </div>
              <p className={cn("text-xs font-medium", c.ok ? "text-muted-foreground line-through" : "text-foreground")}>
                {c.label}
              </p>
            </div>
          ))}
          {!showAllChecks && allChecks.length > 6 && (
            <button type="button" onClick={() => setShowAllChecks(true)} className="text-xs text-[#004956] underline px-3">
              Show all {allChecks.length} items
            </button>
          )}
        </div>
      </div>

      {/* ── Best Practices ── */}
      {bpTotal > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Best Practices</p>
            <span className="text-xs font-bold text-[#004956]">{bpMet}/{bpTotal}</span>
          </div>
          <div className="flex flex-col gap-3">
            {bestPractices.map((bp, i) => (
              <div
                key={i}
                className={cn("flex items-start gap-3 rounded-lg px-3 py-3", bp.met && "bg-[#e6fff9]")}
              >
                <div className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5",
                  bp.met ? "border-[#004956] bg-[#004956]" : "border-muted-foreground/30"
                )}>
                  {bp.met && <Check className="size-3 text-white" strokeWidth={3} />}
                </div>
                <div>
                  <p className={cn("text-xs font-bold", bp.met ? "text-[#004956]" : "text-foreground")}>{bp.label}</p>
                  <p className="text-xs text-muted-foreground">{bp.met ? bp.metTip : bp.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TikTok Ad Preview (pixel-perfect phone mockup)                     */
/* ------------------------------------------------------------------ */

function TikTokAdPreview({
  ads,
  activeAdIdx,
  setActiveAdIdx,
  activeAd,
  identityDisplayName,
  identityAvatarUrl,
}: {
  ads: TikTokAd[];
  activeAdIdx: number;
  setActiveAdIdx: (i: number) => void;
  activeAd: TikTokAd | null;
  identityDisplayName: string;
  identityAvatarUrl: string;
}) {
  const [showSafeZone, setShowSafeZone] = useState(false);
  const displayName = activeAd?.displayName || identityDisplayName || "Brand Name";
  const adText = activeAd?.adText || "";
  const hasMedia = activeAd && activeAd.assets.length > 0 && activeAd.assets[0]?.url;
  const ctaLabel = activeAd
    ? (CTA_OPTIONS.find((c) => c.value === activeAd.callToAction)?.label || "Shop Now")
    : "Shop Now";
  const landingUrl = activeAd?.landingPageUrl || "yourstore.salla.sa";
  const isSpark = activeAd?.adFormat === "SPARK_AD";
  const isCarousel = activeAd?.adFormat === "CAROUSEL";

  return (
    <SectionCard className="p-4">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="size-4 text-primary" />
          <Label className="text-sm font-semibold text-foreground">Ad Preview</Label>
        </div>
        {ads.length > 1 && (
          <div className="flex items-center gap-1">
            {ads.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveAdIdx(i)}
                className={cn("size-2 rounded-full transition-colors", i === activeAdIdx ? "bg-primary" : "bg-muted-foreground/30")}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---- PHONE FRAME ---- */}
      <div className="relative mx-auto w-[232px] overflow-hidden rounded-[2.2rem] border-[3px] border-foreground/10 bg-black shadow-xl">
        {/* Notch / Dynamic Island */}
        <div className="absolute left-1/2 top-1 z-30 h-[14px] w-20 -translate-x-1/2 rounded-full bg-black" />

        <div className="relative flex flex-col" style={{ height: "502px" }}>

          {/* ---- iOS Status Bar ---- */}
          <div className="relative z-20 flex items-center justify-between px-5 pb-0.5 pt-5">
            <span className="text-[8px] font-semibold text-white">9:41</span>
            <div className="flex items-center gap-1">
              <Signal className="size-2.5 text-white/70" />
              <Wifi className="size-2.5 text-white/70" />
              <div className="h-[7px] w-[16px] rounded-[2px] border border-white/50">
                <div className="h-full w-3/4 rounded-[1px] bg-white/70" />
              </div>
            </div>
          </div>

          {/* ---- Full-screen Creative Area ---- */}
          <div className="absolute inset-0 z-0">
            {isCarousel && activeAd?.carouselCards && activeAd.carouselCards.length > 0 ? (
              <div className="flex size-full flex-col bg-black">
                <div className="flex items-center gap-1.5 bg-gradient-to-b from-black/90 to-transparent px-3 pb-6 pt-16">
                  <Film className="size-3 text-primary" />
                  <span className="text-[8px] font-semibold text-primary">Carousel Ad</span>
                </div>
                <div className="flex-1 px-2 pb-28">
                  <div className="grid h-full grid-cols-2 gap-[3px]">
                    {activeAd.carouselCards.slice(0, 4).map((card, ci) => (
                      <div key={card.id} className="relative overflow-hidden rounded-md bg-zinc-900">
                        {card.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={card.imageUrl} alt={`Card ${ci + 1}`} className="aspect-[3/4] w-full object-cover" crossOrigin="anonymous" />
                        ) : (
                          <div className="flex aspect-[3/4] w-full items-center justify-center bg-zinc-800">
                            <ImageIcon className="size-4 text-white/20" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : hasMedia ? (
              <>
                {activeAd!.assets[0].type === "VIDEO" ? (
                  <video src={activeAd!.assets[0].url} muted autoPlay loop playsInline className="size-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeAd!.assets[0].url} alt="Ad preview" className="size-full object-cover" crossOrigin="anonymous" />
                )}
              </>
            ) : isSpark && activeAd?.sparkAdAuthCode ? (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
                <div className="flex flex-col items-center gap-1">
                  <Sparkles className="size-6 text-primary" />
                  <p className="text-[9px] font-medium text-primary">Spark Ad</p>
                </div>
              </div>
            ) : (
              <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                <div className="rounded-full bg-white/5 p-4">
                  <ImagePlus className="size-6 text-white/20" />
                </div>
                <p className="mt-2 text-[9px] text-white/25">Upload media to preview</p>
              </div>
            )}
          </div>

          {/* ---- Content Safe Zone Overlay ---- */}
          {showSafeZone && (
            <div className="pointer-events-none absolute inset-0 z-10">
              <div className="absolute inset-x-0 top-0 bg-red-500/25" style={{ height: "60px" }} />
              <div className="absolute inset-x-0 bottom-0 bg-red-500/25" style={{ height: "150px" }} />
              <div
                className="absolute inset-x-3 border-2 border-red-400/70"
                style={{ top: "60px", bottom: "150px" }}
              />
            </div>
          )}

          {/* ---- Format Badge ---- */}
          <div className="absolute right-3 top-16 z-20">
            {isSpark && (
              <Badge className="border-0 bg-primary/70 text-[7px] text-white backdrop-blur-sm">Spark Ad</Badge>
            )}
            {isCarousel && (
              <Badge className="border-0 bg-primary/70 text-[7px] text-white backdrop-blur-sm">Carousel</Badge>
            )}
          </div>

          {/* Sponsored label */}
          <div className="absolute left-3 top-[52px] z-20">
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[7px] font-medium text-white/90 backdrop-blur-sm">
              Sponsored
            </span>
          </div>

          {/* ---- Right-side action buttons (TikTok style) ---- */}
          <div className="absolute bottom-[120px] right-2.5 z-20 flex flex-col items-center gap-3">
            {/* Profile pic */}
            <div className="relative">
              {identityAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={identityAvatarUrl} alt="Avatar" className="size-8 rounded-full border-[1.5px] border-white object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full border-[1.5px] border-white bg-gradient-to-br from-primary to-primary/60">
                  <span className="text-[7px] font-bold text-white">{(displayName || "B").charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="absolute -bottom-1 left-1/2 flex size-3.5 -translate-x-1/2 items-center justify-center rounded-full bg-[#fe2c55]">
                <Plus className="size-2 text-white" />
              </div>
            </div>
            {/* Like */}
            <div className="flex flex-col items-center">
              <Heart className="size-5 text-white" />
              <span className="mt-0.5 text-[7px] text-white/80">2.4K</span>
            </div>
            {/* Comment */}
            <div className="flex flex-col items-center">
              <MessageCircle className="size-5 text-white" />
              <span className="mt-0.5 text-[7px] text-white/80">148</span>
            </div>
            {/* Bookmark */}
            <div className="flex flex-col items-center">
              <Bookmark className="size-5 text-white" />
              <span className="mt-0.5 text-[7px] text-white/80">Save</span>
            </div>
            {/* Share */}
            <div className="flex flex-col items-center">
              <Share2 className="size-5 text-white" />
              <span className="mt-0.5 text-[7px] text-white/80">Share</span>
            </div>
            {/* Music disc */}
            <div className="size-6 animate-[spin_3s_linear_infinite] rounded-full border border-white/30 bg-zinc-800">
              <div className="flex h-full items-center justify-center">
                <Music className="size-2.5 text-white/60" />
              </div>
            </div>
          </div>

          {/* ---- Bottom Section ---- */}
          <div className="relative z-20 mt-auto">
            <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div className="relative px-3 pb-3">
              {/* Display name */}
              <p className="text-[9px] font-bold text-white">
                @{displayName.replace(/\s/g, "").toLowerCase() || "your_brand"}
              </p>
              {/* Ad text */}
              {adText && (
                <p className="mt-0.5 line-clamp-2 text-[8px] leading-relaxed text-white/90">
                  {adText}
                </p>
              )}
              {/* CTA button + URL */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="rounded-sm bg-[#fe2c55] px-2.5 py-1">
                  <span className="text-[8px] font-semibold text-white">{ctaLabel}</span>
                </div>
                <div className="flex-1 truncate rounded-sm bg-white/15 px-2 py-1">
                  <span className="truncate text-[7px] text-white/70">{landingUrl}</span>
                </div>
              </div>
            </div>

            {/* Bottom nav */}
            <div className="flex items-center justify-around border-t border-white/10 bg-black/90 py-1.5 backdrop-blur-sm">
              <span className="text-[8px] font-semibold text-white">Home</span>
              <span className="text-[8px] text-white/40">Shop</span>
              <div className="flex size-5 items-center justify-center rounded bg-white">
                <Plus className="size-3 text-black" />
              </div>
              <span className="text-[8px] text-white/40">Inbox</span>
              <span className="text-[8px] text-white/40">Profile</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Controls below phone ---- */}
      <div className="mt-3 flex flex-col gap-2">
        {activeAd && (
          <p className="text-center text-xs text-muted-foreground">
            Previewing: <span className="font-medium text-foreground">{activeAd.name}</span>
          </p>
        )}

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setShowSafeZone(!showSafeZone)}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors",
              showSafeZone
                ? "border-emerald-500 bg-emerald-500"
                : "border-muted-foreground/25 bg-muted-foreground/15"
            )}
          >
            <span className={cn(
              "pointer-events-none inline-block size-3.5 transform rounded-full bg-white shadow-sm transition-transform",
              showSafeZone ? "translate-x-[17px]" : "translate-x-[2px]"
            )} />
          </button>
          <span className="text-sm font-medium text-foreground">Show content safe zone</span>
          <InfoTip text="The safe zone shows where your creative content is fully visible without being covered by TikTok UI elements (username, CTA, right-side actions)." />
        </div>
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Ad Panel (expandable, matches Snap AdGroupPanel)                   */
/* ------------------------------------------------------------------ */

function AdPanel({
  ad,
  adIndex,
  totalAds,
  isActive,
  onSelect,
  onUpdate,
  onRemove,
  onDuplicate,
  allowedFormats,
  isLeadGen,
  isVideoViews,
  isAppPromo,
}: {
  ad: TikTokAd;
  allowedFormats: TikTokAdFormat[];
  adIndex: number;
  totalAds: number;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (next: TikTokAd) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  isLeadGen: boolean;
  isVideoViews: boolean;
  isAppPromo: boolean;
}) {
  const [editingName, setEditingName] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [musicSheetOpen, setMusicSheetOpen] = useState(false);
  const handleMusicSelect = useCallback(
    (music: { url: string; file?: File; name: string; musicId?: string }) => {
      onUpdate({
        ...ad,
        musicFile: music.file,
        musicUrl: music.url,
        musicId: music.musicId || "",
        musicName: music.name,
        promotionalMusicDisabled: false,
      });
    },
    [ad, onUpdate]
  );
  const handleMusicClear = useCallback(() => {
    onUpdate({
      ...ad,
      musicFile: undefined,
      musicUrl: "",
      musicId: "",
      musicName: "",
    });
  }, [ad, onUpdate]);
  const musicDisplayName =
    ad.musicFile?.name || ad.musicName || (ad.musicId ? "Library track" : "");
  const musicSizeLabel = ad.musicFile
    ? `${(ad.musicFile.size / 1024).toFixed(0)} KB`
    : ad.musicId
      ? "TikTok CML"
      : "";
  const hasMusic = Boolean(ad.musicFile || ad.musicUrl || ad.musicId);
  const isSpark = ad.adFormat === "SPARK_AD";
  const isCarousel = ad.adFormat === "CAROUSEL";
  const assetCount = ad.assets.length;
  const cardCount = ad.carouselCards.length;

  const handleFile = useCallback(
    (file: File) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      // Enforce format-specific file type
      if (ad.adFormat === "SINGLE_VIDEO" && !isVideo) {
        alert("Single Video ads require a video file (MP4 or MOV).");
        return;
      }
      if (ad.adFormat === "SINGLE_IMAGE" && !isImage) {
        alert("Single Image ads require an image file (PNG or JPG).");
        return;
      }
      if (!isVideo && !isImage) {
        alert("Unsupported file type. Please upload PNG, JPG, MP4, or MOV.");
        return;
      }

      const type = isVideo ? "VIDEO" : "IMAGE";
      const maxSize = isVideo ? MEDIA_SPECS.VIDEO.maxSize : MEDIA_SPECS.IMAGE.maxSize;
      if (file.size > maxSize) {
        alert(`File too large. Max ${(maxSize / 1024 / 1024).toFixed(0)}MB for ${type.toLowerCase()}.`);
        return;
      }
      const asset: CreativeAsset = {
        id: `asset_${Date.now()}`,
        type: type as "VIDEO" | "IMAGE",
        url: URL.createObjectURL(file),
        file,
      };
      onUpdate({ ...ad, assets: [asset] });
    },
    [ad, onUpdate]
  );

  const handleCarouselFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Carousel cards must be images (JPG, PNG).");
        return;
      }
      const card: CarouselCard = {
        id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        imageUrl: URL.createObjectURL(file),
        file,
      };
      onUpdate({ ...ad, carouselCards: [...ad.carouselCards, card] });
    },
    [ad, onUpdate]
  );

  const changeFormat = (val: TikTokAdFormat) => {
    const keepMusic = val === "CAROUSEL";
    onUpdate({
      ...ad,
      adFormat: val,
      sparkAdEnabled: val === "SPARK_AD",
      assets: val !== ad.adFormat ? [] : ad.assets,
      carouselCards: val === "CAROUSEL" ? ad.carouselCards : [],
      sparkAdAuthCode: val === "SPARK_AD" ? ad.sparkAdAuthCode : "",
      // Reset all music fields together when leaving Carousel so no stale
      // musicId/musicName leaks into the payload on a follow-up format switch.
      musicFile: keepMusic ? ad.musicFile : undefined,
      musicUrl: keepMusic ? ad.musicUrl : "",
      musicId: keepMusic ? ad.musicId : "",
      musicName: keepMusic ? ad.musicName : "",
      // Carousel: music enabled by default (required). Others: disabled by default (optional).
      promotionalMusicDisabled: val !== "CAROUSEL",
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-all",
        isActive ? "border-primary shadow-md" : "border-border"
      )}
    >
      {/* ---- Ad Header ---- */}
      <div
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-t-xl px-4 py-3",
          isActive ? "bg-primary/5" : "bg-muted/30 hover:bg-muted/50"
        )}
        onClick={onSelect}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
          {adIndex + 1}
        </div>
        <div className="flex-1">
          {editingName ? (
            <Input
              autoFocus
              value={ad.name}
              onChange={(e) => onUpdate({ ...ad, name: e.target.value })}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              className="h-7 w-48 text-sm font-semibold"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{ad.name || `Ad ${adIndex + 1}`}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setEditingName(true); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="size-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isSpark ? (
              <>
                <Badge variant="secondary" className="rounded-full bg-primary/10 px-1.5 py-0 text-xs font-semibold text-primary">Spark Ad</Badge>
                <span>{ad.sparkAdAuthCode ? "Authorized" : "Pending auth"}</span>
              </>
            ) : (
              <>
                <span>{getFormatLabel(ad.adFormat)}</span>
                <span>{"--"}</span>
                <span>{isCarousel ? `${cardCount} card${cardCount !== 1 ? "s" : ""}${ad.musicFile ? " + music" : ""}` : `${assetCount} creative${assetCount !== 1 ? "s" : ""}`}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onDuplicate} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Duplicate ad">
            <Copy className="size-3.5" />
          </button>
          {totalAds > 1 && (
            <button type="button" onClick={onRemove} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Remove ad">
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ---- Expanded Content ---- */}
      {isActive && (
        <div className="flex flex-col gap-4 p-4">
          {/* Format picker */}
          <div>
            <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              Ad Format
              <InfoTip text="TikTok API ad_format field. SINGLE_VIDEO is recommended for best results. Spark Ads promote existing posts via tiktok_item_id." />
            </Label>
  <div className="grid gap-2 sm:grid-cols-2">
  {AD_FORMAT_OPTIONS.filter((opt) => allowedFormats.includes(opt.value)).map((opt) => (
  <button
  key={opt.value}
  type="button"
  onClick={() => changeFormat(opt.value)}
  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-all",
                    ad.adFormat === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cn(ad.adFormat === opt.value ? "text-primary" : "text-muted-foreground")}>{opt.icon}</span>
                    <span className={cn("text-xs font-medium", ad.adFormat === opt.value ? "text-primary" : "text-foreground")}>{opt.label}</span>
                    {opt.recommended && <Badge variant="secondary" className="ml-auto rounded-full px-1 py-0 text-[7px]">Best</Badge>}
                  </div>
                  <p className="text-xs leading-snug text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Video Views: video-only notice */}
          {isVideoViews && (
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Video Views campaigns</span> only support video formats (Single Video and Spark Ads). Upload engaging vertical videos (9:16) to maximize view completion rates.
              </p>
            </div>
          )}

          {/* ===== FORMAT-SPECIFIC CREATIVE SECTIONS ===== */}

          {/* ---- SPARK AD ---- */}
          {isSpark && (
            <div className="flex flex-col gap-0">

              {/* ── Section 1: Authorization Code ── */}
              <div className="flex flex-col gap-4 px-3 py-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-primary" />
                    <Label className="text-sm font-medium text-foreground">Spark Ad Code</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Promote an existing TikTok post. Paste the authorization code from the post owner below.
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste authorization code or post URL..."
                      value={ad.sparkAdAuthCode}
                      onChange={(e) => onUpdate({ ...ad, sparkAdAuthCode: e.target.value })}
                      className="h-10 flex-1 font-mono text-sm"
                    />
                  </div>
                  {!ad.sparkAdAuthCode && (
                    <p className="text-[10px] text-muted-foreground">The creator shares this code from their TikTok app. Private posts become public during promotion.</p>
                  )}
                </div>

                {/* Warning: not yet entered */}
                {!ad.sparkAdAuthCode && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
                    <AlertCircle className="size-3 shrink-0 text-amber-600" />
                    <span className="text-xs text-amber-700">Enter the authorization code to link this Spark Ad to a TikTok post</span>
                  </div>
                )}

                {/* Success: code entered */}
                {ad.sparkAdAuthCode && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                      <p className="text-xs font-medium text-emerald-800">Authorization code linked</p>
                    </div>
                    <p className="mt-1 pl-5.5 text-[10px] text-emerald-600">
                      The post&apos;s video, caption, profile, and music will be used in your ad.
                    </p>
                  </div>
                )}
              </div>

              {/* ── Section 2: Link Type + CTA ── */}
              <div className="border-t border-border px-3 py-3">
                <LinkTypeSection
                  url={ad.landingPageUrl}
                  onUrlChange={(url) => onUpdate({ ...ad, landingPageUrl: url })}
                  cta={ad.callToAction}
                  onCtaChange={(v) => onUpdate({ ...ad, callToAction: v as TikTokCTA })}
                  recommendedCtas={RECOMMENDED_CTAS}
                  otherCtas={OTHER_CTAS}
                />
              </div>

              {/* ── Advanced Options ── */}
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:text-foreground"
                >
                  <span>Advanced Options</span>
                  {advancedOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>

                {advancedOpen && (
                  <div className="flex flex-col gap-4 px-3 pb-4">
                    <div className="flex flex-col gap-0 rounded-lg border border-border">
                      {/* Allow Duet */}
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-foreground">Allow Duet</span>
                          <span className="text-[11px] leading-tight text-muted-foreground">Let other users create Duet videos with your ad</span>
                        </div>
                        <Switch
                          checked={ad.sparkDuetStatus !== "DISABLE"}
                          onCheckedChange={(checked) => onUpdate({ ...ad, sparkDuetStatus: checked ? "ENABLE" : "DISABLE" })}
                        />
                      </div>
                      <div className="border-t border-border" />
                      {/* Allow Stitch */}
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-foreground">Allow Stitch</span>
                          <span className="text-[11px] leading-tight text-muted-foreground">Let other users clip and remix parts of your ad</span>
                        </div>
                        <Switch
                          checked={ad.sparkStitchStatus !== "DISABLE"}
                          onCheckedChange={(checked) => onUpdate({ ...ad, sparkStitchStatus: checked ? "ENABLE" : "DISABLE" })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---- CAROUSEL ---- */}
          {isCarousel && !isSpark && (
            <div className="flex flex-col gap-0">
              {/* Carousel image cards */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">
                    Carousel Cards
                  </Label>
                  <Badge variant="secondary" className="text-xs tabular-nums">{cardCount}/35</Badge>
                </div>

                {/* Specs reminder */}
                <div className="mb-2 flex flex-wrap gap-3 rounded-lg bg-muted/30 px-3 py-2">
                  {[
                    { label: "Format", value: "JPG / PNG" },
                    { label: "Size", value: "< 100KB each" },
                    { label: "Horizontal", value: "1200 x 628" },
                    { label: "Square", value: "640 x 640" },
                    { label: "Vertical", value: "720 x 1280" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{s.label}:</span>
                      <span className="text-[10px] font-medium text-foreground">{s.value}</span>
                    </div>
                  ))}
                </div>

                {cardCount === 0 ? (
                  <UploadZone
                    accept="image/jpeg,image/png"
                    label="Add carousel card images"
                    sublabel="JPG/PNG, min 2 - max 35 cards, < 100KB suggested each"
                    onFile={handleCarouselFile}
                    libraryContext="IMAGE"
                    multiSelect
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {ad.carouselCards.map((card, ci) => (
                        <div key={card.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/20">
                          {card.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={card.imageUrl} alt={`Card ${ci + 1}`} className="size-full object-cover" crossOrigin="anonymous" />
                          ) : (
                            <div className="flex size-full items-center justify-center">
                              <ImageIcon className="size-4 text-muted-foreground" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => onUpdate({ ...ad, carouselCards: ad.carouselCards.filter((c) => c.id !== card.id) })}
                            className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="size-2.5" />
                          </button>
                          <span className="absolute bottom-0.5 left-0.5 rounded bg-black/50 px-1 py-px text-[7px] text-white">{ci + 1}</span>
                        </div>
                      ))}
                      {cardCount < 35 && (
                        <UploadZone
                          accept="image/jpeg,image/png"
                          label="Add"
                          sublabel="JPG/PNG"
                          compact
                          onFile={handleCarouselFile}
                          libraryContext="IMAGE"
                          multiSelect
                        />
                      )}
                    </div>
                    {cardCount < 2 && (
                      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-1.5">
                        <AlertCircle className="size-3 shrink-0 text-amber-600" />
                        <span className="text-xs text-amber-700">Minimum 2 cards required for carousel ads.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Background Music — REQUIRED for Carousel */}
              <div className="flex flex-col gap-0 rounded-lg border border-border">
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-foreground">Background Music</span>
                    <span className="text-[11px] leading-tight text-muted-foreground">
                      Music is mandatory for carousel ads and plays on loop across cards
                    </span>
                  </div>
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">Required</span>
                </div>
                <div className="border-t border-border px-3 py-2.5">
                  {hasMusic ? (
                    <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 to-primary/5">
                        <Music className="size-4 text-primary" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-xs font-medium text-foreground">{musicDisplayName}</span>
                        {musicSizeLabel && (
                          <span className="text-[10px] text-muted-foreground">{musicSizeLabel}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setMusicSheetOpen(true)}
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Replace music"
                      >
                        <Upload className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleMusicClear}
                        className="shrink-0 rounded-md p-1.5 text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                        title="Remove music"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMusicSheetOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-white py-4 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      <Music className="size-4" />
                      Browse or upload music
                    </button>
                  )}
                  <div className="mt-2 flex items-start gap-1.5">
                    <Info className="mt-0.5 size-2.5 shrink-0 text-muted-foreground/60" />
                    <p className="text-[10px] leading-tight text-muted-foreground">
                      CML tracks play on TikTok placements only. For Pangle, upload your own audio.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Link Type + CTA ── */}
              <div className="border-t border-border px-3 py-3">
                <LinkTypeSection
                  url={ad.landingPageUrl}
                  onUrlChange={(url) => onUpdate({ ...ad, landingPageUrl: url })}
                  cta={ad.callToAction}
                  onCtaChange={(v) => onUpdate({ ...ad, callToAction: v as TikTokCTA })}
                  recommendedCtas={RECOMMENDED_CTAS}
                  otherCtas={OTHER_CTAS}
                />
              </div>

              {/* ── Ad Copy ── */}
              <div className="border-t border-border px-3 py-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-foreground">Display Name</Label>
                    <div className="relative">
                      <Input placeholder="Your brand" value={ad.displayName} maxLength={20} onChange={(e) => onUpdate({ ...ad, displayName: e.target.value.slice(0, 20) })} className={cn("h-10 pr-14 text-sm", ad.displayName.length >= 20 && "border-amber-400")} />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">{ad.displayName.length}/20</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-foreground">Ad Caption <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Input placeholder="Write a short caption..." value={ad.adText} maxLength={100} onChange={(e) => onUpdate({ ...ad, adText: e.target.value.slice(0, 100) })} className={cn("h-10 pr-14 text-sm", ad.adText.length >= 100 && "border-amber-400")} />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">{ad.adText.length}/100</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ---- SINGLE VIDEO ---- */}
          {ad.adFormat === "SINGLE_VIDEO" && !isSpark && (
            <div className="flex flex-col gap-0">

              {/* ── Section 1: Link Type + CTA (product-first) ── */}
              {!isAppPromo ? (
                <div className="px-3 py-3">
                  <LinkTypeSection
                    url={ad.landingPageUrl}
                    onUrlChange={(url) => onUpdate({ ...ad, landingPageUrl: url })}
                    cta={ad.callToAction}
                    onCtaChange={(v) => onUpdate({ ...ad, callToAction: v as TikTokCTA })}
                    recommendedCtas={RECOMMENDED_CTAS}
                    otherCtas={OTHER_CTAS}
                    optional={isVideoViews || isLeadGen}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-4 px-3 py-3">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-foreground">App Download URL</Label>
                    <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-muted/40 px-3">
                      <span className="truncate text-sm text-muted-foreground">{ad.landingPageUrl || "Set in Objective step"}</span>
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {ad.landingPageUrl?.includes("apple.com") ? "App Store" : "Google Play"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Section 2: Media Upload ── */}
              <div className="border-t border-border px-3 py-3">
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                  <Film className="size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">
                    MP4/MOV · 9:16 recommended · 5-60s · max 500MB · H.264
                  </p>
                  <span className="ml-auto shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Best Format</span>
                </div>

                <UploadZone
                  accept="video/mp4,video/quicktime"
                  label="Drop video here"
                  sublabel="MP4/MOV, 9:16 recommended, 5-60s, max 500MB"
                  preview={ad.assets[0]?.url || undefined}
                  previewMediaType={ad.assets[0]?.type}
                  previewFile={ad.assets[0]?.file}
                  onFile={handleFile}
                  onClear={() => onUpdate({ ...ad, assets: [] })}
                  libraryContext="VIDEO"
                />

                {/* Background Music — toggle+description row */}
                <div className="mt-3 flex flex-col gap-0 rounded-lg border border-border">
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-foreground">Background Music</span>
                      <span className="text-[11px] leading-tight text-muted-foreground">Add background music to enhance your video ad</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Optional</span>
                      <Switch
                        checked={!ad.promotionalMusicDisabled}
                        onCheckedChange={(checked) => {
                          onUpdate({ ...ad, promotionalMusicDisabled: !checked, ...(!checked ? { musicFile: undefined, musicUrl: "", musicId: "", musicName: "" } : {}) });
                        }}
                      />
                    </div>
                  </div>
                  {!ad.promotionalMusicDisabled && (
                    <div className="border-t border-border px-3 py-2.5">
                      {hasMusic ? (
                        <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 to-primary/5">
                            <Music className="size-4 text-primary" />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-xs font-medium text-foreground">{musicDisplayName}</span>
                            {musicSizeLabel && (
                              <span className="text-[10px] text-muted-foreground">{musicSizeLabel}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setMusicSheetOpen(true)}
                            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Replace music"
                          >
                            <Upload className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleMusicClear}
                            className="shrink-0 rounded-md p-1.5 text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                            title="Remove music"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMusicSheetOpen(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-white py-4 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                        >
                          <Music className="size-4" />
                          Browse or upload music
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Section 3: Ad Copy ── */}
              <div className="border-t border-border px-3 py-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-foreground">Display Name</Label>
                    <div className="relative">
                      <Input
                        placeholder="Your brand"
                        value={ad.displayName}
                        maxLength={20}
                        onChange={(e) => onUpdate({ ...ad, displayName: e.target.value.slice(0, 20) })}
                        className={cn("h-10 pr-14 text-sm", ad.displayName.length >= 20 && "border-amber-400")}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">{ad.displayName.length}/20</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-foreground">
                      Ad Caption <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Write a short caption..."
                        value={ad.adText}
                        maxLength={100}
                        onChange={(e) => onUpdate({ ...ad, adText: e.target.value.slice(0, 100) })}
                        className={cn("h-10 pr-14 text-sm", ad.adText.length >= 100 && "border-amber-400")}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">{ad.adText.length}/100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Advanced Options ── */}
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:text-foreground"
                >
                  <span>Advanced Options</span>
                  {advancedOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>

                {advancedOpen && (
                  <div className="flex flex-col gap-4 px-3 pb-4">
                    <div className="flex flex-col gap-0 rounded-lg border border-border">
                      {/* Instant Product Page */}
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-foreground">Instant Product Page</span>
                          <span className="text-[11px] leading-tight text-muted-foreground">In-app landing page optimized for speed and conversions</span>
                        </div>
                        <Switch
                          checked={ad.instantProductPageUsed ?? false}
                          onCheckedChange={(checked) => onUpdate({ ...ad, instantProductPageUsed: checked })}
                        />
                      </div>
                      <div className="border-t border-border" />
                      {/* AI Content Disclosure */}
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-foreground">AI Content Disclosure</span>
                          <span className="text-[11px] leading-tight text-muted-foreground">Declare this ad contains AI-generated content</span>
                        </div>
                        <Switch
                          checked={ad.aigcDisclosureType === "DECLARED"}
                          onCheckedChange={(checked) => onUpdate({ ...ad, aigcDisclosureType: checked ? "DECLARED" : "NOT_DECLARED" })}
                        />
                      </div>
                    </div>

                    {/* App Deep Link */}
                    {isAppPromo && (
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">App Deep Link</Label>
                        <Input
                          placeholder="myapp://product/123"
                          value={ad.deeplink || ""}
                          onChange={(e) => onUpdate({ ...ad, deeplink: e.target.value })}
                          className="h-10 font-mono text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground">Opens content directly in your app if installed</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---- SINGLE IMAGE ---- */}
          {ad.adFormat === "SINGLE_IMAGE" && !isSpark && (
            <div className="flex flex-col gap-0">

              {/* ── Section 1: Link Type + CTA ── */}
              <div className="px-3 py-3">
                <LinkTypeSection
                  url={ad.landingPageUrl}
                  onUrlChange={(url) => onUpdate({ ...ad, landingPageUrl: url })}
                  cta={ad.callToAction}
                  onCtaChange={(v) => onUpdate({ ...ad, callToAction: v as TikTokCTA })}
                  recommendedCtas={RECOMMENDED_CTAS}
                  otherCtas={OTHER_CTAS}
                />
              </div>

              {/* ── Section 2: Media Upload ── */}
              <div className="border-t border-border px-3 py-3">
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                  <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">
                    PNG/JPG · 9:16, 1:1, or 16:9 · max 100MB
                  </p>
                </div>

                <UploadZone
                  accept="image/jpeg,image/png"
                  label="Drop image here"
                  sublabel="PNG/JPG, 9:16 recommended (1080x1920), max 100MB"
                  preview={ad.assets[0]?.url || undefined}
                  previewMediaType={ad.assets[0]?.type}
                  previewFile={ad.assets[0]?.file}
                  onFile={handleFile}
                  onClear={() => onUpdate({ ...ad, assets: [] })}
                  libraryContext="IMAGE"
                />

                {/* Background Music */}
                <div className="mt-3 flex flex-col gap-0 rounded-lg border border-border">
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-foreground">Background Music</span>
                      <span className="text-[11px] leading-tight text-muted-foreground">TikTok will animate your image with this music</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Optional</span>
                      <Switch
                        checked={!ad.promotionalMusicDisabled}
                        onCheckedChange={(checked) => {
                          onUpdate({ ...ad, promotionalMusicDisabled: !checked, ...(!checked ? { musicFile: undefined, musicUrl: "", musicId: "", musicName: "" } : {}) });
                        }}
                      />
                    </div>
                  </div>
                  {!ad.promotionalMusicDisabled && (
                    <div className="border-t border-border px-3 py-2.5">
                      {hasMusic ? (
                        <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/25 to-primary/5">
                            <Music className="size-4 text-primary" />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-xs font-medium text-foreground">{musicDisplayName}</span>
                            {musicSizeLabel && (
                              <span className="text-[10px] text-muted-foreground">{musicSizeLabel}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setMusicSheetOpen(true)}
                            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Replace music"
                          >
                            <Upload className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleMusicClear}
                            className="shrink-0 rounded-md p-1.5 text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                            title="Remove music"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMusicSheetOpen(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-white py-4 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                        >
                          <Music className="size-4" />
                          Browse or upload music
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Section 3: Ad Copy ── */}
              <div className="border-t border-border px-3 py-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-foreground">Display Name</Label>
                    <div className="relative">
                      <Input placeholder="Your brand" value={ad.displayName} maxLength={20} onChange={(e) => onUpdate({ ...ad, displayName: e.target.value.slice(0, 20) })} className={cn("h-10 pr-14 text-sm", ad.displayName.length >= 20 && "border-amber-400")} />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">{ad.displayName.length}/20</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-foreground">Ad Caption <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Input placeholder="Write a short caption..." value={ad.adText} maxLength={100} onChange={(e) => onUpdate({ ...ad, adText: e.target.value.slice(0, 100) })} className={cn("h-10 pr-14 text-sm", ad.adText.length >= 100 && "border-amber-400")} />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">{ad.adText.length}/100</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Shared Music Library Sheet (opens from any ad format's Background Music section) */}
      <MusicLibrarySheet
        open={musicSheetOpen}
        onOpenChange={setMusicSheetOpen}
        onSelect={handleMusicSelect}
        required={isCarousel}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock Product Sets (in production from TikTok Catalog API)          */
/* ------------------------------------------------------------------ */

interface CatalogProductSet {
  id: string;
  name: string;
  productCount: number;
  description: string;
}

const TIKTOK_MOCK_PRODUCT_SETS: CatalogProductSet[] = [
  { id: "ps_all", name: "All Products", productCount: 156, description: "All products synced from your Salla store" },
  { id: "ps_best", name: "Best Sellers", productCount: 24, description: "Top performing products by sales volume" },
  { id: "ps_new", name: "New Arrivals", productCount: 18, description: "Products added in the last 30 days" },
  { id: "ps_sale", name: "On Sale", productCount: 32, description: "Products with active discounts" },
  { id: "ps_high", name: "High Margin", productCount: 15, description: "Products with highest profit margin" },
  { id: "ps_electronics", name: "Electronics", productCount: 28, description: "Electronics category products" },
  { id: "ps_clothing", name: "Clothing & Fashion", productCount: 45, description: "Clothing and fashion items" },
];

/* ------------------------------------------------------------------ */
/*  Catalog Product Selection Section                                  */
/* ------------------------------------------------------------------ */

function CatalogProductSelection({
  objectiveConfig,
  updateNested,
  isCatalogListing,
}: {
  objectiveConfig: { productSelectionMode: string; productSetId: string; specificProductIds: string[]; dynamicFormat: boolean; shoppingAdsType: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateNested: any;
  isCatalogListing: boolean;
}) {
  const [showSetPicker, setShowSetPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

  // Get the selected product set info
  const selectedSet = TIKTOK_MOCK_PRODUCT_SETS.find((s) => s.id === objectiveConfig.productSetId);
  // Get selected specific products
  const selectedProducts = PREVIEW_PRODUCTS.filter((p) => objectiveConfig.specificProductIds.includes(p.id));

  const handleAddProducts = (products: SallaProduct[]) => {
    const ids = [...objectiveConfig.specificProductIds, ...products.map((p) => p.id)].slice(0, 20);
    updateNested("objective", { specificProductIds: ids });
  };

  const removeProduct = (id: string) => {
    updateNested("objective", { specificProductIds: objectiveConfig.specificProductIds.filter((pid: string) => pid !== id) });
  };

  return (
    <>
      <SectionCard>
        <div className="mb-1 flex items-center gap-2">
          <Store className="size-4 text-primary" />
          <Label className="text-sm font-semibold text-foreground">Product Selection</Label>
          <InfoTip text="Choose which products from your catalog to feature. 'All products' uses all in-stock items. 'Product Set' maps to API product_set_id. 'Specific' lets you pick up to 20 products." />
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Select which products from your Salla catalog to include in this campaign.
        </p>

        {/* Mode selector tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {([
            { value: "ALL" as const, label: "All Products", icon: <ShoppingBag className="size-3" /> },
            { value: "PRODUCT_SET" as const, label: "Product Set", icon: <Package className="size-3" /> },
            { value: "SPECIFIC" as const, label: "Specific Products", icon: <Tag className="size-3" /> },
          ]).map((ps) => {
            const sel = objectiveConfig.productSelectionMode === ps.value;
            return (
              <button
                key={ps.value}
                type="button"
                onClick={() => updateNested("objective", { productSelectionMode: ps.value })}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all",
                  sel
                    ? "border-primary bg-primary/[0.04] text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                )}
              >
                {ps.icon}
                {ps.label}
              </button>
            );
          })}
        </div>

        {/* --- ALL PRODUCTS --- */}
        {objectiveConfig.productSelectionMode === "ALL" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/[0.02] px-3 py-2.5">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium text-foreground">All 156 products will be included</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  TikTok will dynamically select the best products to show based on user behavior and your optimization goals.
                </p>
              </div>
            </div>
            {/* Product preview grid */}
            <div>
              <Label className="mb-2 text-xs text-muted-foreground">Product Preview</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {PREVIEW_PRODUCTS.slice(0, 8).map((p) => (
                  <div key={p.id} className="group overflow-hidden rounded-lg border border-border bg-card">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt={p.name} className="size-full object-cover" crossOrigin="anonymous" />
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="truncate text-[10px] font-medium text-foreground">{p.name}</p>
                      <p className="text-[10px] font-semibold text-primary">{p.price} {p.currency}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                Showing 8 of 156 products
              </p>
            </div>
          </div>
        )}

        {/* --- PRODUCT SET --- */}
        {objectiveConfig.productSelectionMode === "PRODUCT_SET" && (
          <div className="flex flex-col gap-3">
            {selectedSet ? (
              <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="size-4 text-primary" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-xs font-medium text-foreground">{selectedSet.name}</span>
                  <span className="text-[11px] text-muted-foreground">{selectedSet.productCount} products</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSetPicker(true)}
                  className="h-7 text-xs"
                >
                  Change
                </Button>
                <button
                  type="button"
                  onClick={() => updateNested("objective", { productSetId: "" })}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSetPicker(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-6 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Package className="size-5" />
                <span className="text-xs font-medium">Select a Product Set</span>
              </button>
            )}

            {/* Show product preview if set is selected */}
            {selectedSet && (
              <div>
                <Label className="mb-2 text-xs text-muted-foreground">Products in this set</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {PREVIEW_PRODUCTS.slice(0, 4).map((p) => (
                    <div key={p.id} className="overflow-hidden rounded-lg border border-border bg-card">
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt={p.name} className="size-full object-cover" crossOrigin="anonymous" />
                      </div>
                      <div className="px-2 py-1.5">
                        <p className="truncate text-[10px] font-medium text-foreground">{p.name}</p>
                        <p className="text-[10px] font-semibold text-primary">{p.price} {p.currency}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                  Showing 4 of {selectedSet.productCount} products
                </p>
              </div>
            )}

            {/* Product Set Picker Dialog */}
            <Dialog open={showSetPicker} onOpenChange={setShowSetPicker}>
              <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShoppingBag className="size-5 text-primary" />
                    Select Product Set
                  </DialogTitle>
                </DialogHeader>
                <p className="text-xs text-muted-foreground">
                  Choose a product set from your synced catalog. Product sets group products by shared characteristics. Maps to TikTok API <code className="rounded bg-muted px-1 text-[10px]">product_set_id</code>.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {TIKTOK_MOCK_PRODUCT_SETS.map((set) => (
                    <button
                      key={set.id}
                      type="button"
                      onClick={() => {
                        updateNested("objective", { productSetId: set.id });
                        setShowSetPicker(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all",
                        objectiveConfig.productSetId === set.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Package className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">{set.name}</p>
                        <p className="text-[11px] text-muted-foreground">{set.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{set.productCount}</p>
                        <p className="text-[10px] text-muted-foreground">products</p>
                      </div>
                      {objectiveConfig.productSetId === set.id && (
                        <Check className="size-4 shrink-0 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* --- SPECIFIC PRODUCTS --- */}
        {objectiveConfig.productSelectionMode === "SPECIFIC" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {selectedProducts.length} of 20 products selected
              </p>
              {selectedProducts.length < 20 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowProductPicker(true)}
                  className="h-7 gap-1 text-xs"
                >
                  <Plus className="size-3" />
                  Add Products
                </Button>
              )}
            </div>

            {selectedProducts.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowProductPicker(true)}
                className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Store className="size-8" />
                <div className="text-center">
                  <p className="text-xs font-medium">Select Products from Catalog</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Choose up to 20 specific products to feature in your ads</p>
                </div>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {selectedProducts.map((p) => (
                  <div key={p.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt={p.name} className="size-full object-cover" crossOrigin="anonymous" />
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeProduct(p.id)}
                        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="truncate text-[10px] font-medium text-foreground">{p.name}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold text-primary">{p.price} {p.currency}</p>
                        <p className="text-[9px] text-muted-foreground">{p.sku}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Add more button */}
                {selectedProducts.length < 20 && (
                  <button
                    type="button"
                    onClick={() => setShowProductPicker(true)}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Plus className="size-5" />
                    <span className="text-[10px] font-medium">Add More</span>
                  </button>
                )}
              </div>
            )}

            {/* Product Picker Dialog */}
            <ProductPickerDialog
              open={showProductPicker}
              onOpenChange={setShowProductPicker}
              existingProductNames={selectedProducts.map((p) => p.name)}
              maxProducts={20 - selectedProducts.length}
              onAddProducts={handleAddProducts}
            />
          </div>
        )}
      </SectionCard>

      {/* Dynamic Format toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Dynamic Creative Format</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isCatalogListing
              ? "Auto-assemble Catalog Video, Single Video, and Carousel formats using TikTok AI."
              : "Let TikTok AI auto-generate ad creatives from your catalog products."}
          </p>
        </div>
        <Switch
          checked={objectiveConfig.dynamicFormat}
          onCheckedChange={(checked) => updateNested("objective", { dynamicFormat: checked })}
        />
      </div>

      {/* Template Options (like Snap's Template Options) */}
      {isCatalogListing && (
        <SectionCard>
          <div className="mb-1 flex items-center gap-2">
            <Tag className="size-4 text-primary" />
            <Label className="text-sm font-semibold text-foreground">Template Options</Label>
            <InfoTip text="Configure how product information is displayed on auto-generated catalog ads." />
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Customize how your catalog products appear in the auto-generated creatives.
          </p>

          <div className="rounded-lg border border-border bg-muted/10 p-3">
            <div className="flex flex-col gap-3">
              {/* Show Price */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-foreground">Show product price</Label>
                <Switch defaultChecked />
              </div>
              {/* Show Sale Badge */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-foreground">Show sale/discount badge</Label>
                <Switch defaultChecked />
              </div>
              {/* Show Free Shipping */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-foreground">Show free shipping tag</Label>
                <Switch />
              </div>
              <div className="h-px bg-border" />
              {/* Caption text */}
              <div>
                <Label className="mb-1.5 text-xs text-foreground">Caption text</Label>
                <Select defaultValue="product_name_price">
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_name">Product name only</SelectItem>
                    <SelectItem value="product_name_price">Product name + price</SelectItem>
                    <SelectItem value="custom">Custom caption</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Product landing */}
              <div>
                <Label className="mb-1.5 text-xs text-foreground">Product landing page</Label>
                <Select defaultValue="product_page">
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_page">Individual product page</SelectItem>
                    <SelectItem value="store_home">Store homepage</SelectItem>
                    <SelectItem value="custom_url">Custom URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </SectionCard>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Instant Form Builder (Lead Generation objective)                   */
/* ------------------------------------------------------------------ */

const PERSONAL_INFO_OPTIONS: { value: PersonalInfoField; label: string; desc: string }[] = [
  { value: "NAME", label: "Full Name", desc: "First + last name" },
  { value: "FIRST_NAME", label: "First Name", desc: "First name only" },
  { value: "LAST_NAME", label: "Last Name", desc: "Last name only" },
  { value: "EMAIL", label: "Email", desc: "Email address" },
  { value: "PHONE_NUMBER", label: "Phone Number", desc: "Phone number" },
  { value: "CITY", label: "City", desc: "City name" },
  { value: "COUNTRY", label: "Country", desc: "Country" },
  { value: "POSTAL_CODE", label: "Postal Code", desc: "ZIP / postal code" },
];

const FORM_TEMPLATES = [
  { value: "SIMPLE_SIGNUP" as const, label: "Simple Sign-up", desc: "Quick form with personal info fields only. Best for newsletter, waitlist, or basic lead capture.", icon: <FileText className="size-4" /> },
  { value: "RICH_CONTENT" as const, label: "Rich Content", desc: "Form with banner image, headline, and description. Best for events, promotions, and detailed offers.", icon: <ImageIcon className="size-4" /> },
  { value: "LEAD_QUALIFICATION" as const, label: "Lead Qualification", desc: "Add custom questions to qualify leads before collecting info. Best for B2B, real estate, and services.", icon: <ClipboardList className="size-4" /> },
  { value: "BLANK" as const, label: "Custom / Blank", desc: "Start from scratch and build your own form layout with full control.", icon: <Plus className="size-4" /> },
];

const QUESTION_TYPES: { value: InstantFormQuestionType; label: string; icon: React.ReactNode }[] = [
  { value: "SHORT_ANSWER", label: "Short Answer", icon: <MessageSquare className="size-3.5" /> },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice", icon: <ClipboardList className="size-3.5" /> },
  { value: "APPOINTMENT", label: "Appointment", icon: <Tag className="size-3.5" /> },
  { value: "IMAGE_SELECT", label: "Image Select", icon: <ImageIcon className="size-3.5" /> },
];

function InstantFormBuilder() {
  const { campaign, updateNested } = useTikTokCampaign();
  const obj = campaign.objective;
  const form = obj.instantForm;
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const updateForm = (partial: Partial<InstantFormConfig>) => {
    updateNested("objective", {
      instantForm: { ...form, ...partial },
    });
  };

  const addQuestion = () => {
    const newQ: InstantFormQuestion = {
      id: `q_${Date.now()}`,
      type: "SHORT_ANSWER",
      questionText: "",
      options: [],
      required: true,
    };
    updateForm({ questions: [...form.questions, newQ] });
    setExpandedQuestionId(newQ.id);
  };

  const updateQuestion = (id: string, partial: Partial<InstantFormQuestion>) => {
    updateForm({
      questions: form.questions.map((q) =>
        q.id === id ? { ...q, ...partial } : q
      ),
    });
  };

  const removeQuestion = (id: string) => {
    updateForm({ questions: form.questions.filter((q) => q.id !== id) });
    if (expandedQuestionId === id) setExpandedQuestionId(null);
  };

  const togglePersonalInfo = (field: PersonalInfoField) => {
    const current = form.personalInfoFields;
    if (current.includes(field)) {
      updateForm({ personalInfoFields: current.filter((f) => f !== field) });
    } else {
      updateForm({ personalInfoFields: [...current, field] });
    }
  };

  const updateLocation = (loc: LeadOptimizationLocation) => {
    updateNested("objective", { leadOptimizationLocation: loc });
  };

  const isInstantForm = obj.leadOptimizationLocation === "INSTANT_FORM";

  return (
    <div className="space-y-5">
      {/* ---- Where to collect leads ---- */}
      <SectionCard>
        <h4 className="mb-1 text-sm font-semibold text-foreground">Where to collect leads</h4>
        <p className="mb-4 text-xs text-muted-foreground">Choose where users will submit their information.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              value: "INSTANT_FORM" as LeadOptimizationLocation,
              label: "TikTok Instant Form",
              desc: "Users fill out a form directly in TikTok. Auto-filled fields, no redirects, highest conversion rates.",
              icon: <FileText className="size-5" />,
              recommended: true,
            },
            {
              value: "WEBSITE" as LeadOptimizationLocation,
              label: "Website Form",
              desc: "Users click through to your website to fill out a form. Requires a pixel for tracking.",
              icon: <Globe className="size-5" />,
              recommended: false,
            },
          ].map((loc) => {
            const selected = obj.leadOptimizationLocation === loc.value;
            return (
              <button
                key={loc.value}
                type="button"
                onClick={() => updateLocation(loc.value)}
                className={cn(
                  "group relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
                  selected
                    ? "border-primary bg-primary/[0.03] shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                )}
              >
                {loc.recommended && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Recommended
                  </span>
                )}
                <div className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {loc.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{loc.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{loc.desc}</p>
                </div>
                {selected && (
                  <div className="absolute right-3 top-3">
                    <CheckCircle2 className="size-4 text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {!isInstantForm && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-700">
              Website lead forms require a <span className="font-semibold">TikTok Pixel</span> to track form submissions. Make sure you have configured a pixel in the objective settings. Your ad creative will link directly to your website form -- configure the landing page URL below.
            </p>
          </div>
        )}
      </SectionCard>

      {/* ---- Instant Form Builder (only when Instant Form is selected) ---- */}
      {isInstantForm && (
        <>
      {/* Form Template */}
      <SectionCard>
        <h4 className="mb-1 text-sm font-semibold text-foreground">Form Template</h4>
        <p className="mb-4 text-xs text-muted-foreground">Choose a template to get started. You can customize everything after.</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {FORM_TEMPLATES.map((t) => {
            const selected = form.formTemplate === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => updateForm({ formTemplate: t.value })}
                className={cn(
                  "flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all",
                  selected
                    ? "border-primary bg-primary/[0.03]"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {t.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{t.label}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{t.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Form Intent */}
      <SectionCard>
        <h4 className="mb-1 text-sm font-semibold text-foreground">Form Intent</h4>
        <p className="mb-4 text-xs text-muted-foreground">Higher intent forms include a review screen before submission, reducing spam but also volume.</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[
            { value: "MORE_VOLUME" as const, label: "More Volume", desc: "Quick submission, no review screen. Maximizes the number of leads collected." },
            { value: "HIGHER_INTENT" as const, label: "Higher Intent", desc: "Adds a review screen before submission. Fewer but higher-quality leads." },
          ].map((t) => {
            const selected = form.formType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => updateForm({ formType: t.value })}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border-2 p-3.5 text-left transition-all",
                  selected ? "border-primary bg-primary/[0.03]" : "border-border bg-card hover:border-primary/40"
                )}
              >
                <p className="text-xs font-semibold text-foreground">{t.label}</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Form Name (all templates) */}
      <SectionCard>
        <h4 className="mb-1 text-sm font-semibold text-foreground">Form Name</h4>
        <p className="mb-4 text-xs text-muted-foreground">Internal reference name for this form. Not shown to users.</p>
        <Input
          placeholder="e.g. Summer Sale Lead Form"
          value={form.formName}
          onChange={(e) => updateForm({ formName: e.target.value })}
          className="h-9 text-sm"
        />
      </SectionCard>

      {/* Form Content (Rich Content / Lead Qualification / Blank templates) */}
      {(form.formTemplate === "RICH_CONTENT" || form.formTemplate === "LEAD_QUALIFICATION" || form.formTemplate === "BLANK") && (
        <SectionCard>
          <h4 className="mb-1 text-sm font-semibold text-foreground">Form Content</h4>
          <p className="mb-4 text-xs text-muted-foreground">Add a headline and description to explain what users get when they submit the form.</p>
          <div className="space-y-4">
            <div>
              <Label className="mb-1 block text-xs font-medium text-muted-foreground">Headline</Label>
              <Input
                placeholder="e.g. Get 20% Off Your First Order"
                value={form.headline}
                onChange={(e) => updateForm({ headline: e.target.value })}
                className="h-9 text-sm"
                maxLength={80}
              />
              <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{form.headline.length}/80</p>
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium text-muted-foreground">Description</Label>
              <Textarea
                placeholder="e.g. Sign up to receive exclusive offers and be the first to know about new products."
                value={form.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                rows={3}
                className="text-sm"
                maxLength={250}
              />
              <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{form.description.length}/250</p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Personal Information Fields */}
      <SectionCard>
        <h4 className="mb-1 text-sm font-semibold text-foreground">Personal Information</h4>
        <p className="mb-4 text-xs text-muted-foreground">Select which fields to collect. TikTok auto-fills these from the user&apos;s profile to reduce friction.</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PERSONAL_INFO_OPTIONS.map((field) => {
            const selected = form.personalInfoFields.includes(field.value);
            return (
              <button
                key={field.value}
                type="button"
                onClick={() => togglePersonalInfo(field.value)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                  selected
                    ? "border-primary bg-primary/[0.03]"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                  selected ? "border-primary bg-primary" : "border-muted-foreground/30 bg-card"
                )}>
                  {selected && <CheckCircle2 className="size-3.5 text-primary-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{field.label}</p>
                  <p className="text-[10px] text-muted-foreground">{field.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
        {form.personalInfoFields.length === 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" />
            <p className="text-xs text-red-700">Select at least one personal info field to collect.</p>
          </div>
        )}
      </SectionCard>

      {/* Custom Questions (Lead Qualification / Custom templates) */}
      {(form.formTemplate === "LEAD_QUALIFICATION" || form.formTemplate === "BLANK") && (
        <SectionCard>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Custom Questions</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">Add questions to qualify your leads. Up to 10 custom questions allowed.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addQuestion}
              disabled={form.questions.length >= 10}
              className="shrink-0"
            >
              <Plus className="mr-1 size-3.5" />
              Add Question
            </Button>
          </div>

          {form.questions.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-8">
              <ClipboardList className="mb-2 size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">No custom questions yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Add questions to qualify leads and collect specific information.</p>
              <Button variant="outline" size="sm" onClick={addQuestion} className="mt-3">
                <Plus className="mr-1 size-3.5" />
                Add Your First Question
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {form.questions.map((q, idx) => {
              const isExpanded = expandedQuestionId === q.id;
              return (
                <div
                  key={q.id}
                  className={cn(
                    "rounded-lg border transition-all",
                    isExpanded ? "border-primary/40 bg-primary/[0.02] shadow-sm" : "border-border bg-card"
                  )}
                >
                  {/* Question header */}
                  <button
                    type="button"
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <GripVertical className="size-3.5 shrink-0 text-muted-foreground/40" />
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {q.questionText || "Untitled question"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {QUESTION_TYPES.find((t) => t.value === q.type)?.label || q.type}
                        {q.required && " (Required)"}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
                  </button>

                  {/* Expanded question editor */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-4">
                      <div className="space-y-3">
                        <div>
                          <Label className="mb-1 block text-xs font-medium text-muted-foreground">Question Type</Label>
                          <Select value={q.type} onValueChange={(val) => updateQuestion(q.id, { type: val as InstantFormQuestionType, options: val === "MULTIPLE_CHOICE" || val === "IMAGE_SELECT" ? (q.options.length > 0 ? q.options : ["Option 1", "Option 2"]) : [] })}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUESTION_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  <div className="flex items-center gap-2">
                                    {t.icon}
                                    <span>{t.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="mb-1 block text-xs font-medium text-muted-foreground">Question</Label>
                          <Input
                            placeholder="e.g. What is your budget range?"
                            value={q.questionText}
                            onChange={(e) => updateQuestion(q.id, { questionText: e.target.value })}
                            className="h-9 text-sm"
                            maxLength={120}
                          />
                        </div>
                        {(q.type === "MULTIPLE_CHOICE" || q.type === "IMAGE_SELECT") && (
                          <div>
                            <Label className="mb-1 block text-xs font-medium text-muted-foreground">Options (max 10)</Label>
                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-medium text-muted-foreground">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...q.options];
                                      newOpts[optIdx] = e.target.value;
                                      updateQuestion(q.id, { options: newOpts });
                                    }}
                                    className="h-8 flex-1 text-xs"
                                    placeholder={`Option ${optIdx + 1}`}
                                  />
                                  {q.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newOpts = q.options.filter((_, i) => i !== optIdx);
                                        updateQuestion(q.id, { options: newOpts });
                                      }}
                                      className="text-muted-foreground hover:text-red-600"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {q.options.length < 10 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuestion(q.id, { options: [...q.options, `Option ${q.options.length + 1}`] })}
                                  className="mt-1 text-xs"
                                >
                                  <Plus className="mr-1 size-3" />
                                  Add Option
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => updateQuestion(q.id, { required: !q.required })}
                            className={cn(
                              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                              q.required ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                            )}
                          >
                            {q.required ? <CheckCircle2 className="size-3" /> : <Radio className="size-3" />}
                            {q.required ? "Required" : "Optional"}
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(q.id)}
                            className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="mr-1 size-3" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Privacy & Compliance */}
      <SectionCard>
        <h4 className="mb-1 text-sm font-semibold text-foreground">Privacy & Compliance</h4>
        <p className="mb-4 text-xs text-muted-foreground">Required by TikTok. Users will see your company name and privacy policy before submitting.</p>
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">Company / Brand Name</Label>
            <Input
              placeholder="e.g. My Salla Store"
              value={form.companyName}
              onChange={(e) => updateForm({ companyName: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">Privacy Policy URL</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Lock className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="https://yourstore.salla.sa/privacy"
                  type="url"
                  value={form.privacyPolicyUrl}
                  onChange={(e) => updateForm({ privacyPolicyUrl: e.target.value })}
                  className={cn("h-9 pl-9 text-sm", form.privacyPolicyUrl && !form.privacyPolicyUrl.startsWith("https://") && "border-red-400")}
                />
              </div>
            </div>
            {form.privacyPolicyUrl && !form.privacyPolicyUrl.startsWith("https://") && (
              <p className="mt-1 text-[10px] text-red-600">URL must start with https://</p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Thank You Page */}
      <SectionCard>
        <h4 className="mb-1 text-sm font-semibold text-foreground">Thank You Page</h4>
        <p className="mb-4 text-xs text-muted-foreground">Shown after the user submits the form. Use it to confirm submission and optionally redirect them.</p>
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">Headline</Label>
            <Input
              placeholder="e.g. Thank you for your interest!"
              value={form.thankYouHeadline}
              onChange={(e) => updateForm({ thankYouHeadline: e.target.value })}
              className="h-9 text-sm"
              maxLength={60}
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">Description</Label>
            <Input
              placeholder="e.g. We will get back to you shortly."
              value={form.thankYouDescription}
              onChange={(e) => updateForm({ thankYouDescription: e.target.value })}
              className="h-9 text-sm"
              maxLength={120}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs font-medium text-muted-foreground">Button Text</Label>
              <Input
                placeholder="e.g. Visit Website"
                value={form.thankYouButtonText}
                onChange={(e) => updateForm({ thankYouButtonText: e.target.value })}
                className="h-9 text-sm"
                maxLength={30}
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-medium text-muted-foreground">Button URL (optional)</Label>
              <Input
                placeholder="https://yourstore.salla.sa"
                type="url"
                value={form.thankYouUrl}
                onChange={(e) => updateForm({ thankYouUrl: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Form Preview Card */}
      <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-6">
        <h4 className="mb-3 text-sm font-semibold text-foreground">Form Preview Summary</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Template</span>
            <span className="font-medium text-foreground">{FORM_TEMPLATES.find((t) => t.value === form.formTemplate)?.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Intent</span>
            <span className="font-medium text-foreground">{form.formType === "HIGHER_INTENT" ? "Higher Intent" : "More Volume"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Personal fields</span>
            <span className="font-medium text-foreground">{form.personalInfoFields.length} field{form.personalInfoFields.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Custom questions</span>
            <span className="font-medium text-foreground">{form.questions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Privacy URL</span>
            <span className={cn("font-medium", form.privacyPolicyUrl ? "text-foreground" : "text-red-600")}>{form.privacyPolicyUrl ? "Set" : "Missing"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Company name</span>
            <span className={cn("font-medium", form.companyName ? "text-foreground" : "text-red-600")}>{form.companyName || "Missing"}</span>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function TikTokStepCreative() {
  const { campaign, setStep, updateNested } = useTikTokCampaign();
  const cr = campaign.creative;
  /* Ensure identity always exists (safety for older campaign data) */
  const identity = cr.identity ?? {
    identityType: "CUSTOMIZED_USER" as const,
    identityId: "",
    displayName: "",
    avatarPreviewUrl: "",
  };
  const catalogEnabled = campaign.objective.catalogEnabled === true;
  const apiConfig = OBJECTIVE_CONFIGS[campaign.objective.objective] ?? OBJECTIVE_CONFIGS.PRODUCT_SALES;
  const isReach = campaign.objective.objective === "REACH";
  const isVideoViews = campaign.objective.objective === "VIDEO_VIEWS";
  const isLeadGen = campaign.objective.objective === "LEAD_GENERATION";
  const isAppPromo = campaign.objective.objective === "APP_PROMOTION";
  const allowedFormats = apiConfig.allowedAdFormats;
  const [activeAdIdx, setActiveAdIdx] = useState(0);
  const [placementExpanded, setPlacementExpanded] = useState(false);

  const ads = cr.ads ?? [];
  const activeAd = ads[activeAdIdx] ?? ads[0] ?? null;
  const objectiveConfig = campaign.objective;

  /* ---- Ad CRUD ---- */
  const defaultFormat: TikTokAdFormat = allowedFormats.includes("SINGLE_VIDEO") ? "SINGLE_VIDEO" : allowedFormats[0];
  const addAd = (format: TikTokAdFormat = defaultFormat) => {
  const newAd = makeDefaultAd(format, ads.length, apiConfig.defaultCTA as TikTokCTA);
  // Auto-fill app download URL for App Promo campaigns
  if (isAppPromo && campaign.objective.appSettings.appDownloadUrl) {
    newAd.landingPageUrl = campaign.objective.appSettings.appDownloadUrl;
  }
  const next = [...ads, newAd];
    updateNested("creative", { ads: next });
    setActiveAdIdx(next.length - 1);
  };

  const removeAd = (id: string) => {
    const next = ads.filter((a) => a.id !== id);
    updateNested("creative", { ads: next });
    if (activeAdIdx >= next.length) setActiveAdIdx(Math.max(0, next.length - 1));
  };

  const updateAd = (id: string, updated: TikTokAd) => {
    updateNested("creative", { ads: ads.map((a) => (a.id === id ? updated : a)) });
  };

  const duplicateAd = (id: string) => {
    const src = ads.find((a) => a.id === id);
    if (!src) return;
    const dup: TikTokAd = {
      ...src,
      id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${src.name} (copy)`,
      assets: src.assets.map((a) => ({ ...a, id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` })),
      carouselCards: src.carouselCards.map((c) => ({ ...c, id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` })),
    };
    const idx = ads.findIndex((a) => a.id === id);
    const next = [...ads];
    next.splice(idx + 1, 0, dup);
    updateNested("creative", { ads: next });
    setActiveAdIdx(idx + 1);
  };

  const totalCreatives = ads.reduce((sum, a) => sum + (a.adFormat === "CAROUSEL" ? a.carouselCards.length : a.assets.length), 0);
  const activeAdFormat = activeAd?.adFormat ?? "SINGLE_VIDEO";
  const isCatalogListing = catalogEnabled && objectiveConfig.shoppingAdsType === "CATALOG_LISTING_ADS";

  /* Auto-create a placeholder ad for Catalog Listing; remove it when leaving catalog listing mode */
  const prevCatalogListing = useRef(isCatalogListing);
  useEffect(() => {
    if (isCatalogListing && ads.length === 0) {
      const catalogAd = makeDefaultAd("SINGLE_VIDEO", 0);
      catalogAd.name = "Catalog Listing Ad";
      updateNested("creative", { ads: [catalogAd] });
    }
    if (!isCatalogListing && prevCatalogListing.current) {
      const cleaned = ads.filter((a) => a.name !== "Catalog Listing Ad" || a.assets.length > 0);
      if (cleaned.length !== ads.length) {
        updateNested("creative", { ads: cleaned });
      }
    }
    prevCatalogListing.current = isCatalogListing;
  }, [isCatalogListing]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Validation */
  const allChecks: { label: string; ok: boolean }[] = [];
  allChecks.push({ label: "Identity: TikTok account linked", ok: identity.linkStatus === "confirmed" && !!identity.identityId });

  if (isCatalogListing) {
    // Catalog Listing: creatives are auto-generated, only need basic settings
    allChecks.push({ label: "Catalog connected", ok: true });
  } else {
    // Video Shopping or non-catalog: need manual ad uploads
    allChecks.push({ label: "At least 1 ad created", ok: ads.length > 0 });
    ads.forEach((ad, i) => {
      if (!allowedFormats.includes(ad.adFormat)) {
        allChecks.push({ label: `Ad ${i + 1}: incompatible format (${ad.adFormat})`, ok: false });
        return;
      }
      allChecks.push({ label: `Ad ${i + 1}: has name`, ok: !!ad.name.trim() });
      if (ad.adFormat === "SPARK_AD") {
        allChecks.push({ label: `Ad ${i + 1}: auth code`, ok: !!ad.sparkAdAuthCode.trim() });
      } else if (ad.adFormat === "CAROUSEL") {
        allChecks.push({ label: `Ad ${i + 1}: min 2 cards`, ok: ad.carouselCards.length >= 2 });
        allChecks.push({ label: `Ad ${i + 1}: ad text`, ok: ad.adText.length > 0 });
        allChecks.push({ label: `Ad ${i + 1}: landing URL`, ok: !!ad.landingPageUrl && ad.landingPageUrl.startsWith("https://") });
      } else {
        allChecks.push({ label: `Ad ${i + 1}: has media`, ok: ad.assets.length > 0 && !!ad.assets[0]?.url });
        allChecks.push({ label: `Ad ${i + 1}: ad text`, ok: ad.adText.length > 0 });
  // Video Views, Lead Gen, App Promo: landing URL is optional / auto-filled
  if (!isVideoViews && !isLeadGen && !isAppPromo) {
          allChecks.push({ label: `Ad ${i + 1}: landing URL`, ok: !!ad.landingPageUrl && ad.landingPageUrl.startsWith("https://") });
        } else {
          // Only validate if provided
          if (ad.landingPageUrl) {
            allChecks.push({ label: `Ad ${i + 1}: landing URL valid`, ok: ad.landingPageUrl.startsWith("https://") });
          }
        }
      }
    });
  }

  // Lead Gen Instant Form validation
  if (isLeadGen && campaign.objective.leadOptimizationLocation === "INSTANT_FORM") {
    const form = campaign.objective.instantForm;
    allChecks.push({ label: "Instant Form: company name", ok: !!form.companyName.trim() });
    allChecks.push({ label: "Instant Form: privacy URL", ok: !!form.privacyPolicyUrl && form.privacyPolicyUrl.startsWith("https://") });
    allChecks.push({ label: "Instant Form: personal info fields", ok: form.personalInfoFields.length > 0 });
    if (form.formTemplate !== "SIMPLE_SIGNUP") {
      allChecks.push({ label: "Instant Form: headline", ok: !!form.headline.trim() });
    }
  }

  // Lead Gen Website Form requires pixel
  if (isLeadGen && campaign.objective.leadOptimizationLocation === "WEBSITE") {
    const hasPixel = campaign.objective.pixelMode !== "none" && (campaign.objective.pixelMode === "salla_managed" || !!campaign.objective.pixelId);
    allChecks.push({ label: "Website Form: pixel configured", ok: hasPixel });
  }

  const passingChecks = allChecks.filter((c) => c.ok).length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>
        {/* ============ LEFT COLUMN ============ */}
        <div className="flex flex-1 flex-col gap-5">

          {/* ---- TikTok Identity ---- */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "flex size-8 items-center justify-center rounded-xl",
                  identity.linkStatus === "confirmed" && identity.identityId ? "bg-[#e6fff9]" : "bg-amber-100"
                )}>
                  {identity.linkStatus === "confirmed" && identity.identityId
                    ? <User className="size-4 text-[#004956]" />
                    : <AlertCircle className="size-4 text-amber-500" />
                  }
                </div>
                <span className="text-sm font-semibold text-foreground">TikTok Identity</span>
                {identity.linkStatus === "confirmed" && identity.identityId ? (
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Connected</span>
                ) : (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Not Connected</span>
                )}
              </div>
              {identity.linkStatus === "confirmed" && identity.identityId && (
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <Pencil className="size-3" />
                  Edit
                </button>
              )}
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              {identity.linkStatus === "confirmed" && identity.identityId ? (
                /* ======== Connected: account card ======== */
                <div className="flex items-center gap-3.5">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-foreground">
                    {identity.avatarPreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={identity.avatarPreviewUrl} alt="" className="size-12 rounded-xl object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="size-5 text-background" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.83 4.83 0 0 1-1-.15z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{identity.tiktokUsername || identity.displayName || "TikTok Account"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {identity.identityType === "BC_AUTH_TT" ? "Linked via Salla Business Center" : identity.identityType === "AUTH_CODE" ? "Creator Authorization Code" : "Custom Identity"}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      {identity.identityId && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          ID: {identity.identityId.length > 12 ? `...${identity.identityId.slice(-8)}` : identity.identityId}
                        </span>
                      )}
                      <span className="rounded bg-[#e6fff9] px-1.5 py-0.5 text-[10px] font-semibold text-[#004956]">
                        {identity.identityType === "BC_AUTH_TT" ? "Business Center" : identity.identityType === "AUTH_CODE" ? "Auth Code" : "Custom"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ======== Not connected: prompt ======== */
                <div className="flex items-center gap-3.5 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                    <User className="size-4.5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-900">TikTok account not connected</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">
                      Go back to Campaign Setup to link your TikTok account via QR code. This is required for ad delivery.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#004956] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#003a44]"
                  >
                    Connect Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ---- Catalog Active Banner (when catalog enabled in step 0) ---- */}
          {catalogEnabled && (
            <div className="flex flex-col gap-4">
              {/* Catalog info banner */}
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Zap className="size-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-amber-900">Product Catalog Active</p>
                    <Badge variant="secondary" className="rounded-full bg-amber-200 px-1.5 py-0 text-xs font-medium text-amber-800">
                      Salla Store
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-amber-700">
                    Your product catalog is connected. Configure how your products appear in ads below.
                  </p>
                </div>
              </div>

              {/* Shopping Ad Type */}
              <SectionCard>
                <div className="mb-1 flex items-center gap-2">
                  <Tag className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Shopping Ad Type</Label>
                  <InfoTip text="Maps to TikTok API shopping_ads_type on the ad group. Determines how your catalog products appear in ads." />
                </div>
                <p className="mb-4 text-xs text-muted-foreground">
                  Choose how your catalog products are displayed in your TikTok ads.
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {([
                    {
                      value: "VIDEO_SHOPPING" as const,
                      label: "Video Shopping",
                      desc: "Upload videos and attach catalog products as interactive cards. Users browse & buy from the video.",
                      details: ["You upload video/image creatives", "Products displayed as interactive add-ons", "Best for brand storytelling + product discovery"],
                    },
                    {
                      value: "CATALOG_LISTING_ADS" as const,
                      label: "Catalog Listing",
                      desc: "TikTok auto-generates product ads from your catalog images, titles and prices. No manual creative needed.",
                      details: ["Creatives auto-generated from catalog", "Dynamic formats (video + carousel)", "Best for large catalogs with 50+ products"],
                    },
                  ]).map((sat) => {
                    const sel = objectiveConfig.shoppingAdsType === sat.value;
                    return (
                      <button
                        key={sat.value}
                        type="button"
                        onClick={() => updateNested("objective", { shoppingAdsType: sat.value })}
                        className={cn(
                          "flex flex-col items-start rounded-lg border-2 p-4 text-left transition-all",
                          sel
                            ? "border-primary bg-primary/[0.04]"
                            : "border-border bg-card hover:border-primary/40"
                        )}
                      >
                        <p className={cn("text-xs font-semibold", sel ? "text-primary" : "text-foreground")}>{sat.label}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{sat.desc}</p>
                        <ul className="mt-2 flex flex-col gap-0.5">
                          {sat.details.map((d) => (
                            <li key={d} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <CheckCircle2 className={cn("size-2.5 shrink-0", sel ? "text-primary" : "text-muted-foreground/50")} />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Product Selection */}
              <CatalogProductSelection
                objectiveConfig={objectiveConfig}
                updateNested={updateNested}
                isCatalogListing={isCatalogListing}
              />
            </div>
          )}

          {/* ---- Ad Placement & Brand Safety (merged, collapsible) ---- */}
          <div className={cn("rounded-2xl transition-colors", placementExpanded ? "bg-muted/50 p-2" : "")}>
            <button
              type="button"
              onClick={() => setPlacementExpanded(!placementExpanded)}
              className={cn(
                "flex w-full items-center justify-between px-6 pb-3 pt-5 text-left transition-colors rounded-2xl",
                !placementExpanded && "border border-border bg-card"
              )}
            >
              <div>
                <span className="text-base font-bold text-foreground">Ad Placement & Brand Safety</span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose your ad placements and surrounding content to ensure your brand identity remains protected.
                </p>
              </div>
              <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", placementExpanded && "rotate-180")} />
            </button>

            {placementExpanded && (
              <div className="mt-2 flex flex-col gap-4">

              {/* ── Content Safety (Inventory Filter) ── */}
              <div className="rounded-xl bg-card px-6 py-5">
                <h3 className="text-sm font-bold text-foreground">Content Safety</h3>
                <p className="mt-1 mb-4 text-xs text-muted-foreground">
                  Defines the type of content your ads appear next to. This doesn&apos;t change your ad—it controls its environment.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {([
                    { value: "NO_BRAND_SAFETY" as const, label: "Full Inventory", desc: "Ads can appear next to all TikTok content for maximum reach.", tradeoff: "Lower brand safety, larger audience" },
                    { value: "STANDARD_INVENTORY" as const, label: "Standard Inventory", desc: "Appropriate for most brands. Recommended.", tradeoff: "Balanced safety and reach", recommended: true },
                    { value: "LIMITED_INVENTORY" as const, label: "Limited Inventory", desc: "Most restrictive. No mature themes.", tradeoff: "Greater safety, smaller audience" },
                    { value: "EXPANDED_INVENTORY" as const, label: "Expanded Inventory", desc: "Exclude only explicitly inappropriate content.", tradeoff: "Broad reach, minimal filtering" },
                  ]).map((opt) => {
                    const selected = cr.brandSafetyType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateNested("creative", { brandSafetyType: opt.value })}
                        className={cn(
                          "flex flex-1 flex-col gap-2 rounded-xl border px-5 py-4 text-left transition-all",
                          selected
                            ? "border-[#a4ffe5] bg-[#e6fff9]"
                            : "border-border bg-card hover:border-[#a4ffe5]"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-bold", selected ? "text-[#004956]" : "text-foreground")}>{opt.label}</span>
                          {opt.recommended && (
                            <span className="rounded-full bg-[#a4ffe5] px-2 py-0.5 text-xs font-medium text-[#004956]">Recommended</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        <span className="text-xs text-muted-foreground">{opt.tradeoff}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Ad Placement ── */}
              <div className="rounded-xl bg-card px-6 py-5">
                <h3 className="text-sm font-bold text-foreground">Ad Placement</h3>
                <p className="mt-1 mb-4 text-xs text-muted-foreground">
                  Where your ads appear on TikTok. Auto-placement finds the best locations for performance, while manual lets you choose.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                  {([
                    { value: "PLACEMENT_TYPE_AUTOMATIC" as const, label: "Automatic", desc: "TikTok optimizes placements for top results across TikTok, Pangle, and partner apps.", recommended: true },
                    { value: "PLACEMENT_TYPE_NORMAL" as const, label: "Manual", desc: "Select exactly where your ads appear. Useful if you know your audience is in a specific spot.", recommended: false },
                  ]).map((opt) => {
                    const selected = cr.placementType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateNested("creative", { placementType: opt.value })}
                        className={cn(
                          "flex flex-1 flex-col gap-2 rounded-xl border px-5 py-4 text-left transition-all",
                          selected
                            ? "border-[#a4ffe5] bg-[#e6fff9]"
                            : "border-border bg-card hover:border-[#a4ffe5]"
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className={cn("text-sm font-bold", selected ? "text-[#004956]" : "text-foreground")}>{opt.label}</span>
                          {opt.recommended && (
                            <span className="rounded-full bg-[#a4ffe5] px-2 py-0.5 text-xs font-medium text-[#004956]">Recommended</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {cr.placementType === "PLACEMENT_TYPE_AUTOMATIC" && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#e6fff9] px-4 py-3">
                    <Sparkles className="size-4 shrink-0 text-[#004956]" />
                    <p className="text-xs font-medium text-[#004956]">
                      Automatic placement typically delivers 20-40% more impressions than manual placement.
                    </p>
                  </div>
                )}

                {cr.placementType === "PLACEMENT_TYPE_NORMAL" && (
                  <div className="mt-4">
                    <div className="rounded-lg bg-blue-50 px-4 py-3 mb-3">
                      <p className="text-xs text-blue-700">
                        Select your placements. TikTok is always required. Toggle Pangle and Global App Bundle on or off.
                      </p>
                    </div>
                    <div className="rounded-xl border border-border divide-y divide-border">
                      {([
                        { id: "PLACEMENT_TIKTOK" as const, label: "TikTok", desc: "Main TikTok feed (For You page)", required: true },
                        { id: "PLACEMENT_PANGLE" as const, label: "Pangle", desc: "TikTok Audience Network (third-party apps)", required: false },
                        { id: "PLACEMENT_GLOBALAPP_BUNDLE" as const, label: "Global App Bundle", desc: "Ads across TikTok-owned apps (CapCut, Fizzo, etc.)", required: false },
                      ]).map((pos) => {
                        const isOn = cr.placements?.includes(pos.id) ?? true;
                        return (
                          <div key={pos.id} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex size-6 shrink-0 items-center justify-center rounded-full",
                                isOn ? "bg-emerald-100" : "bg-muted"
                              )}>
                                {isOn
                                  ? <CheckCircle2 className="size-3.5 text-emerald-600" />
                                  : <X className="size-3 text-muted-foreground" />
                                }
                              </div>
                              <div>
                                <p className={cn("text-xs font-medium", isOn ? "text-foreground" : "text-muted-foreground")}>{pos.label}</p>
                                <p className="text-[11px] text-muted-foreground">{pos.desc}</p>
                              </div>
                            </div>
                            {pos.required ? (
                              <span className="text-[10px] font-medium text-muted-foreground">Required</span>
                            ) : (
                              <Switch
                                checked={isOn}
                                onCheckedChange={(checked) => {
                                  const current = cr.placements ?? ["PLACEMENT_TIKTOK", "PLACEMENT_PANGLE", "PLACEMENT_GLOBALAPP_BUNDLE"];
                                  const next = checked
                                    ? [...current, pos.id]
                                    : current.filter((p) => p !== pos.id);
                                  updateNested("creative", { placements: next });
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Content Interaction Controls ── */}
              <div className="rounded-xl bg-card px-6 py-5">
                <h3 className="text-sm font-bold text-foreground">Content Interaction Controls</h3>
                <p className="mt-1 mb-4 text-xs text-muted-foreground">
                  Control how users can interact with your ads. Disabling features may reduce organic reach but gives you more control.
                </p>
                <div className="rounded-xl border border-border divide-y divide-border">
                  {([
                    { key: "commentDisabled" as const, label: "Disable comments", desc: "Prevent users from commenting on your ads." },
                    { key: "shareDisabled" as const, label: "Disable sharing", desc: "Prevent users from sharing your ads." },
                    { key: "videoDownloadDisabled" as const, label: "Disable video download", desc: "Prevent users from downloading your ad videos." },
                  ]).map((ctrl) => (
                    <div key={ctrl.key} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-foreground">{ctrl.label}</p>
                        <p className="text-[11px] text-muted-foreground">{ctrl.desc}</p>
                      </div>
                      <Switch
                        checked={cr.contentControls[ctrl.key]}
                        onCheckedChange={(checked) =>
                          updateNested("creative", {
                            contentControls: { ...cr.contentControls, [ctrl.key]: checked },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
            )}
          </div>

          {/* ---- Lead Gen: location picker + instant form builder ---- */}
          {isLeadGen && <InstantFormBuilder />}

          {/* ---- Ads List ---- */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[#e6fff9]">
                  <Layers className="size-4 text-[#004956]" />
                </div>
                <span className="text-sm font-semibold text-foreground">Your Ads</span>
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{ads.length} ad{ads.length !== 1 ? "s" : ""}</span>
                <InfoTip text="Create multiple ads with different formats to test what works best. TikTok recommends 3-5 ad variations per ad group." />
              </div>
            </div>
            <div className="px-5 py-4">

            {/* Catalog Listing: auto-generated creatives */}
            {catalogEnabled && objectiveConfig.shoppingAdsType === "CATALOG_LISTING_ADS" ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.02] py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                      <Zap className="size-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Auto-Generated Catalog Creatives</p>
                      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                        TikTok will automatically generate ad creatives using product images, titles, and prices from your catalog. No manual upload needed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* What TikTok generates */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    { label: "Catalog Video", desc: "Product images assembled into video format with auto transitions" },
                    { label: "Product Carousel", desc: "Swipeable product cards generated from catalog images and data" },
                    { label: "Single Product", desc: "Individual product highlight ads with image, price, and CTA" },
                  ].map((f) => (
                    <div key={f.label} className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                      <p className="text-xs font-medium text-foreground">{f.label}</p>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{f.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Catalog Listing basic settings */}
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-foreground">Ad Settings</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs font-medium text-muted-foreground">Display Name</Label>
                      <Input
                        placeholder="Your brand"
                        value={ads[0]?.displayName || identity.displayName || ""}
                        maxLength={20}
                        onChange={(e) => {
                          if (ads[0]) {
                            updateAd(ads[0].id, { ...ads[0], displayName: e.target.value.slice(0, 20) });
                          }
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs font-medium text-muted-foreground">Call to Action</Label>
                      <select
                        className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                        value={ads[0]?.callToAction || "SHOP_NOW"}
                        onChange={(e) => {
                          if (ads[0]) {
                            updateAd(ads[0].id, { ...ads[0], callToAction: e.target.value as TikTokCTA });
                          }
                        }}
                      >
                        {CTA_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-muted-foreground">Landing Page URL</Label>
                    <Input
                      placeholder="https://yourstore.salla.sa"
                      value={ads[0]?.landingPageUrl || ""}
                      onChange={(e) => {
                        if (ads[0]) {
                          updateAd(ads[0].id, { ...ads[0], landingPageUrl: e.target.value });
                        }
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Dynamic formats automatically assemble Catalog Video, Single Video, and Carousel ad formats based on your optimization goals and audience behavior.
                </p>
              </div>
            ) : (
              /* Standard ads: manual upload (Video Shopping or non-catalog) */
              <>
                {ads.length === 0 ? (
                  <div className="flex flex-col gap-4">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">Choose an ad format to get started</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {catalogEnabled
                          ? "Add videos to showcase with your catalog products. Products will be attached as interactive cards."
                          : "Pick a format below. You can mix different formats and add more ads later."}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {AD_FORMAT_OPTIONS.filter((opt) => allowedFormats.includes(opt.value)).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => addAd(opt.value)}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all",
                            "border-border bg-card hover:border-[#a4ffe5] hover:bg-[#e6fff9]",
                            opt.value === "SPARK_AD" && "border-[#a4ffe5]/60 bg-[#e6fff9]/30"
                          )}
                        >
                          <div className={cn(
                            "flex size-10 items-center justify-center rounded-full",
                            opt.value === "SPARK_AD" ? "bg-[#a4ffe5]" : "bg-muted/60"
                          )}>
                            <span className={cn("[&>svg]:size-5", opt.value === "SPARK_AD" ? "text-[#004956]" : "text-muted-foreground")}>
                              {opt.icon}
                            </span>
                          </div>
                          <p className={cn("text-xs font-bold", opt.value === "SPARK_AD" ? "text-[#004956]" : "text-foreground")}>{opt.label}</p>
                          <p className="hidden text-[10px] leading-snug text-muted-foreground sm:block">{opt.desc}</p>
                          {opt.recommended && (
                            <span className="rounded-full bg-[#a4ffe5] px-2 py-0.5 text-[10px] font-medium text-[#004956]">Best</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Video Shopping: catalog product attachment note */}
                    {catalogEnabled && objectiveConfig.shoppingAdsType === "VIDEO_SHOPPING" && (
                      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.02] px-3 py-2">
                        <Tag className="size-3.5 shrink-0 text-primary" />
                        <p className="text-xs text-muted-foreground">
                          Products from your catalog will be attached to these ads as interactive product cards and tiles.
                        </p>
                      </div>
                    )}

                    {ads.map((ad, i) => (
  <AdPanel
  key={ad.id}
  ad={ad}
  adIndex={i}
  totalAds={ads.length}
  isActive={i === activeAdIdx}
  onSelect={() => setActiveAdIdx(i)}
  onUpdate={(next) => updateAd(ad.id, next)}
  onRemove={() => removeAd(ad.id)}
  onDuplicate={() => duplicateAd(ad.id)}
  allowedFormats={allowedFormats}
  isLeadGen={isLeadGen}
  isVideoViews={isVideoViews}
  isAppPromo={isAppPromo}
  />
                    ))}

                    {/* Add Another Ad */}
                    <div className="rounded-xl border-2 border-dashed border-border py-6">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex size-10 items-center justify-center rounded-full bg-[#e6fff9]">
                          <Plus className="size-5 text-[#004956]" />
                        </div>
                        <p className="text-sm font-bold text-[#004956]">Add Another Ad</p>
                        <p className="text-xs text-muted-foreground">A/B test different creatives or formats to find what works best</p>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 px-6 sm:grid-cols-4">
                        {AD_FORMAT_OPTIONS.filter((opt) => allowedFormats.includes(opt.value)).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => addAd(opt.value)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all",
                              "border-border bg-card hover:border-[#a4ffe5] hover:bg-[#e6fff9]",
                              opt.value === "SPARK_AD" && "border-[#a4ffe5]/60 bg-[#e6fff9]/30"
                            )}
                          >
                            <div className={cn(
                              "flex size-8 items-center justify-center rounded-full",
                              opt.value === "SPARK_AD" ? "bg-[#a4ffe5]" : "bg-muted/60"
                            )}>
                              <span className={cn("[&>svg]:size-4", opt.value === "SPARK_AD" ? "text-[#004956]" : "text-muted-foreground")}>
                                {opt.icon}
                              </span>
                            </div>
                            <span className={cn("text-[11px] font-bold", opt.value === "SPARK_AD" ? "text-[#004956]" : "text-foreground")}>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            </div>
          </div>

        </div>

        {/* ============ RIGHT COLUMN ============ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="sticky top-20 flex flex-col gap-4">

            {/* ---- 1. PHONE PREVIEW ---- */}
            <TikTokAdPreview
              ads={ads}
              activeAdIdx={activeAdIdx}
              setActiveAdIdx={setActiveAdIdx}
              activeAd={activeAd}
              identityDisplayName={identity.displayName}
              identityAvatarUrl={identity.avatarPreviewUrl}
            />

            {/* ---- 2. CAMPAIGN READINESS ---- */}
            <TikTokCampaignReadiness
              ads={ads}
              totalCreatives={totalCreatives}
              allChecks={allChecks}
              passingChecks={passingChecks}
              isCatalogListing={isCatalogListing}
              objective={campaign.objective.objective}
            />

            {/* ---- 2.5 LEAD GEN FORM SUMMARY ---- */}
            {isLeadGen && (
              <SectionCard className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardList className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Lead Form</Label>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Collection</span>
                    <span className="font-medium text-foreground">
                      {campaign.objective.leadOptimizationLocation === "INSTANT_FORM" ? "Instant Form" : "Website Form"}
                    </span>
                  </div>
                  {campaign.objective.leadOptimizationLocation === "INSTANT_FORM" && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Template</span>
                        <span className="font-medium text-foreground">
                          {FORM_TEMPLATES.find((t) => t.value === campaign.objective.instantForm.formTemplate)?.label ?? "---"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Intent</span>
                        <span className="font-medium text-foreground">
                          {campaign.objective.instantForm.formType === "HIGHER_INTENT" ? "Higher Intent" : "More Volume"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Info fields</span>
                        <span className="font-medium text-foreground">
                          {campaign.objective.instantForm.personalInfoFields.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Questions</span>
                        <span className="font-medium text-foreground">
                          {campaign.objective.instantForm.questions.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Privacy URL</span>
                        <span className={cn("font-medium", campaign.objective.instantForm.privacyPolicyUrl ? "text-foreground" : "text-red-600")}>
                          {campaign.objective.instantForm.privacyPolicyUrl ? "Set" : "Missing"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Company</span>
                        <span className={cn("font-medium", campaign.objective.instantForm.companyName ? "text-foreground" : "text-red-600")}>
                          {campaign.objective.instantForm.companyName || "Missing"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </SectionCard>
            )}

            {/* ---- 2.6 APP PROMO SUMMARY ---- */}
            {isAppPromo && (
              <SectionCard className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Smartphone className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">App Details</Label>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Platform</span>
                    <span className="font-medium text-foreground">
                      {campaign.objective.appSettings.appPlatform === "IOS" ? "iOS" : "Android"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">App Name</span>
                    <span className="font-medium text-foreground">
                      {campaign.objective.appSettings.appName || "---"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">App ID</span>
                    <span className={cn("font-mono font-medium", campaign.objective.appSettings.appId ? "text-foreground" : "text-red-600")}>
                      {campaign.objective.appSettings.appId || "Missing"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Download URL</span>
                    <span className={cn("max-w-[140px] truncate font-medium", campaign.objective.appSettings.appDownloadUrl ? "text-foreground" : "text-red-600")}>
                      {campaign.objective.appSettings.appDownloadUrl || "Missing"}
                    </span>
                  </div>
                </div>
              </SectionCard>
            )}


          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Next"
        nextDisabled={passingChecks < allChecks.length}
      />
    </TooltipProvider>
  );
}
