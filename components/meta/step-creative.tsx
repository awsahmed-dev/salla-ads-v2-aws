"use client";

import { useState } from "react";
import { useMetaCampaign } from "@/lib/meta/campaign-context";
import { META_OBJECTIVE_CONFIGS } from "@/lib/meta/campaign-types";
import type {
  MetaAd,
  MetaAdFormat,
  MetaPublisherPlatform,
  MetaFacebookPosition,
  MetaInstagramPosition,
} from "@/lib/meta/campaign-types";
import {
  AD_FORMAT_OPTIONS,
  PLACEMENT_SPECS,
  type PreviewPlacement,
} from "@/lib/meta/creative-constants";
import {
  FacebookFeedPreview,
  InstagramFeedPreview,
  ReelsStoriesPreview,
} from "@/components/meta/creative-previews";
import { MetaAdPanel } from "@/components/meta/creative/ad-panel";
import {
  ApiBadge,
  makeDefaultAd,
  makeCarouselCard,
  FORMAT_ICONS,
} from "@/components/meta/creative/helpers";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
import { CampaignReadinessCard, type ReadinessCheck } from "@/components/shared/campaign-readiness-card";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  AlertCircle,
  Info,
  Globe,
  Monitor,
  CheckCircle2,
  ChevronDown,
  Megaphone,
  Sparkles,
  ShoppingBag,
} from "lucide-react";


/* ================================================================== */
/*  Placement Configuration Section                                    */
/* ================================================================== */

const FB_POSITIONS: { value: MetaFacebookPosition; label: string }[] = [
  { value: "feed", label: "Feed" },
  { value: "video_feeds", label: "Video Feeds" },
  { value: "story", label: "Stories" },
  { value: "reels", label: "Reels" },
  { value: "marketplace", label: "Marketplace" },
  { value: "search", label: "Search Results" },
  { value: "right_hand_column", label: "Right Column" },
  { value: "instant_article", label: "Instant Articles" },
  { value: "facebook_groups_feed", label: "Groups Feed" },
];

const IG_POSITIONS: { value: MetaInstagramPosition; label: string }[] = [
  { value: "stream", label: "Feed" },
  { value: "story", label: "Stories" },
  { value: "reels", label: "Reels" },
  { value: "explore", label: "Explore" },
  { value: "explore_home", label: "Explore Home" },
  { value: "ig_search", label: "Search Results" },
  { value: "profile_feed", label: "Profile Feed" },
];

