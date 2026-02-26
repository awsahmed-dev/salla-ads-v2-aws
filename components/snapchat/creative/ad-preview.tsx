"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { InfoTip } from "@/components/shared/info-tip";
import {
  Smartphone,
  Signal,
  Wifi,
  ChevronRight,
  ChevronUp,
  Heart,
  Share2,
  FileText,
  Tv,
  ImagePlus,
  Users,
  Eye,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Link2,
  Star,
  Ghost,
  Image as ImageIcon,
  Compass,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { PREVIEW_PRODUCTS, formatSAR } from "@/lib/salla/store-api";
import {
  CTA_OPTIONS,
  LEAD_CTA_OPTIONS,
  APP_INSTALL_CTA_OPTIONS,
  FORMAT_OPTIONS,
} from "./constants";
import { isInfluencerAd, getFormatLabel, getDestinationLabel } from "./helpers";
import type {
  AdGroup,
  CreativeAsset,
  CreativeSettings,
} from "@/lib/snapchat/campaign-types";

/* ------------------------------------------------------------------ */
/*  Swipe-up bounce keyframes                                          */
/* ------------------------------------------------------------------ */

const SWIPE_CSS = `
@keyframes snapSwipeHint {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-6px); opacity: 1; }
}
@keyframes dpaCycle {
  0%, 90% { opacity: 1; }
  95%, 100% { opacity: 0; }
}
`;

/* ------------------------------------------------------------------ */
/*  Main Preview Component                                             */
/* ------------------------------------------------------------------ */

export function SnapchatAdPreview({
  ads,
  activeAdIdx,
  setActiveAdIdx,
  activeAd,
  activeAdType,
  previewAsset,
  defaultCTA,
  creative,
  objectiveName,
  previewAssetIdx,
  setPreviewAssetIdx,
}: {
  ads: AdGroup[];
  activeAdIdx: number;
  setActiveAdIdx: (i: number) => void;
  activeAd: AdGroup | undefined;
  activeAdType: string;
  previewAsset: CreativeAsset | null;
  defaultCTA: string;
  creative: CreativeSettings;
  objectiveName: string;
  previewAssetIdx?: number;
  setPreviewAssetIdx?: (i: number) => void;
}) {
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [storySnapIdx, setStorySnapIdx] = useState(0);
  const [storyPreviewMode, setStoryPreviewMode] = useState<"story" | "tile">("story");
  const [dpaProductIdx, setDpaProductIdx] = useState(0);

  const storyAssets = activeAd?.assets ?? [];
  const isStory = activeAdType === "COMPOSITE";
  const currentSnapIdx = isStory ? storySnapIdx : (previewAssetIdx ?? 0);
  const currentAsset = isStory
    ? (storyAssets[storySnapIdx] ?? previewAsset)
    : previewAsset;

  useEffect(() => { setStorySnapIdx(0); setStoryPreviewMode("story"); }, [activeAdIdx]);

  // Auto-cycle DPA products
  useEffect(() => {
    if (activeAdType !== "DYNAMIC") return;
    const timer = setInterval(() => {
      setDpaProductIdx((i) => (i + 1) % Math.min(PREVIEW_PRODUCTS.length, 6));
    }, 3000);
    return () => clearInterval(timer);
  }, [activeAdType]);

  const brandName = currentAsset?.brandName || "Brand Name";
  const brandInitials = brandName.slice(0, 2).toUpperCase();
  const headline = currentAsset?.headline || "";
  const url = currentAsset?.url || "";
  const mediaType = currentAsset?.mediaType || "";
  const cta = currentAsset?.cta || "";
  const claimStatus = currentAsset?.claimStatus || "";
  const mediaSource = currentAsset?.mediaSource || "";
  const websiteUrl = currentAsset?.websiteUrl || "";

  const isLeadGen = activeAdType === "LEAD_GENERATION";
  const isAppInstall = activeAdType === "APP_INSTALL";
  const isSnapAd = activeAdType === "SNAP_AD";
  const isDeepLink = activeAdType === "DEEP_LINK";
  const isDynamic = activeAdType === "DYNAMIC";
  const isCollection = activeAdType === "COLLECTION";
  const isInfluencer = activeAd ? isInfluencerAd(activeAd) : false;

  const hasMedia = !!url || claimStatus === "READY";
  const isVideo = mediaType === "VIDEO" && !!url;

  const ctaOptions = isAppInstall ? APP_INSTALL_CTA_OPTIONS : isLeadGen ? LEAD_CTA_OPTIONS : CTA_OPTIONS;
  const ctaLabel = cta
    ? (ctaOptions.find((c) => c.value === cta)?.label || cta.replace(/_/g, " "))
    : (ctaOptions.find((c) => c.value === defaultCTA)?.label || "Shop Now");

  const displayDomain = websiteUrl ? (() => { try { return new URL(websiteUrl).hostname; } catch { return websiteUrl; } })() : "example.com";

  const formatLabel = isInfluencer
    ? "Influencer"
    : activeAd?.adFormat
      ? `${getFormatLabel(activeAd.adFormat)}${activeAd.adFormat === "SINGLE" ? ` · ${getDestinationLabel(activeAd.adDestination)}` : ""}`
      : activeAdType;

  const totalAssets = activeAd?.assets?.length ?? 0;

  const showCTA = !isSnapAd;
  const showAttachmentCard = !isSnapAd;

  // Video controls
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress(v.currentTime / v.duration);
  }, []);

  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
    setIsMuted(true);
  }, [url, currentSnapIdx]);

  const goStoryPrev = () => setStorySnapIdx((i) => Math.max(0, i - 1));
  const goStoryNext = () => setStorySnapIdx((i) => Math.min(storyAssets.length - 1, i + 1));
  const goPrevAsset = () => setPreviewAssetIdx?.(Math.max(0, (previewAssetIdx ?? 0) - 1));
  const goNextAsset = () => setPreviewAssetIdx?.(Math.min(totalAssets - 1, (previewAssetIdx ?? 0) + 1));

  // DPA product for single-product view
  const dpaProduct = PREVIEW_PRODUCTS[dpaProductIdx] ?? PREVIEW_PRODUCTS[0];
  const showSaleBadge = activeAd?.dynamicTemplateConfig?.showSaleBadge;
  const showPrice = activeAd?.dynamicTemplateConfig?.showPrice;

  // Discover tile data
  const discoverTile = activeAd?.discoverTile;

  return (
    <SectionCard className="p-4">
      <style dangerouslySetInnerHTML={{ __html: SWIPE_CSS }} />

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="size-4 text-primary" />
          <Label className="text-sm font-semibold text-foreground">Ad Preview</Label>
        </div>
        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-medium">{formatLabel}</Badge>
      </div>

      {/* Story Ad view toggle */}
      {isStory && (
        <div className="mb-2 flex items-center justify-center gap-1 rounded-lg bg-muted/50 p-0.5">
          <button
            type="button"
            onClick={() => setStoryPreviewMode("story")}
            className={cn(
              "rounded-md px-3 py-1 text-[10px] font-medium transition-all",
              storyPreviewMode === "story"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Story View
          </button>
          <button
            type="button"
            onClick={() => setStoryPreviewMode("tile")}
            className={cn(
              "rounded-md px-3 py-1 text-[10px] font-medium transition-all",
              storyPreviewMode === "tile"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Discover Tile
          </button>
        </div>
      )}

      {/* ════════ DISCOVER TILE PREVIEW (Story Ad only) ════════ */}
      {isStory && storyPreviewMode === "tile" ? (
        <div className="flex flex-col items-center">
          {/* Discover feed context */}
          <div className="relative mx-auto w-[232px] overflow-hidden rounded-[2.2rem] border-[3px] border-foreground/10 bg-zinc-950 shadow-xl">
            <div className="absolute left-1/2 top-[3px] z-40 h-[14px] w-[72px] -translate-x-1/2 rounded-full bg-black" />

            <div className="relative flex flex-col" style={{ height: "502px" }}>
              {/* Status bar */}
              <div className="relative z-30 flex items-center justify-between px-5 pb-0.5 pt-5">
                <span className="text-[8px] font-semibold text-white">9:41</span>
                <div className="flex items-center gap-1">
                  <Signal className="size-2.5 text-white/70" />
                  <Wifi className="size-2.5 text-white/70" />
                  <div className="h-[7px] w-[16px] rounded-[2px] border border-white/50">
                    <div className="h-full w-3/4 rounded-[1px] bg-white/70" />
                  </div>
                </div>
              </div>

              {/* "Discover" header */}
              <div className="px-4 pb-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <Compass className="size-3.5 text-white/80" />
                  <span className="text-[11px] font-bold text-white">Discover</span>
                </div>
              </div>

              {/* Tile grid */}
              <div className="flex-1 overflow-hidden px-2 pb-4">
                <div className="grid grid-cols-2 gap-1.5">
                  {/* YOUR AD TILE (highlighted) */}
                  <div className="relative overflow-hidden rounded-xl ring-2 ring-primary/60">
                    <div className="aspect-[3/5]">
                      {discoverTile?.backgroundImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={discoverTile.backgroundImageUrl}
                          alt="Your Story tile"
                          className="size-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : storyAssets[0]?.url ? (
                        storyAssets[0].mediaType === "VIDEO" ? (
                          <video src={storyAssets[0].url} className="size-full object-cover" muted />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={storyAssets[0].url} alt="Snap 1" className="size-full object-cover" crossOrigin="anonymous" />
                        )
                      ) : (
                        <div className="flex size-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                          <ImagePlus className="size-6 text-white/15" />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {discoverTile?.logoImageUrl && (
                      <div className="absolute left-1.5 top-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={discoverTile.logoImageUrl} alt="Logo" className="h-3 w-auto rounded-sm object-contain" crossOrigin="anonymous" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 px-2 pb-2">
                      <p className="text-[7px] font-bold leading-tight text-white drop-shadow-sm">
                        {discoverTile?.headline || brandName}
                      </p>
                      <p className="mt-0.5 text-[5px] text-white/50">{brandName}</p>
                    </div>
                    <div className="absolute right-1 top-1 rounded-full bg-primary px-1 py-px text-[4px] font-bold text-white">
                      YOUR AD
                    </div>
                  </div>

                  {/* Placeholder tiles (other Discover content) */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="relative overflow-hidden rounded-xl bg-zinc-800">
                      <div className="aspect-[3/5] bg-gradient-to-br from-zinc-700/50 to-zinc-800" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 px-2 pb-2">
                        <div className="h-1.5 w-4/5 rounded-full bg-white/15" />
                        <div className="mt-1 h-1 w-3/5 rounded-full bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* iOS Home Indicator */}
              <div className="flex justify-center pb-2">
                <div className="h-[3px] w-24 rounded-full bg-white/25" />
              </div>
            </div>
          </div>

          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            How your Story tile appears in the Discover feed
          </p>
        </div>
      ) : (
        /* ════════ PHONE FRAME (all other formats + story playback) ════════ */
        <div className="relative mx-auto w-[232px] overflow-hidden rounded-[2.2rem] border-[3px] border-foreground/10 bg-black shadow-xl">
          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-[3px] z-40 h-[14px] w-[72px] -translate-x-1/2 rounded-full bg-black" />

          <div className="relative flex flex-col" style={{ height: "502px" }}>

            {/* ── iOS Status Bar ── */}
            <div className="relative z-30 flex items-center justify-between px-5 pb-0.5 pt-5">
              <span className="text-[8px] font-semibold text-white">9:41</span>
              <div className="flex items-center gap-1">
                <Signal className="size-2.5 text-white/70" />
                <Wifi className="size-2.5 text-white/70" />
                <div className="h-[7px] w-[16px] rounded-[2px] border border-white/50">
                  <div className="h-full w-3/4 rounded-[1px] bg-white/70" />
                </div>
              </div>
            </div>

            {/* ── Story Progress Bars (COMPOSITE only) ── */}
            {isStory && storyAssets.length > 1 && (
              <div className="relative z-30 flex gap-[2px] px-2 pt-0.5">
                {storyAssets.map((_, i) => (
                  <div key={i} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/25">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        i < storySnapIdx ? "w-full bg-white" :
                        i === storySnapIdx ? "bg-white" : "w-0"
                      )}
                      style={i === storySnapIdx ? { width: isVideo ? `${progress * 100}%` : "100%" } : undefined}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* ── Video Progress Bar (non-Story) ── */}
            {isVideo && !isStory && (
              <div className="relative z-30 mx-2 mt-0.5 h-[2px] overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
            )}

            {/* ── Brand Header Overlay ── */}
            <div className="relative z-20 px-3 pb-1 pt-1.5">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-sm">
                  <span className="text-[8px] font-bold text-white">{brandInitials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-[9px] font-semibold text-white drop-shadow-sm">{brandName}</p>
                    <span className="rounded bg-white/15 px-1 py-px text-[6px] font-medium text-white/70">Ad</span>
                  </div>
                  {isStory && (
                    <p className="text-[7px] leading-tight text-white/50">Story Ad</p>
                  )}
                </div>

                {isInfluencer && claimStatus === "READY" && (
                  <div className="flex items-center gap-0.5 rounded-full bg-white/15 px-1.5 py-0.5 backdrop-blur-sm">
                    <Users className="size-2 text-white/80" />
                    <span className="text-[5px] font-medium text-white/80">Paid</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Full-screen Creative Area ── */}
            <div className="absolute inset-0 z-0">
              {isDynamic ? (
                /* ═══ DYNAMIC PRODUCT AD ═══
                   Real Snap DPA shows ONE product full-screen at a time,
                   auto-generated from catalog data. We cycle through products. */
                <div className="relative flex size-full flex-col bg-black">
                  {/* Product image full-screen */}
                  <div className="absolute inset-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dpaProduct.image}
                      alt={dpaProduct.name}
                      className="size-full object-cover transition-opacity duration-500"
                      crossOrigin="anonymous"
                    />
                  </div>

                  {/* Top gradient for brand header visibility */}
                  <div className="absolute inset-x-0 top-0 z-[1] h-24 bg-gradient-to-b from-black/70 to-transparent" />

                  {/* Sale badge */}
                  {showSaleBadge && dpaProduct.salePrice && (
                    <div className="absolute left-3 top-[72px] z-[2] flex items-center gap-1 rounded-md bg-red-500 px-1.5 py-0.5 shadow-lg">
                      <Tag className="size-2 text-white" />
                      <span className="text-[7px] font-bold text-white">SALE</span>
                    </div>
                  )}

                  {/* Bottom product info overlay */}
                  <div className="absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-32 pt-16">
                    <div className="px-3">
                      <p className="text-[10px] font-semibold leading-tight text-white drop-shadow-sm">
                        {dpaProduct.name}
                      </p>
                      {showPrice && (
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-[11px] font-bold text-white">
                            {formatSAR(dpaProduct.salePrice ?? dpaProduct.price)}
                          </span>
                          {dpaProduct.salePrice && (
                            <span className="text-[8px] text-white/40 line-through">
                              {formatSAR(dpaProduct.price)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product dots */}
                  <div className="absolute bottom-[136px] left-1/2 z-[2] flex -translate-x-1/2 items-center gap-1">
                    {Array.from({ length: Math.min(PREVIEW_PRODUCTS.length, 6) }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "size-1 rounded-full transition-all",
                          i === dpaProductIdx ? "scale-125 bg-white" : "bg-white/30"
                        )}
                      />
                    ))}
                  </div>
                </div>
              ) : hasMedia ? (
                <>
                  {url ? (
                    isVideo ? (
                      <video
                        ref={videoRef}
                        src={url}
                        muted={isMuted}
                        autoPlay
                        loop
                        playsInline
                        className="size-full object-cover"
                        onTimeUpdate={onTimeUpdate}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="Ad preview" className="size-full object-cover" crossOrigin="anonymous" />
                    )
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
                      <Users className="size-6 text-primary" />
                      <p className="mt-1 text-[9px] font-medium text-primary">Influencer Content</p>
                      {claimStatus === "READY" && (
                        <p className="mt-0.5 text-[7px] text-primary/60">Content claimed</p>
                      )}
                    </div>
                  )}
                </>
              ) : isInfluencer ? (
                <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                  <div className="rounded-full bg-white/5 p-4">
                    <Ghost className="size-6 text-white/15" />
                  </div>
                  <p className="mt-2 text-[9px] font-medium text-white/25">Waiting for content</p>
                  <p className="text-[7px] text-white/15">Paste influencer ad code</p>
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

            {/* ── Story Tap Navigation ── */}
            {isStory && storyAssets.length > 1 && (
              <div className="absolute inset-0 z-[15] flex">
                <button type="button" className="h-full w-1/2" onClick={goStoryPrev} aria-label="Previous snap" />
                <button type="button" className="h-full w-1/2" onClick={goStoryNext} aria-label="Next snap" />
              </div>
            )}

            {/* ── Video Play/Pause Overlay ── */}
            {isVideo && !isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 z-[16] flex items-center justify-center bg-black/20"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                  <Play className="size-5 text-white" fill="white" />
                </div>
              </button>
            )}
            {isVideo && isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 z-[14]"
                aria-label="Pause video"
              />
            )}

            {/* ── Video Sound Toggle ── */}
            {isVideo && (
              <button
                type="button"
                onClick={toggleMute}
                className="absolute bottom-[152px] right-2 z-20 flex size-6 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="size-3 text-white/70" /> : <Volume2 className="size-3 text-white" />}
              </button>
            )}

            {/* ── Commercial Non-Skip Indicator ── */}
            {activeAd?.commercialConfig?.enabled && (
              <div className="absolute right-2 top-[46px] z-20">
                <div className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur-sm">
                  <Tv className="size-2 text-white/80" />
                  <span className="text-[6px] font-medium text-white/80">Ad</span>
                </div>
              </div>
            )}

            {/* ── Format Badge (top-right) ── */}
            <div className="absolute right-2 top-[66px] z-20 flex flex-col gap-1">
              {isStory && (
                <span className="rounded-full bg-black/40 px-2 py-0.5 text-[6px] font-semibold text-white/90 backdrop-blur-sm">
                  Story {storySnapIdx + 1}/{storyAssets.length}
                </span>
              )}
              {isInfluencer && mediaSource === "ad_code" && (
                <span className="rounded-full bg-primary/60 px-2 py-0.5 text-[6px] font-semibold text-white backdrop-blur-sm">Creator</span>
              )}
              {isLeadGen && (
                <span className="rounded-full bg-blue-500/70 px-2 py-0.5 text-[6px] font-semibold text-white backdrop-blur-sm">Lead Form</span>
              )}
              {isDynamic && (
                <span className="rounded-full bg-amber-500/70 px-2 py-0.5 text-[6px] font-semibold text-white backdrop-blur-sm">Catalog</span>
              )}
              {isAppInstall && (
                <span className="rounded-full bg-blue-600/70 px-2 py-0.5 text-[6px] font-semibold text-white backdrop-blur-sm">App</span>
              )}
              {isDeepLink && (
                <span className="rounded-full bg-violet-500/70 px-2 py-0.5 text-[6px] font-semibold text-white backdrop-blur-sm">Deep Link</span>
              )}
            </div>

            {/* ── Content Safe Zone Overlay ── */}
            {showSafeZone && (
              <div className="pointer-events-none absolute inset-0 z-[25]">
                <div className="absolute inset-x-0 top-0 flex items-end justify-center bg-red-500/20" style={{ height: "88px" }}>
                  <span className="mb-1 rounded bg-red-900/70 px-1.5 py-0.5 text-[5px] font-bold uppercase tracking-wider text-red-200">Header zone</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-start justify-center bg-red-500/20" style={{ height: "138px" }}>
                  <span className="mt-2 rounded bg-red-900/70 px-1.5 py-0.5 text-[5px] font-bold uppercase tracking-wider text-red-200">CTA zone</span>
                </div>
                <div className="absolute bottom-[138px] left-0 top-[88px] w-2 bg-amber-500/15" />
                <div className="absolute bottom-[138px] right-0 top-[88px] w-2 bg-amber-500/15" />
                <div className="absolute inset-x-2 flex items-center justify-center border-2 border-dashed border-emerald-400/60" style={{ top: "88px", bottom: "138px" }}>
                  <span className="rounded bg-emerald-900/60 px-2 py-0.5 text-[6px] font-bold text-emerald-200">Safe zone</span>
                </div>
              </div>
            )}

            {/* ── Bottom Section ── */}
            <div className="relative z-20 mt-auto">
              <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              <div className="relative px-3 pb-3">

                {/* Lead Gen form peek */}
                {isLeadGen && (
                  <div className="mb-2 overflow-hidden rounded-xl bg-white/10 px-2.5 pb-0 pt-2 backdrop-blur-md">
                    <p className="mb-1.5 text-[7px] font-semibold text-white/80">Quick sign-up</p>
                    <div className="flex flex-col gap-1">
                      <div className="h-4 rounded bg-white/10" />
                      <div className="h-4 rounded bg-white/10" />
                    </div>
                    <div className="mt-1.5 h-6 -mx-2.5 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}

                {/* ═══ COLLECTION TILES ═══ */}
                {isCollection && activeAd && (
                  <>
                    {/* Swipe indicator above tiles */}
                    <div className="mb-1.5 flex items-center justify-center gap-1">
                      <ChevronUp className="size-2.5 text-white/40" />
                      <span className="text-[6px] font-medium text-white/40">Browse products</span>
                    </div>
                    {activeAd.dynamicCollectionEnabled ? (
                      <div className="mb-2 flex gap-1">
                        {PREVIEW_PRODUCTS.slice(0, 4).map((p) => (
                          <div key={p.id} className="flex flex-1 flex-col overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm">
                            <div className="aspect-square">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.image} alt={p.name} className="size-full object-cover" crossOrigin="anonymous" />
                            </div>
                            <div className="px-0.5 py-0.5">
                              <p className="truncate text-[5px] font-medium text-white/80">{p.name}</p>
                              <p className="text-[5px] font-bold text-amber-400">{formatSAR(p.salePrice ?? p.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : activeAd.collectionTiles.length > 0 ? (
                      <div className="mb-2 flex gap-1">
                        {activeAd.collectionTiles.slice(0, 4).map((tile, ti) => (
                          <div key={tile.id} className="flex flex-1 flex-col overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm">
                            <div className="aspect-square">
                              {tile.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={tile.imageUrl} alt={tile.title} className="size-full object-cover" crossOrigin="anonymous" />
                              ) : (
                                <div className="flex size-full items-center justify-center bg-white/5">
                                  <span className="text-[8px] font-bold text-white/20">{ti + 1}</span>
                                </div>
                              )}
                            </div>
                            {tile.title && <p className="truncate px-0.5 py-0.5 text-[5px] text-white/80">{tile.title}</p>}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}

                {/* ═══ ATTACHMENT CARD ═══ */}
                {showAttachmentCard && (
                  isAppInstall ? (
                    <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/10 px-2.5 py-2 backdrop-blur-md">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                        <Download className="size-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[8px] font-semibold text-white">{brandName}</p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map((s) => <Star key={s} className="size-1.5 fill-amber-400 text-amber-400" />)}
                          </div>
                          <span className="text-[5px] text-white/40">4.8</span>
                        </div>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[7px] font-bold text-blue-600">GET</span>
                    </div>
                  ) : isDeepLink ? (
                    <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/10 px-2.5 py-2 backdrop-blur-md">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-600">
                        <Link2 className="size-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[8px] font-semibold text-white">{brandName}</p>
                        <p className="text-[6px] text-white/50">Open in app</p>
                      </div>
                      <ChevronRight className="size-3 shrink-0 text-white/40" />
                      <Heart className="size-4 shrink-0 text-white/60" />
                    </div>
                  ) : (
                    <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/10 px-2.5 py-2 backdrop-blur-md">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                        <span className="text-[7px] font-bold text-white">{brandInitials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[8px] font-semibold text-white">{brandName}</p>
                        {headline ? (
                          <p className="truncate text-[6px] text-white/60">{headline}</p>
                        ) : (
                          <p className="truncate text-[6px] text-white/40">{displayDomain}</p>
                        )}
                      </div>
                      <ChevronRight className="size-3 shrink-0 text-white/40" />
                      <Heart className="size-4 shrink-0 text-white/60" />
                    </div>
                  )
                )}

                {/* ═══ CTA + Share row ═══ */}
                {showCTA && (
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex-1 rounded-full py-2 text-center text-[10px] font-bold tracking-wide shadow-lg",
                        isLeadGen ? "bg-primary text-white" :
                        isAppInstall ? "bg-blue-500 text-white" :
                        "bg-white text-black"
                      )}
                    >
                      {ctaLabel}
                    </div>
                    <div className="flex size-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                      <Share2 className="size-3.5 text-white/70" />
                    </div>
                  </div>
                )}

                {/* ═══ SNAP AD: awareness-only indicator ═══ */}
                {isSnapAd && (
                  <div className="flex justify-center py-2">
                    <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[7px] font-medium text-white/60 backdrop-blur-sm">
                      <Eye className="size-2.5" />
                      Awareness only — no swipe-up
                    </span>
                  </div>
                )}

                {/* Offer disclaimer pill */}
                {activeAd?.offerDisclaimer?.enabled && activeAd.offerDisclaimer.disclaimerText && (
                  <div className="mt-1.5 flex justify-center">
                    <span className="flex items-center gap-0.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[6px] font-medium text-white/80 backdrop-blur-sm">
                      <FileText className="size-1.5" />
                      See Offer Details
                    </span>
                  </div>
                )}

                {/* Swipe-up hint */}
                {showCTA && !isSnapAd && hasMedia && (
                  <div className="mt-1 flex justify-center">
                    <ChevronUp
                      className="size-3.5 text-white/40"
                      style={{ animation: "snapSwipeHint 2s ease-in-out infinite" }}
                    />
                  </div>
                )}
              </div>

              {/* iOS Home Indicator */}
              <div className="flex justify-center pb-2">
                <div className="h-[3px] w-24 rounded-full bg-white/25" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ CONTROLS BELOW PHONE ════════ */}
      <div className="mt-3 flex flex-col gap-2.5">

        {/* Ad name + ad dots */}
        <div className="flex flex-col items-center gap-1.5">
          {activeAd && (
            <p className="text-center text-xs text-muted-foreground">
              {isStory && storyPreviewMode === "story"
                ? `Snap ${storySnapIdx + 1} of ${storyAssets.length}`
                : isDynamic
                  ? `${dpaProduct.name}`
                  : activeAd.name}
            </p>
          )}
          {ads.length > 1 && (
            <div className="flex items-center gap-1.5">
              {ads.map((ad, i) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => setActiveAdIdx(i)}
                  className={cn(
                    "size-2 rounded-full transition-all",
                    i === activeAdIdx ? "scale-125 bg-primary" : "bg-muted-foreground/25 hover:bg-muted-foreground/40"
                  )}
                  title={ad.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Creative asset switcher (multi-asset, non-Story) */}
        {!isStory && !isDynamic && totalAssets > 1 && setPreviewAssetIdx && (
          <div className="flex items-center justify-center gap-2">
            <button type="button" onClick={goPrevAsset} disabled={(previewAssetIdx ?? 0) === 0} className="rounded p-0.5 text-muted-foreground disabled:opacity-30 hover:text-foreground">
              <ChevronRight className="size-3.5 rotate-180" />
            </button>
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              Creative {(previewAssetIdx ?? 0) + 1} / {totalAssets}
            </span>
            <button type="button" onClick={goNextAsset} disabled={(previewAssetIdx ?? 0) >= totalAssets - 1} className="rounded p-0.5 text-muted-foreground disabled:opacity-30 hover:text-foreground">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}

        {/* Controls row: safe zone + sound */}
        <div className="flex items-center justify-center gap-4">
          {!(isStory && storyPreviewMode === "tile") && (
            <div className="flex items-center gap-1.5">
              <Switch
                checked={showSafeZone}
                onCheckedChange={setShowSafeZone}
                className="scale-75"
              />
              <span className="text-[11px] font-medium text-foreground">Safe zone</span>
              <InfoTip text="Shows where content is fully visible. The header and CTA zones are covered by Snapchat UI elements — keep key visuals in the green safe area." />
            </div>
          )}
          {isVideo && (
            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {isMuted ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
              {isMuted ? "Sound off" : "Sound on"}
            </button>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
