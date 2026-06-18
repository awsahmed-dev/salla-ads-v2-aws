"use client";

import { useState, useMemo, useCallback, useEffect, useRef, type ElementType } from "react";
import { useGoogleCampaign } from "@/lib/google/campaign-context";
import { OBJECTIVE_CONFIGS, type GoogleAssetGroup, type GoogleCreativeAsset, type ProductGroupNode, type ProductDimensionType, type RetailListingMode, type DemandGenAd, type DemandGenAdGroup, createDemandGenAd, createDemandGenAdGroup, type GoogleSearchAd, type SearchAdGroup, type RSAHeadline, type RSADescription, type HeadlinePinPosition, type DescriptionPinPosition, type SearchSitelinkAsset, type SearchCalloutAsset, type SearchStructuredSnippet, STRUCTURED_SNIPPET_HEADERS, createSearchAd, createSearchAdGroup, type DisplayAdGroup, type GoogleDisplayAd, createDisplayAd, createDisplayAdGroup, type GoogleAppAd, createAppAd, type DemandGenAdAutomationType, type AssetAutomationStatus, type AssetAutomationType, type AssetAutomationEntry } from "@/lib/google/campaign-types";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Upload,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Image as ImageIcon,
  Info,
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
  Link,
  Hash,
  Megaphone,
  ListChecks,
  DollarSign,
  ShieldCheck,
  Shield,
  Bot,
  Check,
} from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { ObjectiveExplainer } from "@/components/shared/objective-explainer";
import { InfoTip } from "@/components/shared/info-tip";
import { UploadZone } from "@/components/shared/upload-zone";
import { ProductPickerDialog, type SallaProduct } from "@/components/shared/product-picker";
// Merchant Center datafeeds — real grouping surface Google exposes.
// Replaced the previous Salla-set mock library (which had ~21 seasonal /
// best-seller / margin sets with no native MC equivalent). MC's actual
// API returns 1–2 datafeeds per typical Salla-connected account: a
// primary feed (whole catalog) and optionally a supplemental feed.
import {
  fetchMerchantCenterDatafeeds,
  type MerchantCenterFeed,
} from "@/lib/google/merchant-center-feeds";
import {
  fetchBestSellers,
  fetchNewArrivals,
  fetchOnSale,
  getCategories,
  getStoreInfo,
  PREVIEW_PRODUCTS,
  formatSAR,
  type SallaStoreInfo,
} from "@/lib/salla/store-api";
import { generateSearchDraft, generateCallouts, generateSitelinks, generateSnippets, getStoreSnapshot, scoreHeadlineDiversity, type SearchAiDraft, type HeadlineDiversityScore } from "@/lib/google/search-ai-generator";

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
  landscapeLogos: { min: 0, max: 20, note: "Landscape 4:1 (min 512x128)" },
  videos: { min: 0, max: 15, note: ">=10s • 16:9, 1:1, or 9:16" },
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
    finalMobileUrl: "",
    headlines: [newTextAsset("HEADLINE"), newTextAsset("HEADLINE"), newTextAsset("HEADLINE")],
    longHeadlines: [newTextAsset("LONG_HEADLINE")],
    descriptions: [newTextAsset("DESCRIPTION"), newTextAsset("DESCRIPTION")],
    images: [],
    logos: [],
    landscapeLogos: [],
    videos: [],
    businessName: "",
    callToAction: "AUTOMATED",
    displayPath1: "",
    displayPath2: "",
    searchThemes: [],
    audienceSignals: [],
  };
}

const RETAIL_LISTING_DIMENSIONS: Record<RetailListingMode, ProductDimensionType> = {
  ALL: "PRODUCT_CATEGORY",
  CATEGORY: "PRODUCT_CATEGORY",
  BRAND: "PRODUCT_BRAND",
  CUSTOM_LABEL: "PRODUCT_CUSTOM_ATTRIBUTE_0",
};

function toListingId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "value";
  return trimmed.toLowerCase().replace(/\s+/g, "-");
}

function buildRetailListingTree(mode: RetailListingMode, values: string[]): ProductGroupNode | null {
  const dimensionType = RETAIL_LISTING_DIMENSIONS[mode];
  if (mode === "ALL") {
    return {
      id: "pmax-listing-all",
      dimensionType,
      dimensionValue: "ALL_PRODUCTS",
      type: "UNIT_INCLUDED",
      children: [],
    };
  }

  const normalized = values.map((v) => v.trim()).filter(Boolean);
  if (normalized.length === 0) return null;
  const children: ProductGroupNode[] = normalized.map((value) => ({
    id: `pmax-${mode.toLowerCase()}-${toListingId(value)}`,
    dimensionType,
    dimensionValue: value,
    type: "UNIT_INCLUDED",
    children: [],
  }));

  children.push({
    id: `pmax-${mode.toLowerCase()}-other`,
    dimensionType,
    dimensionValue: "ALL_OTHER",
    type: "UNIT_INCLUDED",
    children: [],
  });

  return {
    id: `pmax-${mode.toLowerCase()}-root`,
    dimensionType,
    dimensionValue: "ROOT",
    type: "SUBDIVISION",
    children,
  };
}

const VIDEO_REQUIREMENTS = {
  minDurationSec: 10,
  allowedRatios: [16 / 9, 1, 9 / 16],
  ratioTolerance: 0.05,
};

function isAllowedVideoRatio(width: number, height: number) {
  if (!width || !height) return false;
  const ratio = width / height;
  return VIDEO_REQUIREMENTS.allowedRatios.some(
    (target) => Math.abs(ratio - target) <= VIDEO_REQUIREMENTS.ratioTolerance
  );
}

function readVideoMetadata(file: File): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const cleanup = () => URL.revokeObjectURL(url);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      cleanup();
      resolve({ duration, width, height });
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("metadata"));
    };
    video.src = url;
  });
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

function ReadinessRing({ percent, size = 44, stroke = 4 }: { percent: number; size?: number; stroke?: number }) {
  const safe = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (safe / 100) * circ;
  const color =
    safe >= 100 ? "#10b981" :
    safe >= 70 ? "#3b82f6" :
    safe >= 40 ? "#f59e0b" :
    "#ef4444";
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-500" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-center fill-foreground text-[10px] font-bold tabular-nums">{safe}%</text>
    </svg>
  );
}

/* ================================================================== */
/*  DEMAND GEN: Constants                                              */
/* ================================================================== */

