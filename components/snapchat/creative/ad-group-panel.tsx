"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Copy,
  Trash2,
  Users,
  Plus,
  ImagePlus,
  ChevronUp,
  ChevronDown,
  Check,
  Sparkles,
  Upload,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import type { AdGroup, AdFormat, AdDestination, CreativeAsset, WebViewCTA, CampaignObjective } from "@/lib/snapchat/campaign-types";
import { deriveCreativeType, makeDefaultDynamicTemplate, OBJECTIVE_CONFIGS } from "@/lib/snapchat/campaign-types";
import { FORMAT_OPTIONS, DESTINATION_OPTIONS } from "./constants";
import { getMaxAssets, getFormatLabel, getDestinationLabel, isInfluencerAd, makeAsset } from "./helpers";
import { CreativeCard } from "./creative-card";
import { CollectionTilesSection } from "./collection-tiles";
import { DiscoverTileSection } from "./discover-tile-section";
import { CommercialSection } from "./commercial-section";
import { OfferDisclaimerSection } from "./offer-disclaimer-section";
import { DynamicAdConfig } from "./dynamic-ad-config";
import { InfoTip } from "@/components/shared/info-tip";

export function AdGroupPanel({
  ad,
  adIndex,
  totalAds,
  isActive,
  onSelect,
  onUpdate,
  onRemove,
  onDuplicate,
  allowedFormats,
  allowedDestinations,
  catalogEnabled,
  onCreativeFocus,
  freqCapLockedFormat = null,
  objective,
}: {
  ad: AdGroup;
  adIndex: number;
  totalAds: number;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (next: AdGroup) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  allowedFormats: AdFormat[];
  allowedDestinations: AdDestination[];
  catalogEnabled: boolean;
  onCreativeFocus?: (assetIdx: number) => void;
  freqCapLockedFormat?: AdFormat | null;
  objective?: CampaignObjective;
}) {
  const [editingName, setEditingName] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [expandedCreativeIdx, setExpandedCreativeIdx] = useState(0);
  const maxAssets = getMaxAssets(ad.adFormat);
  const canAddAsset = ad.assets.length < maxAssets;

  const influencer = isInfluencerAd(ad);

  const getSmartDefaults = (): Partial<CreativeAsset> | undefined => {
    const first = ad.assets[0];
    if (!first) return undefined;
    const defaults: Partial<CreativeAsset> = {};
    if (first.brandName) defaults.brandName = first.brandName;
    if (first.cta) defaults.cta = first.cta;
    if (first.websiteUrl) defaults.websiteUrl = first.websiteUrl;
    return Object.keys(defaults).length > 0 ? defaults : undefined;
  };

  const addAsset = () => {
    if (!canAddAsset) return;
    const smart = getSmartDefaults();
    const base = influencer ? { mediaSource: "ad_code" as const } : undefined;
    const merged = { ...base, ...smart };
    const newAsset = makeAsset(Object.keys(merged).length > 0 ? merged : undefined);
    const newAssets = [...ad.assets, newAsset];
    onUpdate({ ...ad, assets: newAssets });
    setExpandedCreativeIdx(newAssets.length - 1);
    onCreativeFocus?.(newAssets.length - 1);
  };

  const bulkFileRef = useRef<HTMLInputElement>(null);

  const handleBulkFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const allowed = fileArr.filter((f) =>
      f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (allowed.length === 0) return;
    const slotsLeft = maxAssets - ad.assets.length;
    const toAdd = allowed.slice(0, slotsLeft);
    const smart = ad.assets.length > 0 ? (() => {
      const first = ad.assets[0];
      const d: Partial<CreativeAsset> = {};
      if (first.brandName) d.brandName = first.brandName;
      if (first.cta) d.cta = first.cta;
      if (first.websiteUrl) d.websiteUrl = first.websiteUrl;
      return Object.keys(d).length > 0 ? d : undefined;
    })() : undefined;

    const getVideoDuration = (file: File): Promise<number | undefined> => {
      if (!file.type.startsWith("video/")) return Promise.resolve(undefined);
      return new Promise((resolve) => {
        const el = document.createElement("video");
        el.preload = "metadata";
        const url = URL.createObjectURL(file);
        el.onloadedmetadata = () => { resolve(Math.round(el.duration)); URL.revokeObjectURL(url); };
        el.onerror = () => { resolve(undefined); URL.revokeObjectURL(url); };
        el.src = url;
      });
    };

    Promise.all(
      toAdd.map(async (file) => {
        const isVideo = file.type.startsWith("video/");
        const mediaType = isVideo ? "VIDEO" as const : "IMAGE" as const;
        const videoDuration = await getVideoDuration(file);
        return makeAsset({
          ...smart,
          mediaType,
          url: URL.createObjectURL(file),
          file,
          ...(videoDuration !== undefined && { videoDuration }),
        });
      })
    ).then((newAssets) => {
      const combined = [...ad.assets, ...newAssets];
      onUpdate({ ...ad, assets: combined });
      setExpandedCreativeIdx(combined.length - 1);
      onCreativeFocus?.(combined.length - 1);
    });
  }, [ad, maxAssets, onUpdate, onCreativeFocus]);

  const removeAsset = (id: string) => onUpdate({ ...ad, assets: ad.assets.filter((a) => a.id !== id) });

  const updateAsset = (id: string, partial: Partial<CreativeAsset>) =>
    onUpdate({ ...ad, assets: ad.assets.map((a) => (a.id === id ? { ...a, ...partial } : a)) });

  const duplicateAsset = (id: string) => {
    if (!canAddAsset) return;
    const src = ad.assets.find((a) => a.id === id);
    if (!src) return;
    const idx = ad.assets.findIndex((a) => a.id === id);
    const { id: _srcId, name: _srcName, ...rest } = src;
    const dup = makeAsset(rest);
    const next = [...ad.assets];
    next.splice(idx + 1, 0, dup);
    onUpdate({ ...ad, assets: next });
  };

  const moveAsset = (id: string, dir: "up" | "down") => {
    const idx = ad.assets.findIndex((a) => a.id === id);
    if (idx === -1) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ad.assets.length) return;
    const next = [...ad.assets];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    onUpdate({ ...ad, assets: next });
  };


  const removeTile = (id: string) => onUpdate({ ...ad, collectionTiles: ad.collectionTiles.filter((t) => t.id !== id) });

  const defaultAssetForDest = (dest: AdDestination): Partial<CreativeAsset> => {
    switch (dest) {
      case "DEEP_LINK":
        return { cta: "OPEN_APP" as WebViewCTA, deepLinkProperties: { deepLinkUri: "", fallbackUrl: "", fallbackType: "WEB_VIEW_FALLBACK" } };
      case "APP_INSTALL":
        return { cta: "INSTALL_NOW" as WebViewCTA };
      case "LEAD_FORM":
        return { cta: "SIGN_UP" as WebViewCTA };
      case "NO_CTA":
        return { shareable: false };
      default:
        return {};
    }
  };

  const changeFormat = (newFormat: AdFormat) => {
    if (newFormat === ad.adFormat) return;
    const isNewInfluencer = newFormat === "INFLUENCER";
    const dest = (newFormat === "SINGLE" || isNewInfluencer) ? (allowedDestinations[0] ?? "WEBSITE") : ad.adDestination;
    const adType = deriveCreativeType(newFormat, dest);
    const defaultAssets =
      newFormat === "DYNAMIC" ? [] :
      isNewInfluencer ? [makeAsset({ mediaSource: "ad_code" })] :
      [makeAsset(defaultAssetForDest(dest))];
    onUpdate({
      ...ad,
      adFormat: newFormat,
      adDestination: dest,
      adType,
      isInfluencer: isNewInfluencer,
      assets: defaultAssets,
      collectionTiles: [],
      dynamicTemplateConfig: newFormat === "DYNAMIC" ? makeDefaultDynamicTemplate() : undefined,
      dynamicCollectionEnabled: newFormat === "COLLECTION" ? (ad.dynamicCollectionEnabled ?? false) : false,
      discoverTile: newFormat === "STORY" ? { enabled: true, headline: "", backgroundImageUrl: "", logoImageUrl: "" } : undefined,
    });
  };

  const changeDestination = (newDest: AdDestination) => {
    if (newDest === ad.adDestination) return;
    const adType = deriveCreativeType(ad.adFormat, newDest);
    const newAssets = influencer
      ? ad.assets
      : ad.assets.length === 0
        ? [makeAsset(defaultAssetForDest(newDest))]
        : ad.assets.map((a) => ({ ...a, ...defaultAssetForDest(newDest) }));
    onUpdate({
      ...ad,
      adDestination: newDest,
      adType,
      assets: newAssets,
    });
  };

  const assetCount = ad.assets.length;
  const tileCount = ad.collectionTiles.length;
  const hasMedia = ad.assets.some((a) => a.url || a.claimStatus === "READY");
  const formatOption = FORMAT_OPTIONS.find((o) => o.value === ad.adFormat);
  const destOption = DESTINATION_OPTIONS.find((o) => o.value === ad.adDestination);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border-2 transition-all",
        isActive ? "border-primary shadow-md shadow-primary/5" : "border-border"
      )}
    >
      {/* ═══ Header ═══ */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
          isActive ? "bg-primary/[0.04]" : "bg-muted/20 hover:bg-muted/40"
        )}
        onClick={onSelect}
      >
        {/* Number badge */}
        <div className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors",
          isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {adIndex + 1}
        </div>

        {/* Name + subtitle */}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <Input
              autoFocus
              value={ad.name}
              onChange={(e) => onUpdate({ ...ad, name: e.target.value })}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              className="h-7 w-52 text-sm font-semibold"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground truncate">{ad.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setEditingName(true); }}
                className="shrink-0 rounded p-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
              >
                <Pencil className="size-3" />
              </button>
            </div>
          )}
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {formatOption && <span className="shrink-0 [&>svg]:size-3">{formatOption.icon}</span>}
            <span className="font-medium">{getFormatLabel(ad.adFormat)}{ad.adFormat === "SINGLE" ? ` · ${getDestinationLabel(ad.adDestination)}` : ""}</span>
            <span className="text-border">·</span>
            {ad.adFormat === "DYNAMIC" ? (
              <span>Catalog Product Ad</span>
            ) : (
              <span>{assetCount} creative{assetCount !== 1 ? "s" : ""}{ad.adFormat === "COLLECTION" ? `, ${tileCount} tile${tileCount !== 1 ? "s" : ""}` : ""}</span>
            )}
            <span className={cn("inline-block size-2 shrink-0 rounded-full", hasMedia ? "bg-emerald-500" : "bg-amber-400")} title={hasMedia ? "Has media" : "No media yet"} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onDuplicate} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Duplicate ad">
            <Copy className="size-3.5" />
          </button>
          {totalAds > 1 && (
            <button type="button" onClick={onRemove} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Remove ad">
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ═══ Expanded Content ═══ */}
      {isActive && (
        <div className="flex flex-col gap-0 border-t border-border">

          {/* ── Format Picker (4 cards) ── */}
          <div className="px-4 py-4">
            <div className="mb-3 flex items-center gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Ad Format</Label>
              <InfoTip text="Choose the format for this ad. You can add more ads with different formats." />
            </div>

            <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-4">
              {FORMAT_OPTIONS.filter((f) => allowedFormats.includes(f.value)).map((opt) => {
                const isSelected = ad.adFormat === opt.value;
                const lockedOut = freqCapLockedFormat !== null && opt.value !== freqCapLockedFormat && !isSelected;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={lockedOut}
                    onClick={() => changeFormat(opt.value)}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 rounded-lg border px-3 py-3 text-center transition-all",
                      lockedOut
                        ? "cursor-not-allowed border-border/50 opacity-40"
                        : isSelected
                          ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
                          : "border-border bg-background hover:border-primary/30 hover:bg-muted/20"
                    )}
                  >
                    <span className={cn(
                      "shrink-0 [&>svg]:size-5 transition-colors",
                      isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {opt.icon}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={cn("text-xs font-semibold", isSelected ? "text-primary" : "text-foreground")}>{opt.label}</span>
                      {isSelected && <Check className="size-3 text-primary" />}
                    </div>
                    <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* ── Destination selector (SINGLE / INFLUENCER format only, hidden when only 1 option) ── */}
            {(ad.adFormat === "SINGLE" || ad.adFormat === "INFLUENCER") && allowedDestinations.length > 1 && (
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <Label className="text-xs font-semibold text-foreground">Destination</Label>
                  <InfoTip text="Where users go when they swipe up on your ad." />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DESTINATION_OPTIONS.filter((d) => allowedDestinations.includes(d.value)).map((opt) => {
                    const isSelected = ad.adDestination === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => changeDestination(opt.value)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
                            : "border-border bg-background hover:border-primary/30 hover:bg-muted/20"
                        )}
                      >
                        <span className={cn("[&>svg]:size-3.5", isSelected ? "text-primary" : "text-muted-foreground")}>{opt.icon}</span>
                        <div>
                          <span className={cn("text-xs font-semibold", isSelected ? "text-primary" : "text-foreground")}>{opt.label}</span>
                          <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                        </div>
                        {isSelected && <Check className="ml-auto size-3 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* ── Dynamic Ad Config ── */}
          {ad.adFormat === "DYNAMIC" && (
            <div className="border-t border-border px-4 py-4">
              <DynamicAdConfig ad={ad} onUpdate={onUpdate} />
            </div>
          )}

          {/* ── Creative Variations ── */}
          {ad.adFormat !== "DYNAMIC" && (
            <div className="border-t border-border px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ImagePlus className="size-3.5 text-muted-foreground" />
                  <Label className="text-xs font-semibold text-foreground">
                    {ad.adFormat === "COLLECTION" ? "Top Snap" : ad.adFormat === "STORY" ? "Story Snaps" : ad.adDestination === "LEAD_FORM" ? "Top Snap Creative" : ad.adFormat === "INFLUENCER" ? "Influencer Creatives" : "Creatives"}
                  </Label>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums",
                    ad.adFormat === "STORY" && assetCount < 3 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                  )}>{assetCount}/{maxAssets} {ad.adFormat === "STORY" && assetCount < 3 ? "(min 3)" : ""}</span>
                </div>
                <Button size="sm" variant="outline" onClick={addAsset} disabled={!canAddAsset} className="h-7 gap-1 rounded-lg text-xs">
                  <Plus className="size-3" />
                  {ad.adFormat === "STORY" ? "Add Snap" : "Add"}
                </Button>
              </div>

              {assetCount === 0 ? (
                influencer ? (
                  <button
                    type="button"
                    onClick={() => onUpdate({ ...ad, assets: [...ad.assets, makeAsset({ mediaSource: "ad_code" })] })}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.02] hover:text-foreground"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-muted/60">
                      <Users className="size-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium">Add influencer creative</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Paste the Ad Code shared by the influencer</p>
                    </div>
                  </button>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files.length) handleBulkFiles(e.dataTransfer.files); }}
                    onClick={() => bulkFileRef.current?.click()}
                    className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.02] hover:text-foreground"
                  >
                    <input
                      ref={bulkFileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,video/mp4,video/quicktime"
                      multiple
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) handleBulkFiles(e.target.files); e.target.value = ""; }}
                    />
                    <div className="flex size-10 items-center justify-center rounded-xl bg-muted/60">
                      <Upload className="size-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium">Upload creatives</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Drop or select multiple files · PNG, JPG, GIF, MP4, MOV · up to {maxAssets} creatives
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-2">
                  {ad.assets.map((asset, i) => (
                    <CreativeCard
                      key={asset.id}
                      asset={asset}
                      index={i}
                      total={assetCount}
                      adFormat={ad.adFormat}
                      destination={ad.adDestination}
                      isExpanded={expandedCreativeIdx === i}
                      onToggleExpand={() => {
                        setExpandedCreativeIdx(expandedCreativeIdx === i ? -1 : i);
                        if (expandedCreativeIdx !== i) onCreativeFocus?.(i);
                      }}
                      onUpdate={(p) => updateAsset(asset.id, p)}
                      onRemove={() => removeAsset(asset.id)}
                      onDuplicate={() => duplicateAsset(asset.id)}
                      onMove={(dir) => moveAsset(asset.id, dir)}
                      onApplyToAll={assetCount > 1 ? (partial) => {
                        const updated = ad.assets.map((a) => {
                          if (a.id === asset.id) return a;
                          return { ...a, ...partial };
                        });
                        onUpdate({ ...ad, assets: updated });
                      } : undefined}
                    />
                  ))}
                </div>
              )}

              {ad.adFormat === "STORY" && assetCount > 0 && assetCount < 3 && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:border-amber-800/40 dark:bg-amber-950/30">
                  <AlertCircle className="size-3 shrink-0 text-amber-500" />
                  <span className="text-xs text-amber-700 dark:text-amber-400">Snap requires at least 3 snaps for Story Ads — add {3 - assetCount} more</span>
                </div>
              )}
              {ad.adFormat === "STORY" && assetCount >= 2 && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 dark:border-blue-800/40 dark:bg-blue-950/30">
                  <Info className="size-3 shrink-0 text-blue-500" />
                  <span className="text-xs text-blue-700 dark:text-blue-400">Snap API: Story snap order is fixed once the campaign goes live and cannot be rearranged after.</span>
                </div>
              )}
              {assetCount > 0 && assetCount < maxAssets && maxAssets > 1 && !(ad.adFormat === "STORY" && assetCount < 3) && (
                <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Sparkles className="size-3 text-amber-400" />
                  {ad.adFormat === "STORY" ? "Snap recommends 3–5 snaps for a compelling story" : "Snap recommends 3–5 creative variations for best performance"}
                </p>
              )}
            </div>
          )}

          {/* ── Collection Tiles ── */}
          {ad.adFormat === "COLLECTION" && (
            <div className="border-t border-border px-4 py-4">
              <CollectionTilesSection
                ad={ad}
                tileCount={tileCount}
                removeTile={removeTile}
                onUpdate={onUpdate}
                catalogEnabled={catalogEnabled}
              />
            </div>
          )}

          {/* ── Discover Tile (Story Ads) ── */}
          {ad.adFormat === "STORY" && (
            <div className="border-t border-border px-4 py-4">
              <DiscoverTileSection ad={ad} onUpdate={onUpdate} />
            </div>
          )}

          {/* ── Commercial (only for objectives where non-skippable ads are relevant) ── */}
          {(!objective || ["SALES", "AWARENESS", "VIDEO_VIEWS", "ENGAGEMENT"].includes(objective)) && (
            <div className="border-t border-border px-4 py-4">
              <CommercialSection ad={ad} onUpdate={onUpdate} isInfluencer={influencer} />
            </div>
          )}

          <div className="border-t border-border px-4 py-4">
            <OfferDisclaimerSection
              disclaimer={ad.offerDisclaimer ?? { enabled: false, name: "", disclaimerText: "" }}
              onUpdate={(next) => onUpdate({ ...ad, offerDisclaimer: next })}
            />
          </div>

          {/* ── Third-Party Tracking ── */}
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => setShowTracking(!showTracking)}
              className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <div className="flex items-center gap-2">
                <span>Third-Party Tracking</span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">Optional</span>
              </div>
              {showTracking ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            {showTracking && (
              <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
                {/* Explainer */}
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-300">What is this?</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-blue-700/80 dark:text-blue-400/80">
                    If you use an external analytics tool like <span className="font-medium">Google Analytics, AppsFlyer, Adjust,</span> or <span className="font-medium">Branch</span>, you can paste their tracking URLs here. These URLs get &quot;pinged&quot; automatically when someone sees your ad or swipes up — so your analytics tool can count those events alongside your other marketing data.
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-blue-700/80 dark:text-blue-400/80">
                    <span className="font-semibold">Don&apos;t have a tracking tool?</span> Skip this — Salla Ads built-in tracking already handles impressions and swipe-ups for you.
                  </p>
                </div>

                {/* Tracking URL fields */}
                <div className="flex flex-col gap-0 rounded-lg border border-border">
                  {([
                    {
                      key: "impressionUrl" as const,
                      label: "Impression Tracking",
                      placeholder: "https://tracker.example.com/impression?campaign={campaign_id}",
                      icon: "eye",
                      hint: "Triggered each time your ad appears on someone's screen",
                    },
                    {
                      key: "swipeUpUrl" as const,
                      label: "Swipe-Up Tracking",
                      placeholder: "https://tracker.example.com/click?campaign={campaign_id}",
                      icon: "pointer",
                      hint: "Triggered when someone swipes up on your ad",
                    },
                  ] as const).map(({ key, label, placeholder, icon, hint }, idx) => {
                    const val = ad.trackingUrls?.[key] || "";
                    const hasValue = val.trim().length > 0;
                    const isValid = !hasValue || (() => { try { const u = new URL(val); return u.protocol === "https:"; } catch { return false; } })();
                    return (
                      <div key={key} className={cn("flex flex-col gap-1.5 px-3 py-3", idx > 0 && "border-t border-border")}>
                        <div className="flex items-center gap-2">
                          {icon === "eye" ? (
                            <svg className="size-3.5 text-muted-foreground" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="8" cy="8" rx="6" ry="4"/><circle cx="8" cy="8" r="1.5"/></svg>
                          ) : (
                            <svg className="size-3.5 text-muted-foreground" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12l4-8 2 4 3-2"/><path d="M10 8l2 4H8"/></svg>
                          )}
                          <Label className="text-xs font-medium text-foreground">{label}</Label>
                          <InfoTip text={hint} />
                        </div>
                        <Input
                          placeholder={placeholder}
                          type="url"
                          value={val}
                          onChange={(e) => onUpdate({
                            ...ad,
                            trackingUrls: {
                              impressionUrl: ad.trackingUrls?.impressionUrl || "",
                              swipeUpUrl: ad.trackingUrls?.swipeUpUrl || "",
                              [key]: e.target.value,
                            },
                          })}
                          className={cn("h-8 text-xs font-mono", hasValue && !isValid ? "border-red-300 focus-visible:ring-red-200" : "", hasValue && isValid ? "border-emerald-300" : "")}
                        />
                        {hasValue && !isValid && (
                          <p className="text-[10px] text-red-600">Must be a valid HTTPS URL (e.g. https://...)</p>
                        )}
                        {hasValue && isValid && (
                          <p className="flex items-center gap-1 text-[10px] text-emerald-600">
                            <CheckCircle2 className="size-2.5" /> Valid URL
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
