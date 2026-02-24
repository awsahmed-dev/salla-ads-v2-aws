"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Pencil,
  Copy,
  Trash2,
  Users,
  Download,
  FileText,
  Plus,
  ImagePlus,
  ChevronUp,
  ChevronDown,
  Check,
  CheckCircle2,
  Info,
  Sparkles,
  Upload,
} from "lucide-react";
import type { AdGroup, SnapCreativeType, CreativeAsset, CollectionTile, WebViewCTA } from "@/lib/snapchat/campaign-types";
import { makeDefaultDynamicTemplate } from "@/lib/snapchat/campaign-types";
import { type AdFormatKey, AD_FORMAT_OPTIONS } from "./constants";
import { getMaxAssets, getFormatLabel, isInfluencerAd, makeAsset, makeTile } from "./helpers";
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
  adFormatOptions,
  catalogEnabled,
  onCreativeFocus,
}: {
  ad: AdGroup;
  adIndex: number;
  totalAds: number;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (next: AdGroup) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  adFormatOptions: typeof AD_FORMAT_OPTIONS;
  catalogEnabled: boolean;
  onCreativeFocus?: (assetIdx: number) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [expandedCreativeIdx, setExpandedCreativeIdx] = useState(0);
  const maxAssets = getMaxAssets(ad.adType);
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

    const newAssets = toAdd.map((file) => {
      const isVideo = file.type.startsWith("video/");
      const mediaType = isVideo ? "VIDEO" as const : "IMAGE" as const;
      return makeAsset({
        ...smart,
        mediaType,
        url: URL.createObjectURL(file),
        file,
      });
    });
    const combined = [...ad.assets, ...newAssets];
    onUpdate({ ...ad, assets: combined });
    setExpandedCreativeIdx(combined.length - 1);
    onCreativeFocus?.(combined.length - 1);
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

  const addTile = () => {
    if (ad.collectionTiles.length >= 4) return;
    onUpdate({ ...ad, collectionTiles: [...ad.collectionTiles, makeTile()] });
  };

  const removeTile = (id: string) => onUpdate({ ...ad, collectionTiles: ad.collectionTiles.filter((t) => t.id !== id) });

  const updateTile = (id: string, partial: Partial<CollectionTile>) =>
    onUpdate({ ...ad, collectionTiles: ad.collectionTiles.map((t) => (t.id === id ? { ...t, ...partial } : t)) });

  const changeFormat = (val: AdFormatKey) => {
    const isInf = val === "INFLUENCER";
    const actualType: SnapCreativeType = isInf ? "WEB_VIEW" : (val as SnapCreativeType);
    const defaultAssets =
      actualType === "DYNAMIC" ? [] :
      isInf ? [makeAsset({ mediaSource: "ad_code" })] :
      actualType === "LEAD_GENERATION" ? [makeAsset({ cta: "SIGN_UP" as WebViewCTA })] :
      actualType === "APP_INSTALL" ? [makeAsset({ cta: "INSTALL_NOW" as WebViewCTA })] :
      actualType === "SNAP_AD" ? [makeAsset({ shareable: false })] :
      actualType === "DEEP_LINK" ? [makeAsset({ deepLinkProperties: { deepLinkUri: "", fallbackUrl: "", fallbackType: "WEB_VIEW_FALLBACK" } })] :
      [makeAsset()];
    onUpdate({
      ...ad,
      adType: actualType,
      isInfluencer: isInf,
      assets: defaultAssets,
      collectionTiles: actualType === "COLLECTION" ? [makeTile(), makeTile()] : [],
      dynamicTemplateConfig: actualType === "DYNAMIC" ? makeDefaultDynamicTemplate() : undefined,
      dynamicCollectionEnabled: actualType === "COLLECTION" ? (ad.dynamicCollectionEnabled ?? false) : false,
      discoverTile: actualType === "COMPOSITE" ? { enabled: false, headline: "", backgroundImageUrl: "", logoImageUrl: "" } : undefined,
    });
  };

  const assetCount = ad.assets.length;
  const tileCount = ad.collectionTiles.length;
  const hasMedia = ad.assets.some((a) => a.url || a.claimStatus === "READY");
  const formatOption = AD_FORMAT_OPTIONS.find((o) => o.value === ad.adType) ?? AD_FORMAT_OPTIONS.find((o) => o.value === (isInfluencerAd(ad) ? "INFLUENCER" : ad.adType));

  const FORMAT_TIPS: Partial<Record<AdFormatKey | SnapCreativeType, { icon: React.ReactNode; title: string; text: string }>> = {
    INFLUENCER: {
      icon: <Users className="size-4 text-primary" />,
      title: "Influencer Content",
      text: "Paste the Ad Code shared by your influencer. They generate it from their Snapchat app.",
    },
    APP_INSTALL: {
      icon: <Download className="size-4 text-primary" />,
      title: "App Install",
      text: "Users swipe up to the App Store / Google Play. Destination is set from your Objective step.",
    },
    LEAD_GENERATION: {
      icon: <FileText className="size-4 text-primary" />,
      title: "Lead Generation",
      text: "Swipe-up opens a Lead Form instead of a website. Configure the form in the section above.",
    },
  };
  const activeTipKey = isInfluencerAd(ad) ? "INFLUENCER" : ad.adType;
  const formatTip = FORMAT_TIPS[activeTipKey];

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
            <span className="font-medium">{isInfluencerAd(ad) ? "Influencer Content" : getFormatLabel(ad.adType)}</span>
            <span className="text-border">·</span>
            {ad.adType === "DYNAMIC" ? (
              <span>Catalog Product Ad</span>
            ) : (
              <span>{assetCount} creative{assetCount !== 1 ? "s" : ""}{ad.adType === "COLLECTION" ? `, ${tileCount} tile${tileCount !== 1 ? "s" : ""}` : ""}</span>
            )}
            <span className={cn("inline-block size-2 shrink-0 rounded-full", hasMedia ? "bg-emerald-500" : "bg-amber-400")} title={hasMedia ? "Has media" : "No media yet"} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onDuplicate} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Duplicate ad group">
            <Copy className="size-3.5" />
          </button>
          {totalAds > 1 && (
            <button type="button" onClick={onRemove} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Remove ad group">
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ═══ Expanded Content ═══ */}
      {isActive && (
        <div className="flex flex-col gap-0 border-t border-border">

          {/* ── Format Picker ── */}
          <div className="px-4 py-4">
            <div className="mb-3 flex items-center gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Ad Format</Label>
              <InfoTip text="Each ad group uses one format. Create separate ad groups to test different formats." />
            </div>

            <div className="grid gap-1.5 sm:grid-cols-3">
              {adFormatOptions.map((opt) => {
                const isSelected = opt.value === "INFLUENCER"
                  ? isInfluencerAd(ad)
                  : !isInfluencerAd(ad) && ad.adType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => changeFormat(opt.value)}
                    className={cn(
                      "group relative flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
                        : "border-border bg-background hover:border-primary/30 hover:bg-muted/20"
                    )}
                  >
                    <span className={cn(
                      "mt-0.5 shrink-0 [&>svg]:size-4 transition-colors",
                      isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {opt.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-xs font-semibold", isSelected ? "text-primary" : "text-foreground")}>{opt.label}</span>
                        {isSelected && <Check className="size-3 text-primary" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Format-specific tip */}
            {formatTip && (
              <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-primary/[0.03] px-3.5 py-2.5">
                <span className="mt-0.5 shrink-0">{formatTip.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{formatTip.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{formatTip.text}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Dynamic Ad Config ── */}
          {ad.adType === "DYNAMIC" && (
            <div className="border-t border-border px-4 py-4">
              <DynamicAdConfig ad={ad} onUpdate={onUpdate} />
            </div>
          )}

          {/* ── Creative Variations ── */}
          {ad.adType !== "DYNAMIC" && (
            <div className="border-t border-border px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ImagePlus className="size-3.5 text-muted-foreground" />
                  <Label className="text-xs font-semibold text-foreground">
                    {ad.adType === "COLLECTION" ? "Top Snap" : ad.adType === "COMPOSITE" ? "Story Snaps" : ad.adType === "LEAD_GENERATION" ? "Top Snap Creative" : "Creatives"}
                  </Label>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">{assetCount}/{maxAssets}</span>
                </div>
                <Button size="sm" variant="outline" onClick={addAsset} disabled={!canAddAsset} className="h-7 gap-1 rounded-lg text-xs">
                  <Plus className="size-3" />
                  Add
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
                      accept="image/png,image/jpeg,video/mp4,video/quicktime"
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
                        Drop or select multiple files · PNG, JPG, MP4, MOV · up to {maxAssets} creatives
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
                      isStory={ad.adType === "COMPOSITE"}
                      isCollection={ad.adType === "COLLECTION"}
                      isLeadGen={ad.adType === "LEAD_GENERATION"}
                      isAppInstall={ad.adType === "APP_INSTALL"}
                      isSnapAd={ad.adType === "SNAP_AD"}
                      isDeepLink={ad.adType === "DEEP_LINK"}
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

              {assetCount > 0 && assetCount < maxAssets && maxAssets > 1 && (
                <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Sparkles className="size-3 text-amber-400" />
                  Snap recommends 3–5 creative variations for best performance
                </p>
              )}
            </div>
          )}

          {/* ── Collection Tiles ── */}
          {ad.adType === "COLLECTION" && (
            <div className="border-t border-border px-4 py-4">
              <CollectionTilesSection
                ad={ad}
                tileCount={tileCount}
                addTile={addTile}
                removeTile={removeTile}
                updateTile={updateTile}
                onUpdate={onUpdate}
                catalogEnabled={catalogEnabled}
              />
            </div>
          )}

          {/* ── Discover Tile (Story Ads) ── */}
          {ad.adType === "COMPOSITE" && (
            <div className="border-t border-border px-4 py-4">
              <DiscoverTileSection ad={ad} onUpdate={onUpdate} />
            </div>
          )}

          {/* ── Commercial + Offer Disclaimer ── */}
          <div className="border-t border-border px-4 py-4">
            <CommercialSection ad={ad} onUpdate={onUpdate} />
          </div>

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
              <span>Third-Party Tracking</span>
              {showTracking ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            {showTracking && (
              <div className="flex flex-col gap-3 border-t border-border px-4 py-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-medium text-foreground">Impression Tracking URL</Label>
                  <Input
                    placeholder="https://tracker.example.com/impression"
                    type="url"
                    value={ad.trackingUrls?.impressionUrl || ""}
                    onChange={(e) => onUpdate({
                      ...ad,
                      trackingUrls: {
                        ...ad.trackingUrls,
                        impressionUrl: e.target.value,
                        swipeUpUrl: ad.trackingUrls?.swipeUpUrl || "",
                      },
                    })}
                    className="h-8 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Fires when your ad is viewed</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-medium text-foreground">Swipe-Up Tracking URL</Label>
                  <Input
                    placeholder="https://tracker.example.com/swipe"
                    type="url"
                    value={ad.trackingUrls?.swipeUpUrl || ""}
                    onChange={(e) => onUpdate({
                      ...ad,
                      trackingUrls: {
                        ...ad.trackingUrls,
                        impressionUrl: ad.trackingUrls?.impressionUrl || "",
                        swipeUpUrl: e.target.value,
                      },
                    })}
                    className="h-8 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Fires when a user swipes up</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