/** Google Ads API v23 limits per DemandGen*AdInfo */
const DG_LIMITS = {
  /* ---- Multi-Asset ---- */
  multiAsset: {
    headlines: { min: 1, max: 5, charLimit: 40 },        // AdTextAsset, max display width 40
    descriptions: { min: 1, max: 5, charLimit: 90 },     // AdTextAsset, max display width 90
    businessName: { charLimit: 25 },
    images: { combinedMax: 20 },                          // All 4 aspect ratios combined
    logos: { min: 1, max: 5 },
  },
  /* ---- Carousel ---- */
  carousel: {
    headline: { charLimit: 40 },                          // Single headline
    description: { charLimit: 90 },                       // Single description
    businessName: { charLimit: 25 },
    cards: { min: 2, max: 10 },
    cardHeadline: { charLimit: 40 },
    logos: { min: 1, max: 1 },                            // Single logo_image
  },
  /* ---- Video Responsive ---- */
  videoResponsive: {
    headlines: { min: 1, max: 5, charLimit: 40 },        // short headline
    longHeadlines: { min: 1, max: 5, charLimit: 90 },
    descriptions: { min: 1, max: 5, charLimit: 90 },
    businessName: { charLimit: 25 },
    // Per dev audit + Google Ads API docs:
    // DemandGenVideoResponsiveAdInfo allows exactly 1 logo image,
    // unlike Multi-Asset which allows up to 5.
    logos: { min: 1, max: 1 },
    videos: { min: 1, max: 5 },
    // DG Video supports sitelinks (Google Ads API v17+).
    sitelinks: { min: 0, max: 8 },
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
    // Per dev audit: image is MANDATORY on every carousel card. Cards
    // without imageUrl don't count toward the filled-cards score.
    const filledCards = ad.carouselCards.filter((c) =>
      c.headline.trim() && c.finalUrl.trim() && c.imageUrl.trim()
    ).length;
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
        <div key={i} className={cn("flex gap-2", charLimit >= 90 ? "items-start" : "items-center")}>
          <span className={cn("w-4 text-center text-[10px] text-muted-foreground", charLimit >= 90 && "mt-2")}>{i + 1}</span>
          {charLimit >= 90 ? (
            <Textarea
              placeholder={`${labelPrefix} ${i + 1}`}
              value={item.text}
              onChange={(e) => {
                const next = [...items];
                next[i] = { text: e.target.value.slice(0, charLimit) };
                onUpdate(next);
              }}
              className="min-h-[2rem] flex-1 resize-none text-xs"
              rows={1}
            />
          ) : (
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
          )}
          <span className={cn("w-9 text-right text-[9px] text-muted-foreground", charLimit >= 90 && "mt-2")}>{item.text.length}/{charLimit}</span>
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
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-[10px] text-primary"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const { getStoreSnapshot, generateHeadlines, generateDescriptions } = await import("@/lib/google/search-ai-generator");
                const snapshot = await getStoreSnapshot();
                const headlines = generateHeadlines(snapshot);
                const shuffled = [...headlines].sort(() => Math.random() - 0.5);
                const descriptions = generateDescriptions(snapshot);
                const shuffledDescs = [...descriptions].sort(() => Math.random() - 0.5);

                const maxH = 5;
                const existingH = ad.headlines.filter(h => h.text?.trim());
                const existingTexts = new Set(existingH.map(h => h.text!.toLowerCase()));
                const newHeadlines: { text: string }[] = [];
                let si = 0;
                for (let i = 0; i < maxH; i++) {
                  if (i < existingH.length) {
                    newHeadlines.push(existingH[i]);
                  } else {
                    while (si < shuffled.length && existingTexts.has(shuffled[si].text.toLowerCase())) si++;
                    if (si < shuffled.length) {
                      newHeadlines.push({ text: shuffled[si].text });
                      existingTexts.add(shuffled[si].text.toLowerCase());
                      si++;
                    } else {
                      newHeadlines.push({ text: "" });
                    }
                  }
                }

                const maxD = 5;
                const existingD = ad.descriptions.filter(d => d.text?.trim());
                const existingDTexts = new Set(existingD.map(d => d.text!.toLowerCase()));
                const newDescs: { text: string }[] = [];
                let di = 0;
                for (let i = 0; i < maxD; i++) {
                  if (i < existingD.length) {
                    newDescs.push(existingD[i]);
                  } else {
                    while (di < shuffledDescs.length && existingDTexts.has(shuffledDescs[di].text.toLowerCase())) di++;
                    if (di < shuffledDescs.length) {
                      newDescs.push({ text: shuffledDescs[di].text });
                      existingDTexts.add(shuffledDescs[di].text.toLowerCase());
                      di++;
                    } else {
                      newDescs.push({ text: "" });
                    }
                  }
                }

                onUpdate({
                  headlines: newHeadlines,
                  descriptions: newDescs,
                  businessName: ad.businessName || snapshot.store.name.slice(0, 25),
                  finalUrl: ad.finalUrl || (snapshot.store.domain.startsWith("http") ? snapshot.store.domain : `https://${snapshot.store.domain}`),
                });
              } catch { /* silent */ }
            }}
          >
            <Sparkles className="size-3" /> Generate
          </Button>
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
              {/* Headlines (max 5, 40 chars) */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Type className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Headlines</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{ad.headlines.filter((h) => h.text.trim()).length}/{DG_LIMITS.multiAsset.headlines.max}</Badge>
                  <InfoTip text="Max display width 40 chars. Google tests combinations. At least 1 required, 5 recommended for Excellent ad strength." />
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
                <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ImageIcon className="size-3.5 text-primary" />
                  Images
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">{ad.images.length}/20 total</Badge>
                  <InfoTip text="All 4 aspect ratios share a combined maximum of 20 images. At least 1 landscape or square is required." />
                </Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { ratio: "LANDSCAPE" as const, label: "Landscape", aspect: "1.91:1", min: "600x314" },
                    { ratio: "SQUARE" as const, label: "Square", aspect: "1:1", min: "300x300" },
                    { ratio: "PORTRAIT" as const, label: "Portrait", aspect: "4:5", min: "480x600" },
                    { ratio: "TALL_PORTRAIT" as const, label: "Tall", aspect: "9:16", min: "600x1067" },
                  ].map((spec) => {
                    const specImages = ad.images.filter(i => i.aspectRatio === spec.ratio);
                    return (
                      <div key={spec.ratio} className="rounded-lg border border-border bg-muted/10 p-2.5">
                        <p className="mb-1 text-[10px] font-semibold text-foreground">{spec.label} ({spec.aspect})</p>
                        <p className="mb-2 text-[9px] text-muted-foreground">Min {spec.min}</p>
                        <UploadZone
                          accept="image/png,image/jpeg,image/gif"
                          label={`Upload ${spec.label.toLowerCase()}`}
                          sublabel={`JPG/PNG \u00b7 ${spec.aspect}`}
                          onFile={(file) => {
                            const url = URL.createObjectURL(file);
                            onUpdate({ images: [...ad.images, { id: `img-${Date.now()}`, url, aspectRatio: spec.ratio }] });
                          }}
                          compact
                        />
                        {specImages.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {specImages.map((img) => (
                              <div key={img.id} className="group relative size-10 overflow-hidden rounded border border-border bg-muted">
                                <img src={img.url} alt="" className="size-full object-cover" />
                                <button type="button" onClick={() => onUpdate({ images: ad.images.filter(x => x.id !== img.id) })}
                                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                  <X className="size-3 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="mt-1 text-[9px] text-muted-foreground">{specImages.length} added</p>
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
                  <InfoTip text="Single headline for the carousel ad. Max display width 40 chars." />
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
                <div className="mb-3 flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <GalleryHorizontal className="size-3.5 text-primary" />
                    Carousel Cards
                    <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                      {ad.carouselCards.length}/{DG_LIMITS.carousel.cards.max}
                    </Badge>
                    {ad.carouselCards.length < DG_LIMITS.carousel.cards.min && (
                      <span className="text-[10px] text-red-500">Min {DG_LIMITS.carousel.cards.min} required</span>
                    )}
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 border-primary/30 text-xs text-primary"
                      onClick={async () => {
                        try {
                          const [bestSellers, onSale] = await Promise.all([fetchBestSellers(6), fetchOnSale(4)]);
                          const allProducts = [...bestSellers, ...onSale];
                          const seen = new Set<string>();
                          const unique = allProducts.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
                          const existingUrls = new Set(ad.carouselCards.map(c => c.finalUrl));
                          const newProducts = unique.filter(p => !existingUrls.has(p.url));
                          const newCards = newProducts.slice(0, DG_LIMITS.carousel.cards.max - ad.carouselCards.length).map((p, i) => ({
                            id: `card-${Date.now()}-${i}`,
                            headline: p.name.slice(0, DG_LIMITS.carousel.cardHeadline.charLimit),
                            imageUrl: p.image,
                            finalUrl: p.url,
                            callToAction: "AUTOMATED",
                          }));
                          if (newCards.length > 0) {
                            onUpdate({ carouselCards: [...ad.carouselCards, ...newCards].slice(0, DG_LIMITS.carousel.cards.max) });
                          }
                        } catch { /* silent */ }
                      }}
                    >
                      <ShoppingBag className="size-3" /> Add Products from Store
                    </Button>
                    {ad.carouselCards.length < DG_LIMITS.carousel.cards.max && (
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]" onClick={() => onUpdate({ carouselCards: [...ad.carouselCards, { id: `card-${Date.now()}`, headline: "", imageUrl: "", finalUrl: "", callToAction: "AUTOMATED" }] })}>
                        <Plus className="size-3" /> Add Card
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  {ad.carouselCards.map((card, ci) => {
                    // Per dev audit: image is MANDATORY on every card.
                    // Surface a red border + required hint when missing.
                    const imageMissing = !card.imageUrl.trim();
                    return (
                    <div
                      key={card.id}
                      className={cn(
                        "flex gap-3 rounded-lg border bg-background p-3",
                        imageMissing ? "border-red-200" : "border-border"
                      )}
                    >
                      {/* Image preview or required indicator */}
                      <div className={cn(
                        "relative size-16 shrink-0 overflow-hidden rounded-lg border",
                        imageMissing ? "border-red-300 bg-red-50" : "border-border bg-muted"
                      )}>
                        {card.imageUrl ? (
                          <img src={card.imageUrl} alt={card.headline} className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full flex-col items-center justify-center gap-0.5 p-1">
                            <ImageIcon className="size-4 text-red-400" />
                            <span className="text-[8px] font-bold uppercase text-red-500">Required</span>
                          </div>
                        )}
                        <span className="absolute left-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">{ci + 1}</span>
                      </div>
                      {/* Card fields */}
                      <div className="flex flex-1 flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <Input
                            value={card.headline}
                            onChange={(e) => {
                              const cards = [...ad.carouselCards];
                              cards[ci] = { ...card, headline: e.target.value.slice(0, DG_LIMITS.carousel.cardHeadline.charLimit) };
                              onUpdate({ carouselCards: cards });
                            }}
                            placeholder="Product headline"
                            className="h-7 flex-1 text-xs"
                          />
                          <span className="shrink-0 text-[9px] text-muted-foreground">{card.headline.length}/{DG_LIMITS.carousel.cardHeadline.charLimit}</span>
                        </div>
                        <Input
                          value={card.finalUrl}
                          onChange={(e) => {
                            const cards = [...ad.carouselCards];
                            cards[ci] = { ...card, finalUrl: e.target.value };
                            onUpdate({ carouselCards: cards });
                          }}
                          placeholder="https://store.salla.sa/product/..."
                          className="h-7 text-[10px] text-muted-foreground"
                        />
                        {/* Per-card CTA selector — per dev audit, CTA lives
                            on the card, not the ad. Maps to
                            DemandGenCarouselCardAsset.call_to_action_text. */}
                        <div className="flex items-center gap-1.5">
                          <span className="shrink-0 text-[9px] font-semibold uppercase text-muted-foreground">CTA</span>
                          <select
                            value={card.callToAction}
                            onChange={(e) => {
                              const cards = [...ad.carouselCards];
                              cards[ci] = { ...card, callToAction: e.target.value };
                              onUpdate({ carouselCards: cards });
                            }}
                            className="h-6 flex-1 rounded border border-border bg-background px-1 text-[10px] font-medium text-foreground focus:border-primary focus:outline-none"
                          >
                            {CTA_OPTIONS.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {/* Delete button */}
                      {ad.carouselCards.length > DG_LIMITS.carousel.cards.min && (
                        <button type="button" onClick={() => onUpdate({ carouselCards: ad.carouselCards.filter((_, j) => j !== ci) })}
                          className="self-start text-muted-foreground hover:text-destructive">
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                    );
                  })}
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

              {/* Headlines (max 5, 40 chars) */}
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

              {/* Logo — Video Responsive allows EXACTLY 1 logo per Google Ads
                  API (DemandGenVideoResponsiveAdInfo.logo_image), unlike
                  Multi-Asset which allows up to 5. Per dev audit. */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Building2 className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Logo</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">
                    {ad.logos.length}/{DG_LIMITS.videoResponsive.logos.max}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">Single logo only</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 transition-colors hover:border-primary/40">
                    <Plus className="size-4 text-muted-foreground/30" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[11px] text-muted-foreground">1:1 aspect, min {DG_LIMITS.logo.minSize}</p>
                    <p className="text-[10px] italic text-muted-foreground">Video ads accept one logo per Google Ads API. Multi-Asset allows up to 5.</p>
                  </div>
                </div>
              </div>

              {/* Sitelinks (Video Responsive only) — per dev audit.
                  DG Video supports sitelink assets that show as clickable
                  links underneath the video. Maps to AdGroupAsset with
                  SitelinkAsset, field_type=SITELINK. Up to 8 per ad. */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Link className="size-3.5 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Sitelinks</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">
                    {(ad.sitelinks ?? []).length}/{DG_LIMITS.videoResponsive.sitelinks.max}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">Optional</Badge>
                  <InfoTip text="Sitelinks are clickable shortcuts that appear with your video ad. Maps to AdGroupAsset with SitelinkAsset (field_type=SITELINK). Up to 8 per ad." />
                </div>
                <div className="flex flex-col gap-1.5">
                  {(ad.sitelinks ?? []).map((sl, sli) => (
                    <div key={sl.id} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
                      <Input
                        value={sl.linkText}
                        onChange={(e) => {
                          const next = [...(ad.sitelinks ?? [])];
                          next[sli] = { ...sl, linkText: e.target.value.slice(0, 25) };
                          onUpdate({ sitelinks: next });
                        }}
                        placeholder="Link text (e.g. Shop sale)"
                        maxLength={25}
                        className="h-7 w-40 text-[11px]"
                      />
                      <Input
                        value={sl.finalUrl}
                        onChange={(e) => {
                          const next = [...(ad.sitelinks ?? [])];
                          next[sli] = { ...sl, finalUrl: e.target.value };
                          onUpdate({ sitelinks: next });
                        }}
                        placeholder="https://store.salla.sa/sale"
                        className="h-7 flex-1 text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdate({ sitelinks: (ad.sitelinks ?? []).filter((_, j) => j !== sli) })}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {(ad.sitelinks ?? []).length < DG_LIMITS.videoResponsive.sitelinks.max && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 self-start text-[11px]"
                      onClick={() =>
                        onUpdate({
                          sitelinks: [
                            ...(ad.sitelinks ?? []),
                            { id: `sl-${Date.now()}`, linkText: "", finalUrl: "" },
                          ],
                        })
                      }
                    >
                      <Plus className="size-3" /> Add sitelink
                    </Button>
                  )}
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
            {/* Per dev audit: hide ad-level CTA for Carousel format —
                each card has its own CTA below, ad-level CTA is unused
                by DemandGenCarouselAdInfo. */}
            {ad.adType !== "CAROUSEL" && (
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
            )}
            {ad.adType === "CAROUSEL" && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-2.5">
                <Info className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <p className="text-[10px] leading-snug text-muted-foreground">
                  In carousel ads, each card gets its own CTA below. Maps to <code className="rounded bg-muted px-1 py-0.5 text-[10px]">DemandGenCarouselCardAsset.call_to_action_text</code> per card.
                </p>
              </div>
            )}
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
  ad, adIndex, totalAds, keywordCount, storeName, onUpdate, onDelete, onDuplicate, onExpand,
}: {
  ad: GoogleSearchAd;
  adIndex: number;
  totalAds: number;
  keywordCount: number;
  storeName: string;
  onUpdate: (patch: Partial<GoogleSearchAd>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExpand?: (idx: number) => void;
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
      <div role="button" tabIndex={0} onClick={() => { const next = !expanded; setExpanded(next); if (next) onExpand?.(adIndex); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const next = !expanded; setExpanded(next); if (next) onExpand?.(adIndex); } }} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left">
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
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-[10px] text-primary"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const { getStoreSnapshot, generateHeadlines, generateDescriptions } = await import("@/lib/google/search-ai-generator");
                const snapshot = await getStoreSnapshot();
                const allHeadlines = generateHeadlines(snapshot);
                const shuffled = [...allHeadlines].sort(() => Math.random() - 0.5);
                const allDescs = generateDescriptions(snapshot);
                const shuffledDescs = [...allDescs].sort(() => Math.random() - 0.5);

                const maxH = 15;
                const existingH = ad.headlines.filter(h => h.text?.trim());
                const existingTexts = new Set(existingH.map(h => h.text!.toLowerCase()));
                const newHeadlines: typeof ad.headlines = [];
                let si = 0;
                for (let i = 0; i < maxH; i++) {
                  if (i < existingH.length) {
                    newHeadlines.push(existingH[i]);
                  } else {
                    while (si < shuffled.length && existingTexts.has(shuffled[si].text.toLowerCase())) si++;
                    if (si < shuffled.length) {
                      newHeadlines.push({ id: `h-${Date.now()}-${i}`, text: shuffled[si].text, pinnedPosition: null as any });
                      existingTexts.add(shuffled[si].text.toLowerCase());
                      si++;
                    } else {
                      newHeadlines.push({ id: `h-${Date.now()}-${i}`, text: "", pinnedPosition: null as any });
                    }
                  }
                }

                const maxD = 4;
                const existingD = ad.descriptions.filter(d => d.text?.trim());
                const existingDTexts = new Set(existingD.map(d => d.text!.toLowerCase()));
                const newDescs: typeof ad.descriptions = [];
                let di = 0;
                for (let i = 0; i < maxD; i++) {
                  if (i < existingD.length) {
                    newDescs.push(existingD[i]);
                  } else {
                    while (di < shuffledDescs.length && existingDTexts.has(shuffledDescs[di].text.toLowerCase())) di++;
                    if (di < shuffledDescs.length) {
                      newDescs.push({ id: `d-${Date.now()}-${i}`, text: shuffledDescs[di].text, pinnedPosition: null as any });
                      existingDTexts.add(shuffledDescs[di].text.toLowerCase());
                      di++;
                    } else {
                      newDescs.push({ id: `d-${Date.now()}-${i}`, text: "", pinnedPosition: null as any });
                    }
                  }
                }

                onUpdate({
                  headlines: newHeadlines,
                  descriptions: newDescs,
                  finalUrl: ad.finalUrl || (snapshot.store.domain.startsWith("http") ? snapshot.store.domain : `https://${snapshot.store.domain}`),
                  displayPath1: ad.displayPath1 || (snapshot.categories[0]?.replace(/\s+/g, "-").slice(0, 15) ?? ""),
                  displayPath2: ad.displayPath2 || "Shop",
                });
              } catch { /* silent */ }
            }}
          >
            <Sparkles className="size-3" /> Generate
          </Button>
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
                <InfoTip text="Write 10-15 unique headlines. Google tests combinations to find what works best. Mix brand names (2-3), product/category terms (3-4), benefits like 'Free Shipping' (3-4), and calls to action like 'Shop Now' (2-3)." />
              </div>
              <div className="flex items-center gap-1">
                {ad.headlines.length < RSA_LIMITS.headlines.max && (
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addHeadline}><Plus className="size-3" /> Add</Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-[10px] text-primary"
                  onClick={async () => {
                    const { generateHeadlines, getStoreSnapshot } = await import("@/lib/google/search-ai-generator");
                    const snapshot = await getStoreSnapshot();
                    const suggestions = generateHeadlines(snapshot);
                    const existing = ad.headlines.filter(h => h.text?.trim()).map(h => h.text!.toLowerCase());
                    const newHeadlines = [...ad.headlines];
                    let suggIdx = 0;
                    for (let i = 0; i < newHeadlines.length && suggIdx < suggestions.length; i++) {
                      if (!newHeadlines[i].text?.trim()) {
                        while (suggIdx < suggestions.length && existing.includes(suggestions[suggIdx].text.toLowerCase())) suggIdx++;
                        if (suggIdx < suggestions.length) {
                          newHeadlines[i] = { ...newHeadlines[i], text: suggestions[suggIdx].text };
                          existing.push(suggestions[suggIdx].text.toLowerCase());
                          suggIdx++;
                        }
                      }
                    }
                    onUpdate({ headlines: newHeadlines });
                  }}
                >
                  <Sparkles className="size-3" /> Fill empty slots
                </Button>
              </div>
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

            {/* Headline Diversity Coaching */}
            {(() => {
              const filled = ad.headlines.filter((h: RSAHeadline) => h.text.trim());
              if (filled.length < 3) return null;
              const diversity = scoreHeadlineDiversity(filled, storeName);
              const colorMap = { poor: "text-red-600 bg-red-50 border-red-200", average: "text-amber-600 bg-amber-50 border-amber-200", good: "text-emerald-600 bg-emerald-50 border-emerald-200", excellent: "text-primary bg-primary/5 border-primary/20" };
              const colors = colorMap[diversity.score];
              return (
                <div className={`mt-3 rounded-lg border p-3 ${colors}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">Headline diversity: {diversity.score.charAt(0).toUpperCase() + diversity.score.slice(1)}</span>
                    </div>
                    <span className="text-[10px]">{diversity.total}/15 headlines</span>
                  </div>
                  <div className="flex gap-3 text-[10px]">
                    <span>Brand: {diversity.brand}</span>
                    <span>Product: {diversity.product}</span>
                    <span>Benefit: {diversity.benefit}</span>
                    <span>CTA: {diversity.cta}</span>
                  </div>
                  <p className="mt-1.5 text-[10px]">{diversity.suggestion}</p>
                </div>
              );
            })()}
          </div>

          {/* Descriptions (2-4, 90 chars, pinnable) */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-3.5 text-primary" />
                <Label className="text-xs font-semibold text-foreground">Descriptions</Label>
                <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{fD}/{RSA_LIMITS.descriptions.max}</Badge>
                <InfoTip text="Write 4 unique descriptions (90 chars each). Include your value proposition, social proof (e.g. '1000+ orders'), and a call to action. Google shows 2 at a time." />
              </div>
              <div className="flex items-center gap-1">
                {ad.descriptions.length < RSA_LIMITS.descriptions.max && (
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addDescription}><Plus className="size-3" /> Add</Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-[10px] text-primary"
                  onClick={async () => {
                    const { generateDescriptions, getStoreSnapshot } = await import("@/lib/google/search-ai-generator");
                    const snapshot = await getStoreSnapshot();
                    const suggestions = generateDescriptions(snapshot);
                    const existing = ad.descriptions.filter(d => d.text?.trim()).map(d => d.text!.toLowerCase());
                    const newDescs = [...ad.descriptions];
                    let suggIdx = 0;
                    for (let i = 0; i < newDescs.length && suggIdx < suggestions.length; i++) {
                      if (!newDescs[i].text?.trim()) {
                        while (suggIdx < suggestions.length && existing.includes(suggestions[suggIdx].text.toLowerCase())) suggIdx++;
                        if (suggIdx < suggestions.length) {
                          newDescs[i] = { ...newDescs[i], text: suggestions[suggIdx].text };
                          existing.push(suggestions[suggIdx].text.toLowerCase());
                          suggIdx++;
                        }
                      }
                    }
                    onUpdate({ descriptions: newDescs });
                  }}
                >
                  <Sparkles className="size-3" /> Fill empty
                </Button>
              </div>
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
              <Label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-foreground">Final URL <span className="text-red-500">*</span> <InfoTip text="The landing page users visit after clicking your ad. Use a relevant product or category page — not just your homepage. Page relevance directly affects Quality Score and ad rank." /></Label>
              <Input value={ad.finalUrl} onChange={(e) => onUpdate({ finalUrl: e.target.value })} placeholder="https://store.salla.sa" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-foreground">Display Path <InfoTip text="Cosmetic URL shown in the ad (doesn't affect where users go). Use it to signal relevance — e.g. store.salla.sa/Perfume/Shop." /></Label>
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
            {safeAds.length < 5 && (
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
                <div className="rounded-lg border border-border bg-muted/10 p-2.5">
                  <p className="mb-1 text-[10px] font-semibold text-foreground">Landscape (1.91:1)</p>
                  <p className="mb-2 text-[9px] text-muted-foreground">Min 1200x628</p>
                  <UploadZone
                    accept="image/png,image/jpeg"
                    label="Upload landscape"
                    sublabel="JPG/PNG · 1.91:1"
                    onFile={(file) => {
                      const url = URL.createObjectURL(file);
                      updateCurrentAd({ images: [...currentAd.images, { id: `aimg-l-${Date.now()}`, type: "IMAGE" as const, url }] });
                    }}
                    compact
                  />
                </div>
                <div className="rounded-lg border border-border bg-muted/10 p-2.5">
                  <p className="mb-1 text-[10px] font-semibold text-foreground">Portrait (4:5)</p>
                  <p className="mb-2 text-[9px] text-muted-foreground">Min 480x600</p>
                  <UploadZone
                    accept="image/png,image/jpeg"
                    label="Upload portrait"
                    sublabel="JPG/PNG · 4:5"
                    onFile={(file) => {
                      const url = URL.createObjectURL(file);
                      updateCurrentAd({ images: [...currentAd.images, { id: `aimg-p-${Date.now()}`, type: "IMAGE" as const, url }] });
                    }}
                    compact
                  />
                </div>
                <div className="rounded-lg border border-border bg-muted/10 p-2.5">
                  <p className="mb-1 text-[10px] font-semibold text-foreground">Square (1:1)</p>
                  <p className="mb-2 text-[9px] text-muted-foreground">Min 200x200</p>
                  <UploadZone
                    accept="image/png,image/jpeg"
                    label="Upload square"
                    sublabel="JPG/PNG · 1:1"
                    onFile={(file) => {
                      const url = URL.createObjectURL(file);
                      updateCurrentAd({ images: [...currentAd.images, { id: `aimg-s-${Date.now()}`, type: "IMAGE" as const, url }] });
                    }}
                    compact
                  />
                </div>
              </div>
              {currentAd.images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {currentAd.images.map((img, i) => (
                    <div key={img.id} className="group relative size-12 overflow-hidden rounded border border-border bg-muted">
                      {img.url && <img src={img.url} alt={`Image ${i + 1}`} className="size-full object-cover" />}
                      <button type="button" onClick={() => updateCurrentAd({ images: currentAd.images.filter((_, j) => j !== i) })} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <X className="size-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1.5 text-[10px] text-muted-foreground">{currentAd.images.length}/{APP_AD_LIMITS.images.max} images uploaded</p>
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
        nextLabel="Next"
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

const DISPLAY_TOPICS = [
  { id: "/Arts & Entertainment", label: "Arts & Entertainment" },
  { id: "/Autos & Vehicles", label: "Autos & Vehicles" },
  { id: "/Beauty & Fitness", label: "Beauty & Fitness" },
  { id: "/Books & Literature", label: "Books & Literature" },
  { id: "/Business & Industrial", label: "Business & Industrial" },
  { id: "/Computers & Electronics", label: "Computers & Electronics" },
  { id: "/Finance", label: "Finance" },
  { id: "/Food & Drink", label: "Food & Drink" },
  { id: "/Games", label: "Games" },
  { id: "/Health", label: "Health" },
  { id: "/Hobbies & Leisure", label: "Hobbies & Leisure" },
  { id: "/Home & Garden", label: "Home & Garden" },
  { id: "/Internet & Telecom", label: "Internet & Telecom" },
  { id: "/Jobs & Education", label: "Jobs & Education" },
  { id: "/News", label: "News" },
  { id: "/Online Communities", label: "Online Communities" },
  { id: "/People & Society", label: "People & Society" },
  { id: "/Pets & Animals", label: "Pets & Animals" },
  { id: "/Real Estate", label: "Real Estate" },
  { id: "/Shopping", label: "Shopping" },
  { id: "/Sports", label: "Sports" },
  { id: "/Travel", label: "Travel" },
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
  const [contentKeywordInput, setContentKeywordInput] = useState("");
  const [placementInput, setPlacementInput] = useState("");
  const [excludedPlacementInput, setExcludedPlacementInput] = useState("");

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

  /* Content targeting helpers */
  const contentKeywords = currentGroup.contentKeywords ?? [];
  const topics = currentGroup.topics ?? [];
  const placements = currentGroup.placements ?? [];
  const excludedPlacements = currentGroup.excludedPlacements ?? [];

  const addContentKeyword = () => {
    const val = contentKeywordInput.trim();
    if (!val || contentKeywords.includes(val)) return;
    updateCurrentGroup({ contentKeywords: [...contentKeywords, val] });
    setContentKeywordInput("");
  };
  const addPlacement = () => {
    const val = placementInput.trim();
    if (!val || placements.includes(val)) return;
    updateCurrentGroup({ placements: [...placements, val] });
    setPlacementInput("");
  };
  const addExcludedPlacement = () => {
    const val = excludedPlacementInput.trim();
    if (!val || excludedPlacements.includes(val)) return;
    updateCurrentGroup({ excludedPlacements: [...excludedPlacements, val] });
    setExcludedPlacementInput("");
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ===== LEFT: Ad Group Tabs + RDA Editor ===== */}
        <div className="flex flex-1 flex-col gap-5">

          {/* Ad Group Header (single group) */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="size-4 text-primary" />
            </div>
            <div className="flex flex-1 items-center gap-3">
              <Input
                value={currentGroup.name}
                onChange={(e) => updateCurrentGroup({ name: e.target.value })}
                className="h-8 w-48 text-sm font-medium"
                placeholder="Ad Group Name"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
                  {currentGroup.ads.length} ad{currentGroup.ads.length !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
                  {currentGroup.contentKeywords?.length ?? 0} keywords
                </Badge>
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
                  {currentGroup.topics?.length ?? 0} topics
                </Badge>
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
            {currentGroup.ads.length < 5 && (
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
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-[10px] text-primary"
                  onClick={async () => {
                    try {
                      const { getStoreSnapshot, generateHeadlines, generateDescriptions } = await import("@/lib/google/search-ai-generator");
                      const snapshot = await getStoreSnapshot();
                      const headlines = generateHeadlines(snapshot);
                      const shuffled = [...headlines].sort(() => Math.random() - 0.5);
                      const descriptions = generateDescriptions(snapshot);
                      const shuffledDescs = [...descriptions].sort(() => Math.random() - 0.5);

                      const maxH = 5;
                      const existingH = currentAd.headlines.filter(h => h.text?.trim());
                      const existingTexts = new Set(existingH.map(h => h.text!.toLowerCase()));
                      const newHeadlines: typeof currentAd.headlines = [];
                      let si = 0;
                      for (let i = 0; i < maxH; i++) {
                        if (i < existingH.length) {
                          newHeadlines.push(existingH[i]);
                        } else {
                          while (si < shuffled.length && existingTexts.has(shuffled[si].text.toLowerCase())) si++;
                          if (si < shuffled.length) {
                            newHeadlines.push({ id: `dh-gen-${Date.now()}-${i}`, type: "HEADLINE" as const, text: shuffled[si].text });
                            existingTexts.add(shuffled[si].text.toLowerCase());
                            si++;
                          } else {
                            newHeadlines.push({ id: `dh-empty-${Date.now()}-${i}`, type: "HEADLINE" as const, text: "" });
                          }
                        }
                      }

                      const maxD = 5;
                      const existingD = currentAd.descriptions.filter(d => d.text?.trim());
                      const existingDTexts = new Set(existingD.map(d => d.text!.toLowerCase()));
                      const newDescs: typeof currentAd.descriptions = [];
                      let di = 0;
                      for (let i = 0; i < maxD; i++) {
                        if (i < existingD.length) {
                          newDescs.push(existingD[i]);
                        } else {
                          while (di < shuffledDescs.length && existingDTexts.has(shuffledDescs[di].text.toLowerCase())) di++;
                          if (di < shuffledDescs.length) {
                            newDescs.push({ id: `dd-gen-${Date.now()}-${i}`, type: "DESCRIPTION" as const, text: shuffledDescs[di].text });
                            existingDTexts.add(shuffledDescs[di].text.toLowerCase());
                            di++;
                          } else {
                            newDescs.push({ id: `dd-empty-${Date.now()}-${i}`, type: "DESCRIPTION" as const, text: "" });
                          }
                        }
                      }

                      updateCurrentAd({
                        headlines: newHeadlines,
                        descriptions: newDescs,
                        longHeadline: currentAd.longHeadline || `Shop ${snapshot.categories[0] ?? "Products"} from ${snapshot.store.name}`,
                        businessName: currentAd.businessName || snapshot.store.name.slice(0, 25),
                        finalUrl: currentAd.finalUrl || (snapshot.store.domain.startsWith("http") ? snapshot.store.domain : `https://${snapshot.store.domain}`),
                      });
                    } catch { /* silent */ }
                  }}
                >
                  <Sparkles className="size-3" /> Generate
                </Button>
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
                <div className="flex items-center gap-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    Headlines
                    <span className="font-normal text-muted-foreground">({currentAd.headlines.filter(h => h.text.trim()).length}/{RDA_LIMITS.headline.max})</span>
                    <InfoTip text={`${RDA_LIMITS.headline.min}-${RDA_LIMITS.headline.max} headlines, max ${RDA_LIMITS.headline.charLimit} chars each. Google tests combinations to find the best performer.`} />
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-[10px] text-primary"
                    onClick={async () => {
                      const { generateHeadlines, getStoreSnapshot } = await import("@/lib/google/search-ai-generator");
                      const snapshot = await getStoreSnapshot();
                      const suggestions = generateHeadlines(snapshot);
                      const existing = currentAd.headlines.filter(h => h.text?.trim()).map(h => h.text!.toLowerCase());
                      const newH = [...currentAd.headlines];
                      let si = 0;
                      for (let i = 0; i < newH.length && si < suggestions.length; i++) {
                        if (!newH[i].text?.trim()) {
                          while (si < suggestions.length && existing.includes(suggestions[si].text.toLowerCase())) si++;
                          if (si < suggestions.length) { newH[i] = { ...newH[i], text: suggestions[si].text }; existing.push(suggestions[si].text.toLowerCase()); si++; }
                        }
                      }
                      updateCurrentAd({ headlines: newH });
                    }}
                  >
                    <Sparkles className="size-3" /> Fill empty slots
                  </Button>
                </div>
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
              {/* Headline Diversity */}
              {(() => {
                const filled = currentAd.headlines.filter(h => h.text?.trim()).map(h => ({ text: h.text ?? "" }));
                if (filled.length < 3) return null;
                const diversity = scoreHeadlineDiversity(filled, currentAd.businessName || "Store");
                const colorMap = { poor: "text-red-600 bg-red-50 border-red-200", average: "text-amber-600 bg-amber-50 border-amber-200", good: "text-emerald-600 bg-emerald-50 border-emerald-200", excellent: "text-primary bg-primary/5 border-primary/20" };
                return (
                  <div className={`mt-3 rounded-lg border p-3 ${colorMap[diversity.score]}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">Headline diversity: {diversity.score.charAt(0).toUpperCase() + diversity.score.slice(1)}</span>
                      <span className="text-[10px]">{diversity.total}/{RDA_LIMITS.headline.max} headlines</span>
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <span>Brand: {diversity.brand}</span>
                      <span>Product: {diversity.product}</span>
                      <span>Benefit: {diversity.benefit}</span>
                      <span>CTA: {diversity.cta}</span>
                    </div>
                    <p className="mt-1 text-[10px]">{diversity.suggestion}</p>
                  </div>
                );
              })()}
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
                <div className="flex items-center gap-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    Descriptions
                    <span className="font-normal text-muted-foreground">({currentAd.descriptions.filter(d => d.text.trim()).length}/{RDA_LIMITS.description.max})</span>
                    <InfoTip text={`${RDA_LIMITS.description.min}-${RDA_LIMITS.description.max} descriptions, max ${RDA_LIMITS.description.charLimit} chars each. Pair with headlines for testing.`} />
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-[10px] text-primary"
                    onClick={async () => {
                      const { generateDescriptions, getStoreSnapshot } = await import("@/lib/google/search-ai-generator");
                      const snapshot = await getStoreSnapshot();
                      const suggestions = generateDescriptions(snapshot);
                      const existing = currentAd.descriptions.filter(d => d.text?.trim()).map(d => d.text!.toLowerCase());
                      const newD = [...currentAd.descriptions];
                      let si = 0;
                      for (let i = 0; i < newD.length && si < suggestions.length; i++) {
                        if (!newD[i].text?.trim()) {
                          while (si < suggestions.length && existing.includes(suggestions[si].text.toLowerCase())) si++;
                          if (si < suggestions.length) { newD[i] = { ...newD[i], text: suggestions[si].text }; existing.push(suggestions[si].text.toLowerCase()); si++; }
                        }
                      }
                      updateCurrentAd({ descriptions: newD });
                    }}
                  >
                    <Sparkles className="size-3" /> Fill empty slots
                  </Button>
                </div>
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

            {/* Images Section — Functional Upload with Media Library */}
            <div className="mb-5">
              <div className="mb-3 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ImageIcon className="size-3 text-primary" /> Images
                  <InfoTip text="Upload landscape (1.91:1) and square (1:1) images. Google automatically adapts your images to fit different ad placements across 3M+ websites and apps. Provide both sizes for maximum reach." />
                </Label>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={currentAd.images.length > 0 ? "text-emerald-600" : "text-amber-600"}>
                    Landscape: {currentAd.images.length}/{RDA_LIMITS.landscapeImage.max}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className={currentAd.squareImages.length > 0 ? "text-emerald-600" : "text-amber-600"}>
                    Square: {currentAd.squareImages.length}/{RDA_LIMITS.squareImage.max}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Landscape Upload */}
                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <p className="mb-1 text-[10px] font-semibold text-foreground">Landscape (1.91:1)</p>
                  <p className="mb-2 text-[9px] text-muted-foreground">Min 600x314 · Rec 1200x628 · Max 5MB</p>
                  <UploadZone
                    accept="image/png,image/jpeg,image/gif"
                    label="Upload landscape image"
                    sublabel="JPG/PNG · 1.91:1 ratio"
                    onFile={(file) => {
                      const url = URL.createObjectURL(file);
                      updateCurrentAd({ images: [...currentAd.images, { id: `img-l-${Date.now()}`, type: "IMAGE" as const, url }] });
                    }}
                    compact
                    libraryContext={"IMAGE_LANDSCAPE" as "IMAGE"}
                  />
                  {currentAd.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {currentAd.images.map((img, i) => (
                        <div key={img.id} className="group relative size-12 overflow-hidden rounded border border-border bg-muted">
                          {img.url && <img src={img.url} alt={`Landscape ${i + 1}`} className="size-full object-cover" />}
                          <button type="button" onClick={() => updateCurrentAd({ images: currentAd.images.filter((_, j) => j !== i) })} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <X className="size-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Square Upload */}
                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <p className="mb-1 text-[10px] font-semibold text-foreground">Square (1:1)</p>
                  <p className="mb-2 text-[9px] text-muted-foreground">Min 300x300 · Rec 1200x1200 · Max 5MB</p>
                  <UploadZone
                    accept="image/png,image/jpeg,image/gif"
                    label="Upload square image"
                    sublabel="JPG/PNG · 1:1 ratio"
                    onFile={(file) => {
                      const url = URL.createObjectURL(file);
                      updateCurrentAd({ squareImages: [...currentAd.squareImages, { id: `img-s-${Date.now()}`, type: "IMAGE" as const, url }] });
                    }}
                    compact
                    libraryContext={"IMAGE_SQUARE" as "IMAGE"}
                  />
                  {currentAd.squareImages.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {currentAd.squareImages.map((img, i) => (
                        <div key={img.id} className="group relative size-12 overflow-hidden rounded border border-border bg-muted">
                          {img.url && <img src={img.url} alt={`Square ${i + 1}`} className="size-full object-cover" />}
                          <button type="button" onClick={() => updateCurrentAd({ squareImages: currentAd.squareImages.filter((_, j) => j !== i) })} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <X className="size-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Logos Section — Functional Upload */}
            <div className="mb-5">
              <div className="mb-3 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  Logos
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">Recommended</Badge>
                  <InfoTip text="Add your store logo in both landscape (4:1) and square (1:1) formats. Logos help build brand recognition across Display placements. Square logos are more versatile." />
                </Label>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={currentAd.logos.length > 0 ? "text-emerald-600" : "text-muted-foreground"}>
                    Wide: {currentAd.logos.length}/{RDA_LIMITS.logo.max}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className={currentAd.squareLogos.length > 0 ? "text-emerald-600" : "text-muted-foreground"}>
                    Square: {currentAd.squareLogos.length}/{RDA_LIMITS.squareLogo.max}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Wide Logo */}
                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <p className="mb-1 text-[10px] font-semibold text-foreground">Wide Logo (4:1)</p>
                  <p className="mb-2 text-[9px] text-muted-foreground">Min 512x128 · Rec 1200x300</p>
                  <UploadZone
                    accept="image/png,image/jpeg"
                    label="Upload wide logo"
                    sublabel="PNG/JPG · 4:1 ratio"
                    onFile={(file) => {
                      const url = URL.createObjectURL(file);
                      updateCurrentAd({ logos: [...currentAd.logos, { id: `logo-w-${Date.now()}`, type: "LOGO" as const, url }] });
                    }}
                    compact
                    libraryContext={"LOGO_LANDSCAPE" as "IMAGE"}
                  />
                  {currentAd.logos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {currentAd.logos.map((logo, i) => (
                        <div key={logo.id} className="group relative h-8 w-16 overflow-hidden rounded border border-border bg-muted">
                          {logo.url && <img src={logo.url} alt={`Logo ${i + 1}`} className="size-full object-contain" />}
                          <button type="button" onClick={() => updateCurrentAd({ logos: currentAd.logos.filter((_, j) => j !== i) })} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <X className="size-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Square Logo */}
                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <p className="mb-1 text-[10px] font-semibold text-foreground">Square Logo (1:1)</p>
                  <p className="mb-2 text-[9px] text-muted-foreground">Min 128x128 · Rec 1200x1200</p>
                  <UploadZone
                    accept="image/png,image/jpeg"
                    label="Upload square logo"
                    sublabel="PNG/JPG · 1:1 ratio"
                    onFile={(file) => {
                      const url = URL.createObjectURL(file);
                      updateCurrentAd({ squareLogos: [...currentAd.squareLogos, { id: `logo-s-${Date.now()}`, type: "LOGO" as const, url }] });
                    }}
                    compact
                    libraryContext={"LOGO_SQUARE" as "IMAGE"}
                  />
                  {currentAd.squareLogos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {currentAd.squareLogos.map((logo, i) => (
                        <div key={logo.id} className="group relative size-10 overflow-hidden rounded border border-border bg-muted">
                          {logo.url && <img src={logo.url} alt={`Square Logo ${i + 1}`} className="size-full object-contain" />}
                          <button type="button" onClick={() => updateCurrentAd({ squareLogos: currentAd.squareLogos.filter((_, j) => j !== i) })} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <X className="size-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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

            {/* Promo Text — High impact for e-commerce, in main flow */}
            <div className="mb-5">
              <Label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                Promo Text
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">High Impact</Badge>
                <InfoTip text="Shows as a promotional overlay on your Display ads. Use for offers like 'Free shipping', '20% off', or 'New arrivals'. Highly effective for e-commerce." />
              </Label>
              <Input value={currentAd.promoText} onChange={(e) => updateCurrentAd({ promoText: e.target.value.slice(0, 25) })} placeholder="e.g. Free shipping, 20% off today" className="h-9 text-sm" maxLength={25} />
              <p className="mt-1 text-[10px] text-muted-foreground">{currentAd.promoText.length}/25 characters</p>
            </div>

            {/* YouTube Videos — In main flow */}
            <div className="mb-5">
              <Label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                YouTube Videos
                <span className="font-normal text-muted-foreground">(Optional, up to {RDA_LIMITS.youtubeVideos.max})</span>
                <InfoTip text="Add YouTube video URLs to include video assets in your Display ads. Video ads get higher engagement on Display Network." />
              </Label>
              {currentAd.youtubeVideos.map((vid, vi) => (
                <div key={vi} className="mb-1.5 flex items-center gap-2">
                  <Input value={vid} onChange={(e) => {
                    const next = [...currentAd.youtubeVideos]; next[vi] = e.target.value;
                    updateCurrentAd({ youtubeVideos: next });
                  }} placeholder="https://youtube.com/watch?v=..." className="h-8 flex-1 text-xs" />
                  <button type="button" onClick={() => updateCurrentAd({ youtubeVideos: currentAd.youtubeVideos.filter((_, i) => i !== vi) })}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"><X className="size-3.5" /></button>
                </div>
              ))}
              {currentAd.youtubeVideos.length < RDA_LIMITS.youtubeVideos.max && (
                <Button variant="outline" size="sm" className="h-7 gap-1 border-dashed text-[10px]" onClick={() => updateCurrentAd({ youtubeVideos: [...currentAd.youtubeVideos, ""] })}>
                  <Plus className="size-3" /> Add Video URL
                </Button>
              )}
            </div>

            {/* Ad Format Info — Not a selector, just a note */}
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground">
                <span className="font-medium text-foreground">Ad Format:</span> All Formats (recommended). Google automatically renders your ad as native or standard display depending on the placement.
              </p>
            </div>
          </div>

          {/* ===== Content Targeting ===== */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <Label className="text-sm font-semibold text-foreground">Content Targeting</Label>
              <Badge className="rounded-full bg-primary/10 px-1.5 py-0 text-[10px] text-primary">Display</Badge>
              <InfoTip text="Choose where Display ads can appear using context keywords, topics, and placements." />
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Define where your Display ads should appear on the Google Display Network (3M+ websites and apps).
            </p>

            {/* Contextual Keywords */}
            <div className="mb-5">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Search className="size-3 text-primary" />
                Contextual Keywords
                <InfoTip text="Contextual keywords match page content (not search queries). Keep them tightly related to your products." />
              </Label>
              <div className="flex gap-2">
                <Input
                  value={contentKeywordInput}
                  onChange={(e) => setContentKeywordInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addContentKeyword(); }}}
                  placeholder="e.g. women's fashion, smartphone accessories..."
                  className="h-9 flex-1 text-sm"
                />
                <Button size="sm" variant="outline" onClick={addContentKeyword} className="h-9 shrink-0">
                  <Plus className="mr-1 size-3" /> Add
                </Button>
              </div>
              {contentKeywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {contentKeywords.map((kw) => (
                    <span key={kw} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {kw}
                      <button type="button" onClick={() => updateCurrentGroup({ contentKeywords: contentKeywords.filter((k) => k !== kw) })} className="rounded-full p-0.5 hover:bg-primary/10">
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {contentKeywords.length === 0 && (
                <p className="mt-1.5 text-[10px] text-muted-foreground">No keywords selected. Ads will rely on topic and audience targeting only.</p>
              )}
            </div>

            {/* Topic Targeting — Multi-select Dropdown */}
            <div className="mb-5">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Tag className="size-3 text-primary" />
                Topic Targeting
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">{topics.length} selected</Badge>
                <InfoTip text="Your ads appear on web pages and apps related to these topics. Select topics that match your product categories for relevant reach across 3M+ sites." />
              </Label>
              <p className="mb-2 text-[11px] text-muted-foreground">Select topics relevant to your products. Your ads appear on pages about these topics.</p>

              {/* Dropdown trigger */}
              <div className="rounded-lg border border-border bg-background">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("display-topic-dropdown");
                    if (el) el.classList.toggle("hidden");
                  }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                >
                  <span className="text-xs text-muted-foreground">
                    {topics.length === 0 ? "Choose topics..." : `${topics.length} topic${topics.length !== 1 ? "s" : ""} selected`}
                  </span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </button>

                {/* Dropdown content */}
                <div id="display-topic-dropdown" className="hidden border-t border-border">
                  <div className="max-h-56 overflow-y-auto p-1.5">
                    {DISPLAY_TOPICS.map((topic) => {
                      const selected = topics.includes(topic.id);
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => updateCurrentGroup({ topics: selected ? topics.filter((t) => t !== topic.id) : [...topics, topic.id] })}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                            selected ? "bg-primary/5" : "hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                            selected ? "border-primary bg-primary text-white" : "border-border"
                          )}>
                            {selected && <CheckCircle2 className="size-3" />}
                          </div>
                          <span className={cn("text-xs", selected ? "font-medium text-primary" : "text-foreground")}>{topic.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {topics.length > 0 && (
                    <div className="flex items-center justify-between border-t border-border px-3 py-2">
                      <span className="text-[11px] text-muted-foreground">{topics.length} of {DISPLAY_TOPICS.length} topics</span>
                      <button type="button" onClick={() => updateCurrentGroup({ topics: [] })} className="text-[11px] font-medium text-primary hover:underline">Clear all</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected topics as pills */}
              {topics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {topics.map((t) => {
                    const topic = DISPLAY_TOPICS.find((dt) => dt.id === t);
                    return (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {topic?.label ?? t}
                        <button type="button" onClick={() => updateCurrentGroup({ topics: topics.filter((x) => x !== t) })} className="text-primary/60 hover:text-primary">
                          <X className="size-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Managed Placements */}
            <div className="mb-5">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Link2 className="size-3 text-primary" />
                Managed Placements
                <InfoTip text="Managed placements force delivery on specific sites/apps/channels you choose." />
              </Label>
              <div className="flex gap-2">
                <Input
                  value={placementInput}
                  onChange={(e) => setPlacementInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPlacement(); }}}
                  placeholder="e.g. example.com, youtube.com/channel/..."
                  className="h-9 flex-1 text-sm"
                />
                <Button size="sm" variant="outline" onClick={addPlacement} className="h-9 shrink-0">
                  <Plus className="mr-1 size-3" /> Add
                </Button>
              </div>
              {placements.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {placements.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      <Globe className="size-3" />
                      {p}
                      <button type="button" onClick={() => updateCurrentGroup({ placements: placements.filter((x) => x !== p) })} className="rounded-full p-0.5 hover:bg-blue-100">
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Excluded Placements */}
            <div>
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ShieldCheck className="size-3 text-red-500" />
                Excluded Placements
                <InfoTip text="Exclude low-quality or irrelevant placements to protect brand safety and spend quality." />
              </Label>
              <div className="flex gap-2">
                <Input
                  value={excludedPlacementInput}
                  onChange={(e) => setExcludedPlacementInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExcludedPlacement(); }}}
                  placeholder="e.g. competitor-site.com..."
                  className="h-9 flex-1 text-sm"
                />
                <Button size="sm" variant="outline" onClick={addExcludedPlacement} className="h-9 shrink-0">
                  <Plus className="mr-1 size-3" /> Add
                </Button>
              </div>
              {excludedPlacements.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {excludedPlacements.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                      {p}
                      <button type="button" onClick={() => updateCurrentGroup({ excludedPlacements: excludedPlacements.filter((x) => x !== p) })} className="rounded-full p-0.5 hover:bg-red-100">
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
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
                  <span className="text-muted-foreground">Ad Group</span>
                  <span className="font-semibold text-foreground">{currentGroup.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ads</span>
                  <span className="font-semibold text-foreground">{currentGroup.ads.length}</span>
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
        nextLabel="Next"
      />
    </TooltipProvider>
  );
}

/* ================================================================== */
/*  SEARCH: Main Creative Editor                                      */
/* ================================================================== */

function SearchCreativeEditor() {
  const { campaign, setStep, updateNested } = useGoogleCampaign();
  const budget = campaign.budget;
  const adGroups = campaign.creative.searchAdGroups ?? [];
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [activeAdIdx, setActiveAdIdx] = useState(0);
  const [showGoogleAi, setShowGoogleAi] = useState(false);
  const [termInput, setTermInput] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const [newBrandIncl, setNewBrandIncl] = useState("");
  const [newBrandExcl, setNewBrandExcl] = useState("");
  const [newUrlIncl, setNewUrlIncl] = useState("");

  /* Ensure at least 1 ad group */
  const safeGroups = adGroups.length > 0 ? adGroups : [createSearchAdGroup(1)];
  const currentGroup = safeGroups[activeGroupIdx] ?? safeGroups[0];

  const updateAdGroups = (groups: SearchAdGroup[]) => updateNested("creative", { searchAdGroups: groups });
  const updateCurrentGroup = (patch: Partial<SearchAdGroup>) => {
    const groups = safeGroups.map((g, i) => i === activeGroupIdx ? { ...g, ...patch } : g);
    updateAdGroups(groups);
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

  /* Preview ad (active ad in current group) */
  const previewAd = currentGroup.ads[activeAdIdx] ?? currentGroup.ads[0] ?? createSearchAd(1);
  const previewStrength = calcRsaStrength(previewAd, currentGroup.keywords.length);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ============================================================ */}
        {/* LEFT: Ad Group Tabs + RSA Editor + Extensions                */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">

          {/* Ad Group Header (single group) */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="size-4 text-primary" />
            </div>
            <div className="flex flex-1 items-center gap-3">
              <Input
                value={currentGroup.name}
                onChange={(e) => updateCurrentGroup({ name: e.target.value })}
                className="h-8 w-48 text-sm font-medium"
                placeholder="Ad Group Name"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
                  {currentGroup.ads.length} ad{currentGroup.ads.length !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
                  {currentGroup.keywords?.length ?? 0} keywords
                </Badge>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-primary hover:underline"
                >
                  Edit in Audience →
                </button>
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
                storeName={campaign.objective.campaignName.split(" - ")[0] || "Store"}
                onUpdate={(patch) => updateAd(adIdx, patch)}
                onDelete={() => deleteAd(adIdx)}
                onDuplicate={() => duplicateAd(adIdx)}
                onExpand={(idx) => setActiveAdIdx(idx)}
              />
            ))}
            {currentGroup.ads.length < 5 && (
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
                  <InfoTip text="Additional links shown below your ad. Add 4-6 sitelinks to boost CTR by up to 15%. Use key store pages: Best Sellers, New Arrivals, Sale, Categories." />
                </div>
                <div className="flex items-center gap-1">
                  {sitelinks.length < 6 && (
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addSitelink}><Plus className="size-3" /> Add</Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 text-[10px] text-primary"
                    onClick={async () => {
                      const snapshot = await getStoreSnapshot();
                      updateNested("creative", { sitelinkExtensions: generateSitelinks(snapshot) });
                    }}
                  >
                    <Sparkles className="size-3" /> Auto-fill from Store
                  </Button>
                </div>
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
                  <InfoTip text="Short benefit phrases shown in your ad. Add 6-8 callouts highlighting key selling points: Free Shipping, Cash on Delivery, Easy Returns, 24/7 Support." />
                </div>
                <div className="flex items-center gap-1">
                  {callouts.length < 10 && (
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addCallout}><Plus className="size-3" /> Add</Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 text-[10px] text-primary"
                    onClick={() => {
                      updateNested("creative", {
                        calloutExtensions: generateCallouts().map((text, i) => ({
                          id: `gen-co-${Date.now()}-${i}`,
                          text,
                        })),
                      });
                    }}
                  >
                    <Sparkles className="size-3" /> Auto-fill from Store
                  </Button>
                </div>
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
                <div className="flex items-center gap-1">
                  {snippets.length < 4 && (
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-primary" onClick={addSnippet}><Plus className="size-3" /> Add</Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 text-[10px] text-primary"
                    onClick={async () => {
                      const snapshot = await getStoreSnapshot();
                      updateNested("creative", { structuredSnippetExtensions: generateSnippets(snapshot) });
                    }}
                  >
                    <Sparkles className="size-3" /> Auto-fill from Store
                  </Button>
                </div>
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

          {/* ---- Price Extensions (Manual + AI) ---- */}
          <SectionCard>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Price Extensions</Label>
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">{(campaign.creative.priceExtensions ?? []).flatMap(pe => pe.offerings).length} items</Badge>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-[10px]"
                  onClick={() => {
                    const existing = campaign.creative.priceExtensions ?? [];
                    if (existing.length > 0) {
                      // Add offering to first price asset
                      const first = existing[0];
                      if (first.offerings.length >= 8) return;
                      const updated = { ...first, offerings: [...first.offerings, { id: `po-${Date.now()}`, header: "", description: "", priceMicros: 0, unit: "NONE" as const, finalUrl: "" }] };
                      updateNested("creative", { priceExtensions: [updated, ...existing.slice(1)] });
                    } else {
                      // Create new price asset with one empty offering
                      updateNested("creative", { priceExtensions: [{ id: `pe-${Date.now()}`, type: "PRODUCT_CATEGORIES" as const, priceQualifier: "FROM" as const, languageCode: "ar", offerings: [{ id: `po-${Date.now()}`, header: "", description: "", priceMicros: 0, unit: "NONE" as const, finalUrl: "" }] }] });
                    }
                  }}
                >
                  <Plus className="size-3" /> Add Item
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-[10px] text-primary"
                  onClick={async () => {
                    const snapshot = await getStoreSnapshot();
                    const { generatePriceExtensions } = await import("@/lib/google/search-ai-generator");
                    updateNested("creative", { priceExtensions: generatePriceExtensions(snapshot) });
                  }}
                >
                  <Sparkles className="size-3" /> Auto-fill
                </Button>
              </div>
            </div>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Show product prices directly in your ad. Pre-qualifies clicks — shoppers see prices before clicking, reducing wasted spend on browsers. Add up to 8 items.
            </p>
            {(campaign.creative.priceExtensions ?? []).length > 0 ? (
              <div className="space-y-2">
                {(campaign.creative.priceExtensions ?? []).map((pe, peIdx) => (
                  <div key={pe.id} className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{pe.offerings.length}/8 items</span>
                      <button type="button" className="text-[10px] text-destructive hover:underline" onClick={() => updateNested("creative", { priceExtensions: (campaign.creative.priceExtensions ?? []).filter(p => p.id !== pe.id) })}>
                        Remove all
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {pe.offerings.map((o, oIdx) => (
                        <div key={o.id} className="flex items-start gap-2 rounded border border-border bg-background p-2">
                          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                            <Input
                              value={o.header}
                              onChange={(e) => {
                                const newOfferings = [...pe.offerings];
                                newOfferings[oIdx] = { ...o, header: e.target.value.slice(0, 25) };
                                const newPe = [...(campaign.creative.priceExtensions ?? [])];
                                newPe[peIdx] = { ...pe, offerings: newOfferings };
                                updateNested("creative", { priceExtensions: newPe });
                              }}
                              placeholder="Product name"
                              className="h-7 text-[11px]"
                            />
                            <Input
                              value={o.description}
                              onChange={(e) => {
                                const newOfferings = [...pe.offerings];
                                newOfferings[oIdx] = { ...o, description: e.target.value.slice(0, 25) };
                                const newPe = [...(campaign.creative.priceExtensions ?? [])];
                                newPe[peIdx] = { ...pe, offerings: newOfferings };
                                updateNested("creative", { priceExtensions: newPe });
                              }}
                              placeholder="Description"
                              className="h-7 text-[11px]"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">SAR</span>
                              <Input
                                type="number"
                                value={o.priceMicros > 0 ? (o.priceMicros / 1_000_000).toFixed(0) : ""}
                                onChange={(e) => {
                                  const newOfferings = [...pe.offerings];
                                  newOfferings[oIdx] = { ...o, priceMicros: Math.round(Number(e.target.value || 0) * 1_000_000) };
                                  const newPe = [...(campaign.creative.priceExtensions ?? [])];
                                  newPe[peIdx] = { ...pe, offerings: newOfferings };
                                  updateNested("creative", { priceExtensions: newPe });
                                }}
                                placeholder="Price"
                                className="h-7 w-20 text-[11px]"
                              />
                            </div>
                            <Input
                              value={o.finalUrl}
                              onChange={(e) => {
                                const newOfferings = [...pe.offerings];
                                newOfferings[oIdx] = { ...o, finalUrl: e.target.value };
                                const newPe = [...(campaign.creative.priceExtensions ?? [])];
                                newPe[peIdx] = { ...pe, offerings: newOfferings };
                                updateNested("creative", { priceExtensions: newPe });
                              }}
                              placeholder="URL"
                              className="h-7 text-[11px]"
                            />
                          </div>
                          <button type="button" className="mt-1 text-muted-foreground hover:text-destructive" onClick={() => {
                            const newOfferings = pe.offerings.filter((_, i) => i !== oIdx);
                            if (newOfferings.length === 0) {
                              updateNested("creative", { priceExtensions: (campaign.creative.priceExtensions ?? []).filter(p => p.id !== pe.id) });
                            } else {
                              const newPe = [...(campaign.creative.priceExtensions ?? [])];
                              newPe[peIdx] = { ...pe, offerings: newOfferings };
                              updateNested("creative", { priceExtensions: newPe });
                            }
                          }}>
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 text-center">
                <p className="text-[11px] text-muted-foreground">No price items added. Use &quot;Add Item&quot; to add manually or &quot;Auto-fill&quot; to populate from your products.</p>
              </div>
            )}
          </SectionCard>

          {/* ---- Promotion Extensions (Manual + AI) ---- */}
          <SectionCard>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Promotion Extensions</Label>
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">{(campaign.creative.promotionExtensions ?? []).length}</Badge>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-[10px]"
                  onClick={() => {
                    const today = new Date().toISOString().split("T")[0];
                    const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
                    updateNested("creative", {
                      promotionExtensions: [...(campaign.creative.promotionExtensions ?? []), {
                        id: `promo-${Date.now()}`,
                        promotionTarget: "",
                        discountModifier: "NONE" as const,
                        discountType: "PERCENT_OFF" as const,
                        moneyAmountMicros: 0,
                        percentOff: 0,
                        occasion: "NONE" as const,
                        finalUrl: "",
                        startDate: today,
                        endDate: twoWeeks,
                      }],
                    });
                  }}
                >
                  <Plus className="size-3" /> Add Promotion
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-[10px] text-primary"
                  onClick={async () => {
                    const snapshot = await getStoreSnapshot();
                    const { generatePromotionExtensions } = await import("@/lib/google/search-ai-generator");
                    updateNested("creative", { promotionExtensions: generatePromotionExtensions(snapshot) });
                  }}
                >
                  <Sparkles className="size-3" /> Auto-generate
                </Button>
              </div>
            </div>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Highlight active promotions with discount details and urgency. Increases CTR by 10-20%. Best used during sales, seasonal events, or limited-time offers.
            </p>
            {(campaign.creative.promotionExtensions ?? []).length > 0 ? (
              <div className="space-y-3">
                {(campaign.creative.promotionExtensions ?? []).map((promo, promoIdx) => (
                  <div key={promo.id} className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Promotion {promoIdx + 1}</span>
                      <button type="button" className="text-[10px] text-destructive hover:underline" onClick={() => updateNested("creative", { promotionExtensions: (campaign.creative.promotionExtensions ?? []).filter(p => p.id !== promo.id) })}>
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-muted-foreground">What&apos;s being promoted (max 20 chars)</label>
                        <Input
                          value={promo.promotionTarget}
                          onChange={(e) => {
                            const newPromos = [...(campaign.creative.promotionExtensions ?? [])];
                            newPromos[promoIdx] = { ...promo, promotionTarget: e.target.value.slice(0, 20) };
                            updateNested("creative", { promotionExtensions: newPromos });
                          }}
                          placeholder="e.g. Summer Collection"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Discount type</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { const np = [...(campaign.creative.promotionExtensions ?? [])]; np[promoIdx] = { ...promo, discountType: "PERCENT_OFF" }; updateNested("creative", { promotionExtensions: np }); }} className={cn("rounded-md border px-2.5 py-1.5 text-[11px] transition-all", promo.discountType === "PERCENT_OFF" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>% Off</button>
                          <button type="button" onClick={() => { const np = [...(campaign.creative.promotionExtensions ?? [])]; np[promoIdx] = { ...promo, discountType: "MONETARY" }; updateNested("creative", { promotionExtensions: np }); }} className={cn("rounded-md border px-2.5 py-1.5 text-[11px] transition-all", promo.discountType === "MONETARY" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>SAR Off</button>
                          <button type="button" onClick={() => { const np = [...(campaign.creative.promotionExtensions ?? [])]; np[promoIdx] = { ...promo, discountType: "NONE" }; updateNested("creative", { promotionExtensions: np }); }} className={cn("rounded-md border px-2.5 py-1.5 text-[11px] transition-all", promo.discountType === "NONE" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>No discount</button>
                        </div>
                      </div>
                      {promo.discountType === "PERCENT_OFF" && (
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Discount percentage</label>
                          <div className="flex items-center gap-1">
                            <Input type="number" value={promo.percentOff || ""} onChange={(e) => { const np = [...(campaign.creative.promotionExtensions ?? [])]; np[promoIdx] = { ...promo, percentOff: Math.min(100, Math.max(0, Number(e.target.value || 0))) }; updateNested("creative", { promotionExtensions: np }); }} placeholder="20" className="h-8 w-20 text-xs" />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        </div>
                      )}
                      {promo.discountType === "MONETARY" && (
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Discount amount</label>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">SAR</span>
                            <Input type="number" value={promo.moneyAmountMicros > 0 ? (promo.moneyAmountMicros / 1_000_000).toFixed(0) : ""} onChange={(e) => { const np = [...(campaign.creative.promotionExtensions ?? [])]; np[promoIdx] = { ...promo, moneyAmountMicros: Math.round(Number(e.target.value || 0) * 1_000_000) }; updateNested("creative", { promotionExtensions: np }); }} placeholder="50" className="h-8 w-20 text-xs" />
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Landing page URL</label>
                        <Input value={promo.finalUrl} onChange={(e) => { const np = [...(campaign.creative.promotionExtensions ?? [])]; np[promoIdx] = { ...promo, finalUrl: e.target.value }; updateNested("creative", { promotionExtensions: np }); }} placeholder="https://store.salla.sa/sale" className="h-8 text-xs" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Start date</label>
                        <Input type="date" value={promo.startDate} onChange={(e) => { const np = [...(campaign.creative.promotionExtensions ?? [])]; np[promoIdx] = { ...promo, startDate: e.target.value }; updateNested("creative", { promotionExtensions: np }); }} className="h-8 text-xs" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-muted-foreground">End date</label>
                        <Input type="date" value={promo.endDate} onChange={(e) => { const np = [...(campaign.creative.promotionExtensions ?? [])]; np[promoIdx] = { ...promo, endDate: e.target.value }; updateNested("creative", { promotionExtensions: np }); }} className="h-8 text-xs" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 text-center">
                <p className="text-[11px] text-muted-foreground">No promotions added. Use &quot;Add Promotion&quot; to create manually or &quot;Auto-generate&quot; from your sale items.</p>
              </div>
            )}
          </SectionCard>

          {/* Google AI Settings */}
          <SectionCard>
            <button type="button" onClick={() => setShowGoogleAi(!showGoogleAi)}
              className="flex w-full items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Google AI Settings</Label>
                <InfoTip text="Control how Google AI generates and enhances your search campaign assets including automation, AI Max, and text guidelines." />
              </div>
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showGoogleAi && "rotate-180")} />
            </button>

            {showGoogleAi && (
              <div className="mt-4 space-y-5">
                {/* Asset Automation (3 toggles) */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-foreground">Asset Automation</p>
                  <p className="mb-3 text-[11px] text-muted-foreground">Google AI creates variations of your text and images for testing.</p>
                  <div className="space-y-2">
                    {[
                      { type: "TEXT_ASSET_AUTOMATION" as AssetAutomationType, label: "Text Asset Automation", desc: "Auto-create headline and description variations" },
                      { type: "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION" as AssetAutomationType, label: "Final URL Text Automation", desc: "Generate text for expanded landing pages" },
                      { type: "GENERATE_IMAGE_ENHANCEMENT" as AssetAutomationType, label: "Image Enhancement", desc: "AI-enhance images in search ad extensions" },
                    ].map((item) => {
                      const entry = (budget.assetAutomationSettings ?? []).find((e: AssetAutomationEntry) => e.type === item.type);
                      const isOn = (entry?.status ?? "OPTED_IN") === "OPTED_IN";
                      return (
                        <div key={item.type} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                          <div>
                            <p className="text-[11px] font-medium text-foreground">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                          </div>
                          <Switch checked={isOn} onCheckedChange={(v) => {
                            const settings = [...(budget.assetAutomationSettings ?? [])];
                            const idx = settings.findIndex((e: AssetAutomationEntry) => e.type === item.type);
                            const newEntry = { type: item.type, status: (v ? "OPTED_IN" : "OPTED_OUT") as AssetAutomationStatus };
                            if (idx >= 0) settings[idx] = newEntry; else settings.push(newEntry);
                            updateNested("budget", { assetAutomationSettings: settings });
                          }} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Max for Search */}
                {(() => {
                  const aiMax = budget.aiMaxSettings;
                  const updateAiMax = (patch: Partial<typeof aiMax>) =>
                    updateNested("budget", { aiMaxSettings: { ...aiMax, ...patch } });
                  const addTag = (
                    field: "brandInclusions" | "brandExclusions" | "urlInclusions",
                    value: string,
                    setter: (v: string) => void
                  ) => {
                    const trimmed = value.trim();
                    if (!trimmed || aiMax[field].includes(trimmed)) return;
                    updateAiMax({ [field]: [...aiMax[field], trimmed] });
                    setter("");
                  };
                  const removeTag = (
                    field: "brandInclusions" | "brandExclusions" | "urlInclusions",
                    idx: number
                  ) => {
                    updateAiMax({ [field]: aiMax[field].filter((_: string, i: number) => i !== idx) });
                  };

                  return (
                    <div className="rounded-lg border border-border p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="size-4 text-amber-600" />
                          <p className="text-xs font-semibold text-foreground">AI Max for Search</p>
                          <Badge className="rounded-full border-0 bg-green-100 px-1.5 py-0 text-[9px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                            Recommended
                          </Badge>
                        </div>
                        <Switch checked={aiMax.enableAiMax} onCheckedChange={(v) => updateAiMax({ enableAiMax: v })} />
                      </div>
                      <p className="mb-3 text-[11px] text-muted-foreground">
                        Automatically expands keyword reach, generates ad copy variations, and routes users to the best landing page. Average improvement: 14% more conversions.
                      </p>

                      {aiMax.enableAiMax && (
                        <div className="space-y-3">
                          {/* Brand Inclusions */}
                          <div>
                            <Label className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-foreground">
                              <Shield className="size-3 text-primary" /> Brand Inclusions
                            </Label>
                            <div className="flex gap-1.5">
                              <Input value={newBrandIncl} onChange={(e) => setNewBrandIncl(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("brandInclusions", newBrandIncl, setNewBrandIncl); } }}
                                placeholder="Your brand name" className="h-8 flex-1 text-xs" />
                              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => addTag("brandInclusions", newBrandIncl, setNewBrandIncl)}>
                                <Plus className="size-3" />
                              </Button>
                            </div>
                            {aiMax.brandInclusions.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {aiMax.brandInclusions.map((b: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="gap-1 text-[9px]">{b}
                                    <button type="button" onClick={() => removeTag("brandInclusions", i)}><X className="size-2.5" /></button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Brand Exclusions */}
                          <div>
                            <Label className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-foreground">
                              <Shield className="size-3 text-red-500" /> Brand Exclusions
                            </Label>
                            <div className="flex gap-1.5">
                              <Input value={newBrandExcl} onChange={(e) => setNewBrandExcl(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("brandExclusions", newBrandExcl, setNewBrandExcl); } }}
                                placeholder="Competitor brand" className="h-8 flex-1 text-xs" />
                              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => addTag("brandExclusions", newBrandExcl, setNewBrandExcl)}>
                                <Plus className="size-3" />
                              </Button>
                            </div>
                            {aiMax.brandExclusions.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {aiMax.brandExclusions.map((b: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="gap-1 border-red-200 bg-red-50 text-[9px] text-red-700">{b}
                                    <button type="button" onClick={() => removeTag("brandExclusions", i)}><X className="size-2.5" /></button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* URL Restrictions */}
                          <div>
                            <Label className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-foreground">
                              <Link2 className="size-3 text-primary" /> URL Restrictions
                            </Label>
                            <div className="flex gap-1.5">
                              <Input value={newUrlIncl} onChange={(e) => setNewUrlIncl(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("urlInclusions", newUrlIncl, setNewUrlIncl); } }}
                                placeholder="https://store.salla.sa/products/*" className="h-8 flex-1 font-mono text-xs" />
                              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => addTag("urlInclusions", newUrlIncl, setNewUrlIncl)}>
                                <Plus className="size-3" />
                              </Button>
                            </div>
                            {aiMax.urlInclusions.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {aiMax.urlInclusions.map((u: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="gap-1 font-mono text-[9px]">{u}
                                    <button type="button" onClick={() => removeTag("urlInclusions", i)}><X className="size-2.5" /></button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {aiMax.urlInclusions.length === 0 && (
                              <p className="mt-1 text-[10px] text-muted-foreground">No restrictions - Google can send traffic to any page.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Text Guidelines */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-foreground">Text Guidelines</p>
                  <p className="mb-3 text-[11px] text-muted-foreground">Guide AI-written copy with brand safety rules.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1 text-[10px] text-muted-foreground">Term exclusions</Label>
                      <div className="flex gap-1.5">
                        <Input placeholder="e.g. free" className="h-8 text-xs" value={termInput} onChange={(e) => setTermInput(e.target.value)} onKeyDown={(e) => {
                          if (e.key === "Enter" && termInput.trim()) {
                            e.preventDefault();
                            updateNested("budget", { textGuidelines: { ...budget.textGuidelines, termExclusions: [...budget.textGuidelines.termExclusions, termInput.trim()] } });
                            setTermInput("");
                          }
                        }} />
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                          if (termInput.trim()) {
                            updateNested("budget", { textGuidelines: { ...budget.textGuidelines, termExclusions: [...budget.textGuidelines.termExclusions, termInput.trim()] } });
                            setTermInput("");
                          }
                        }}>Add</Button>
                      </div>
                      {budget.textGuidelines.termExclusions.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {budget.textGuidelines.termExclusions.map((t: string) => (
                            <Badge key={t} variant="secondary" className="gap-1 text-[9px]">{t}
                              <button type="button" onClick={() => updateNested("budget", { textGuidelines: { ...budget.textGuidelines, termExclusions: budget.textGuidelines.termExclusions.filter((x: string) => x !== t) } })}><X className="size-2.5" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="mb-1 text-[10px] text-muted-foreground">Messaging restrictions</Label>
                      <div className="flex gap-1.5">
                        <Input placeholder="e.g. avoid superlatives" className="h-8 text-xs" value={msgInput} onChange={(e) => setMsgInput(e.target.value)} onKeyDown={(e) => {
                          if (e.key === "Enter" && msgInput.trim()) {
                            e.preventDefault();
                            updateNested("budget", { textGuidelines: { ...budget.textGuidelines, messagingRestrictions: [...budget.textGuidelines.messagingRestrictions, msgInput.trim()] } });
                            setMsgInput("");
                          }
                        }} />
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                          if (msgInput.trim()) {
                            updateNested("budget", { textGuidelines: { ...budget.textGuidelines, messagingRestrictions: [...budget.textGuidelines.messagingRestrictions, msgInput.trim()] } });
                            setMsgInput("");
                          }
                        }}>Add</Button>
                      </div>
                      {budget.textGuidelines.messagingRestrictions.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {budget.textGuidelines.messagingRestrictions.map((t: string) => (
                            <Badge key={t} variant="secondary" className="gap-1 text-[9px]">{t}
                              <button type="button" onClick={() => updateNested("budget", { textGuidelines: { ...budget.textGuidelines, messagingRestrictions: budget.textGuidelines.messagingRestrictions.filter((x: string) => x !== t) } })}><X className="size-2.5" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ---- Network & Placement Settings ---- */}
          <SectionCard>
            <div className="mb-3 flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              <Label className="text-sm font-semibold text-foreground">Network & Placement</Label>
              <InfoTip text="Control where your Search ads appear. Maps to Campaign.network_settings." />
            </div>

            {/* Search Partners toggle */}
            <div className="rounded-lg border border-primary/10 bg-background p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <Globe className="mt-0.5 size-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Google Search Partners</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Extend ads to Google Search partner inventory. Start Off for tighter control, then test On if you need extra reach.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={campaign.creative.searchPartners}
                  onCheckedChange={(v) => updateNested("creative", { searchPartners: v })}
                  className="mt-0.5"
                />
              </div>
            </div>

            {/* Display Network expansion toggle */}
            <div className="mt-3 rounded-lg border border-primary/10 bg-background p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <Layers className="mt-0.5 size-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Display Network Expansion</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Allow ads to show on Google Display Network sites when relevant. Increases reach but may lower intent.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={campaign.creative.targetContentNetwork}
                  onCheckedChange={(v) => updateNested("creative", { targetContentNetwork: v })}
                  className="mt-0.5"
                />
              </div>
            </div>
          </SectionCard>

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
                  { label: "Headlines", done: previewAd.headlines.filter((h) => h.text.trim()).length >= 10, count: `${previewAd.headlines.filter((h) => h.text.trim()).length}/${RSA_LIMITS.headlines.max}`, tip: "Add more for Google to test combinations" },
                  { label: "Descriptions", done: previewAd.descriptions.filter((d) => d.text.trim()).length >= RSA_LIMITS.descriptions.max, count: `${previewAd.descriptions.filter((d) => d.text.trim()).length}/${RSA_LIMITS.descriptions.max}`, tip: "Max 4 \u2014 more variety = better results" },
                  { label: "Final URL", done: !!previewAd.finalUrl.trim(), count: previewAd.finalUrl.trim() ? "Set" : "Required", tip: "Required \u2014 where users land after clicking" },
                  { label: "Display Path", done: !!previewAd.displayPath1.trim(), count: previewAd.displayPath1.trim() ? "Set" : "Optional", tip: "Adds context \u2014 e.g. /Products/Perfume" },
                  { label: "Keywords", done: currentGroup.keywords.length >= 5, count: `${currentGroup.keywords.length}`, tip: "Add 10+ keywords in Step 1 for better reach" },
                  { label: "Sitelinks", done: sitelinks.length >= 2, count: `${sitelinks.length}`, tip: "Boosts CTR by up to 15%" },
                  { label: "Callouts", done: callouts.length >= 2, count: `${callouts.length}`, tip: "Highlight benefits like Free Shipping, Easy Returns" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {item.done ? <CheckCircle2 className="size-3 text-emerald-500" /> : <div className="size-3 rounded-full border-2 border-muted" />}
                        <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                      </div>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    {!item.done && (
                      <p className="ml-6 -mt-0.5 mb-1 text-[9px] text-muted-foreground">
                        {item.tip}
                      </p>
                    )}
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
        nextLabel="Next"
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

  // Per dev audit: when feedEnabled is on at the objective step, DG
  // runs in retail catalog mode (DemandGenProductAdInfo). The creative
  // editor surfaces a slim catalog status banner — the full
  // datafeed/refine picker lives in the Shopping flow which this banner
  // points to.
  const isCatalogMode = campaign.objective.feedEnabled === true;
  const catalogFeedName =
    campaign.creative.shoppingFeedName ||
    campaign.creative.shoppingFeedLabel ||
    "(not yet configured)";

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
              {isCatalogMode && (
                <Badge className="ml-2 rounded-full bg-amber-100 px-2 py-0 text-[10px] font-bold text-amber-800 align-middle hover:bg-amber-100">
                  Retail catalog mode
                </Badge>
              )}
            </h1>
            <p className="mt-1.5 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground">
              {isCatalogMode
                ? "Retail Demand Gen — ads auto-render from your Merchant Center product feed. Upload creative assets per ad group; Google composes them with your products at delivery time."
                : "Build ad groups with multiple ads. Each ad group gets its own channel placements. Google optimizes ad combinations within each group."}
            </p>
          </div>

          {/* Catalog mode banner — per dev audit. Surfaces the feed
              picked at Step 0 + offers a jump-back to fine-tune. The
              full datafeed + listing_group refinement UI lives on the
              Shopping objective so we don't duplicate ~700 lines here. */}
          {isCatalogMode && (
            <SectionCard>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Store className="size-4 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground">Product catalog connected</p>
                    <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                      Merchant Center
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Feed: <code className="rounded bg-muted px-1 py-0.5 text-[10px] font-semibold text-foreground">{catalogFeedName}</code>
                    {" "}— maps to <code className="rounded bg-muted px-1 py-0.5 text-[10px]">DemandGenProductAdInfo</code> on submit. Refine which products deliver (by SKU, brand, category) using the same flow the Shopping objective uses.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStep(0)}
                    className="mt-2 h-7 text-[11px]"
                  >
                    Back to Step 0 — configure catalog
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ---- Ad Group Header (single group) ---- */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="size-4 text-primary" />
            </div>
            <div className="flex flex-1 items-center gap-3">
              <Input value={activeGroup?.name ?? ""} onChange={(e) => updateGroup(activeGroupIdx, { name: e.target.value })} className="h-8 w-48 text-sm font-medium" placeholder="Ad Group Name" />
              <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
                {activeGroup?.ads.length ?? 0} ad{(activeGroup?.ads.length ?? 0) !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          {/* ---- Active Ad Group Panel ---- */}
          {activeGroup && (
            <div className="flex flex-col gap-4">
              {/* Channel Controls (per ad group) */}
              <SectionCard>
                <div className="mb-3 flex items-center gap-2">
                  <Tv className="size-4 text-primary" />
                  <Label className="text-xs font-semibold text-foreground">Channel Placements</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{enabledChannels.length} active</Badge>
                  <InfoTip text="Per-ad-group channel controls. Maps to DemandGenAdGroupSettings.channel_controls.selected_channels in the Google Ads API." />
                </div>
                <ObjectiveExplainer
                  className="mb-3"
                  highlight={
                    <>
                      <span className="font-semibold text-primary">Simple setup:</span> keep YouTube + Discover + Gmail ON, then test Display expansion after baseline performance is stable.
                    </>
                  }
                  secondary="More channels = more reach. Fewer channels = tighter control and easier testing."
                />
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
                <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {DG_CHANNEL_DEFS.map((ch) => (
                    <p key={`${ch.key}-desc`} className="text-[10px] text-muted-foreground">
                      <span className="font-medium text-foreground">{ch.label}:</span> {ch.desc}
                    </p>
                  ))}
                </div>
                {!Object.values(activeGroup.channelControls).some(Boolean) && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                    <AlertCircle className="size-3 text-red-600" />
                    <p className="text-[11px] text-red-700">Enable at least one channel.</p>
                  </div>
                )}
                {/* Dev-facing clarifier: Maps is a Search Network surface,
                    not a Demand Gen surface. Google Ads API
                    `DemandGenAdGroupSettings.channel_controls.selected_channels`
                    does NOT include Maps. This note prevents the dev
                    from re-flagging it in the next review cycle. */}
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2">
                  <Info className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    <strong>For the dev:</strong> Maps placement is not part of Google Ads API <code className="rounded bg-muted px-1 py-0.5 text-[10px]">DemandGenAdGroupSettings.channel_controls</code>. Maps inventory is reachable via Search Network campaigns, not Demand Gen. The 6 channels above are the complete supported set.
                  </p>
                </div>
              </SectionCard>

              {/* Ads within this Ad Group */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-semibold text-foreground">Ads</Label>
                    <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{activeGroup.ads.length}</Badge>
                  </div>
                  {activeGroup.ads.length < 5 && (
                    <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => addAd(activeGroupIdx)}>
                      <Plus className="size-3" /> Add Ad
                    </Button>
                  )}
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

          {/* Google AI Settings.
              Per dev audit + Google Ads API restrictions, asset
              automation types are format-specific:
                • Video Responsive → GENERATE_SHORTER_YOUTUBE_VIDEOS +
                                     GENERATE_VERTICAL_YOUTUBE_VIDEOS
                • Multi-Asset       → GENERATE_DESIGN_VERSIONS_FOR_IMAGES +
                                     GENERATE_VIDEOS_FROM_OTHER_ASSETS
                • Carousel          → none of these automations apply (the
                                     creative is card-locked) */}
          {activeAd && (() => {
            const ALL_DG_AUTOMATION_ITEMS: {
              type: DemandGenAdAutomationType;
              label: string;
              desc: string;
              icon: React.ReactNode;
              availableFor: DemandGenAd["adType"][];
            }[] = [
              {
                type: "GENERATE_DESIGN_VERSIONS_FOR_IMAGES",
                label: "Image Design Versions",
                desc: "Auto-create cropped, resized, and reformatted image variations for each placement.",
                icon: <ImageIcon className="size-3.5" />,
                availableFor: ["MULTI_ASSET"],
              },
              {
                type: "GENERATE_VIDEOS_FROM_OTHER_ASSETS",
                label: "Videos from Images",
                desc: "Turn your uploaded images and text into short animated video ads.",
                icon: <PlayCircle className="size-3.5" />,
                availableFor: ["MULTI_ASSET"],
              },
              {
                type: "GENERATE_SHORTER_YOUTUBE_VIDEOS",
                label: "Shorter Video Cuts",
                desc: "Generate shorter video edits from your uploaded videos for better engagement.",
                icon: <PlayCircle className="size-3.5" />,
                availableFor: ["VIDEO_RESPONSIVE"],
              },
              {
                type: "GENERATE_VERTICAL_YOUTUBE_VIDEOS",
                label: "Vertical Video Versions",
                desc: "Auto-create vertical (9:16) videos from horizontal uploads for YouTube Shorts and mobile feeds.",
                icon: <PlayCircle className="size-3.5" />,
                availableFor: ["VIDEO_RESPONSIVE"],
              },
            ];
            // Filter by current ad format.
            const DG_AUTOMATION_ITEMS = ALL_DG_AUTOMATION_ITEMS.filter((item) =>
              item.availableFor.includes(activeAd.adType)
            );
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

            const formatLabel = activeAd.adType === "VIDEO_RESPONSIVE"
              ? "Video Responsive"
              : activeAd.adType === "MULTI_ASSET" ? "Multi-Asset" : "Carousel";

            return (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.02] p-4">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="size-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Google AI Settings</p>
                    <p className="text-[10px] text-muted-foreground">
                      Google AI creates creative variations for {formatLabel} ads.
                    </p>
                  </div>
                </div>

                {/* Format-gating info banner — per dev audit, surface
                    that AI options depend on the chosen ad format. */}
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2">
                  <Info className="mt-0.5 size-3 shrink-0 text-blue-600" />
                  <p className="text-[10px] leading-snug text-blue-800">
                    AI automation options vary by ad format. <strong>Video</strong> ads can generate shorter cuts + vertical versions. <strong>Multi-Asset</strong> ads can generate image variations + videos from your images. <strong>Carousel</strong> ads have no AI automation — the card layout is fixed.
                  </p>
                </div>

                {DG_AUTOMATION_ITEMS.length > 0 ? (
                  <>
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
                  </>
                ) : (
                  /* Carousel — no automation options. Show an honest note
                      so merchants know it's not a bug. */
                  <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5">
                    <Info className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      Carousel ads don&apos;t use AI asset automation — the card images, headlines, and CTAs you set above are what Google delivers. Switch to <strong>Video Responsive</strong> or <strong>Multi-Asset</strong> if you want Google AI to generate creative variations.
                    </p>
                  </div>
                )}
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
        nextLabel="Next"
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
  { value: "PRODUCT_BRAND", label: "Brand", icon: <Star className="size-3.5" />, desc: "Group by product brand name" },
  { value: "PRODUCT_CATEGORY", label: "Category", icon: <FolderTree className="size-3.5" />, desc: "Group by Google product category" },
  { value: "PRODUCT_TYPE", label: "Product Type", icon: <Package className="size-3.5" />, desc: "Group by your custom product type" },
  { value: "PRODUCT_CONDITION", label: "Condition", icon: <Tag className="size-3.5" />, desc: "New, refurbished, or used" },
  { value: "PRODUCT_CUSTOM_ATTRIBUTE_0", label: "Custom Label 0", icon: <Filter className="size-3.5" />, desc: "Group by custom label 0 from your feed" },
  { value: "PRODUCT_CUSTOM_ATTRIBUTE_1", label: "Custom Label 1", icon: <Filter className="size-3.5" />, desc: "Group by custom label 1 from your feed" },
  { value: "PRODUCT_ITEM_ID", label: "Item ID", icon: <Tag className="size-3.5" />, desc: "Target specific products by ID" },
];

const MOCK_BRANDS = ["Oud Collection", "Salla Fashion", "Home Essentials", "TechGear", "Beauty Touch", "Happy Kids"];
const MOCK_CATEGORIES = ["Perfume & Fragrance", "Apparel & Accessories", "Home & Kitchen", "Consumer Electronics", "Beauty & Personal Care", "Baby & Children"];

/* ------------------------------------------------------------------ */
/* UX rebuild — June 2026                                              */
/* ------------------------------------------------------------------ */
/* Shopping ads have exactly two decisions:                            */
/*   1. Which products are eligible to deliver                         */
/*   2. (Optional) Per-group bid overrides — only relevant when the    */
/*      bidding strategy is Manual CPC                                 */
/*                                                                     */
/* The previous layout had 4 left cards + 4 sidebar cards (8 surfaces) */
/* that duplicated stats, leaked Google Ads API jargon (raw object     */
/* names), and silently truncated the dimension picker to 4 of 7       */
/* options. This rewrite collapses to 3 left cards + 2 sidebar cards   */
/* and surfaces all 7 listing dimensions per the Google Ads API spec.  */
/*                                                                     */
/* Google Ads API references mapped to UI sections:                    */
/*   - Card "Products" → ad_group_criterion.listing_group (root +      */
/*     children, with type=SUBDIVISION or UNIT, UNIT_INCLUDED /        */
/*     UNIT_EXCLUDED, and a mandatory "everything else" child)         */
/*   - Card "Bids"      → listing_group.cpc_bid_micros per UNIT        */
/*   - Card "Preview"   → ShoppingProductAdInfo rendered surfaces      */
/*                        (Google Shopping tab, Search PLA, YouTube)   */
/* ------------------------------------------------------------------ */

function ShoppingProductGroups() {
  const { campaign, setStep, updateNested } = useGoogleCampaign();
  const creative = campaign.creative;
  const isManualCpc = campaign.budget.biddingStrategy === "MANUAL_CPC";

  const [selectedDimension, setSelectedDimension] = useState<ProductDimensionType>("PRODUCT_BRAND");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [excludedValues, setExcludedValues] = useState<string[]>([]);
  const [bidOverrides, setBidOverrides] = useState<Record<string, number>>({});
  /** Filter mode — "ALL" advertises every approved feed product (one
   *  root UNIT_INCLUDED, no subdivision). "FILTER" creates a SUBDIVISION
   *  root with the merchant's picks plus the mandatory "everything else"
   *  fallback. Initialized from existing draft state on mount. */
  const [mode, setMode] = useState<"ALL" | "FILTER">("ALL");
  /** PMax-style channel preview switcher. Three surfaces where Shopping
   *  product ads actually render at Google. */
  const [previewSurface, setPreviewSurface] = useState<"shopping" | "search" | "youtube">("shopping");

  /* ── Merchant Center datafeed selector ────────────────────────────
   * Lists real MC datafeeds attached to the connected merchant
   * account (typically 1 primary + 0–1 supplemental). The picked feed
   * scopes the campaign via `ShoppingSetting.feed_label` at payload
   * time. Granular product selection — by brand / category / specific
   * SKU — happens in the refinement modes below (real Google Ads
   * listing_group dimensions, no mock data).
   *
   * Previous "Salla product set" mock library (Best Sellers, Ramadan,
   * etc.) was deleted — those concepts have no native API surface in
   * either Merchant Center or Google Ads. They would have required
   * Salla backend aggregates that don't exist yet. */
  const [mcFeeds, setMcFeeds] = useState<MerchantCenterFeed[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<MerchantCenterFeed | null>(null);
  const [feedPickerOpen, setFeedPickerOpen] = useState(false);

  /* ── Three refinement modes inside the chosen product set ──────────
   * Replaces the old binary "advancedOpen" toggle, which was confusing
   * because it lived in parallel with the product-set picker (two
   * narrowings stacked on top of each other with no clear relationship).
   *
   * Now refinement is explicitly framed as "what to do INSIDE the
   * chosen set," with three honest options:
   *   - "ALL"      → advertise every product in the set (default)
   *   - "SKU"      → keep only specific products (SKU picker)
   *   - "DIMENSION"→ refine by brand / category / etc.
   *
   * Each mode maps cleanly to one shape of Google Ads listing_group
   * tree at persist time. */
  const [refineMode, setRefineMode] = useState<"ALL" | "SKU" | "DIMENSION">("ALL");
  /** Specific Salla product IDs chosen via the ProductPickerDialog when
   *  refineMode === "SKU". These map 1:1 to PRODUCT_ITEM_ID
   *  UNIT_INCLUDED leaves in the Google Ads listing_group tree. The
   *  Salla→Merchant Center adapter must ensure each Salla product.id
   *  is set as offer_id when the product is pushed to MC. */
  const [specificProductIds, setSpecificProductIds] = useState<string[]>([]);
  const [specificProducts, setSpecificProducts] = useState<SallaProduct[]>([]);
  const [skuPickerOpen, setSkuPickerOpen] = useState(false);
  /** Dev audit panel — collapsed by default, exposes the exact
   *  Merchant Center + Google Ads API shape the current selection
   *  translates to. Helps the integration dev verify mapping without
   *  having to run the campaign through review. */
  const [devPanelOpen, setDevPanelOpen] = useState(false);

  // Mirror refineMode → legacy `mode` flag used by the include/exclude
  // partition state. SKU and DIMENSION both produce a subdivided tree;
  // ALL produces a flat UNIT_INCLUDED root.
  useEffect(() => {
    setMode(refineMode === "ALL" ? "ALL" : "FILTER");
  }, [refineMode]);

  useEffect(() => {
    fetchMerchantCenterDatafeeds().then((feeds) => {
      setMcFeeds(feeds);
      // Restore from draft if the merchant had a feed selected earlier;
      // otherwise default to the primary feed (full catalog).
      const draftLabel = creative.shoppingFeedLabel;
      const restored = draftLabel ? feeds.find((f) => f.id === draftLabel || f.name === draftLabel) : null;
      if (restored) {
        setSelectedFeed(restored);
      } else if (feeds.length > 0 && !selectedFeed) {
        const primary = feeds.find((f) => f.kind === "primary") ?? feeds[0];
        setSelectedFeed(primary);
      }
      // Restore refine mode + specific products from draft.
      const draftRefine = creative.shoppingRefineMode;
      if (draftRefine) setRefineMode(draftRefine);
      const draftSpecific = creative.shoppingSpecificProductIds;
      if (draftSpecific && draftSpecific.length > 0) setSpecificProductIds(draftSpecific);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable ref to avoid infinite loops in the persist effect
  const updateRef = useRef(updateNested);
  updateRef.current = updateNested;

  // Initialize local state from saved product group root (draft recovery)
  useEffect(() => {
    const root = creative.productGroupRoot;
    if (!root || root.type !== "SUBDIVISION" || root.children.length === 0) return;

    setSelectedDimension(root.dimensionType);
    const included = root.children
      .filter((c) => c.type === "UNIT_INCLUDED" && c.dimensionValue)
      .map((c) => c.dimensionValue);
    const excluded = root.children
      .filter((c) => c.type === "UNIT_EXCLUDED")
      .map((c) => c.dimensionValue);
    const bids: Record<string, number> = {};
    for (const c of root.children) {
      if (c.cpcBidMicros && c.dimensionValue) {
        bids[c.dimensionValue] = c.cpcBidMicros / 1_000_000;
      }
    }

    if (included.length > 0) setSelectedValues(included);
    if (excluded.length > 0) setExcludedValues(excluded);
    if (Object.keys(bids).length > 0) setBidOverrides(bids);
    // Restore mode: a non-empty SUBDIVISION root means the merchant was
    // in FILTER mode last save; UNIT_INCLUDED root means ALL mode.
    setMode("FILTER");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Persist product group selections to campaign state.
  //
  // Mapping table — refineMode → Google Ads listing_group tree:
  //
  //   "ALL"       → flat UNIT_INCLUDED root (no subdivision). The
  //                  Salla→MC sync handles set membership via
  //                  custom_label_0 on each MC product; this campaign
  //                  delivers every in-set product.
  //
  //   "SKU"       → SUBDIVISION root on PRODUCT_ITEM_ID with one
  //                  UNIT_INCLUDED child per merchant-picked SKU plus
  //                  the mandatory "everything else" UNIT_EXCLUDED
  //                  fallback (Google Ads API enforces it).
  //
  //   "DIMENSION" → SUBDIVISION root on selectedDimension with
  //                  UNIT_INCLUDED + UNIT_EXCLUDED children built from
  //                  selectedValues / excludedValues, plus the
  //                  mandatory "everything else" fallback.
  useEffect(() => {
    // Mode ALL → flat UNIT_INCLUDED root (intent: every in-set product).
    if (refineMode === "ALL") {
      updateRef.current("creative", {
        productGroupRoot: {
          id: "root",
          dimensionType: selectedDimension,
          dimensionValue: "",
          type: "UNIT_INCLUDED" as const,
          children: [],
        },
        shoppingFeedLabel: selectedFeed?.id,
        shoppingFeedName: selectedFeed?.nameAr || selectedFeed?.name,
        shoppingRefineMode: "ALL",
        shoppingSpecificProductIds: [],
      });
      return;
    }

    // Mode SKU → SUBDIVISION on PRODUCT_ITEM_ID with one UNIT_INCLUDED
    // per picked product + everything-else UNIT_EXCLUDED. When the
    // merchant hasn't picked any SKUs yet, fall back to a flat root so
    // the campaign is still valid (avoids "subdivision must have ≥1
    // included" API reject at submit).
    if (refineMode === "SKU") {
      if (specificProductIds.length === 0) {
        updateRef.current("creative", {
          productGroupRoot: {
            id: "root",
            dimensionType: "PRODUCT_ITEM_ID",
            dimensionValue: "",
            type: "UNIT_INCLUDED" as const,
            children: [],
          },
          shoppingFeedLabel: selectedFeed?.id,
          shoppingFeedName: selectedFeed?.nameAr || selectedFeed?.name,
          shoppingRefineMode: "SKU",
          shoppingSpecificProductIds: [],
        });
        return;
      }
      const skuChildren: ProductGroupNode[] = specificProductIds.map((pid) => ({
        id: `sku-${pid}`,
        dimensionType: "PRODUCT_ITEM_ID" as const,
        dimensionValue: pid,
        type: "UNIT_INCLUDED" as const,
        children: [],
      }));
      // Everything else → UNIT_EXCLUDED so only the picked SKUs deliver.
      skuChildren.push({
        id: "other",
        dimensionType: "PRODUCT_ITEM_ID" as const,
        dimensionValue: "",
        type: "UNIT_EXCLUDED" as const,
        children: [],
      });
      updateRef.current("creative", {
        productGroupRoot: {
          id: "root",
          dimensionType: "PRODUCT_ITEM_ID",
          dimensionValue: "",
          type: "SUBDIVISION" as const,
          children: skuChildren,
        },
        shoppingFeedLabel: selectedFeed?.id,
        shoppingFeedName: selectedFeed?.nameAr || selectedFeed?.name,
        shoppingRefineMode: "SKU",
        shoppingSpecificProductIds: specificProductIds,
      });
      return;
    }

    // Mode DIMENSION — fall through to the existing dimension-based
    // SUBDIVISION code below, but if the merchant hasn't picked any
    // values yet, write a flat root so the campaign is still valid.
    const noManualPicks = selectedValues.length === 0 && excludedValues.length === 0;
    if (noManualPicks) {
      updateRef.current("creative", {
        productGroupRoot: {
          id: "root",
          dimensionType: selectedDimension,
          dimensionValue: "",
          type: "UNIT_INCLUDED" as const,
          children: [],
        },
        shoppingFeedLabel: selectedFeed?.id,
        shoppingFeedName: selectedFeed?.nameAr || selectedFeed?.name,
        shoppingRefineMode: "DIMENSION",
        shoppingSpecificProductIds: [],
      });
      return;
    }

    // Build subdivision tree
    const children: ProductGroupNode[] = [];

    // Add included values as UNIT_INCLUDED
    for (const val of selectedValues) {
      children.push({
        id: `inc-${val.replace(/\s+/g, "-").toLowerCase()}`,
        dimensionType: selectedDimension,
        dimensionValue: val,
        type: "UNIT_INCLUDED" as const,
        cpcBidMicros: bidOverrides[val] ? Math.round(bidOverrides[val] * 1_000_000) : undefined,
        children: [],
      });
    }

    // Add excluded values as UNIT_EXCLUDED
    for (const val of excludedValues) {
      children.push({
        id: `exc-${val.replace(/\s+/g, "-").toLowerCase()}`,
        dimensionType: selectedDimension,
        dimensionValue: val,
        type: "UNIT_EXCLUDED" as const,
        children: [],
      });
    }

    // Add "Everything else" node (required by Google Ads API)
    children.push({
      id: "other",
      dimensionType: selectedDimension,
      dimensionValue: "",
      type: "UNIT_INCLUDED" as const,
      children: [],
    });

    updateRef.current("creative", {
      productGroupRoot: {
        id: "root",
        dimensionType: selectedDimension,
        dimensionValue: "",
        type: "SUBDIVISION" as const,
        children,
      },
      // Keep the chosen Salla set tagged on the creative even when the
      // merchant has refined further — the review step still shows
      // "Best Sellers (refined)" instead of a raw dimension count.
      shoppingFeedLabel: selectedFeed?.id,
      shoppingFeedName: selectedFeed?.nameAr || selectedFeed?.name,
      shoppingRefineMode: "DIMENSION",
      shoppingSpecificProductIds: [],
    });
  }, [mode, refineMode, selectedDimension, selectedValues, excludedValues, bidOverrides, selectedFeed, specificProductIds]);

  const toggleValue = (val: string) => {
    // If user picks an excluded value, drop the exclusion first.
    setExcludedValues((prev) => prev.filter((v) => v !== val));
    setSelectedValues((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };
  const toggleExclude = (val: string) => {
    // If user excludes an included value, drop the inclusion first.
    setSelectedValues((prev) => prev.filter((v) => v !== val));
    setExcludedValues((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };

  // Provide mock values for ALL seven Google Ads listing dimensions.
  // The previous build truncated the picker to 4 of 7 — Custom Labels +
  // Item ID were silently unreachable.
  const MOCK_CUSTOM_LABEL_0 = ["new-arrival", "bestseller", "clearance", "ramadan-2026"];
  const MOCK_CUSTOM_LABEL_1 = ["high-margin", "mid-margin", "low-margin"];
  const MOCK_ITEM_IDS = MOCK_PRODUCTS.map((p) => p.id);
  const currentDimensionValues =
      selectedDimension === "PRODUCT_BRAND"     ? MOCK_BRANDS
    : selectedDimension === "PRODUCT_CATEGORY"  ? MOCK_CATEGORIES
    : selectedDimension === "PRODUCT_TYPE"      ? MOCK_CATEGORIES
    : selectedDimension === "PRODUCT_CONDITION" ? ["New", "Refurbished", "Used"]
    : selectedDimension === "PRODUCT_CUSTOM_ATTRIBUTE_0" ? MOCK_CUSTOM_LABEL_0
    : selectedDimension === "PRODUCT_CUSTOM_ATTRIBUTE_1" ? MOCK_CUSTOM_LABEL_1
    : selectedDimension === "PRODUCT_ITEM_ID"   ? MOCK_ITEM_IDS
    : [];

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

  /* === Derived: readiness checks (PMax-style) ================== */
  const FEED_TOTAL = 1247;
  const FEED_APPROVED = 1198;
  const FEED_PENDING = 37;
  const FEED_DISAPPROVED = 12;
  const feedApprovalPct = Math.round((FEED_APPROVED / FEED_TOTAL) * 100);
  const includedCount = mode === "ALL"
    ? (selectedFeed?.productCount ?? FEED_APPROVED)
    : includedProducts.length;
  const groupsConfigured = !!selectedFeed
    && (mode === "ALL" || selectedValues.length > 0 || excludedValues.length > 0);
  const bidsConfigured = !isManualCpc || Object.values(bidOverrides).some((v) => v > 0);

  const readiness: { label: string; ok: boolean; hint?: string }[] = [
    { label: "Salla feed connected to Merchant Center", ok: true },
    { label: "At least 1 approved product available", ok: FEED_APPROVED > 0 },
    {
      label: selectedFeed
        ? `Merchant Center feed: ${selectedFeed.nameAr || selectedFeed.name}`
        : "Pick a Merchant Center feed",
      ok: !!selectedFeed,
      hint: "Pick the datafeed (primary or supplemental) that this campaign should deliver products from. Loaded via the Merchant Center datafeeds endpoint.",
    },
    ...(isManualCpc
      ? [{
          label: bidsConfigured
            ? "Manual CPC bids set on at least one group"
            : "Set CPC bids for your selected groups",
          ok: bidsConfigured,
          hint: "Manual CPC requires per-group bids. Switch the budget step to Maximize Clicks or tROAS to let Google bid automatically.",
        }]
      : []),
  ];
  const readinessPassed = readiness.filter((r) => r.ok).length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>
        {/* ──────────────────────────────────────────────────────── */}
        {/* LEFT COLUMN — 3 cards, in execution order:                */}
        {/*   1. Products  → which catalog items deliver              */}
        {/*   2. Bids      → only when Manual CPC                     */}
        {/*   3. Preview   → realistic surfaces (Shopping/Search/YT)  */}
        {/* ──────────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-5">

          {/* Hero — shorter title, plain-language subtitle, no jargon.
              "Listing" was meaningless to merchants; "Products & bids"
              names the two decisions on this step.  */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
                Products &amp; bids
              </h1>
              <Badge className="rounded-full bg-primary/10 px-2 py-0 text-[10px] font-bold text-primary hover:bg-primary/10">
                Auto-generated creative
              </Badge>
            </div>
            <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
              Shopping ads use your Salla product feed as the creative — no images, copy, or videos to upload. Pick which products are eligible, and (if you&apos;re on Manual CPC) set per-group bids.
            </p>
          </div>

          {/* ─────────────────────────────────────────────────────── */}
          {/* CARD 1 — Products to advertise                          */}
          {/* Merges the old "Feed Overview" + "Partitions" cards     */}
          {/* into one decision. Mode radio gates the heavy UI.       */}
          {/* Maps to: ad_group_criterion.listing_group (root tree)   */}
          {/* ─────────────────────────────────────────────────────── */}
          <SectionCard>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Products to advertise</Label>
                  <InfoTip text="Choose whether every approved product in your Salla feed is eligible, or filter down to a specific subset. Maps to Google Ads listing_group tree on the ad group." />
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {FEED_APPROVED.toLocaleString()} of {FEED_TOTAL.toLocaleString()} products are approved and ready to deliver.
                </p>
              </div>
              {/* Inline mini health pill — replaces the old standalone
                  Feed Health sidebar card. Keeps the signal but kills
                  the duplication. */}
              <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  <span className="text-[11px] font-semibold text-emerald-700">{feedApprovalPct}% approved</span>
                </div>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${feedApprovalPct}%` }}
                  />
                </div>
                {FEED_DISAPPROVED > 0 && (
                  <button
                    type="button"
                    className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() => window.open("https://merchants.google.com/", "_blank")}
                  >
                    Fix {FEED_DISAPPROVED} disapproved →
                  </button>
                )}
              </div>
            </div>

            {/* ───── Unified Salla Product Set selector ─────────────────
                Snapchat-parity flow. The selected state shows stacked
                preview thumbnails + name + product count + Change pill;
                the empty state is a dashed CTA. Tapping either opens
                the right-side picker sheet (defined below).

                This is the REAL Merchant Center surface — the picker
                lists whatever datafeeds are actually attached to the
                merchant's MC account via the Salla→MC connector.
                Typically 1 primary + 0–1 supplemental. */}
            {selectedFeed ? (
              <button
                type="button"
                onClick={() => setFeedPickerOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-white p-3 text-left transition-all hover:border-primary hover:shadow-sm"
              >
                <div className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  selectedFeed.kind === "primary" ? "bg-primary/10" : "bg-amber-100"
                )}>
                  {selectedFeed.kind === "primary" ? (
                    <Store className="size-4 text-primary" />
                  ) : (
                    <Package className="size-4 text-amber-700" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {selectedFeed.nameAr || selectedFeed.name}
                    </p>
                    <Badge className={cn(
                      "rounded-full px-1.5 py-0 text-[9px] font-bold",
                      selectedFeed.kind === "primary"
                        ? "bg-primary/10 text-primary hover:bg-primary/10"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                    )}>
                      {selectedFeed.kind === "primary" ? "Primary feed" : "Supplemental"}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px] font-medium">
                      {selectedFeed.targetCountry}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {selectedFeed.productCount.toLocaleString()} products
                    {selectedFeed.lastRefresh && ` · last refresh ${new Date(selectedFeed.lastRefresh).toLocaleString()}`}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  Change
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setFeedPickerOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/[0.03] py-4 text-primary transition-colors hover:bg-primary/5"
              >
                <Package className="size-4" />
                <span className="text-xs font-semibold">Select Merchant Center feed</span>
                <ArrowRight className="size-3.5" />
              </button>
            )}

            {/* Helper line under the picker — tiny scaffolding for new
                merchants. References the Snapchat parallel so they don't
                feel they're learning two systems. */}
            <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
              These are the real datafeeds in your linked Merchant Center account ({mcFeeds.length} {mcFeeds.length === 1 ? "feed" : "feeds"} found). The Salla → Merchant Center connector keeps them in sync automatically.
            </p>

            {/* ───── Refinement modes ────────────────────────────────
                Three honest options for what to do INSIDE the chosen
                product set:
                  ALL       → advertise every product in the set
                  SKU       → keep only specific products (opens picker)
                  DIMENSION → refine by brand / category / etc.

                Replaces the old "Advanced disclosure" toggle, which
                created two parallel narrowing systems (the set picker
                AND the dimension picker) with no clear relationship.
                Now every refinement is explicitly framed as "applied
                inside the chosen set." */}
            <div className="mt-5 flex flex-col gap-2.5">
              <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                Refine which products from this set actually deliver
                <InfoTip text="Defaults to all products in your chosen set. Pick a refinement only if you want to narrow further. Maps to AdGroupListingGroupFilter tree on the Google Ads ad group." />
              </Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {([
                  {
                    value: "ALL" as const,
                    title: "All products in set",
                    desc: "Every product tagged in this set is eligible to deliver.",
                    icon: <Sparkles className="size-3.5" />,
                    apiHint: "listing_group_filter = UNIT_INCLUDED (flat root)",
                  },
                  {
                    value: "SKU" as const,
                    title: "Keep only specific products",
                    desc: "Pick individual products from this set by name or SKU.",
                    icon: <Package className="size-3.5" />,
                    apiHint: "SUBDIVISION on PRODUCT_ITEM_ID, one UNIT per offer_id",
                  },
                  {
                    value: "DIMENSION" as const,
                    title: "Refine by brand or category",
                    desc: "Subdivide the set further by Google Ads listing dimensions.",
                    icon: <Filter className="size-3.5" />,
                    apiHint: "SUBDIVISION on chosen ListingDimensionInfo type",
                  },
                ]).map((opt) => {
                  const selected = refineMode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRefineMode(opt.value)}
                      className={cn(
                        "flex items-start gap-2 rounded-xl border-2 p-3 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/[0.04] shadow-sm"
                          : "border-border bg-background hover:border-primary/40"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {opt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={cn("text-xs font-semibold", selected ? "text-primary" : "text-foreground")}>
                            {opt.title}
                          </p>
                          {opt.value === "ALL" && (
                            <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px] font-bold">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ───── Mode SKU — specific product picker ──────────────
                Wires the already-imported ProductPickerDialog to let the
                merchant tick individual SKUs from their Salla store.
                Each pick → one PRODUCT_ITEM_ID UNIT_INCLUDED leaf. */}
            {refineMode === "SKU" && (
              <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-dashed border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Specific products{specificProductIds.length > 0 ? ` · ${specificProductIds.length} picked` : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      Each picked product becomes a <code className="rounded bg-muted px-1 py-0.5 text-[10px]">PRODUCT_ITEM_ID</code> partition. Anything else in your set is excluded.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={specificProductIds.length > 0 ? "outline" : "default"}
                    onClick={() => setSkuPickerOpen(true)}
                  >
                    {specificProductIds.length > 0 ? "Edit picks" : "Pick products"}
                  </Button>
                </div>
                {specificProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {specificProducts.slice(0, 8).map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-medium text-foreground"
                      >
                        <span className="truncate max-w-[140px]">{p.nameAr || p.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSpecificProductIds((prev) => prev.filter((id) => id !== p.id));
                            setSpecificProducts((prev) => prev.filter((x) => x.id !== p.id));
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-2.5" />
                        </button>
                      </span>
                    ))}
                    {specificProducts.length > 8 && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        +{specificProducts.length - 8} more
                      </span>
                    )}
                  </div>
                )}
                {specificProductIds.length === 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
                    <AlertCircle className="size-3 shrink-0 text-amber-600" />
                    <span className="text-[11px] text-amber-700">No products picked yet — campaign will deliver every product in the set until you pick at least one.</span>
                  </div>
                )}
              </div>
            )}

            {refineMode === "DIMENSION" && (
              <div className="mt-5 flex flex-col gap-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
                {/* Dimension picker — now a dropdown showing all 7
                    Google Ads listing dimensions (was 4 buttons that
                    silently hid 3 valid options). */}
                <div className="flex flex-col gap-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    Subdivide by
                    <InfoTip text="Google Ads supports 7 listing dimensions per ad group: brand, category, custom product type, condition, two custom labels from your feed (custom_label_0/1), and item ID. Pick the one that maps to how you think about margins or strategy." />
                  </Label>
                  <select
                    value={selectedDimension}
                    onChange={(e) => {
                      setSelectedDimension(e.target.value as ProductDimensionType);
                      setSelectedValues([]);
                      setExcludedValues([]);
                      setBidOverrides({});
                    }}
                    className="h-9 rounded-lg border border-border bg-white px-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                  >
                    {DIMENSION_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label} — {d.desc}</option>
                    ))}
                  </select>
                </div>

                {/* Value list — simplified row: label + segmented
                    Include/Exclude toggle. CPC input moved to Card 2
                    so it doesn't compete for attention here. */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Include or exclude {DIMENSION_OPTIONS.find((d) => d.value === selectedDimension)?.label.toLowerCase()} values
                    </Label>
                    <span className="text-[10px] text-muted-foreground">
                      {selectedValues.length} included · {excludedValues.length} excluded
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    Click a value to include it. Click <strong>Exclude</strong> to block it. Anything you don&apos;t click goes into the auto-generated &ldquo;Everything else&rdquo; group below.
                  </p>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {currentDimensionValues.map((val) => {
                      const included = selectedValues.includes(val);
                      const excluded = excludedValues.includes(val);
                      return (
                        <div
                          key={val}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border bg-background px-3 py-2 transition-all",
                            included && "border-primary bg-primary/[0.04]",
                            excluded && "border-red-200 bg-red-50",
                            !included && !excluded && "border-border"
                          )}
                        >
                          <span className={cn(
                            "flex-1 truncate text-xs font-medium",
                            excluded ? "text-red-700 line-through" : "text-foreground"
                          )}>
                            {val}
                          </span>
                          {/* Segmented Include / Exclude toggle. Replaces
                              the old triple-control row (checkbox +
                              exclude button + state confusion). */}
                          <div className="inline-flex shrink-0 rounded-full border border-border bg-muted/40 p-0.5 text-[10px] font-semibold">
                            <button
                              type="button"
                              onClick={() => toggleValue(val)}
                              className={cn(
                                "rounded-full px-2.5 py-1 transition-colors",
                                included ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              Include
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleExclude(val)}
                              className={cn(
                                "rounded-full px-2.5 py-1 transition-colors",
                                excluded ? "bg-red-500 text-white" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              Exclude
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mandatory "Everything else" disclosure — Google Ads
                    API requires every subdivision to have a fallback
                    UNIT_INCLUDED child. Previously hidden; now visible. */}
                <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-background p-2.5">
                  <FolderTree className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    <strong className="text-foreground">Everything else</strong> — any{" "}
                    {DIMENSION_OPTIONS.find((d) => d.value === selectedDimension)?.label.toLowerCase()}{" "}
                    value you didn&apos;t include or exclude lands here. Google Ads requires this fallback on every subdivided ad group; we add it automatically when the payload is built.
                  </p>
                </div>

                {/* Result count chip */}
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2">
                  <ShoppingBag className="size-3.5 text-primary" />
                  <p className="text-xs font-semibold text-foreground">
                    ~{includedCount.toLocaleString()} products will be eligible to deliver
                  </p>
                </div>
              </div>
            )}

            {/* ───── Listing-group tree preview ───────────────────────
                Renders the exact AdGroupListingGroupFilter shape we'll
                emit to Google Ads. Was previously invisible — merchants
                couldn't see what they'd configured. Shows the root, the
                subdivision dimension (if any), each UNIT branch, and
                the mandatory "everything else" fallback that Google's
                API requires on every SUBDIVISION node. */}
            {selectedFeed && (refineMode !== "ALL") && (
              <div className="mt-4 rounded-xl border border-border bg-muted/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <FolderTree className="size-3.5 text-primary" />
                  <p className="text-xs font-semibold text-foreground">Listing group structure</p>
                  <InfoTip text="The tree Google Ads will build for this ad group. Each leaf is a UNIT — either INCLUDED (delivers) or EXCLUDED (suppressed). Subdivisions must have an 'everything else' UNIT child per Google Ads API." />
                </div>
                <div className="flex flex-col gap-1 font-mono text-[11px] leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">└─</span>
                    <Badge variant="outline" className="rounded px-1.5 py-0 text-[9px] font-bold">SUBDIVISION</Badge>
                    <span className="text-foreground">
                      {refineMode === "SKU"
                        ? "PRODUCT_ITEM_ID"
                        : DIMENSION_OPTIONS.find((d) => d.value === selectedDimension)?.label.toUpperCase().replace(/\s+/g, "_")}
                    </span>
                  </div>
                  {refineMode === "SKU" && specificProductIds.slice(0, 5).map((pid) => (
                    <div key={pid} className="ml-4 flex items-center gap-1.5">
                      <span className="text-muted-foreground">├─</span>
                      <Badge className="rounded bg-emerald-100 px-1.5 py-0 text-[9px] font-bold text-emerald-800 hover:bg-emerald-100">UNIT_INCLUDED</Badge>
                      <span className="truncate text-foreground">{pid}</span>
                    </div>
                  ))}
                  {refineMode === "SKU" && specificProductIds.length > 5 && (
                    <div className="ml-4 text-[10px] text-muted-foreground">… +{specificProductIds.length - 5} more UNIT_INCLUDED</div>
                  )}
                  {refineMode === "DIMENSION" && selectedValues.slice(0, 5).map((val) => (
                    <div key={`inc-${val}`} className="ml-4 flex items-center gap-1.5">
                      <span className="text-muted-foreground">├─</span>
                      <Badge className="rounded bg-emerald-100 px-1.5 py-0 text-[9px] font-bold text-emerald-800 hover:bg-emerald-100">UNIT_INCLUDED</Badge>
                      <span className="truncate text-foreground">{val}</span>
                    </div>
                  ))}
                  {refineMode === "DIMENSION" && excludedValues.slice(0, 5).map((val) => (
                    <div key={`exc-${val}`} className="ml-4 flex items-center gap-1.5">
                      <span className="text-muted-foreground">├─</span>
                      <Badge className="rounded bg-red-100 px-1.5 py-0 text-[9px] font-bold text-red-700 hover:bg-red-100">UNIT_EXCLUDED</Badge>
                      <span className="truncate text-foreground">{val}</span>
                    </div>
                  ))}
                  {/* Mandatory fallback — Google Ads rejects any
                      SUBDIVISION without an "everything else" child. */}
                  <div className="ml-4 flex items-center gap-1.5">
                    <span className="text-muted-foreground">└─</span>
                    <Badge className={cn(
                      "rounded px-1.5 py-0 text-[9px] font-bold",
                      refineMode === "SKU"
                        ? "bg-red-100 text-red-700 hover:bg-red-100"
                        : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                    )}>
                      {refineMode === "SKU" ? "UNIT_EXCLUDED" : "UNIT_INCLUDED"}
                    </Badge>
                    <span className="text-muted-foreground italic">everything else</span>
                    <span className="text-[10px] text-muted-foreground">(auto-added)</span>
                  </div>
                </div>
              </div>
            )}

            {/* ───── Dev audit panel ──────────────────────────────────
                Collapsed by default. Shows the integration dev exactly
                which Google Ads + Merchant Center API objects the
                current selection translates to. Catches mapping bugs
                before they ship to the campaign-payload layer. */}
            <button
              type="button"
              onClick={() => setDevPanelOpen((v) => !v)}
              className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight className={cn("size-3 transition-transform", devPanelOpen && "rotate-90")} />
              For your developer — Salla → Merchant Center → Google Ads mapping
            </button>
            {devPanelOpen && (
              <div className="mt-2 rounded-xl border border-dashed border-border bg-muted/10 p-4 text-[11px] leading-relaxed text-foreground">
                <p className="mb-2 text-xs font-bold text-foreground">What gets sent where</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      1. Salla → Merchant Center (catalog sync, runs server-side)
                    </p>
                    <ul className="ml-3 flex list-disc flex-col gap-1 text-muted-foreground">
                      <li>Each Salla product → one MC product (<code className="rounded bg-muted px-1 py-0.5 text-[10px]">offer_id = salla_product.id</code>).</li>
                      <li>Primary feed auto-pushed by the connector. Supplemental feeds optional — typically used for delta updates (e.g., "recently added"). Both surface on the Content API <code className="rounded bg-muted px-1 py-0.5 text-[10px]">content/v2.1/{`{merchantId}`}/datafeeds</code> endpoint and populate the picker above.</li>
                      <li>Refresh cadence: ~15 min after Salla store inventory changes.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      2. Picker → Google Ads campaign (ShoppingSetting)
                    </p>
                    <ul className="ml-3 flex list-disc flex-col gap-1 text-muted-foreground">
                      <li><code className="rounded bg-muted px-1 py-0.5 text-[10px]">merchant_id</code> — from the linked MC account on the Salla side</li>
                      <li>
                        <code className="rounded bg-muted px-1 py-0.5 text-[10px]">feed_label</code> →
                        <code className="ml-1 rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary">{selectedFeed?.id ?? "—"}</code>
                        {selectedFeed && <> (feed: <strong>{selectedFeed.name}</strong>, target <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{selectedFeed.targetCountry}</code>)</>}
                      </li>
                      <li><code className="rounded bg-muted px-1 py-0.5 text-[10px]">campaign_priority</code> — default 0 (Standard Shopping)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      3. Refinement → ad-group listing_group tree
                    </p>
                    <ul className="ml-3 flex list-disc flex-col gap-1 text-muted-foreground">
                      <li>
                        Refine mode: <code className="rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary">{refineMode}</code>
                      </li>
                      <li>
                        {refineMode === "ALL" && (
                          <>Flat <code className="rounded bg-muted px-1 py-0.5 text-[10px]">UNIT_INCLUDED</code> root — delivers every product in the chosen feed.</>
                        )}
                        {refineMode === "SKU" && (
                          <>SUBDIVISION on <code className="rounded bg-muted px-1 py-0.5 text-[10px]">PRODUCT_ITEM_ID</code> · {specificProductIds.length} UNIT_INCLUDED children + 1 UNIT_EXCLUDED &quot;everything else&quot;</>
                        )}
                        {refineMode === "DIMENSION" && (
                          <>SUBDIVISION on <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{selectedDimension}</code> · {selectedValues.length} UNIT_INCLUDED + {excludedValues.length} UNIT_EXCLUDED + 1 &quot;everything else&quot;</>
                        )}
                      </li>
                      <li>Per-group bids → <code className="rounded bg-muted px-1 py-0.5 text-[10px]">listing_group.cpc_bid_micros</code> on each UNIT (Manual CPC only)</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-[10px] font-bold text-amber-900">⚠ For the dev to verify</p>
                    <ul className="ml-3 mt-0.5 flex list-disc flex-col gap-0.5 text-[10px] text-amber-800">
                      <li>The picker calls <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">fetchMerchantCenterDatafeeds()</code> in <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">lib/google/merchant-center-feeds.ts</code> — currently returns mock data. Wire to <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">content/v2.1/{`{merchantId}`}/datafeeds.list</code> + aggregate product counts via <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">productstatuses.list</code> per datafeed.</li>
                      <li>Merchant Center has NO "product set" object — datafeeds are the closest native concept. For sub-feed groupings (Best Sellers, seasonal, etc.) push them as <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">custom_label_0..4</code> on the MC product, then partition the listing_group on <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">PRODUCT_CUSTOM_ATTRIBUTE_0..4</code>.</li>
                      <li>Every SUBDIVISION must have exactly one child with a null dimension value (the &quot;everything else&quot; UNIT) or <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">listing_group.create</code> fails.</li>
                      <li>Salla product IDs must round-trip cleanly to MC <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">offer_id</code> for the SKU mode to deliver.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ───── Specific-product (SKU) picker dialog ─────────────
                Reuses the shared ProductPickerDialog component. Each
                ticked product → one PRODUCT_ITEM_ID UNIT_INCLUDED leaf
                in the listing_group tree. Max 100 SKUs per ad group is
                a soft cap (Google API allows more but listing trees get
                unwieldy past that). */}
            <ProductPickerDialog
              open={skuPickerOpen}
              onOpenChange={setSkuPickerOpen}
              existingProductNames={specificProducts.map((p) => p.name)}
              maxProducts={100}
              onAddProducts={(picked) => {
                // Merge into existing list, dedupe by id, cap at 100.
                const merged = [...specificProducts];
                for (const p of picked) {
                  if (!merged.find((x) => x.id === p.id)) merged.push(p);
                }
                const capped = merged.slice(0, 100);
                setSpecificProducts(capped);
                setSpecificProductIds(capped.map((p) => p.id));
              }}
            />

            {/* ───── Product Set Picker Sheet ──────────────────────────
                Slide-in panel from the right, matching the Snapchat
                catalog flow exactly. Card grid: hero image strip + name
                + Arabic name + description + seasonal badge + product
                count + selected check / arrow. Empty sets disabled. */}
            <Sheet open={feedPickerOpen} onOpenChange={setFeedPickerOpen}>
              <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]">
                <SheetHeader className="shrink-0 bg-primary px-6 pb-4 pt-5">
                  <SheetTitle className="flex items-center gap-2.5 text-base font-bold text-white">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-white/15">
                      <Package className="size-4 text-white" />
                    </div>
                    Select Merchant Center feed
                  </SheetTitle>
                  <SheetDescription className="text-xs text-white/80">
                    Pick the datafeed this Shopping campaign will deliver products from. Loaded live from your linked Merchant Center account.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto bg-muted/30 px-4 py-3">
                  <div className="flex flex-col gap-2">
                    {mcFeeds.map((feed) => {
                      const isSelected = selectedFeed?.id === feed.id;
                      const isEmpty = feed.productCount === 0;
                      return (
                        <button
                          key={feed.id}
                          type="button"
                          disabled={isEmpty}
                          onClick={() => {
                            if (isEmpty) return;
                            setSelectedFeed(feed);
                            // Picking a new feed clears any in-feed
                            // refinements — they were tied to the
                            // previous feed's product set.
                            setSelectedValues([]);
                            setExcludedValues([]);
                            setBidOverrides({});
                            setSpecificProductIds([]);
                            setSpecificProducts([]);
                            setRefineMode("ALL");
                            setFeedPickerOpen(false);
                          }}
                          className={cn(
                            "group flex flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition-all",
                            isEmpty
                              ? "cursor-not-allowed border-border opacity-50"
                              : isSelected
                                ? "border-primary bg-primary/[0.04] shadow-md"
                                : "border-white bg-white hover:border-primary/60"
                          )}
                        >
                          <div className="flex items-start gap-3 px-3 py-3">
                            <div className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : feed.kind === "primary"
                                  ? "bg-primary/10 text-primary group-hover:bg-primary/20"
                                  : "bg-amber-100 text-amber-700 group-hover:bg-amber-200"
                            )}>
                              {feed.kind === "primary" ? (
                                <Store className="size-4" />
                              ) : (
                                <Package className="size-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className={cn("text-xs font-bold", isSelected ? "text-primary" : "text-foreground")}>
                                  {feed.nameAr || feed.name}
                                </p>
                                <Badge className={cn(
                                  "rounded-full px-1.5 py-0 text-[9px] font-bold",
                                  feed.kind === "primary"
                                    ? "bg-primary/10 text-primary hover:bg-primary/10"
                                    : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                )}>
                                  {feed.kind === "primary" ? "Primary" : "Supplemental"}
                                </Badge>
                                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px] font-medium">
                                  {feed.targetCountry} · {feed.contentLanguage}
                                </Badge>
                                {feed.hasErrors && (
                                  <Badge className="rounded-full bg-red-100 px-1.5 py-0 text-[9px] font-bold text-red-700 hover:bg-red-100">
                                    Errors
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                                {feed.descriptionAr || feed.description}
                              </p>
                              {feed.lastRefresh && (
                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                  Last refresh: {new Date(feed.lastRefresh).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={cn(
                                "text-xs font-bold tabular-nums",
                                isEmpty ? "text-red-500" : isSelected ? "text-primary" : "text-foreground"
                              )}>
                                {feed.productCount.toLocaleString()}{isEmpty ? " (empty)" : ""}
                              </span>
                              <span className="text-[9px] text-muted-foreground">products</span>
                              {isSelected ? (
                                <div className="mt-1 flex size-5 items-center justify-center rounded-full bg-primary">
                                  <Check className="size-3 text-primary-foreground" />
                                </div>
                              ) : (
                                <ArrowRight className="mt-1 size-3.5 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-border bg-background px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {mcFeeds.length} {mcFeeds.length === 1 ? "feed" : "feeds"} from <code className="rounded bg-muted px-1 py-0.5 text-[10px]">content/v2.1/datafeeds</code>
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setFeedPickerOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    More feeds need to be created in Merchant Center directly. To group products by Best Sellers / Seasonal / etc. without making new feeds, use the <strong>Refine by brand or category</strong> mode below.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </SectionCard>

          {/* ─────────────────────────────────────────────────────── */}
          {/* CARD 2 — Per-group bids                                  */}
          {/* Only when Manual CPC is the bidding strategy. Otherwise  */}
          {/* shows a small disclosure pointing back to the budget     */}
          {/* step so the merchant knows WHY the inputs are gone.      */}
          {/* Maps to: listing_group.cpc_bid_micros (per UNIT child)   */}
          {/* ─────────────────────────────────────────────────────── */}
          {isManualCpc ? (
            mode === "FILTER" && selectedValues.length > 0 ? (
              <SectionCard>
                <div className="mb-3 flex items-center gap-2">
                  <Tag className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Per-group CPC bids</Label>
                  <InfoTip text="Set a max cost-per-click per included group. Leave blank to use the ad group default. Maps to listing_group.cpc_bid_micros on each UNIT child." />
                  <Badge variant="outline" className="ml-auto rounded-full px-1.5 py-0 text-[10px]">
                    Manual CPC
                  </Badge>
                </div>
                <p className="mb-3 text-[11px] leading-snug text-muted-foreground">
                  Higher bids on high-margin groups, lower bids on commodity SKUs. Skip groups you want at the ad group default bid.
                </p>
                <div className="flex flex-col gap-1.5">
                  {selectedValues.map((val) => (
                    <div key={val} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
                      <span className="flex-1 truncate text-xs font-medium text-foreground">{val}</span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">SAR</span>
                        <Input
                          type="number"
                          min={0.01}
                          step={0.1}
                          placeholder="Default"
                          value={bidOverrides[val] || ""}
                          onChange={(e) =>
                            setBidOverrides((prev) => ({
                              ...prev,
                              [val]: Number(e.target.value),
                            }))
                          }
                          className="h-7 w-24 text-xs"
                        />
                        <span className="text-[10px] text-muted-foreground">/ click</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : (
              /* Manual CPC but no groups picked yet — gentle nudge */
              <SectionCard className="border-dashed">
                <div className="flex items-start gap-3">
                  <Tag className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Per-group CPC bids will appear here
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      You&apos;re on Manual CPC. Switch &ldquo;Products to advertise&rdquo; to <strong>Filter by group</strong> and pick at least one value to set per-group bids. Otherwise Google uses the ad group&apos;s default CPC for every product.
                    </p>
                  </div>
                </div>
              </SectionCard>
            )
          ) : (
            /* Bidding is automated → no per-group bids exist. Tell the
                user WHY this card is absent (was previously a silent
                disappearance). */
            <SectionCard className="border-dashed bg-muted/10">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">
                    Google is bidding for you — no per-group bids needed
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    Your bidding strategy ({campaign.budget.biddingStrategy.replace(/_/g, " ").toLowerCase()}) lets Google set bids per auction. To set bids per product group manually, switch to <strong>Manual CPC</strong> in the Budget step.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="mt-1.5 text-[11px] font-semibold text-primary hover:underline"
                  >
                    Open Budget step →
                  </button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ─────────────────────────────────────────────────────── */}
          {/* CARD 3 — Live preview (PMax-style surface switcher)      */}
          {/* Three real surfaces where Shopping product ads render:   */}
          {/*   1. Google Shopping tab (grid)                          */}
          {/*   2. Google Search PLA (above text ads)                  */}
          {/*   3. YouTube product shelf (Shorts + main feed)          */}
          {/* Maps to: ShoppingProductAdInfo across the Surfaces.      */}
          {/* ─────────────────────────────────────────────────────── */}
          <SectionCard>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Eye className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">How your ads look</Label>
                  <InfoTip text="Shopping ads render on three Google surfaces. The visual is auto-composed from your feed's image, title, price, brand, and reviews — there's no manual creative to upload." />
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Your product image, title, price, and rating <em>are</em> the ad. Optimize these in Salla to lift CTR.
                </p>
              </div>
              {/* Surface tabs — PMax pattern */}
              <div className="inline-flex shrink-0 rounded-full border border-border bg-muted/40 p-0.5 text-[10px] font-semibold">
                {([
                  { id: "shopping", label: "Shopping tab", icon: ShoppingBag },
                  { id: "search", label: "Search", icon: Search },
                  { id: "youtube", label: "YouTube", icon: Eye },
                ] as const).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPreviewSurface(tab.id)}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors",
                        previewSurface === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="size-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Surface frame */}
            <div className="rounded-xl border border-border bg-white p-4">
              {previewSurface === "shopping" && (
                <>
                  <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                    <div className="flex size-5 items-center justify-center rounded bg-[#4285F4] text-[10px] font-bold text-white">G</div>
                    <span className="text-[11px] font-semibold text-foreground">google.com / shopping</span>
                    <Badge className="ml-auto rounded-full bg-amber-100 px-1.5 py-0 text-[9px] font-bold text-amber-800 hover:bg-amber-100">
                      Sponsored
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {MOCK_PRODUCTS.slice(0, 3).map((p) => (
                      <div key={p.id} className="overflow-hidden rounded-lg border border-border bg-background">
                        <div className="flex aspect-square items-center justify-center bg-muted">
                          <Package className="size-10 text-muted-foreground/30" />
                        </div>
                        <div className="p-2">
                          <p className="truncate text-xs font-bold text-foreground">{p.price}</p>
                          <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-muted-foreground">{p.name}</p>
                          <p className="mt-1 truncate text-[9px] text-muted-foreground">{p.brand}</p>
                          <div className="mt-1 flex items-center gap-1">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className={cn("size-2", s <= 4 ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                            ))}
                            <span className="text-[8px] text-muted-foreground">(128)</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {previewSurface === "search" && (
                <>
                  <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                    <div className="flex size-5 items-center justify-center rounded bg-[#4285F4] text-[10px] font-bold text-white">G</div>
                    <span className="text-[11px] font-semibold text-foreground">google.com / search</span>
                  </div>
                  {/* Horizontal PLA shelf above text results */}
                  <div className="mb-3 rounded-lg bg-muted/30 p-2.5">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="rounded-full bg-amber-100 px-1.5 py-0 text-[9px] font-bold text-amber-800 hover:bg-amber-100">
                        Sponsored
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">Products related to your search</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                      {MOCK_PRODUCTS.slice(0, 4).map((p) => (
                        <div key={p.id} className="w-28 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                          <div className="flex aspect-square items-center justify-center bg-muted">
                            <Package className="size-8 text-muted-foreground/30" />
                          </div>
                          <div className="p-1.5">
                            <p className="truncate text-[10px] font-bold text-foreground">{p.price}</p>
                            <p className="line-clamp-2 text-[9px] leading-tight text-muted-foreground">{p.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] italic text-muted-foreground">
                    Below the PLA shelf: organic Search results (not shown).
                  </p>
                </>
              )}

              {previewSurface === "youtube" && (
                <>
                  <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                    <div className="flex size-5 items-center justify-center rounded bg-red-600 text-[10px] font-bold text-white">▶</div>
                    <span className="text-[11px] font-semibold text-foreground">youtube.com — product shelf in Shorts</span>
                  </div>
                  <div className="mx-auto flex aspect-[9/16] max-w-[200px] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-b from-black/50 to-black p-3 text-white">
                    {MOCK_PRODUCTS.slice(0, 1).map((p) => (
                      <div key={p.id} className="flex items-center gap-2 rounded-xl bg-white/95 p-2 text-foreground">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded bg-muted">
                          <Package className="size-4 text-muted-foreground/40" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-bold">{p.price}</p>
                          <p className="line-clamp-1 text-[9px] text-muted-foreground">{p.name}</p>
                        </div>
                        <Button size="sm" className="h-6 rounded-full px-2 text-[9px]">Shop</Button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] italic text-muted-foreground">
                    Product shelves appear under qualifying Shorts and standard video ads.
                  </p>
                </>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ──────────────────────────────────────────────────────── */}
        {/* RIGHT SIDEBAR — 2 cards only.                             */}
        {/*   - Readiness checklist (mirrors PMax)                    */}
        {/*   - Salla tips                                            */}
        {/* Dropped: Feed Health (merged into Card 1), Group Summary  */}
        {/* (redundant), API Mapping (raw object names — user-facing  */}
        {/* jargon that didn't help merchants).                       */}
        {/* ──────────────────────────────────────────────────────── */}
        <div className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-20 flex flex-col gap-4">

            {/* Readiness — PMax-style progress */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-foreground">Ready to launch</p>
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px] font-bold">
                  {readinessPassed}/{readiness.length}
                </Badge>
              </div>
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    readinessPassed === readiness.length ? "bg-emerald-500" : "bg-primary"
                  )}
                  style={{ width: `${(readinessPassed / readiness.length) * 100}%` }}
                />
              </div>
              <ul className="flex flex-col gap-2">
                {readiness.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] leading-snug">
                    {r.ok ? (
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <div className="mt-1 size-2.5 shrink-0 rounded-full border-2 border-muted-foreground/40" />
                    )}
                    <span className={cn(r.ok ? "text-muted-foreground" : "font-medium text-foreground")}>
                      {r.label}
                      {!r.ok && r.hint && (
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">{r.hint}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>

            {/* Salla tips — kept, slightly trimmed */}
            <SectionCard className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="size-3.5 text-primary" />
                <p className="text-xs font-bold text-foreground">Salla tips</p>
              </div>
              <ul className="flex flex-col gap-2 text-[11px] leading-relaxed text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong className="text-foreground">Image quality matters more than copy</strong> — high-res lifestyle shots lift CTR more than any caption.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong className="text-foreground">Brand subdivisions</strong> give the cleanest bid control if you stock multiple brands.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong className="text-foreground">Exclude low-margin SKUs</strong> with a custom label so ROAS climbs without touching bids.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Fix disapproved items in Merchant Center — every one is lost reach.</span>
                </li>
              </ul>
            </SectionCard>
          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Next"
        nextDisabled={readinessPassed < readiness.length}
      />
    </TooltipProvider>
  );
}


/* ================================================================== */
/*  Main Component                                                    */
/* ================================================================== */

export function GoogleStepCreative() {
  const { campaign, setStep, updateNested } = useGoogleCampaign();
  const budget = campaign.budget;
  const creative = campaign.creative;
  const objConfig = OBJECTIVE_CONFIGS[campaign.objective.objective] ?? OBJECTIVE_CONFIGS.PERFORMANCE_MAX;
  const isPMax = campaign.objective.objective === "PERFORMANCE_MAX";
  const isRetailPMax = isPMax && campaign.objective.feedEnabled;
  const isShopping = campaign.objective.objective === "SHOPPING";
  const isDemandGen = campaign.objective.objective === "DEMAND_GEN";

  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  type PreviewChannel = "search" | "display" | "youtube" | "discover" | "gmail" | "shopping";
  const [previewChannel, setPreviewChannel] = useState<PreviewChannel>("search");
  const [previewAssetIndex, setPreviewAssetIndex] = useState<Record<PreviewChannel, number>>({
    search: 0,
    display: 0,
    youtube: 0,
    discover: 0,
    gmail: 0,
    shopping: 0,
  });
  const [showYoutubeConnect, setShowYoutubeConnect] = useState(false);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const [youtubeUrlDraft, setYoutubeUrlDraft] = useState("");
  const [videoInputMode, setVideoInputMode] = useState<"upload" | "url">("upload");
  const [linkType, setLinkType] = useState<"store" | "product" | "category" | "custom">("store");
  const [storeInfo, setStoreInfo] = useState<SallaStoreInfo | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<SallaProduct | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [showUrlAdvanced, setShowUrlAdvanced] = useState(false);
  const [listingCategorySearch, setListingCategorySearch] = useState("");
  const [listingValueDraft, setListingValueDraft] = useState("");
  const [videoValidationError, setVideoValidationError] = useState<string | null>(null);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [themeInput, setThemeInput] = useState("");
  const [showGoogleAi, setShowGoogleAi] = useState(false);
  const [termInput, setTermInput] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const isSearch = campaign.objective.objective === "SEARCH";
  const isDisplay = campaign.objective.objective === "DISPLAY";
  const isApp = campaign.objective.objective === "APP";
  const retailListingMode: RetailListingMode = creative.retailListingMode ?? "ALL";
  const retailListingValues = creative.retailListingValues ?? [];

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

  /* Ensure PMax has at least one asset group (supports 1-100) */
  useEffect(() => {
    if (creative.assetGroups.length === 0) {
      updateNested("creative", { assetGroups: [newAssetGroup()] });
    }
  }, [creative.assetGroups, updateNested]);

  /* Keep a single active PMax group */
  const assetGroups = creative.assetGroups.length > 0 ? creative.assetGroups : [newAssetGroup()];
  const currentGroup = assetGroups[activeGroupIdx] ?? assetGroups[0];
  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((cat) => cat.toLowerCase().includes(query));
  }, [categories, categorySearch]);

  const filteredListingCategories = useMemo(() => {
    const query = listingCategorySearch.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((cat) => cat.toLowerCase().includes(query));
  }, [categories, listingCategorySearch]);

  const listingGroupTree = useMemo(
    () => buildRetailListingTree(retailListingMode, retailListingValues),
    [retailListingMode, retailListingValues]
  );

  useEffect(() => {
    getStoreInfo().then(setStoreInfo).catch(() => {});
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (showCategoryPicker) setCategorySearch("");
  }, [showCategoryPicker]);

  useEffect(() => {
    if (!isRetailPMax) return;
    const current = creative.productGroupRoot;
    if (!listingGroupTree) {
      if (current) updateNested("creative", { productGroupRoot: null });
      return;
    }
    if (JSON.stringify(current) === JSON.stringify(listingGroupTree)) return;
    updateNested("creative", { productGroupRoot: listingGroupTree });
  }, [isRetailPMax, listingGroupTree, creative.productGroupRoot, updateNested]);

  /* Update a single group in the array */
  const updateGroup = useCallback((groupId: string, partial: Partial<GoogleAssetGroup>) => {
    const groups = assetGroups.map((g) =>
      g.id === groupId ? { ...g, ...partial } : g
    );
    updateNested("creative", { assetGroups: groups });
  }, [assetGroups, updateNested]);

  const setRetailListingMode = useCallback((mode: RetailListingMode) => {
    updateNested("creative", {
      retailListingMode: mode,
      retailListingValues: mode === retailListingMode ? retailListingValues : [],
    });
    setListingValueDraft("");
  }, [retailListingMode, retailListingValues, updateNested]);

  const toggleRetailListingValue = useCallback((value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    const exists = retailListingValues.includes(normalized);
    const next = exists
      ? retailListingValues.filter((v) => v !== normalized)
      : [...retailListingValues, normalized];
    updateNested("creative", { retailListingValues: next });
  }, [retailListingValues, updateNested]);

  const addRetailListingValues = useCallback((raw: string) => {
    const entries = raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (entries.length === 0) return;
    const merged = [...retailListingValues];
    entries.forEach((entry) => {
      if (!merged.includes(entry)) merged.push(entry);
    });
    updateNested("creative", { retailListingValues: merged });
  }, [retailListingValues, updateNested]);

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

  const addImageUpload = (imageType: "LANDSCAPE" | "SQUARE" | "PORTRAIT", file: File) => {
    const asset: GoogleCreativeAsset = {
      id: makeId(),
      type: "IMAGE",
      file,
      url: "",
      pmaxImageType: imageType,
    };
    updateGroup(currentGroup.id, { images: [...currentGroup.images, asset] });
  };

  const addLogoUpload = (logoType: "SQUARE" | "LANDSCAPE", file: File) => {
    setLogoUploadError(null);
    const logoLimit = logoType === "LANDSCAPE" ? ASSET_LIMITS.landscapeLogos.max : ASSET_LIMITS.logos.max;
    const logoCount = currentGroup.logos.filter((logo) => (logo.pmaxImageType ?? "SQUARE") === logoType).length;
    if (logoCount >= logoLimit) {
      setLogoUploadError(`You can add up to ${logoLimit} ${logoType.toLowerCase()} logo${logoLimit !== 1 ? "s" : ""}.`);
      return;
    }
    const asset: GoogleCreativeAsset = {
      id: makeId(),
      type: "LOGO",
      file,
      url: "",
      pmaxImageType: logoType,
    };
    updateGroup(currentGroup.id, { logos: [...currentGroup.logos, asset] });
  };

  /* Remove image */
  const removeImageAsset = (field: "images" | "logos", assetId: string) => {
    updateGroup(currentGroup.id, { [field]: currentGroup[field].filter((a) => a.id !== assetId) });
  };

  const updateVideoAsset = (assetId: string, url: string) => {
    const idMatch = url.match(/(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
    const vId = idMatch ? idMatch[1] : url.trim();
    const list = currentGroup.videos.map((v) =>
      v.id === assetId ? { ...v, url, youtubeVideoId: vId } : v
    );
    updateGroup(currentGroup.id, { videos: list });
  };

  const addVideoUpload = async (file: File) => {
    setVideoValidationError(null);
    if (currentGroup.videos.length >= ASSET_LIMITS.videos.max) {
      setVideoValidationError(`You can add up to ${ASSET_LIMITS.videos.max} videos.`);
      return;
    }
    try {
      const meta = await readVideoMetadata(file);
      if (!Number.isFinite(meta.duration) || meta.duration < VIDEO_REQUIREMENTS.minDurationSec) {
        setVideoValidationError(`Video must be at least ${VIDEO_REQUIREMENTS.minDurationSec} seconds.`);
        return;
      }
      if (!isAllowedVideoRatio(meta.width, meta.height)) {
        setVideoValidationError("Video must be 16:9, 1:1, or 9:16.");
        return;
      }
    } catch {
      setVideoValidationError("We couldn't read this video's details. Try another file.");
      return;
    }
    const asset: GoogleCreativeAsset = { id: makeId(), type: "YOUTUBE_VIDEO", file, url: "" };
    updateGroup(currentGroup.id, { videos: [...currentGroup.videos, asset] });
  };

  const addVideoUrl = () => {
    if (currentGroup.videos.length >= ASSET_LIMITS.videos.max) {
      setVideoValidationError(`You can add up to ${ASSET_LIMITS.videos.max} videos.`);
      return;
    }
    const url = youtubeUrlDraft.trim();
    if (!url) return;
    setVideoValidationError(null);
    const idMatch = url.match(/(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
    const vId = idMatch ? idMatch[1] : url;
    const asset: GoogleCreativeAsset = { id: makeId(), type: "YOUTUBE_VIDEO", url, youtubeVideoId: vId };
    updateGroup(currentGroup.id, { videos: [...currentGroup.videos, asset] });
    setYoutubeUrlDraft("");
  };

  const removeVideoAsset = (assetId: string) => {
    updateGroup(currentGroup.id, { videos: currentGroup.videos.filter((v) => v.id !== assetId) });
  };

  const getDisplayPathSuggestions = (url: string) => {
    try {
      const { pathname } = new URL(url);
      const parts = pathname
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) =>
          part
            .replace(/[-_]/g, " ")
            .replace(/\s+/g, "-")
            .slice(0, 15)
        );
      return {
        path1: parts[0] ?? "",
        path2: parts[1] ?? "",
      };
    } catch {
      return { path1: "", path2: "" };
    }
  };

  const ensureHttps = (value: string) => {
    if (!value) return "";
    return value.startsWith("http") ? value : `https://${value}`;
  };

  const getStoreOrigin = () => {
    if (storeInfo?.domain) return ensureHttps(storeInfo.domain);
    try {
      return new URL(currentGroup.finalUrl).origin;
    } catch {
      return "";
    }
  };

  const formatCategoryPath = (value: string) =>
    encodeURIComponent(value.trim().toLowerCase().replace(/\s+/g, "-"));

  const applyFinalUrl = (url: string) => {
    if (!url) return;
    updateGroup(currentGroup.id, { finalUrl: url });
    if (!currentGroup.displayPath1 && !currentGroup.displayPath2) {
      const suggestion = getDisplayPathSuggestions(url);
      if (suggestion.path1 || suggestion.path2) {
        updateGroup(currentGroup.id, {
          displayPath1: suggestion.path1,
          displayPath2: suggestion.path2,
        });
      }
    }
  };

  useEffect(() => {
    if (linkType !== "store") return;
    if (currentGroup.finalUrl.trim()) return;
    const origin = getStoreOrigin();
    if (origin) applyFinalUrl(origin);
  }, [linkType, currentGroup.finalUrl, storeInfo?.domain]);




  /* Ad strength */
  const adStrength = calcAdStrength(currentGroup);

  /* Validation */
  const filledHeadlines = currentGroup.headlines.filter((h) => h.text?.trim()).length;
  const filledLongHeadlines = currentGroup.longHeadlines.filter((h) => h.text?.trim()).length;
  const filledDescriptions = currentGroup.descriptions.filter((d) => d.text?.trim()).length;
  const pmaxLandscapeCount = currentGroup.images.filter(
    (img) => (img.pmaxImageType ?? "PORTRAIT") === "LANDSCAPE"
  ).length;
  const pmaxSquareCount = currentGroup.images.filter(
    (img) => (img.pmaxImageType ?? "PORTRAIT") === "SQUARE"
  ).length;
  const pmaxPortraitCount = currentGroup.images.filter(
    (img) => (img.pmaxImageType ?? "PORTRAIT") === "PORTRAIT"
  ).length;
  const logoSquareCount = currentGroup.logos.filter(
    (logo) => (logo.pmaxImageType ?? "SQUARE") === "SQUARE"
  ).length;
  const logoLandscapeCount = currentGroup.logos.filter(
    (logo) => (logo.pmaxImageType ?? "SQUARE") === "LANDSCAPE"
  ).length;
  const minRequiredImages = isRetailPMax ? 0 : 2;
  const minRequiredLogos = isRetailPMax ? 0 : (budget.brandGuidelinesEnabled ? 0 : 1);
  const requireBusinessName = !isRetailPMax && !budget.brandGuidelinesEnabled;
  const hasValidFinalUrl = (url: string) => /^https?:\/\/\S+\.\S+/i.test(url.trim());
  const imageRequirementsMet = pmaxLandscapeCount >= 1 && pmaxSquareCount >= 1;
  const logoRequirementMet = minRequiredLogos === 0 ? true : logoSquareCount >= 1;
  // Grid layout — filtered arrays for inline display
  const landscapeImages = currentGroup.images.filter((img) => (img.pmaxImageType ?? "PORTRAIT") === "LANDSCAPE");
  const squareImages = currentGroup.images.filter((img) => (img.pmaxImageType ?? "PORTRAIT") === "SQUARE");
  const portraitImages = currentGroup.images.filter((img) => (img.pmaxImageType ?? "PORTRAIT") === "PORTRAIT");
  const squareLogos = currentGroup.logos.filter((l) => (l.pmaxImageType ?? "SQUARE") === "SQUARE");
  const retailAssetsLinked = isRetailPMax && (currentGroup.images.length + currentGroup.logos.length + currentGroup.videos.length > 0);
  const listingValuesMissing = isRetailPMax && retailListingMode !== "ALL" && retailListingValues.length === 0;
  const listingValueLabel =
    retailListingMode === "CATEGORY"
      ? "category"
      : retailListingMode === "BRAND"
        ? "brand"
        : "custom label";
  const hasListingGroup = !isRetailPMax || !!listingGroupTree;

  const blockers = [
    ...(isRetailPMax
      ? [{ label: "Listing groups configured", ok: hasListingGroup, step: "Catalog" }]
      : []),
    { label: `Add at least ${isRetailPMax ? 1 : 3} headlines`, ok: filledHeadlines >= (isRetailPMax ? 1 : 3), step: "Text assets" },
    { label: "Add at least 1 long headline", ok: filledLongHeadlines >= 1, step: "Text assets" },
    { label: `Add at least ${isRetailPMax ? 1 : 2} descriptions`, ok: filledDescriptions >= (isRetailPMax ? 1 : 2), step: "Text assets" },
    ...(!isRetailPMax ? [
      { label: "Add at least 1 landscape image", ok: pmaxLandscapeCount >= 1, step: "Media assets" },
      { label: "Add at least 1 square image", ok: pmaxSquareCount >= 1, step: "Media assets" },
      {
        label: budget.brandGuidelinesEnabled ? "Brand guidelines enabled (business name optional here)" : "Add at least 1 logo",
        ok: currentGroup.logos.length >= minRequiredLogos,
        step: "Media assets",
      },
    ] : []),
    { label: "Business name is required", ok: requireBusinessName ? currentGroup.businessName.trim().length > 0 : true, step: "Basics" },
    { label: "Final URL must be valid (https://...)", ok: hasValidFinalUrl(currentGroup.finalUrl), step: "Basics" },
  ];

  const previewTabs: { key: PreviewChannel; label: string; icon: ElementType; color: string }[] = [
    { key: "search", label: "Search", icon: Search, color: "text-blue-600" },
    { key: "display", label: "Display", icon: Monitor, color: "text-emerald-600" },
    { key: "youtube", label: "YouTube", icon: Youtube, color: "text-red-600" },
    { key: "discover", label: "Discover", icon: Sparkles, color: "text-amber-500" },
    { key: "gmail", label: "Gmail", icon: Mail, color: "text-pink-500" },
    ...(isRetailPMax ? [{ key: "shopping", label: "Shopping", icon: ShoppingCart, color: "text-slate-600" } as const] : []),
  ];
  const activePreviewLabel = previewTabs.find((tab) => tab.key === previewChannel)?.label ?? "Search";
  const previewIndex = Math.max(0, previewTabs.findIndex((tab) => tab.key === previewChannel));
  const previewLockItems = isRetailPMax
    ? [
        ...(campaign.objective.merchantCenterConnected ? [] : ["Connect Merchant Center feed"]),
        "1 shopping product",
      ]
    : [];
  const previewLocked = previewLockItems.length > 0;
  const goToPreview = (delta: number) => {
    const nextIdx = (previewIndex + delta + previewTabs.length) % previewTabs.length;
    setPreviewChannel(previewTabs[nextIdx].key);
  };
  useEffect(() => {
    if (!isRetailPMax && previewChannel === "shopping") {
      setPreviewChannel("search");
    }
  }, [isRetailPMax, previewChannel]);
  const requiredTotal = blockers.length;
  const requiredDone = blockers.filter((b) => b.ok).length;
  const requiredRemaining = Math.max(0, requiredTotal - requiredDone);
  const readinessPercent = requiredTotal > 0 ? Math.round((requiredDone / requiredTotal) * 100) : 0;
  const readinessStatus = requiredRemaining === 0 ? "Ready" : "Incomplete";
  const youtubeUploadDestination = creative.youtubeUploadDestination ?? "GOOGLE_MANAGED";
  const youtubeChannelId = creative.youtubeChannelId ?? "";
  const youtubeChannelName = creative.youtubeChannelName ?? "";
  const youtubeChannelConnected = youtubeUploadDestination === "BRAND" && youtubeChannelId.trim().length > 0;
  const uploadedVideoCount = currentGroup.videos.filter((v) => !!v.file).length;
  const linkedVideoCount = currentGroup.videos.filter((v) => !v.file && !!v.url?.trim()).length;
  const totalVideoCount = uploadedVideoCount + linkedVideoCount;
  const uniqueHeadlineCount = new Set(
    currentGroup.headlines.map((h) => h.text?.trim().toLowerCase()).filter(Boolean)
  ).size;

  const previewUrls = useMemo(() => {
    const map = new Map<string, string>();
    [...currentGroup.images, ...currentGroup.logos, ...currentGroup.videos].forEach((asset) => {
      if (asset.url) {
        map.set(asset.id, asset.url);
        return;
      }
      if (asset.file instanceof Blob) {
        map.set(asset.id, URL.createObjectURL(asset.file));
      }
    });
    return map;
  }, [currentGroup.images, currentGroup.logos, currentGroup.videos]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const getPreviewUrl = useCallback((asset?: GoogleCreativeAsset) => {
    if (!asset) return undefined;
    return previewUrls.get(asset.id);
  }, [previewUrls]);

  const formatBytes = useCallback((bytes?: number) => {
    if (!bytes || Number.isNaN(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, []);

  const headlineTexts = currentGroup.headlines.map((h) => h.text?.trim()).filter(Boolean) as string[];
  const descriptionTexts = currentGroup.descriptions.map((d) => d.text?.trim()).filter(Boolean) as string[];
  const longHeadlineTexts = currentGroup.longHeadlines.map((h) => h.text?.trim()).filter(Boolean) as string[];
  const displayImages = squareImages.length > 0 ? squareImages : currentGroup.images;
  const discoverImages = landscapeImages.length > 0 ? landscapeImages : currentGroup.images;
  const gmailImages = landscapeImages.length > 0 ? landscapeImages : currentGroup.images;
  const youtubeVideos = currentGroup.videos;
  const youtubeFallbackImages = landscapeImages.length > 0 ? landscapeImages : currentGroup.images;
  const logoSquares = currentGroup.logos.filter((logo) => (logo.pmaxImageType ?? "SQUARE") === "SQUARE");
  const logoLandscapes = currentGroup.logos.filter((logo) => (logo.pmaxImageType ?? "SQUARE") === "LANDSCAPE");
  const displayLogo = logoSquares[0] ?? currentGroup.logos[0];
  const discoverLogo = logoLandscapes[0] ?? currentGroup.logos[0];
  const minHeadlines = isRetailPMax ? 1 : ASSET_LIMITS.headlines.min;
  const minDescriptions = isRetailPMax ? 1 : ASSET_LIMITS.descriptions.min;
  const textChecks = [
    { label: "Headlines", ok: filledHeadlines >= minHeadlines, required: true },
    { label: "Long headline", ok: filledLongHeadlines >= 1, required: true },
    { label: "Descriptions", ok: filledDescriptions >= minDescriptions, required: true },
  ];
  const textStatusText =
    filledHeadlines + filledLongHeadlines + filledDescriptions === 0
      ? "No text yet"
      : `${filledHeadlines} headlines · ${filledLongHeadlines} long · ${filledDescriptions} descriptions`;
  const businessNameSet = currentGroup.businessName.trim().length > 0;
  const finalUrlValid = hasValidFinalUrl(currentGroup.finalUrl);
  const ctaSet = !!currentGroup.callToAction;
  const basicsChecks = [
    { label: "Business name", ok: requireBusinessName ? businessNameSet : true, required: requireBusinessName },
    { label: "Landing page", ok: finalUrlValid, required: true },
    { label: "CTA", ok: ctaSet, required: false },
  ];
  const basicsStatusText = [
    requireBusinessName ? (businessNameSet ? "Business name set" : "Business name missing") : "Business name optional",
    finalUrlValid ? "Landing page set" : "Landing page missing",
    ctaSet ? "CTA set" : "CTA missing",
  ].join(" · ");
  const listingStatusText =
    retailListingMode === "ALL"
      ? "All products"
      : retailListingValues.length > 0
        ? `${retailListingValues.length} ${listingValueLabel}${retailListingValues.length > 1 ? "s" : ""}`
        : `No ${listingValueLabel} selected`;
  const listingChecks = [{ label: "Listing groups", ok: hasListingGroup, required: true }];

  const getPreviewIndex = useCallback(
    (key: PreviewChannel, total: number) => (total > 0 ? previewAssetIndex[key] % total : 0),
    [previewAssetIndex]
  );
  const stepPreviewIndex = useCallback(
    (key: PreviewChannel, delta: number, total: number) => {
      if (total <= 0) return;
      setPreviewAssetIndex((prev) => ({
        ...prev,
        [key]: (prev[key] + delta + total) % total,
      }));
    },
    []
  );

  const renderPreviewControls = (key: PreviewChannel, total: number, label: string) => {
    if (total <= 1) return null;
    const idx = getPreviewIndex(key, total);
    return (
      <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground">
        <button
          type="button"
          onClick={() => stepPreviewIndex(key, -1, total)}
          className="flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[9px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Prev
        </button>
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          <span className="font-medium text-foreground">{idx + 1}/{total}</span>
        </div>
        <button
          type="button"
          onClick={() => stepPreviewIndex(key, 1, total)}
          className="flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[9px] text-muted-foreground hover:text-foreground"
        >
          Next
          <ArrowRight className="size-3" />
        </button>
      </div>
    );
  };

  const searchComboCount = Math.max(headlineTexts.length, descriptionTexts.length, 1);
  const searchComboIndex = getPreviewIndex("search", searchComboCount);
  const searchHeadline = headlineTexts[searchComboIndex] ?? "Your Headline Here";
  const searchHeadline2 = headlineTexts.length > 1 ? headlineTexts[(searchComboIndex + 1) % headlineTexts.length] : "Second Headline";
  const searchDescription = descriptionTexts[searchComboIndex] ?? "Your description will appear here.";
  const searchDescription2 = descriptionTexts.length > 1 ? descriptionTexts[(searchComboIndex + 1) % descriptionTexts.length] : "";
  const previewDomain = (() => {
    if (!currentGroup.finalUrl) return "your-store.salla.sa";
    try {
      const input = currentGroup.finalUrl.startsWith("http") ? currentGroup.finalUrl : `https://${currentGroup.finalUrl}`;
      return new URL(input).hostname;
    } catch {
      return currentGroup.finalUrl;
    }
  })();
  const bestPracticeItems = isRetailPMax
    ? [
        {
          title: "Product feed healthy",
          desc: "Approved items with accurate titles, pricing, and availability.",
          done: campaign.objective.merchantCenterConnected,
        },
        {
          title: "Add core text assets",
          desc: "At least 3 headlines and 2 descriptions for broader coverage.",
          done: filledHeadlines >= 3 && filledDescriptions >= 2,
        },
        {
          title: "Add logo + one image",
          desc: "Unlock more placements across Display and Discover.",
          done: currentGroup.logos.length > 0 && currentGroup.images.length > 0,
        },
        {
          title: "Video creative included",
          desc: "Boosts YouTube delivery and reach.",
          done: totalVideoCount > 0,
        },
      ]
    : [
        {
          title: "Use all 15 headline slots",
          desc: "More combinations improve optimization.",
          done: filledHeadlines >= ASSET_LIMITS.headlines.max,
        },
        {
          title: "Include diverse headlines",
          desc: "Mix features, benefits, and promotions.",
          done: uniqueHeadlineCount >= 5,
        },
        {
          title: "Add all 3 image ratios",
          desc: "Landscape, square, and portrait for maximum reach.",
          done: pmaxLandscapeCount >= 1 && pmaxSquareCount >= 1 && pmaxPortraitCount >= 1,
        },
        {
          title: "Video creative included",
          desc: "Boosts YouTube performance significantly.",
          done: totalVideoCount > 0,
        },
        {
          title: "Aim for Excellent ad strength",
          desc: "Target 80%+ readiness score.",
          done: adStrength.score >= 80,
        },
      ];
  const bestPracticeDone = bestPracticeItems.filter((item) => item.done).length;
  const bestPracticeTotal = bestPracticeItems.length;

  const canProceed = assetGroups.every((g) => {
    const h = g.headlines.filter((x) => x.text?.trim()).length >= (isRetailPMax ? 1 : 3);
    const lh = g.longHeadlines.filter((x) => x.text?.trim()).length >= 1;
    const d = g.descriptions.filter((x) => x.text?.trim()).length >= (isRetailPMax ? 1 : 2);
    const landscape = g.images.filter((img) => (img.pmaxImageType ?? "PORTRAIT") === "LANDSCAPE").length >= 1;
    const square = g.images.filter((img) => (img.pmaxImageType ?? "PORTRAIT") === "SQUARE").length >= 1;
    const imgs = isRetailPMax ? true : (landscape && square);
    const logos = g.logos.length >= minRequiredLogos;
    const bn = requireBusinessName ? g.businessName.trim().length > 0 : true;
    const url = hasValidFinalUrl(g.finalUrl);
    return h && lh && d && imgs && logos && bn && url && hasListingGroup;
  });

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ============================================================ */}
        {/*  MAIN CONTENT                                                */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">

              {isRetailPMax && (
                <SectionCard className="border-primary/20 bg-primary/[0.03] p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <ShoppingBag className="size-4 text-primary" />
                    <Label className="text-sm font-semibold text-foreground">Retail PMax mode (Catalog ON)</Label>
                    <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">Feed-driven</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Product feed powers core ad delivery. In this mode, media assets are optional enhancements and text requirements are lighter.
                  </p>
                </SectionCard>
              )}

              {/* ── Section: Product Listing Groups (Retail) ── */}
              {isRetailPMax && (
                <SectionCard>
                  <div className="flex flex-wrap items-start gap-3">
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Product listing groups</Label>
                      <p className="text-xs text-muted-foreground">
                        Required for Retail PMax. Choose how to split your catalog for serving.
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-auto rounded-full px-2 py-0 text-[10px]">Required</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <span className="text-xs font-semibold text-foreground">Listing status</span>
                    <span className="text-[10px] text-muted-foreground">{listingStatusText}</span>
                    <div
                      className="ml-auto flex items-center gap-1"
                      title={listingChecks.map((c) => `${c.ok ? "✓" : "○"} ${c.label}`).join(", ")}
                    >
                      {listingChecks.map((check) => (
                        <div
                          key={check.label}
                          className={cn(
                            "size-1.5 rounded-full",
                            check.ok
                              ? "bg-emerald-400"
                              : check.required
                                ? "bg-amber-400"
                                : "bg-muted-foreground/25"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {([
                      { key: "ALL" as const, label: "All products" },
                      { key: "CATEGORY" as const, label: "Category" },
                      { key: "BRAND" as const, label: "Brand" },
                      { key: "CUSTOM_LABEL" as const, label: "Custom label" },
                    ]).map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setRetailListingMode(option.key)}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-all",
                          retailListingMode === option.key
                            ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956] shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-[#a4ffe5]/50"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {retailListingMode === "ALL" ? (
                    <div className="mt-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                      All products in your Merchant Center feed are eligible to serve.
                    </div>
                  ) : retailListingMode === "CATEGORY" ? (
                    <div className="mt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          placeholder="Search categories"
                          value={listingCategorySearch}
                          onChange={(e) => setListingCategorySearch(e.target.value)}
                          className="h-10 w-full text-sm sm:w-64"
                        />
                        {retailListingValues.length > 0 && (
                          <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                            {retailListingValues.length} selected
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {filteredListingCategories.map((cat) => {
                          const active = retailListingValues.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => toggleRetailListingValue(cat)}
                              className={cn(
                                "rounded-full border px-3 py-1 text-[10px] font-medium transition-colors",
                                active
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {cat}
                            </button>
                          );
                        })}
                        {filteredListingCategories.length === 0 && (
                          <span className="text-[11px] text-muted-foreground">No categories found.</span>
                        )}
                      </div>
                      {listingValuesMissing && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-destructive">
                          <AlertTriangle className="size-3.5" />
                          <span>Select at least one category to continue.</span>
                        </div>
                      )}
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        All other products stay eligible to keep coverage broad.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          placeholder={retailListingMode === "BRAND" ? "Add brand names (comma separated)" : "Add custom labels (comma separated)"}
                          value={listingValueDraft}
                          onChange={(e) => setListingValueDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addRetailListingValues(listingValueDraft);
                              setListingValueDraft("");
                            }
                          }}
                          className="h-10 w-full text-sm sm:w-72"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-10 text-sm"
                          onClick={() => {
                            addRetailListingValues(listingValueDraft);
                            setListingValueDraft("");
                          }}
                          disabled={!listingValueDraft.trim()}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {retailListingValues.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleRetailListingValue(value)}
                            className="group flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary"
                          >
                            <span>{value}</span>
                            <X className="size-3 text-primary/70 group-hover:text-destructive" />
                          </button>
                        ))}
                        {retailListingValues.length === 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            No values added yet.
                          </span>
                        )}
                      </div>
                      {listingValuesMissing && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-destructive">
                          <AlertTriangle className="size-3.5" />
                          <span>Select at least one {listingValueLabel} to continue.</span>
                        </div>
                      )}
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        All other products stay eligible to keep coverage broad.
                      </p>
                    </div>
                  )}
                </SectionCard>
              )}

              {/* ---- Group Name & Final URL ---- */}
              <SectionCard className="rounded-xl">
                <button type="button" onClick={() => toggleSection("basics")}
                  className="flex w-full items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-primary" />
                    <Label className="text-sm font-bold text-foreground">Group Name & URL</Label>
                    <div className="flex items-center gap-1 ml-1">
                      {basicsChecks.map((check) => (
                        <div key={check.label} className={cn("size-1.5 rounded-full", check.ok ? "bg-emerald-400" : check.required ? "bg-amber-400" : "bg-muted-foreground/25")} />
                      ))}
                    </div>
                  </div>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", !collapsedSections.basics && "rotate-180")} />
                </button>

                {!collapsedSections.basics && (
                <div className="mt-4 space-y-4">
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      Business Name {requireBusinessName && <span className="text-destructive">*</span>}
                      <InfoTip text="Up to 25 characters. Required when brand guidelines are disabled. When enabled, this is used as a campaign-level brand asset." />
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Your store name"
                        maxLength={25}
                        value={currentGroup.businessName}
                        onChange={(e) => updateGroup(currentGroup.id, { businessName: e.target.value.slice(0, 25) })}
                        className="h-10 pr-14 text-sm"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">{currentGroup.businessName.length}/25</span>
                    </div>
                  </div>

                <div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link2 className="size-3.5 text-primary" />
                      <Label className="text-sm font-medium text-foreground">Target link type</Label>
                      <InfoTip text="Choose what the ad should link to. We auto-fill the landing page based on your selection." />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {([
                        { key: "store" as const, label: "Store" },
                        { key: "product" as const, label: "Product" },
                        { key: "category" as const, label: "Category" },
                        { key: "custom" as const, label: "Custom" },
                      ]).map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => {
                            setLinkType(option.key);
                            if (option.key !== "product") setSelectedProduct(null);
                            if (option.key !== "category") setSelectedCategory("");
                            if (option.key === "store") {
                              const origin = getStoreOrigin();
                              if (origin) applyFinalUrl(origin);
                            }
                            if (option.key === "product") {
                              if (selectedProduct?.url) {
                                applyFinalUrl(selectedProduct.url);
                              } else {
                                setShowProductPicker(true);
                              }
                            }
                            if (option.key === "category") {
                              if (selectedCategory) {
                                const origin = getStoreOrigin();
                                if (origin) applyFinalUrl(`${origin}/category/${formatCategoryPath(selectedCategory)}`);
                              } else {
                                setShowCategoryPicker(true);
                              }
                            }
                          }}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-all",
                            linkType === option.key
                              ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956] shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-[#a4ffe5]/50"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 text-[10px] text-muted-foreground">
                      {linkType === "store" && (
                        <span>{storeInfo?.domain ? `Store homepage: ${storeInfo.domain}` : "Store homepage will be used."}</span>
                      )}
                      {linkType === "product" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setShowProductPicker(true)}
                          >
                            {selectedProduct ? "Change product" : "Choose product"}
                          </Button>
                          {selectedProduct ? (
                            <span>
                              Selected: <span className="font-medium text-foreground">{selectedProduct.name}</span>
                            </span>
                          ) : (
                            <span>Link a specific product page.</span>
                          )}
                        </div>
                      )}
                      {linkType === "category" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setShowCategoryPicker(true)}
                          >
                            {selectedCategory ? "Change category" : "Choose category"}
                          </Button>
                          {selectedCategory ? (
                            <span>
                              Selected: <span className="font-medium text-foreground">{selectedCategory}</span>
                            </span>
                          ) : (
                            <span>Link a category collection.</span>
                          )}
                        </div>
                      )}
                      {linkType === "custom" && (
                        <span>Use any landing page URL (collection, campaign, or deep link).</span>
                      )}
                    </div>

                    {currentGroup.finalUrl && (
                      <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Link2 className="size-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Landing page</span>
                          <span className="truncate text-[10px] text-foreground">{currentGroup.finalUrl}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">UTM on</Badge>
                          {linkType !== "custom" && (
                            <button
                              type="button"
                              onClick={() => setLinkType("custom")}
                              className="text-[10px] text-primary hover:underline"
                            >
                              Edit URL
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {linkType === "custom" && (
                    <div className="mt-3">
                      <Label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                        Final URL <span className="text-destructive">*</span>
                        <InfoTip text="The landing page for this asset group. Maps to AssetGroup.final_urls." />
                      </Label>
                      <Input
                        placeholder="https://your-store.salla.sa/collection/summer"
                        value={currentGroup.finalUrl}
                        onChange={(e) => {
                          updateGroup(currentGroup.id, { finalUrl: e.target.value });
                          if (selectedProduct) setSelectedProduct(null);
                          if (selectedCategory) setSelectedCategory("");
                        }}
                        onBlur={() => {
                          if (currentGroup.displayPath1 || currentGroup.displayPath2) return;
                          const suggestion = getDisplayPathSuggestions(currentGroup.finalUrl);
                          if (!suggestion.path1 && !suggestion.path2) return;
                          updateGroup(currentGroup.id, {
                            displayPath1: suggestion.path1,
                            displayPath2: suggestion.path2,
                          });
                        }}
                        className="h-10 text-sm"
                      />
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">UTM on</Badge>
                        <span>UTM tags are added automatically to help track performance.</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr,0.6fr]">
                    <div>
                      <Label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                        Call to action
                        <InfoTip text="The text shown on your ad button. 'Shop Now' and 'Learn More' typically perform best." />
                      </Label>
                      <Select
                        value={currentGroup.callToAction}
                        onValueChange={(value) => updateGroup(currentGroup.id, { callToAction: value })}
                      >
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select a CTA" />
                        </SelectTrigger>
                        <SelectContent>
                          {CTA_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setShowUrlAdvanced((prev) => !prev)}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      {showUrlAdvanced ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      URL options (optional)
                    </button>
                    {showUrlAdvanced && (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div>
                          <Label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            Display Path 1 (Search only)
                            <InfoTip text="Optional. Appears only in Search placements as the display URL path (does not change the landing page)." />
                          </Label>
                          <Input
                            placeholder="summer"
                            maxLength={15}
                            value={currentGroup.displayPath1}
                            onChange={(e) => updateGroup(currentGroup.id, { displayPath1: e.target.value.slice(0, 15) })}
                            className="h-10 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            Display Path 2 (Search only)
                            <InfoTip text="Optional. Appears only in Search placements as the display URL path (does not change the landing page)." />
                          </Label>
                          <Input
                            placeholder="collection"
                            maxLength={15}
                            value={currentGroup.displayPath2}
                            onChange={(e) => updateGroup(currentGroup.id, { displayPath2: e.target.value.slice(0, 15) })}
                            className="h-10 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <ProductPickerDialog
                  open={showProductPicker}
                  onOpenChange={setShowProductPicker}
                  existingProductNames={[]}
                  maxProducts={1}
                  onAddProducts={(products) => {
                    const product = products[0];
                    if (!product) return;
                    setSelectedProduct(product);
                    setSelectedCategory("");
                    setLinkType("product");
                    applyFinalUrl(product.url);
                  }}
                />

                <Sheet open={showCategoryPicker} onOpenChange={setShowCategoryPicker}>
                  <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
                    <SheetHeader className="border-b border-border px-5 pb-3 pt-5">
                      <SheetTitle className="flex items-center gap-2 text-base">
                        <Store className="size-4 text-primary" />
                        Select Category
                      </SheetTitle>
                      <SheetDescription className="text-xs">
                        Choose a category to link — we’ll use it as your landing page.
                      </SheetDescription>
                    </SheetHeader>
                    {selectedCategory && (
                      <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/[0.03] px-5 py-2">
                        <span className="shrink-0 text-[11px] font-semibold text-primary">Selected</span>
                        <div className="flex flex-1 gap-1.5 overflow-x-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedCategory("")}
                            className="group flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-background py-0.5 pl-2 pr-2 transition-colors hover:border-destructive/30 hover:bg-destructive/5"
                          >
                            <span className="max-w-[140px] truncate text-[10px] font-medium text-foreground">{selectedCategory}</span>
                            <X className="size-2.5 shrink-0 text-muted-foreground group-hover:text-destructive" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCategory("")}
                          className="shrink-0 text-[10px] text-primary hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                    <div className="border-b border-border px-5 py-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search categories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="h-9 pl-9 text-xs"
                        />
                        {categorySearch && (
                          <button
                            type="button"
                            onClick={() => setCategorySearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                      {filteredCategories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <Package className="mb-2 size-6 text-muted-foreground" />
                          <p className="text-sm font-medium text-muted-foreground">No categories found</p>
                          <p className="text-xs text-muted-foreground">Try a different search term.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {filteredCategories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(category);
                                setSelectedProduct(null);
                                setLinkType("category");
                                const origin = getStoreOrigin();
                                if (origin) applyFinalUrl(`${origin}/category/${formatCategoryPath(category)}`);
                                setShowCategoryPicker(false);
                              }}
                              className={cn(
                                "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                                selectedCategory === category
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background text-foreground hover:border-primary/40"
                              )}
                            >
                              <span>{category}</span>
                              {selectedCategory === category && (
                                <Check className="size-3.5 text-primary" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-border px-5 py-3">
                      <Button variant="outline" size="sm" onClick={() => setShowCategoryPicker(false)}>
                        Cancel
                      </Button>
                      {selectedCategory && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory("");
                            setShowCategoryPicker(false);
                          }}
                        >
                          Clear selection
                        </Button>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
                </div>
                )}
              </SectionCard>

              {/* ── Section: Text Assets ── */}
              <SectionCard className="rounded-xl">
                <button type="button" onClick={() => toggleSection("text")}
                  className="flex w-full items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <Type className="size-4 text-primary" />
                    <Label className="text-sm font-bold text-foreground">Text Assets</Label>
                    <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">Required</Badge>
                    <div className="flex items-center gap-1 ml-1">
                      {textChecks.map((check) => (
                        <div key={check.label} className={cn("size-1.5 rounded-full", check.ok ? "bg-emerald-400" : check.required ? "bg-amber-400" : "bg-muted-foreground/25")} />
                      ))}
                    </div>
                  </div>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", !collapsedSections.text && "rotate-180")} />
                </button>

                {!collapsedSections.text && (
                  <div className="mt-4 space-y-5">
                    <p className="text-xs text-muted-foreground">
                      Keep your messaging short, clear, and varied. Google mixes these across placements.
                    </p>

                    {/* Consolidated Generate Bar */}
                    <div className="flex items-center gap-3 rounded-xl border border-[#a4ffe5]/40 bg-[#e6fff9]/30 px-4 py-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-[#e6fff9]">
                        <Sparkles className="size-4 text-[#004956]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-foreground">Auto-generate from store</p>
                        <p className="text-[10px] text-muted-foreground">Fill all text fields from your store&apos;s products and categories</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5 border-[#a4ffe5] bg-[#e6fff9] text-[#004956] hover:bg-[#d0fff2]"
                        onClick={async () => {
                          try {
                            const { getStoreSnapshot, generateHeadlines, generateDescriptions } = await import("@/lib/google/search-ai-generator");
                            const snapshot = await getStoreSnapshot();
                            const aiHeadlines = generateHeadlines(snapshot);
                            const aiDescriptions = generateDescriptions(snapshot);
                            const maxHeadlines = 15;
                            const existingHeadlines = currentGroup.headlines.filter(h => h.text?.trim());
                            const newHeadlines: typeof currentGroup.headlines = [];
                            let aiHIdx = 0;
                            for (let i = 0; i < maxHeadlines; i++) {
                              if (i < existingHeadlines.length) { newHeadlines.push(existingHeadlines[i]); }
                              else {
                                while (aiHIdx < aiHeadlines.length && existingHeadlines.some(h => h.text?.toLowerCase() === aiHeadlines[aiHIdx].text.toLowerCase())) aiHIdx++;
                                if (aiHIdx < aiHeadlines.length) { newHeadlines.push({ id: `h-gen-${Date.now()}-${i}`, type: "HEADLINE" as const, text: aiHeadlines[aiHIdx].text }); aiHIdx++; }
                                else { newHeadlines.push({ id: `h-empty-${Date.now()}-${i}`, type: "HEADLINE" as const, text: "" }); }
                              }
                            }
                            const maxLongHeadlines = 5;
                            const existingLongHeadlines = currentGroup.longHeadlines.filter(h => h.text?.trim());
                            const newLongHeadlines: typeof currentGroup.longHeadlines = [];
                            let aiLHIdx = 0;
                            const longHeadlineSuggestions = [`Shop ${snapshot.categories[0] ?? "Products"} from ${snapshot.store.name}. Free shipping & secure checkout.`, ...aiDescriptions.map(d => d.text)];
                            for (let i = 0; i < maxLongHeadlines; i++) {
                              if (i < existingLongHeadlines.length) { newLongHeadlines.push(existingLongHeadlines[i]); }
                              else if (aiLHIdx < longHeadlineSuggestions.length) { newLongHeadlines.push({ id: `lh-gen-${Date.now()}-${i}`, type: "LONG_HEADLINE" as const, text: longHeadlineSuggestions[aiLHIdx].slice(0, 90) }); aiLHIdx++; }
                              else { newLongHeadlines.push({ id: `lh-empty-${Date.now()}-${i}`, type: "LONG_HEADLINE" as const, text: "" }); }
                            }
                            const maxDescriptions = 5;
                            const existingDescriptions = currentGroup.descriptions.filter(d => d.text?.trim());
                            const newDescriptions: typeof currentGroup.descriptions = [];
                            let aiDIdx = 0;
                            for (let i = 0; i < maxDescriptions; i++) {
                              if (i < existingDescriptions.length) { newDescriptions.push(existingDescriptions[i]); }
                              else {
                                while (aiDIdx < aiDescriptions.length && existingDescriptions.some(d => d.text?.toLowerCase() === aiDescriptions[aiDIdx].text.toLowerCase())) aiDIdx++;
                                if (aiDIdx < aiDescriptions.length) { newDescriptions.push({ id: `d-gen-${Date.now()}-${i}`, type: "DESCRIPTION" as const, text: aiDescriptions[aiDIdx].text }); aiDIdx++; }
                                else { newDescriptions.push({ id: `d-empty-${Date.now()}-${i}`, type: "DESCRIPTION" as const, text: "" }); }
                              }
                            }
                            updateGroup(currentGroup.id, {
                              headlines: newHeadlines, longHeadlines: newLongHeadlines, descriptions: newDescriptions,
                              businessName: currentGroup.businessName?.trim() ? currentGroup.businessName : snapshot.store.name.slice(0, 25),
                              finalUrl: currentGroup.finalUrl?.trim() ? currentGroup.finalUrl : (snapshot.store.domain.startsWith("http") ? snapshot.store.domain : `https://${snapshot.store.domain}`),
                            });
                          } catch { /* silent fail */ }
                        }}
                      >
                        <Sparkles className="size-3.5" /> Generate All
                      </Button>
                    </div>

                    {/* Headlines */}
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Label className="text-sm font-medium text-foreground">Headlines</Label>
                        <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                          {filledHeadlines}/{ASSET_LIMITS.headlines.max} (min {ASSET_LIMITS.headlines.min})
                        </Badge>
                        <InfoTip text={`Up to ${ASSET_LIMITS.headlines.max} headlines, ${ASSET_LIMITS.headlines.charLimit} chars each.`} />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto h-7 gap-1 text-[10px] text-[#004956] hover:bg-[#e6fff9]"
                          onClick={async () => {
                            try {
                              const { getStoreSnapshot, generateHeadlines } = await import("@/lib/google/search-ai-generator");
                              const snapshot = await getStoreSnapshot();
                              const suggestions = generateHeadlines(snapshot);
                              const maxH = ASSET_LIMITS.headlines.max;
                              const existing = currentGroup.headlines.filter(h => h.text?.trim());
                              const newHeadlines: typeof currentGroup.headlines = [];
                              let aiIdx = 0;
                              for (let i = 0; i < maxH; i++) {
                                if (i < existing.length) { newHeadlines.push(existing[i]); }
                                else {
                                  while (aiIdx < suggestions.length && existing.some(h => h.text?.toLowerCase() === suggestions[aiIdx].text.toLowerCase())) aiIdx++;
                                  if (aiIdx < suggestions.length) { newHeadlines.push({ id: `h-fill-${Date.now()}-${i}`, type: "HEADLINE" as const, text: suggestions[aiIdx].text }); aiIdx++; }
                                  else { newHeadlines.push({ id: `h-empty-${Date.now()}-${i}`, type: "HEADLINE" as const, text: "" }); }
                                }
                              }
                              updateGroup(currentGroup.id, { headlines: newHeadlines });
                            } catch { /* silent */ }
                          }}
                        >
                          <Sparkles className="size-3" /> Fill
                        </Button>
                      </div>
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
                                className={cn("h-10 pr-20 text-sm", (h.text?.length ?? 0) > 25 && "border-amber-400")}
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                {h.text?.trim() && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        className="rounded-full p-0.5 text-amber-400 transition-colors hover:bg-amber-50 hover:text-amber-500"
                                        onClick={async () => {
                                          try {
                                            const { getStoreSnapshot, generateHeadlines } = await import("@/lib/google/search-ai-generator");
                                            const snapshot = await getStoreSnapshot();
                                            const suggestions = generateHeadlines(snapshot);
                                            const current = h.text?.toLowerCase() ?? "";
                                            const alt = suggestions.find(s => s.text.toLowerCase() !== current);
                                            if (alt) updateTextAsset("headlines", h.id, alt.text);
                                          } catch { /* silent */ }
                                        }}
                                      >
                                        <Sparkles className="size-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top"><p className="text-xs">Rephrase</p></TooltipContent>
                                  </Tooltip>
                                )}
                                <span className={cn(
                                  "text-[10px] tabular-nums",
                                  (h.text?.length ?? 0) > 25 ? "text-amber-500" : "text-muted-foreground"
                                )}>
                                  {h.text?.length ?? 0}/{ASSET_LIMITS.headlines.charLimit}
                                </span>
                              </div>
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
                    </div>

                    {/* Headline Diversity */}
                    {(() => {
                      const filled = (currentGroup.headlines?.filter(h => h.text?.trim()) ?? []).map(h => ({ text: h.text ?? "" }));
                      if (filled.length < 3) return null;
                      const diversity = scoreHeadlineDiversity(filled, currentGroup.businessName || campaign.objective.campaignName.split(" - ")[0] || "Store");
                      const colorMap = { poor: "text-red-600 bg-red-50 border-red-200", average: "text-amber-600 bg-amber-50 border-amber-200", good: "text-emerald-600 bg-emerald-50 border-emerald-200", excellent: "text-primary bg-primary/5 border-primary/20" };
                      return (
                        <div className={`rounded-lg border p-3 ${colorMap[diversity.score]}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold">Headline diversity: {diversity.score.charAt(0).toUpperCase() + diversity.score.slice(1)}</span>
                            <span className="text-[10px]">{diversity.total}/15 headlines</span>
                          </div>
                          <div className="flex gap-3 text-[10px]">
                            <span>Brand: {diversity.brand}</span>
                            <span>Product: {diversity.product}</span>
                            <span>Benefit: {diversity.benefit}</span>
                            <span>CTA: {diversity.cta}</span>
                          </div>
                          <p className="mt-1 text-[10px]">{diversity.suggestion}</p>
                        </div>
                      );
                    })()}

                    {/* Long headlines */}
                    <div className="border-t border-border pt-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Label className="text-sm font-medium text-foreground">Long Headlines</Label>
                        <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                          {filledLongHeadlines}/{ASSET_LIMITS.longHeadlines.max} (min {ASSET_LIMITS.longHeadlines.min})
                        </Badge>
                        <InfoTip text={`Up to ${ASSET_LIMITS.longHeadlines.max} long headlines, ${ASSET_LIMITS.longHeadlines.charLimit} chars each.`} />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto h-7 gap-1 text-[10px] text-[#004956] hover:bg-[#e6fff9]"
                          onClick={async () => {
                            try {
                              const { getStoreSnapshot, generateDescriptions } = await import("@/lib/google/search-ai-generator");
                              const snapshot = await getStoreSnapshot();
                              const suggestions = generateDescriptions(snapshot);
                              const extra = [`Shop ${snapshot.categories[0] ?? "Products"} from ${snapshot.store.name}. Free shipping & secure checkout.`];
                              const allSuggestions = [...extra, ...suggestions.map(s => s.text)];
                              const maxLH = ASSET_LIMITS.longHeadlines.max;
                              const existing = currentGroup.longHeadlines.filter(h => h.text?.trim());
                              const newLongHeadlines: typeof currentGroup.longHeadlines = [];
                              let aiIdx = 0;
                              for (let i = 0; i < maxLH; i++) {
                                if (i < existing.length) { newLongHeadlines.push(existing[i]); }
                                else if (aiIdx < allSuggestions.length) { newLongHeadlines.push({ id: `lh-fill-${Date.now()}-${i}`, type: "LONG_HEADLINE" as const, text: allSuggestions[aiIdx].slice(0, 90) }); aiIdx++; }
                                else { newLongHeadlines.push({ id: `lh-empty-${Date.now()}-${i}`, type: "LONG_HEADLINE" as const, text: "" }); }
                              }
                              updateGroup(currentGroup.id, { longHeadlines: newLongHeadlines });
                            } catch { /* silent */ }
                          }}
                        >
                          <Sparkles className="size-3" /> Fill
                        </Button>
                      </div>
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
                                className="h-10 pr-20 text-sm"
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                {h.text?.trim() && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        className="rounded-full p-0.5 text-amber-400 transition-colors hover:bg-amber-50 hover:text-amber-500"
                                        onClick={async () => {
                                          try {
                                            const { getStoreSnapshot, generateDescriptions } = await import("@/lib/google/search-ai-generator");
                                            const snapshot = await getStoreSnapshot();
                                            const suggestions = generateDescriptions(snapshot);
                                            const current = h.text?.toLowerCase() ?? "";
                                            const alt = suggestions.find(s => s.text.toLowerCase() !== current);
                                            if (alt) updateTextAsset("longHeadlines", h.id, alt.text.slice(0, 90));
                                          } catch { /* silent */ }
                                        }}
                                      >
                                        <Sparkles className="size-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top"><p className="text-xs">Rephrase</p></TooltipContent>
                                  </Tooltip>
                                )}
                                <span className="text-[10px] tabular-nums text-muted-foreground">
                                  {h.text?.length ?? 0}/{ASSET_LIMITS.longHeadlines.charLimit}
                                </span>
                              </div>
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
                    </div>

                    {/* Descriptions */}
                    <div className="border-t border-border pt-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Label className="text-sm font-medium text-foreground">Descriptions</Label>
                        <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                          {filledDescriptions}/{ASSET_LIMITS.descriptions.max} (min {ASSET_LIMITS.descriptions.min})
                        </Badge>
                        <InfoTip text={`Up to ${ASSET_LIMITS.descriptions.max} descriptions, ${ASSET_LIMITS.descriptions.charLimit} chars each.`} />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto h-7 gap-1 text-[10px] text-[#004956] hover:bg-[#e6fff9]"
                          onClick={async () => {
                            try {
                              const { getStoreSnapshot, generateDescriptions } = await import("@/lib/google/search-ai-generator");
                              const snapshot = await getStoreSnapshot();
                              const suggestions = generateDescriptions(snapshot);
                              const maxD = ASSET_LIMITS.descriptions.max;
                              const existing = currentGroup.descriptions.filter(d => d.text?.trim());
                              const newDescriptions: typeof currentGroup.descriptions = [];
                              let aiIdx = 0;
                              for (let i = 0; i < maxD; i++) {
                                if (i < existing.length) { newDescriptions.push(existing[i]); }
                                else {
                                  while (aiIdx < suggestions.length && existing.some(d => d.text?.toLowerCase() === suggestions[aiIdx].text.toLowerCase())) aiIdx++;
                                  if (aiIdx < suggestions.length) { newDescriptions.push({ id: `d-fill-${Date.now()}-${i}`, type: "DESCRIPTION" as const, text: suggestions[aiIdx].text }); aiIdx++; }
                                  else { newDescriptions.push({ id: `d-empty-${Date.now()}-${i}`, type: "DESCRIPTION" as const, text: "" }); }
                                }
                              }
                              updateGroup(currentGroup.id, { descriptions: newDescriptions });
                            } catch { /* silent */ }
                          }}
                        >
                          <Sparkles className="size-3" /> Fill
                        </Button>
                      </div>
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
                                className="min-h-[60px] resize-none pr-20 text-sm"
                                rows={2}
                              />
                              <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                                {d.text?.trim() && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        className="rounded-full p-0.5 text-amber-400 transition-colors hover:bg-amber-50 hover:text-amber-500"
                                        onClick={async () => {
                                          try {
                                            const { getStoreSnapshot, generateDescriptions } = await import("@/lib/google/search-ai-generator");
                                            const snapshot = await getStoreSnapshot();
                                            const suggestions = generateDescriptions(snapshot);
                                            const current = d.text?.toLowerCase() ?? "";
                                            const alt = suggestions.find(s => s.text.toLowerCase() !== current);
                                            if (alt) updateTextAsset("descriptions", d.id, alt.text);
                                          } catch { /* silent */ }
                                        }}
                                      >
                                        <Sparkles className="size-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top"><p className="text-xs">Rephrase</p></TooltipContent>
                                  </Tooltip>
                                )}
                                <span className="text-[10px] tabular-nums text-muted-foreground">
                                  {d.text?.length ?? 0}/{ASSET_LIMITS.descriptions.charLimit}
                                </span>
                              </div>
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
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard className="rounded-xl">
                <button type="button" onClick={() => toggleSection("media")}
                  className="flex w-full items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="size-4 text-primary" />
                    <Label className="text-sm font-bold text-foreground">Media Assets</Label>
                    <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                      {isRetailPMax ? "Optional" : "Required"}
                    </Badge>
                    <div className="ml-1 flex items-center gap-1.5 text-[10px]">
                      <span className={pmaxLandscapeCount > 0 ? "text-emerald-600" : "text-amber-600"}>L:{pmaxLandscapeCount}</span>
                      <span className={pmaxSquareCount > 0 ? "text-emerald-600" : "text-amber-600"}>S:{pmaxSquareCount}</span>
                      <span className="text-muted-foreground">P:{pmaxPortraitCount}</span>
                    </div>
                  </div>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", !collapsedSections.media && "rotate-180")} />
                </button>

                {!collapsedSections.media && (
                  <div className="mt-4 space-y-5">
                    <p className="text-xs text-muted-foreground">
                      {isRetailPMax
                        ? "Retail PMax uses your product feed. Add images, logos, and videos to improve coverage."
                        : "Provide required image types and logos, then optional videos and CTA for stronger reach."}
                    </p>
                    {isRetailPMax && retailAssetsLinked && (
                      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] text-amber-700">
                        <AlertTriangle className="mt-0.5 size-3.5" />
                        <span>When you add assets in Retail PMax, the full asset requirements apply (images, logos, and text).</span>
                      </div>
                    )}

                    {/* Images — Unified Upload with Thumbnail Gallery */}
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Label className="text-sm font-medium text-foreground">Images</Label>
                        <InfoTip text="Upload landscape (1.91:1), square (1:1), and portrait (4:5) images. Google tests combinations across Search, Display, YouTube, Discover, Gmail, and Maps." />
                      </div>

                      {/* Add Images button + ratio status chips */}
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => setShowImageSheet(true)}
                        >
                          <Plus className="size-3.5" /> Add Images
                        </Button>
                        <div className="flex flex-wrap gap-1.5">
                          {([
                            { key: "LANDSCAPE", label: "L 1.91:1", count: pmaxLandscapeCount, required: true },
                            { key: "SQUARE", label: "S 1:1", count: pmaxSquareCount, required: true },
                            { key: "PORTRAIT", label: "P 4:5", count: pmaxPortraitCount, required: false },
                          ] as const).map((type) => (
                            <button
                              key={type.key}
                              type="button"
                              onClick={() => setShowImageSheet(true)}
                              className={cn(
                                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all",
                                type.count > 0
                                  ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956]"
                                  : type.required
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-border bg-muted/10 text-muted-foreground"
                              )}
                            >
                              {type.label}
                              <span className="font-bold">{type.count}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Image upload Sheet */}
                      <Sheet open={showImageSheet} onOpenChange={setShowImageSheet}>
                        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
                          <SheetHeader className="border-b border-border px-5 pb-3 pt-5">
                            <SheetTitle className="text-base font-semibold">Add Images</SheetTitle>
                            <SheetDescription className="text-xs text-muted-foreground">
                              Upload images in all three ratios. Google tests combinations across Search, Display, YouTube, Discover, Gmail, and Maps.
                            </SheetDescription>
                          </SheetHeader>
                          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                            {/* Landscape */}
                            <div className="rounded-xl border border-border bg-muted/10 p-4">
                              <div className="mb-3 flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">Landscape</span>
                                <span className="text-[10px] text-muted-foreground">1.91:1 · Rec 1200×628</span>
                                <Badge variant={pmaxLandscapeCount > 0 ? "secondary" : "destructive"} className="ml-auto rounded-full px-1.5 py-0 text-[9px]">
                                  {pmaxLandscapeCount > 0 ? `${pmaxLandscapeCount} added` : "Required"}
                                </Badge>
                              </div>
                              <UploadZone
                                accept="image/png,image/jpeg,image/gif"
                                label="Upload landscape image"
                                sublabel="Min 600×314 · Max 5120×2700"
                                onFile={(file) => addImageUpload("LANDSCAPE", file)}
                                compact
                                libraryContext={"IMAGE_LANDSCAPE" as "IMAGE"}
                              />
                              {currentGroup.images.filter(img => img.pmaxImageType === "LANDSCAPE").length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {currentGroup.images.filter(img => img.pmaxImageType === "LANDSCAPE").map((img) => (
                                    <div key={img.id} className="group relative size-16 overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                                      {(img.url || img.file) && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={getPreviewUrl(img) ?? ""} alt="" className="size-full object-cover" crossOrigin="anonymous" />
                                      )}
                                      <button type="button" onClick={() => removeImageAsset("images", img.id)}
                                        className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <X className="size-4 text-white" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Square */}
                            <div className="rounded-xl border border-border bg-muted/10 p-4">
                              <div className="mb-3 flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">Square</span>
                                <span className="text-[10px] text-muted-foreground">1:1 · Rec 1200×1200</span>
                                <Badge variant={pmaxSquareCount > 0 ? "secondary" : "destructive"} className="ml-auto rounded-full px-1.5 py-0 text-[9px]">
                                  {pmaxSquareCount > 0 ? `${pmaxSquareCount} added` : "Required"}
                                </Badge>
                              </div>
                              <UploadZone
                                accept="image/png,image/jpeg,image/gif"
                                label="Upload square image"
                                sublabel="Min 300×300 · Max 5120×5120"
                                onFile={(file) => addImageUpload("SQUARE", file)}
                                compact
                                libraryContext={"IMAGE_SQUARE" as "IMAGE"}
                              />
                              {currentGroup.images.filter(img => (img.pmaxImageType ?? "PORTRAIT") === "SQUARE").length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {currentGroup.images.filter(img => (img.pmaxImageType ?? "PORTRAIT") === "SQUARE").map((img) => (
                                    <div key={img.id} className="group relative size-16 overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                                      {(img.url || img.file) && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={getPreviewUrl(img) ?? ""} alt="" className="size-full object-cover" crossOrigin="anonymous" />
                                      )}
                                      <button type="button" onClick={() => removeImageAsset("images", img.id)}
                                        className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <X className="size-4 text-white" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Portrait */}
                            <div className="rounded-xl border border-border bg-muted/10 p-4">
                              <div className="mb-3 flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">Portrait</span>
                                <span className="text-[10px] text-muted-foreground">4:5 · Rec 960×1200</span>
                                <Badge variant="outline" className="ml-auto rounded-full px-1.5 py-0 text-[9px]">
                                  {pmaxPortraitCount > 0 ? `${pmaxPortraitCount} added` : "Optional"}
                                </Badge>
                              </div>
                              <UploadZone
                                accept="image/png,image/jpeg,image/gif"
                                label="Upload portrait image"
                                sublabel="Min 480×600 · Max 5120×6400"
                                onFile={(file) => addImageUpload("PORTRAIT", file)}
                                compact
                                libraryContext={"IMAGE_PORTRAIT" as "IMAGE"}
                              />
                              {currentGroup.images.filter(img => img.pmaxImageType === "PORTRAIT").length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {currentGroup.images.filter(img => img.pmaxImageType === "PORTRAIT").map((img) => (
                                    <div key={img.id} className="group relative size-16 overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                                      {(img.url || img.file) && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={getPreviewUrl(img) ?? ""} alt="" className="size-full object-cover" crossOrigin="anonymous" />
                                      )}
                                      <button type="button" onClick={() => removeImageAsset("images", img.id)}
                                        className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <X className="size-4 text-white" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>

                      {/* Unified Thumbnail Gallery */}
                      {currentGroup.images.length > 0 && (
                        <div className="mt-3 rounded-xl border border-border bg-muted/5 p-3">
                          <div className="flex flex-wrap gap-2">
                            {currentGroup.images.map((img) => {
                              const imgType = img.pmaxImageType ?? "PORTRAIT";
                              const typeLabel = imgType === "LANDSCAPE" ? "L" : imgType === "SQUARE" ? "S" : "P";
                              return (
                                <div key={img.id} className="group relative size-14 overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                                  {(img.url || img.file) && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={getPreviewUrl(img) ?? ""} alt="" className="size-full object-cover" crossOrigin="anonymous" />
                                  )}
                                  <div className="absolute left-0.5 top-0.5 rounded bg-black/60 px-1 py-0.5 text-[8px] font-bold text-white">
                                    {typeLabel}
                                  </div>
                                  <button type="button" onClick={() => removeImageAsset("images", img.id)}
                                    className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                    <X className="size-4 text-white" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Logos */}
                    <div className="border-t border-border pt-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Label className="text-sm font-medium text-foreground">Logos</Label>
                        <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">Required</Badge>
                        <InfoTip text="Upload your store logo in square (1:1) and optional landscape (4:1) formats. Square logos are required." />
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          Square: {logoSquareCount}/{ASSET_LIMITS.logos.max} · Landscape: {logoLandscapeCount}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-border bg-muted/10 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-foreground">Square (1:1)</span>
                            {logoSquareCount === 0 && <Badge variant="destructive" className="h-4 px-1 text-[8px]">Required</Badge>}
                          </div>
                          <UploadZone
                            accept="image/png,image/jpeg"
                            label="Upload square logo"
                            sublabel="Rec 1200×1200"
                            onFile={(file) => addLogoUpload("SQUARE", file)}
                            compact
                            libraryContext={"LOGO_SQUARE" as "IMAGE"}
                          />
                          {logoUploadError && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-destructive">
                              <AlertTriangle className="size-3.5" /><span>{logoUploadError}</span>
                            </div>
                          )}
                          {squareLogos.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {squareLogos.map((logo) => (
                                <div key={logo.id} className="group relative size-10 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
                                  {(logo.url || logo.file) && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={getPreviewUrl(logo) ?? ""} alt="" className="size-full object-contain" crossOrigin="anonymous" />
                                  )}
                                  <button type="button" onClick={() => removeImageAsset("logos", logo.id)}
                                    className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                    <X className="size-3 text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-border bg-muted/10 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-foreground">Landscape (4:1)</span>
                            <span className="text-[8px] text-muted-foreground">Optional</span>
                          </div>
                          <UploadZone
                            accept="image/png,image/jpeg"
                            label="Upload landscape logo"
                            sublabel="Rec 1200×300"
                            onFile={(file) => addLogoUpload("LANDSCAPE", file)}
                            compact
                            libraryContext={"LOGO_LANDSCAPE" as "IMAGE"}
                          />
                          {currentGroup.logos.filter((l) => (l.pmaxImageType ?? "SQUARE") === "LANDSCAPE").length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {currentGroup.logos.filter((l) => (l.pmaxImageType ?? "SQUARE") === "LANDSCAPE").map((logo) => (
                                <div key={logo.id} className="group relative h-8 w-16 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
                                  {(logo.url || logo.file) && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={getPreviewUrl(logo) ?? ""} alt="" className="size-full object-contain" crossOrigin="anonymous" />
                                  )}
                                  <button type="button" onClick={() => removeImageAsset("logos", logo.id)}
                                    className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                    <X className="size-3 text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                {/* YouTube videos */}
                <div className="mt-4 border-t border-border pt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Video className="size-3.5 text-primary" />
                    <Label className="text-sm font-medium text-foreground">YouTube Videos</Label>
                    <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">
                      {currentGroup.videos.length}/{ASSET_LIMITS.videos.max} (optional)
                    </Badge>
                  <InfoTip text="Add YouTube video URLs or upload videos (min 10s, 16:9 / 1:1 / 9:16). If none are provided, Google can auto-generate videos from images." />
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {uploadedVideoCount > 0 && `Uploaded ${uploadedVideoCount}`}
                      {uploadedVideoCount > 0 && linkedVideoCount > 0 && " • "}
                      {linkedVideoCount > 0 && `Linked ${linkedVideoCount}`}
                      {totalVideoCount === 0 && "Optional"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-2 py-1">
                    {(["upload", "url"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setVideoInputMode(mode)}
                        className={cn(
                          "flex-1 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all",
                          videoInputMode === mode
                            ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956] shadow-sm"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {mode === "upload" ? "Upload / Library" : "Paste URL"}
                      </button>
                    ))}
                  </div>

                  {videoInputMode === "upload" ? (
                    <div className="mt-3 rounded-lg border border-border bg-background p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Upload className="size-3.5 text-primary" />
                        <p className="text-xs font-semibold text-foreground">Upload or reuse</p>
                        <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">Media Library</Badge>
                      </div>
                      <UploadZone
                        accept="video/mp4,video/quicktime"
                        label="Upload or choose from library"
                        sublabel="MP4/MOV • >=10s • 16:9, 1:1, 9:16"
                        onFile={addVideoUpload}
                        compact
                        libraryContext="VIDEO"
                        multiSelect
                      />
                      <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <Youtube className="size-3.5 text-primary" />
                          <p className="text-xs font-semibold text-foreground">Upload to your YouTube channel</p>
                          <span className="text-[10px] text-muted-foreground">Optional</span>
                        </div>
                        <p className="mb-3 text-[11px] text-muted-foreground">
                          By default, uploaded videos go to a Google-managed channel as Unlisted. Enter your channel details below to have them appear in your own library instead.
                        </p>
                        <div className="flex flex-col gap-2">
                          <Input
                            placeholder="YouTube channel ID (UC...)"
                            value={youtubeChannelId}
                            onChange={(e) => updateNested("creative", { youtubeChannelId: e.target.value })}
                            className="h-10 text-sm"
                          />
                          <Input
                            placeholder="Channel name (optional)"
                            value={youtubeChannelName}
                            onChange={(e) => updateNested("creative", { youtubeChannelName: e.target.value })}
                            className="h-10 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg border border-border bg-background p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Link2 className="size-3.5 text-primary" />
                        <p className="text-xs font-semibold text-foreground">Paste YouTube URL</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="https://youtube.com/watch?v=..."
                          value={youtubeUrlDraft}
                          onChange={(e) => setYoutubeUrlDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addVideoUrl();
                            }
                          }}
                          className="h-10 text-sm"
                        />
                        <Button size="sm" className="h-10 text-sm" onClick={addVideoUrl} disabled={!youtubeUrlDraft.trim()}>
                          Add URL
                        </Button>
                      </div>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        We save the video ID and use it in the asset group. Use videos that are 10+ seconds and 16:9, 1:1, or 9:16.
                      </p>
                    </div>
                  )}

                  {videoValidationError && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-destructive">
                      <AlertTriangle className="size-3.5" />
                      <span>{videoValidationError}</span>
                    </div>
                  )}

                  {currentGroup.videos.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {currentGroup.videos.map((v) => {
                        const previewUrl = v.file
                          ? getPreviewUrl(v)
                          : v.youtubeVideoId
                            ? `https://img.youtube.com/vi/${v.youtubeVideoId}/hqdefault.jpg`
                            : undefined;
                        const size = formatBytes(v.file?.size);
                        return (
                          <div key={v.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/5 px-3 py-2">
                            <div className="size-12 overflow-hidden rounded-md bg-muted">
                              {previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={previewUrl} alt="Video preview" className="size-full object-cover" crossOrigin="anonymous" />
                              ) : (
                                <div className="flex size-full items-center justify-center">
                                  <Video className="size-4 text-muted-foreground/60" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              {v.file ? (
                                <>
                                  <p className="truncate text-xs font-medium text-foreground">{v.file.name}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {size ? `${size} • ` : ""}Uploaded (pending YouTube processing)
                                  </p>
                                </>
                              ) : (
                                <Input
                                  placeholder="https://youtube.com/watch?v=..."
                                  value={v.url ?? ""}
                                  onChange={(e) => updateVideoAsset(v.id, e.target.value)}
                                  className="h-8 text-xs"
                                />
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVideoAsset(v.id)}
                              className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* ── Section: Search Themes ── */}
              <SectionCard className="rounded-xl">
                <button type="button" onClick={() => toggleSection("themes")}
                  className="flex w-full items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <Search className="size-4 text-primary" />
                    <Label className="text-sm font-bold text-foreground">Search Themes</Label>
                    <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">{(currentGroup?.searchThemes ?? []).length}/25</Badge>
                    <InfoTip text="Search themes tell Google what queries matter for this asset group. Use specific product/category terms. Up to 25 per group." />
                  </div>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", !collapsedSections.themes && "rotate-180")} />
                </button>

                {!collapsedSections.themes && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
                      <Info className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
                      <p className="text-[11px] leading-relaxed text-blue-700">
                        Search themes guide Google&apos;s AI to find the right audience. Add specific product or category terms your ideal customer would search for.
                      </p>
                    </div>
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1 text-xs text-[#004956] hover:bg-[#e6fff9]"
                        onClick={async () => {
                          try {
                            const { getStoreSnapshot, generateSearchThemes } = await import("@/lib/google/search-ai-generator");
                            const snapshot = await getStoreSnapshot();
                            const themes = generateSearchThemes(snapshot);
                            const existing = new Set((currentGroup?.searchThemes ?? []).map(t => t.toLowerCase()));
                            const newThemes = themes.filter(t => !existing.has(t.toLowerCase()));
                            updateGroup(currentGroup.id, {
                              searchThemes: [...(currentGroup.searchThemes ?? []), ...newThemes].slice(0, 25),
                            });
                          } catch { /* silent */ }
                        }}
                      >
                        <Sparkles className="size-3" /> Auto-fill from Store
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. buy perfume online, oud collection"
                        value={themeInput ?? ""}
                        onChange={(e) => setThemeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && themeInput?.trim()) {
                            e.preventDefault();
                            const existing = currentGroup?.searchThemes ?? [];
                            if (existing.length < 25 && !existing.includes(themeInput.trim())) {
                              updateGroup(currentGroup.id, {
                                searchThemes: [...existing, themeInput.trim()],
                              });
                              setThemeInput("");
                            }
                          }
                        }}
                        className="h-10 flex-1 text-sm"
                      />
                      <Button size="sm" variant="outline" className="h-10 gap-1 text-sm"
                        disabled={!(themeInput?.trim()) || (currentGroup?.searchThemes ?? []).length >= 25}
                        onClick={() => {
                          const existing = currentGroup?.searchThemes ?? [];
                          if (themeInput?.trim() && existing.length < 25 && !existing.includes(themeInput.trim())) {
                            updateGroup(currentGroup.id, {
                              searchThemes: [...existing, themeInput.trim()],
                            });
                            setThemeInput("");
                          }
                        }}
                      >
                        <Plus className="size-3" /> Add
                      </Button>
                    </div>
                    {(currentGroup?.searchThemes ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(currentGroup?.searchThemes ?? []).map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 rounded-full border border-[#a4ffe5] bg-[#e6fff9] px-2.5 py-1 text-[10px] font-medium text-[#004956]">
                            {t}
                            <button type="button" onClick={() => updateGroup(currentGroup.id, {
                              searchThemes: (currentGroup.searchThemes ?? []).filter(s => s !== t),
                            })} className="text-[#004956]/60 hover:text-[#004956]">
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground">{(currentGroup?.searchThemes ?? []).length}/25 themes · Press Enter to add</p>
                  </div>
                )}
              </SectionCard>

              {/* Google AI Settings */}
              {isPMax && (
                <SectionCard className="rounded-xl">
                  <button type="button" onClick={() => setShowGoogleAi(!showGoogleAi)}
                    className="flex w-full items-center justify-between text-left">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      <Label className="text-sm font-bold text-foreground">Google AI Settings</Label>
                      <InfoTip text="Control how Google AI generates and enhances your campaign assets. These settings affect all ad placements across Search, Display, YouTube, Discover, Gmail, and Maps." />
                    </div>
                    <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showGoogleAi && "rotate-180")} />
                  </button>

                  {showGoogleAi && (
                    <div className="mt-4 space-y-5">
                      {/* URL Expansion */}
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="flex items-start gap-2.5">
                          <Link2 className="mt-0.5 size-4 text-primary" />
                          <div>
                            <p className="text-xs font-semibold text-foreground">URL Expansion</p>
                            <p className="text-[11px] text-muted-foreground">Allow Google to send traffic to better-matching pages on your site.</p>
                          </div>
                        </div>
                        <Switch checked={!budget.urlExpansionOptOut} onCheckedChange={(v) => updateNested("budget", { urlExpansionOptOut: !v })} />
                      </div>

                      {/* Brand Guidelines */}
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="flex items-start gap-2.5">
                          <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-semibold text-foreground">Brand Guidelines</p>
                            <p className="text-[11px] text-muted-foreground">Let Google use your brand assets when generating creative variations.</p>
                          </div>
                        </div>
                        <Switch checked={budget.brandGuidelinesEnabled} onCheckedChange={(v) => updateNested("budget", { brandGuidelinesEnabled: v })} />
                      </div>

                      {/* Asset Automation Toggles */}
                      <div>
                        <p className="mb-2 text-xs font-semibold text-foreground">Asset Automation</p>
                        <p className="mb-3 text-[11px] text-muted-foreground">Google AI creates variations of your text, images, and videos for testing.</p>
                        <div className="space-y-2">
                          {[
                            { type: "TEXT_ASSET_AUTOMATION" as AssetAutomationType, label: "Text Generation", desc: "Auto-create headline and description variations" },
                            { type: "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION" as AssetAutomationType, label: "URL Text Generation", desc: "Generate text for expanded landing pages" },
                            { type: "GENERATE_IMAGE_EXTRACTION" as AssetAutomationType, label: "Image Extraction", desc: "Pull relevant images from your landing pages" },
                            { type: "GENERATE_IMAGE_ENHANCEMENT" as AssetAutomationType, label: "Image Enhancement", desc: "AI-enhance your uploaded images" },
                            { type: "GENERATE_ENHANCED_YOUTUBE_VIDEOS" as AssetAutomationType, label: "Video Enhancement", desc: "Create placement-ready video variations" },
                          ].map((item) => {
                            const entry = (budget.assetAutomationSettings ?? []).find((e: AssetAutomationEntry) => e.type === item.type);
                            const isOn = (entry?.status ?? "OPTED_IN") === "OPTED_IN";
                            return (
                              <div key={item.type} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                                <div>
                                  <p className="text-[11px] font-medium text-foreground">{item.label}</p>
                                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                                </div>
                                <Switch checked={isOn} onCheckedChange={(v) => {
                                  const settings = [...(budget.assetAutomationSettings ?? [])];
                                  const idx = settings.findIndex((e: AssetAutomationEntry) => e.type === item.type);
                                  const newEntry = { type: item.type, status: (v ? "OPTED_IN" : "OPTED_OUT") as AssetAutomationStatus };
                                  if (idx >= 0) settings[idx] = newEntry; else settings.push(newEntry);
                                  updateNested("budget", { assetAutomationSettings: settings });
                                }} />
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-[10px] text-primary">Tip: Keep all enabled for best performance. Google tests thousands of combinations.</p>
                      </div>

                      {/* Text Guidelines */}
                      <div>
                        <p className="mb-2 text-xs font-semibold text-foreground">Text Guidelines</p>
                        <p className="mb-3 text-[11px] text-muted-foreground">Guide AI-written copy with brand safety rules.</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="mb-1 text-xs font-medium text-muted-foreground">Term exclusions</Label>
                            <div className="flex gap-1.5">
                              <Input placeholder="e.g. free" className="h-10 text-sm" value={termInput} onChange={(e) => setTermInput(e.target.value)} onKeyDown={(e) => {
                                if (e.key === "Enter" && termInput.trim()) {
                                  e.preventDefault();
                                  updateNested("budget", { textGuidelines: { ...budget.textGuidelines, termExclusions: [...budget.textGuidelines.termExclusions, termInput.trim()] } });
                                  setTermInput("");
                                }
                              }} />
                              <Button size="sm" variant="outline" className="h-10 text-sm" onClick={() => {
                                if (termInput.trim()) {
                                  updateNested("budget", { textGuidelines: { ...budget.textGuidelines, termExclusions: [...budget.textGuidelines.termExclusions, termInput.trim()] } });
                                  setTermInput("");
                                }
                              }}>Add</Button>
                            </div>
                            {budget.textGuidelines.termExclusions.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {budget.textGuidelines.termExclusions.map((t: string) => (
                                  <Badge key={t} variant="secondary" className="gap-1 text-[9px]">{t}
                                    <button type="button" onClick={() => updateNested("budget", { textGuidelines: { ...budget.textGuidelines, termExclusions: budget.textGuidelines.termExclusions.filter((x: string) => x !== t) } })}><X className="size-2.5" /></button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label className="mb-1 text-xs font-medium text-muted-foreground">Messaging restrictions</Label>
                            <div className="flex gap-1.5">
                              <Input placeholder="e.g. avoid superlatives" className="h-10 text-sm" value={msgInput} onChange={(e) => setMsgInput(e.target.value)} onKeyDown={(e) => {
                                if (e.key === "Enter" && msgInput.trim()) {
                                  e.preventDefault();
                                  updateNested("budget", { textGuidelines: { ...budget.textGuidelines, messagingRestrictions: [...budget.textGuidelines.messagingRestrictions, msgInput.trim()] } });
                                  setMsgInput("");
                                }
                              }} />
                              <Button size="sm" variant="outline" className="h-10 text-sm" onClick={() => {
                                if (msgInput.trim()) {
                                  updateNested("budget", { textGuidelines: { ...budget.textGuidelines, messagingRestrictions: [...budget.textGuidelines.messagingRestrictions, msgInput.trim()] } });
                                  setMsgInput("");
                                }
                              }}>Add</Button>
                            </div>
                            {budget.textGuidelines.messagingRestrictions.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {budget.textGuidelines.messagingRestrictions.map((t: string) => (
                                  <Badge key={t} variant="secondary" className="gap-1 text-[9px]">{t}
                                    <button type="button" onClick={() => updateNested("budget", { textGuidelines: { ...budget.textGuidelines, messagingRestrictions: budget.textGuidelines.messagingRestrictions.filter((x: string) => x !== t) } })}><X className="size-2.5" /></button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}

        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN                                                  */}
        {/* ============================================================ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="sticky top-6 flex flex-col gap-4">

            {/* Ad Preview */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Eye className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Ad Preview</Label>
                {isRetailPMax && (
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">
                    Retail
                  </Badge>
                )}
              </div>
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted/10 px-2 py-1">
                <button
                  type="button"
                  aria-label="Previous preview"
                  onClick={() => goToPreview(-1)}
                  className="flex size-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-3" />
                </button>
                <div className="flex flex-1 items-end justify-between gap-2 border-b border-border/60 pb-1">
                  {previewTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = previewChannel === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setPreviewChannel(tab.key)}
                        className={cn(
                          "flex flex-1 flex-col items-center gap-0.5 border-b-2 pb-1 text-[9px] font-medium transition-colors",
                          isActive
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("size-3.5", tab.color)} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  aria-label="Next preview"
                  onClick={() => goToPreview(1)}
                  className="flex size-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground"
                >
                  <ArrowRight className="size-3" />
                </button>
              </div>

              <div className="relative rounded-[26px] border border-border bg-muted/30 p-2">
                <div className="relative mx-auto rounded-[22px] border border-border bg-background p-2 shadow-sm">
                  <div className="mb-2 flex items-center justify-between text-[9px] text-muted-foreground">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-3 rounded-sm bg-muted" />
                      <div className="h-2 w-4 rounded-sm bg-muted" />
                      <div className="h-2 w-5 rounded-sm bg-muted" />
                    </div>
                  </div>
                  <div className="mb-2 flex items-center gap-1.5 text-[9px] text-muted-foreground">
                    <div className="size-3 rounded-full bg-primary/20" />
                    <span className="font-medium text-foreground">Sponsored</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{activePreviewLabel}</span>
                  </div>

                  {previewChannel === "search" && (
                    <div className="rounded-lg border border-border bg-background p-2">
                      <div className="mb-1 flex items-center gap-1">
                        <Badge className="rounded bg-foreground/10 px-1 py-0 text-[8px] font-bold text-foreground">Ad</Badge>
                        <span className="text-[9px] text-muted-foreground">
                          {previewDomain}
                          {currentGroup.displayPath1 && ` / ${currentGroup.displayPath1}`}
                          {currentGroup.displayPath2 && ` / ${currentGroup.displayPath2}`}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-primary">
                        {searchHeadline}
                        {" - "}
                        {searchHeadline2}
                      </p>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">
                        {searchDescription}{searchDescription2 ? ` ${searchDescription2}` : ""}
                      </p>
                      {renderPreviewControls("search", searchComboCount, "Text combos")}
                    </div>
                  )}

                  {previewChannel === "display" && (
                    <div className="rounded-lg border border-border bg-background p-2">
                      {(() => {
                        const total = displayImages.length;
                        const idx = getPreviewIndex("display", total);
                        const primary = displayImages[idx];
                        const secondary = total > 1 ? displayImages[(idx + 1) % total] : undefined;
                        const primaryUrl = getPreviewUrl(primary);
                        const secondaryUrl = getPreviewUrl(secondary);
                        const headline = headlineTexts[0] || "Headline";
                        const description = descriptionTexts[0] || "Description";
                        const logoUrl = getPreviewUrl(displayLogo);
                        return (
                          <>
                            <div className="mb-2 grid grid-cols-2 gap-1">
                              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md bg-muted">
                                {primaryUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={primaryUrl} alt="Preview" className="size-full object-cover" crossOrigin="anonymous" />
                                ) : (
                                  <ImageIcon className="size-4 text-muted-foreground/40" />
                                )}
                              </div>
                              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md bg-muted">
                                {secondaryUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={secondaryUrl} alt="Preview" className="size-full object-cover" crossOrigin="anonymous" />
                                ) : (
                                  <ImageIcon className="size-4 text-muted-foreground/40" />
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] font-semibold text-foreground">{headline}</p>
                            <p className="mt-0.5 text-[9px] text-muted-foreground">{description}</p>
                            <div className="mt-2 flex items-center gap-1.5">
                              {logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logoUrl} alt="Logo" className="h-3 w-3 rounded-sm object-cover" crossOrigin="anonymous" />
                              ) : (
                                <div className="size-3 rounded bg-muted" />
                              )}
                              <span className="text-[9px] text-muted-foreground">{currentGroup.businessName || "Business"}</span>
                              <span className="ml-auto inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[8px] font-medium text-primary-foreground">
                                {CTA_OPTIONS.find((c) => c.value === currentGroup.callToAction)?.label ?? "Shop now"}
                              </span>
                            </div>
                            {renderPreviewControls("display", total, "Images")}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {previewChannel === "youtube" && (
                    <div className="rounded-lg border border-border bg-background p-2">
                      {(() => {
                        const totalVideos = youtubeVideos.length;
                        const totalFallback = youtubeFallbackImages.length;
                        const total = totalVideos > 0 ? totalVideos : totalFallback;
                        const idx = getPreviewIndex("youtube", total || 1);
                        const video = totalVideos > 0 ? youtubeVideos[idx] : undefined;
                        const fallbackImage = totalVideos === 0 ? youtubeFallbackImages[idx] : undefined;
                        const videoUrl = getPreviewUrl(video);
                        const imageUrl = getPreviewUrl(fallbackImage);
                        const headline = longHeadlineTexts[0] || headlineTexts[0] || "Long Headline Here";
                        const description = descriptionTexts[0] || "Description";
                        return (
                          <>
                            <div className="mb-2 flex aspect-video items-center justify-center overflow-hidden rounded-md bg-muted">
                              {videoUrl ? (
                                <video src={videoUrl} muted loop playsInline className="size-full object-cover" />
                              ) : imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imageUrl} alt="Preview" className="size-full object-cover" crossOrigin="anonymous" />
                              ) : (
                                <PlayCircle className="size-6 text-muted-foreground/40" />
                              )}
                            </div>
                            <p className="text-[10px] font-semibold text-foreground">{headline}</p>
                            <p className="mt-0.5 text-[9px] text-muted-foreground">{description}</p>
                            <div className="mt-2 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[9px] font-medium text-primary-foreground">
                              {CTA_OPTIONS.find((c) => c.value === currentGroup.callToAction)?.label ?? "Shop now"}
                            </div>
                            {renderPreviewControls("youtube", total, totalVideos > 0 ? "Videos" : "Images")}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {previewChannel === "discover" && (
                    <div className="rounded-lg border border-border bg-background p-2">
                      {(() => {
                        const total = discoverImages.length;
                        const idx = getPreviewIndex("discover", total || 1);
                        const image = discoverImages[idx];
                        const imageUrl = getPreviewUrl(image);
                        const headline = longHeadlineTexts[0] || headlineTexts[0] || "Long Headline";
                        const logoUrl = getPreviewUrl(discoverLogo);
                        return (
                          <>
                            <div className="mb-2 flex aspect-[1.91/1] items-center justify-center overflow-hidden rounded-md bg-muted">
                              {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imageUrl} alt="Preview" className="size-full object-cover" crossOrigin="anonymous" />
                              ) : (
                                <ImageIcon className="size-5 text-muted-foreground/40" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logoUrl} alt="Logo" className="h-3 w-3 rounded-sm object-cover" crossOrigin="anonymous" />
                              ) : (
                                <div className="size-3 rounded bg-muted" />
                              )}
                              <span className="text-[9px] text-muted-foreground">{currentGroup.businessName || "Business"}</span>
                              <span className="text-[9px] text-muted-foreground">Sponsored</span>
                            </div>
                            <p className="mt-1 text-[10px] font-semibold text-foreground">{headline}</p>
                            {renderPreviewControls("discover", total, "Images")}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {previewChannel === "gmail" && (
                    <div className="rounded-lg border border-border bg-background p-2">
                      {(() => {
                        const total = gmailImages.length;
                        const idx = getPreviewIndex("gmail", total || 1);
                        const image = gmailImages[idx];
                        const imageUrl = getPreviewUrl(image);
                        const headline = headlineTexts[0] || "New arrivals in store";
                        const description = descriptionTexts[0] || "Discover curated products from your store.";
                        return (
                          <>
                            <div className="mb-2 flex items-center justify-between text-[9px] text-muted-foreground">
                              <span className="font-medium text-foreground">Promotions</span>
                              <span>Ad</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-md border border-border/60 p-2">
                              <div className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-muted">
                                {imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={imageUrl} alt="Preview" className="size-full object-cover" crossOrigin="anonymous" />
                                ) : (
                                  <ImageIcon className="size-4 text-muted-foreground/40" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[10px] font-semibold text-foreground">{currentGroup.businessName || "Your Store"}</p>
                                <p className="truncate text-[9px] text-muted-foreground">{headline}</p>
                              </div>
                              <ChevronRight className="size-3.5 text-muted-foreground" />
                            </div>
                            <div className="mt-2 rounded-md border border-border/60 p-2">
                              <p className="text-[10px] font-semibold text-foreground">{headline}</p>
                              <p className="mt-0.5 text-[9px] text-muted-foreground">{description}</p>
                              <div className="mt-2 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[9px] font-medium text-primary-foreground">
                                {CTA_OPTIONS.find((c) => c.value === currentGroup.callToAction)?.label ?? "Shop now"}
                              </div>
                            </div>
                            {renderPreviewControls("gmail", total, "Images")}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {previewChannel === "shopping" && (
                    <div className="rounded-lg border border-border bg-background p-2">
                      {(() => {
                        const total = PREVIEW_PRODUCTS.length;
                        const idx = getPreviewIndex("shopping", total || 1);
                        const productA = PREVIEW_PRODUCTS[idx % total];
                        const productB = PREVIEW_PRODUCTS[(idx + 1) % total];
                        const headline = longHeadlineTexts[0] || "Shop top picks";
                        return (
                          <>
                            <p className="mb-2 text-[10px] font-semibold text-foreground">{headline}</p>
                            <div className="grid grid-cols-2 gap-2">
                              {[productA, productB].map((product) => (
                                <div key={product.id} className="overflow-hidden rounded-md border border-border/60">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" crossOrigin="anonymous" />
                                  <div className="p-1.5">
                                    <p className="truncate text-[9px] font-medium text-foreground">{product.name}</p>
                                    <p className="text-[9px] text-muted-foreground">
                                      {product.salePrice ? (
                                        <>
                                          <span className="font-semibold text-foreground">{formatSAR(product.salePrice)}</span>{" "}
                                          <span className="line-through">{formatSAR(product.price)}</span>
                                        </>
                                      ) : (
                                        <span className="font-semibold text-foreground">{formatSAR(product.price)}</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {renderPreviewControls("shopping", total, "Products")}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {previewLocked && (
                  <div className="pointer-events-none absolute left-3 right-3 top-4 rounded-lg border border-amber-300 bg-white/95 px-2.5 py-2 text-[9px] text-amber-900 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="size-3 text-amber-600" />
                      <span className="font-semibold">To unlock this format, add the following assets:</span>
                    </div>
                    <ul className="mt-1 list-disc pl-4 text-amber-900">
                      {previewLockItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Preview is illustrative. Final layout varies by placement and inventory.
              </p>
            </SectionCard>

            {/* Campaign Readiness */}
            <SectionCard className="p-4">
              <div className="flex items-start gap-3">
                <ReadinessRing percent={readinessPercent} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">Campaign Readiness</p>
                    <span className={cn("text-xs font-semibold", requiredRemaining === 0 ? "text-emerald-600" : "text-destructive")}>
                      {readinessStatus}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {requiredRemaining === 0
                      ? "All required items are complete."
                      : `${requiredRemaining} required item${requiredRemaining === 1 ? "" : "s"} need attention before launching.`}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>Ad strength:</span>
                    <span className={cn("font-semibold", adStrength.color)}>{adStrength.label}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-border bg-muted/10 p-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Required</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-1.5 py-0 text-[9px]",
                        requiredRemaining === 0 ? "text-emerald-600" : "text-destructive"
                      )}
                    >
                      {requiredRemaining} remaining
                    </Badge>
                  </div>
                  <span className="tabular-nums">{requiredDone}/{requiredTotal}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      readinessPercent >= 100 ? "bg-emerald-500" :
                      readinessPercent >= 70 ? "bg-primary" :
                      readinessPercent >= 40 ? "bg-amber-500" :
                      "bg-destructive"
                    )}
                    style={{ width: `${readinessPercent}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-col gap-2 text-[11px]">
                  {blockers.map((b) => (
                    <div key={b.label} className="flex items-start gap-2">
                      {b.ok ? (
                        <CheckCircle2 className="mt-0.5 size-3 text-emerald-500" />
                      ) : (
                        <AlertCircle className="mt-0.5 size-3 text-destructive" />
                      )}
                      <span className={cn(b.ok ? "text-muted-foreground" : "text-foreground")}>
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-border bg-muted/10 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="size-3.5 text-primary" />
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Best practices</p>
                  </div>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">
                    {bestPracticeDone}/{bestPracticeTotal}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  {bestPracticeItems.map((item) => (
                    <div key={item.title} className="flex items-start gap-2">
                      {item.done ? (
                        <CheckCircle2 className="mt-0.5 size-3 text-emerald-500" />
                      ) : (
                        <AlertCircle className="mt-0.5 size-3 text-amber-500" />
                      )}
                      <div>
                        <p className={cn("text-[11px] font-medium", item.done ? "text-muted-foreground" : "text-foreground")}>
                          {item.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Next"
        nextDisabled={!canProceed}
      />
      <Dialog open={showYoutubeConnect} onOpenChange={setShowYoutubeConnect}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect YouTube channel</DialogTitle>
            <DialogDescription>
              We&apos;ll request access to your Google account to upload videos to your brand channel. This OAuth flow
              is a production integration; for the prototype, you can paste the channel ID manually.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowYoutubeConnect(false)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
