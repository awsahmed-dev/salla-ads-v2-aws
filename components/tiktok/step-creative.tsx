"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useTikTokCampaign } from "@/lib/tiktok/campaign-context";
import { ScenarioDBlocker } from "@/components/tiktok/scenario-blocker";
import { getSalesScenario } from "@/lib/tiktok/scenario";
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
// Dialog removed — product set picker now uses Sheet pattern
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { ProductPickerDialog, type SallaProduct } from "@/components/shared/product-picker";
import { PREVIEW_PRODUCTS } from "@/lib/salla/store-api";
import { fetchProductSets, type ProductSetCategory } from "@/lib/salla/product-sets";
import type { SallaProductSet } from "@/lib/salla/store-api";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Search,
  TrendingUp,
  CalendarDays,
  RefreshCw,
  ArrowRight,
  Loader2,
  Save as SaveIcon,
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
  getAllowedPlacements,
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
    desc: "Promote an existing organic TikTok post via authorization code.",
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
  // Phase 5 fix: INSTALL_NOW is the canonical CTA for App Promotion and is
  // set as APP_PROMOTION's default in OBJECTIVE_CONFIGS, but was missing
  // from the dropdown — so merchants couldn't see or re-select it.
  { value: "INSTALL_NOW", label: "Install Now" },
  { value: "VIEW_NOW", label: "View Now" },
  { value: "APPLY_NOW", label: "Apply Now" },
  { value: "BOOK_NOW", label: "Book Now" },
  { value: "GET_QUOTE", label: "Get Quote" },
];