function PlacementSection() {
  const { campaign, updateNested } = useMetaCampaign();
  const obj = campaign.objective;
  const [showManualDetails, setShowManualDetails] = useState(false);

  const togglePublisherPlatform = (plat: MetaPublisherPlatform) => {
    const current = obj.publisherPlatforms;
    const next = current.includes(plat) ? current.filter((p) => p !== plat) : [...current, plat];
    if (next.length > 0) updateNested("objective", { publisherPlatforms: next });
  };

  const toggleFbPosition = (pos: MetaFacebookPosition) => {
    const current = obj.facebookPositions;
    const next = current.includes(pos) ? current.filter((p) => p !== pos) : [...current, pos];
    if (next.length > 0) updateNested("objective", { facebookPositions: next });
  };

  const toggleIgPosition = (pos: MetaInstagramPosition) => {
    const current = obj.instagramPositions;
    const next = current.includes(pos) ? current.filter((p) => p !== pos) : [...current, pos];
    if (next.length > 0) updateNested("objective", { instagramPositions: next });
  };

  const fbCount = obj.facebookPositions.length;
  const igCount = obj.instagramPositions.length;
  const totalPlacements = fbCount + igCount;

  return (
    <div>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1877F2]/10">
          <Globe className="size-4 text-[#1877F2]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold text-foreground">Placement Configuration</Label>
            <ApiBadge field="targeting.publisher_platforms" />
            <InfoTip text="Controls where your ads appear across Facebook and Instagram. Advantage+ lets Meta optimize placement automatically for better results." />
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Choose where your ads are shown. More placements give Meta more flexibility to find results at lower cost.
          </p>
        </div>
      </div>

      {/* Advantage+ vs Manual */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => updateNested("objective", { placementMode: "AUTOMATIC" })}
          className={cn(
            "flex flex-col rounded-xl border-2 p-4 text-left transition-all",
            obj.placementMode === "AUTOMATIC"
              ? "border-[#1877F2] bg-[#1877F2]/[0.04] shadow-sm"
              : "border-border hover:border-[#1877F2]/40"
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              obj.placementMode === "AUTOMATIC" ? "bg-[#1877F2] text-white" : "bg-muted text-muted-foreground"
            )}>
              <Megaphone className="size-4" />
            </div>
            {obj.placementMode === "AUTOMATIC" && <CheckCircle2 className="size-4 text-[#1877F2]" />}
          </div>
          <p className={cn("text-xs font-semibold", obj.placementMode === "AUTOMATIC" ? "text-[#1877F2]" : "text-foreground")}>
            Advantage+ Placements
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Meta automatically selects the best placements for your budget.
          </p>
          <Badge className="mt-2 w-fit rounded-full bg-[#1877F2] px-2 py-0 text-[10px] text-white">Recommended</Badge>
        </button>

        <button
          type="button"
          onClick={() => { updateNested("objective", { placementMode: "MANUAL" }); setShowManualDetails(true); }}
          className={cn(
            "flex flex-col rounded-xl border-2 p-4 text-left transition-all",
            obj.placementMode === "MANUAL"
              ? "border-[#1877F2] bg-[#1877F2]/[0.04] shadow-sm"
              : "border-border hover:border-[#1877F2]/40"
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              obj.placementMode === "MANUAL" ? "bg-[#1877F2] text-white" : "bg-muted text-muted-foreground"
            )}>
              <Monitor className="size-4" />
            </div>
            {obj.placementMode === "MANUAL" && <CheckCircle2 className="size-4 text-[#1877F2]" />}
          </div>
          <p className={cn("text-xs font-semibold", obj.placementMode === "MANUAL" ? "text-[#1877F2]" : "text-foreground")}>
            Manual Placements
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Choose specific Facebook and Instagram placements.
          </p>
          {obj.placementMode === "MANUAL" && (
            <Badge variant="outline" className="mt-2 w-fit rounded-full px-1.5 py-0 text-[9px]">{totalPlacements} selected</Badge>
          )}
        </button>
      </div>

      {/* Manual placement details */}
      {obj.placementMode === "MANUAL" && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/10 p-4">
          {/* Publisher Platforms */}
          <div>
            <Label className="mb-2 block text-xs font-semibold text-foreground">Publisher Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {(["facebook", "instagram", "audience_network", "messenger"] as MetaPublisherPlatform[]).map((plat) => {
                const labels: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", audience_network: "Audience Network", messenger: "Messenger" };
                const selected = obj.publisherPlatforms.includes(plat);
                return (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => togglePublisherPlatform(plat)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      selected ? "border-[#1877F2] bg-[#1877F2]/10 text-[#1877F2]" : "border-border text-muted-foreground hover:border-[#1877F2]/40"
                    )}
                  >
                    {selected && <CheckCircle2 className="size-3" />}
                    {labels[plat]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Facebook Positions */}
          {obj.publisherPlatforms.includes("facebook") && (
            <div>
              <button
                type="button"
                onClick={() => setShowManualDetails((v) => !v)}
                className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground"
              >
                <svg viewBox="0 0 24 24" className="size-3.5 text-[#1877F2]" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" /></svg>
                Facebook Positions ({fbCount})
                {showManualDetails ? <ChevronDown className="size-3 rotate-180" /> : <ChevronDown className="size-3" />}
              </button>
              {showManualDetails && (
                <div className="flex flex-wrap gap-1.5">
                  {FB_POSITIONS.map((pos) => {
                    const selected = obj.facebookPositions.includes(pos.value);
                    return (
                      <button key={pos.value} type="button" onClick={() => toggleFbPosition(pos.value)}
                        className={cn("rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all",
                          selected ? "border-[#1877F2]/30 bg-[#1877F2]/10 text-[#1877F2]" : "border-border text-muted-foreground hover:border-[#1877F2]/20"
                        )}
                      >{pos.label}</button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Instagram Positions */}
          {obj.publisherPlatforms.includes("instagram") && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" /></svg>
                Instagram Positions ({igCount})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {IG_POSITIONS.map((pos) => {
                  const selected = obj.instagramPositions.includes(pos.value);
                  return (
                    <button key={pos.value} type="button" onClick={() => toggleIgPosition(pos.value)}
                      className={cn("rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all",
                        selected ? "border-[#E4405F]/30 bg-[#E4405F]/10 text-[#E4405F]" : "border-border text-muted-foreground hover:border-[#E4405F]/20"
                      )}
                    >{pos.label}</button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-md border border-[#1877F2]/20 bg-[#1877F2]/5 px-3 py-2">
            <Info className="mt-0.5 size-3 shrink-0 text-[#1877F2]" />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Your creative preview below automatically adapts to show how ads appear in each selected placement. Meta optimizes delivery across selected placements.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export function MetaStepCreative() {
  const { campaign, setStep, updateNested } = useMetaCampaign();
  const creative = campaign.creative;
  const objective = campaign.objective;
  const ads = creative.ads;
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const [previewPlacement, setPreviewPlacement] = useState<PreviewPlacement>("FACEBOOK_FEED");
  const [placementSafetyOpen, setPlacementSafetyOpen] = useState(false);
  const objConfig = META_OBJECTIVE_CONFIGS[objective.objective] ?? META_OBJECTIVE_CONFIGS.OUTCOME_SALES;

  const catalogEnabled = objective.catalogEnabled;

  const updateAds = (updatedAds: MetaAd[]) => updateNested("creative", { ads: updatedAds });

  const updateAdAtIndex = (index: number, updates: Partial<MetaAd>) => {
    const updated = [...ads];
    updated[index] = { ...updated[index], ...updates };
    updateAds(updated);
  };

  const addAd = (format: MetaAdFormat = "SINGLE_IMAGE") => {
    const newAd = makeDefaultAd(format, ads.length);
    if (format === "CAROUSEL" && newAd.carouselCards.length < 2) {
      newAd.carouselCards = [makeCarouselCard(0), makeCarouselCard(1)];
    }
    updateAds([...ads, newAd]);
    setActiveAdIndex(ads.length);
  };

  const removeAd = (index: number) => {
    const updated = ads.filter((_, i) => i !== index);
    updateAds(updated);
    if (activeAdIndex >= updated.length) setActiveAdIndex(Math.max(0, updated.length - 1));
  };

  const duplicateAd = (index: number) => {
    const source = ads[index];
    const dup: MetaAd = {
      ...source,
      id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${source.name} (copy)`,
    };
    const updated = [...ads];
    updated.splice(index + 1, 0, dup);
    updateAds(updated);
    setActiveAdIndex(index + 1);
  };

  /* Auto-create first ad if none exists */
  if (ads.length === 0) {
    const firstAd = makeDefaultAd(catalogEnabled ? "DYNAMIC" : "SINGLE_IMAGE", 0);
    updateAds([firstAd]);
    return null;
  }

  const currentAd = ads[activeAdIndex];
  if (!currentAd) return null;

  const isCatalogFormat = currentAd.adFormat === "DYNAMIC" || currentAd.adFormat === "COLLECTION";
  const isCarousel = currentAd.adFormat === "CAROUSEL";
  const formatConfig = AD_FORMAT_OPTIONS.find((f) => f.value === currentAd.adFormat);
  const supportedPlacements = formatConfig?.supportedPlacements || ["FACEBOOK_FEED"];

  const isValid = isCatalogFormat
    ? ads.every((ad) => ad.primaryText && ad.websiteUrl)
    : ads.every((ad) => ad.primaryText && ad.headline && ad.websiteUrl);

  /* Ensure preview placement is valid for current format */
  const activePlacement = supportedPlacements.includes(previewPlacement) ? previewPlacement : supportedPlacements[0];
  const isReelsOrStory = activePlacement.includes("REELS") || activePlacement.includes("STORY");

  /* Readiness checks */
  const readinessChecks: ReadinessCheck[] = isCatalogFormat
    ? [
        { label: "Placements configured", done: objective.placementMode === "AUTOMATIC" || (objective.facebookPositions.length + objective.instagramPositions.length) > 0 },
        { label: "Product set selected", done: true },
        { label: "Landing page URL set", done: currentAd.websiteUrl.length > 0 },
        { label: "Ad message written", done: currentAd.primaryText.length > 0 },
        { label: "CTA selected", done: currentAd.callToAction !== "NO_BUTTON" },
        { label: "Product info configured", done: true },
      ]
    : [
        { label: "Placements configured", done: objective.placementMode === "AUTOMATIC" || (objective.facebookPositions.length + objective.instagramPositions.length) > 0 },
        { label: "Media uploaded", done: isCarousel ? currentAd.carouselCards.some((c) => !!c.imageUrl) : currentAd.assets.length > 0 },
        { label: "Primary text written", done: currentAd.primaryText.length > 0 },
        { label: "Headline set", done: currentAd.headline.length > 0 },
        { label: "Website URL set", done: currentAd.websiteUrl.length > 0 },
        { label: "CTA selected", done: currentAd.callToAction !== "NO_BUTTON" },
        ...(isCarousel ? [{ label: "Min 2 carousel cards", done: currentAd.carouselCards.length >= 2 }] : []),
      ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>
        {/* ============================================================ */}
        {/* LEFT COLUMN                                                   */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">
          {/* ---- 1. Ad Identity ---- */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 px-6 py-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1877F2]/10">
                <svg viewBox="0 0 24 24" className="size-4 text-[#1877F2]" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Your Meta Accounts</p>
                <p className="text-xs text-muted-foreground">Connected for ad delivery</p>
              </div>
            </div>
            <div className="border-t border-border px-6 py-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="size-3.5 text-[#1877F2]" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
                    </svg>
                    <span className="text-xs text-muted-foreground">Facebook Page</span>
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {objective.facebookPageName || "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
                    </svg>
                    <span className="text-xs text-muted-foreground">Instagram Account</span>
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {objective.instagramAccountName || objective.facebookPageName || "Not set"}
                  </span>
                </div>
              </div>
              {!objective.facebookPageName && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                  <AlertCircle className="mt-0.5 size-3 shrink-0 text-amber-600" />
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-medium text-amber-700">Facebook Page not set.</span> Go back to Campaign Setup to connect your page.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ---- 2. Catalog Banner (conditional) ---- */}
          {catalogEnabled && (
            <div className="flex items-start gap-3 rounded-xl border border-[#1877F2]/30 bg-[#1877F2]/[0.03] px-4 py-3">
              <ShoppingBag className="mt-0.5 size-5 shrink-0 text-[#1877F2]" />
              <div>
                <p className="text-sm font-semibold text-foreground">Catalog Connected</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Your Salla product catalog is active. You can use <span className="font-medium text-foreground">Advantage+ Catalog</span> to auto-generate ads from your products,
                  or create manual ads with Single Image, Video, or Carousel formats.
                </p>
              </div>
            </div>
          )}

          {/* ---- 3. Placement & Brand Safety (collapsible) ---- */}
          <div className={cn("rounded-2xl transition-colors", placementSafetyOpen ? "bg-muted/50 p-2" : "")}>
            <button
              type="button"
              onClick={() => setPlacementSafetyOpen(!placementSafetyOpen)}
              className={cn(
                "flex w-full items-center justify-between px-6 pb-3 pt-5 text-left transition-colors rounded-2xl",
                !placementSafetyOpen && "border border-border bg-card"
              )}
            >
              <div>
                <span className="text-base font-bold text-foreground">Ad Placement & Brand Safety</span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose your ad placements and surrounding content to ensure your brand identity remains protected.
                </p>
              </div>
              <ChevronDown className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                placementSafetyOpen && "rotate-180"
              )} />
            </button>
            {placementSafetyOpen && (
              <div className="mt-2 flex flex-col gap-4">
                {/* ── Content Safety ── */}
                <div className="rounded-xl bg-card px-6 py-5">
                  <h3 className="text-sm font-bold text-foreground">Content Safety</h3>
                  <p className="mb-4 mt-1 text-xs text-muted-foreground">
                    Control what types of content your ads can appear alongside.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {([
                      { value: "FACEBOOK_STANDARD" as const, label: "Standard Inventory", desc: "Excludes sensitive content categories. Appropriate for most brands.", tradeoff: "Balanced reach and safety", recommended: true },
                      { value: "FULL_INVENTORY" as const, label: "Full Inventory", desc: "No content restrictions. Maximum reach with ads appearing alongside all content.", tradeoff: "Maximum reach, less control" },
                      { value: "LIMITED_INVENTORY" as const, label: "Limited Inventory", desc: "Most restrictive. Excludes all mature themes and controversial content.", tradeoff: "Highest safety, reduced reach" },
                    ]).map((opt) => {
                      const selected = creative.brandSafetyLevel === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateNested("creative", { brandSafetyLevel: opt.value })}
                          className={cn(
                            "flex flex-1 flex-col gap-2 rounded-xl border px-5 py-4 text-left transition-all",
                            selected
                              ? "border-[#1877F2] bg-[#1877F2]/[0.04]"
                              : "border-border bg-card hover:border-[#1877F2]/40"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn("text-sm font-bold", selected ? "text-[#1877F2]" : "text-foreground")}>{opt.label}</span>
                            {opt.recommended && (
                              <Badge className="rounded-full bg-[#1877F2] px-1.5 py-0 text-[9px] text-white">Recommended</Badge>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed text-muted-foreground">{opt.desc}</p>
                          <span className="text-[10px] font-medium text-muted-foreground/70">{opt.tradeoff}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Ad Placement ── */}
                <div className="rounded-xl bg-card px-6 py-5">
                  <PlacementSection />
                </div>
              </div>
            )}
          </div>

          {/* ---- 4. Advantage+ Creative ---- */}
          <div className="rounded-xl border border-border bg-card px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1877F2]/10">
                  <Sparkles className="size-4 text-[#1877F2]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Advantage+ Creative</p>
                  <p className="text-xs text-muted-foreground">
                    Meta AI auto-generates creative variations (brightness, crop, text placement) to optimize per placement.
                  </p>
                </div>
              </div>
              <Switch
                checked={creative.advantagePlusCreative ?? false}
                onCheckedChange={(v) => updateNested("creative", { advantagePlusCreative: v })}
              />
            </div>
          </div>

          {/* ---- 5. Campaign Content (AdPanel list) ---- */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 pt-5 pb-1">
              <div className="mb-1">
                <Label className="text-base font-bold text-foreground">Campaign Content</Label>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Create and manage your ads. Click an ad to expand and edit its format, media, copy, and destination.
              </p>
            </div>

            <div className="px-5 pb-5">
              <div className="flex flex-col gap-3">
                {ads.map((ad, i) => (
                  <MetaAdPanel
                    key={ad.id}
                    ad={ad}
                    adIndex={i}
                    totalAds={ads.length}
                    isActive={i === activeAdIndex}
                    catalogEnabled={catalogEnabled}
                    objConfig={objConfig}
                    onSelect={() => setActiveAdIndex(i)}
                    onUpdate={(updates) => updateAdAtIndex(i, updates)}
                    onRemove={() => removeAd(i)}
                    onDuplicate={() => duplicateAd(i)}
                  />
                ))}

                {/* Ad count guidance */}
                {ads.length >= 3 && ads.length < 6 && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#1877F2]/30 bg-[#1877F2]/5 px-4 py-3">
                    <Info className="mt-0.5 size-3.5 shrink-0 text-[#1877F2]" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Good set!</span> Having 3–5 ads gives Meta enough variety to optimize delivery across audiences and placements.
                    </p>
                  </div>
                )}
                {ads.length >= 6 && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-amber-700">Heads up:</span> With {ads.length} ads, your budget may be spread thin. Consider focusing on your best 3–5 creatives.
                    </p>
                  </div>
                )}

                {/* Add Another Ad */}
                <div className="rounded-xl border-2 border-dashed border-border py-6">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex size-10 items-center justify-center rounded-full bg-[#1877F2]/10">
                      <Plus className="size-5 text-[#1877F2]" />
                    </div>
                    <p className="text-sm font-bold text-[#1877F2]">Add Another Ad</p>
                    <p className="text-xs text-muted-foreground">A/B test different creatives to optimize performance</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 px-6 sm:grid-cols-4">
                    {AD_FORMAT_OPTIONS.filter((f) => objConfig.allowedAdFormats.includes(f.value))
                      .filter((f) => f.value !== "COLLECTION")
                      .filter((f) => f.value !== "DYNAMIC" || catalogEnabled)
                      .map((fmt) => (
                        <button
                          key={fmt.value}
                          type="button"
                          onClick={() => addAd(fmt.value)}
                          className="flex flex-col items-center gap-1.5 rounded-lg border border-border px-2 py-3 text-center transition-colors hover:border-[#1877F2]/40 hover:bg-[#1877F2]/[0.02]"
                        >
                          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            {FORMAT_ICONS[fmt.value]}
                          </div>
                          <span className="text-[10px] font-medium text-foreground">
                            {fmt.value === "DYNAMIC" ? "Catalog Ads" : fmt.label}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN -- Preview & Readiness                          */}
        {/* ============================================================ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-20 flex flex-col gap-4">
            {/* Placement preview selector */}
            <SectionCard className="p-3">
              <Label className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Preview Placement
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                {supportedPlacements.map((p) => {
                  const spec = PLACEMENT_SPECS[p];
                  const active = p === activePlacement;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPreviewPlacement(p)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left transition-colors",
                        active
                          ? spec.platform === "instagram"
                            ? "border-[#E4405F] bg-[#E4405F]/5"
                            : "border-[#1877F2] bg-[#1877F2]/5"
                          : "border-border hover:bg-muted/30"
                      )}
                    >
                      {spec.platform === "facebook" ? (
                        <svg viewBox="0 0 24 24" className="size-3 shrink-0" fill={active ? "#1877F2" : "currentColor"}>
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="size-3 shrink-0" fill={active ? "#E4405F" : "currentColor"}>
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
                        </svg>
                      )}
                      <span className={cn("text-[10px] font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                        {spec.label.replace("Facebook ", "FB ").replace("Instagram ", "IG ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* Live Preview */}
            {isReelsOrStory ? (
              <ReelsStoriesPreview ad={currentAd} placement={activePlacement} pageName={objective.facebookPageName} accountName={objective.instagramAccountName || objective.facebookPageName} isCatalog={isCatalogFormat} />
            ) : activePlacement === "INSTAGRAM_FEED" ? (
              <InstagramFeedPreview ad={currentAd} accountName={objective.instagramAccountName || objective.facebookPageName} isCatalog={isCatalogFormat} />
            ) : (
              <FacebookFeedPreview ad={currentAd} pageName={objective.facebookPageName} isCatalog={isCatalogFormat} />
            )}

            {/* Campaign Readiness Card */}
            <CampaignReadinessCard checks={readinessChecks} />
          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(2)}
        onNext={() => setStep(4)}
        previousLabel="Previous"
        nextLabel="Next"
        nextDisabled={!isValid}
        accent="meta"
      />
    </TooltipProvider>
  );
}
