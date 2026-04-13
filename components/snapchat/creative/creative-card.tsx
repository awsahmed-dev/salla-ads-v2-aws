"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { isSallaStoreUrl, lookupProductByUrl } from "@/lib/salla/store-api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  AlertCircle,
  Image as ImageIcon,
  Film,
  GripVertical,
  Link2,
  Loader2,
  CheckCircle2,
  Info,
  Sparkles,
  CopyCheck,
  X,
} from "lucide-react";
import { UploadZone } from "@/components/shared/upload-zone";
import {
  MEDIA_SPECS,
  CTA_OPTIONS,
  LEAD_CTA_OPTIONS,
  APP_INSTALL_CTA_OPTIONS,
  DEEP_LINK_CTA_OPTIONS,
} from "./constants";
import { InfoTip } from "@/components/shared/info-tip";
import { LinkPickerSheet } from "./link-picker-sheet";
import type {
  CreativeAsset,
  AdFormat,
  AdDestination,
  SnapMediaType,
  WebViewCTA,
  CreatorPartnershipType,
} from "@/lib/snapchat/campaign-types";

export function CharCounter({ current, max }: { current: number; max: number }) {
  const over = current > max;
  return <span className={cn("text-xs tabular-nums", over ? "font-medium text-destructive" : "text-muted-foreground")}>{current}/{max}</span>;
}

/* ------------------------------------------------------------------ */
/*  Single Creative Card (inside an Ad)                               */
/* ------------------------------------------------------------------ */

