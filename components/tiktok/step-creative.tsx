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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ShieldCheck,
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
} from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
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

/**
 * Shared tracking URL section -- click_tracking_url, impression_tracking_url, AIGC disclosure.
 * Used by Single Video, Single Image, and Carousel formats.
 */
function AdTrackingSection({ ad, onUpdate }: { ad: TikTokAd; onUpdate: (ad: TikTokAd) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-muted/10">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2.5"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Tracking & Advanced</span>
        </div>
        {expanded ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="flex flex-col gap-3 border-t border-border px-3 pb-3 pt-2.5">
          {/* Click tracking URL */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium text-muted-foreground">Click Tracking URL</Label>
            <Input
              placeholder="https://tracking.example.com/click?..."
              type="url"
              value={ad.clickTrackingUrl || ""}
              onChange={(e) => onUpdate({ ...ad, clickTrackingUrl: e.target.value })}
              className="h-7 text-[11px]"
            />
            <p className="text-[10px] text-muted-foreground">Third-party click tracker. Maps to <code className="rounded bg-muted px-1 text-[10px]">click_tracking_url</code>.</p>
          </div>
          {/* Impression tracking URL */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium text-muted-foreground">Impression Tracking URL</Label>
            <Input
              placeholder="https://tracking.example.com/impression?..."
              type="url"
              value={ad.impressionTrackingUrl || ""}
              onChange={(e) => onUpdate({ ...ad, impressionTrackingUrl: e.target.value })}
              className="h-7 text-[11px]"
            />
            <p className="text-[10px] text-muted-foreground">Third-party impression tracker. Maps to <code className="rounded bg-muted px-1 text-[10px]">impression_tracking_url</code>.</p>
          </div>
          {/* AIGC Disclosure */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[11px] font-medium text-foreground">AI-Generated Content Disclosure</Label>
              <p className="text-[10px] text-muted-foreground">Declare if this ad uses AI-generated content. Maps to <code className="rounded bg-muted px-1 text-[10px]">aigc_disclosure_type</code>.</p>
            </div>
            <Switch
              checked={ad.aigcDisclosureType === "DECLARED"}
              onCheckedChange={(checked) => onUpdate({ ...ad, aigcDisclosureType: checked ? "DECLARED" : "NOT_DECLARED" })}
            />
          </div>
          {/* Deep link (app) */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium text-muted-foreground">App Deep Link (optional)</Label>
            <Input
              placeholder="myapp://product/123"
              value={ad.deeplink || ""}
              onChange={(e) => onUpdate({ ...ad, deeplink: e.target.value })}
              className="h-7 font-mono text-[11px]"
            />
            <p className="text-[10px] text-muted-foreground">Deep link for users who have your app. Maps to <code className="rounded bg-muted px-1 text-[10px]">deeplink</code>.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Upload Drop Zone (matches Snap pattern)                            */
/* ------------------------------------------------------------------ */

function UploadZone({
  accept,
  label,
  sublabel,
  preview,
  previewMediaType,
  previewFile,
  onFile,
  onClear,
  compact,
}: {
  accept: string;
  label: string;
  sublabel: string;
  preview?: string;
  previewMediaType?: "VIDEO" | "IMAGE";
  previewFile?: File;
  onFile: (file: File) => void;
  onClear?: () => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (files?.[0]) onFile(files[0]);
    },
    [onFile]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (preview) {
    if (compact) {
      return (
        <div className="relative h-20 overflow-hidden rounded-lg border border-border bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="size-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <Button size="sm" variant="secondary" className="h-6 px-2 text-xs" onClick={() => inputRef.current?.click()}>Replace</Button>
            {onClear && <Button size="sm" variant="destructive" className="h-6 px-2 text-xs" onClick={onClear}>Remove</Button>}
          </div>
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>
      );
    }

    const fileName = previewFile?.name || (previewMediaType === "VIDEO" ? "video.mp4" : "image.jpg");
    const fileSize = previewFile?.size ? formatSize(previewFile.size) : "";
    const isVideo = previewMediaType === "VIDEO";

    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5">
        <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-black">
          {isVideo ? (
            <video src={preview} muted className="size-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="size-full object-cover" crossOrigin="anonymous" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-medium text-foreground">{fileName}</span>
          {fileSize && <span className="text-sm text-muted-foreground">{fileSize}</span>}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Replace media"
        >
          <Upload className="size-3.5" />
        </button>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-md p-1.5 text-destructive/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Remove media"
          >
            <Trash2 className="size-4" />
          </button>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
        dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/10 hover:border-primary/40 hover:bg-muted/20",
        compact ? "gap-1 py-3" : "gap-1.5 py-6"
      )}
    >
      <Upload className={cn("text-muted-foreground", compact ? "size-4" : "size-5")} />
      <span className={cn("font-medium text-foreground", compact ? "text-xs" : "text-xs")}>{label}</span>
      <span className={cn("text-center text-muted-foreground", compact ? "text-[8px]" : "text-xs")}>{sublabel}</span>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </button>
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
    onUpdate({
      ...ad,
      adFormat: val,
      sparkAdEnabled: val === "SPARK_AD",
      assets: val !== ad.adFormat ? [] : ad.assets,
      carouselCards: val === "CAROUSEL" ? ad.carouselCards : [],
      sparkAdAuthCode: val === "SPARK_AD" ? ad.sparkAdAuthCode : "",
      musicFile: val === "CAROUSEL" ? ad.musicFile : undefined,
      musicUrl: val === "CAROUSEL" ? ad.musicUrl : "",
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
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-primary/30 bg-primary/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <p className="text-xs font-semibold text-foreground">Spark Ad Authorization</p>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                  Spark Ads promote an existing organic TikTok post. The display name, caption, video, and profile image all come from the original post. Identity must use <code className="rounded bg-muted px-1 text-[10px]">TT_USER</code> or <code className="rounded bg-muted px-1 text-[10px]">AUTH_CODE</code>.
                </p>

                {/* Authorization method */}
                <div className="mb-3 flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-foreground">How to get the code</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-card p-2.5">
                      <p className="text-[11px] font-medium text-foreground">From your own post</p>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                        Open post in TikTok app &gt; Tap &quot;...&quot; &gt; Ad settings &gt; Authorize
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-2.5">
                      <p className="text-[11px] font-medium text-foreground">From a creator</p>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                        Creator generates code in TikTok app, shares it with you (valid 7-365 days)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Auth code input */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Authorization Code / Post URL</Label>
                  <Input
                    placeholder="e.g. abc123def456 or https://www.tiktok.com/@user/video/..."
                    value={ad.sparkAdAuthCode}
                    onChange={(e) => onUpdate({ ...ad, sparkAdAuthCode: e.target.value })}
                    className="h-9 font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Maps to API <code className="rounded bg-muted px-1 text-[10px]">tiktok_item_id</code>. Private posts become public during promotion.
                  </p>
                </div>

                {ad.sparkAdAuthCode && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2">
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-xs font-medium text-emerald-700">Auth code received</p>
                      <p className="text-[10px] text-emerald-600">Post will be verified on submission. Caption cannot be edited on Spark Ads.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* What Spark Ads include automatically */}
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="mb-2 text-[11px] font-medium text-muted-foreground">Inherited from original post</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {["Video/Image creative", "Caption text", "Profile name & avatar", "Likes & comments", "Music/audio", "Hashtags"].map((item) => (
                    <div key={item} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-2.5 text-primary" />
                      <span className="text-[10px] text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA + Landing (optional overrides for Spark) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-medium text-muted-foreground">Call to Action (optional)</Label>
                  <Select value={ad.callToAction} onValueChange={(v) => onUpdate({ ...ad, callToAction: v as TikTokCTA })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CTA_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Landing URL (optional)</Label>
                    <Link2 className="size-2.5 text-muted-foreground" />
                  </div>
                  <Input
                    placeholder="https://yourstore.salla.sa"
                    type="url"
                    value={ad.landingPageUrl}
                    onChange={(e) => onUpdate({ ...ad, landingPageUrl: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Spark Ad interaction settings */}
              <div className="rounded-lg border border-border bg-muted/10 p-3">
                <p className="mb-2 text-[11px] font-medium text-muted-foreground">Post Interaction Settings</p>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-foreground">Allow Duet</Label>
                      <p className="text-[10px] text-muted-foreground">Maps to <code className="rounded bg-muted px-1 text-[10px]">item_duet_status</code></p>
                    </div>
                    <Switch
                      checked={ad.sparkDuetStatus !== "DISABLE"}
                      onCheckedChange={(checked) => onUpdate({ ...ad, sparkDuetStatus: checked ? "ENABLE" : "DISABLE" })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-foreground">Allow Stitch</Label>
                      <p className="text-[10px] text-muted-foreground">Maps to <code className="rounded bg-muted px-1 text-[10px]">item_stitch_status</code></p>
                    </div>
                    <Switch
                      checked={ad.sparkStitchStatus !== "DISABLE"}
                      onCheckedChange={(checked) => onUpdate({ ...ad, sparkStitchStatus: checked ? "ENABLE" : "DISABLE" })}
                    />
                  </div>
                </div>
              </div>

              {/* Tracking URLs for Spark */}
              <AdTrackingSection ad={ad} onUpdate={onUpdate} />
            </div>
          )}

          {/* ---- CAROUSEL ---- */}
          {isCarousel && !isSpark && (
            <div className="flex flex-col gap-4">
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

              {/* Music upload (REQUIRED for Carousel) */}
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="size-3.5 text-primary" />
                    <Label className="text-xs font-semibold text-foreground">Background Music</Label>
                    <Badge variant="default" className="rounded-full px-1.5 py-0 text-[9px]">Required</Badge>
                  </div>
                </div>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Music is mandatory for carousel ads. Upload MP3, WAV, M4A, or FLAC. Min 2 seconds, max 10MB. Plays on loop.
                </p>
                {ad.musicFile ? (
                  <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/[0.03] px-3 py-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                      <Music className="size-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">{ad.musicFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(ad.musicFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdate({ ...ad, musicFile: undefined, musicUrl: "" })}
                      className="shrink-0 rounded-md p-1 text-destructive/60 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <UploadZone
                    accept="audio/mpeg,audio/wav,audio/x-m4a,audio/flac"
                    label="Upload music"
                    sublabel="MP3, WAV, M4A, FLAC -- min 2s, max 10MB"
                    onFile={(file) => {
                      if (file.size > 10 * 1024 * 1024) {
                        alert("Music file must be under 10MB.");
                        return;
                      }
                      onUpdate({ ...ad, musicFile: file, musicUrl: URL.createObjectURL(file) });
                    }}
                  />
                )}
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="flex items-start gap-1.5">
                    <Info className="mt-0.5 size-2.5 shrink-0 text-muted-foreground/60" />
                    <p className="text-[10px] text-muted-foreground">
                      CML (Commercial Music Library) is available for TikTok placement only. For Pangle placement, you must upload your own music.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="mt-0.5 size-2.5 shrink-0 text-amber-500" />
                    <p className="text-[10px] text-muted-foreground">
                      If placement includes Pangle: upload music here to avoid silent ads. CML music will not play on Pangle.
                    </p>
                  </div>
                </div>
              </div>

              {/* Carousel shares: one caption, one CTA, one URL for all cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">Display Name</Label>
                    <CharCounter current={ad.displayName.length} max={20} />
                  </div>
                  <Input
                    placeholder="Your brand"
                    value={ad.displayName}
                    maxLength={20}
                    onChange={(e) => onUpdate({ ...ad, displayName: e.target.value.slice(0, 20) })}
                    className={cn("h-8 text-xs", ad.displayName.length >= 20 && "border-amber-400")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-medium text-muted-foreground">Call to Action</Label>
                  <Select value={ad.callToAction} onValueChange={(v) => onUpdate({ ...ad, callToAction: v as TikTokCTA })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CTA_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Ad Text / Caption</Label>
                  <CharCounter current={ad.adText.length} max={100} />
                </div>
                <Textarea
                  placeholder="Write a caption for all carousel cards..."
                  value={ad.adText}
                  maxLength={100}
                  rows={2}
                  onChange={(e) => onUpdate({ ...ad, adText: e.target.value.slice(0, 100) })}
                  className="resize-none text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  One caption and CTA shared across all carousel cards.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Landing Page URL</Label>
                  <Link2 className="size-2.5 text-muted-foreground" />
                </div>
                <Input
                  placeholder="https://yourstore.salla.sa/collection"
                  type="url"
                  value={ad.landingPageUrl}
                  onChange={(e) => onUpdate({ ...ad, landingPageUrl: e.target.value })}
                  className={cn("h-8 text-xs", ad.landingPageUrl && !ad.landingPageUrl.startsWith("https://") && "border-red-400")}
                />
                <p className="text-[10px] text-muted-foreground">
                  Single URL for all cards. For product-specific links, use Video Shopping Ads with catalog.
                </p>
                {ad.landingPageUrl && !ad.landingPageUrl.startsWith("https://") && (
                  <p className="text-[10px] text-red-600">URL must start with https://</p>
                )}
              </div>

              {/* Tracking URLs */}
              <AdTrackingSection ad={ad} onUpdate={onUpdate} />
            </div>
          )}

          {/* ---- SINGLE VIDEO ---- */}
          {ad.adFormat === "SINGLE_VIDEO" && !isSpark && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">Video Creative</Label>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">Best Format</Badge>
                </div>

                {/* Video specs */}
                <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 sm:grid-cols-3">
                  {[
                    { label: "Format", value: "MP4 / MOV" },
                    { label: "Aspect Ratio", value: "9:16 recommended" },
                    { label: "Resolution", value: "540x960+ (1080x1920 best)" },
                    { label: "Duration", value: "5-60s (9-15s best)" },
                    { label: "Max Size", value: "500 MB" },
                    { label: "Codec", value: "H.264" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-baseline gap-1">
                      <span className="text-[10px] text-muted-foreground">{s.label}:</span>
                      <span className="text-[10px] font-medium text-foreground">{s.value}</span>
                    </div>
                  ))}
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
                />

                <div className="mt-2 flex items-start gap-1.5">
                  <Info className="mt-0.5 size-2.5 shrink-0 text-muted-foreground/60" />
                  <p className="text-[10px] text-muted-foreground">
                    Videos under 15 seconds have higher completion rates. Use vertical 9:16 for best performance.
                  </p>
                </div>
              </div>

              {/* Optional music for video ads */}
              <div className="rounded-lg border border-border bg-muted/10 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="size-3.5 text-muted-foreground" />
                    <Label className="text-xs font-medium text-foreground">Background Music</Label>
                    <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">Optional</Badge>
                  </div>
                  <Switch
                    checked={!ad.promotionalMusicDisabled}
                    onCheckedChange={(checked) => {
                      onUpdate({ ...ad, promotionalMusicDisabled: !checked, ...(!checked ? { musicFile: undefined, musicUrl: "" } : {}) });
                    }}
                  />
                </div>
                {!ad.promotionalMusicDisabled && (
                  <div className="mt-2">
                    <p className="mb-2 text-[10px] text-muted-foreground">
                      Upload your own music or leave empty to use the video&apos;s original audio. Maps to API <code className="rounded bg-muted px-1 text-[10px]">promotional_music_disabled</code>.
                    </p>
                    {ad.musicFile ? (
                      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/[0.03] px-3 py-2">
                        <Music className="size-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">{ad.musicFile.name}</p>
                          <p className="text-[10px] text-muted-foreground">{(ad.musicFile.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button type="button" onClick={() => onUpdate({ ...ad, musicFile: undefined, musicUrl: "" })} className="text-destructive/60 hover:text-destructive"><Trash2 className="size-3.5" /></button>
                      </div>
                    ) : (
                      <UploadZone accept="audio/mpeg,audio/wav,audio/x-m4a,audio/flac" label="Upload music" sublabel="MP3/WAV/M4A/FLAC, max 10MB" onFile={(file) => {
                        if (file.size > 10 * 1024 * 1024) { alert("Music file must be under 10MB."); return; }
                        onUpdate({ ...ad, musicFile: file, musicUrl: URL.createObjectURL(file) });
                      }} />
                    )}
                  </div>
                )}
              </div>

              {/* Video ad fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">Display Name</Label>
                    <CharCounter current={ad.displayName.length} max={20} />
                  </div>
                  <Input
                    placeholder="Your brand"
                    value={ad.displayName}
                    maxLength={20}
                    onChange={(e) => onUpdate({ ...ad, displayName: e.target.value.slice(0, 20) })}
                    className={cn("h-8 text-xs", ad.displayName.length >= 20 && "border-amber-400")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-medium text-muted-foreground">Call to Action</Label>
                  <Select value={ad.callToAction} onValueChange={(v) => onUpdate({ ...ad, callToAction: v as TikTokCTA })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CTA_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Ad Text / Caption</Label>
                  <CharCounter current={ad.adText.length} max={100} />
                </div>
                <Textarea
                  placeholder="Write an engaging caption for your TikTok ad..."
                  value={ad.adText}
                  maxLength={100}
                  rows={2}
                  onChange={(e) => onUpdate({ ...ad, adText: e.target.value.slice(0, 100) })}
                  className="resize-none text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Maps to API <code className="rounded bg-muted px-1 text-[10px]">ad_text</code>. Keep it short and punchy -- best captions are under 80 chars.
                </p>
              </div>

              {isAppPromo ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">App Download URL</Label>
                    <Download className="size-2.5 text-muted-foreground" />
                  </div>
                  <div className="flex h-8 items-center rounded-md border border-border bg-muted/30 px-3 text-xs text-muted-foreground">
                    {ad.landingPageUrl || "Set in Objective step"}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Auto-filled from your app download URL. Users will be directed to the {" "}
                    {ad.landingPageUrl?.includes("apple.com") ? "App Store" : "Google Play Store"} to install your app.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Landing Page URL{(isVideoViews || isLeadGen) ? " (optional)" : ""}</Label>
                    <Link2 className="size-2.5 text-muted-foreground" />
                  </div>
                  <Input
                    placeholder={(isVideoViews || isLeadGen) ? "https://yourstore.salla.sa (optional)" : "https://yourstore.salla.sa/product"}
                    type="url"
                    value={ad.landingPageUrl}
                    onChange={(e) => onUpdate({ ...ad, landingPageUrl: e.target.value })}
                    className={cn("h-8 text-xs", ad.landingPageUrl && !ad.landingPageUrl.startsWith("https://") && "border-red-400")}
                  />
                  {ad.landingPageUrl && !ad.landingPageUrl.startsWith("https://") && (
                    <p className="text-[10px] text-red-600">URL must start with https://</p>
                  )}
                </div>
              )}

              {/* Instant product page toggle (for catalog ads) */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">Instant Product Page</p>
                  <p className="text-[10px] text-muted-foreground">
                    In-app landing page optimized for speed. Maps to <code className="rounded bg-muted px-1 text-[10px]">instant_product_page_used</code>.
                  </p>
                </div>
                <Switch
                  checked={ad.instantProductPageUsed ?? false}
                  onCheckedChange={(checked) => onUpdate({ ...ad, instantProductPageUsed: checked })}
                />
              </div>

              {/* Tracking URLs */}
              <AdTrackingSection ad={ad} onUpdate={onUpdate} />
            </div>
          )}

          {/* ---- SINGLE IMAGE ---- */}
          {ad.adFormat === "SINGLE_IMAGE" && !isSpark && (
            <div className="flex flex-col gap-4">
              <div>
                <Label className="mb-2 text-xs font-semibold text-foreground">Image Creative</Label>

                {/* Image specs with aspect ratio options */}
                <div className="mb-2 rounded-lg bg-muted/30 px-3 py-2">
                  <div className="mb-1.5 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                    {[
                      { label: "Format", value: "PNG / JPG" },
                      { label: "Max Size", value: "100 MB" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-baseline gap-1">
                        <span className="text-[10px] text-muted-foreground">{s.label}:</span>
                        <span className="text-[10px] font-medium text-foreground">{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] text-muted-foreground">Supported ratios:</span>
                    {[
                      { ratio: "9:16", res: "1080x1920", label: "Vertical" },
                      { ratio: "1:1", res: "1080x1080", label: "Square" },
                      { ratio: "16:9", res: "1200x628", label: "Horizontal" },
                    ].map((r) => (
                      <span key={r.ratio} className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] text-foreground">
                        {r.ratio} <span className="text-muted-foreground">({r.res})</span>
                      </span>
                    ))}
                  </div>
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
                />

                <div className="mt-2 flex items-start gap-1.5">
                  <Info className="mt-0.5 size-2.5 shrink-0 text-muted-foreground/60" />
                  <p className="text-[10px] text-muted-foreground">
                    9:16 vertical images perform best on TikTok. Images are displayed with an auto-generated animation effect.
                  </p>
                </div>
              </div>

              {/* Optional music for image ads */}
              <div className="rounded-lg border border-border bg-muted/10 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="size-3.5 text-muted-foreground" />
                    <Label className="text-xs font-medium text-foreground">Background Music</Label>
                    <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">Optional</Badge>
                  </div>
                  <Switch
                    checked={!ad.promotionalMusicDisabled}
                    onCheckedChange={(checked) => {
                      onUpdate({ ...ad, promotionalMusicDisabled: !checked, ...(!checked ? { musicFile: undefined, musicUrl: "" } : {}) });
                    }}
                  />
                </div>
                {!ad.promotionalMusicDisabled && (
                  <div className="mt-2">
                    <p className="mb-2 text-[10px] text-muted-foreground">
                      TikTok will animate your image with this music. Upload your own or leave empty for system-generated audio.
                    </p>
                    {ad.musicFile ? (
                      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/[0.03] px-3 py-2">
                        <Music className="size-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">{ad.musicFile.name}</p>
                          <p className="text-[10px] text-muted-foreground">{(ad.musicFile.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button type="button" onClick={() => onUpdate({ ...ad, musicFile: undefined, musicUrl: "" })} className="text-destructive/60 hover:text-destructive"><Trash2 className="size-3.5" /></button>
                      </div>
                    ) : (
                      <UploadZone accept="audio/mpeg,audio/wav,audio/x-m4a,audio/flac" label="Upload music" sublabel="MP3/WAV/M4A/FLAC, max 10MB" onFile={(file) => {
                        if (file.size > 10 * 1024 * 1024) { alert("Music file must be under 10MB."); return; }
                        onUpdate({ ...ad, musicFile: file, musicUrl: URL.createObjectURL(file) });
                      }} />
                    )}
                  </div>
                )}
              </div>

              {/* Image ad fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">Display Name</Label>
                    <CharCounter current={ad.displayName.length} max={20} />
                  </div>
                  <Input
                    placeholder="Your brand"
                    value={ad.displayName}
                    maxLength={20}
                    onChange={(e) => onUpdate({ ...ad, displayName: e.target.value.slice(0, 20) })}
                    className={cn("h-8 text-xs", ad.displayName.length >= 20 && "border-amber-400")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-medium text-muted-foreground">Call to Action</Label>
                  <Select value={ad.callToAction} onValueChange={(v) => onUpdate({ ...ad, callToAction: v as TikTokCTA })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CTA_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Ad Text / Caption</Label>
                  <CharCounter current={ad.adText.length} max={100} />
                </div>
                <Textarea
                  placeholder="Write an engaging caption for your image ad..."
                  value={ad.adText}
                  maxLength={100}
                  rows={2}
                  onChange={(e) => onUpdate({ ...ad, adText: e.target.value.slice(0, 100) })}
                  className="resize-none text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Maps to API <code className="rounded bg-muted px-1 text-[10px]">ad_text</code>.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Landing Page URL</Label>
                  <Link2 className="size-2.5 text-muted-foreground" />
                </div>
                <Input
                  placeholder="https://yourstore.salla.sa/product"
                  type="url"
                  value={ad.landingPageUrl}
                  onChange={(e) => onUpdate({ ...ad, landingPageUrl: e.target.value })}
                  className={cn("h-8 text-xs", ad.landingPageUrl && !ad.landingPageUrl.startsWith("https://") && "border-red-400")}
                />
                {ad.landingPageUrl && !ad.landingPageUrl.startsWith("https://") && (
                  <p className="text-[10px] text-red-600">URL must start with https://</p>
                )}
              </div>

              {/* Tracking URLs */}
              <AdTrackingSection ad={ad} onUpdate={onUpdate} />
            </div>
          )}
        </div>
      )}
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
  if (identity.identityType === "CUSTOMIZED_USER") {
    allChecks.push({ label: "Identity: display name", ok: identity.displayName.length > 0 });
  } else if (identity.identityType === "AUTH_CODE") {
    allChecks.push({ label: "Identity: auth code", ok: identity.identityId.length > 0 });
  } else {
    allChecks.push({ label: "Identity: TikTok account linked", ok: true /* mock: always connected */ });
  }

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
          <SectionCard>
            <div className="mb-1 flex items-center gap-2">
              <User className="size-4 text-primary" />
              <Label className="text-sm font-semibold text-foreground">TikTok Identity</Label>
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs font-normal">Required</Badge>
              <InfoTip text="Choose how your business appears on ads. Connect your TikTok account for Spark Ads, or use Custom Identity for standard ads. Maps to API identity_type + identity_id." />
            </div>
            <p className="mb-5 text-xs text-muted-foreground">
              Your brand identity shown on every ad. This is shared across all ads in the campaign.
            </p>

            <div className="flex flex-col gap-5">
              {/* ---- Step 1: Ad Account Connection ---- */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-foreground">Ad Account</Label>
                {/* Mock: Connected account selector */}
                <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/[0.02] px-4 py-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <CheckCircle2 className="size-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Select
                        value="acc_demo_001"
                        onValueChange={() => {
                          /* In production: switch advertiser context */
                        }}
                      >
                        <SelectTrigger className="h-7 w-auto gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-foreground shadow-none focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="acc_demo_001">
                            <div className="flex items-center gap-2">
                              <span>My Salla Store</span>
                              <span className="font-mono text-muted-foreground">ID: 7298...4521</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="acc_demo_002">
                            <div className="flex items-center gap-2">
                              <span>Brand Campaign Account</span>
                              <span className="font-mono text-muted-foreground">ID: 7301...8832</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Connected via OAuth. Advertiser ID auto-detected.
                    </p>
                  </div>
                  <Badge variant="outline" className="gap-1 rounded-full px-2 text-[10px]">
                    <CheckCircle2 className="size-2.5 text-primary" />
                    Connected
                  </Badge>
                </div>
              </div>

              {/* ---- Step 2: Identity Type Selection ---- */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-foreground">Identity Type</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {([
                    {
                      value: "TT_USER" as const,
                      label: "Your TikTok Account",
                      desc: "Use your linked TikTok Business Account. Required for Spark Ads.",
                      badge: "Recommended",
                    },
                    {
                      value: "AUTH_CODE" as const,
                      label: "Authorized Account",
                      desc: "Use another creator's authorized TikTok posts in your ads.",
                      badge: null,
                    },
                    {
                      value: "CUSTOMIZED_USER" as const,
                      label: "Custom Identity",
                      desc: "Set a custom name and avatar without a TikTok account.",
                      badge: "Default",
                    },
                  ] as const).map((opt) => {
                    const sel = identity.identityType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          updateNested("creative", {
                            identity: { ...identity, identityType: opt.value },
                          })
                        }
                        className={cn(
                          "relative flex flex-col items-start rounded-lg border-2 p-3 text-left transition-all",
                          sel
                            ? "border-primary bg-primary/[0.04]"
                            : "border-border bg-card hover:border-primary/40"
                        )}
                      >
                        {opt.badge && (
                          <Badge
                            variant={opt.badge === "Recommended" ? "default" : "secondary"}
                            className={cn(
                              "absolute -top-2 right-2 rounded-full px-1.5 py-0 text-[9px]",
                              opt.badge === "Recommended"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {opt.badge}
                          </Badge>
                        )}
                        <p className={cn("text-[11px] font-semibold", sel ? "text-primary" : "text-foreground")}>
                          {opt.label}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ---- Step 3: Identity Details (depends on type) ---- */}

              {/* TT_USER: Linked TikTok account */}
              {identity.identityType === "TT_USER" && (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-foreground">
                      <svg viewBox="0 0 24 24" className="size-5 text-background" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.83 4.83 0 0 1-1-.15z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">@yoursallastore</p>
                      <p className="text-[10px] text-muted-foreground">TikTok Business Account -- Linked</p>
                    </div>
                    <Badge variant="outline" className="gap-1 rounded-full px-2 text-[10px]">
                      <CheckCircle2 className="size-2.5 text-primary" />
                      Linked
                    </Badge>
                  </div>
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    Ads will show your TikTok profile name and avatar. This enables Spark Ads and improves ad trust and engagement.
                  </p>
                </div>
              )}

              {/* AUTH_CODE: Authorized account/post */}
              {identity.identityType === "AUTH_CODE" && (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-foreground">Authorization Code</Label>
                    <Input
                      placeholder="Enter auth code from creator"
                      value={identity.identityId}
                      onChange={(e) =>
                        updateNested("creative", {
                          identity: { ...identity, identityId: e.target.value },
                        })
                      }
                      className="h-8 font-mono text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      The creator must authorize their post/account in TikTok Business Center first. Enter the authorization code they provide.
                    </p>
                  </div>
                </div>
              )}

              {/* CUSTOMIZED_USER: Custom identity */}
              {identity.identityType === "CUSTOMIZED_USER" && (
                <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar upload */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="relative">
                        {identity.avatarPreviewUrl ? (
                          <div className="group relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={identity.avatarPreviewUrl}
                              alt="Brand avatar"
                              className="size-14 rounded-full border-2 border-primary/30 object-cover"
                              crossOrigin="anonymous"
                            />
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.accept = "image/jpeg,image/png";
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      if (file.size > 50 * 1024) {
                                        alert("Avatar must be under 50KB");
                                        return;
                                      }
                                      updateNested("creative", {
                                        identity: {
                                          ...identity,
                                          avatarFile: file,
                                          avatarPreviewUrl: URL.createObjectURL(file),
                                        },
                                      });
                                    }
                                  };
                                  input.click();
                                }}
                                className="rounded-full bg-white/90 p-1.5"
                              >
                                <Pencil className="size-3 text-foreground" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/jpeg,image/png";
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  if (file.size > 50 * 1024) {
                                    alert("Avatar must be under 50KB");
                                    return;
                                  }
                                  updateNested("creative", {
                                    identity: {
                                      ...identity,
                                      avatarFile: file,
                                      avatarPreviewUrl: URL.createObjectURL(file),
                                    },
                                  });
                                }
                              };
                              input.click();
                            }}
                            className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-border bg-card transition-colors hover:border-primary/40"
                          >
                            <Upload className="size-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground">98x98 JPG/PNG</span>
                    </div>

                    {/* Display name */}
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-foreground">Brand Display Name</Label>
                        <CharCounter current={identity.displayName.length} max={20} />
                      </div>
                      <Input
                        placeholder="Your store name"
                        value={identity.displayName}
                        maxLength={20}
                        onChange={(e) =>
                          updateNested("creative", {
                            identity: { ...identity, displayName: e.target.value.slice(0, 20) },
                          })
                        }
                        className={cn("h-8 text-xs", identity.displayName.length >= 20 && "border-amber-400")}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Shown as your brand name on all ads.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2">
                    <AlertCircle className="mt-0.5 size-3 shrink-0 text-amber-500" />
                    <p className="text-[10px] leading-relaxed text-amber-700">
                      Custom Identity is being deprecated by TikTok (June 2025). We recommend linking your TikTok Business Account for better ad performance and to unlock Spark Ads.
                    </p>
                  </div>
                </div>
              )}

              {/* Advertiser ID (always shown, read-only) */}
              <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                <span className="text-[10px] text-muted-foreground">Advertiser ID</span>
                <span className="font-mono text-[10px] text-muted-foreground">{identity.identityId || "Auto-detected from connection"}</span>
              </div>
            </div>
          </SectionCard>

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

          {/* ---- Placement & Brand Safety ---- */}
          <SectionCard>
            <div className="mb-4 flex items-center gap-2">
              <LayoutGrid className="size-4 text-primary" />
              <Label className="text-sm font-semibold text-foreground">Placement</Label>
              <InfoTip text="Maps to TikTok API placement_type. Automatic lets TikTok optimize across all placements including TikTok, Pangle, and Global App Bundle." />
            </div>

            <div className="flex gap-3">
              {([
                { value: "PLACEMENT_TYPE_AUTOMATIC" as const, label: "Automatic Placement", desc: "TikTok optimizes across all placements for best results." },
                { value: "PLACEMENT_TYPE_NORMAL" as const, label: "Manual Placement", desc: "You choose specific placements (TikTok, Pangle, etc.)." },
              ]).map((opt) => {
                const active = cr.placementType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateNested("creative", { placementType: opt.value })}
                    className={cn(
                      "flex flex-1 flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-colors",
                      active ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
                    )}
                  >
                    <span className={cn("text-xs font-medium", active ? "text-primary" : "text-foreground")}>{opt.label}</span>
                    <span className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            {cr.placementType === "PLACEMENT_TYPE_NORMAL" && (
              <div className="mt-3 flex flex-col gap-2">
                <Label className="mb-1 text-xs font-semibold text-foreground">Select Placements</Label>
                {[
                  { id: "TIKTOK", label: "TikTok", desc: "Main TikTok feed (For You page)" },
                  { id: "PANGLE", label: "Pangle", desc: "TikTok Audience Network (third-party apps)" },
                  { id: "GLOBAL_APP_BUNDLE", label: "Global App Bundle", desc: "Ads across TikTok-owned apps (CapCut, Fizzo, etc.)" },
                ].map((pos) => (
                  <label
                    key={pos.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2 transition-colors hover:border-primary/20"
                  >
                    <input type="checkbox" defaultChecked className="accent-primary" />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-foreground">{pos.label}</span>
                      <p className="text-xs text-muted-foreground">{pos.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ---- Lead Gen: location picker + instant form builder ---- */}
          {isLeadGen && <InstantFormBuilder />}

          {/* ---- Ads List ---- */}
          <SectionCard>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Your Ads</Label>
                <Badge variant="secondary" className="text-xs">{ads.length} ad{ads.length !== 1 ? "s" : ""}</Badge>
                <InfoTip text="Create multiple ads with different formats to test what works best. TikTok recommends 3-5 ad variations per ad group." />
              </div>
            </div>

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
                  <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border py-12">
                    <ImagePlus className="size-10 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">No ads yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {catalogEnabled
                          ? "Add videos to showcase with your catalog products. Products will be attached as interactive cards."
                          : "Add your first ad to get started. You can mix different formats."}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {AD_FORMAT_OPTIONS.filter((opt) => allowedFormats.includes(opt.value)).map((opt) => (
                        <Button
                          key={opt.value}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "gap-1.5 text-xs",
                            opt.value === "SPARK_AD" && "border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                          )}
                          onClick={() => addAd(opt.value)}
                        >
                          {opt.icon}
                          {opt.label}
                        </Button>
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

                    {/* Add more ads */}
                    <div className="rounded-lg border border-dashed border-border p-3">
                      <span className="mb-2 block text-xs text-muted-foreground">Add another ad:</span>
                      <div className="flex flex-wrap gap-2">
                        {AD_FORMAT_OPTIONS.filter((opt) => allowedFormats.includes(opt.value)).map((opt) => (
                          <Button
                            key={opt.value}
                            variant={opt.value === "SPARK_AD" ? "outline" : "ghost"}
                            size="sm"
                            className={cn(
                              "h-7 gap-1.5 text-sm",
                              opt.value === "SPARK_AD" && "border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                            )}
                            onClick={() => addAd(opt.value)}
                          >
                            {opt.icon ? <span className="[&>svg]:size-3">{opt.icon}</span> : <Plus className="size-3" />}
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </SectionCard>

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

            {/* ---- 2. AD SUMMARY ---- */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Ad Summary</Label>
              </div>
              <div className="flex flex-col gap-2.5 text-xs">
                {/* Settings row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center rounded-lg border border-border bg-muted/20 px-2 py-2">
                    <User className="mb-1 size-3 text-primary" />
                    <span className="text-xs text-muted-foreground">Identity</span>
                    {(identity.identityType === "CUSTOMIZED_USER" ? identity.displayName.length > 0 : identity.identityType === "AUTH_CODE" ? identity.identityId.length > 0 : true) ? (
                      <CheckCircle2 className="mt-0.5 size-3 text-emerald-500" />
                    ) : (
                      <AlertCircle className="mt-0.5 size-3 text-amber-500" />
                    )}
                  </div>
                  <div className="flex flex-col items-center rounded-lg border border-border bg-muted/20 px-2 py-2">
                    <LayoutGrid className="mb-1 size-3 text-primary" />
                    <span className="text-xs text-muted-foreground">Placement</span>
                    <span className="mt-0.5 text-xs font-medium text-foreground">
                      {cr.placementType === "PLACEMENT_TYPE_AUTOMATIC" ? "Auto" : "Manual"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg border border-border bg-muted/20 px-2 py-2">
                    <ShieldCheck className="mb-1 size-3 text-primary" />
                    <span className="text-xs text-muted-foreground">Pixel</span>
                    <span className="mt-0.5 text-xs font-medium text-foreground">
                      {objectiveConfig.pixelId ? "Set" : "None"}
                    </span>
                  </div>
                </div>

                {/* Counts */}
                {isCatalogListing ? (
                  <div className="flex flex-col gap-1.5 rounded-lg bg-primary/[0.03] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Zap className="size-3.5 text-primary" />
                      <span className="text-xs font-medium text-foreground">Catalog Listing</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Creatives auto-generated from your product catalog</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-lg font-bold text-foreground">{ads.length}</span>
                      <span className="text-xs text-muted-foreground">Ad{ads.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-lg font-bold text-foreground">{totalCreatives}</span>
                      <span className="text-xs text-muted-foreground">Creative{totalCreatives !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-lg font-bold text-foreground">{ads.filter((a) => a.adFormat === "SPARK_AD").length || "--"}</span>
                      <span className="text-xs text-muted-foreground">Spark</span>
                    </div>
                  </div>
                )}

                {/* Per-ad breakdown */}
                {ads.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {ads.map((ad, i) => (
                      <button
                        key={ad.id}
                        type="button"
                        onClick={() => setActiveAdIdx(i)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                          i === activeAdIdx ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20"
                        )}
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <div className="flex-1 truncate">
                          <span className="text-xs font-medium text-foreground">{ad.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className={cn("rounded-full px-1.5 py-0 text-[8px]", ad.adFormat === "SPARK_AD" && "bg-primary/10 text-primary")}>
                            {ad.adFormat === "SPARK_AD" ? "Spark" : getFormatLabel(ad.adFormat).split(" ")[0]}
                          </Badge>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {ad.adFormat === "CAROUSEL" ? `${ad.carouselCards.length}c` : `${ad.assets.length}cr`}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>

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

            {/* ---- 3. MEDIA SPECS ---- */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Info className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Media Requirements</Label>
              </div>
              <div className="flex flex-col gap-2">
                {/* Video specs */}
                <div className="rounded-lg border border-border p-2.5">
                  <p className="mb-1.5 text-xs font-semibold text-foreground">Video Creative</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1.5">
                      <Film className="size-2.5 text-primary" />
                      <span className="text-xs text-muted-foreground">MP4 / MOV</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Max 500MB</span>
                  </div>
                  <div className="mt-1.5 flex flex-col gap-0.5 border-t border-border pt-1.5">
                    <span className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Resolution:</span> 540x960+ (1080x1920 best)</span>
                    <span className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Duration:</span> 5-60s (9-15s best)</span>
                    <span className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Codec:</span> H.264</span>
                  </div>
                </div>
                {/* Image specs */}
                <div className="rounded-lg border border-border p-2.5">
                  <p className="mb-1 text-xs font-semibold text-foreground">Image Creative</p>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">PNG / JPG, max 100MB</span>
                    <span className="text-xs text-muted-foreground">9:16 (1080x1920), 1:1 (1080x1080), 16:9 (1200x628)</span>
                  </div>
                </div>
                {/* Carousel specs */}
                {ads.some((a) => a.adFormat === "CAROUSEL") && (
                  <div className="rounded-lg border border-border p-2.5">
                    <p className="mb-1 text-xs font-semibold text-foreground">Carousel Cards</p>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">2-35 images, JPG/PNG, {"<"} 100KB each suggested</span>
                      <span className="text-xs text-muted-foreground">1200x628 / 640x640 / 720x1280</span>
                      <span className="text-xs text-muted-foreground">One caption + one URL for all cards</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 border-t border-border pt-1.5">
                      <Music className="size-2.5 text-primary" />
                      <span className="text-xs text-muted-foreground">Music required: MP3/WAV, min 2s, max 10MB</span>
                    </div>
                  </div>
                )}
                {/* Format tip */}
                <div className="rounded-lg bg-muted/30 px-2.5 py-2">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">Tip:</span>{" "}
                    {activeAdFormat === "CAROUSEL"
                      ? "Use high-quality product images for carousel cards. The first card is shown as the hero in the feed."
                      : activeAdFormat === "SPARK_AD"
                        ? "Spark Ads leverage your existing organic content. Posts with high engagement tend to convert better as ads."
                        : activeAdFormat === "SINGLE_IMAGE"
                          ? "Use bold, eye-catching imagery with minimal text. TikTok recommends vertical 9:16 for best performance."
                          : "Use vertical 9:16 video for best performance. Videos under 15 seconds have higher completion rates on TikTok."}
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* ---- 4. CHECKLIST ---- */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Checklist</Label>
                </div>
                <span className={cn(
                  "text-xs font-semibold tabular-nums",
                  passingChecks === allChecks.length ? "text-emerald-600" : "text-muted-foreground"
                )}>
                  {passingChecks}/{allChecks.length}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    passingChecks === allChecks.length ? "bg-emerald-500" : passingChecks > 0 ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                  style={{ width: allChecks.length > 0 ? `${(passingChecks / allChecks.length) * 100}%` : "0%" }}
                />
              </div>
              {/* Checks list */}
              <div className="flex flex-col gap-1">
                {allChecks
                  .slice()
                  .sort((a, b) => (a.ok === b.ok ? 0 : a.ok ? 1 : -1))
                  .slice(0, 10)
                  .map((c, i) => (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    {c.ok ? (
                      <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
                    ) : (
                      <div className="flex size-3 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30">
                        <div className="size-1.5 rounded-full" />
                      </div>
                    )}
                    <span className={cn("text-xs", c.ok ? "text-muted-foreground line-through" : "font-medium text-foreground")}>{c.label}</span>
                  </div>
                ))}
                {allChecks.length > 10 && (
                  <p className="mt-1 text-xs text-muted-foreground">+{allChecks.length - 10} more checks</p>
                )}
              </div>
              {passingChecks === allChecks.length && allChecks.length > 0 && (
                <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                  <p className="text-xs font-medium text-emerald-700">All checks passed. Ready to proceed.</p>
                </div>
              )}
            </SectionCard>

          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Next: Review & Launch"
        nextDisabled={passingChecks < allChecks.length}
      />
    </TooltipProvider>
  );
}
