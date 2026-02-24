"use client";

import { useState, useMemo, useCallback } from "react";
import { useGoogleCampaign } from "@/lib/google/campaign-context";
import { OBJECTIVE_CONFIGS, type GoogleAssetGroup, type GoogleCreativeAsset, type ProductGroupNode, type ProductDimensionType, type DemandGenAd, type DemandGenAdGroup, createDemandGenAd, createDemandGenAdGroup, type GoogleSearchAd, type SearchAdGroup, type RSAHeadline, type RSADescription, type HeadlinePinPosition, type DescriptionPinPosition, type SearchSitelinkAsset, type SearchCalloutAsset, type SearchStructuredSnippet, STRUCTURED_SNIPPET_HEADERS, createSearchAd, createSearchAdGroup, type DisplayAdGroup, type GoogleDisplayAd, createDisplayAd, createDisplayAdGroup, type GoogleAppAd, createAppAd, type DemandGenAdAutomationType, type AssetAutomationStatus } from "@/lib/google/campaign-types";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Video,
  Type,
  Globe,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Eye,
  Layers,
  Monitor,
  Smartphone,
  Gauge,
  Link2,
  FileText,
  Building2,
  MousePointerClick,
  Copy,
  LayoutGrid,
  ShoppingCart,
  ShoppingBag,
  Tag,
  FolderTree,
  Filter,
  Store,
  TrendingUp,
  Package,
  Star,
  Mail,
  PlayCircle,
  Tv,
  GalleryHorizontal,
  Layout,
  Youtube,
  Target,
  ChevronDown,
  ChevronUp,
  Grip,
  MoreHorizontal,
  Search,
  Pin,
  ExternalLink,
  Hash,
  Megaphone,
  ListChecks,
} from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";

/* ================================================================== */
/*  Constants -- Asset Requirements per Google Ads API                 */
/* ================================================================== */

const ASSET_LIMITS = {
  headlines: { min: 3, max: 15, charLimit: 30 },
  longHeadlines: { min: 1, max: 5, charLimit: 90 },
  descriptions: { min: 2, max: 5, charLimit: 90 },
  images: { min: 1, max: 20, note: "Landscape 1.91:1 (min 600x314)" },
  squareImages: { min: 1, max: 20, note: "Square 1:1 (min 300x300)" },
  portraitImages: { min: 0, max: 20, note: "Portrait 4:5 (min 480x600)" },
  logos: { min: 1, max: 5, note: "Square 1:1 (min 128x128)" },
  landscapeLogos: { min: 0, max: 5, note: "Landscape 4:1 (min 512x128)" },
  videos: { min: 0, max: 5, note: "YouTube video URL" },
  businessName: { min: 1, max: 1, charLimit: 25 },
};

const CTA_OPTIONS = [
  { value: "AUTOMATED", label: "Automated (Recommended)" },
  { value: "LEARN_MORE", label: "Learn more" },
  { value: "SHOP_NOW", label: "Shop now" },
  { value: "SIGN_UP", label: "Sign up" },
  { value: "GET_QUOTE", label: "Get quote" },
  { value: "APPLY_NOW", label: "Apply now" },
  { value: "CONTACT_US", label: "Contact us" },
  { value: "BOOK_NOW", label: "Book now" },
  { value: "BUY_NOW", label: "Buy now" },
];

/* ================================================================== */
/*  Helpers                                                           */
/* ================================================================== */

function makeId() {
  return `ast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function newTextAsset(type: GoogleCreativeAsset["type"], text = ""): GoogleCreativeAsset {
  return { id: makeId(), type, text };
}

function newAssetGroup(): GoogleAssetGroup {
  return {
    id: `ag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    finalUrl: "",
    headlines: [newTextAsset("HEADLINE"), newTextAsset("HEADLINE"), newTextAsset("HEADLINE")],
    longHeadlines: [newTextAsset("LONG_HEADLINE")],
    descriptions: [newTextAsset("DESCRIPTION"), newTextAsset("DESCRIPTION")],
    images: [],
    logos: [],
    videos: [],
    businessName: "",
    callToAction: "AUTOMATED",
    displayPath1: "",
    displayPath2: "",
  };
}

/** Calculate Ad Strength score (0-100) mimicking Google's meter */
function calcAdStrength(ag: GoogleAssetGroup): { score: number; label: string; color: string } {
  let pts = 0;

  // Headlines (3 min, 5+ good, 10+ excellent)
  const hCount = ag.headlines.filter((h) => h.text && h.text.trim().length > 0).length;
  if (hCount >= 3) pts += 10;
  if (hCount >= 5) pts += 5;
  if (hCount >= 8) pts += 5;
  if (hCount >= 12) pts += 5;

  // Long headlines (1 min, 3+ good)
  const lhCount = ag.longHeadlines.filter((h) => h.text && h.text.trim().length > 0).length;
  if (lhCount >= 1) pts += 10;
  if (lhCount >= 3) pts += 5;

  // Descriptions (2 min, 4+ good)
  const dCount = ag.descriptions.filter((d) => d.text && d.text.trim().length > 0).length;
  if (dCount >= 2) pts += 10;
  if (dCount >= 4) pts += 5;

  // Images (need both landscape + square minimum)
  const imgCount = ag.images.length;
  if (imgCount >= 1) pts += 10;
  if (imgCount >= 3) pts += 5;
  if (imgCount >= 6) pts += 5;

  // Logos
  if (ag.logos.length >= 1) pts += 10;

  // Business name
  if (ag.businessName.trim().length > 0) pts += 10;

  // Final URL
  if (ag.finalUrl.trim().length > 0) pts += 5;

  // Videos (optional but add strength)
  if (ag.videos.length >= 1) pts += 5;
  if (ag.videos.length >= 3) pts += 5;

  // Unique headlines (variety bonus)
  const uniqueH = new Set(ag.headlines.map((h) => h.text?.trim().toLowerCase()).filter(Boolean));
  if (uniqueH.size >= 5) pts += 5;

  const score = Math.min(100, pts);
  if (score >= 80) return { score, label: "Excellent", color: "text-emerald-600" };
  if (score >= 60) return { score, label: "Good", color: "text-primary" };
  if (score >= 40) return { score, label: "Average", color: "text-amber-600" };
  return { score, label: "Poor", color: "text-destructive" };
}

/* ================================================================== */
/*  DEMAND GEN: Constants                                              */
/* ================================================================== */

/** Google Ads API v21 limits per DemandGen*AdInfo */
const DG_LIMITS = {
  /* ---- Multi-Asset ---- */
  multiAsset: {
    headlines: { min: 1, max: 5, charLimit: 30 },        // AdTextAsset, max display width 30
    descriptions: { min: 1, max: 5, charLimit: 90 },     // AdTextAsset, max display width 90
    businessName: { charLimit: 25 },
    images: { combinedMax: 20 },                          // All 4 aspect ratios combined
    logos: { min: 1, max: 5 },
  },
  /* ---- Carousel ---- */
  carousel: {
    headline: { charLimit: 30 },                          // Single headline
    description: { charLimit: 90 },                       // Single description
    businessName: { charLimit: 25 },
    cards: { min: 2, max: 10 },
    cardHeadline: { charLimit: 30 },
    logos: { min: 1, max: 1 },                            // Single logo_image
  },
  /* ---- Video Responsive ---- */
  videoResponsive: {
    headlines: { min: 1, max: 5, charLimit: 30 },        // short headline
    longHeadlines: { min: 1, max: 5, charLimit: 90 },
    descriptions: { min: 1, max: 5, charLimit: 90 },
    businessName: { charLimit: 25 },
    logos: { min: 1, max: 5 },
    videos: { min: 1, max: 5 },
  },
  /* ---- Image specs (applies to Multi-Asset) ---- */
  imageSpecs: [
    { ratio: "LANDSCAPE" as const, label: "Landscape", aspect: "1.91:1", minSize: "600x314", recommended: "1200x628" },
    { ratio: "SQUARE" as const, label: "Square", aspect: "1:1", minSize: "300x300", recommended: "1200x1200" },
    { ratio: "PORTRAIT" as const, label: "Portrait", aspect: "4:5", minSize: "480x600", recommended: "960x1200" },
    { ratio: "TALL_PORTRAIT" as const, label: "Tall Portrait", aspect: "9:16", minSize: "600x1067", recommended: "1080x1920" },
  ],
  /** Logo: 1:1 aspect, min 128x128, recommended 1200x1200 */
  logo: { minSize: "128x128", recommended: "1200x1200" },
};

const DG_PREVIEW_CHANNELS = [
  { key: "youtube_feed", label: "YouTube Feed", icon: <Youtube className="size-3.5" /> },
  { key: "youtube_shorts", label: "Shorts", icon: <Smartphone className="size-3.5" /> },
  { key: "discover", label: "Discover", icon: <Globe className="size-3.5" /> },
  { key: "gmail", label: "Gmail", icon: <Mail className="size-3.5" /> },
] as const;

const DG_CHANNEL_DEFS = [
  { key: "youtubeInStream" as const, label: "YouTube In-Stream", icon: <PlayCircle className="size-3.5" />, desc: "Skippable ads before/during videos" },
  { key: "youtubeInFeed" as const, label: "YouTube In-Feed", icon: <Youtube className="size-3.5" />, desc: "Appears in YouTube search & feeds" },
  { key: "youtubeShorts" as const, label: "YouTube Shorts", icon: <Smartphone className="size-3.5" />, desc: "Between Shorts in the feed" },
  { key: "discover" as const, label: "Discover", icon: <Globe className="size-3.5" />, desc: "Google Discover feed" },
  { key: "gmail" as const, label: "Gmail", icon: <Mail className="size-3.5" />, desc: "Promotions & Social tabs" },
  { key: "display" as const, label: "Display", icon: <Layout className="size-3.5" />, desc: "Display Network sites" },
] as const;

const DG_AD_FORMAT_OPTIONS = [
  { value: "MULTI_ASSET" as const, label: "Multi-Asset", icon: <ImageIcon className="size-4" />, api: "DemandGenMultiAssetAdInfo" },
  { value: "CAROUSEL" as const, label: "Carousel", icon: <GalleryHorizontal className="size-4" />, api: "DemandGenCarouselAdInfo" },
  { value: "VIDEO_RESPONSIVE" as const, label: "Video Responsive", icon: <Video className="size-4" />, api: "DemandGenVideoResponsiveAdInfo" },
] as const;

/* ================================================================== */
/*  DEMAND GEN: Ad Strength Calculator (per ad)                       */
/* ================================================================== */

function calcDgAdStrength(ad: DemandGenAd): { score: number; label: string; color: string; pct: number } {
  let pts = 0;
  if (ad.adType === "MULTI_ASSET") {
    const fH = ad.headlines.filter((h) => h.text.trim()).length;
    const fD = ad.descriptions.filter((d) => d.text.trim()).length;
    if (fH >= 1) pts += 15; if (fH >= 3) pts += 10; if (fH >= 5) pts += 5;
    if (fD >= 1) pts += 15; if (fD >= 3) pts += 10; if (fD >= 5) pts += 5;
    if (ad.images.length >= 1) pts += 10; if (ad.images.length >= 3) pts += 5; if (ad.images.length >= 5) pts += 5;
    if (ad.logos.length >= 1) pts += 10;
  } else if (ad.adType === "CAROUSEL") {
    if (ad.carouselHeadline.trim()) pts += 15;
    if (ad.carouselDescription.trim()) pts += 15;
    const filledCards = ad.carouselCards.filter((c) => c.headline.trim() && c.finalUrl.trim()).length;
    if (filledCards >= 2) pts += 15; if (filledCards >= 4) pts += 10; if (filledCards >= 7) pts += 5;
    if (ad.logos.length >= 1) pts += 15;
  } else {
    const fH = ad.headlines.filter((h) => h.text.trim()).length;
    const fLH = ad.longHeadlines.filter((h) => h.text.trim()).length;
    const fD = ad.descriptions.filter((d) => d.text.trim()).length;
    if (fH >= 1) pts += 10; if (fH >= 3) pts += 5;
    if (fLH >= 1) pts += 10; if (fLH >= 3) pts += 5;
    if (fD >= 1) pts += 10; if (fD >= 3) pts += 5;
    if (ad.videos.length >= 1) pts += 15;
    if (ad.logos.length >= 1) pts += 10;
  }
  if (ad.businessName.trim()) pts += 5;
  if (ad.finalUrl.trim()) pts += 5;
  const score = Math.min(100, pts);
  if (score >= 80) return { score, label: "Excellent", color: "text-emerald-600", pct: 100 };
  if (score >= 60) return { score, label: "Good", color: "text-emerald-500", pct: 75 };
  if (score >= 40) return { score, label: "Average", color: "text-amber-500", pct: 50 };
  return { score, label: "Poor", color: "text-red-500", pct: 25 };
}

/* ================================================================== */
/*  DEMAND GEN: Text Row Helper                                       */
/* ================================================================== */