const RECOMMENDED_CTAS = CTA_OPTIONS.filter((c) =>
  ["SHOP_NOW", "BUY_NOW", "ORDER_NOW", "LEARN_MORE", "SIGN_UP", "INSTALL_NOW"].includes(c.value)
);
const OTHER_CTAS = CTA_OPTIONS.filter((c) =>
  !["SHOP_NOW", "BUY_NOW", "ORDER_NOW", "LEARN_MORE", "SIGN_UP", "INSTALL_NOW"].includes(c.value)
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

/**
 * Small inline "Fill with AI" button — same visual treatment everywhere it's
 * used so merchants recognize the pattern. Generates a one-shot pre-fill into
 * the target input. Wired to a static contextual string today; backend swap
 * point is the onFill callback.
 */
function AiFillButton({ onFill, label = "Fill with AI" }: { onFill: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onFill}
      className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-50 to-[#e6fff9] px-2 py-0.5 text-[10px] font-semibold text-[#004956] transition-all hover:from-violet-100 hover:to-[#a4ffe5]/40"
    >
      <Sparkles className="size-2.5 text-violet-500" />
      {label}
    </button>
  );
}

/**
 * Smart+ Recommendation Usage panel — right-rail scorecard that mirrors
 * TikTok's upgraded Smart+ ad creation experience. Each check is a row
 * with a status dot; failing rows surface an inline action.
 *
 *   ● green  = passed
 *   ◐ amber  = partial (e.g. has 1 creative, recommended 3+)
 *   ○ gray   = pending (not yet configured)
 *
 * The composite score is a weighted average across 5 modules and drives
 * the merchant's mental model of "how done is this campaign".
 */
function SmartPlusRecommendationCard({
  catalogConnected,
  catalogRequired,
  pixelConnected,
  pixelRequired,
  hasBudget,
  hasAudience,
  creativeCount,
  captionCount,
  onNavigateToBudget,
}: {
  catalogConnected: boolean;
  catalogRequired: boolean;
  pixelConnected: boolean;
  pixelRequired: boolean;
  hasBudget: boolean;
  hasAudience: boolean;
  creativeCount: number;
  captionCount: number;
  onNavigateToBudget: () => void;
}) {
  type Row = {
    key: string;
    label: string;
    state: "pass" | "partial" | "pending";
    action?: { label: string; onClick?: () => void };
  };

  const rows: Row[] = [
    {
      key: "catalog",
      label: catalogRequired ? "Catalog" : "Catalog (optional)",
      state: catalogRequired ? (catalogConnected ? "pass" : "pending") : "pass",
    },
    {
      key: "optimization",
      label: "Optimization and bidding",
      state: pixelRequired ? (pixelConnected ? "pass" : "pending") : "pass",
    },
    {
      key: "budget",
      label: "Budget and schedule",
      state: hasBudget ? "pass" : "pending",
    },
    {
      key: "audience",
      label: "Audience targeting",
      state: hasAudience ? "pass" : "pending",
    },
    {
      key: "placements",
      label: "Placements",
      state: "pass", // Smart+ defaults handle this; only goes pending in Manual + empty
    },
    {
      key: "creatives",
      label: "Creative assets",
      state: creativeCount >= 3 ? "pass" : creativeCount >= 1 ? "partial" : "pending",
      action: creativeCount > 0 && creativeCount < 3
        ? { label: `Add ${3 - creativeCount} more creative${3 - creativeCount > 1 ? "s" : ""}` }
        : undefined,
    },
    {
      key: "captions",
      label: "Caption variations",
      state: captionCount >= 3 ? "pass" : captionCount >= 1 ? "partial" : "pending",
      action: captionCount > 0 && captionCount < 5
        ? { label: `Add ${5 - captionCount} more caption${5 - captionCount > 1 ? "s" : ""}` }
        : undefined,
    },
  ];

  const passed = rows.filter((r) => r.state === "pass").length;
  const partial = rows.filter((r) => r.state === "partial").length;
  const score = Math.round(((passed + partial * 0.5) / rows.length) * 100);
  const ringColor = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <SectionCard className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-violet-500" />
        <Label className="text-sm font-bold text-foreground">Recommendation usage</Label>
        <InfoTip text="Smart+ scorecard. Higher score = TikTok has more signal to optimize delivery. Aim for 80%+ before launching." />
      </div>

      {/* Score ring + summary */}
      <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
        <div className="relative size-14 shrink-0">
          <svg viewBox="0 0 56 56" className="size-full -rotate-90">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e7eb" strokeWidth="4" />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke={ringColor}
              strokeWidth="4"
              strokeDasharray={`${(score / 100) * 150.8} 150.8`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold tabular-nums text-foreground">{score}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">
            {score >= 80
              ? "Ad group is fully optimized"
              : score >= 50
                ? "Ad group is partially optimized"
                : "Ad group needs more setup"}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            For best results, apply all recommendations.
          </p>
        </div>
      </div>

      {/* Per-row check list */}
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/20">
            <span
              className={cn(
                "size-4 shrink-0 rounded-full",
                r.state === "pass" && "bg-emerald-500",
                r.state === "partial" && "bg-amber-400",
                r.state === "pending" && "bg-slate-300"
              )}
              aria-label={r.state}
            />
            <span className="flex-1 text-xs text-foreground">{r.label}</span>
            {r.action && (
              <button
                type="button"
                onClick={r.action.onClick}
                className="text-[10px] font-semibold text-[#004956] hover:underline"
              >
                {r.action.label}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Budget nudge — surfaces when Smart+ thinks current budget is low.
          Pure prompt today; in production this would reference a TikTok
          API budget-recommendation field. */}
      {hasBudget && (
        <button
          type="button"
          onClick={onNavigateToBudget}
          className="mt-3 flex w-full items-start gap-2 rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 to-white p-2.5 text-left transition-colors hover:from-violet-100"
        >
          <Plus className="mt-0.5 size-3.5 shrink-0 text-violet-600" />
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-foreground">Increase budget for full delivery</p>
            <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
              Smart+ Sales performs best at 20× your target CPA. Click to review.
            </p>
          </div>
        </button>
      )}
    </SectionCard>
  );
}

/**
 * Multi-caption A/B test field — matches TikTok's upgraded Smart+ ad
 * creation flow (the "Enter text for your ad" stack in the screenshot).
 * Up to 5 captions; the first is the primary `ad_text`, the rest are
 * sent as the `ad_texts` array on the creative payload.
 *
 * Each row has its own AI Fill button. TikTok's Smart+ creative engine
 * picks the highest-performing caption per impression.
 */
function MultiCaptionInputs({
  primary,
  variations,
  onPrimaryChange,
  onVariationsChange,
}: {
  primary: string;
  variations: string[];
  onPrimaryChange: (v: string) => void;
  onVariationsChange: (v: string[]) => void;
}) {
  // Up to 4 extra variations (5 captions total). 100 chars each.
  const MAX_EXTRAS = 4;

  // Always render exactly 5 slots: index 0 = primary, 1..4 = variations.
  // Empty trailing variations stay invisible; an "Add text" button reveals one more.
  const visibleExtras = Math.max(1, variations.filter((v, i) => v !== "" || i < variations.length).length);
  const totalRows = Math.min(MAX_EXTRAS + 1, 1 + Math.max(visibleExtras, variations.length || 1));

  const captions: string[] = [primary, ...variations];
  while (captions.length < totalRows) captions.push("");

  const fillTexts = [
    "Discover quality products at unbeatable prices. Shop now and enjoy fast shipping across the Kingdom.",
    "Limited-time offer — free delivery on orders over 200 SAR. Browse the full collection today.",
    "New arrivals just dropped. Find your next favorite piece before it's gone.",
    "Trusted by thousands of customers. Mada, Apple Pay, and COD accepted.",
    "Eid is around the corner. Get your gifts delivered in 24 hours across major cities.",
  ];

  const updateCaption = (idx: number, val: string) => {
    if (idx === 0) {
      onPrimaryChange(val);
    } else {
      const next = [...variations];
      while (next.length < idx) next.push("");
      next[idx - 1] = val;
      onVariationsChange(next);
    }
  };
  const removeCaption = (idx: number) => {
    if (idx === 0) {
      // The primary cannot be deleted — clear instead.
      onPrimaryChange("");
      return;
    }
    const next = variations.filter((_, i) => i !== idx - 1);
    onVariationsChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          Text <span className="text-destructive">*</span>
          <InfoTip text="Add up to 5 captions. TikTok's Smart+ creative engine picks the highest-performing variant per impression." />
        </Label>
        <span className="text-[10px] text-muted-foreground">{captions.filter((c) => c.trim()).length} of 5</span>
      </div>

      {captions.map((cap, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Input
              placeholder={idx === 0 ? "Enter text for your ad" : "Add another caption variation"}
              value={cap}
              maxLength={100}
              onChange={(e) => updateCaption(idx, e.target.value.slice(0, 100))}
              className={cn("h-10 pr-24 text-sm", cap.length >= 100 && "border-amber-400")}
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <AiFillButton
                onFill={() => updateCaption(idx, fillTexts[idx % fillTexts.length])}
                label="AI"
              />
              <span className="text-[10px] tabular-nums text-muted-foreground">{cap.length}/100</span>
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => removeCaption(idx)}
                  title="Remove caption"
                  className="rounded p-0.5 text-muted-foreground hover:text-red-600"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {totalRows < MAX_EXTRAS + 1 && (
        <button
          type="button"
          onClick={() => onVariationsChange([...variations, ""])}
          className="flex items-center gap-1.5 text-[11px] font-medium text-[#004956] transition-colors hover:text-[#003a44]"
        >
          <Plus className="size-3" />
          Add text
        </button>
      )}
    </div>
  );
}

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
    adTextVariations: [],
    onlyShowAsAds: true,
    displayName: "",
    callToAction: defaultCTA,
    landingPageUrl: "",
    sparkAdEnabled: format === "SPARK_AD",
    sparkAdAuthCode: "",
    sparkAuthCodes: [],
    sparkBulkInputMode: false,
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
  isAutoGenerated,
  objective,
  catalogEnabled,
}: {
  ads: TikTokAd[];
  totalCreatives: number;
  allChecks: { label: string; ok: boolean }[];
  passingChecks: number;
  isAutoGenerated: boolean;
  objective: string;
  catalogEnabled: boolean;
}) {
  const [showAllChecks, setShowAllChecks] = useState(false);
  const failingChecks = allChecks.filter((c) => !c.ok);
  const allPassed = passingChecks === allChecks.length && allChecks.length > 0;

  /* ── Best-practice signals ── */
  const bestPractices: { label: string; met: boolean; tip: string; metTip: string }[] = [];

  if (isAutoGenerated) {
    /* Catalog auto-generated: TikTok handles formats, but product set and CTA matter */
    bestPractices.push({
      label: "Product set selected",
      met: ads.length > 0 && (ads[0].landingPageUrl?.length > 0 || true),
      tip: "Use a focused product set instead of 'All Products' to improve ad relevance and ROAS",
      metTip: "Product selection configured",
    });
    bestPractices.push({
      label: "Landing page set",
      met: ads.length > 0 && !!ads[0].landingPageUrl,
      tip: "Set a landing page URL so users land on your store after clicking the ad",
      metTip: "Landing page configured",
    });
  } else {
    /* Manual ads: multiple ads, formats, A/B testing */
    const hasMultipleAds = ads.length >= 2;
    const hasVideoAd = ads.some((a) => a.adFormat === "SINGLE_VIDEO" || a.adFormat === "SPARK_AD");
    const hasImageAd = ads.some((a) => a.adFormat === "SINGLE_IMAGE" || a.adFormat === "CAROUSEL");
    const hasBothMediaTypes = hasVideoAd && hasImageAd;
    const hasMultipleFormats = new Set(ads.map((a) => a.adFormat)).size >= 2;

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

    bestPractices.push({
      label: "Video + Image ads",
      met: hasBothMediaTypes,
      tip: objective === "VIDEO_VIEWS"
        ? "Create one video ad and one image ad — video gets 3x more engagement, images provide broader reach"
        : "Create both a video ad and an image ad — video drives engagement while images extend your reach",
      metTip: "Both video and image ads included",
    });

    if (ads.length >= 2) {
      bestPractices.push({
        label: "Multiple formats",
        met: hasMultipleFormats,
        tip: "Mix formats (Single Video, Single Image, Carousel) to reach users in different placements",
        metTip: `${new Set(ads.map((a) => a.adFormat)).size} formats in use`,
      });
    }

    if (ads.length >= 2) {
      const hasDifferentCreatives = ads.some((a, i) =>
        i > 0 && (a.adText !== ads[0].adText || a.callToAction !== ads[0].callToAction)
      );
      bestPractices.push({
        label: "A/B testing",
        met: hasDifferentCreatives,
        tip: "Vary captions, CTAs, or visuals across ads to find what resonates best with your audience",
        metTip: "Different creatives across ads",
      });
    }
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
  multiVideoEnabled,
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
  /** Smart+ Sales multi-video upload: when true the SINGLE_VIDEO section
   *  allows uploading multiple videos (up to 10) — each becomes its own
   *  entry in creative_list[] on the Smart+ ad body so TikTok can A/B
   *  rotate across them. */
  multiVideoEnabled: boolean;
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
        id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: type as "VIDEO" | "IMAGE",
        url: URL.createObjectURL(file),
        file,
      };
      // Smart+ multi-video: append to creative_list[] (up to 10 videos per
      // ad). Otherwise classic single-asset slot — replace.
      if (multiVideoEnabled && ad.adFormat === "SINGLE_VIDEO") {
        const next = [...ad.assets, asset].slice(0, 10);
        onUpdate({ ...ad, assets: next });
      } else {
        onUpdate({ ...ad, assets: [asset] });
      }
    },
    [ad, onUpdate, multiVideoEnabled]
  );

  /** Smart+ multi-video: remove a single asset by id. */
  const removeAsset = useCallback(
    (assetId: string) => {
      onUpdate({ ...ad, assets: ad.assets.filter((a) => a.id !== assetId) });
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
      sparkAuthCodes: val === "SPARK_AD" ? (ad.sparkAuthCodes ?? []) : [],
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
            {(() => {
              const hasMedia = isSpark ? !!ad.sparkAdAuthCode : isCarousel ? cardCount >= 2 : assetCount > 0;
              return (
                <span className={cn("inline-block size-1.5 rounded-full", hasMedia ? "bg-emerald-500" : "bg-amber-400")} />
              );
            })()}
            {isSpark ? (
              <>
                <Badge variant="secondary" className="rounded-full bg-primary/10 px-1.5 py-0 text-xs font-semibold text-primary">Spark Ad</Badge>
                <span>{ad.sparkAdAuthCode ? "Authorized" : "Pending auth"}</span>
              </>
            ) : (
              <>
                <span>{getFormatLabel(ad.adFormat)}</span>
                <span>{"·"}</span>
                <span>{isCarousel ? `${cardCount} card${cardCount !== 1 ? "s" : ""}${hasMusic ? " + music" : ""}` : `${assetCount} creative${assetCount !== 1 ? "s" : ""}`}</span>
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
        <div className="flex flex-col gap-0 border-t border-border">

          {/* ── Ad Format (format picker) ── */}
          <div className="px-6 py-5">
            <p className="mb-1 text-xs font-bold text-foreground">Ad Format</p>
            <p className="mb-4 text-xs text-muted-foreground">
              Choose a format for this ad. You can add more ads in different formats.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AD_FORMAT_OPTIONS.filter((opt) => allowedFormats.includes(opt.value)).map((opt) => {
                const isSelected = ad.adFormat === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => changeFormat(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all",
                      isSelected
                        ? "border-[#a4ffe5] bg-[#e6fff9]"
                        : "border-border bg-card hover:border-[#a4ffe5] hover:bg-[#e6fff9]"
                    )}
                  >
                    <div className={cn(
                      "flex size-10 items-center justify-center rounded-full",
                      isSelected ? "bg-[#a4ffe5]" : "bg-muted/60"
                    )}>
                      <span className={cn("[&>svg]:size-5", isSelected ? "text-[#004956]" : "text-muted-foreground")}>
                        {opt.icon}
                      </span>
                    </div>
                    <p className={cn("text-xs font-bold", isSelected ? "text-[#004956]" : "text-foreground")}>{opt.label}</p>
                    <p className="hidden text-[10px] leading-snug text-muted-foreground sm:block">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video Views: video-only notice */}
          {isVideoViews && (
            <div className="border-t border-border px-6 py-4">
              <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5]/40 bg-[#e6fff9]/50 px-3 py-2.5">
                <Info className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                <p className="text-xs leading-relaxed text-[#004956]/80">
                  <span className="font-medium text-[#004956]">Video Views campaigns</span> only support video formats (Single Video and Spark Ads). Upload engaging vertical videos (9:16) to maximize view completion rates.
                </p>
              </div>
            </div>
          )}

          {/* ===== FORMAT-SPECIFIC CREATIVE SECTIONS ===== */}

          {/* ---- SPARK AD ---- */}
          {isSpark && (
            <div className="flex flex-col gap-0 border-t border-border">

              {/* ── Section 1: Link Type + CTA ── */}
              <div className="px-6 py-5">
                <LinkTypeSection
                  url={ad.landingPageUrl}
                  onUrlChange={(url) => onUpdate({ ...ad, landingPageUrl: url })}
                  cta={ad.callToAction}
                  onCtaChange={(v) => onUpdate({ ...ad, callToAction: v as TikTokCTA })}
                  recommendedCtas={RECOMMENDED_CTAS}
                  otherCtas={OTHER_CTAS}
                />
              </div>

              {/* ── Section 2: Authorization Code ──
                  Smart+ Sales (multiVideoEnabled=true): merchant can attach
                  multiple Spark posts to a single ad. Each code becomes its
                  own creative_list[] entry on the Smart+ ad body, so TikTok
                  rotates across organic posts inside one ad. UI offers two
                  input modes (rows / bulk paste) per user spec.
                  Classic (multiVideoEnabled=false): single auth code only. */}
              <div className="flex flex-col gap-4 border-t border-border px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3 text-primary" />
                      <Label className="text-sm font-medium text-foreground">Spark Ad Code{multiVideoEnabled ? "s" : ""}</Label>
                      {multiVideoEnabled && (
                        <Badge className="rounded-full bg-[#e6fff9] px-1.5 py-0 text-[10px] font-bold text-[#004956] hover:bg-[#e6fff9]">
                          up to 10
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {multiVideoEnabled
                        ? "Promote one or more existing TikTok posts. Each code links a separate organic video — TikTok rotates across them for the best result."
                        : "Promote an existing TikTok post. Paste the authorization code from the post owner below."}
                    </p>
                  </div>
                  {multiVideoEnabled && (
                    <button
                      type="button"
                      onClick={() => onUpdate({ ...ad, sparkBulkInputMode: !(ad.sparkBulkInputMode ?? false) })}
                      className={cn(
                        "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors",
                        ad.sparkBulkInputMode
                          ? "border-[#004956] bg-[#004956] text-white"
                          : "border-border bg-white text-muted-foreground hover:border-[#a4ffe5]"
                      )}
                    >
                      {ad.sparkBulkInputMode ? "Switch to rows" : "Bulk paste"}
                    </button>
                  )}
                </div>

                {multiVideoEnabled ? (
                  /* Smart+ multi-Spark — two interchangeable input modes. */
                  (ad.sparkBulkInputMode ?? false) ? (
                    /* Bulk paste mode: one code per line. Split + dedupe + cap at 10 on blur. */
                    <div className="flex flex-col gap-1">
                      <textarea
                        rows={6}
                        placeholder={"Paste one auth code per line…\n#TT0OFhYO...\nhttps://www.tiktok.com/@creator/video/7234567890123456789"}
                        defaultValue={(ad.sparkAuthCodes ?? []).join("\n")}
                        onBlur={(e) => {
                          const codes = e.target.value
                            .split(/\r?\n/)
                            .map((s) => s.trim())
                            .filter(Boolean);
                          const unique = Array.from(new Set(codes)).slice(0, 10);
                          onUpdate({ ...ad, sparkAuthCodes: unique, sparkAdAuthCode: unique[0] ?? "" });
                        }}
                        className="w-full resize-y rounded-lg border border-border bg-white px-3 py-2 font-mono text-xs leading-relaxed text-foreground focus:border-primary focus:outline-none"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        {(ad.sparkAuthCodes?.length ?? 0)}/10 codes · auto-deduped, trimmed, capped at 10. Click outside to save.
                      </p>
                    </div>
                  ) : (
                    /* Rows mode: per-row input, add/remove buttons. */
                    <div className="flex flex-col gap-2">
                      {((ad.sparkAuthCodes?.length ?? 0) === 0
                        ? [""]
                        : ad.sparkAuthCodes
                      ).map((code, idx) => (
                        <div key={`spark-row-${idx}`} className="flex items-center gap-2">
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/60 text-[10px] font-bold text-muted-foreground">
                            {idx + 1}
                          </div>
                          <Input
                            placeholder="Paste authorization code or post URL..."
                            value={code}
                            onChange={(e) => {
                              const list = [...(ad.sparkAuthCodes ?? [])];
                              while (list.length <= idx) list.push("");
                              list[idx] = e.target.value;
                              onUpdate({
                                ...ad,
                                sparkAuthCodes: list,
                                sparkAdAuthCode: list[0] ?? "",
                              });
                            }}
                            className="h-9 flex-1 font-mono text-xs"
                          />
                          {(ad.sparkAuthCodes?.length ?? 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const list = (ad.sparkAuthCodes ?? []).filter((_, i) => i !== idx);
                                onUpdate({
                                  ...ad,
                                  sparkAuthCodes: list,
                                  sparkAdAuthCode: list[0] ?? "",
                                });
                              }}
                              className="shrink-0 rounded-md p-1.5 text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                              title="Remove code"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {(ad.sparkAuthCodes?.length ?? 0) < 10 && (
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...(ad.sparkAuthCodes ?? []), ""];
                            onUpdate({ ...ad, sparkAuthCodes: list });
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-white px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-[#a4ffe5] hover:text-foreground"
                        >
                          <Plus className="size-3.5" />
                          Add another Spark code
                        </button>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Each code links one TikTok post. Private posts become public during promotion.
                      </p>
                    </div>
                  )
                ) : (
                  /* Classic single-Spark input. */
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
                )}

                {/* Warning / Success banner — driven by total code count. */}
                {(() => {
                  const codeCount = multiVideoEnabled
                    ? (ad.sparkAuthCodes ?? []).filter((c) => c.trim()).length
                    : (ad.sparkAdAuthCode.trim() ? 1 : 0);
                  if (codeCount === 0) {
                    return (
                      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
                        <AlertCircle className="size-3 shrink-0 text-amber-600" />
                        <span className="text-xs text-amber-700">
                          {multiVideoEnabled
                            ? "Add at least one Spark code to link this ad to a TikTok post."
                            : "Enter the authorization code to link this Spark Ad to a TikTok post"}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <p className="text-xs font-medium text-emerald-800">
                          {codeCount === 1
                            ? "Authorization code linked"
                            : `${codeCount} Spark posts linked — TikTok will rotate across them`}
                        </p>
                      </div>
                      <p className="mt-1 pl-5.5 text-[10px] text-emerald-600">
                        {codeCount === 1
                          ? "The post's video, caption, profile, and music will be used in your ad."
                          : "Each post brings its own video, caption, and music — Smart+ A/B-tests them in flight."}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* ── Advanced Options ── */}
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="flex w-full items-center justify-between px-6 py-2.5 text-sm font-medium text-foreground hover:text-foreground"
                >
                  <span>Advanced Options</span>
                  {advancedOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>

                {advancedOpen && (
                  <div className="flex flex-col gap-4 px-6 pb-4">
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
            <div className="flex flex-col gap-0 border-t border-border">

              {/* ── Link Type + CTA ── */}
              <div className="px-6 py-5">
                <LinkTypeSection
                  url={ad.landingPageUrl}
                  onUrlChange={(url) => onUpdate({ ...ad, landingPageUrl: url })}
                  cta={ad.callToAction}
                  onCtaChange={(v) => onUpdate({ ...ad, callToAction: v as TikTokCTA })}
                  recommendedCtas={RECOMMENDED_CTAS}
                  otherCtas={OTHER_CTAS}
                />
              </div>

              {/* Carousel image cards */}
              <div className="border-t border-border px-6 py-5">
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

              {/* ── Ad Copy — Smart+ multi-caption A/B testing ── */}
              <div className="border-t border-border px-6 py-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">Display Name</Label>
                    <AiFillButton onFill={() => onUpdate({ ...ad, displayName: "Salla Store" })} />
                  </div>
                  <div className="relative">
                    <Input placeholder="Your brand" value={ad.displayName} maxLength={20} onChange={(e) => onUpdate({ ...ad, displayName: e.target.value.slice(0, 20) })} className={cn("h-10 pr-14 text-sm", ad.displayName.length >= 20 && "border-amber-400")} />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">{ad.displayName.length}/20</span>
                  </div>
                </div>
                <MultiCaptionInputs
                  primary={ad.adText}
                  variations={ad.adTextVariations ?? []}
                  onPrimaryChange={(v) => onUpdate({ ...ad, adText: v })}
                  onVariationsChange={(v) => onUpdate({ ...ad, adTextVariations: v })}
                />
              </div>

              {/* ── Advanced Options ── */}
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="flex w-full items-center justify-between px-6 py-2.5 text-sm font-medium text-foreground hover:text-foreground"
                >
                  <span>Advanced Options</span>
                  {advancedOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>

                {advancedOpen && (
                  <div className="flex flex-col gap-4 px-6 pb-4">
                    <div className="flex flex-col gap-0 rounded-lg border border-border">
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
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ---- SINGLE VIDEO ---- */}
          {ad.adFormat === "SINGLE_VIDEO" && !isSpark && (
            <div className="flex flex-col gap-0 border-t border-border">

              {/* ── Section 1: Link Type + CTA ── */}
              {!isAppPromo ? (
                <div className="px-6 py-5">
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
                <div className="flex flex-col gap-4 px-6 py-5">
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
              <div className="border-t border-border px-6 py-5">
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                  <Film className="size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">
                    MP4/MOV · 9:16 recommended · 5-60s · max 500MB · H.264
                  </p>
                  {multiVideoEnabled ? (
                    <span className="ml-auto shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      Smart+ · up to 10 videos
                    </span>
                  ) : (
                    <span className="ml-auto shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Best Format</span>
                  )}
                </div>

                {multiVideoEnabled ? (
                  /* Smart+ multi-video grid — every uploaded asset becomes
                     a creative_list[] entry, and TikTok auto-rotates across
                     them for in-flight A/B testing. */
                  <div className="flex flex-col gap-3">
                    {ad.assets.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {ad.assets.map((asset, idx) => (
                          <div
                            key={asset.id}
                            className="group relative aspect-[9/16] overflow-hidden rounded-lg border border-border bg-black"
                          >
                            {asset.type === "VIDEO" ? (
                              <video src={asset.url} muted autoPlay loop playsInline className="size-full object-cover" />
                            ) : (
                              <img src={asset.url} alt={`Asset ${idx + 1}`} className="size-full object-cover" />
                            )}
                            <div className="pointer-events-none absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              V{idx + 1}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAsset(asset.id)}
                              className="absolute right-1.5 top-1.5 rounded-md bg-black/70 p-1 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                              title="Remove video"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {ad.assets.length < 10 && (
                      <UploadZone
                        accept="video/mp4,video/quicktime"
                        label={ad.assets.length === 0 ? "Drop video here" : "Add another video"}
                        sublabel={
                          ad.assets.length === 0
                            ? "MP4/MOV, 9:16 recommended, 5-60s, max 500MB"
                            : `${ad.assets.length}/10 uploaded · TikTok rotates across all videos`
                        }
                        onFile={handleFile}
                        libraryContext="VIDEO"
                      />
                    )}
                  </div>
                ) : (
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
                )}
              </div>

              {/* ── Section 2b: Background Music ── */}
              <div className="border-t border-border px-6 py-5">
                <div className="flex flex-col gap-0 rounded-lg border border-border">
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

              {/* ── Section 3: Ad Copy — Smart+ multi-caption ── */}
              <div className="border-t border-border px-6 py-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">Display Name</Label>
                    <AiFillButton onFill={() => onUpdate({ ...ad, displayName: "Salla Store" })} />
                  </div>
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
                <MultiCaptionInputs
                  primary={ad.adText}
                  variations={ad.adTextVariations ?? []}
                  onPrimaryChange={(v) => onUpdate({ ...ad, adText: v })}
                  onVariationsChange={(v) => onUpdate({ ...ad, adTextVariations: v })}
                />
              </div>

              {/* ── Advanced Options ── */}
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="flex w-full items-center justify-between px-6 py-2.5 text-sm font-medium text-foreground hover:text-foreground"
                >
                  <span>Advanced Options</span>
                  {advancedOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>

                {advancedOpen && (
                  <div className="flex flex-col gap-4 px-6 pb-4">
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
            <div className="flex flex-col gap-0 border-t border-border">

              {/* ── Section 1: Link Type + CTA ── */}
              <div className="px-6 py-5">
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
              <div className="border-t border-border px-6 py-5">
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
              </div>

              {/* ── Section 2b: Background Music ── */}
              <div className="border-t border-border px-6 py-5">
                <div className="flex flex-col gap-0 rounded-lg border border-border">
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

              {/* ── Section 3: Ad Copy — Smart+ multi-caption (Carousel) ── */}
              <div className="border-t border-border px-6 py-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">Display Name</Label>
                    <AiFillButton onFill={() => onUpdate({ ...ad, displayName: "Salla Store" })} />
                  </div>
                  <div className="relative">
                    <Input placeholder="Your brand" value={ad.displayName} maxLength={20} onChange={(e) => onUpdate({ ...ad, displayName: e.target.value.slice(0, 20) })} className={cn("h-10 pr-14 text-sm", ad.displayName.length >= 20 && "border-amber-400")} />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">{ad.displayName.length}/20</span>
                  </div>
                </div>
                <MultiCaptionInputs
                  primary={ad.adText}
                  variations={ad.adTextVariations ?? []}
                  onPrimaryChange={(v) => onUpdate({ ...ad, adText: v })}
                  onVariationsChange={(v) => onUpdate({ ...ad, adTextVariations: v })}
                />
              </div>

              {/* ── Advanced Options ── */}
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="flex w-full items-center justify-between px-6 py-2.5 text-sm font-medium text-foreground hover:text-foreground"
                >
                  <span>Advanced Options</span>
                  {advancedOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>

                {advancedOpen && (
                  <div className="flex flex-col gap-4 px-6 pb-4">
                    <div className="flex flex-col gap-0 rounded-lg border border-border">
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
                  </div>
                )}
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
/*  Catalog Product Selection — Sheet-based unified pattern             */
/*  Matches Snapchat DynamicAdConfig product set picker design system.  */
/* ------------------------------------------------------------------ */

/** Seasonal tag color map — matches Snapchat's dynamic-ad-config.tsx */
const SEASONAL_COLORS: Record<string, string> = {
  ramadan: "border-purple-200 bg-purple-50 text-purple-700",
  eid_fitr: "border-emerald-200 bg-emerald-50 text-emerald-700",
  eid_adha: "border-amber-200 bg-amber-50 text-amber-700",
  national_day: "border-green-200 bg-green-50 text-green-700",
  white_friday: "border-red-200 bg-red-50 text-red-700",
  year_end: "border-blue-200 bg-blue-50 text-blue-700",
  back_to_school: "border-orange-200 bg-orange-50 text-orange-700",
};

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
  const [showSheet, setShowSheet] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSets, setProductSets] = useState<SallaProductSet[]>([]);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<ProductSetCategory | "all">("all");

  // Fetch product sets on mount
  useEffect(() => {
    fetchProductSets("all").then(setProductSets);
  }, []);

  // Selected set from shared data
  const selectedSet = productSets.find((s) => s.id === objectiveConfig.productSetId);
  // Selected specific products
  const selectedProducts = PREVIEW_PRODUCTS.filter((p) => objectiveConfig.specificProductIds.includes(p.id));

  // Filter product sets based on tab + search
  const filteredSets = useMemo(() => {
    let sets = productSets;
    if (filterTab === "standard") sets = sets.filter((s) => !s.seasonalTag && !s.id.startsWith("ps_cat_"));
    else if (filterTab === "category") sets = sets.filter((s) => s.id.startsWith("ps_cat_"));
    else if (filterTab === "seasonal") sets = sets.filter((s) => !!s.seasonalTag);
    if (search.trim()) {
      const q = search.toLowerCase();
      sets = sets.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nameAr && s.nameAr.includes(q)) ||
        s.description.toLowerCase().includes(q)
      );
    }
    return sets;
  }, [productSets, filterTab, search]);

  const maxProductCount = Math.max(...productSets.map((s) => s.productCount), 1);

  const handleAddProducts = (products: SallaProduct[]) => {
    const ids = [...objectiveConfig.specificProductIds, ...products.map((p) => p.id)].slice(0, 20);
    updateNested("objective", { specificProductIds: ids, productSelectionMode: "SPECIFIC" });
  };

  const removeProduct = (id: string) => {
    const next = objectiveConfig.specificProductIds.filter((pid: string) => pid !== id);
    updateNested("objective", {
      specificProductIds: next,
      ...(next.length === 0 && { productSelectionMode: "ALL" }),
    });
  };

  const selectProductSet = (set: SallaProductSet) => {
    updateNested("objective", {
      productSelectionMode: "PRODUCT_SET",
      productSetId: set.id,
      specificProductIds: [],
    });
    setShowSheet(false);
  };

  const clearSelection = () => {
    updateNested("objective", {
      productSelectionMode: "ALL",
      productSetId: "",
      specificProductIds: [],
    });
  };

  const isAllProducts = objectiveConfig.productSelectionMode === "ALL";
  const isProductSet = objectiveConfig.productSelectionMode === "PRODUCT_SET" && !!selectedSet;
  const isSpecific = objectiveConfig.productSelectionMode === "SPECIFIC" && selectedProducts.length > 0;

  return (
    <>
      <SectionCard>
        <div className="mb-1 flex items-center gap-2">
          <Store className="size-4 text-primary" />
          <Label className="text-sm font-semibold text-foreground">Product Selection</Label>
          <InfoTip text="Choose which products to feature. By default, all products are included. You can narrow down to a product set or pick up to 20 individual products." />
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Select which products from your Salla catalog to include in this campaign.
        </p>

        {/* ── Current selection display ── */}
        {isAllProducts && !isSpecific && (
          <div className="flex flex-col gap-3">
            {/* All products confirmation */}
            <div className="flex items-start gap-2.5 rounded-xl border border-[#a4ffe5] bg-[#e6fff9] px-3 py-2.5">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
              <div>
                <p className="text-xs font-bold text-[#004956]">All 156 products included</p>
                <p className="mt-0.5 text-[11px] text-[#004956]/70">
                  TikTok will dynamically select the best products to show based on user behavior.
                </p>
              </div>
            </div>
            {/* Customize button */}
            <button
              type="button"
              onClick={() => setShowSheet(true)}
              className="group flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-5 text-muted-foreground transition-all hover:border-[#a4ffe5] hover:bg-[#e6fff9]/30 hover:text-foreground"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-muted/60 transition-colors group-hover:bg-[#a4ffe5]/40">
                <Package className="size-5 transition-colors group-hover:text-[#004956]" />
              </div>
              <span className="text-xs font-medium">Customize Product Selection</span>
              <span className="text-[10px] text-muted-foreground">
                Choose a product set or pick specific products
              </span>
            </button>
          </div>
        )}

        {/* ── Selected Product Set display ── */}
        {isProductSet && selectedSet && (
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {/* Preview images — 4 equal columns */}
              {selectedSet.previewImages && selectedSet.previewImages.length > 0 && (
                <div className="grid grid-cols-4 gap-px bg-border">
                  {selectedSet.previewImages.slice(0, 4).map((img, i) => (
                    <div key={i} className="aspect-[4/3] overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="size-full object-cover" crossOrigin="anonymous" />
                    </div>
                  ))}
                  {selectedSet.previewImages.length < 4 &&
                    Array.from({ length: 4 - selectedSet.previewImages.length }).map((_, i) => (
                      <div key={`ph-${i}`} className="flex aspect-[4/3] items-center justify-center bg-muted/40">
                        <ImageIcon className="size-4 text-muted-foreground/20" />
                      </div>
                    ))}
                </div>
              )}
              {/* Info row */}
              <div className="flex items-center gap-3 rounded-b-xl border-t border-[#a4ffe5]/50 bg-[#e6fff9]/60 px-4 py-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#004956] text-white">
                  <Package className="size-4.5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#004956]">{selectedSet.nameAr || selectedSet.name}</span>
                    {selectedSet.autoRefresh && <RefreshCw className="size-3 text-emerald-500" />}
                    {selectedSet.seasonalTag && (
                      <Badge variant="outline" className={cn("shrink-0 rounded-full px-1.5 py-0 text-[9px] font-medium capitalize", SEASONAL_COLORS[selectedSet.seasonalTag] ?? "bg-muted text-muted-foreground")}>
                        {selectedSet.seasonalTag.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-[#004956]/60">
                    {selectedSet.productCount} products{selectedSet.autoRefresh ? " · Auto-refreshing" : ""}
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowSheet(true)} className="h-8 gap-1.5 rounded-full border-[#004956]/20 bg-white px-4 text-xs font-medium text-[#004956] hover:bg-[#004956]/5">
                  Change
                </Button>
                <button type="button" onClick={clearSelection} className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Selected Specific Products display ── */}
        {isSpecific && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full bg-[#e6fff9] px-2 py-0.5 text-[10px] font-bold text-[#004956]">
                  {selectedProducts.length} of 20
                </Badge>
                <span className="text-xs text-muted-foreground">products selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedProducts.length < 20 && (
                  <Button size="sm" variant="outline" onClick={() => setShowProductPicker(true)} className="h-7 gap-1 text-xs">
                    <Plus className="size-3" />
                    Add
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={clearSelection} className="h-7 text-xs text-muted-foreground hover:text-destructive">
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {selectedProducts.map((p) => (
                <div key={p.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} className="size-full object-cover" crossOrigin="anonymous" />
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
                    <p className="text-[10px] font-semibold text-primary">{p.price} {p.currency}</p>
                  </div>
                </div>
              ))}
              {selectedProducts.length < 20 && (
                <button
                  type="button"
                  onClick={() => setShowProductPicker(true)}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-[#a4ffe5] hover:text-[#004956]"
                >
                  <Plus className="size-5" />
                  <span className="text-[10px] font-medium">Add More</span>
                </button>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      {/* The old "Template Options" card lived here and offered four switches +
          a "Product landing page" dropdown. All five controls were uncontrolled
          (defaultChecked / defaultValue), none flowed into api-payload.ts, and
          the TikTok Marketing API does not accept per-ad overrides for any of
          them in CATALOG_LISTING_ADS:
            • price / sale-badge / shipping tags → controlled by the catalog feed
            • caption text → auto-generated from feed
            • product landing page → locked to feed's `link` column
          We removed the entire card to avoid implying overrides that TikTok
          will silently ignore. */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/*  Product Selection Sheet (matches Snapchat DynamicAdConfig)      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]">

          {/* ── Branded header ── */}
          <div className="bg-[#004956] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <ShoppingBag className="size-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-white">Product Selection</SheetTitle>
                <p className="mt-0.5 text-xs text-white/70">
                  Choose a product set or pick individual products for your campaign.
                </p>
              </div>
            </div>
          </div>

          {/* ── Search + Filter bar ── */}
          <div className="flex flex-col gap-3 border-b border-border bg-white px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search product sets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 rounded-full border-border bg-muted/40 pl-9 text-xs focus-visible:ring-[#a4ffe5]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
            {/* Filter tabs */}
            <div className="flex gap-1.5 overflow-x-auto">
              {([
                { key: "all" as const, label: "All", icon: <Layers className="size-3" /> },
                { key: "standard" as const, label: "Smart", icon: <TrendingUp className="size-3" /> },
                { key: "category" as const, label: "Category", icon: <Tag className="size-3" /> },
                { key: "seasonal" as const, label: "Seasonal", icon: <CalendarDays className="size-3" /> },
              ]).map((tab) => {
                const count = tab.key === "all"
                  ? productSets.length
                  : tab.key === "standard"
                    ? productSets.filter((s) => !s.seasonalTag && !s.id.startsWith("ps_cat_")).length
                    : tab.key === "category"
                      ? productSets.filter((s) => s.id.startsWith("ps_cat_")).length
                      : productSets.filter((s) => !!s.seasonalTag).length;
                const active = filterTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilterTab(tab.key)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
                      active
                        ? "bg-[#a4ffe5] text-[#004956] shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                    <span className={cn("tabular-nums", active ? "text-[#004956]/70" : "text-muted-foreground/60")}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Scrollable product set list ── */}
          <div className="flex-1 overflow-y-auto bg-[#f8f8f8] px-4 py-3">
            <div className="flex flex-col gap-2">
              {/* Tip banner */}
              {!objectiveConfig.productSetId && filterTab === "all" && !search && (
                <div className="mb-1 flex items-start gap-2.5 rounded-xl border border-[#a4ffe5] bg-[#e6fff9] px-3 py-2.5">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                  <p className="text-[11px] font-medium leading-relaxed text-[#004956]">
                    Start with &ldquo;Best Sellers&rdquo; or &ldquo;On Sale&rdquo; — they typically have the highest conversion rates for catalog ads.
                  </p>
                </div>
              )}

              {/* "Pick Individual Products" option — always at top */}
              <button
                type="button"
                onClick={() => {
                  setShowSheet(false);
                  setTimeout(() => setShowProductPicker(true), 200);
                }}
                className="group flex items-center gap-3 rounded-2xl border border-white bg-white px-3 py-3 text-left shadow-sm transition-all hover:border-[#a4ffe5] hover:shadow-md"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f4f4f4] text-muted-foreground transition-colors group-hover:bg-[#e6fff9] group-hover:text-[#004956]">
                  <Tag className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-xs font-bold text-foreground">Pick Individual Products</p>
                  <p className="text-[11px] text-muted-foreground">Choose up to 20 specific products from your catalog</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-[#004956]" />
              </button>

              {/* Divider */}
              <div className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-medium text-muted-foreground">Product Sets</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Product set cards */}
              {filteredSets.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Package className="size-8 text-muted-foreground/30" />
                  <p className="text-xs font-medium text-muted-foreground">No product sets found</p>
                  <p className="text-[10px] text-muted-foreground/70">Try a different search or filter</p>
                </div>
              ) : (
                filteredSets.map((set) => {
                  const isSelected = objectiveConfig.productSetId === set.id;
                  const isEmpty = set.productCount === 0;
                  const barWidth = Math.max((set.productCount / maxProductCount) * 100, 2);
                  const isRecommended = !objectiveConfig.productSetId && (set.id === "ps_best" || set.id === "ps_sale");

                  return (
                    <button
                      key={set.id}
                      type="button"
                      onClick={() => !isEmpty && selectProductSet(set)}
                      disabled={isEmpty}
                      className={cn(
                        "group flex flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition-all",
                        isEmpty
                          ? "cursor-not-allowed border-border bg-white opacity-50"
                          : isSelected
                            ? "border-[#a4ffe5] bg-[#e6fff9] shadow-md"
                            : "border-white bg-white hover:border-[#a4ffe5] hover:shadow-md"
                      )}
                    >
                      {/* Preview images */}
                      {set.previewImages && set.previewImages.length > 0 ? (
                        <div className="flex h-[72px] gap-px overflow-hidden rounded-t-2xl">
                          {set.previewImages.slice(0, 4).map((img, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={img} alt="" className="h-full flex-1 object-cover transition-transform duration-300 group-hover:scale-105" crossOrigin="anonymous" />
                          ))}
                          {set.previewImages.length < 4 &&
                            Array.from({ length: 4 - set.previewImages.length }).map((_, i) => (
                              <div key={`ph-${i}`} className="flex h-full flex-1 items-center justify-center bg-muted/30">
                                <ImageIcon className="size-3 text-muted-foreground/20" />
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="flex h-12 items-center justify-center gap-3 rounded-t-2xl bg-muted/20">
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="flex size-7 items-center justify-center rounded-lg bg-muted/50">
                              <ImageIcon className="size-3 text-muted-foreground/25" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Card body */}
                      <div className="flex items-center gap-3 px-3 py-3">
                        {/* Left icon */}
                        <div className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                          isSelected
                            ? "bg-[#004956] text-white"
                            : "bg-[#f4f4f4] text-muted-foreground group-hover:bg-[#e6fff9] group-hover:text-[#004956]"
                        )}>
                          {set.seasonalTag ? <Sparkles className="size-4" /> : set.autoRefresh ? <TrendingUp className="size-4" /> : <Package className="size-4" />}
                        </div>

                        {/* Center */}
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className={cn("truncate text-xs font-bold", isSelected ? "text-[#004956]" : "text-foreground")}>
                              {set.nameAr || set.name}
                            </p>
                            {isRecommended && (
                              <span className="shrink-0 rounded-full bg-[#004956] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                                Recommended
                              </span>
                            )}
                            {set.seasonalTag && (
                              <Badge variant="outline" className={cn("shrink-0 rounded-full px-1.5 py-0 text-[9px] font-medium capitalize", SEASONAL_COLORS[set.seasonalTag] ?? "bg-muted text-muted-foreground")}>
                                {set.seasonalTag.replace(/_/g, " ")}
                              </Badge>
                            )}
                          </div>
                          <p className="line-clamp-1 text-[11px] text-muted-foreground">
                            {set.descriptionAr || set.description}
                          </p>
                          {/* Product count bar */}
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted/40">
                              <div
                                className={cn("h-full rounded-full transition-all", isSelected ? "bg-[#004956]" : isEmpty ? "bg-red-300" : "bg-[#a4ffe5]")}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <span className={cn("shrink-0 text-[11px] font-bold tabular-nums", isSelected ? "text-[#004956]" : isEmpty ? "text-red-400" : "text-muted-foreground")}>
                              {set.productCount}
                            </span>
                            {set.autoRefresh && (
                              <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600">
                                <RefreshCw className="size-2.5" /> Auto
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right indicator */}
                        {isSelected ? (
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#004956]">
                            <Check className="size-3.5 text-white" />
                          </div>
                        ) : (
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-[#004956]" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between border-t border-border bg-white px-5 py-3">
            <p className="text-[11px] text-muted-foreground">
              {filteredSets.length} of {productSets.length} sets shown
            </p>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
              <RefreshCw className="size-3" />
              Synced from Salla store
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Specific Products Picker (shared component) ── */}
      <ProductPickerDialog
        open={showProductPicker}
        onOpenChange={setShowProductPicker}
        existingProductNames={selectedProducts.map((p) => p.name)}
        maxProducts={20 - selectedProducts.length}
        onAddProducts={handleAddProducts}
      />
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

  // Phase 4: Instant Forms must be created separately via TikTok's
  // POST /page/lead_gen/create/ endpoint, which returns a page_id. The ad
  // group then references that page_id. This handler simulates the save
  // (mock page_id). Real integration hits /api/tiktok/lead-form (TODO route).
  const canSaveForm =
    !!form.companyName.trim()
    && !!form.privacyPolicyUrl
    && form.privacyPolicyUrl.startsWith("https://")
    && form.personalInfoFields.length > 0;

  const saveForm = async () => {
    if (!canSaveForm || form.createStatus === "saving") return;
    updateForm({ createStatus: "saving", createError: "" });
    try {
      // TODO(Phase 4 backend): replace with fetch("/api/tiktok/lead-form", ...)
      // that proxies POST /page/lead_gen/create/ with the BC access token.
      await new Promise((r) => setTimeout(r, 800));
      const mockPageId = `form_${Date.now().toString(36)}`;
      updateForm({
        pageId: mockPageId,
        createStatus: "saved",
        createError: "",
      });
    } catch (e) {
      updateForm({
        createStatus: "error",
        createError: e instanceof Error ? e.message : "Form save failed",
      });
    }
  };

  // Editing any form field invalidates the previous save (a new page_id
  // must be generated because TikTok pages are effectively immutable).
  const formFingerprint = JSON.stringify({
    t: form.formTemplate, i: form.formType,
    h: form.headline, d: form.description,
    q: form.questions, p: form.personalInfoFields,
    c: form.companyName, u: form.privacyPolicyUrl,
    th: form.thankYouHeadline, td: form.thankYouDescription,
    tb: form.thankYouButtonText, tu: form.thankYouUrl,
  });
  const lastSavedFingerprintRef = useRef<string | null>(null);
  useEffect(() => {
    if (form.createStatus === "saved") {
      if (lastSavedFingerprintRef.current === null) {
        lastSavedFingerprintRef.current = formFingerprint;
      } else if (lastSavedFingerprintRef.current !== formFingerprint) {
        updateForm({ createStatus: "unsaved", pageId: "" });
        lastSavedFingerprintRef.current = null;
      }
    } else if (form.createStatus === "unsaved") {
      lastSavedFingerprintRef.current = null;
    }
  }, [formFingerprint, form.createStatus]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* Phase 4: Save Form to TikTok (produces the page_id referenced by the ad group) */}
      <SectionCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              form.createStatus === "saved" ? "bg-emerald-100 text-emerald-600"
                : form.createStatus === "error" ? "bg-red-100 text-red-600"
                : form.createStatus === "saving" ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {form.createStatus === "saving" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : form.createStatus === "saved" ? (
                <CheckCircle2 className="size-4" />
              ) : form.createStatus === "error" ? (
                <AlertCircle className="size-4" />
              ) : (
                <SaveIcon className="size-4" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Save Form to TikTok</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {form.createStatus === "saved"
                  ? <>Saved. Page ID: <span className="font-mono text-foreground">{form.pageId}</span></>
                  : form.createStatus === "error"
                    ? <span className="text-red-600">{form.createError || "Save failed. Try again."}</span>
                    : form.createStatus === "saving"
                      ? "Creating the form on TikTok…"
                      : "The ad group references your form by ID — save it before launching the campaign."}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant={form.createStatus === "saved" ? "outline" : "default"}
            disabled={!canSaveForm || form.createStatus === "saving"}
            onClick={saveForm}
          >
            {form.createStatus === "saved" ? "Re-save form" : form.createStatus === "saving" ? "Saving…" : "Save form"}
          </Button>
        </div>
        {!canSaveForm && form.createStatus !== "saved" && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <AlertCircle className="mt-0.5 size-3 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-700">
              Set the company name, privacy policy URL (https://), and at least one personal info field before saving.
            </p>
          </div>
        )}
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
  // Narrow allowed formats. Four rules in priority order:
  //   1) VSA + dynamic_format → Single Video + Spark only (TikTok auto-
  //      rotates the format presentations from the merchant video).
  //   2) Search Ads → Spark + Carousel only (per Search Ads docs).
  //   3) Smart+ Sales WITHOUT catalog → Single Video + Spark only. The
  //      Smart+ Web Campaigns docs don't list Single Image or Carousel.
  //   4) Smart+ Sales WITH catalog VSA non-dynamic → all 4 formats. TikTok
  //      catalog ads explicitly support Single Video, Single Image, and
  //      Carousel as base creatives (with product cards attached). This is
  //      the case that was previously being over-narrowed.
  //   5) CLA → no picker (rendered separately, never hits this list).
  // Otherwise: full set from apiConfig.allowedAdFormats.
  const rawAllowedFormats = apiConfig.allowedAdFormats;
  const isVsaDynamic = campaign.objective.catalogEnabled
    && campaign.objective.shoppingAdsType === "VIDEO_SHOPPING_ADS"
    && campaign.objective.dynamicFormat;
  const isCatalogVsa = campaign.objective.catalogEnabled
    && campaign.objective.shoppingAdsType === "VIDEO_SHOPPING_ADS";
  const searchAdsOn = campaign.objective.searchAdsEnabled === true
    && campaign.objective.objective === "PRODUCT_SALES";
  const smartPlusSalesNoCatalog = campaign.objective.smartPlus.enabled
    && campaign.objective.objective === "PRODUCT_SALES"
    && !searchAdsOn
    && !isCatalogVsa;
  // Scenario matrix — drives format narrowing.
  //   A (Smart+ default, no catalog/search) → Single Video + Spark only
  //   B (Smart+ Catalog)                     → Carousel ONLY. Standard
  //                                            videos drop — visuals are
  //                                            generated from the product
  //                                            feed at delivery time.
  //   C (Classic Search Ads)                 → Spark + Carousel
  //   D (BLOCKED)                            → blocker banner; formats
  //                                            still computed for layout
  //                                            but Next is disabled.
  const scenario = getSalesScenario(campaign);
  const allowedFormats: TikTokAdFormat[] =
    scenario.isSmartPlusCatalog
      // Scenario B — TikTok auto-renders the carousel from the feed.
      // Single Video / Single Image would be ignored. Spark is meaningless
      // because the creative is feed-driven, not post-driven.
      ? rawAllowedFormats.filter((f) => f === "CAROUSEL")
    : isVsaDynamic
      ? rawAllowedFormats.filter((f) => f === "SINGLE_VIDEO" || f === "SPARK_AD")
    : searchAdsOn
      // Scenario C — Search inventory accepts the merchant's own video
      // post (Spark) or a 2-slide carousel for product highlights.
      ? rawAllowedFormats.filter((f) => f === "SPARK_AD" || f === "CAROUSEL")
    : smartPlusSalesNoCatalog
      // Scenario A — Smart+ Web non-catalog narrows to Video + Spark per
      // TikTok docs (no Single Image, no manual Carousel).
      ? rawAllowedFormats.filter((f) => f === "SINGLE_VIDEO" || f === "SPARK_AD")
      : rawAllowedFormats;
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

  /** Copy Display Name, Caption, CTA, and Landing Page URL from the active ad to all others */
  const applyToAll = () => {
    if (!activeAd || ads.length < 2) return;
    const { displayName, adText, callToAction, landingPageUrl } = activeAd;
    updateNested("creative", {
      ads: ads.map((a) =>
        a.id === activeAd.id ? a : { ...a, displayName, adText, callToAction, landingPageUrl }
      ),
    });
  };

  const totalCreatives = ads.reduce((sum, a) => sum + (a.adFormat === "CAROUSEL" ? a.carouselCards.length : a.assets.length), 0);
  const activeAdFormat = activeAd?.adFormat ?? "SINGLE_VIDEO";
  const isCatalogListing = catalogEnabled && objectiveConfig.shoppingAdsType === "CATALOG_LISTING_ADS";

  /* Auto-create a placeholder ad for CLA only. VSA + dynamic_format still
     requires a merchant-uploaded base video — TikTok only auto-rotates
     between format *presentations*; it doesn't auto-generate the source
     creative. So VSA+dynamic uses the standard upload flow with a narrowed
     format picker (video/spark only). */
  const needsAutoAd = isCatalogListing;
  const prevNeedsAutoAd = useRef(needsAutoAd);
  useEffect(() => {
    if (needsAutoAd && ads.length === 0) {
      const catalogAd = makeDefaultAd("SINGLE_VIDEO", 0);
      catalogAd.name = isCatalogListing ? "Catalog Listing Ad" : "Dynamic Ad";
      updateNested("creative", { ads: [catalogAd] });
    }
    if (!needsAutoAd && prevNeedsAutoAd.current) {
      // Remove ads that are empty placeholders (no assets, no ad text, no auth code)
      const cleaned = ads.filter((a) =>
        a.assets.length > 0
        || a.adText.trim().length > 0
        || a.sparkAdAuthCode.trim().length > 0
        || (a.sparkAuthCodes ?? []).some((c) => c.trim().length > 0)
        || a.carouselCards.length > 0
      );
      if (cleaned.length !== ads.length) {
        updateNested("creative", { ads: cleaned });
      }
    }
    prevNeedsAutoAd.current = needsAutoAd;
  }, [needsAutoAd]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scenario B (Smart+ Catalog) sync: when the merchant flips the catalog
  // toggle ON mid-flow, any existing SINGLE_VIDEO / SINGLE_IMAGE / SPARK_AD
  // ads need to be reshaped to CAROUSEL — that's the only valid creative
  // surface in catalog mode (the visual is feed-driven). We rewrite the
  // adFormat in place; merchant assets are preserved for safekeeping but
  // ignored by the catalog payload at submit time.
  useEffect(() => {
    if (!scenario.isSmartPlusCatalog) return;
    const needsReshape = ads.some((a) => a.adFormat !== "CAROUSEL");
    if (!needsReshape) return;
    updateNested("creative", {
      ads: ads.map((a) =>
        a.adFormat === "CAROUSEL"
          ? a
          : { ...a, adFormat: "CAROUSEL" as TikTokAdFormat, sparkAdEnabled: false }
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.isSmartPlusCatalog]);

  /* Validation */
  const allChecks: { label: string; ok: boolean }[] = [];
  allChecks.push({ label: "Identity: TikTok account linked", ok: identity.linkStatus === "confirmed" && !!identity.identityId });

  // Only CLA truly auto-generates (no merchant creative). VSA+dynamic still
  // needs a base video upload — it's validated through the standard ad checks.
  const isAutoGenerated = isCatalogListing;

  if (isAutoGenerated) {
    // Auto-generated creatives (Catalog Listing or Video Shopping + Dynamic Format): no manual uploads needed
    allChecks.push({ label: "Catalog connected", ok: !!campaign.objective.catalogId });
    allChecks.push({ label: "Products selected", ok: objectiveConfig.productSelectionMode !== "SPECIFIC" || objectiveConfig.specificProductIds.length > 0 });
    if (isCatalogListing && ads[0]) {
      // CLA still requires merchant-provided caption text (ad_text). TikTok
      // auto-generates the visual only — the caption above it is your job.
      allChecks.push({ label: "Caption text", ok: ads[0].adText.trim().length > 0 });
    }
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
        // Multi-Spark valid when ANY code (legacy or array) is filled.
        const hasAnySparkCode =
          !!ad.sparkAdAuthCode.trim()
          || (ad.sparkAuthCodes ?? []).some((c) => c.trim().length > 0);
        allChecks.push({ label: `Ad ${i + 1}: auth code`, ok: hasAnySparkCode });
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

          {/* Scenario D blocker — Catalog + Search Ads combination is
              unbuildable. Renders only when both toggles are on. */}
          <ScenarioDBlocker />

          {/* Scenario B (Smart+ Catalog) — surface the creative-step
              implications: standard videos are dropped, the visual is
              auto-rendered from the merchant's product feed as a dynamic
              carousel. This is a one-liner note since the format picker
              has already been narrowed to Carousel only. */}
          {scenario.isSmartPlusCatalog && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#a4ffe5] bg-[#e6fff9]/60 p-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-[#004956]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#004956]">
                  Catalog mode — creative is auto-generated from your feed
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-[#004956]/80">
                  TikTok renders a dynamic carousel per impression from your linked product set. Standard video uploads are skipped in this mode — focus on caption, CTA, and the product set selection below.
                </p>
              </div>
            </div>
          )}

          {/* Scenario C (Classic Search Ads) — surface the inventory
              switch. Spark + Carousel are the only valid creative shapes
              for the Search Result Page. */}
          {scenario.isClassicSearch && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-700" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  Search Ads mode — Classic schema active
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-amber-800/90">
                  Search inventory accepts only Spark posts or 2-slide product carousels. Your campaign now uses TikTok&apos;s classic ad-group endpoint with <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">placement_type=&quot;PLACEMENT_SEARCH&quot;</code> and the keywords you defined in the Audience step.
                </p>
              </div>
            </div>
          )}

          {/* ---- TikTok Identity ---- */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <p className="text-sm font-bold text-foreground">Your TikTok account</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your TikTok profile will appear in the advertisement, and it is advisable to match it with your store name.
                </p>
              </div>
              <Switch checked={identity.linkStatus === "confirmed" && !!identity.identityId} disabled />
            </div>

            {identity.linkStatus === "confirmed" && identity.identityId ? (
              <div className="border-t border-border px-6 py-4">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-foreground">
                    {identity.avatarPreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={identity.avatarPreviewUrl} alt="" className="size-8 rounded-lg object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="size-4 text-background" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.83 4.83 0 0 1-1-.15z"/>
                      </svg>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {identity.tiktokUsername || identity.displayName || "TikTok Account"}
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="border-t border-border px-6 py-4">
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3">
                  <AlertCircle className="size-4 shrink-0 text-amber-500" />
                  <p className="text-xs text-amber-700">
                    No TikTok account connected.{" "}
                    <button type="button" onClick={() => setStep(0)} className="font-medium underline">Set it up in Campaign Setup</button>
                  </p>
                </div>
              </div>
            )}

            {/* Custom-identity deprecation note + Only-show-as-ads toggle.
                Matches TikTok's upgraded Smart+ ad creation flow exactly:
                merchants can no longer use a "custom identity" (brand name
                only); a real TikTok account is required for ad delivery.
                Only-show-as-ads ON means ads run as in-feed only, not on
                the creator's public profile. */}
            {ads[0] && (
              <div className="border-t border-border px-6 py-4 flex flex-col gap-3">
                <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5] bg-[#e6fff9]/60 p-3">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                  <p className="text-[11px] leading-snug text-foreground/80">
                    <strong className="text-[#004956]">Custom identity is no longer supported.</strong> Using a TikTok account maximizes ad engagement and helps people find and engage with your brand.
                  </p>
                </div>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={ads[0].onlyShowAsAds !== false}
                    onChange={(e) => updateAd(ads[0].id, { ...ads[0], onlyShowAsAds: e.target.checked })}
                    className="mt-0.5 size-4 cursor-pointer accent-[#004956]"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">Only show as ads</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      Publish your posts as ads only. Otherwise, they will appear on your TikTok profile for anyone to see and engage with.
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

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
                  {/* Ordered least → most restrictive so merchants read it as a
                      severity scale. All four values are real TikTok API
                      brand_safety_type enums (NO_BRAND_SAFETY, EXPANDED_INVENTORY,
                      STANDARD_INVENTORY, LIMITED_INVENTORY). */}
                  {([
                    { value: "NO_BRAND_SAFETY" as const,   label: "Full Inventory",     desc: "Ads can appear next to all TikTok content for maximum reach.", tradeoff: "Largest audience · minimal filtering" },
                    { value: "EXPANDED_INVENTORY" as const, label: "Expanded Inventory", desc: "Excludes only explicitly inappropriate content.",              tradeoff: "Broad reach · light filtering" },
                    { value: "STANDARD_INVENTORY" as const, label: "Standard Inventory", desc: "Appropriate for most brands.",                                  tradeoff: "Balanced safety and reach", recommended: true },
                    { value: "LIMITED_INVENTORY" as const,  label: "Limited Inventory",  desc: "Strictest — excludes any content with mature themes.",         tradeoff: "Greatest safety · smaller audience" },
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

                {cr.placementType === "PLACEMENT_TYPE_NORMAL" && (() => {
                  // Phase 6 fix: filter the placement options to the ones the
                  // active objective actually supports.
                  const allowedPlacements = new Set(getAllowedPlacements(campaign.objective.objective));
                  const allPlacements = [
                    { id: "PLACEMENT_TIKTOK" as const, label: "TikTok", desc: "Main TikTok feed (For You page)", required: true },
                    { id: "PLACEMENT_PANGLE" as const, label: "Pangle", desc: "TikTok Audience Network (third-party apps)", required: false },
                    { id: "PLACEMENT_GLOBAL_APP_BUNDLE" as const, label: "Global App Bundle", desc: "Ads across TikTok-owned apps (CapCut, Fizzo, etc.)", required: false },
                  ];
                  const hiddenPlacements = allPlacements.filter((p) => !allowedPlacements.has(p.id));
                  const visiblePlacements = allPlacements.filter((p) => allowedPlacements.has(p.id));
                  return (
                    <div className="mt-4">
                      <div className="rounded-lg bg-blue-50 px-4 py-3 mb-3">
                        <p className="text-xs text-blue-700">
                          Select your placements. TikTok is always required.
                          {visiblePlacements.length > 1 && " Toggle the other placements on or off."}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border divide-y divide-border">
                        {visiblePlacements.map((pos) => {
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
                                    const current = cr.placements ?? ["PLACEMENT_TIKTOK"];
                                    const next = checked
                                      ? Array.from(new Set([...current, pos.id]))
                                      : current.filter((p) => p !== pos.id);
                                    updateNested("creative", { placements: next });
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {hiddenPlacements.length > 0 && (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {hiddenPlacements.map((p) => p.label).join(", ")} not available for this objective.
                        </p>
                      )}
                    </div>
                  );
                })()}
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

          {/* ---- Catalog Settings (when catalog enabled in step 0) ---- */}
          {catalogEnabled && (
            <div className="flex flex-col gap-4">
              {/* Shopping Ad Type */}
              <SectionCard>
                <div className="mb-3 flex items-center gap-2">
                  <Tag className="size-4 text-[#004956]" />
                  <Label className="text-sm font-semibold text-foreground">Shopping Ad Type</Label>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {([
                    {
                      value: "VIDEO_SHOPPING_ADS" as const,
                      label: "Video Shopping",
                      desc: "Creative + Catalog. You upload videos/images; products attach as interactive cards.",
                    },
                    {
                      value: "CATALOG_LISTING_ADS" as const,
                      label: "Catalog Listing",
                      desc: "Catalog only. TikTok auto-generates the visual from your product images — you provide the caption and CTA.",
                    },
                  ]).map((sat) => {
                    const sel = objectiveConfig.shoppingAdsType === sat.value;
                    return (
                      <button
                        key={sat.value}
                        type="button"
                        onClick={() => updateNested("objective", { shoppingAdsType: sat.value })}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all",
                          sel
                            ? "border-[#a4ffe5] bg-[#e6fff9]"
                            : "border-border bg-card hover:border-[#a4ffe5] hover:bg-[#e6fff9]/40"
                        )}
                      >
                        <div className={cn(
                          "flex size-5 items-center justify-center rounded-full border-2 transition-colors",
                          sel ? "border-[#004956] bg-[#004956]" : "border-muted-foreground/30"
                        )}>
                          {sel && <div className="size-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1">
                          <p className={cn("text-xs font-bold", sel ? "text-[#004956]" : "text-foreground")}>{sat.label}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{sat.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Dynamic Creative Format — only for Video Shopping (Catalog Listing is always dynamic) */}
              {objectiveConfig.shoppingAdsType === "VIDEO_SHOPPING_ADS" && (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">Dynamic Creative Format</p>
                        <Badge variant="secondary" className="rounded-full bg-[#e6fff9] px-1.5 py-0 text-[9px] font-semibold text-[#004956]">
                          Optional
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {objectiveConfig.dynamicFormat
                          ? "You upload a base video. TikTok auto-rotates between Catalog Video, Single Video, and Carousel format presentations per viewer to find the highest-performing variant."
                          : "You upload your own creative — Single Video, Single Image, Carousel, or Spark Ad. Products from your catalog attach as interactive cards beneath."}
                      </p>
                    </div>
                    <Switch
                      checked={objectiveConfig.dynamicFormat}
                      onCheckedChange={(checked) => updateNested("objective", { dynamicFormat: checked })}
                    />
                  </div>
                  {objectiveConfig.dynamicFormat && (
                    <div className="border-t border-border bg-[#e6fff9]/40 px-5 py-3 flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                        <p className="text-[11px] leading-relaxed text-[#004956]/80">
                          With dynamic format on, the upload section below is narrowed to <strong>Single Video</strong> and <strong>Spark Ad</strong> only. TikTok generates Image and Carousel variations from your video — uploading them as inputs would be ignored.
                        </p>
                      </div>
                      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-2 py-1.5">
                        <Info className="mt-0.5 size-3 shrink-0 text-amber-600" />
                        <p className="text-[10px] leading-snug text-amber-800">
                          <strong>No video to upload?</strong> Switch to <strong>Catalog Listing</strong> above — TikTok auto-generates the entire video from your product images, no merchant video required.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Product Selection */}
              <CatalogProductSelection
                objectiveConfig={objectiveConfig}
                updateNested={updateNested}
                isCatalogListing={isCatalogListing}
              />
            </div>
          )}

          {/* ---- Lead Gen: location picker + instant form builder ---- */}
          {isLeadGen && <InstantFormBuilder />}

          {/* ---- Ads List ---- */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 pt-5 pb-1">
              <div className="mb-1">
                <Label className="text-base font-bold text-foreground">Campaign Content</Label>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Create multiple ads with different video and image options. The system will automatically shift budget toward your top-performing ads.
              </p>

              {ads.length === 0 && !isCatalogListing && (
                <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-[#a4ffe5]/40 bg-[#e6fff9]/50 px-3 py-2.5">
                  <Zap className="mt-0.5 size-4 shrink-0 text-[#004956]" />
                  <div>
                    <p className="text-xs font-semibold text-[#004956]">Recommended Format</p>
                    <p className="mt-0.5 text-xs text-[#004956]/70">
                      {catalogEnabled && objectiveConfig.shoppingAdsType === "VIDEO_SHOPPING_ADS"
                        ? "For Video Shopping, Single Video ads with product demos let users browse and buy directly from the video."
                        : campaign.objective.objective === "PRODUCT_SALES"
                          ? "For Sales campaigns, Single Video ads with product demos perform 2.3x better on TikTok."
                          : campaign.objective.objective === "TRAFFIC"
                            ? "Single Video ads drive the most website traffic. Use vertical 9:16 video with a clear CTA."
                            : campaign.objective.objective === "VIDEO_VIEWS"
                              ? "Spark Ads get 2x more engagement than standard ads. Use an organic post that already resonates."
                              : campaign.objective.objective === "LEAD_GENERATION"
                                ? "Lead Generation ads with short video (under 15s) have 40% higher form completion rates."
                                : campaign.objective.objective === "APP_PROMOTION"
                                  ? "App Install ads with gameplay or demo videos have 25% higher install rates."
                                  : "Start with a Single Video ad for best results across all objectives."}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 pb-5">

            {/* Auto-generated creatives — Catalog Listing Ads only.
                CLA has no merchant creative: TikTok composes the entire
                video from catalog images. We surface only the required text
                inputs (Display Name + Caption) and CTA. Product destinations
                come from the catalog feed.

                VSA + dynamic_format is NOT here — it still requires a
                merchant-uploaded base video, so it falls through to the
                standard upload flow below with the format picker narrowed
                to Single Video + Spark Ad only. */}
            {isCatalogListing ? (
              <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border bg-[#e6fff9]/40 px-5 py-3.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#004956]/10">
                    <Zap className="size-4 text-[#004956]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#004956]">Auto-Generated Catalog Creatives</p>
                    <p className="mt-0.5 text-[11px] text-[#004956]/60">
                      TikTok generates the video from your catalog images. You provide the caption text and CTA below.
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4 flex flex-col gap-4">
                  {/* Merchant-provided text inputs. TikTok auto-generates the
                      *visual* from the catalog, but ad_text (required) and
                      display_name (optional) are still merchant inputs sent
                      to the API as part of the CLA creative payload. */}
                  {(() => {
                    const claAd = ads[0];
                    if (!claAd) return null;
                    return (
                      <div className="flex flex-col gap-3">
                        {/* Display name */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-foreground">
                              Display name <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <AiFillButton
                              onFill={() => updateAd(claAd.id, { ...claAd, displayName: "Salla Store" })}
                              label="Fill with AI"
                            />
                          </div>
                          <div className="relative">
                            <Input
                              placeholder="Your brand"
                              value={claAd.displayName}
                              maxLength={20}
                              onChange={(e) => updateAd(claAd.id, { ...claAd, displayName: e.target.value.slice(0, 20) })}
                              className={cn("h-10 pr-14 text-sm", claAd.displayName.length >= 20 && "border-amber-400")}
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">
                              {claAd.displayName.length}/20
                            </span>
                          </div>
                        </div>

                        {/* Ad text (caption) — TikTok requires this for CLA */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-foreground">
                              Caption text <span className="text-destructive">*</span>
                            </Label>
                            <AiFillButton
                              onFill={() => updateAd(claAd.id, { ...claAd, adText: "Discover quality products at unbeatable prices. Shop now and enjoy fast shipping across the Kingdom." })}
                              label="Fill with AI"
                            />
                          </div>
                          <div className="relative">
                            <Input
                              placeholder="Write a short caption that appears above the auto-generated ad..."
                              value={claAd.adText}
                              maxLength={100}
                              onChange={(e) => updateAd(claAd.id, { ...claAd, adText: e.target.value.slice(0, 100) })}
                              className={cn("h-10 pr-14 text-sm", claAd.adText.length >= 100 && "border-amber-400")}
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">
                              {claAd.adText.length}/100
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* CTA only — CLA has no landing URL (destinations live
                      in the catalog feed). */}
                  <LinkTypeSection
                    url=""
                    onUrlChange={() => {}}
                    cta={ads[0]?.callToAction || "SHOP_NOW"}
                    onCtaChange={(v) => {
                      if (ads[0]) {
                        updateAd(ads[0].id, { ...ads[0], callToAction: v as TikTokCTA });
                      }
                    }}
                    recommendedCtas={RECOMMENDED_CTAS}
                    otherCtas={OTHER_CTAS}
                    showUrl={false}
                  />

                  {/* Catalog-feed destination explainer */}
                  <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5] bg-[#e6fff9]/60 p-2.5">
                    <Info className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                    <p className="text-[11px] leading-snug text-foreground/80">
                      <strong className="text-[#004956]">Where do clicks go?</strong> Product destinations are pulled from your Salla catalog feed — each product links to its own product page automatically. TikTok doesn't allow overriding these per ad. To change them, edit the products in your Salla store.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard ads: manual upload (Video Shopping or non-catalog) */
              <>
                {ads.length === 0 ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Ad Type</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {catalogEnabled
                          ? "Add videos to showcase with your catalog products. Products will be attached as interactive cards."
                          : "Choose a format for this ad. You can add more ads in different formats."}
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
                    {catalogEnabled && objectiveConfig.shoppingAdsType === "VIDEO_SHOPPING_ADS" && (
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
                        multiVideoEnabled={
                          campaign.objective.smartPlus.enabled
                          && campaign.objective.objective === "PRODUCT_SALES"
                          && !searchAdsOn
                        }
                      />
                    ))}

                    {/* Apply to All */}
                    {ads.length >= 2 && (
                      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-foreground">Apply to All Ads</span>
                          <span className="text-[11px] text-muted-foreground">Copy display name, caption, CTA, and URL from the active ad to all others</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 gap-1.5 text-xs"
                          onClick={applyToAll}
                        >
                          <Copy className="size-3" />
                          Apply
                        </Button>
                      </div>
                    )}

                    {/* ── Ad count guidance ── */}
                    {ads.length >= 5 && ads.length < 10 && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-[#a4ffe5]/50 bg-[#e6fff9]/60 px-4 py-3">
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#004956]/10">
                          <Sparkles className="size-3.5 text-[#004956]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#004956]">
                            {ads.length} ads created — that&apos;s a solid set
                          </p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-[#004956]/70">
                            TikTok recommends 3–5 ads per ad group for optimal budget distribution and faster optimization. You can still add more if needed.
                          </p>
                        </div>
                      </div>
                    )}
                    {ads.length >= 10 && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                          <AlertCircle className="size-3.5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-800">
                            {ads.length} ads — budget will be spread thin
                          </p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">
                            With {ads.length} ads, each creative gets less budget for TikTok to optimize. Consider removing underperformers or consolidating similar ads for better results.
                          </p>
                        </div>
                      </div>
                    )}

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

            {/* ---- 1.5 RECOMMENDATION USAGE (Smart+ scoring) ----
                Matches TikTok's upgraded Smart+ ad creation right rail.
                Score is a weighted sum of 5 health checks. Each row shows
                a status dot + label; failing rows surface an inline action
                (e.g. "Add 5 more creatives", "Increase budget"). */}
            {campaign.objective.smartPlus.enabled && (
              <SmartPlusRecommendationCard
                catalogConnected={!!campaign.objective.catalogId && campaign.objective.catalogEnabled}
                catalogRequired={campaign.objective.catalogEnabled}
                pixelConnected={!!campaign.objective.pixelId || campaign.objective.pixelMode !== "none"}
                pixelRequired={campaign.objective.objective === "PRODUCT_SALES" || campaign.objective.objective === "TRAFFIC"}
                hasBudget={campaign.budget.amount > 0 || campaign.budget.lifetimeAmount > 0}
                hasAudience={(campaign.audience.locationIds?.length ?? 0) > 0}
                creativeCount={ads.reduce((sum, a) => sum + (a.adFormat === "CAROUSEL" ? a.carouselCards.length : a.assets.length), 0)}
                captionCount={(ads[0]?.adText ? 1 : 0) + (ads[0]?.adTextVariations?.filter((v) => v.trim()).length ?? 0)}
                onNavigateToBudget={() => setStep(2)}
              />
            )}

            {/* ---- 2. CAMPAIGN READINESS ---- */}
            <TikTokCampaignReadiness
              ads={ads}
              totalCreatives={totalCreatives}
              allChecks={allChecks}
              passingChecks={passingChecks}
              isAutoGenerated={isAutoGenerated}
              objective={campaign.objective.objective}
              catalogEnabled={catalogEnabled}
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
                      {campaign.objective.appSettings.appPlatform === "APP_IOS" ? "iOS" : "Android"}
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
        nextDisabled={passingChecks < allChecks.length || scenario.isBlocked}
      />
    </TooltipProvider>
  );
}