export function CreativeCard({
  asset,
  index,
  total,
  adFormat,
  destination,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onDuplicate,
  onMove,
  onApplyToAll,
}: {
  asset: CreativeAsset;
  index: number;
  total: number;
  adFormat: AdFormat;
  destination: AdDestination;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (partial: Partial<CreativeAsset>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMove: (dir: "up" | "down") => void;
  onApplyToAll?: (partial: Partial<CreativeAsset>) => void;
}) {
  const isStory = adFormat === "STORY";
  const isCollection = adFormat === "COLLECTION";
  const isLeadGen = destination === "LEAD_FORM";
  const isAppInstall = destination === "APP_INSTALL";
  const isSnapAd = destination === "NO_CTA";
  const isDeepLink = destination === "DEEP_LINK";
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sallaProduct, setSallaProduct] = useState<any>(null);
  const [linkType, setLinkType] = useState<"store" | "product" | "category" | "landing_page" | "custom">(() => asset.websiteUrl ? "custom" : "store");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"product" | "category" | "landing_page">("product");
  const [pickerLabel, setPickerLabel] = useState<string>("");

  useEffect(() => {
    if (asset.websiteUrl && isSallaStoreUrl(asset.websiteUrl)) {
      lookupProductByUrl(asset.websiteUrl).then((product) => {
        setSallaProduct(product);
      }).catch(() => {
        setSallaProduct(null);
      });
    } else {
      setSallaProduct(null);
    }
  }, [asset.websiteUrl]);

  const handleFile = useCallback(
    (file: File) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) {
        alert("Unsupported file type. Please upload PNG, JPG, MP4, or MOV.");
        return;
      }
      const mediaType: SnapMediaType = isVideo ? "VIDEO" : "IMAGE";
      const maxSize = isVideo ? MEDIA_SPECS.VIDEO.maxSize : MEDIA_SPECS.IMAGE.maxSize;
      if (file.size > maxSize) {
        alert(`File too large. Max ${(maxSize / 1024 / 1024).toFixed(0)}MB for ${mediaType.toLowerCase()}.`);
        return;
      }
      if (isImage) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (img.width < 1080 || img.height < 1920) {
            const proceed = window.confirm(
              `Image is ${img.width}x${img.height}px. Snap requires 1080x1920px minimum for full-screen ads. Continue anyway?`
            );
            if (!proceed) return;
          }
          onUpdate({ mediaType, url: URL.createObjectURL(file), file });
        };
        img.src = URL.createObjectURL(file);
      } else {
        const videoEl = document.createElement("video");
        videoEl.preload = "metadata";
        const objectUrl = URL.createObjectURL(file);
        videoEl.onloadedmetadata = () => {
          const duration = Math.round(videoEl.duration);
          if (duration < 3 || duration > 180) {
            const proceed = window.confirm(
              `Video is ${duration}s. Snapchat requires 3–180 seconds for ad videos. Continue anyway?`
            );
            if (!proceed) { URL.revokeObjectURL(objectUrl); return; }
          }
          onUpdate({ mediaType, url: objectUrl, file, videoDuration: duration });
        };
        videoEl.onerror = () => {
          onUpdate({ mediaType, url: objectUrl, file });
        };
        videoEl.src = objectUrl;
      }
    },
    [onUpdate]
  );

  const isInfluencer = (asset.mediaSource ?? "upload") === "ad_code";
  const isSingleFormat = adFormat === "SINGLE" || adFormat === "DYNAMIC" || adFormat === "COLLECTION";
  const showUrl = !isLeadGen && !isAppInstall && !isSnapAd && !isDeepLink;
  const showCta = !isCollection && !isSnapAd;
  const showAdvancedWebView = !isSnapAd && !isDeepLink && !isLeadGen && !isAppInstall && !isInfluencer;
  const showLinkTypePills = (isSingleFormat || isStory) && showUrl && !isDeepLink;

  const mergeWebView = (patch: Partial<NonNullable<CreativeAsset["webViewProperties"]>>) =>
    onUpdate({
      webViewProperties: {
        ...asset.webViewProperties,
        url: asset.websiteUrl,
        useSnapBrowser: asset.webViewProperties?.useSnapBrowser ?? true,
        preloadEnabled: asset.webViewProperties?.preloadEnabled ?? true,
        blockPreload: asset.webViewProperties?.blockPreload ?? false,
        ...patch,
      },
    });

  const hasContent = !!(asset.brandName || asset.headline || asset.cta || asset.websiteUrl);
  const canApplyToAll = total > 1 && hasContent && !!onApplyToAll;

  /* Completeness tracking for collapsed summary */
  const hasMedia = !!(asset.url || asset.claimStatus === "READY");
  const hasBrand = !!asset.brandName.trim();
  const hasHeadline = !!asset.headline.trim();
  const hasUrl = !!(asset.websiteUrl?.startsWith("https://"));
  const hasCta = !!asset.cta;
  const completionChecks = [
    { label: "Media", ok: hasMedia },
    { label: "Brand", ok: hasBrand },
    { label: "Headline", ok: hasHeadline },
    ...(showCta ? [{ label: "CTA", ok: hasCta }] : []),
    ...(showUrl ? [{ label: "URL", ok: hasUrl }] : []),
  ];
  const completionCount = completionChecks.filter((c) => c.ok).length;
  const completionTotal = completionChecks.length;
  const isComplete = completionCount === completionTotal;

  // Collapsed summary line
  const summaryParts: string[] = [];
  if (asset.url) {
    summaryParts.push(asset.mediaType === "VIDEO" ? `Video${asset.videoDuration ? ` (${asset.videoDuration}s)` : ""}` : "Image");
  } else if (asset.claimStatus === "READY") {
    summaryParts.push("Influencer");
  } else {
    summaryParts.push("No media");
  }
  if (asset.brandName) summaryParts.push(asset.brandName);
  if (asset.headline) summaryParts.push(`"${asset.headline}"`);

  return (
    <div className={cn(
      "rounded-lg border transition-all",
      (isSingleFormat || isStory) ? "bg-white" : "bg-background",
      isExpanded ? "border-primary/30 shadow-sm" : isComplete ? "border-emerald-200 hover:border-emerald-300" : "border-border hover:border-primary/20"
    )}>
      {/* ── Header ── */}
      {!isSingleFormat && (
        <div
          className={cn("flex items-center gap-2 px-3 py-2 cursor-pointer", isExpanded && "bg-primary/[0.02]")}
          onClick={onToggleExpand}
        >
          {isStory && <GripVertical className="size-3.5 cursor-grab text-muted-foreground" onClick={(e) => e.stopPropagation()} />}
          <div className="flex items-center gap-1.5">
            {isComplete ? (
              <CheckCircle2 className="size-3 text-emerald-500" />
            ) : hasMedia ? (
              asset.mediaType === "VIDEO" ? <Film className="size-3 text-primary" /> : <ImageIcon className="size-3 text-primary" />
            ) : (
              <div className="flex size-3 items-center justify-center rounded-full border-[1.5px] border-amber-400">
                <div className="size-1 rounded-full bg-amber-400" />
              </div>
            )}
            <span className="text-xs font-semibold text-foreground">
              {isStory ? `Snap ${index + 1}` : `Creative ${index + 1}`}
            </span>
          </div>

          {/* Collapsed summary */}
          {!isExpanded && (
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <span className="truncate text-[11px] text-muted-foreground">
                {summaryParts.join(" · ")}
              </span>
              {/* Completion dots */}
              <div className="flex shrink-0 items-center gap-0.5" title={completionChecks.map((c) => `${c.ok ? "✓" : "○"} ${c.label}`).join(", ")}>
                {completionChecks.map((c, i) => (
                  <div key={i} className={cn("size-1.5 rounded-full", c.ok ? "bg-emerald-400" : "bg-muted-foreground/25")} />
                ))}
              </div>
            </div>
          )}

          <div className="ml-auto flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            {isStory && (
              <>
                <button type="button" disabled={index === 0} onClick={() => onMove("up")} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="size-3" /></button>
                <button type="button" disabled={index === total - 1} onClick={() => onMove("down")} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="size-3" /></button>
              </>
            )}
            <button type="button" onClick={onDuplicate} className="rounded p-0.5 text-muted-foreground hover:text-foreground" title="Duplicate"><Copy className="size-3" /></button>
            <button type="button" onClick={onRemove} className="rounded p-0.5 text-muted-foreground hover:text-destructive"><Trash2 className="size-3" /></button>
            <button type="button" onClick={onToggleExpand} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
              {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>
          </div>
        </div>
      )}

      {(isExpanded || isSingleFormat) && (
        <div className={cn("flex flex-col gap-0", !isSingleFormat && "border-t border-border")}>

          {/* ── Single Format: Link Type first (product-first flow) ── */}
          {showLinkTypePills && (
            <div className="flex flex-col gap-4 px-3 py-3">
              {/* Link type pills */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground">Link type</Label>
                {isStory && (
                  <p className="text-[11px] text-muted-foreground">Each snap links to its own swipe-up URL</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: "store", label: "Store" },
                    { value: "product", label: "Product" },
                    { value: "category", label: "Category" },
                    { value: "landing_page", label: "Landing page" },
                    { value: "custom", label: "Custom URL" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (opt.value === "product" || opt.value === "category" || opt.value === "landing_page") {
                          setPickerMode(opt.value);
                          setPickerOpen(true);
                        } else {
                          setLinkType(opt.value);
                          setPickerLabel("");
                          if (opt.value === "store") onUpdate({ websiteUrl: "" });
                        }
                      }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium transition-colors",
                        linkType === opt.value
                          ? "border-primary/60 bg-primary/[0.06] text-primary"
                          : "border-border bg-white text-foreground hover:border-primary/30"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Link + CTA row */}
              <div className={cn("grid gap-4", showCta ? "grid-cols-2" : "grid-cols-1")}>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-foreground">Link</Label>
                  {linkType === "store" ? (
                    <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-muted/40 px-3">
                      <span className="truncate text-sm text-muted-foreground">https://store.salla.sa</span>
                      <button
                        type="button"
                        title="UTM parameters are auto-appended for tracking"
                        className="group/utm flex shrink-0 items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 transition-colors hover:bg-emerald-200"
                      >
                        Auto UTM
                        <Info className="size-2.5 text-emerald-500 transition-colors group-hover/utm:text-emerald-700" />
                      </button>
                    </div>
                  ) : linkType === "product" || linkType === "category" || linkType === "landing_page" ? (
                    <div
                      onClick={() => { setPickerMode(linkType as "product" | "category" | "landing_page"); setPickerOpen(true); }}
                      className={cn(
                        "flex h-10 cursor-pointer items-center justify-between rounded-lg border px-3 transition-colors hover:border-primary/40",
                        asset.websiteUrl ? "border-primary/40 bg-primary/5" : "border-border bg-muted/40"
                      )}
                    >
                      {asset.websiteUrl ? (
                        <>
                          <span className="truncate text-sm text-foreground">{pickerLabel || asset.websiteUrl}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onUpdate({ websiteUrl: "" }); setPickerLabel(""); }}
                            className="shrink-0 ml-2 rounded p-0.5 text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-3" />
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {linkType === "product" ? "Select a product..." : linkType === "category" ? "Select a category..." : "Select a page..."}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Input
                      placeholder="https://yourstore.com/product"
                      type="url"
                      value={asset.websiteUrl}
                      onChange={(e) => onUpdate({ websiteUrl: e.target.value })}
                      className={cn("h-10 text-sm", asset.websiteUrl && !asset.websiteUrl.startsWith("https://") && "border-red-400")}
                    />
                  )}
                  {linkType === "custom" && asset.websiteUrl && !asset.websiteUrl.startsWith("https://") && (
                    <p className="text-[10px] text-red-600">URL must start with https://</p>
                  )}
                </div>
                {showCta && (
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-foreground">
                      CTA button <span className="text-destructive">*</span>
                    </Label>
                    <Select value={asset.cta} onValueChange={(v) => onUpdate({ cta: v as WebViewCTA })}>
                      <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select call to action text" /></SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recommended</div>
                        {CTA_OPTIONS.filter(c => ["SHOP_NOW", "ORDER_NOW", "GET_NOW", "BOOK_NOW", "MORE"].includes(c.value)).map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        <div className="my-1 border-t border-border" />
                        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">More Options</div>
                        {CTA_OPTIONS.filter(c => !["SHOP_NOW", "ORDER_NOW", "GET_NOW", "BOOK_NOW", "MORE"].includes(c.value)).map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {showUrl && sallaProduct && (
                <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sallaProduct.image} alt="" className="size-8 rounded-md object-cover" crossOrigin="anonymous" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium text-emerald-800">{sallaProduct.name}</p>
                    <p className="text-[10px] text-emerald-600">{sallaProduct.price} SAR</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-emerald-700"
                    onClick={() => onUpdate({ brandName: asset.brandName || sallaProduct.name.slice(0, 32), headline: asset.headline || sallaProduct.name.slice(0, 34) })}
                  >
                    Auto-fill
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Media Upload ── */}
          <div className={cn("px-3 py-3", showLinkTypePills && "border-t border-border")}>
            {isInfluencer ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5">
                  <Link2 className="size-3 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Influencer Ad Code</span>
                  <InfoTip text="The influencer generates an Ad Code from their Snapchat app: open the Snap/Story → tap ⋯ → Share Ad Code. They then send you the code to paste here." />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste ad code from influencer..."
                      value={asset.adCode ?? ""}
                      onChange={(e) => onUpdate({ adCode: e.target.value, claimStatus: undefined })}
                      className="h-8 flex-1 font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      className="h-8 gap-1 text-sm"
                      disabled={!asset.adCode || asset.claimStatus === "PENDING"}
                      onClick={() => {
                        onUpdate({ claimStatus: "PENDING" });
                        setTimeout(() => {
                          onUpdate({ claimStatus: "READY", claimedMediaId: `media_${Date.now()}`, mediaType: "VIDEO", url: "" });
                        }, 2000);
                      }}
                    >
                      {asset.claimStatus === "PENDING" ? <><Loader2 className="size-3 animate-spin" /> Claiming...</> : "Claim"}
                    </Button>
                  </div>
                  {!asset.claimStatus && (
                    <p className="text-[10px] text-muted-foreground">Alphanumeric code shared by the creator from their Snapchat app</p>
                  )}
                </div>

                {asset.adCode && !asset.claimStatus && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
                    <AlertCircle className="size-3 shrink-0 text-amber-600" />
                    <span className="text-xs text-amber-700">Ad code entered but not claimed — click &quot;Claim&quot; to verify and import the content</span>
                  </div>
                )}

                {asset.claimStatus === "READY" && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                      <p className="text-xs font-medium text-emerald-800">Content claimed — Media ID: {asset.claimedMediaId}</p>
                    </div>
                    <div className="mt-2.5 flex flex-col gap-2 border-t border-emerald-200 pt-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-medium text-foreground">Show creator profile</Label>
                          <InfoTip text="Display the influencer's profile picture and name on your ad." />
                        </div>
                        <Switch
                          checked={!!asset.creatorProfileId}
                          onCheckedChange={(v) => onUpdate({ creatorProfileId: v ? "creator_profile_placeholder" : undefined, creatorPartnershipType: v ? "AD_PARTNERSHIP" : "NONE" })}
                        />
                      </div>
                      {asset.creatorProfileId && (
                        <>
                          <div className="flex flex-col gap-1">
                            <Input
                              placeholder="Creator's Snapchat Profile ID (UUID)"
                              value={asset.creatorProfileId === "creator_profile_placeholder" ? "" : (asset.creatorProfileId ?? "")}
                              onChange={(e) => onUpdate({ creatorProfileId: e.target.value || "creator_profile_placeholder" })}
                              className={cn("h-7 font-mono text-xs", asset.creatorProfileId === "creator_profile_placeholder" && "border-amber-300")}
                            />
                            {asset.creatorProfileId === "creator_profile_placeholder" && (
                              <p className="text-[10px] text-amber-600">Enter the creator&apos;s Snapchat Profile ID to show their profile on the ad</p>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            {(["NONE", "AD_PARTNERSHIP", "BRAND_PARTNERSHIP"] as CreatorPartnershipType[]).map((val) => {
                              const labels: Record<string, string> = { NONE: "No Label", AD_PARTNERSHIP: "Ad", BRAND_PARTNERSHIP: "Paid Partnership" };
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => onUpdate({ creatorPartnershipType: val })}
                                  className={cn(
                                    "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                                    (asset.creatorPartnershipType ?? "NONE") === val
                                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                      : "border-border text-muted-foreground hover:border-emerald-300"
                                  )}
                                >
                                  {labels[val]}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {/* Tag brand in headline */}
                      <div className="flex items-center justify-between border-t border-emerald-200 pt-2">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-medium text-foreground">Tag brand in headline</Label>
                          <InfoTip text="Adds your brand's profile tag to the ad headline so viewers see both the creator and your brand." />
                        </div>
                        <Switch
                          checked={!!asset.profileTaggedInHeadline}
                          onCheckedChange={(v) => onUpdate({ profileTaggedInHeadline: v ? "brand_profile_placeholder" : undefined })}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {asset.claimStatus === "ERROR" && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                    <AlertCircle className="size-3 shrink-0 text-red-600" />
                    <span className="text-xs text-red-700">Invalid ad code. Please check with the influencer.</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <UploadZone
                  accept="image/png,image/jpeg,image/gif,video/mp4,video/quicktime"
                  label="Upload Ad Content"
                  sublabel={isStory ? "Vertical 9:16 (1080×1920) · Video: H.264, 3–30s · Images: PNG or JPEG" : isCollection ? "Top snap · Vertical 9:16 (1080×1920) · Video: H.264, 3–30s" : "Use vertical format (9:16) · 1080×1920px · Video: H.264, 3–180s · PNG or JPEG"}
                  preview={asset.url || undefined}
                  previewMediaType={asset.mediaType}
                  previewFile={asset.file}
                  onFile={handleFile}
                  onClear={() => onUpdate({ url: "", file: undefined, mediaType: "IMAGE", videoDuration: undefined })}
                />
                {/* Video duration badge */}
                {asset.url && asset.mediaType === "VIDEO" && asset.videoDuration != null && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                      <Film className="size-2.5" />
                      {asset.videoDuration}s
                    </span>
                    {asset.videoDuration >= 3 && asset.videoDuration <= 10 && (
                      <span className="text-[10px] text-emerald-600">Optimal length for engagement</span>
                    )}
                    {asset.videoDuration > 10 && asset.videoDuration <= 180 && (
                      <span className="text-[10px] text-muted-foreground">Tip: First 2 seconds are critical — lead with the hook</span>
                    )}
                    {(asset.videoDuration < 3 || asset.videoDuration > 180) && (
                      <span className="text-[10px] text-amber-600">Snap requires 3–180 seconds</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Section 2: Ad Copy ── */}
          <div className="border-t border-border px-3 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground">Brand Name</Label>
                <div className="relative">
                  <Input placeholder="Your brand" value={asset.brandName} maxLength={34} onChange={(e) => onUpdate({ brandName: e.target.value.slice(0, 34) })} className={cn("h-10 pr-14 text-sm", asset.brandName.length >= 34 && "border-amber-400")} />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">{asset.brandName.length}/34</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground">
                  Ad Headline <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input placeholder="Catchy headline" value={asset.headline} maxLength={34} onChange={(e) => onUpdate({ headline: e.target.value.slice(0, 34) })} className={cn("h-10 pr-20 text-sm", asset.headline.length >= 34 && "border-amber-400")} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {asset.headline.trim().length > 0 && (
                      <button
                        type="button"
                        title="AI rephrase — improve this headline"
                        onClick={() => {
                          const promos = [
                            `Shop ${asset.headline.trim().split(" ").slice(0, 3).join(" ")} Now!`,
                            `${asset.headline.trim()} — Limited Offer`,
                            `Get ${asset.headline.trim()} Today`,
                            `Discover ${asset.headline.trim().split(" ").slice(0, 2).join(" ")} ✨`,
                          ];
                          const current = asset.headline;
                          const other = promos.filter(p => p !== current && p.length <= 34);
                          if (other.length > 0) onUpdate({ headline: other[Math.floor(Math.random() * other.length)] });
                        }}
                        className="rounded-full p-0.5 text-amber-400 transition-colors hover:bg-amber-50 hover:text-amber-500"
                      >
                        <Sparkles className="size-3" />
                      </button>
                    )}
                    <span className="text-xs tabular-nums text-muted-foreground">{asset.headline.length}/34</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CTA & Destination (fallback for non-pills formats) ── */}
          {(showCta || showUrl || isDeepLink) && !showLinkTypePills && (
            <div className="flex flex-col gap-4 border-t border-border px-3 py-3">
              <div className={cn("grid gap-2", showCta && !isCollection ? "grid-cols-2" : "grid-cols-1")}>
                  {showCta && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">Call to Action</Label>
                        <InfoTip text="The text shown on the swipe-up button. 'Shop Now' and 'Learn More' typically perform best for e-commerce." />
                      </div>
                      <Select value={asset.cta} onValueChange={(v) => onUpdate({ cta: v as WebViewCTA })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(isDeepLink ? DEEP_LINK_CTA_OPTIONS : isAppInstall ? APP_INSTALL_CTA_OPTIONS : isLeadGen ? LEAD_CTA_OPTIONS : CTA_OPTIONS).map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {showUrl && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Swipe-Up URL {isStory && <span className="text-destructive">*</span>}
                        </Label>
                        <InfoTip text="The landing page users see when they swipe up. Use a direct product or offer page for best conversion — avoid homepages." />
                      </div>
                      <Input placeholder="https://yourstore.com/product" type="url" value={asset.websiteUrl} onChange={(e) => onUpdate({ websiteUrl: e.target.value })} className={cn("h-8 text-xs", asset.websiteUrl && !asset.websiteUrl.startsWith("https://") && "border-red-400", isStory && !asset.websiteUrl && "border-amber-300")} />
                      {asset.websiteUrl && !asset.websiteUrl.startsWith("https://") && (
                        <p className="text-[10px] text-red-600">URL must start with https://</p>
                      )}
                      {isStory && !asset.websiteUrl && (
                        <p className="text-[10px] text-amber-600">Each snap in a Story Ad requires a swipe-up URL</p>
                      )}
                      {isInfluencer && !isStory && (
                        <p className="text-[10px] text-muted-foreground">Where viewers land when they swipe up on the creator&apos;s content — typically your product or landing page</p>
                      )}
                    </div>
                  )}
                </div>

              {showUrl && sallaProduct && (
                <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sallaProduct.image} alt="" className="size-8 rounded-md object-cover" crossOrigin="anonymous" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium text-emerald-800">{sallaProduct.name}</p>
                    <p className="text-[10px] text-emerald-600">{sallaProduct.price} SAR</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-emerald-700"
                    onClick={() => onUpdate({ brandName: asset.brandName || sallaProduct.name.slice(0, 32), headline: asset.headline || sallaProduct.name.slice(0, 34) })}
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              {isDeepLink && (
                <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/[0.02] p-3">
                  <div className="flex items-center gap-1.5">
                    <Link2 className="size-3 text-primary" />
                    <Label className="text-xs font-semibold text-foreground">Deep Link Configuration</Label>
                    <InfoTip text="Deep links open content directly inside your mobile app. Users who don't have the app will see the fallback page instead." />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] font-medium text-muted-foreground">Deep Link URI</Label>
                    <Input placeholder="myapp://product/123" value={asset.deepLinkProperties?.deepLinkUri ?? ""} onChange={(e) => onUpdate({ deepLinkProperties: { ...asset.deepLinkProperties, deepLinkUri: e.target.value, fallbackUrl: asset.deepLinkProperties?.fallbackUrl ?? "", fallbackType: asset.deepLinkProperties?.fallbackType ?? "WEB_VIEW_FALLBACK" } })} className="h-8 text-xs font-mono" />
                    <p className="text-[9px] text-muted-foreground">Your app&apos;s custom URL scheme (e.g. myapp://path)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] font-medium text-muted-foreground">iOS App ID</Label>
                      <Input placeholder="123456789" value={asset.deepLinkProperties?.iosAppId ?? ""} onChange={(e) => onUpdate({ deepLinkProperties: { ...asset.deepLinkProperties, deepLinkUri: asset.deepLinkProperties?.deepLinkUri ?? "", iosAppId: e.target.value || undefined, fallbackUrl: asset.deepLinkProperties?.fallbackUrl ?? "", fallbackType: asset.deepLinkProperties?.fallbackType ?? "WEB_VIEW_FALLBACK" } })} className="h-8 text-xs" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] font-medium text-muted-foreground">Android Package</Label>
                      <Input placeholder="com.example.app" value={asset.deepLinkProperties?.androidAppUrl ?? ""} onChange={(e) => onUpdate({ deepLinkProperties: { ...asset.deepLinkProperties, deepLinkUri: asset.deepLinkProperties?.deepLinkUri ?? "", androidAppUrl: e.target.value || undefined, fallbackUrl: asset.deepLinkProperties?.fallbackUrl ?? "", fallbackType: asset.deepLinkProperties?.fallbackType ?? "WEB_VIEW_FALLBACK" } })} className="h-8 text-xs font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] font-medium text-muted-foreground">Fallback URL</Label>
                      <Input placeholder="https://yoursite.com/product" type="url" value={asset.deepLinkProperties?.fallbackUrl ?? ""} onChange={(e) => onUpdate({ deepLinkProperties: { ...asset.deepLinkProperties, deepLinkUri: asset.deepLinkProperties?.deepLinkUri ?? "", fallbackUrl: e.target.value, fallbackType: asset.deepLinkProperties?.fallbackType ?? "WEB_VIEW_FALLBACK" } })} className="h-8 text-xs" />
                      <p className="text-[9px] text-muted-foreground">Where users go if the app isn&apos;t installed</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] font-medium text-muted-foreground">Fallback Type</Label>
                      <Select value={asset.deepLinkProperties?.fallbackType ?? "WEB_VIEW_FALLBACK"} onValueChange={(v: "WEB_VIEW_FALLBACK" | "APP_STORE_FALLBACK") => onUpdate({ deepLinkProperties: { ...asset.deepLinkProperties, deepLinkUri: asset.deepLinkProperties?.deepLinkUri ?? "", fallbackUrl: asset.deepLinkProperties?.fallbackUrl ?? "", fallbackType: v } })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WEB_VIEW_FALLBACK">Open web page</SelectItem>
                          <SelectItem value="APP_STORE_FALLBACK">Open app store</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {isLeadGen && (
                <p className="flex items-center gap-1.5 text-[10px] text-blue-600"><Info className="size-3 shrink-0" />Swipe-up opens the Lead Generation Form. No URL needed.</p>
              )}
              {isSnapAd && (
                <p className="flex items-center gap-1.5 text-[10px] text-purple-600"><Info className="size-3 shrink-0" />Awareness-only — no swipe-up action.</p>
              )}
            </div>
          )}

          {/* ── Apply to All ── */}
          {canApplyToAll && (
            <div className="border-t border-border px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  const partial: Partial<CreativeAsset> = {};
                  if (asset.brandName) partial.brandName = asset.brandName;
                  if (asset.headline) partial.headline = asset.headline;
                  if (asset.cta) partial.cta = asset.cta;
                  if (asset.websiteUrl) partial.websiteUrl = asset.websiteUrl;
                  onApplyToAll!(partial);
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/[0.04] py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/[0.08]"
              >
                <CopyCheck className="size-3" />
                Apply brand, headline, CTA & URL to all {isStory ? "snaps" : "creatives"}
              </button>
            </div>
          )}

          {/* ── Advanced Settings ── */}
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:text-foreground"
            >
              <span>Advanced Options</span>
              {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {showAdvanced && (isSingleFormat || isStory) && showAdvancedWebView && (
              <div className="flex flex-col gap-4 px-3 pb-4">
                {/* Toggle options */}
                <div className="flex flex-col gap-0 rounded-lg border border-border">
                  {showCta && (
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-foreground">CTA Button Color</span>
                        <span className="text-[11px] leading-tight text-muted-foreground">Auto picks a color from your media, or use Snapchat&apos;s default grey</span>
                      </div>
                      <Select value={asset.ctaColorDisplayMode || "AUTO"} onValueChange={(v) => onUpdate({ ctaColorDisplayMode: v as "AUTO" | "DEFAULT" })}>
                        <SelectTrigger className="h-7 w-24 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AUTO">Auto</SelectItem>
                          <SelectItem value="DEFAULT">Default</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className={cn("flex items-center justify-between px-3 py-2.5", showCta && "border-t border-border")}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-foreground">Preload Webpage</span>
                      <span className="text-[11px] leading-tight text-muted-foreground">Loads your page while the ad plays for instant swipe-up</span>
                    </div>
                    <Switch
                      checked={asset.webViewProperties?.preloadEnabled ?? true}
                      onCheckedChange={(v) => mergeWebView({ preloadEnabled: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-foreground">Open in Snapchat Browser</span>
                      <span className="text-[11px] leading-tight text-muted-foreground">Keeps users inside Snapchat for a smoother experience</span>
                    </div>
                    <Switch
                      checked={asset.webViewProperties?.useSnapBrowser ?? true}
                      onCheckedChange={(v) => mergeWebView({ useSnapBrowser: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-foreground">Shareable</span>
                      <span className="text-[11px] leading-tight text-muted-foreground">Let viewers share this ad with friends via chat</span>
                    </div>
                    <Switch
                      checked={asset.shareable}
                      onCheckedChange={(v) => onUpdate({ shareable: v })}
                    />
                  </div>
                </div>

                {/* App Deep Link input */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-1.5">
                    <Label className="text-xs font-medium text-foreground">App Deep Link</Label>
                    <span className="text-[11px] text-muted-foreground">(Optional)</span>
                  </div>
                  <Input
                    placeholder="myapp://product/123"
                    value={asset.webViewProperties?.deepLinkUrl || ""}
                    onChange={(e) => mergeWebView({ deepLinkUrl: e.target.value })}
                    className="h-9 font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">If the user has your app installed, this opens the content directly in-app</p>
                </div>
              </div>
            )}

            {/* Fallback: original layout for non-Single/Story formats */}
            {showAdvanced && ((!isSingleFormat && !isStory) || !showAdvancedWebView) && (
              <div className="flex flex-col gap-0 px-3 pb-3">
                <div className="flex flex-col gap-0 rounded-lg border border-border">
                  {showCta && (
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-foreground">CTA Button Color</Label>
                        <InfoTip text="Auto picks a color from your media for the swipe-up button. Default uses Snapchat's standard grey." />
                      </div>
                      <Select value={asset.ctaColorDisplayMode || "AUTO"} onValueChange={(v) => onUpdate({ ctaColorDisplayMode: v as "AUTO" | "DEFAULT" })}>
                        <SelectTrigger className="h-7 w-24 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AUTO">Auto</SelectItem>
                          <SelectItem value="DEFAULT">Default</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {!isSnapAd && (
                    <div className={cn("flex items-center justify-between px-3 py-2.5", showCta && "border-t border-border")}>
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-foreground">Shareable</Label>
                        <InfoTip text="Allow viewers to share this ad with friends via chat or stories. Increases organic reach but gives less control." />
                      </div>
                      <Switch checked={asset.shareable} onCheckedChange={(v) => onUpdate({ shareable: v })} />
                    </div>
                  )}
                </div>

                {showAdvancedWebView && (
                  <div className="mt-3 flex flex-col gap-0 rounded-lg border border-border">
                    <div className="bg-muted/30 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Swipe-Up Behavior</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-foreground">In-App Browser</Label>
                        <InfoTip text="Opens your landing page inside Snapchat instead of the external browser. Keeps users in the app for a faster, smoother experience." />
                      </div>
                      <Switch checked={asset.webViewProperties?.useSnapBrowser ?? true} onCheckedChange={(v) => mergeWebView({ useSnapBrowser: v })} />
                    </div>
                    <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-foreground">Preload Page</Label>
                        <InfoTip text="Starts loading the landing page while the ad is showing so it opens instantly on swipe-up. Recommended for faster load times." />
                      </div>
                      <Switch checked={asset.webViewProperties?.preloadEnabled ?? true} onCheckedChange={(v) => mergeWebView({ preloadEnabled: v })} />
                    </div>
                    <div className="flex flex-col gap-1 border-t border-border px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-foreground">App Deep Link</Label>
                        <InfoTip text="If the user has your app installed, this URI opens the content directly in your app. Otherwise, the web URL is used as fallback." />
                      </div>
                      <Input placeholder="myapp://product/123" value={asset.webViewProperties?.deepLinkUrl || ""} onChange={(e) => mergeWebView({ deepLinkUrl: e.target.value })} className="mt-1 h-7 text-xs font-mono" />
                      <p className="text-[10px] text-muted-foreground">Optional — leave empty if you don&apos;t have a mobile app</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <LinkPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode={pickerMode}
        onSelect={(url, label) => {
          setLinkType(pickerMode);
          setPickerLabel(label);
          const updates: Partial<CreativeAsset> = { websiteUrl: url };
          // Auto-fill headline from selection if empty
          if (!asset.headline) updates.headline = label.slice(0, 34);
          // Smart CTA defaults by link type
          if (pickerMode === "product") updates.cta = (asset.cta === "MORE" || !asset.cta) ? "SHOP_NOW" as WebViewCTA : asset.cta;
          else if (pickerMode === "category") updates.cta = (asset.cta === "MORE" || !asset.cta) ? "SHOP_NOW" as WebViewCTA : asset.cta;
          else if (pickerMode === "landing_page") updates.cta = (asset.cta === "MORE" || !asset.cta) ? "MORE" as WebViewCTA : asset.cta;
          onUpdate(updates);
        }}
      />
    </div>
  );
}