function DgTextRows({
  items, max, charLimit, labelPrefix, onUpdate,
}: {
  items: { text: string }[];
  max: number;
  charLimit: number;
  labelPrefix: string;
  onUpdate: (next: { text: string }[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.slice(0, max).map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-4 text-center text-[10px] text-muted-foreground">{i + 1}</span>
          <Input
            placeholder={`${labelPrefix} ${i + 1}`}
            value={item.text}
            onChange={(e) => {
              const next = [...items];
              next[i] = { text: e.target.value.slice(0, charLimit) };
              onUpdate(next);
            }}
            className="h-8 flex-1 text-xs"
          />
          <span className="w-9 text-right text-[9px] text-muted-foreground">{item.text.length}/{charLimit}</span>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  DEMAND GEN: Single Ad Editor (collapsible card)                   */
/* ================================================================== */

function DgAdEditor({
  ad, adIndex, totalAds, onUpdate, onDelete, onDuplicate,
}: {
  ad: DemandGenAd;
  adIndex: number;
  totalAds: number;
  onUpdate: (patch: Partial<DemandGenAd>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(adIndex === 0);
  const strength = calcDgAdStrength(ad);
  const isMultiAsset = ad.adType === "MULTI_ASSET";
  const isCarousel = ad.adType === "CAROUSEL";
  const isVideo = ad.adType === "VIDEO_RESPONSIVE";

  /* Summary counts for collapsed header */
  const summaryText = isMultiAsset
    ? `${ad.headlines.filter((h) => h.text.trim()).length} headlines, ${ad.descriptions.filter((d) => d.text.trim()).length} desc, ${ad.images.length} images`
    : isCarousel
      ? `${ad.carouselCards.filter((c) => c.headline.trim()).length}/${ad.carouselCards.length} cards filled`
      : `${ad.headlines.filter((h) => h.text.trim()).length} headlines, ${ad.videos.length} videos`;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-all">
      {/* ---- Collapsed header ---- */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(!expanded); } }}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
      >
        <div className={cn(
          "flex size-8 items-center justify-center rounded-lg text-xs font-bold",
          strength.pct >= 75 ? "bg-emerald-100 text-emerald-700" : strength.pct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
        )}>
          {adIndex + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{ad.name || `Ad ${adIndex + 1}`}</span>
            <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">
              {DG_AD_FORMAT_OPTIONS.find((f) => f.value === ad.adType)?.label ?? ad.adType}
            </Badge>
            <span className={cn("text-[10px] font-medium", strength.color)}>{strength.label}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{summaryText}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Duplicate ad">
            <Copy className="size-3.5" />
          </button>
          {totalAds > 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600" title="Delete ad">
              <Trash2 className="size-3.5" />
            </button>
          )}
          {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </div>

      {/* ---- Expanded body ---- */}
      {expanded && (
        <div className="border-t border-border px-4 pb-5 pt-4">
          {/* Row 1: Ad Name + Format */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 text-xs font-semibold text-foreground">Ad Name</Label>
              <Input value={ad.name} onChange={(e) => onUpdate({ name: e.target.value })} placeholder="Ad name" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="mb-1 text-xs font-semibold text-foreground">Ad Format</Label>
              <div className="flex gap-1.5">
                {DG_AD_FORMAT_OPTIONS.map((fmt) => (
                  <button key={fmt.value} type="button" onClick={() => onUpdate({ adType: fmt.value })}
                    className={cn("flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                      ad.adType === fmt.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    )}>
                    {fmt.icon} {fmt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/*  MULTI-ASSET FORMAT                                          */}
          {/* ============================================================ */}
          {isMultiAsset && (
            <>
              {/* Headlines (max 5, 30 chars) */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Type className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Headlines</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{ad.headlines.filter((h) => h.text.trim()).length}/{DG_LIMITS.multiAsset.headlines.max}</Badge>
                  <InfoTip text="Max display width 30 chars. Google tests combinations. At least 1 required, 5 recommended for Excellent ad strength." />
                </div>
                <DgTextRows items={ad.headlines} max={DG_LIMITS.multiAsset.headlines.max} charLimit={DG_LIMITS.multiAsset.headlines.charLimit} labelPrefix="Headline" onUpdate={(next) => onUpdate({ headlines: next })} />
              </div>

              {/* Descriptions (max 5, 90 chars) */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Descriptions</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{ad.descriptions.filter((d) => d.text.trim()).length}/{DG_LIMITS.multiAsset.descriptions.max}</Badge>
                </div>
                <DgTextRows items={ad.descriptions} max={DG_LIMITS.multiAsset.descriptions.max} charLimit={DG_LIMITS.multiAsset.descriptions.charLimit} labelPrefix="Description" onUpdate={(next) => onUpdate({ descriptions: next })} />
              </div>

              {/* Images: 4 aspect ratios, combined max 20 */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <ImageIcon className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Marketing Images</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{ad.images.length}/{DG_LIMITS.multiAsset.images.combinedMax}</Badge>
                  <InfoTip text="All 4 aspect ratios share a combined maximum of 20 images. At least 1 landscape or square is required." />
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {DG_LIMITS.imageSpecs.map((spec) => {
                    const count = ad.images.filter((img) => img.aspectRatio === spec.ratio).length;
                    return (
                      <div key={spec.ratio} className="flex flex-col items-center gap-1.5">
                        <div className={cn(
                          "flex w-full items-center justify-center rounded-xl border-2 border-dashed bg-muted/20 transition-colors hover:border-primary/40",
                          spec.ratio === "TALL_PORTRAIT" ? "aspect-[9/16]" : spec.ratio === "PORTRAIT" ? "aspect-[4/5]" : spec.ratio === "SQUARE" ? "aspect-square" : "aspect-video"
                        )}>
                          <div className="text-center">
                            <Plus className="mx-auto size-5 text-muted-foreground/30" />
                            {count > 0 && <p className="mt-0.5 text-[9px] font-medium text-primary">{count} added</p>}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-medium text-foreground">{spec.label}</p>
                          <p className="text-[8px] text-muted-foreground">{spec.aspect} | min {spec.minSize}</p>
                          <p className="text-[8px] text-muted-foreground">Rec: {spec.recommended}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Logos (max 5) */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Building2 className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Logo</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{ad.logos.length}/{DG_LIMITS.multiAsset.logos.max}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 transition-colors hover:border-primary/40">
                    <Plus className="size-4 text-muted-foreground/30" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">1:1 aspect ratio, min {DG_LIMITS.logo.minSize}</p>
                    <p className="text-[10px] text-muted-foreground">Recommended: {DG_LIMITS.logo.recommended}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/*  CAROUSEL FORMAT                                             */}
          {/* ============================================================ */}
          {isCarousel && (
            <>
              {/* Single Headline */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Type className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Headline</Label>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">Required</Badge>
                  <InfoTip text="Single headline for the carousel ad. Max display width 30 chars." />
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Your carousel headline" value={ad.carouselHeadline} onChange={(e) => onUpdate({ carouselHeadline: e.target.value.slice(0, DG_LIMITS.carousel.headline.charLimit) })} className="h-9 flex-1 text-sm" />
                  <span className="w-9 text-right text-[9px] text-muted-foreground">{ad.carouselHeadline.length}/{DG_LIMITS.carousel.headline.charLimit}</span>
                </div>
              </div>

              {/* Single Description */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Description</Label>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">Required</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Describe your carousel ad" value={ad.carouselDescription} onChange={(e) => onUpdate({ carouselDescription: e.target.value.slice(0, DG_LIMITS.carousel.description.charLimit) })} className="h-9 flex-1 text-sm" />
                  <span className="w-9 text-right text-[9px] text-muted-foreground">{ad.carouselDescription.length}/{DG_LIMITS.carousel.description.charLimit}</span>
                </div>
              </div>

              {/* Logo (exactly 1) */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Building2 className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Logo</Label>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">Required</Badge>
                  <InfoTip text="Carousel requires exactly 1 logo image. 1:1 aspect, min 128x128." />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 transition-colors hover:border-primary/40">
                    <Plus className="size-4 text-muted-foreground/30" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">1:1 aspect, min {DG_LIMITS.logo.minSize}</p>
                </div>
              </div>

              {/* Carousel Cards (2-10) */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GalleryHorizontal className="size-3.5 text-primary" />
                    <Label className="text-xs font-semibold text-foreground">Carousel Cards</Label>
                    <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{ad.carouselCards.length}/{DG_LIMITS.carousel.cards.max}</Badge>
                  </div>
                  {ad.carouselCards.length < DG_LIMITS.carousel.cards.max && (
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]" onClick={() => onUpdate({ carouselCards: [...ad.carouselCards, { id: `card-${Date.now()}`, headline: "", imageUrl: "", finalUrl: "", callToAction: "AUTOMATED" }] })}>
                      <Plus className="size-3" /> Add Card
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-2.5">
                  {ad.carouselCards.map((card, ci) => (
                    <div key={card.id} className="rounded-lg border border-border bg-muted/10 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-foreground">Card {ci + 1}</span>
                        {ad.carouselCards.length > DG_LIMITS.carousel.cards.min && (
                          <button type="button" onClick={() => onUpdate({ carouselCards: ad.carouselCards.filter((_, j) => j !== ci) })} className="rounded p-1 text-muted-foreground hover:text-red-500">
                            <X className="size-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-3">
                        {/* Card image upload */}
                        <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background transition-colors hover:border-primary/40">
                          {card.imageUrl ? (
                            <img src={card.imageUrl} alt="" className="size-full rounded-lg object-cover" />
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="mx-auto size-5 text-muted-foreground/30" />
                              <p className="mt-0.5 text-[8px] text-muted-foreground">1200x628</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <Input placeholder={`Card ${ci + 1} headline`} value={card.headline} onChange={(e) => {
                              const next = [...ad.carouselCards]; next[ci] = { ...next[ci], headline: e.target.value.slice(0, DG_LIMITS.carousel.cardHeadline.charLimit) }; onUpdate({ carouselCards: next });
                            }} className="h-7 flex-1 text-xs" />
                            <span className="text-[8px] text-muted-foreground">{card.headline.length}/{DG_LIMITS.carousel.cardHeadline.charLimit}</span>
                          </div>
                          <Input placeholder="https://store.salla.sa/product" value={card.finalUrl} onChange={(e) => {
                            const next = [...ad.carouselCards]; next[ci] = { ...next[ci], finalUrl: e.target.value }; onUpdate({ carouselCards: next });
                          }} className="h-7 text-xs" />
                          <div className="flex flex-wrap gap-1">
                            {CTA_OPTIONS.slice(0, 4).map((c) => (
                              <button key={c.value} type="button" onClick={() => {
                                const next = [...ad.carouselCards]; next[ci] = { ...next[ci], callToAction: c.value }; onUpdate({ carouselCards: next });
                              }} className={cn("rounded border px-1.5 py-0.5 text-[8px] font-medium transition-colors",
                                card.callToAction === c.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                              )}>
                                {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/*  VIDEO RESPONSIVE FORMAT                                     */}
          {/* ============================================================ */}
          {isVideo && (
            <>
              {/* Videos (min 1, max 5) */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Video className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">YouTube Videos</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{ad.videos.length}/{DG_LIMITS.videoResponsive.videos.max}</Badge>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">Required</Badge>
                  <InfoTip text="Add YouTube video URLs. At least 1 required, up to 5. Videos are served on In-Stream, In-Feed, and Shorts." />
                </div>
                {ad.videos.map((v, vi) => (
                  <div key={v.id} className="mb-1.5 flex items-center gap-2">
                    <PlayCircle className="size-4 text-muted-foreground" />
                    <Input value={v.youtubeUrl} onChange={(e) => {
                      const next = [...ad.videos]; next[vi] = { ...next[vi], youtubeUrl: e.target.value }; onUpdate({ videos: next });
                    }} placeholder="https://youtube.com/watch?v=..." className="h-8 flex-1 text-xs" />
                    <button type="button" onClick={() => onUpdate({ videos: ad.videos.filter((_, j) => j !== vi) })} className="text-muted-foreground hover:text-red-500"><X className="size-3.5" /></button>
                  </div>
                ))}
                {ad.videos.length < DG_LIMITS.videoResponsive.videos.max && (
                  <Button variant="outline" size="sm" className="mt-1 gap-1 text-xs" onClick={() => onUpdate({ videos: [...ad.videos, { id: `vid-${Date.now()}`, youtubeUrl: "" }] })}>
                    <Plus className="size-3" /> Add Video
                  </Button>
                )}
              </div>

              {/* Headlines (max 5, 30 chars) */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Type className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Short Headlines</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{ad.headlines.filter((h) => h.text.trim()).length}/{DG_LIMITS.videoResponsive.headlines.max}</Badge>
                </div>
                <DgTextRows items={ad.headlines} max={DG_LIMITS.videoResponsive.headlines.max} charLimit={DG_LIMITS.videoResponsive.headlines.charLimit} labelPrefix="Headline" onUpdate={(next) => onUpdate({ headlines: next })} />
              </div>

              {/* Long Headlines (max 5, 90 chars) -- Video Responsive only */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Long Headlines</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{ad.longHeadlines.filter((h) => h.text.trim()).length}/{DG_LIMITS.videoResponsive.longHeadlines.max}</Badge>
                  <InfoTip text="Long headlines appear in larger placements. Only available for Video Responsive format." />
                </div>
                <DgTextRows items={ad.longHeadlines} max={DG_LIMITS.videoResponsive.longHeadlines.max} charLimit={DG_LIMITS.videoResponsive.longHeadlines.charLimit} labelPrefix="Long headline" onUpdate={(next) => onUpdate({ longHeadlines: next })} />
              </div>

              {/* Descriptions (max 5, 90 chars) */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Descriptions</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{ad.descriptions.filter((d) => d.text.trim()).length}/{DG_LIMITS.videoResponsive.descriptions.max}</Badge>
                </div>
                <DgTextRows items={ad.descriptions} max={DG_LIMITS.videoResponsive.descriptions.max} charLimit={DG_LIMITS.videoResponsive.descriptions.charLimit} labelPrefix="Description" onUpdate={(next) => onUpdate({ descriptions: next })} />
              </div>

              {/* Breadcrumbs (URL display path) */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Globe className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">URL Display Path</Label>
                  <InfoTip text="Optional. Appears next to the displayed URL in the ad." />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">store.salla.sa /</span>
                  <Input value={ad.breadcrumb1} onChange={(e) => onUpdate({ breadcrumb1: e.target.value.slice(0, 15) })} placeholder="path1" className="h-8 w-24 text-xs" />
                  <span className="text-xs text-muted-foreground">/</span>
                  <Input value={ad.breadcrumb2} onChange={(e) => onUpdate({ breadcrumb2: e.target.value.slice(0, 15) })} placeholder="path2" className="h-8 w-24 text-xs" />
                </div>
              </div>

              {/* Logo */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Building2 className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Logo</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{ad.logos.length}/{DG_LIMITS.videoResponsive.logos.max}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 transition-colors hover:border-primary/40">
                    <Plus className="size-4 text-muted-foreground/30" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">1:1 aspect, min {DG_LIMITS.logo.minSize}</p>
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/*  SHARED: Business Name, Final URL, CTA                       */}
          {/* ============================================================ */}
          <div className="mt-1 border-t border-border pt-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Shared Settings</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 text-[11px] font-semibold text-foreground">Business Name <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-2">
                  <Input value={ad.businessName} onChange={(e) => onUpdate({ businessName: e.target.value.slice(0, 25) })} placeholder="Store name" className="h-8 flex-1 text-xs" />
                  <span className="text-[9px] text-muted-foreground">{ad.businessName.length}/25</span>
                </div>
              </div>
              <div>
                <Label className="mb-1 text-[11px] font-semibold text-foreground">Final URL <span className="text-red-500">*</span></Label>
                <Input value={ad.finalUrl} onChange={(e) => onUpdate({ finalUrl: e.target.value })} placeholder="https://store.salla.sa" className="h-8 text-xs" />
              </div>
            </div>
            <div className="mt-3">
              <Label className="mb-1.5 text-[11px] font-semibold text-foreground">Call to Action</Label>
              <div className="flex flex-wrap gap-1">
                {CTA_OPTIONS.map((c) => (
                  <button key={c.value} type="button" onClick={() => onUpdate({ callToAction: c.value })}
                    className={cn("rounded-md border px-2 py-1 text-[10px] font-medium transition-colors",
                      ad.callToAction === c.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    )}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  SEARCH: RSA Strength Calculator                                   */
/* ================================================================== */

function calcRsaStrength(ad: GoogleSearchAd, keywordCount: number): { score: number; label: string; color: string; pct: number } {
  let pts = 0;
  const fH = ad.headlines.filter((h) => h.text.trim()).length;
  const fD = ad.descriptions.filter((d) => d.text.trim()).length;
  if (fH >= 3) pts += 15; if (fH >= 5) pts += 10; if (fH >= 8) pts += 10; if (fH >= 15) pts += 5;
  if (fD >= 2) pts += 15; if (fD >= 4) pts += 10;
  if (ad.finalUrl.trim()) pts += 10;
  if (ad.displayPath1.trim()) pts += 5;
  // Pinning bonus: none pinned or 2+ per position
  const pinnedHeadlines = ad.headlines.filter((h) => h.pinnedPosition !== null);
  if (pinnedHeadlines.length === 0 || pinnedHeadlines.length >= 2) pts += 10;
  if (keywordCount >= 10) pts += 10;
  const score = Math.min(100, pts);
  if (score >= 80) return { score, label: "Excellent", color: "text-emerald-600", pct: 100 };
  if (score >= 60) return { score, label: "Good", color: "text-emerald-500", pct: 75 };
  if (score >= 40) return { score, label: "Average", color: "text-amber-500", pct: 50 };
  return { score, label: "Poor", color: "text-red-500", pct: 25 };
}

/* ================================================================== */
/*  SEARCH: RSA Constants                                             */
/* ================================================================== */

const RSA_LIMITS = {
  headlines: { min: 3, max: 15, charLimit: 30 },
  descriptions: { min: 2, max: 4, charLimit: 90 },
  displayPath: { charLimit: 15 },
  sitelink: { linkText: 25, desc: 35 },
  callout: { charLimit: 25 },
  snippet: { valueLimit: 25, minValues: 3, maxValues: 10 },
};

/* ================================================================== */
/*  SEARCH: Single RSA Editor (collapsible)                           */
/* ================================================================== */

function RsaEditor({
  ad, adIndex, totalAds, keywordCount, onUpdate, onDelete, onDuplicate,
}: {
  ad: GoogleSearchAd;
  adIndex: number;
  totalAds: number;
  keywordCount: number;
  onUpdate: (patch: Partial<GoogleSearchAd>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(adIndex === 0);
  const strength = calcRsaStrength(ad, keywordCount);
  const fH = ad.headlines.filter((h) => h.text.trim()).length;
  const fD = ad.descriptions.filter((d) => d.text.trim()).length;

  const updateHeadline = (id: string, patch: Partial<RSAHeadline>) => {
    onUpdate({ headlines: ad.headlines.map((h) => h.id === id ? { ...h, ...patch } : h) });
  };
  const updateDescription = (id: string, patch: Partial<RSADescription>) => {
    onUpdate({ descriptions: ad.descriptions.map((d) => d.id === id ? { ...d, ...patch } : d) });
  };
  const addHeadline = () => {
    if (ad.headlines.length >= RSA_LIMITS.headlines.max) return;
    onUpdate({ headlines: [...ad.headlines, { id: `h-${Date.now()}`, text: "", pinnedPosition: null }] });
  };
  const addDescription = () => {
    if (ad.descriptions.length >= RSA_LIMITS.descriptions.max) return;
    onUpdate({ descriptions: [...ad.descriptions, { id: `d-${Date.now()}`, text: "", pinnedPosition: null }] });
  };
  const removeHeadline = (id: string) => {
    if (ad.headlines.length <= RSA_LIMITS.headlines.min) return;
    onUpdate({ headlines: ad.headlines.filter((h) => h.id !== id) });
  };
  const removeDescription = (id: string) => {
    if (ad.descriptions.length <= RSA_LIMITS.descriptions.min) return;
    onUpdate({ descriptions: ad.descriptions.filter((d) => d.id !== id) });
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-all">
      {/* Collapsed header */}
      <div role="button" tabIndex={0} onClick={() => setExpanded(!expanded)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(!expanded); } }} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left">
        <div className={cn("flex size-8 items-center justify-center rounded-lg text-xs font-bold",
          strength.pct >= 75 ? "bg-emerald-100 text-emerald-700" : strength.pct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
        )}>
          {adIndex + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{ad.name || `RSA ${adIndex + 1}`}</span>
            <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">RSA</Badge>
            <span className={cn("text-[10px] font-medium", strength.color)}>{strength.label}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{fH} headline{fH !== 1 ? "s" : ""}, {fD} description{fD !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Duplicate"><Copy className="size-3.5" /></button>
          {totalAds > 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="size-3.5" /></button>
          )}
          {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-5 pt-4">
          {/* Ad Name */}
          <div className="mb-5">
            <Label className="mb-1 text-xs font-semibold text-foreground">Ad Name</Label>
            <Input value={ad.name} onChange={(e) => onUpdate({ name: e.target.value })} placeholder="Responsive Search Ad 1" className="h-9 text-sm" />
          </div>

          {/* Headlines (3-15, 30 chars, pinnable) */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="size-3.5 text-primary" />
                <Label className="text-xs font-semibold text-foreground">Headlines</Label>
                <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{fH}/{RSA_LIMITS.headlines.max}</Badge>
                <InfoTip text="Min 3, max 15 headlines (30 chars each). Google combines 3 at a time. Pin to force a headline into a specific position." />
              </div>
              {ad.headlines.length < RSA_LIMITS.headlines.max && (
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addHeadline}><Plus className="size-3" /> Add</Button>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {ad.headlines.map((h, i) => (
                <div key={h.id} className="flex items-center gap-1.5">
                  <span className="w-4 text-center text-[10px] text-muted-foreground">{i + 1}</span>
                  <Input placeholder={`Headline ${i + 1}`} value={h.text} onChange={(e) => updateHeadline(h.id, { text: e.target.value.slice(0, RSA_LIMITS.headlines.charLimit) })} className="h-8 flex-1 text-xs" />
                  <Select value={h.pinnedPosition === null ? "none" : String(h.pinnedPosition)} onValueChange={(v) => updateHeadline(h.id, { pinnedPosition: v === "none" ? null : (Number(v) as HeadlinePinPosition) })}>
                    <SelectTrigger className="h-8 w-[90px] text-[10px]">
                      <Pin className="mr-1 size-3 text-muted-foreground" />
                      <SelectValue placeholder="Pin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Pin</SelectItem>
                      <SelectItem value="1">Pos 1</SelectItem>
                      <SelectItem value="2">Pos 2</SelectItem>
                      <SelectItem value="3">Pos 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="w-9 text-right text-[9px] text-muted-foreground">{h.text.length}/{RSA_LIMITS.headlines.charLimit}</span>
                  {ad.headlines.length > RSA_LIMITS.headlines.min && (
                    <button type="button" onClick={() => removeHeadline(h.id)} className="text-muted-foreground hover:text-red-500"><X className="size-3" /></button>
                  )}
                </div>
              ))}
            </div>
            {fH < RSA_LIMITS.headlines.min && (
              <p className="mt-1 text-[10px] text-red-500">At least {RSA_LIMITS.headlines.min} headlines required</p>
            )}
          </div>

          {/* Descriptions (2-4, 90 chars, pinnable) */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-3.5 text-primary" />
                <Label className="text-xs font-semibold text-foreground">Descriptions</Label>
                <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{fD}/{RSA_LIMITS.descriptions.max}</Badge>
                <InfoTip text="Min 2, max 4 descriptions (90 chars each). Google shows 2 at a time. Pin to force into position 1 or 2." />
              </div>
              {ad.descriptions.length < RSA_LIMITS.descriptions.max && (
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addDescription}><Plus className="size-3" /> Add</Button>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {ad.descriptions.map((d, i) => (
                <div key={d.id} className="flex items-center gap-1.5">
                  <span className="w-4 text-center text-[10px] text-muted-foreground">{i + 1}</span>
                  <Textarea placeholder={`Description ${i + 1}`} value={d.text} onChange={(e) => updateDescription(d.id, { text: e.target.value.slice(0, RSA_LIMITS.descriptions.charLimit) })} className="min-h-[2rem] flex-1 resize-none text-xs" rows={1} />
                  <Select value={d.pinnedPosition === null ? "none" : String(d.pinnedPosition)} onValueChange={(v) => updateDescription(d.id, { pinnedPosition: v === "none" ? null : (Number(v) as DescriptionPinPosition) })}>
                    <SelectTrigger className="h-8 w-[90px] text-[10px]">
                      <Pin className="mr-1 size-3 text-muted-foreground" />
                      <SelectValue placeholder="Pin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Pin</SelectItem>
                      <SelectItem value="1">Pos 1</SelectItem>
                      <SelectItem value="2">Pos 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="w-9 text-right text-[9px] text-muted-foreground">{d.text.length}/{RSA_LIMITS.descriptions.charLimit}</span>
                  {ad.descriptions.length > RSA_LIMITS.descriptions.min && (
                    <button type="button" onClick={() => removeDescription(d.id)} className="text-muted-foreground hover:text-red-500"><X className="size-3" /></button>
                  )}
                </div>
              ))}
            </div>
            {fD < RSA_LIMITS.descriptions.min && (
              <p className="mt-1 text-[10px] text-red-500">At least {RSA_LIMITS.descriptions.min} descriptions required</p>
            )}
          </div>

          {/* Final URL + Display Path */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 text-[11px] font-semibold text-foreground">Final URL <span className="text-red-500">*</span></Label>
              <Input value={ad.finalUrl} onChange={(e) => onUpdate({ finalUrl: e.target.value })} placeholder="https://store.salla.sa" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="mb-1 text-[11px] font-semibold text-foreground">Display Path</Label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">salla.sa/</span>
                <Input value={ad.displayPath1} onChange={(e) => onUpdate({ displayPath1: e.target.value.slice(0, RSA_LIMITS.displayPath.charLimit) })} placeholder="path1" className="h-8 w-20 text-xs" />
                <span className="text-[10px] text-muted-foreground">/</span>
                <Input value={ad.displayPath2} onChange={(e) => onUpdate({ displayPath2: e.target.value.slice(0, RSA_LIMITS.displayPath.charLimit) })} placeholder="path2" className="h-8 w-20 text-xs" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  APP: App Ad Creative Editor                                       */
/* ================================================================== */

const APP_AD_LIMITS = {
  headline: { min: 1, max: 5, charLimit: 30 },
  description: { min: 1, max: 5, charLimit: 90 },
  mandatoryAdText: { min: 1, max: 1, charLimit: 100 },
  images: { min: 0, max: 20 },
  youtubeVideos: { min: 0, max: 20 },
};

function calcAppAdStrength(ad: GoogleAppAd): { label: string; color: string; pct: number } {
  let pts = 0;
  if (ad.mandatoryAdText.trim()) pts += 20;
  const filledH = ad.headlines.filter((h) => h.text.trim()).length;
  pts += Math.min(filledH, 5) * 8; // 40 max
  const filledD = ad.descriptions.filter((d) => d.text.trim()).length;
  pts += Math.min(filledD, 5) * 5; // 25 max
  if (ad.images.length > 0) pts += 10;
  if (ad.youtubeVideos.filter(Boolean).length > 0) pts += 5;
  if (pts >= 90) return { label: "Excellent", color: "text-emerald-600", pct: Math.min(pts, 100) };
  if (pts >= 65) return { label: "Good", color: "text-blue-600", pct: pts };
  if (pts >= 40) return { label: "Average", color: "text-amber-600", pct: pts };
  return { label: "Incomplete", color: "text-red-500", pct: pts };
}

function AppCreativeEditor() {
  const { campaign, setStep, updateNested } = useGoogleCampaign();
  const appAds = campaign.creative.appAds ?? [];
  const [activeAdIdx, setActiveAdIdx] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const safeAds = appAds.length > 0 ? appAds : [createAppAd(1)];
  const currentAd = safeAds[activeAdIdx] ?? safeAds[0];
  const strength = calcAppAdStrength(currentAd);

  const updateAppAds = (ads: GoogleAppAd[]) => updateNested("creative", { appAds: ads });
  const updateCurrentAd = (patch: Partial<GoogleAppAd>) => {
    const ads = safeAds.map((a, i) => i === activeAdIdx ? { ...a, ...patch } : a);
    updateAppAds(ads);
  };

  const addAd = () => {
    const ads = [...safeAds, createAppAd(safeAds.length + 1)];
    updateAppAds(ads);
    setActiveAdIdx(ads.length - 1);
  };
  const deleteAd = (idx: number) => {
    if (safeAds.length <= 1) return;
    const ads = safeAds.filter((_, i) => i !== idx);
    updateAppAds(ads);
    setActiveAdIdx(Math.min(activeAdIdx, ads.length - 1));
  };
  const duplicateAd = (idx: number) => {
    const source = safeAds[idx];
    const dupe: GoogleAppAd = {
      ...source,
      id: `app-ad-${Date.now()}`,
      name: `${source.name} (copy)`,
      headlines: source.headlines.map((h) => ({ ...h, id: `ah-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
      descriptions: source.descriptions.map((d) => ({ ...d, id: `ad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    };
    const ads = [...safeAds, dupe];
    updateAppAds(ads);
    setActiveAdIdx(ads.length - 1);
  };

  /* Headline helpers */
  const updateHeadline = (idx: number, text: string) => {
    const next = currentAd.headlines.map((h, i) => i === idx ? { ...h, text: text.slice(0, APP_AD_LIMITS.headline.charLimit) } : h);
    updateCurrentAd({ headlines: next });
  };
  const addHeadline = () => {
    if (currentAd.headlines.length >= APP_AD_LIMITS.headline.max) return;
    updateCurrentAd({ headlines: [...currentAd.headlines, { id: `ah-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: "" }] });
  };
  const removeHeadline = (idx: number) => {
    if (currentAd.headlines.length <= APP_AD_LIMITS.headline.min) return;
    updateCurrentAd({ headlines: currentAd.headlines.filter((_, i) => i !== idx) });
  };

  /* Description helpers */
  const updateDescription = (idx: number, text: string) => {
    const next = currentAd.descriptions.map((d, i) => i === idx ? { ...d, text: text.slice(0, APP_AD_LIMITS.description.charLimit) } : d);
    updateCurrentAd({ descriptions: next });
  };
  const addDescription = () => {
    if (currentAd.descriptions.length >= APP_AD_LIMITS.description.max) return;
    updateCurrentAd({ descriptions: [...currentAd.descriptions, { id: `ad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: "" }] });
  };
  const removeDescription = (idx: number) => {
    if (currentAd.descriptions.length <= APP_AD_LIMITS.description.min) return;
    updateCurrentAd({ descriptions: currentAd.descriptions.filter((_, i) => i !== idx) });
  };

  const appSettings = campaign.objective.appSettings;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ===== LEFT: App Ad Editor ===== */}
        <div className="flex flex-1 flex-col gap-5">

          {/* App info banner */}
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Smartphone className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{appSettings.appName || "Your App"}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{appSettings.appId || "No app ID set"}</p>
            </div>
            <Badge variant="secondary" className="rounded-full text-[10px]">{appSettings.appStore === "GOOGLE_APP_STORE" ? "Google Play" : "App Store"}</Badge>
          </div>

          {/* Ad tabs */}
          <div className="flex items-center gap-2">
            {safeAds.map((ad, adIdx) => (
              <button key={ad.id} type="button" onClick={() => setActiveAdIdx(adIdx)}
                className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  adIdx === activeAdIdx ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                )}>
                {ad.name}
              </button>
            ))}
            {safeAds.length < 4 && (
              <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]" onClick={addAd}>
                <Plus className="size-3" /> Add Ad
              </Button>
            )}
          </div>

          {/* ===== App Ad Editor Card ===== */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">{currentAd.name}</Label>
                <InfoTip text="App ads are automatically generated from your text, image, and video assets. Google tests different combinations across Search, Play, YouTube, Discover, and Display. Maps to AppAdInfo." />
              </div>
              <div className="flex items-center gap-2">
                {safeAds.length > 1 && (
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px] text-red-500" onClick={() => deleteAd(activeAdIdx)}>
                    <Trash2 className="size-3" /> Delete
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px]" onClick={() => duplicateAd(activeAdIdx)}>
                  <Copy className="size-3" /> Duplicate
                </Button>
              </div>
            </div>

            {/* Ad Strength */}
            <div className="mb-5 rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">Ad Strength</span>
                <span className={cn("text-xs font-bold", strength.color)}>{strength.label}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all", strength.pct >= 90 ? "bg-emerald-500" : strength.pct >= 65 ? "bg-blue-500" : strength.pct >= 40 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${strength.pct}%` }} />
              </div>
            </div>

            {/* Mandatory Ad Text */}
            <div className="mb-5">
              <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                Mandatory Ad Text
                <Badge className="rounded-full bg-red-100 px-1.5 py-0 text-[9px] text-red-600">Required</Badge>
                <span className="font-normal text-muted-foreground">({currentAd.mandatoryAdText.length}/{APP_AD_LIMITS.mandatoryAdText.charLimit})</span>
                <InfoTip text="This text line is always shown in every ad combination. It should convey your most important message. Maps to mandatory_ad_text." />
              </Label>
              <Input
                value={currentAd.mandatoryAdText}
                onChange={(e) => updateCurrentAd({ mandatoryAdText: e.target.value.slice(0, APP_AD_LIMITS.mandatoryAdText.charLimit) })}
                placeholder="Download our app -- Free shipping on first order!"
                className="h-9 text-sm"
                maxLength={APP_AD_LIMITS.mandatoryAdText.charLimit}
              />
              {!currentAd.mandatoryAdText.trim() && (
                <p className="mt-1 text-[10px] text-red-500">Mandatory ad text is required.</p>
              )}
            </div>

            {/* Headlines */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  Headlines
                  <span className="font-normal text-muted-foreground">({currentAd.headlines.filter(h => h.text.trim()).length}/{APP_AD_LIMITS.headline.max})</span>
                  <InfoTip text={`Up to ${APP_AD_LIMITS.headline.max} headlines, max ${APP_AD_LIMITS.headline.charLimit} chars each. Google combines them with descriptions and your app listing.`} />
                </Label>
                {currentAd.headlines.length < APP_AD_LIMITS.headline.max && (
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addHeadline}>
                    <Plus className="size-3" /> Add
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {currentAd.headlines.map((h, i) => (
                  <div key={h.id} className="flex items-center gap-2">
                    <span className="w-5 text-center text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                    <div className="relative flex-1">
                      <Input value={h.text} onChange={(e) => updateHeadline(i, e.target.value)} placeholder={`Headline ${i + 1}`} className="h-8 pr-12 text-xs" maxLength={APP_AD_LIMITS.headline.charLimit} />
                      <span className={cn("absolute right-2 top-1/2 -translate-y-1/2 text-[10px]", h.text.length >= APP_AD_LIMITS.headline.charLimit ? "text-red-500" : "text-muted-foreground")}>
                        {h.text.length}/{APP_AD_LIMITS.headline.charLimit}
                      </span>
                    </div>
                    {currentAd.headlines.length > APP_AD_LIMITS.headline.min && (
                      <button type="button" onClick={() => removeHeadline(i)} className="rounded p-1 hover:bg-muted"><X className="size-3 text-muted-foreground" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Descriptions */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  Descriptions
                  <span className="font-normal text-muted-foreground">({currentAd.descriptions.filter(d => d.text.trim()).length}/{APP_AD_LIMITS.description.max})</span>
                  <InfoTip text={`Up to ${APP_AD_LIMITS.description.max} descriptions, max ${APP_AD_LIMITS.description.charLimit} chars each. Paired with headlines by Google's AI.`} />
                </Label>
                {currentAd.descriptions.length < APP_AD_LIMITS.description.max && (
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addDescription}>
                    <Plus className="size-3" /> Add
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {currentAd.descriptions.map((d, i) => (
                  <div key={d.id} className="flex items-start gap-2">
                    <span className="mt-2 w-5 text-center text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                    <div className="relative flex-1">
                      <Textarea value={d.text} onChange={(e) => updateDescription(i, e.target.value)} placeholder={`Description ${i + 1}`} className="min-h-[56px] resize-none pr-12 text-xs" maxLength={APP_AD_LIMITS.description.charLimit} />
                      <span className={cn("absolute right-2 top-2 text-[10px]", d.text.length >= APP_AD_LIMITS.description.charLimit ? "text-red-500" : "text-muted-foreground")}>
                        {d.text.length}/{APP_AD_LIMITS.description.charLimit}
                      </span>
                    </div>
                    {currentAd.descriptions.length > APP_AD_LIMITS.description.min && (
                      <button type="button" onClick={() => removeDescription(i)} className="mt-2 rounded p-1 hover:bg-muted"><X className="size-3 text-muted-foreground" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="mb-5">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ImageIcon className="size-3 text-primary" /> Images
                <span className="font-normal text-muted-foreground">(up to {APP_AD_LIMITS.images.max})</span>
                <InfoTip text="Upload landscape (1.91:1, min 1200x628), portrait (4:5), and square (1:1) images. Google picks the best format for each placement. Maps to images in AppAdInfo." />
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                  <div className="mx-auto mb-2 flex aspect-video w-full max-w-[100px] items-center justify-center rounded bg-muted">
                    <ImageIcon className="size-5 text-muted-foreground/30" />
                  </div>
                  <p className="text-[10px] font-semibold text-foreground">Landscape</p>
                  <p className="text-[9px] text-muted-foreground">1.91:1, min 1200x628</p>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className="h-6 gap-1 text-[9px]"><Plus className="size-3" /> Upload</Button>
                  </div>
                </div>
                <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                  <div className="mx-auto mb-2 flex aspect-[4/5] w-full max-w-[64px] items-center justify-center rounded bg-muted">
                    <ImageIcon className="size-5 text-muted-foreground/30" />
                  </div>
                  <p className="text-[10px] font-semibold text-foreground">Portrait</p>
                  <p className="text-[9px] text-muted-foreground">4:5, min 480x600</p>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className="h-6 gap-1 text-[9px]"><Plus className="size-3" /> Upload</Button>
                  </div>
                </div>
                <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                  <div className="mx-auto mb-2 flex aspect-square w-full max-w-[64px] items-center justify-center rounded bg-muted">
                    <ImageIcon className="size-5 text-muted-foreground/30" />
                  </div>
                  <p className="text-[10px] font-semibold text-foreground">Square</p>
                  <p className="text-[9px] text-muted-foreground">1:1, min 200x200</p>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className="h-6 gap-1 text-[9px]"><Plus className="size-3" /> Upload</Button>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="mt-2 rounded-full px-1.5 py-0 text-[8px]">{currentAd.images.length}/{APP_AD_LIMITS.images.max} images</Badge>
            </div>

            {/* YouTube Videos */}
            <div className="mb-5">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <PlayCircle className="size-3 text-primary" /> YouTube Videos
                <span className="font-normal text-muted-foreground">(up to {APP_AD_LIMITS.youtubeVideos.max})</span>
                <InfoTip text="Add YouTube video URLs to include video assets in your app ads. Vertical videos (9:16) perform best on mobile. Maps to youtube_videos in AppAdInfo." />
              </Label>
              {currentAd.youtubeVideos.map((vid, vi) => (
                <div key={vi} className="mb-1.5 flex items-center gap-2">
                  <Input value={vid} onChange={(e) => {
                    const next = [...currentAd.youtubeVideos]; next[vi] = e.target.value;
                    updateCurrentAd({ youtubeVideos: next });
                  }} placeholder="https://youtube.com/watch?v=..." className="h-8 flex-1 text-xs" />
                  <button type="button" onClick={() => updateCurrentAd({ youtubeVideos: currentAd.youtubeVideos.filter((_, i) => i !== vi) })}
                    className="rounded p-1 hover:bg-muted"><X className="size-3 text-muted-foreground" /></button>
                </div>
              ))}
              {currentAd.youtubeVideos.length < APP_AD_LIMITS.youtubeVideos.max && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px] text-primary" onClick={() => updateCurrentAd({ youtubeVideos: [...currentAd.youtubeVideos, ""] })}>
                  <Plus className="size-3" /> Add Video
                </Button>
              )}
            </div>

            {/* Advanced: HTML5 */}
            <div>
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-medium text-primary">
                <ChevronDown className={cn("size-3.5 transition-transform", showAdvanced && "rotate-180")} />
                Advanced Options
              </button>
              {showAdvanced && (
                <div className="mt-3 rounded-lg border border-border bg-muted/10 p-4">
                  <Label className="mb-1.5 text-[10px] font-semibold text-foreground">HTML5 Media Bundles <span className="font-normal text-muted-foreground">(Optional)</span></Label>
                  <p className="text-[9px] text-muted-foreground">Upload .zip HTML5 creative bundles for rich interactive app ads.</p>
                  <Badge variant="secondary" className="mt-2 rounded-full px-1.5 py-0 text-[8px]">{currentAd.html5MediaBundles.length} bundles</Badge>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className="h-6 gap-1 text-[9px]"><Plus className="size-3" /> Upload Bundle</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Best Practice Tip */}
          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
            <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-primary">Best Practice:</span>{" "}
              Use all 5 headline and 5 description slots. Add at least 1 landscape image, 1 portrait image, and 1 video. Google tests thousands of combinations across Search, Play, YouTube, Discover, and Display to find the best performers.
            </p>
          </div>
        </div>

        {/* ===== RIGHT SIDEBAR: Preview + Summary ===== */}
        <div className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-20 flex flex-col gap-4">

            {/* App Install Ad Preview */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">App Ad Preview</p>
                <Eye className="size-3.5 text-muted-foreground" />
              </div>
              {/* Play Store style preview */}
              <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                <div className="flex items-center gap-3 p-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Smartphone className="size-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-foreground">{appSettings.appName || "Your App"}</p>
                    <p className="truncate text-[9px] text-muted-foreground">{appSettings.appId || "com.example.app"}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="text-[8px] text-amber-500">{"*".repeat(5)}</span>
                      <span className="text-[8px] text-muted-foreground">4.5</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border bg-muted/20 px-3 py-2">
                  <p className="text-[10px] font-semibold text-foreground">
                    {currentAd.headlines.find(h => h.text.trim())?.text || "Your headline here"}
                  </p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    {currentAd.mandatoryAdText || "Mandatory ad text preview"}
                  </p>
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <Badge variant="secondary" className="rounded-full text-[8px]">Ad</Badge>
                  <div className="rounded-full bg-primary px-3 py-1 text-[9px] font-semibold text-primary-foreground">
                    Install
                  </div>
                </div>
              </div>
              {/* YouTube In-Stream mini preview */}
              <div className="mt-3 overflow-hidden rounded-lg border border-border bg-background">
                <div className="flex aspect-video items-center justify-center bg-muted/50">
                  <PlayCircle className="size-6 text-muted-foreground/30" />
                </div>
                <div className="flex items-center justify-between p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[9px] font-medium text-foreground">{currentAd.mandatoryAdText || "Ad text"}</p>
                    <p className="text-[8px] text-muted-foreground">{appSettings.appName || "App"}</p>
                  </div>
                  <div className="rounded bg-primary px-1.5 py-0.5 text-[8px] font-medium text-primary-foreground">Install</div>
                </div>
              </div>
            </SectionCard>

            {/* Ad Summary */}
            <SectionCard className="p-4">
              <p className="mb-3 text-xs font-bold text-foreground">Ad Summary</p>
              <div className="flex flex-col gap-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Ads</span>
                  <span className="font-semibold text-foreground">{safeAds.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mandatory Text</span>
                  <span className={cn("font-semibold", currentAd.mandatoryAdText.trim() ? "text-emerald-600" : "text-red-500")}>{currentAd.mandatoryAdText.trim() ? "Set" : "Missing"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Headlines</span>
                  <span className="font-semibold text-foreground">{currentAd.headlines.filter(h => h.text.trim()).length}/{APP_AD_LIMITS.headline.max}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Descriptions</span>
                  <span className="font-semibold text-foreground">{currentAd.descriptions.filter(d => d.text.trim()).length}/{APP_AD_LIMITS.description.max}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Images</span>
                  <span className="font-semibold text-foreground">{currentAd.images.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Videos</span>
                  <span className="font-semibold text-foreground">{currentAd.youtubeVideos.filter(Boolean).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ad Strength</span>
                  <span className={cn("font-semibold", strength.color)}>{strength.label}</span>
                </div>
              </div>
            </SectionCard>

            {/* Placements info */}
            <SectionCard className="border-primary/20 bg-primary/[0.02] p-4">
              <p className="mb-2 text-xs font-bold text-primary">Where Your Ads Appear</p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Google Search", desc: "When people search for your app" },
                  { label: "Google Play", desc: "In store listings and search results" },
                  { label: "YouTube", desc: "In-stream, in-feed, and Shorts" },
                  { label: "Discover", desc: "In Google Discover feed" },
                  { label: "Display Network", desc: "Across 3M+ websites and apps" },
                ].map((ch) => (
                  <div key={ch.label} className="flex items-center gap-2 rounded-lg bg-background px-2.5 py-1.5">
                    <div className="size-1.5 rounded-full bg-primary" />
                    <div>
                      <p className="text-[10px] font-semibold text-foreground">{ch.label}</p>
                      <p className="text-[9px] text-muted-foreground">{ch.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Review & Launch"
      />
    </TooltipProvider>
  );
}

/* ================================================================== */
/*  DISPLAY: Responsive Display Ad Editor                             */
/* ================================================================== */

const RDA_LIMITS = {
  headline: { min: 1, max: 5, charLimit: 30 },
  longHeadline: { min: 1, max: 1, charLimit: 90 },
  description: { min: 1, max: 5, charLimit: 90 },
  businessName: { min: 1, max: 1, charLimit: 25 },
  landscapeImage: { min: 1, max: 15, ratio: "1.91:1", minPx: "600x314" },
  squareImage: { min: 1, max: 15, ratio: "1:1", minPx: "300x300" },
  logo: { min: 0, max: 5, ratio: "4:1", minPx: "512x128" },
  squareLogo: { min: 0, max: 5, ratio: "1:1", minPx: "128x128" },
  youtubeVideos: { min: 0, max: 5 },
};

const DISPLAY_FORMAT_OPTIONS = [
  { value: "ALL_FORMATS" as const, label: "All Formats", desc: "Recommended -- show as native or standard" },
  { value: "NON_NATIVE" as const, label: "Non-Native Only", desc: "Standard display formats only" },
  { value: "NATIVE" as const, label: "Native Only", desc: "Blend into site content" },
];

function calcRdaStrength(ad: GoogleDisplayAd): { label: string; color: string; pct: number } {
  let pts = 0;
  const filledH = ad.headlines.filter((h) => h.text.trim()).length;
  pts += Math.min(filledH, 5) * 5; // 25 max
  if (ad.longHeadline.trim()) pts += 15;
  const filledD = ad.descriptions.filter((d) => d.text.trim()).length;
  pts += Math.min(filledD, 5) * 5; // 25 max
  if (ad.businessName.trim()) pts += 10;
  if (ad.finalUrl.trim()) pts += 5;
  if (ad.images.length > 0) pts += 10;
  if (ad.squareImages.length > 0) pts += 5;
  if (ad.logos.length > 0) pts += 3;
  if (ad.promoText.trim()) pts += 2;
  if (pts >= 90) return { label: "Excellent", color: "text-emerald-600", pct: Math.min(pts, 100) };
  if (pts >= 65) return { label: "Good", color: "text-blue-600", pct: pts };
  if (pts >= 40) return { label: "Average", color: "text-amber-600", pct: pts };
  return { label: "Incomplete", color: "text-red-500", pct: pts };
}

function DisplayCreativeEditor() {
  const { campaign, setStep, updateNested } = useGoogleCampaign();
  const adGroups = campaign.creative.displayAdGroups ?? [];
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [activeAdIdx, setActiveAdIdx] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const safeGroups = adGroups.length > 0 ? adGroups : [createDisplayAdGroup(1)];
  const currentGroup = safeGroups[activeGroupIdx] ?? safeGroups[0];
  const currentAd = currentGroup.ads[activeAdIdx] ?? currentGroup.ads[0] ?? createDisplayAd(1);
  const strength = calcRdaStrength(currentAd);

  const updateAdGroups = (groups: DisplayAdGroup[]) => updateNested("creative", { displayAdGroups: groups });
  const updateCurrentGroup = (patch: Partial<DisplayAdGroup>) => {
    const groups = safeGroups.map((g, i) => i === activeGroupIdx ? { ...g, ...patch } : g);
    updateAdGroups(groups);
  };
  const updateCurrentAd = (patch: Partial<GoogleDisplayAd>) => {
    const ads = currentGroup.ads.map((a, i) => i === activeAdIdx ? { ...a, ...patch } : a);
    updateCurrentGroup({ ads });
  };

  const addAdGroup = () => {
    const groups = [...safeGroups, createDisplayAdGroup(safeGroups.length + 1)];
    updateAdGroups(groups);
    setActiveGroupIdx(groups.length - 1);
    setActiveAdIdx(0);
  };
  const removeAdGroup = (idx: number) => {
    if (safeGroups.length <= 1) return;
    const groups = safeGroups.filter((_, i) => i !== idx);
    updateAdGroups(groups);
    setActiveGroupIdx(Math.min(activeGroupIdx, groups.length - 1));
    setActiveAdIdx(0);
  };
  const addAd = () => {
    const ads = [...currentGroup.ads, createDisplayAd(currentGroup.ads.length + 1)];
    updateCurrentGroup({ ads });
    setActiveAdIdx(ads.length - 1);
  };
  const deleteAd = (adIdx: number) => {
    if (currentGroup.ads.length <= 1) return;
    const ads = currentGroup.ads.filter((_, i) => i !== adIdx);
    updateCurrentGroup({ ads });
    setActiveAdIdx(Math.min(activeAdIdx, ads.length - 1));
  };
  const duplicateAd = (adIdx: number) => {
    const source = currentGroup.ads[adIdx];
    const dupe: GoogleDisplayAd = {
      ...source,
      id: `dad-${Date.now()}`,
      name: `${source.name} (copy)`,
      headlines: source.headlines.map((h) => ({ ...h, id: `dh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
      descriptions: source.descriptions.map((d) => ({ ...d, id: `dd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    };
    const ads = [...currentGroup.ads, dupe];
    updateCurrentGroup({ ads });
    setActiveAdIdx(ads.length - 1);
  };

  /* Headline helpers */
  const updateHeadline = (idx: number, text: string) => {
    const next = currentAd.headlines.map((h, i) => i === idx ? { ...h, text: text.slice(0, RDA_LIMITS.headline.charLimit) } : h);
    updateCurrentAd({ headlines: next });
  };
  const addHeadline = () => {
    if (currentAd.headlines.length >= RDA_LIMITS.headline.max) return;
    updateCurrentAd({ headlines: [...currentAd.headlines, { id: `dh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: "HEADLINE" as const, text: "" }] });
  };
  const removeHeadline = (idx: number) => {
    if (currentAd.headlines.length <= RDA_LIMITS.headline.min) return;
    updateCurrentAd({ headlines: currentAd.headlines.filter((_, i) => i !== idx) });
  };

  /* Description helpers */
  const updateDescription = (idx: number, text: string) => {
    const next = currentAd.descriptions.map((d, i) => i === idx ? { ...d, text: text.slice(0, RDA_LIMITS.description.charLimit) } : d);
    updateCurrentAd({ descriptions: next });
  };
  const addDescription = () => {
    if (currentAd.descriptions.length >= RDA_LIMITS.description.max) return;
    updateCurrentAd({ descriptions: [...currentAd.descriptions, { id: `dd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: "DESCRIPTION" as const, text: "" }] });
  };
  const removeDescription = (idx: number) => {
    if (currentAd.descriptions.length <= RDA_LIMITS.description.min) return;
    updateCurrentAd({ descriptions: currentAd.descriptions.filter((_, i) => i !== idx) });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ===== LEFT: Ad Group Tabs + RDA Editor ===== */}
        <div className="flex flex-1 flex-col gap-5">

          {/* Ad Group Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {safeGroups.map((g, idx) => (
              <button key={g.id} type="button" onClick={() => { setActiveGroupIdx(idx); setActiveAdIdx(0); }}
                className={cn("flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  idx === activeGroupIdx ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                )}>
                <Layers className="size-3" />
                {g.name}
                <Badge variant="secondary" className="rounded-full px-1 py-0 text-[8px]">{g.ads.length} ad{g.ads.length !== 1 ? "s" : ""}</Badge>
              </button>
            ))}
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={addAdGroup}>
              <Plus className="size-3" /> Ad Group
            </Button>
            {safeGroups.length > 1 && (
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-[10px] text-red-500" onClick={() => removeAdGroup(activeGroupIdx)}>
                <Trash2 className="size-3" /> Remove
              </Button>
            )}
          </div>

          {/* Ad Group Name + Content Targeting Summary */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div>
                <Label className="mb-1 text-xs font-semibold text-foreground">Ad Group Name</Label>
                <Input value={currentGroup.name} onChange={(e) => updateCurrentGroup({ name: e.target.value })} placeholder="Ad Group 1" className="h-8 w-60 text-xs" />
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Tag className="size-3 text-primary" />
                  <span className="text-[10px] text-foreground">{currentGroup.contentKeywords.length} keywords</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Target className="size-3 text-primary" />
                  <span className="text-[10px] text-foreground">{currentGroup.topics.length} topics</span>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-[10px] text-primary underline">Edit</button>
              </div>
            </div>
          </div>

          {/* Ad Tabs within group */}
          <div className="flex items-center gap-2">
            {currentGroup.ads.map((ad, adIdx) => (
              <button key={ad.id} type="button" onClick={() => setActiveAdIdx(adIdx)}
                className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  adIdx === activeAdIdx ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                )}>
                {ad.name}
              </button>
            ))}
            {currentGroup.ads.length < 3 && (
              <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]" onClick={addAd}>
                <Plus className="size-3" /> Add Ad
              </Button>
            )}
          </div>

          {/* ===== Responsive Display Ad Editor ===== */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">{currentAd.name}</Label>
                <InfoTip text="Responsive Display Ads automatically adjust size, appearance, and format to fit available ad spaces. Maps to ResponsiveDisplayAdInfo." />
              </div>
              <div className="flex items-center gap-2">
                {currentGroup.ads.length > 1 && (
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px] text-red-500" onClick={() => deleteAd(activeAdIdx)}>
                    <Trash2 className="size-3" /> Delete
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px]" onClick={() => duplicateAd(activeAdIdx)}>
                  <Copy className="size-3" /> Duplicate
                </Button>
              </div>
            </div>

            {/* Ad Strength */}
            <div className="mb-5 rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">Ad Strength</span>
                <span className={cn("text-xs font-bold", strength.color)}>{strength.label}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all", strength.pct >= 90 ? "bg-emerald-500" : strength.pct >= 65 ? "bg-blue-500" : strength.pct >= 40 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${strength.pct}%` }} />
              </div>
            </div>

            {/* Final URL */}
            <div className="mb-5">
              <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Link2 className="size-3 text-primary" /> Final URL
              </Label>
              <Input value={currentAd.finalUrl} onChange={(e) => updateCurrentAd({ finalUrl: e.target.value })} placeholder="https://your-store.salla.sa/collection" className="h-9 text-sm" />
            </div>

            {/* Business Name */}
            <div className="mb-5">
              <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                Business Name
                <span className="font-normal text-muted-foreground">({currentAd.businessName.length}/{RDA_LIMITS.businessName.charLimit})</span>
              </Label>
              <Input value={currentAd.businessName} onChange={(e) => updateCurrentAd({ businessName: e.target.value.slice(0, RDA_LIMITS.businessName.charLimit) })} placeholder="Your Store Name" className="h-9 text-sm" />
            </div>

            {/* Headlines */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  Headlines
                  <span className="font-normal text-muted-foreground">({currentAd.headlines.filter(h => h.text.trim()).length}/{RDA_LIMITS.headline.max})</span>
                  <InfoTip text={`${RDA_LIMITS.headline.min}-${RDA_LIMITS.headline.max} headlines, max ${RDA_LIMITS.headline.charLimit} chars each. Google tests combinations to find the best performer.`} />
                </Label>
                {currentAd.headlines.length < RDA_LIMITS.headline.max && (
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addHeadline}>
                    <Plus className="size-3" /> Add
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {currentAd.headlines.map((h, i) => (
                  <div key={h.id} className="flex items-center gap-2">
                    <span className="w-5 text-center text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                    <div className="relative flex-1">
                      <Input value={h.text} onChange={(e) => updateHeadline(i, e.target.value)} placeholder={`Headline ${i + 1}`} className="h-8 pr-12 text-xs" maxLength={RDA_LIMITS.headline.charLimit} />
                      <span className={cn("absolute right-2 top-1/2 -translate-y-1/2 text-[10px]", h.text.length >= RDA_LIMITS.headline.charLimit ? "text-red-500" : "text-muted-foreground")}>
                        {h.text.length}/{RDA_LIMITS.headline.charLimit}
                      </span>
                    </div>
                    {currentAd.headlines.length > RDA_LIMITS.headline.min && (
                      <button type="button" onClick={() => removeHeadline(i)} className="rounded p-1 hover:bg-muted"><X className="size-3 text-muted-foreground" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Long Headline */}
            <div className="mb-5">
              <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                Long Headline
                <span className="font-normal text-muted-foreground">({currentAd.longHeadline.length}/{RDA_LIMITS.longHeadline.charLimit})</span>
                <InfoTip text="Required. Shown in larger ad formats. Max 90 characters. Maps to long_headline." />
              </Label>
              <Input value={currentAd.longHeadline} onChange={(e) => updateCurrentAd({ longHeadline: e.target.value.slice(0, RDA_LIMITS.longHeadline.charLimit) })} placeholder="Your longer, more descriptive headline..." className="h-9 text-sm" maxLength={RDA_LIMITS.longHeadline.charLimit} />
            </div>

            {/* Descriptions */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  Descriptions
                  <span className="font-normal text-muted-foreground">({currentAd.descriptions.filter(d => d.text.trim()).length}/{RDA_LIMITS.description.max})</span>
                  <InfoTip text={`${RDA_LIMITS.description.min}-${RDA_LIMITS.description.max} descriptions, max ${RDA_LIMITS.description.charLimit} chars each. Pair with headlines for testing.`} />
                </Label>
                {currentAd.descriptions.length < RDA_LIMITS.description.max && (
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addDescription}>
                    <Plus className="size-3" /> Add
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {currentAd.descriptions.map((d, i) => (
                  <div key={d.id} className="flex items-start gap-2">
                    <span className="mt-2 w-5 text-center text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                    <div className="relative flex-1">
                      <Textarea value={d.text} onChange={(e) => updateDescription(i, e.target.value)} placeholder={`Description ${i + 1}`} className="min-h-[56px] resize-none pr-12 text-xs" maxLength={RDA_LIMITS.description.charLimit} />
                      <span className={cn("absolute right-2 top-2 text-[10px]", d.text.length >= RDA_LIMITS.description.charLimit ? "text-red-500" : "text-muted-foreground")}>
                        {d.text.length}/{RDA_LIMITS.description.charLimit}
                      </span>
                    </div>
                    {currentAd.descriptions.length > RDA_LIMITS.description.min && (
                      <button type="button" onClick={() => removeDescription(i)} className="mt-2 rounded p-1 hover:bg-muted"><X className="size-3 text-muted-foreground" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Images Section */}
            <div className="mb-5">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ImageIcon className="size-3 text-primary" /> Images
                <InfoTip text="Upload landscape (1.91:1, min 600x314) and square (1:1, min 300x300) images. Maps to marketing_images and square_marketing_images." />
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {/* Landscape Images */}
                <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                  <div className="mx-auto mb-2 flex aspect-video w-full max-w-[120px] items-center justify-center rounded bg-muted">
                    <ImageIcon className="size-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-[10px] font-semibold text-foreground">Landscape (1.91:1)</p>
                  <p className="text-[9px] text-muted-foreground">Min 600x314 px</p>
                  <Badge variant="secondary" className="mt-1 rounded-full px-1.5 py-0 text-[8px]">{currentAd.images.length}/{RDA_LIMITS.landscapeImage.max}</Badge>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]">
                      <Plus className="size-3" /> Upload
                    </Button>
                  </div>
                </div>
                {/* Square Images */}
                <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                  <div className="mx-auto mb-2 flex aspect-square w-full max-w-[80px] items-center justify-center rounded bg-muted">
                    <ImageIcon className="size-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-[10px] font-semibold text-foreground">Square (1:1)</p>
                  <p className="text-[9px] text-muted-foreground">Min 300x300 px</p>
                  <Badge variant="secondary" className="mt-1 rounded-full px-1.5 py-0 text-[8px]">{currentAd.squareImages.length}/{RDA_LIMITS.squareImage.max}</Badge>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]">
                      <Plus className="size-3" /> Upload
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Logos Section */}
            <div className="mb-5">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                Logos
                <span className="font-normal text-muted-foreground">(Optional)</span>
                <InfoTip text="Landscape logo (4:1, min 512x128) and square logo (1:1, min 128x128). Maps to logo_images and square_logo_images." />
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border-2 border-dashed border-border p-3 text-center">
                  <p className="text-[10px] font-semibold text-foreground">Landscape Logo (4:1)</p>
                  <p className="text-[9px] text-muted-foreground">Min 512x128 px</p>
                  <Badge variant="secondary" className="mt-1 rounded-full px-1.5 py-0 text-[8px]">{currentAd.logos.length}/{RDA_LIMITS.logo.max}</Badge>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className="h-6 gap-1 text-[9px]"><Plus className="size-3" /> Upload</Button>
                  </div>
                </div>
                <div className="rounded-lg border-2 border-dashed border-border p-3 text-center">
                  <p className="text-[10px] font-semibold text-foreground">Square Logo (1:1)</p>
                  <p className="text-[9px] text-muted-foreground">Min 128x128 px</p>
                  <Badge variant="secondary" className="mt-1 rounded-full px-1.5 py-0 text-[8px]">{currentAd.squareLogos.length}/{RDA_LIMITS.squareLogo.max}</Badge>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className="h-6 gap-1 text-[9px]"><Plus className="size-3" /> Upload</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mb-5">
              <Label className="mb-2 text-xs font-semibold text-foreground">Call to Action</Label>
              <div className="flex flex-wrap gap-1.5">
                {CTA_OPTIONS.map((c) => (
                  <button key={c.value} type="button" onClick={() => updateCurrentAd({ callToAction: c.value })}
                    className={cn("rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors",
                      currentAd.callToAction === c.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    )}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div>
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-medium text-primary">
                <ChevronDown className={cn("size-3.5 transition-transform", showAdvanced && "rotate-180")} />
                Advanced Options
              </button>
              {showAdvanced && (
                <div className="mt-3 flex flex-col gap-4 rounded-lg border border-border bg-muted/10 p-4">
                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1 text-[10px] font-semibold text-foreground">Main Color</Label>
                      <Input type="text" value={currentAd.mainColor} onChange={(e) => updateCurrentAd({ mainColor: e.target.value })} placeholder="#000000" className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="mb-1 text-[10px] font-semibold text-foreground">Accent Color</Label>
                      <Input type="text" value={currentAd.accentColor} onChange={(e) => updateCurrentAd({ accentColor: e.target.value })} placeholder="#ffffff" className="h-8 text-xs" />
                    </div>
                  </div>
                  {/* Allow Flexible Color */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-foreground">Allow Flexible Color</p>
                      <p className="text-[10px] text-muted-foreground">Let Google adapt colors to improve performance</p>
                    </div>
                    <Switch checked={currentAd.allowFlexibleColor} onCheckedChange={(v) => updateCurrentAd({ allowFlexibleColor: v })} />
                  </div>
                  {/* Promo Text */}
                  <div>
                    <Label className="mb-1 text-[10px] font-semibold text-foreground">Promo Text <span className="font-normal text-muted-foreground">(Optional, max 15 chars)</span></Label>
                    <Input value={currentAd.promoText} onChange={(e) => updateCurrentAd({ promoText: e.target.value.slice(0, 15) })} placeholder="Free shipping" className="h-8 text-xs" />
                  </div>
                  {/* Price Prefix */}
                  <div>
                    <Label className="mb-1 text-[10px] font-semibold text-foreground">Price Prefix <span className="font-normal text-muted-foreground">(Optional)</span></Label>
                    <Input value={currentAd.pricePrefix} onChange={(e) => updateCurrentAd({ pricePrefix: e.target.value })} placeholder="As low as" className="h-8 text-xs" />
                  </div>
                  {/* Format Setting */}
                  <div>
                    <Label className="mb-2 text-[10px] font-semibold text-foreground">Ad Format</Label>
                    <div className="flex flex-col gap-1.5">
                      {DISPLAY_FORMAT_OPTIONS.map((fmt) => (
                        <label key={fmt.value} className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition-all",
                          currentAd.formatSetting === fmt.value ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
                        )}>
                          <Checkbox checked={currentAd.formatSetting === fmt.value} onCheckedChange={() => updateCurrentAd({ formatSetting: fmt.value })} />
                          <div>
                            <p className={cn("text-[11px] font-medium", currentAd.formatSetting === fmt.value ? "text-primary" : "text-foreground")}>{fmt.label}</p>
                            <p className="text-[9px] text-muted-foreground">{fmt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* YouTube Videos */}
                  <div>
                    <Label className="mb-1 text-[10px] font-semibold text-foreground">YouTube Videos <span className="font-normal text-muted-foreground">(Optional, up to {RDA_LIMITS.youtubeVideos.max})</span></Label>
                    <p className="mb-1.5 text-[9px] text-muted-foreground">Enter YouTube video URLs to include video assets in your Display ads.</p>
                    {currentAd.youtubeVideos.map((vid, vi) => (
                      <div key={vi} className="mb-1 flex items-center gap-2">
                        <Input value={vid} onChange={(e) => {
                          const next = [...currentAd.youtubeVideos]; next[vi] = e.target.value;
                          updateCurrentAd({ youtubeVideos: next });
                        }} placeholder="https://youtube.com/watch?v=..." className="h-7 flex-1 text-[10px]" />
                        <button type="button" onClick={() => updateCurrentAd({ youtubeVideos: currentAd.youtubeVideos.filter((_, i) => i !== vi) })}
                          className="rounded p-1 hover:bg-muted"><X className="size-3 text-muted-foreground" /></button>
                      </div>
                    ))}
                    {currentAd.youtubeVideos.length < RDA_LIMITS.youtubeVideos.max && (
                      <Button variant="ghost" size="sm" className="h-6 gap-1 text-[9px] text-primary" onClick={() => updateCurrentAd({ youtubeVideos: [...currentAd.youtubeVideos, ""] })}>
                        <Plus className="size-3" /> Add Video
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Best Practice Tip */}
          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
            <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-primary">Best Practice:</span>{" "}
              Use all 5 headline slots and 5 description slots. Upload at least 3 landscape and 3 square images. Google tests combinations to find the best performer for each placement.
            </p>
          </div>
        </div>

        {/* ===== RIGHT SIDEBAR: Preview + Summary ===== */}
        <div className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-20 flex flex-col gap-4">

            {/* Display Ad Preview */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">Display Ad Preview</p>
                <Eye className="size-3.5 text-muted-foreground" />
              </div>
              {/* Landscape preview */}
              <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
                <div className="flex aspect-[1.91/1] items-center justify-center bg-muted">
                  {currentAd.images.length > 0 ? (
                    <ImageIcon className="size-8 text-primary/30" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="mx-auto size-6 text-muted-foreground/20" />
                      <p className="mt-1 text-[8px] text-muted-foreground">1.91:1 image</p>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="size-4 rounded-full bg-muted" />
                    <span className="text-[10px] font-medium text-foreground">{currentAd.businessName || "Store"}</span>
                    <Badge variant="secondary" className="rounded-full px-1 py-0 text-[8px]">Ad</Badge>
                  </div>
                  <p className="text-[11px] font-semibold leading-tight text-foreground">
                    {currentAd.headlines.find(h => h.text.trim())?.text || "Your headline here"}
                  </p>
                  <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">
                    {currentAd.descriptions.find(d => d.text.trim())?.text || "Description preview"}
                  </p>
                  <div className="mt-2 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[9px] font-medium text-primary-foreground">
                    {CTA_OPTIONS.find((c) => c.value === currentAd.callToAction)?.label ?? "Learn more"}
                  </div>
                </div>
              </div>

              {/* Square preview (small) */}
              <div className="mt-3 flex gap-2">
                <div className="flex-1 overflow-hidden rounded-lg border border-border bg-background">
                  <div className="flex aspect-square items-center justify-center bg-muted">
                    <ImageIcon className="size-4 text-muted-foreground/20" />
                  </div>
                  <div className="p-1.5">
                    <p className="text-[8px] font-medium leading-tight text-foreground">{currentAd.headlines.find(h => h.text.trim())?.text || "Headline"}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden rounded-lg border border-border bg-background">
                  <div className="p-2">
                    <p className="text-[9px] font-semibold leading-tight text-foreground">{currentAd.longHeadline || "Long headline preview"}</p>
                    <p className="mt-0.5 text-[8px] text-muted-foreground">{currentAd.businessName || "Store"}</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Ad Summary */}
            <SectionCard className="p-4">
              <p className="mb-3 text-xs font-bold text-foreground">Ad Summary</p>
              <div className="flex flex-col gap-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ad Groups</span>
                  <span className="font-semibold text-foreground">{safeGroups.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ads</span>
                  <span className="font-semibold text-foreground">{safeGroups.reduce((acc, g) => acc + g.ads.length, 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Headlines</span>
                  <span className="font-semibold text-foreground">{currentAd.headlines.filter(h => h.text.trim()).length}/{RDA_LIMITS.headline.max}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Long Headline</span>
                  <span className={cn("font-semibold", currentAd.longHeadline.trim() ? "text-emerald-600" : "text-red-500")}>{currentAd.longHeadline.trim() ? "Set" : "Missing"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Descriptions</span>
                  <span className="font-semibold text-foreground">{currentAd.descriptions.filter(d => d.text.trim()).length}/{RDA_LIMITS.description.max}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Landscape Images</span>
                  <span className="font-semibold text-foreground">{currentAd.images.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Square Images</span>
                  <span className="font-semibold text-foreground">{currentAd.squareImages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Logos</span>
                  <span className="font-semibold text-foreground">{currentAd.logos.length + currentAd.squareLogos.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ad Strength</span>
                  <span className={cn("font-semibold", strength.color)}>{strength.label}</span>
                </div>
              </div>
            </SectionCard>

            {/* Salla Tip */}
            <SectionCard className="border-primary/20 bg-primary/[0.02] p-4">
              <p className="mb-2 text-xs font-bold text-primary">Salla Display Tips</p>
              <ul className="flex flex-col gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <li>Use product images with clean backgrounds for best results</li>
                <li>Add your store logo for brand recognition</li>
                <li>Keep headlines clear and benefit-focused</li>
                <li>Include promotional text like "Free Shipping" for higher CTR</li>
              </ul>
            </SectionCard>
          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Review & Launch"
      />
    </TooltipProvider>
  );
}

/* ================================================================== */
/*  SEARCH: Main Creative Editor                                      */
/* ================================================================== */

function SearchCreativeEditor() {
  const { campaign, setStep, updateNested } = useGoogleCampaign();
  const adGroups = campaign.creative.searchAdGroups ?? [];
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);

  /* Ensure at least 1 ad group */
  const safeGroups = adGroups.length > 0 ? adGroups : [createSearchAdGroup(1)];
  const currentGroup = safeGroups[activeGroupIdx] ?? safeGroups[0];

  const updateAdGroups = (groups: SearchAdGroup[]) => updateNested("creative", { searchAdGroups: groups });
  const updateCurrentGroup = (patch: Partial<SearchAdGroup>) => {
    const groups = safeGroups.map((g, i) => i === activeGroupIdx ? { ...g, ...patch } : g);
    updateAdGroups(groups);
  };

  /* Add/remove ad groups */
  const addAdGroup = () => {
    const groups = [...safeGroups, createSearchAdGroup(safeGroups.length + 1)];
    updateAdGroups(groups);
    setActiveGroupIdx(groups.length - 1);
  };
  const removeAdGroup = (idx: number) => {
    if (safeGroups.length <= 1) return;
    const groups = safeGroups.filter((_, i) => i !== idx);
    updateAdGroups(groups);
    setActiveGroupIdx(Math.min(activeGroupIdx, groups.length - 1));
  };

  /* Ad CRUD within current group */
  const updateAd = (adIdx: number, patch: Partial<GoogleSearchAd>) => {
    const ads = currentGroup.ads.map((a, i) => i === adIdx ? { ...a, ...patch } : a);
    updateCurrentGroup({ ads });
  };
  const addAd = () => {
    updateCurrentGroup({ ads: [...currentGroup.ads, createSearchAd(currentGroup.ads.length + 1)] });
  };
  const deleteAd = (adIdx: number) => {
    if (currentGroup.ads.length <= 1) return;
    updateCurrentGroup({ ads: currentGroup.ads.filter((_, i) => i !== adIdx) });
  };
  const duplicateAd = (adIdx: number) => {
    const source = currentGroup.ads[adIdx];
    const dupe: GoogleSearchAd = {
      ...source,
      id: `rsa-${Date.now()}`,
      name: `${source.name} (copy)`,
      headlines: source.headlines.map((h) => ({ ...h, id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
      descriptions: source.descriptions.map((d) => ({ ...d, id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    };
    updateCurrentGroup({ ads: [...currentGroup.ads, dupe] });
  };

  /* Extensions (campaign-level, stored in creative settings) */
  const sitelinks = campaign.creative.sitelinkExtensions;
  const callouts = campaign.creative.calloutExtensions;
  const snippets = campaign.creative.structuredSnippetExtensions;

  const addSitelink = () => {
    const sl: SearchSitelinkAsset = { id: `sl-${Date.now()}`, linkText: "", description1: "", description2: "", finalUrl: "" };
    updateNested("creative", { sitelinkExtensions: [...sitelinks, sl] });
  };
  const updateSitelink = (id: string, patch: Partial<SearchSitelinkAsset>) => {
    updateNested("creative", { sitelinkExtensions: sitelinks.map((s) => s.id === id ? { ...s, ...patch } : s) });
  };
  const removeSitelink = (id: string) => {
    updateNested("creative", { sitelinkExtensions: sitelinks.filter((s) => s.id !== id) });
  };
  const addCallout = () => {
    updateNested("creative", { calloutExtensions: [...callouts, { id: `co-${Date.now()}`, text: "" }] });
  };
  const updateCallout = (id: string, text: string) => {
    updateNested("creative", { calloutExtensions: callouts.map((c) => c.id === id ? { ...c, text: text.slice(0, RSA_LIMITS.callout.charLimit) } : c) });
  };
  const removeCallout = (id: string) => {
    updateNested("creative", { calloutExtensions: callouts.filter((c) => c.id !== id) });
  };
  const addSnippet = () => {
    updateNested("creative", { structuredSnippetExtensions: [...snippets, { id: `sn-${Date.now()}`, header: STRUCTURED_SNIPPET_HEADERS[0], values: ["", "", ""] }] });
  };
  const removeSnippet = (id: string) => {
    updateNested("creative", { structuredSnippetExtensions: snippets.filter((s) => s.id !== id) });
  };

  /* Preview ad (first ad in current group) */
  const previewAd = currentGroup.ads[0] ?? createSearchAd(1);
  const previewStrength = calcRsaStrength(previewAd, currentGroup.keywords.length);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ============================================================ */}
        {/* LEFT: Ad Group Tabs + RSA Editor + Extensions                */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">

          {/* Ad Group Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {safeGroups.map((g, idx) => (
              <button key={g.id} type="button" onClick={() => setActiveGroupIdx(idx)}
                className={cn("flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  idx === activeGroupIdx ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                )}>
                <Layers className="size-3" />
                {g.name}
                <Badge variant="secondary" className="rounded-full px-1 py-0 text-[8px]">{g.keywords.length} kw</Badge>
              </button>
            ))}
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={addAdGroup}>
              <Plus className="size-3" /> Ad Group
            </Button>
            {safeGroups.length > 1 && (
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-[10px] text-red-500" onClick={() => removeAdGroup(activeGroupIdx)}>
                <Trash2 className="size-3" /> Remove
              </Button>
            )}
          </div>

          {/* Ad Group Name + Keywords count */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div>
                <Label className="mb-1 text-xs font-semibold text-foreground">Ad Group Name</Label>
                <Input value={currentGroup.name} onChange={(e) => updateCurrentGroup({ name: e.target.value })} placeholder="Ad Group 1" className="h-8 w-60 text-xs" />
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                <Search className="size-3.5 text-primary" />
                <span className="text-xs text-foreground">{currentGroup.keywords.length} keywords</span>
                <button type="button" onClick={() => setStep(1)} className="text-[10px] text-primary underline">Edit in Audience</button>
              </div>
            </div>
          </div>

          {/* RSA Ads */}
          <div className="flex flex-col gap-3">
            {currentGroup.ads.map((ad, adIdx) => (
              <RsaEditor
                key={ad.id}
                ad={ad}
                adIndex={adIdx}
                totalAds={currentGroup.ads.length}
                keywordCount={currentGroup.keywords.length}
                onUpdate={(patch) => updateAd(adIdx, patch)}
                onDelete={() => deleteAd(adIdx)}
                onDuplicate={() => duplicateAd(adIdx)}
              />
            ))}
            {currentGroup.ads.length < 3 && (
              <Button variant="outline" className="gap-1.5 border-dashed text-xs" onClick={addAd}>
                <Plus className="size-3.5" /> Add Responsive Search Ad
              </Button>
            )}
          </div>

          {/* Ad Extensions */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Megaphone className="size-4 text-primary" />
              <Label className="text-sm font-semibold text-foreground">Ad Extensions</Label>
              <InfoTip text="Extensions add extra information to your ad, improving click-through rate. Applied at campaign level. Maps to CampaignAsset." />
            </div>

            {/* Sitelinks */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="size-3 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Sitelinks</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{sitelinks.length}</Badge>
                  <InfoTip text="Add links below your ad to specific pages. Max 25 chars for link text, 35 chars for descriptions." />
                </div>
                {sitelinks.length < 6 && (
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addSitelink}><Plus className="size-3" /> Add</Button>
                )}
              </div>
              {sitelinks.map((sl) => (
                <div key={sl.id} className="mb-2 rounded-lg border border-border bg-muted/10 p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <Input value={sl.linkText} onChange={(e) => updateSitelink(sl.id, { linkText: e.target.value.slice(0, RSA_LIMITS.sitelink.linkText) })} placeholder="Link text (25 chars)" className="h-7 flex-1 text-xs" />
                    <span className="mx-2 text-[9px] text-muted-foreground">{sl.linkText.length}/{RSA_LIMITS.sitelink.linkText}</span>
                    <button type="button" onClick={() => removeSitelink(sl.id)} className="text-muted-foreground hover:text-red-500"><X className="size-3" /></button>
                  </div>
                  <div className="flex gap-2">
                    <Input value={sl.description1} onChange={(e) => updateSitelink(sl.id, { description1: e.target.value.slice(0, RSA_LIMITS.sitelink.desc) })} placeholder="Description 1 (35 chars)" className="h-7 flex-1 text-[10px]" />
                    <Input value={sl.description2} onChange={(e) => updateSitelink(sl.id, { description2: e.target.value.slice(0, RSA_LIMITS.sitelink.desc) })} placeholder="Description 2 (35 chars)" className="h-7 flex-1 text-[10px]" />
                  </div>
                  <Input value={sl.finalUrl} onChange={(e) => updateSitelink(sl.id, { finalUrl: e.target.value })} placeholder="https://store.salla.sa/page" className="mt-1.5 h-7 text-[10px]" />
                </div>
              ))}
            </div>

            {/* Callouts */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="size-3 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Callouts</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{callouts.length}</Badge>
                  <InfoTip text="Short text snippets that highlight key features. Max 25 chars each. e.g. 'Free Shipping', '24/7 Support'" />
                </div>
                {callouts.length < 10 && (
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addCallout}><Plus className="size-3" /> Add</Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {callouts.map((co) => (
                  <div key={co.id} className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1">
                    <Input value={co.text} onChange={(e) => updateCallout(co.id, e.target.value)} placeholder="e.g. Free Shipping" className="h-6 w-32 border-0 bg-transparent p-0 text-[10px] shadow-none focus-visible:ring-0" />
                    <span className="text-[8px] text-muted-foreground">{co.text.length}/{RSA_LIMITS.callout.charLimit}</span>
                    <button type="button" onClick={() => removeCallout(co.id)} className="text-muted-foreground hover:text-red-500"><X className="size-2.5" /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Structured Snippets */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="size-3 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Structured Snippets</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{snippets.length}</Badge>
                  <InfoTip text="Highlight specific aspects of your products using predefined headers and values (3-10 values, 25 chars each)." />
                </div>
                {snippets.length < 4 && (
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addSnippet}><Plus className="size-3" /> Add</Button>
                )}
              </div>
              {snippets.map((sn) => (
                <div key={sn.id} className="mb-2 rounded-lg border border-border bg-muted/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Select value={sn.header} onValueChange={(v) => updateNested("creative", { structuredSnippetExtensions: snippets.map((s) => s.id === sn.id ? { ...s, header: v } : s) })}>
                      <SelectTrigger className="h-7 w-40 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STRUCTURED_SNIPPET_HEADERS.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button type="button" onClick={() => removeSnippet(sn.id)} className="text-muted-foreground hover:text-red-500"><X className="size-3" /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sn.values.map((val, vi) => (
                      <Input key={vi} value={val} onChange={(e) => {
                        const vals = [...sn.values]; vals[vi] = e.target.value.slice(0, RSA_LIMITS.snippet.valueLimit);
                        updateNested("creative", { structuredSnippetExtensions: snippets.map((s) => s.id === sn.id ? { ...s, values: vals } : s) });
                      }} placeholder={`Value ${vi + 1}`} className="h-7 w-28 text-[10px]" />
                    ))}
                    {sn.values.length < RSA_LIMITS.snippet.maxValues && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px]" onClick={() => {
                        updateNested("creative", { structuredSnippetExtensions: snippets.map((s) => s.id === sn.id ? { ...s, values: [...s.values, ""] } : s) });
                      }}><Plus className="size-3" /> Value</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* RIGHT: Google Search Preview + Ad Strength + Checklist       */}
        {/* ============================================================ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="sticky top-20 flex flex-col gap-4">

            {/* Google Search Ad Preview */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Eye className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Search Ad Preview</Label>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                {/* Ad badge + URL */}
                <div className="mb-1 flex items-center gap-1.5">
                  <Badge className="rounded bg-foreground/10 px-1 py-0 text-[9px] font-bold text-foreground hover:bg-foreground/10">Ad</Badge>
                  <span className="text-[11px] text-foreground">
                    {previewAd.finalUrl ? new URL(previewAd.finalUrl.startsWith("http") ? previewAd.finalUrl : `https://${previewAd.finalUrl}`).hostname : "store.salla.sa"}
                    {previewAd.displayPath1 && `/${previewAd.displayPath1}`}
                    {previewAd.displayPath2 && `/${previewAd.displayPath2}`}
                  </span>
                </div>
                {/* Headlines joined by " | " */}
                <p className="mb-1 text-sm font-semibold leading-snug text-blue-700">
                  {previewAd.headlines.filter((h) => h.text.trim()).slice(0, 3).map((h) => h.text).join(" | ") || "Headline 1 | Headline 2 | Headline 3"}
                </p>
                {/* Descriptions joined */}
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {previewAd.descriptions.filter((d) => d.text.trim()).slice(0, 2).map((d) => d.text).join(" ") || "Description 1. Description 2."}
                </p>
                {/* Sitelinks preview */}
                {sitelinks.filter((s) => s.linkText.trim()).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 border-t border-border pt-2">
                    {sitelinks.filter((s) => s.linkText.trim()).slice(0, 4).map((s) => (
                      <span key={s.id} className="text-[10px] font-medium text-blue-600">{s.linkText}</span>
                    ))}
                  </div>
                )}
                {/* Callouts preview */}
                {callouts.filter((c) => c.text.trim()).length > 0 && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {callouts.filter((c) => c.text.trim()).map((c) => c.text).join(" - ")}
                  </p>
                )}
              </div>
            </div>

            {/* Ad Strength */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Gauge className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Ad Strength</Label>
                <span className={cn("text-xs font-semibold", previewStrength.color)}>{previewStrength.label}</span>
              </div>
              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all",
                  previewStrength.pct >= 100 ? "bg-emerald-500" : previewStrength.pct >= 75 ? "bg-emerald-400" : previewStrength.pct >= 50 ? "bg-amber-500" : "bg-red-500"
                )} style={{ width: `${previewStrength.pct}%` }} />
              </div>

              {/* Checklist */}
              <div className="flex flex-col gap-1.5 text-[11px]">
                {[
                  { label: "Headlines", done: previewAd.headlines.filter((h) => h.text.trim()).length >= RSA_LIMITS.headlines.min, count: `${previewAd.headlines.filter((h) => h.text.trim()).length}/${RSA_LIMITS.headlines.max}` },
                  { label: "Descriptions", done: previewAd.descriptions.filter((d) => d.text.trim()).length >= RSA_LIMITS.descriptions.min, count: `${previewAd.descriptions.filter((d) => d.text.trim()).length}/${RSA_LIMITS.descriptions.max}` },
                  { label: "Final URL", done: !!previewAd.finalUrl.trim(), count: previewAd.finalUrl.trim() ? "Set" : "Required" },
                  { label: "Display Path", done: !!previewAd.displayPath1.trim(), count: previewAd.displayPath1.trim() ? "Set" : "Optional" },
                  { label: "Keywords", done: currentGroup.keywords.length >= 1, count: `${currentGroup.keywords.length}` },
                  { label: "Sitelinks", done: sitelinks.length >= 2, count: `${sitelinks.length}` },
                  { label: "Callouts", done: callouts.length >= 2, count: `${callouts.length}` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {item.done ? <CheckCircle2 className="size-3 text-emerald-500" /> : <div className="size-3 rounded-full border-2 border-muted" />}
                      <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                    </div>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* API Mapping */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Globe className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">API Mapping</Label>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                <p>Campaign.advertising_channel_type: <span className="text-foreground">SEARCH</span></p>
                <p>AdGroup.type: <span className="text-foreground">SEARCH_STANDARD</span></p>
                <p>Ad.responsive_search_ad:</p>
                <p className="ml-2">headlines[]: <span className="text-foreground">{previewAd.headlines.filter((h) => h.text.trim()).length} AdTextAsset</span></p>
                <p className="ml-2">descriptions[]: <span className="text-foreground">{previewAd.descriptions.filter((d) => d.text.trim()).length} AdTextAsset</span></p>
                <p>AdGroupCriterion.keyword: <span className="text-foreground">{currentGroup.keywords.length} keywords</span></p>
                {sitelinks.length > 0 && <p>CampaignAsset.sitelink: <span className="text-foreground">{sitelinks.length}</span></p>}
                {callouts.length > 0 && <p>CampaignAsset.callout: <span className="text-foreground">{callouts.length}</span></p>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Review & Launch"
      />
    </TooltipProvider>
  );
}

/* ================================================================== */
/*  DEMAND GEN: Main Creative Editor (multi ad group + sidebar)       */
/* ================================================================== */

function DemandGenCreativeEditor() {
  const { campaign, setStep, updateNested } = useGoogleCampaign();
  const adGroups = campaign.creative.demandGenAdGroups ?? [];
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [previewChannel, setPreviewChannel] = useState<string>("youtube_feed");

  const activeGroup = adGroups[activeGroupIdx] ?? adGroups[0];
  const activeAd = activeGroup?.ads[0];

  /* Ad group mutation helpers */
  const setAdGroups = useCallback((next: DemandGenAdGroup[]) => {
    updateNested("creative", { demandGenAdGroups: next });
  }, [updateNested]);

  const updateGroup = useCallback((groupIdx: number, patch: Partial<DemandGenAdGroup>) => {
    const next = [...adGroups];
    next[groupIdx] = { ...next[groupIdx], ...patch };
    setAdGroups(next);
  }, [adGroups, setAdGroups]);

  const updateAd = useCallback((groupIdx: number, adIdx: number, patch: Partial<DemandGenAd>) => {
    const next = [...adGroups];
    const ads = [...next[groupIdx].ads];
    ads[adIdx] = { ...ads[adIdx], ...patch };
    next[groupIdx] = { ...next[groupIdx], ads };
    setAdGroups(next);
  }, [adGroups, setAdGroups]);

  const addAdGroup = () => {
    const next = [...adGroups, createDemandGenAdGroup(adGroups.length + 1)];
    setAdGroups(next);
    setActiveGroupIdx(next.length - 1);
  };

  const deleteAdGroup = (idx: number) => {
    if (adGroups.length <= 1) return;
    const next = adGroups.filter((_, i) => i !== idx);
    setAdGroups(next);
    setActiveGroupIdx(Math.min(activeGroupIdx, next.length - 1));
  };

  const duplicateAdGroup = (idx: number) => {
    const source = adGroups[idx];
    const dup: DemandGenAdGroup = {
      ...source,
      id: `dg-ag-${Date.now()}`,
      name: `${source.name} (copy)`,
      ads: source.ads.map((a) => ({ ...a, id: `dg-ad-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })),
    };
    const next = [...adGroups]; next.splice(idx + 1, 0, dup);
    setAdGroups(next);
    setActiveGroupIdx(idx + 1);
  };

  const addAd = (groupIdx: number) => {
    const group = adGroups[groupIdx];
    updateGroup(groupIdx, { ads: [...group.ads, createDemandGenAd(group.ads.length + 1)] });
  };

  const deleteAd = (groupIdx: number, adIdx: number) => {
    const group = adGroups[groupIdx];
    if (group.ads.length <= 1) return;
    updateGroup(groupIdx, { ads: group.ads.filter((_, i) => i !== adIdx) });
  };

  const duplicateAd = (groupIdx: number, adIdx: number) => {
    const group = adGroups[groupIdx];
    const source = group.ads[adIdx];
    const dup: DemandGenAd = { ...source, id: `dg-ad-${Date.now()}`, name: `${source.name} (copy)` };
    const ads = [...group.ads]; ads.splice(adIdx + 1, 0, dup);
    updateGroup(groupIdx, { ads });
  };

  /* Summary stats */
  const totalAds = adGroups.reduce((sum, g) => sum + g.ads.length, 0);
  const enabledChannels = activeGroup ? Object.entries(activeGroup.channelControls).filter(([, v]) => v).map(([k]) => k) : [];

  /* Preview ad */
  const previewAd = activeGroup?.ads[0];
  const previewStrength = previewAd ? calcDgAdStrength(previewAd) : { score: 0, label: "Poor", color: "text-red-500", pct: 0 };

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>
        {/* ============ LEFT COLUMN ============ */}
        <div className="flex flex-1 flex-col gap-5">

          {/* Hero */}
          <div>
            <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
              Demand Gen Creative
            </h1>
            <p className="mt-1.5 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground">
              Build ad groups with multiple ads. Each ad group gets its own channel placements. Google optimizes ad combinations within each group.
            </p>
          </div>

          {/* ---- Ad Group Tabs ---- */}
          <div className="flex items-end gap-2 border-b border-border pb-0">
            <div className="flex flex-1 gap-1 overflow-x-auto">
              {adGroups.map((ag, gi) => (
                <div
                  key={ag.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveGroupIdx(gi)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveGroupIdx(gi); } }}
                  className={cn(
                    "group flex shrink-0 cursor-pointer items-center gap-2 rounded-t-lg border-x border-t px-3.5 py-2 text-xs font-medium transition-colors",
                    gi === activeGroupIdx
                      ? "border-border bg-card text-foreground shadow-sm"
                      : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <span>{ag.name || `Ad Group ${gi + 1}`}</span>
                  <Badge variant="secondary" className="rounded-full px-1 py-0 text-[9px]">{ag.ads.length} ad{ag.ads.length !== 1 ? "s" : ""}</Badge>
                  {adGroups.length > 1 && (
                    <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button type="button" onClick={(e) => { e.stopPropagation(); duplicateAdGroup(gi); }} className="rounded p-0.5 hover:bg-muted" title="Duplicate">
                        <Copy className="size-3 text-muted-foreground" />
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); deleteAdGroup(gi); }} className="rounded p-0.5 hover:bg-red-50" title="Delete">
                        <Trash2 className="size-3 text-muted-foreground hover:text-red-500" />
                      </button>
                    </span>
                  )}
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mb-0.5 gap-1 text-xs text-primary hover:text-primary" onClick={addAdGroup}>
              <Plus className="size-3" /> Ad Group
            </Button>
          </div>

          {/* ---- Active Ad Group Panel ---- */}
          {activeGroup && (
            <div className="flex flex-col gap-4">
              {/* Ad Group Name */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="mb-1 text-xs font-semibold text-foreground">Ad Group Name</Label>
                  <Input
                    value={activeGroup.name}
                    onChange={(e) => updateGroup(activeGroupIdx, { name: e.target.value })}
                    placeholder="Ad Group name"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Channel Controls (per ad group) */}
              <SectionCard>
                <div className="mb-3 flex items-center gap-2">
                  <Tv className="size-4 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Channel Placements</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{enabledChannels.length} active</Badge>
                  <InfoTip text="Per-ad-group channel controls. Maps to DemandGenAdGroupSettings.channel_controls.selected_channels in the Google Ads API." />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DG_CHANNEL_DEFS.map((ch) => {
                    const isOn = activeGroup.channelControls[ch.key];
                    return (
                      <button
                        key={ch.key}
                        type="button"
                        onClick={() => updateGroup(activeGroupIdx, {
                          channelControls: { ...activeGroup.channelControls, [ch.key]: !isOn },
                        })}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                          isOn ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {ch.icon}
                        {ch.label}
                        {isOn && <CheckCircle2 className="size-3" />}
                      </button>
                    );
                  })}
                </div>
                {!Object.values(activeGroup.channelControls).some(Boolean) && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                    <AlertCircle className="size-3 text-red-600" />
                    <p className="text-[11px] text-red-700">Enable at least one channel.</p>
                  </div>
                )}
              </SectionCard>

              {/* Ads within this Ad Group */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-semibold text-foreground">Ads</Label>
                    <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{activeGroup.ads.length}</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => addAd(activeGroupIdx)}>
                    <Plus className="size-3" /> Add Ad
                  </Button>
                </div>
                <div className="flex flex-col gap-3">
                  {activeGroup.ads.map((ad, ai) => (
                    <DgAdEditor
                      key={ad.id}
                      ad={ad}
                      adIndex={ai}
                      totalAds={activeGroup.ads.length}
                      onUpdate={(patch) => updateAd(activeGroupIdx, ai, patch)}
                      onDelete={() => deleteAd(activeGroupIdx, ai)}
                      onDuplicate={() => duplicateAd(activeGroupIdx, ai)}
                    />
                  ))}
                </div>
              </div>

              {/* Salla Tip */}
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
                <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-primary">Salla Tip:</span>{" "}
                  Create separate ad groups for different audience segments (e.g., new customers vs. retargeting). Use Multi-Asset for broad discovery and Carousel for showcasing product collections.
                </p>
              </div>
            </div>
          )}

          {/* AI Creative Automation */}
          {activeAd && (() => {
            const DG_AUTOMATION_ITEMS: { type: DemandGenAdAutomationType; label: string; desc: string; icon: React.ReactNode }[] = [
              { type: "GENERATE_DESIGN_VERSIONS_FOR_IMAGES", label: "Image Design Versions", desc: "Auto-create cropped, resized, and reformatted image variations for each placement.", icon: <ImageIcon className="size-3.5" /> },
              { type: "GENERATE_SHORTER_YOUTUBE_VIDEOS", label: "Shorter Video Cuts", desc: "Generate shorter video edits from your uploaded videos for better engagement.", icon: <PlayCircle className="size-3.5" /> },
              { type: "GENERATE_VERTICAL_YOUTUBE_VIDEOS", label: "Vertical Video Versions", desc: "Auto-create vertical (9:16) videos from horizontal uploads for YouTube Shorts and mobile feeds.", icon: <PlayCircle className="size-3.5" /> },
              { type: "GENERATE_VIDEOS_FROM_OTHER_ASSETS", label: "Videos from Images", desc: "Turn your uploaded images and text into short animated video ads.", icon: <PlayCircle className="size-3.5" /> },
            ];
            const automation = activeAd.adAssetAutomation ?? {
              GENERATE_DESIGN_VERSIONS_FOR_IMAGES: "OPTED_IN" as AssetAutomationStatus,
              GENERATE_SHORTER_YOUTUBE_VIDEOS: "OPTED_IN" as AssetAutomationStatus,
              GENERATE_VERTICAL_YOUTUBE_VIDEOS: "OPTED_IN" as AssetAutomationStatus,
              GENERATE_VIDEOS_FROM_OTHER_ASSETS: "OPTED_IN" as AssetAutomationStatus,
            };
            const toggleDgAutomation = (type: DemandGenAdAutomationType) => {
              const current = automation[type] ?? "OPTED_IN";
              const next: AssetAutomationStatus = current === "OPTED_IN" ? "OPTED_OUT" : "OPTED_IN";
              const updatedAutomation = { ...automation, [type]: next };
              const updatedAd = { ...activeAd, adAssetAutomation: updatedAutomation };
              const updatedAds = activeGroup.ads.map((a: DemandGenAd) => a.id === activeAd.id ? updatedAd : a);
              updateGroup(activeGroupIdx, { ads: updatedAds });
            };

            return (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.02] p-4">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="size-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">AI Creative Automation</p>
                    <p className="text-[10px] text-muted-foreground">Per-ad settings. Maps to Ad.asset_automation_settings in the API.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {DG_AUTOMATION_ITEMS.map((item) => {
                    const isOn = (automation[item.type] ?? "OPTED_IN") === "OPTED_IN";
                    return (
                      <div key={item.type} className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all", isOn ? "border-primary/20 bg-primary/[0.03]" : "border-border bg-background")}>
                        <div className={cn("flex size-6 shrink-0 items-center justify-center rounded", isOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-foreground">{item.label}</p>
                          <p className="text-[9px] text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch checked={isOn} onCheckedChange={() => toggleDgAutomation(item.type)} className="scale-90" />
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[9px] text-muted-foreground">
                  <span className="font-semibold text-primary">Tip:</span> Keep all automation enabled. Google tests AI-generated creative variations to find the best performers for your audience.
                </p>
              </div>
            );
          })()}
        </div>

        {/* ============ RIGHT SIDEBAR ============ */}
        <div className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-20 flex flex-col gap-4">

            {/* Compact Phone Preview */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">Ad Preview</p>
                <Eye className="size-3.5 text-muted-foreground" />
              </div>
              {/* Channel tabs */}
              <div className="mb-3 flex gap-1">
                {DG_PREVIEW_CHANNELS.map((ch) => (
                  <button
                    key={ch.key}
                    type="button"
                    onClick={() => setPreviewChannel(ch.key)}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                      previewChannel === ch.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {ch.icon} {ch.label}
                  </button>
                ))}
              </div>
              {/* Phone mockup */}
              <div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-2xl border-2 border-foreground/10 bg-background shadow-md">
                <div className="flex aspect-[4/3] items-center justify-center bg-muted">
                  {previewAd?.adType === "VIDEO_RESPONSIVE" ? (
                    <PlayCircle className="size-10 text-muted-foreground/20" />
                  ) : (
                    <ImageIcon className="size-10 text-muted-foreground/20" />
                  )}
                </div>
                <div className="p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="size-4 rounded-full bg-muted" />
                    <span className="text-[10px] font-medium text-foreground">{previewAd?.businessName || "Store"}</span>
                    <Badge variant="secondary" className="rounded-full px-1 py-0 text-[8px]">Ad</Badge>
                  </div>
                  <p className="text-[11px] font-semibold leading-tight text-foreground">
                    {previewAd?.headlines[0]?.text || "Your headline here"}
                  </p>
                  <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground">
                    {previewAd?.descriptions[0]?.text || "Description preview"}
                  </p>
                  <div className="mt-2 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[9px] font-medium text-primary-foreground">
                    {CTA_OPTIONS.find((c) => c.value === previewAd?.callToAction)?.label ?? "Learn more"}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Ad Group Summary */}
            <SectionCard className="p-4">
              <p className="mb-3 text-xs font-bold text-foreground">Campaign Summary</p>
              <div className="flex flex-col gap-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ad Groups</span>
                  <span className="font-semibold text-foreground">{adGroups.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Ads</span>
                  <span className="font-semibold text-foreground">{totalAds}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active Channels</span>
                  <span className="font-semibold text-foreground">{enabledChannels.length}</span>
                </div>
                <div className="mt-1 border-t border-border pt-2">
                  <p className="mb-1 text-[10px] font-medium text-muted-foreground">Per Ad Group:</p>
                  {adGroups.map((ag, gi) => (
                    <div key={ag.id} className="flex items-center justify-between py-0.5">
                      <span className={cn("text-muted-foreground", gi === activeGroupIdx && "font-medium text-foreground")}>
                        {ag.name || `Ad Group ${gi + 1}`}
                      </span>
                      <span className="text-muted-foreground">{ag.ads.length} ad{ag.ads.length !== 1 ? "s" : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* Ad Strength (active ad group's first ad) */}
            {previewAd && (
              <SectionCard className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground">Ad Strength</p>
                  <span className={cn("text-xs font-bold", previewStrength.color)}>{previewStrength.label}</span>
                </div>
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full transition-all", previewStrength.pct >= 75 ? "bg-emerald-500" : previewStrength.pct >= 50 ? "bg-amber-500" : "bg-red-400")} style={{ width: `${previewStrength.pct}%` }} />
                </div>
                <div className="flex flex-col gap-1.5 text-[11px]">
                  {(previewAd.adType === "MULTI_ASSET" ? [
                    { label: "Headlines", done: previewAd.headlines.filter((h) => h.text.trim()).length >= 1, count: `${previewAd.headlines.filter((h) => h.text.trim()).length}/${DG_LIMITS.multiAsset.headlines.max}` },
                    { label: "Descriptions", done: previewAd.descriptions.filter((d) => d.text.trim()).length >= 1, count: `${previewAd.descriptions.filter((d) => d.text.trim()).length}/${DG_LIMITS.multiAsset.descriptions.max}` },
                    { label: "Images", done: previewAd.images.length >= 1, count: `${previewAd.images.length}/20` },
                    { label: "Logo", done: previewAd.logos.length >= 1, count: previewAd.logos.length >= 1 ? `${previewAd.logos.length}/5` : "Required" },
                  ] : previewAd.adType === "CAROUSEL" ? [
                    { label: "Headline", done: !!previewAd.carouselHeadline?.trim(), count: previewAd.carouselHeadline?.trim() ? "Set" : "Required" },
                    { label: "Description", done: !!previewAd.carouselDescription?.trim(), count: previewAd.carouselDescription?.trim() ? "Set" : "Required" },
                    { label: "Logo", done: previewAd.logos.length >= 1, count: previewAd.logos.length >= 1 ? "Set" : "Required" },
                    { label: "Cards", done: previewAd.carouselCards.filter((c) => c.headline.trim()).length >= 2, count: `${previewAd.carouselCards.filter((c) => c.headline.trim()).length}/${previewAd.carouselCards.length}` },
                  ] : [
                    { label: "Videos", done: previewAd.videos.length >= 1, count: `${previewAd.videos.length}/${DG_LIMITS.videoResponsive.videos.max}` },
                    { label: "Headlines", done: previewAd.headlines.filter((h) => h.text.trim()).length >= 1, count: `${previewAd.headlines.filter((h) => h.text.trim()).length}/${DG_LIMITS.videoResponsive.headlines.max}` },
                    { label: "Long Headlines", done: previewAd.longHeadlines.filter((h) => h.text.trim()).length >= 1, count: `${previewAd.longHeadlines.filter((h) => h.text.trim()).length}/${DG_LIMITS.videoResponsive.longHeadlines.max}` },
                    { label: "Descriptions", done: previewAd.descriptions.filter((d) => d.text.trim()).length >= 1, count: `${previewAd.descriptions.filter((d) => d.text.trim()).length}/${DG_LIMITS.videoResponsive.descriptions.max}` },
                    { label: "Logo", done: previewAd.logos.length >= 1, count: previewAd.logos.length >= 1 ? `${previewAd.logos.length}/5` : "Required" },
                  ]).concat([
                    { label: "Business Name", done: !!previewAd.businessName.trim(), count: previewAd.businessName.trim() ? "Set" : "Required" },
                    { label: "Final URL", done: !!previewAd.finalUrl.trim(), count: previewAd.finalUrl.trim() ? "Set" : "Required" },
                  ]).map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className={cn("size-3", item.done ? "text-emerald-500" : "text-muted-foreground/30")} />
                        <span className={cn(item.done ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                      </div>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* API Mapping (corrected) */}
            <SectionCard className="p-4">
              <p className="mb-3 text-xs font-bold text-foreground">API Mapping</p>
              <div className="flex flex-col gap-1.5 text-[11px]">
                {[
                  "Campaign (DEMAND_GEN)",
                  "AdGroup + DemandGenAdGroupSettings",
                  "AdGroupAd",
                  previewAd ? (DG_AD_FORMAT_OPTIONS.find((f) => f.value === previewAd.adType)?.api ?? "DemandGenMultiAssetAdInfo") : "DemandGenMultiAssetAdInfo",
                ].map((api) => (
                  <div key={api} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    <span className="text-muted-foreground">{api}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Tips */}
            <SectionCard className="p-4">
              <p className="text-xs font-semibold text-foreground">Demand Gen Tips</p>
              <ul className="mt-2 flex flex-col gap-1.5 text-xs leading-relaxed text-muted-foreground">
                <li>- Create 2-3 ad groups for different segments</li>
                <li>- Add 3-5 ads per ad group for optimization</li>
                <li>- Use lifestyle images with products in context</li>
                <li>- Video ads on Shorts get 2-3x engagement</li>
                <li>- Square images work best on Discover & Gmail</li>
              </ul>
            </SectionCard>
          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Review & Launch"
      />
    </TooltipProvider>
  );
}

/* ================================================================== */
/*  SHOPPING: Product Groups Component                                */
/* ================================================================== */

const MOCK_PRODUCTS = [
  { id: "p1", name: "Oud Al Khalij Perfume 100ml", brand: "Oud Collection", category: "Perfume & Fragrance", price: "SAR 189", image: "", condition: "new", status: "approved" },
  { id: "p2", name: "Silk Abaya - Classic Black", brand: "Salla Fashion", category: "Apparel & Accessories", price: "SAR 320", image: "", condition: "new", status: "approved" },
  { id: "p3", name: "Arabian Coffee Set - Gold", brand: "Home Essentials", category: "Home & Kitchen", price: "SAR 95", image: "", condition: "new", status: "approved" },
  { id: "p4", name: "Wireless Earbuds Pro Max", brand: "TechGear", category: "Consumer Electronics", price: "SAR 249", image: "", condition: "new", status: "approved" },
  { id: "p5", name: "Natural Henna Hair Mask", brand: "Beauty Touch", category: "Beauty & Personal Care", price: "SAR 45", image: "", condition: "new", status: "approved" },
  { id: "p6", name: "Kids Play Tent - Desert Theme", brand: "Happy Kids", category: "Baby & Children", price: "SAR 129", image: "", condition: "new", status: "approved" },
];

const DIMENSION_OPTIONS: { value: ProductDimensionType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "PRODUCT_BRAND", label: "Brand", icon: <Star className="size-3.5" />, desc: "Group products by brand name" },
  { value: "PRODUCT_CATEGORY", label: "Category", icon: <FolderTree className="size-3.5" />, desc: "Group by Google product category" },
  { value: "PRODUCT_TYPE", label: "Product Type", icon: <Package className="size-3.5" />, desc: "Group by your custom product type" },
  { value: "PRODUCT_CONDITION", label: "Condition", icon: <Tag className="size-3.5" />, desc: "Group by new, refurbished, or used" },
  { value: "PRODUCT_CUSTOM_ATTRIBUTE_0", label: "Custom Label 0", icon: <Filter className="size-3.5" />, desc: "Group by custom label 0 from your feed" },
  { value: "PRODUCT_CUSTOM_ATTRIBUTE_1", label: "Custom Label 1", icon: <Filter className="size-3.5" />, desc: "Group by custom label 1 from your feed" },
  { value: "PRODUCT_ITEM_ID", label: "Item ID", icon: <Tag className="size-3.5" />, desc: "Target specific products by ID" },
];

const MOCK_BRANDS = ["Oud Collection", "Salla Fashion", "Home Essentials", "TechGear", "Beauty Touch", "Happy Kids"];
const MOCK_CATEGORIES = ["Perfume & Fragrance", "Apparel & Accessories", "Home & Kitchen", "Consumer Electronics", "Beauty & Personal Care", "Baby & Children"];

function ShoppingProductGroups() {
  const { campaign, setStep, updateNested } = useGoogleCampaign();
  const creative = campaign.creative;
  const isManualCpc = campaign.budget.biddingStrategy === "MANUAL_CPC";

  const [selectedDimension, setSelectedDimension] = useState<ProductDimensionType>("PRODUCT_BRAND");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [excludedValues, setExcludedValues] = useState<string[]>([]);
  const [bidOverrides, setBidOverrides] = useState<Record<string, number>>({});

  const toggleValue = (val: string) =>
    setSelectedValues((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  const toggleExclude = (val: string) =>
    setExcludedValues((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);

  const currentDimensionValues = selectedDimension === "PRODUCT_BRAND" ? MOCK_BRANDS
    : selectedDimension === "PRODUCT_CATEGORY" ? MOCK_CATEGORIES
    : selectedDimension === "PRODUCT_CONDITION" ? ["New", "Refurbished", "Used"]
    : selectedDimension === "PRODUCT_TYPE" ? MOCK_CATEGORIES
    : ["Label A", "Label B", "Label C"];

  const includedProducts = MOCK_PRODUCTS.filter((p) => {
    if (selectedValues.length === 0) return true;
    if (selectedDimension === "PRODUCT_BRAND") return selectedValues.includes(p.brand);
    if (selectedDimension === "PRODUCT_CATEGORY") return selectedValues.includes(p.category);
    return true;
  }).filter((p) => {
    if (excludedValues.length === 0) return true;
    if (selectedDimension === "PRODUCT_BRAND") return !excludedValues.includes(p.brand);
    if (selectedDimension === "PRODUCT_CATEGORY") return !excludedValues.includes(p.category);
    return true;
  });

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>
        {/* LEFT COLUMN */}
        <div className="flex flex-1 flex-col gap-5">

          {/* Hero */}
          <div>
            <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
              Product Groups & Listing
            </h1>
            <p className="mt-2 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground">
              Shopping ads are auto-generated from your Merchant Center feed. Organize your products into groups to control bids and exclude products you don't want to advertise.
            </p>
          </div>

          {/* Product Feed Summary */}
          <SectionCard>
            <div className="mb-4 flex items-center gap-2">
              <Store className="size-4 text-primary" />
              <Label className="text-sm font-semibold text-foreground">Product Feed Overview</Label>
              <Badge className="rounded-full bg-primary/10 px-2 py-0 text-xs text-primary">Salla</Badge>
            </div>
            <div className="mb-4 grid grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-foreground">1,247</p>
                <p className="text-[11px] text-muted-foreground">Total Products</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-emerald-700">1,198</p>
                <p className="text-[11px] text-emerald-600">Approved</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-amber-700">37</p>
                <p className="text-[11px] text-amber-600">Pending</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-red-700">12</p>
                <p className="text-[11px] text-red-600">Disapproved</p>
              </div>
            </div>

            {/* Sample products */}
            <div className="rounded-lg border border-border">
              <div className="border-b border-border bg-muted/30 px-3 py-2">
                <p className="text-xs font-semibold text-foreground">Sample Products from Your Feed</p>
              </div>
              <div className="divide-y divide-border">
                {MOCK_PRODUCTS.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Package className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.brand} -- {p.category}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-foreground">{p.price}</span>
                    <Badge variant="outline" className="shrink-0 gap-1 rounded-full px-1.5 py-0 text-[10px]">
                      <CheckCircle2 className="size-2.5 text-emerald-500" />
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Product Group Partitions */}
          <SectionCard>
            <div className="mb-1 flex items-center gap-2">
              <FolderTree className="size-4 text-primary" />
              <Label className="text-sm font-semibold text-foreground">Product Group Partitions</Label>
              <InfoTip text="Split your products into groups to control bids and targeting. Maps to AdGroupListingGroupFilter in the Google Ads API. Leave all selected to bid on all products." />
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Choose how to subdivide your products. You can include or exclude specific groups and set bid overrides per group.
            </p>

            {/* Dimension selector */}
            <div className="mb-4">
              <Label className="mb-2 block text-xs font-semibold text-foreground">Subdivide by:</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DIMENSION_OPTIONS.slice(0, 4).map((dim) => {
                  const isSelected = selectedDimension === dim.value;
                  return (
                    <button
                      key={dim.value}
                      type="button"
                      onClick={() => {
                        setSelectedDimension(dim.value);
                        setSelectedValues([]);
                        setExcludedValues([]);
                      }}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/[0.04] shadow-sm"
                          : "border-border bg-background hover:border-primary/40"
                      )}
                    >
                      <div className={cn(
                        "flex size-7 items-center justify-center rounded-lg",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {dim.icon}
                      </div>
                      <p className={cn("text-xs font-semibold", isSelected ? "text-primary" : "text-foreground")}>{dim.label}</p>
                      <p className="text-[10px] text-muted-foreground">{dim.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Value selection */}
            <div className="mb-4">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                Include / Exclude
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                  {selectedValues.length === 0 ? "All included" : `${selectedValues.length} selected`}
                </Badge>
              </Label>
              <p className="mb-3 text-[11px] text-muted-foreground">
                Select specific values to include. Leave empty to include all products. Use the exclude toggle to block specific groups.
              </p>
              <div className="flex flex-col gap-2">
                {currentDimensionValues.map((val) => {
                  const included = selectedValues.includes(val);
                  const excluded = excludedValues.includes(val);
                  return (
                    <div key={val} className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all",
                      excluded ? "border-red-200 bg-red-50" : included ? "border-primary bg-primary/5" : "border-border bg-background"
                    )}>
                      <button
                        type="button"
                        onClick={() => { if (!excluded) toggleValue(val); }}
                        className={cn(
                          "flex size-5 items-center justify-center rounded border transition-colors",
                          excluded ? "border-red-300 bg-red-100" : included ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"
                        )}
                      >
                        {included && <CheckCircle2 className="size-3" />}
                        {excluded && <X className="size-3 text-red-600" />}
                      </button>
                      <span className={cn("flex-1 text-xs font-medium", excluded ? "text-red-600 line-through" : "text-foreground")}>{val}</span>
                      {isManualCpc && !excluded && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">CPC:</span>
                          <Input
                            type="number"
                            min={0.01}
                            step={0.1}
                            placeholder="Auto"
                            value={bidOverrides[val] || ""}
                            onChange={(e) => setBidOverrides((prev) => ({ ...prev, [val]: Number(e.target.value) }))}
                            className="h-7 w-20 text-xs"
                          />
                          <span className="text-[10px] text-muted-foreground">SAR</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (excluded) {
                            toggleExclude(val);
                          } else {
                            setSelectedValues((prev) => prev.filter((v) => v !== val));
                            toggleExclude(val);
                          }
                        }}
                        className={cn(
                          "rounded px-2 py-1 text-[10px] font-medium transition-colors",
                          excluded ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        )}
                      >
                        {excluded ? "Unexclude" : "Exclude"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Product count summary */}
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
              <ShoppingBag className="size-4 text-primary" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">
                  {includedProducts.length} of {MOCK_PRODUCTS.length} products will be advertised
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Based on your selected filters above
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Shopping Ad Preview */}
          <SectionCard>
            <div className="mb-4 flex items-center gap-2">
              <Eye className="size-4 text-primary" />
              <Label className="text-sm font-semibold text-foreground">Shopping Ad Preview</Label>
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">Auto-generated</Badge>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Shopping ads are automatically created from your Merchant Center product feed. No creative setup is needed -- Google generates product listing ads using your product images, titles, prices, and store name.
            </p>

            {/* Preview cards */}
            <div className="grid grid-cols-3 gap-3">
              {MOCK_PRODUCTS.slice(0, 3).map((p) => (
                <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                  <div className="flex aspect-square items-center justify-center bg-muted">
                    <Package className="size-10 text-muted-foreground/30" />
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-xs font-semibold text-foreground">{p.price}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{p.name}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{p.brand}</p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <div className="flex">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={cn("size-2.5", s <= 4 ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                        ))}
                      </div>
                      <span className="text-[9px] text-muted-foreground">4.2 (128)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
              <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-primary">Salla Tip:</span>{" "}
                Make sure your product titles and images are optimized in your Salla store. High-quality product data directly improves Shopping ad performance and click-through rates.
              </p>
            </div>
          </SectionCard>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-20 flex flex-col gap-4">

            {/* Feed Health */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Gauge className="size-4 text-primary" />
                <p className="text-xs font-bold text-foreground">Feed Health</p>
                <span className="ml-auto text-xs font-bold text-emerald-600">Healthy</span>
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[92%] rounded-full bg-emerald-500 transition-all" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                92% of products approved. Fix 12 disapproved items to improve.
              </p>
            </SectionCard>

            {/* Product Group Summary */}
            <SectionCard className="p-4">
              <p className="mb-3 text-xs font-bold text-foreground">Product Group Summary</p>
              <div className="flex flex-col gap-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subdivided by</span>
                  <span className="font-medium text-foreground">{DIMENSION_OPTIONS.find((d) => d.value === selectedDimension)?.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Included groups</span>
                  <span className="font-medium text-foreground">{selectedValues.length === 0 ? "All" : selectedValues.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Excluded groups</span>
                  <span className={cn("font-medium", excludedValues.length > 0 ? "text-red-600" : "text-foreground")}>{excludedValues.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active products</span>
                  <span className="font-medium text-foreground">{includedProducts.length}</span>
                </div>
                {isManualCpc && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bid overrides</span>
                    <span className="font-medium text-foreground">{Object.keys(bidOverrides).filter((k) => bidOverrides[k] > 0).length}</span>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* API Mapping */}
            <SectionCard className="p-4">
              <p className="mb-3 text-xs font-bold text-foreground">API Mapping</p>
              <div className="flex flex-col gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  <span className="text-muted-foreground">ShoppingSetting.merchant_id</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  <span className="text-muted-foreground">AdGroupListingGroupFilter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  <span className="text-muted-foreground">ShoppingProductAdInfo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  <span className="text-muted-foreground">ListingGroupFilterDimension</span>
                </div>
              </div>
            </SectionCard>

            {/* Tips */}
            <SectionCard className="p-4">
              <p className="text-xs font-semibold text-foreground">Shopping Tips</p>
              <ul className="mt-2 flex flex-col gap-1.5 text-xs leading-relaxed text-muted-foreground">
                <li>- Subdivide by brand for more control over bids</li>
                <li>- Exclude low-margin products to improve ROAS</li>
                <li>- Use category groups for broad targeting</li>
                <li>- Custom labels let you group by promotions or seasons</li>
                <li>- Review disapproved products to maximize coverage</li>
              </ul>
            </SectionCard>
          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Review & Launch"
      />
    </TooltipProvider>
  );
}

/* ================================================================== */
/*  Main Component                                                    */
/* ================================================================== */

export function GoogleStepCreative() {
  const { campaign, setStep, updateNested } = useGoogleCampaign();
  const creative = campaign.creative;
  const objConfig = OBJECTIVE_CONFIGS[campaign.objective.objective] ?? OBJECTIVE_CONFIGS.PERFORMANCE_MAX;
  const isPMax = campaign.objective.objective === "PERFORMANCE_MAX";
  const isShopping = campaign.objective.objective === "SHOPPING";
  const isDemandGen = campaign.objective.objective === "DEMAND_GEN";

  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [previewChannel, setPreviewChannel] = useState<"search" | "display" | "youtube" | "discover">("search");

  const isSearch = campaign.objective.objective === "SEARCH";
  const isDisplay = campaign.objective.objective === "DISPLAY";
  const isApp = campaign.objective.objective === "APP";

  /* For Search, render the RSA editor */
  if (isSearch) return <SearchCreativeEditor />;

  /* For Display, render the RDA editor */
  if (isDisplay) return <DisplayCreativeEditor />;

  /* For App, render the App ad editor */
  if (isApp) return <AppCreativeEditor />;

  /* For Demand Gen, render the DG creative editor */
  if (isDemandGen) return <DemandGenCreativeEditor />;

  /* For Shopping, render the product groups UI instead of asset groups */
  if (isShopping) return <ShoppingProductGroups />;

  /* Ensure at least 1 asset group exists */
  const assetGroups = creative.assetGroups.length > 0 ? creative.assetGroups : [newAssetGroup()];
  const currentGroup = assetGroups[activeGroupIdx] ?? assetGroups[0];

  /* Update a single group in the array */
  const updateGroup = useCallback((groupId: string, partial: Partial<GoogleAssetGroup>) => {
    const groups = assetGroups.map((g) =>
      g.id === groupId ? { ...g, ...partial } : g
    );
    updateNested("creative", { assetGroups: groups });
  }, [assetGroups, updateNested]);

  /* Add group */
  const addGroup = () => {
    const groups = [...assetGroups, newAssetGroup()];
    updateNested("creative", { assetGroups: groups });
    setActiveGroupIdx(groups.length - 1);
  };

  /* Remove group */
  const removeGroup = (idx: number) => {
    if (assetGroups.length <= 1) return;
    const groups = assetGroups.filter((_, i) => i !== idx);
    updateNested("creative", { assetGroups: groups });
    setActiveGroupIdx(Math.min(activeGroupIdx, groups.length - 1));
  };

  /* Add text asset to a list */
  const addTextAsset = (field: "headlines" | "longHeadlines" | "descriptions", type: GoogleCreativeAsset["type"]) => {
    const list = [...currentGroup[field], newTextAsset(type)];
    updateGroup(currentGroup.id, { [field]: list });
  };

  /* Update text asset */
  const updateTextAsset = (field: "headlines" | "longHeadlines" | "descriptions", assetId: string, text: string) => {
    const list = currentGroup[field].map((a) => a.id === assetId ? { ...a, text } : a);
    updateGroup(currentGroup.id, { [field]: list });
  };

  /* Remove text asset */
  const removeTextAsset = (field: "headlines" | "longHeadlines" | "descriptions", assetId: string) => {
    const list = currentGroup[field].filter((a) => a.id !== assetId);
    updateGroup(currentGroup.id, { [field]: list });
  };

  /* Add placeholder image */
  const addImageAsset = (field: "images" | "logos") => {
    const asset: GoogleCreativeAsset = { id: makeId(), type: field === "logos" ? "LOGO" : "IMAGE", url: "" };
    updateGroup(currentGroup.id, { [field]: [...currentGroup[field], asset] });
  };

  /* Remove image */
  const removeImageAsset = (field: "images" | "logos", assetId: string) => {
    updateGroup(currentGroup.id, { [field]: currentGroup[field].filter((a) => a.id !== assetId) });
  };

  /* Add video */
  const addVideoAsset = () => {
    const asset: GoogleCreativeAsset = { id: makeId(), type: "YOUTUBE_VIDEO", youtubeVideoId: "", url: "" };
    updateGroup(currentGroup.id, { videos: [...currentGroup.videos, asset] });
  };

  const updateVideoAsset = (assetId: string, url: string) => {
    const idMatch = url.match(/(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
    const vId = idMatch ? idMatch[1] : url.trim();
    const list = currentGroup.videos.map((v) =>
      v.id === assetId ? { ...v, url, youtubeVideoId: vId } : v
    );
    updateGroup(currentGroup.id, { videos: list });
  };

  const removeVideoAsset = (assetId: string) => {
    updateGroup(currentGroup.id, { videos: currentGroup.videos.filter((v) => v.id !== assetId) });
  };

  /* Auto-initialize if needed */
  if (creative.assetGroups.length === 0) {
    updateNested("creative", { assetGroups: [newAssetGroup()] });
  }

  /* Ad strength */
  const adStrength = calcAdStrength(currentGroup);

  /* Validation */
  const filledHeadlines = currentGroup.headlines.filter((h) => h.text?.trim()).length;
  const filledLongHeadlines = currentGroup.longHeadlines.filter((h) => h.text?.trim()).length;
  const filledDescriptions = currentGroup.descriptions.filter((d) => d.text?.trim()).length;

  const canProceed = assetGroups.every((g) => {
    const h = g.headlines.filter((x) => x.text?.trim()).length >= 3;
    const lh = g.longHeadlines.filter((x) => x.text?.trim()).length >= 1;
    const d = g.descriptions.filter((x) => x.text?.trim()).length >= 2;
    const bn = g.businessName.trim().length > 0;
    const url = g.finalUrl.trim().length > 0;
    return h && lh && d && bn && url;
  });

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ============================================================ */}
        {/*  MAIN CONTENT                                                */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">

              {/* Hero */}
              <div>
                <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
                  Build your asset group
                </h1>
                <p className="mt-2 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground">
                  Asset groups contain all the creative elements Google uses to build ads across channels. Provide more assets for better optimization and higher ad strength.
                </p>
              </div>

              {/* ---- Asset Group Tabs ---- */}
              <div className="mb-6 flex items-center gap-2 overflow-x-auto">
                {assetGroups.map((g, idx) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setActiveGroupIdx(idx)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      idx === activeGroupIdx
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/40"
                    )}
                  >
                    <Layers className="size-3" />
                    {g.name || `Asset Group ${idx + 1}`}
                    {assetGroups.length > 1 && idx === activeGroupIdx && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); removeGroup(idx); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); removeGroup(idx); } }}
                        className="ml-1 inline-flex cursor-pointer rounded-full p-0.5 hover:bg-primary-foreground/20"
                      >
                        <X className="size-3" />
                      </span>
                    )}
                  </button>
                ))}
                <Button variant="outline" size="sm" className="h-7 gap-1 rounded-full text-xs" onClick={addGroup}>
                  <Plus className="size-3" />
                  Add Group
                </Button>
              </div>

              {/* ---- Group Name & Final URL ---- */}
              <SectionCard>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Layers className="size-3 text-muted-foreground" />
                      Asset Group Name
                    </Label>
                    <Input
                      placeholder="e.g. Summer Collection"
                      value={currentGroup.name}
                      onChange={(e) => updateGroup(currentGroup.id, { name: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Building2 className="size-3 text-muted-foreground" />
                      Business Name <span className="text-destructive">*</span>
                      <InfoTip text="Up to 25 characters. Maps to AssetFieldType.BUSINESS_NAME." />
                    </Label>
                    <Input
                      placeholder="Your store name"
                      maxLength={25}
                      value={currentGroup.businessName}
                      onChange={(e) => updateGroup(currentGroup.id, { businessName: e.target.value.slice(0, 25) })}
                      className="h-9 text-sm"
                    />
                    <p className="mt-1 text-right text-[10px] text-muted-foreground">{currentGroup.businessName.length}/25</p>
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Link2 className="size-3 text-muted-foreground" />
                    Final URL <span className="text-destructive">*</span>
                    <InfoTip text="The landing page for this asset group. Maps to AssetGroup.final_urls." />
                  </Label>
                  <Input
                    placeholder="https://your-store.salla.sa/collection/summer"
                    value={currentGroup.finalUrl}
                    onChange={(e) => updateGroup(currentGroup.id, { finalUrl: e.target.value })}
                    className="h-9 text-sm"
                  />
                  <div className="mt-2 flex gap-2">
                    <div className="flex-1">
                      <Label className="mb-1 block text-[10px] text-muted-foreground">Display Path 1</Label>
                      <Input
                        placeholder="summer"
                        maxLength={15}
                        value={currentGroup.displayPath1}
                        onChange={(e) => updateGroup(currentGroup.id, { displayPath1: e.target.value.slice(0, 15) })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="mb-1 block text-[10px] text-muted-foreground">Display Path 2</Label>
                      <Input
                        placeholder="collection"
                        maxLength={15}
                        value={currentGroup.displayPath2}
                        onChange={(e) => updateGroup(currentGroup.id, { displayPath2: e.target.value.slice(0, 15) })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* ---- Headlines ---- */}
              <SectionCard>
                <div className="mb-1 flex items-center gap-2">
                  <Type className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Headlines</Label>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                    {filledHeadlines}/{ASSET_LIMITS.headlines.max} (min {ASSET_LIMITS.headlines.min})
                  </Badge>
                  <InfoTip text={`Up to ${ASSET_LIMITS.headlines.max} headlines, ${ASSET_LIMITS.headlines.charLimit} chars each. Maps to AssetFieldType.HEADLINE.`} />
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Short headlines shown across all Google channels. More unique headlines = better optimization.
                </p>

                <div className="flex flex-col gap-2">
                  {currentGroup.headlines.map((h, idx) => (
                    <div key={h.id} className="flex items-center gap-2">
                      <span className="w-5 text-right text-[10px] text-muted-foreground">{idx + 1}</span>
                      <div className="relative flex-1">
                        <Input
                          placeholder={`Headline ${idx + 1}`}
                          maxLength={ASSET_LIMITS.headlines.charLimit}
                          value={h.text ?? ""}
                          onChange={(e) => updateTextAsset("headlines", h.id, e.target.value)}
                          className={cn("h-9 pr-12 text-sm", (h.text?.length ?? 0) > 25 && "border-amber-300")}
                        />
                        <span className={cn(
                          "absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tabular-nums",
                          (h.text?.length ?? 0) > 25 ? "text-amber-500" : "text-muted-foreground"
                        )}>
                          {h.text?.length ?? 0}/{ASSET_LIMITS.headlines.charLimit}
                        </span>
                      </div>
                      {currentGroup.headlines.length > ASSET_LIMITS.headlines.min && (
                        <button type="button" onClick={() => removeTextAsset("headlines", h.id)} className="p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {currentGroup.headlines.length < ASSET_LIMITS.headlines.max && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1 text-xs"
                    onClick={() => addTextAsset("headlines", "HEADLINE")}
                  >
                    <Plus className="size-3" />
                    Add Headline ({currentGroup.headlines.length}/{ASSET_LIMITS.headlines.max})
                  </Button>
                )}
              </SectionCard>

              {/* ---- Long Headlines ---- */}
              <SectionCard>
                <div className="mb-1 flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Long Headlines</Label>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                    {filledLongHeadlines}/{ASSET_LIMITS.longHeadlines.max} (min {ASSET_LIMITS.longHeadlines.min})
                  </Badge>
                  <InfoTip text={`Up to ${ASSET_LIMITS.longHeadlines.max} long headlines, ${ASSET_LIMITS.longHeadlines.charLimit} chars each. Maps to AssetFieldType.LONG_HEADLINE.`} />
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Used in larger ad formats like YouTube and Discover. Can be more descriptive.
                </p>

                <div className="flex flex-col gap-2">
                  {currentGroup.longHeadlines.map((h, idx) => (
                    <div key={h.id} className="flex items-center gap-2">
                      <span className="w-5 text-right text-[10px] text-muted-foreground">{idx + 1}</span>
                      <div className="relative flex-1">
                        <Input
                          placeholder={`Long Headline ${idx + 1}`}
                          maxLength={ASSET_LIMITS.longHeadlines.charLimit}
                          value={h.text ?? ""}
                          onChange={(e) => updateTextAsset("longHeadlines", h.id, e.target.value)}
                          className="h-9 pr-12 text-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground">
                          {h.text?.length ?? 0}/{ASSET_LIMITS.longHeadlines.charLimit}
                        </span>
                      </div>
                      {currentGroup.longHeadlines.length > ASSET_LIMITS.longHeadlines.min && (
                        <button type="button" onClick={() => removeTextAsset("longHeadlines", h.id)} className="p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {currentGroup.longHeadlines.length < ASSET_LIMITS.longHeadlines.max && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1 text-xs"
                    onClick={() => addTextAsset("longHeadlines", "LONG_HEADLINE")}
                  >
                    <Plus className="size-3" />
                    Add Long Headline
                  </Button>
                )}
              </SectionCard>

              {/* ---- Descriptions ---- */}
              <SectionCard>
                <div className="mb-1 flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Descriptions</Label>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                    {filledDescriptions}/{ASSET_LIMITS.descriptions.max} (min {ASSET_LIMITS.descriptions.min})
                  </Badge>
                  <InfoTip text={`Up to ${ASSET_LIMITS.descriptions.max} descriptions, ${ASSET_LIMITS.descriptions.charLimit} chars each. Maps to AssetFieldType.DESCRIPTION.`} />
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Provide details about your products or services. Used across all channels.
                </p>

                <div className="flex flex-col gap-2">
                  {currentGroup.descriptions.map((d, idx) => (
                    <div key={d.id} className="flex items-start gap-2">
                      <span className="mt-2.5 w-5 text-right text-[10px] text-muted-foreground">{idx + 1}</span>
                      <div className="relative flex-1">
                        <Textarea
                          placeholder={`Description ${idx + 1}`}
                          maxLength={ASSET_LIMITS.descriptions.charLimit}
                          value={d.text ?? ""}
                          onChange={(e) => updateTextAsset("descriptions", d.id, e.target.value)}
                          className="min-h-[60px] text-sm"
                          rows={2}
                        />
                        <span className="absolute bottom-2 right-3 text-[10px] tabular-nums text-muted-foreground">
                          {d.text?.length ?? 0}/{ASSET_LIMITS.descriptions.charLimit}
                        </span>
                      </div>
                      {currentGroup.descriptions.length > ASSET_LIMITS.descriptions.min && (
                        <button type="button" onClick={() => removeTextAsset("descriptions", d.id)} className="mt-2 p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {currentGroup.descriptions.length < ASSET_LIMITS.descriptions.max && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1 text-xs"
                    onClick={() => addTextAsset("descriptions", "DESCRIPTION")}
                  >
                    <Plus className="size-3" />
                    Add Description
                  </Button>
                )}
              </SectionCard>

              {/* ---- Images ---- */}
              <SectionCard>
                <div className="mb-1 flex items-center gap-2">
                  <ImageIcon className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Images</Label>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                    {currentGroup.images.length}/{ASSET_LIMITS.images.max}
                  </Badge>
                  <InfoTip text="Marketing images for your ads. Provide landscape (1.91:1, min 600x314), square (1:1, min 300x300), and optionally portrait (4:5, min 480x600). Maps to AssetFieldType.MARKETING_IMAGE, SQUARE_MARKETING_IMAGE, PORTRAIT_MARKETING_IMAGE." />
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Upload images in multiple aspect ratios for best results across all channels.
                </p>

                {/* Image requirements */}
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Landscape (1.91:1)", note: "Min 600x314", required: true },
                    { label: "Square (1:1)", note: "Min 300x300", required: true },
                    { label: "Portrait (4:5)", note: "Min 480x600", required: false },
                  ].map((spec) => (
                    <div key={spec.label} className="rounded-lg border border-border bg-muted/20 p-2.5 text-center">
                      <p className="text-[10px] font-semibold text-foreground">{spec.label}</p>
                      <p className="text-[9px] text-muted-foreground">{spec.note}</p>
                      {spec.required && <Badge className="mt-1 rounded-full border-0 bg-destructive/10 px-1 py-0 text-[8px] text-destructive">Required</Badge>}
                    </div>
                  ))}
                </div>

                {/* Image grid placeholder */}
                <div className="flex flex-wrap gap-2">
                  {currentGroup.images.map((img) => (
                    <div key={img.id} className="group relative flex size-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                      <ImageIcon className="size-6 text-muted-foreground/50" />
                      <button
                        type="button"
                        onClick={() => removeImageAsset("images", img.id)}
                        className="absolute -right-1 -top-1 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  {currentGroup.images.length < ASSET_LIMITS.images.max && (
                    <button
                      type="button"
                      onClick={() => addImageAsset("images")}
                      className="flex size-20 items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] text-primary transition-colors hover:bg-primary/5"
                    >
                      <Plus className="size-5" />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  In production, images are uploaded to Google Ads via the Asset service. Click + to add placeholder slots.
                </p>
              </SectionCard>

              {/* ---- Logos ---- */}
              <SectionCard>
                <div className="mb-1 flex items-center gap-2">
                  <ImageIcon className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Logos</Label>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                    {currentGroup.logos.length}/{ASSET_LIMITS.logos.max} (min 1)
                  </Badge>
                  <InfoTip text="Square logo (1:1, min 128x128) required. Landscape logo (4:1, min 512x128) optional. Maps to AssetFieldType.LOGO and LANDSCAPE_LOGO." />
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Your brand logo appears alongside your ads for recognition.
                </p>

                <div className="flex flex-wrap gap-2">
                  {currentGroup.logos.map((logo) => (
                    <div key={logo.id} className="group relative flex size-16 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                      <ImageIcon className="size-5 text-muted-foreground/50" />
                      <button
                        type="button"
                        onClick={() => removeImageAsset("logos", logo.id)}
                        className="absolute -right-1 -top-1 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  {currentGroup.logos.length < ASSET_LIMITS.logos.max && (
                    <button
                      type="button"
                      onClick={() => addImageAsset("logos")}
                      className="flex size-16 items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] text-primary transition-colors hover:bg-primary/5"
                    >
                      <Plus className="size-4" />
                    </button>
                  )}
                </div>
              </SectionCard>

              {/* ---- YouTube Videos ---- */}
              <SectionCard>
                <div className="mb-1 flex items-center gap-2">
                  <Video className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">YouTube Videos</Label>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                    {currentGroup.videos.length}/{ASSET_LIMITS.videos.max} (optional)
                  </Badge>
                  <InfoTip text="Add YouTube video URLs. Maps to AssetFieldType.YOUTUBE_VIDEO. If you don't provide videos, Google will auto-generate them from your images." />
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Videos for YouTube placements. Google can auto-generate videos from images if none are provided.
                </p>

                <div className="flex flex-col gap-2">
                  {currentGroup.videos.map((v, idx) => (
                    <div key={v.id} className="flex items-center gap-2">
                      <Video className="size-4 shrink-0 text-muted-foreground" />
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={v.url ?? ""}
                        onChange={(e) => updateVideoAsset(v.id, e.target.value)}
                        className="h-9 flex-1 text-sm"
                      />
                      <button type="button" onClick={() => removeVideoAsset(v.id)} className="p-1 text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {currentGroup.videos.length < ASSET_LIMITS.videos.max && (
                  <Button variant="outline" size="sm" className="mt-3 gap-1 text-xs" onClick={addVideoAsset}>
                    <Plus className="size-3" />
                    Add YouTube Video
                  </Button>
                )}
              </SectionCard>

              {/* ---- Call to Action ---- */}
              <SectionCard>
                <div className="mb-1 flex items-center gap-2">
                  <MousePointerClick className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Call to Action</Label>
                  <InfoTip text="Maps to AssetFieldType.CALL_TO_ACTION_SELECTION. 'Automated' lets Google choose the best CTA." />
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Choose a CTA button text, or let Google optimize it automatically.
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {CTA_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateGroup(currentGroup.id, { callToAction: opt.value })}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        currentGroup.callToAction === opt.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary/40"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </SectionCard>

              {/* ---- Ad Strength Meter ---- */}
              <div className="mb-8 rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Gauge className="size-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Ad Strength</p>
                  <span className={cn("text-sm font-bold", adStrength.color)}>{adStrength.label}</span>
                </div>

                {/* Strength bar */}
                <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      adStrength.label === "Excellent" ? "bg-emerald-500" :
                      adStrength.label === "Good" ? "bg-primary" :
                      adStrength.label === "Average" ? "bg-amber-500" :
                      "bg-destructive"
                    )}
                    style={{ width: `${adStrength.score}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {[
                    { label: `Headlines (${filledHeadlines}/${ASSET_LIMITS.headlines.min}+)`, ok: filledHeadlines >= ASSET_LIMITS.headlines.min },
                    { label: `Long Headlines (${filledLongHeadlines}/${ASSET_LIMITS.longHeadlines.min}+)`, ok: filledLongHeadlines >= ASSET_LIMITS.longHeadlines.min },
                    { label: `Descriptions (${filledDescriptions}/${ASSET_LIMITS.descriptions.min}+)`, ok: filledDescriptions >= ASSET_LIMITS.descriptions.min },
                    { label: `Images (${currentGroup.images.length}/1+)`, ok: currentGroup.images.length >= 1 },
                    { label: `Logos (${currentGroup.logos.length}/1+)`, ok: currentGroup.logos.length >= 1 },
                    { label: "Business Name", ok: currentGroup.businessName.trim().length > 0 },
                    { label: "Final URL", ok: currentGroup.finalUrl.trim().length > 0 },
                    { label: `Videos (${currentGroup.videos.length} bonus)`, ok: currentGroup.videos.length > 0 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <CheckCircle2 className={cn("size-3", item.ok ? "text-emerald-500" : "text-muted-foreground/40")} />
                      <span className={cn(item.ok ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ---- Multi-Channel Preview ---- */}
              <div className="mb-8 rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="size-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Ad Preview</p>
                  </div>
                  <div className="flex gap-1">
                    {(["search", "display", "youtube", "discover"] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setPreviewChannel(ch)}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize transition-colors",
                          previewChannel === ch
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground"
                        )}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search preview */}
                {previewChannel === "search" && (
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Badge className="rounded bg-foreground/10 px-1 py-0 text-[9px] font-bold text-foreground">Ad</Badge>
                      <span className="text-xs text-muted-foreground">
                        {currentGroup.finalUrl || "your-store.salla.sa"}
                        {currentGroup.displayPath1 && ` / ${currentGroup.displayPath1}`}
                        {currentGroup.displayPath2 && ` / ${currentGroup.displayPath2}`}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-primary">
                      {currentGroup.headlines.find((h) => h.text?.trim())?.text || "Your Headline Here"}
                      {" - "}
                      {currentGroup.headlines.filter((h) => h.text?.trim())[1]?.text || "Second Headline"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {currentGroup.descriptions.find((d) => d.text?.trim())?.text || "Your description will appear here. Add descriptions to see the preview."}
                    </p>
                  </div>
                )}

                {/* Display preview */}
                {previewChannel === "display" && (
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="flex gap-3">
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <ImageIcon className="size-6 text-muted-foreground/50" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-foreground">
                          {currentGroup.headlines.find((h) => h.text?.trim())?.text || "Headline"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {currentGroup.descriptions.find((d) => d.text?.trim())?.text || "Description"}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="size-4 rounded bg-muted" />
                          <span className="text-[10px] text-muted-foreground">{currentGroup.businessName || "Business"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* YouTube preview */}
                {previewChannel === "youtube" && (
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="mb-3 flex aspect-video items-center justify-center rounded-lg bg-foreground/5">
                      <Video className="size-10 text-muted-foreground/30" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      {currentGroup.longHeadlines.find((h) => h.text?.trim())?.text || "Long Headline Here"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {currentGroup.descriptions.find((d) => d.text?.trim())?.text || "Description"}
                    </p>
                    <Button size="sm" className="mt-2 h-7 rounded-full text-[10px]">
                      {CTA_OPTIONS.find((c) => c.value === currentGroup.callToAction)?.label ?? "Shop now"}
                    </Button>
                  </div>
                )}

                {/* Discover preview */}
                {previewChannel === "discover" && (
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="mb-2 flex aspect-[1.91/1] items-center justify-center rounded-lg bg-foreground/5">
                      <ImageIcon className="size-8 text-muted-foreground/30" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-5 rounded bg-muted" />
                      <span className="text-[10px] font-medium text-muted-foreground">{currentGroup.businessName || "Business"}</span>
                      <span className="text-[10px] text-muted-foreground">Sponsored</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-foreground">
                      {currentGroup.longHeadlines.find((h) => h.text?.trim())?.text || "Long Headline"}
                    </p>
                  </div>
                )}
              </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN                                                  */}
        {/* ============================================================ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="sticky top-6 flex flex-col gap-4">

            {/* Ad Strength */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Gauge className="size-4 text-primary" />
                <p className="text-xs font-bold text-foreground">Ad Strength</p>
                <span className={cn("ml-auto text-sm font-bold", adStrength.color)}>{adStrength.label}</span>
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    adStrength.label === "Excellent" ? "bg-emerald-500" :
                    adStrength.label === "Good" ? "bg-primary" :
                    adStrength.label === "Average" ? "bg-amber-500" :
                    "bg-destructive"
                  )}
                  style={{ width: `${adStrength.score}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {adStrength.label === "Excellent"
                  ? "Great! Your asset group has strong creative variety."
                  : adStrength.label === "Good"
                    ? "Good progress. Add more assets to reach Excellent."
                    : "Add more assets to improve ad performance."
                }
              </p>
            </SectionCard>

            {/* Asset Requirements */}
            <SectionCard className="p-4">
              <p className="mb-3 text-xs font-bold text-foreground">Asset Requirements</p>
              <div className="flex flex-col gap-2 text-[11px]">
                {[
                  { label: "Headlines", count: filledHeadlines, min: 3, max: 15 },
                  { label: "Long Headlines", count: filledLongHeadlines, min: 1, max: 5 },
                  { label: "Descriptions", count: filledDescriptions, min: 2, max: 5 },
                  { label: "Images", count: currentGroup.images.length, min: 1, max: 20 },
                  { label: "Logos", count: currentGroup.logos.length, min: 1, max: 5 },
                  { label: "Videos", count: currentGroup.videos.length, min: 0, max: 5 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className={cn("size-3", item.count >= item.min ? "text-emerald-500" : "text-muted-foreground/40")} />
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                    <span className={cn("font-medium tabular-nums", item.count >= item.min ? "text-foreground" : "text-destructive")}>
                      {item.count}/{item.min}-{item.max}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Asset Groups */}
            <SectionCard className="p-4">
              <p className="mb-3 text-xs font-bold text-foreground">Asset Groups ({assetGroups.length})</p>
              <div className="flex flex-col gap-1.5">
                {assetGroups.map((g, idx) => {
                  const str = calcAdStrength(g);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setActiveGroupIdx(idx)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors",
                        idx === activeGroupIdx ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                      )}
                    >
                      <span className="text-[11px] font-medium text-foreground">{g.name || `Group ${idx + 1}`}</span>
                      <span className={cn("text-[10px] font-medium", str.color)}>{str.label}</span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* Tips */}
            <SectionCard className="p-4">
              <p className="text-xs font-semibold text-foreground">Asset Tips</p>
              <ul className="mt-2 flex flex-col gap-1.5 text-xs leading-relaxed text-muted-foreground">
                <li>- Use all 15 headline slots for maximum optimization</li>
                <li>- Include diverse headlines (features, benefits, promotions)</li>
                <li>- Add images in all 3 aspect ratios</li>
                <li>- Videos boost YouTube performance significantly</li>
                <li>- Aim for "Excellent" ad strength</li>
              </ul>
            </SectionCard>
          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Next: Review & Launch"
        nextDisabled={!canProceed}
      />
    </TooltipProvider>
  );
}
