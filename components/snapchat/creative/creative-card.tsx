"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { isSallaStoreUrl, lookupProductByUrl } from "@/lib/salla/store-api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
} from "lucide-react";
import { UploadZone } from "@/components/shared/upload-zone";
import {
  MEDIA_SPECS,
  CROP_OPTIONS,
  CTA_OPTIONS,
  LEAD_CTA_OPTIONS,
  APP_INSTALL_CTA_OPTIONS,
} from "./constants";
import { InfoTip } from "@/components/shared/info-tip";
import type {
  CreativeAsset,
  SnapMediaType,
  WebViewCTA,
  CropPosition,
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
  isStory,
  isCollection,
  isLeadGen,
  isAppInstall,
  isSnapAd,
  isDeepLink,
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
  isStory: boolean;
  isCollection: boolean;
  isLeadGen: boolean;
  isAppInstall: boolean;
  isSnapAd?: boolean;
  isDeepLink?: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (partial: Partial<CreativeAsset>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMove: (dir: "up" | "down") => void;
  onApplyToAll?: (partial: Partial<CreativeAsset>) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sallaProduct, setSallaProduct] = useState<any>(null);

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
        onUpdate({ mediaType, url: URL.createObjectURL(file), file });
      }
    },
    [onUpdate]
  );

  const isInfluencer = (asset.mediaSource ?? "upload") === "ad_code";
  const showUrl = !isLeadGen && !isAppInstall && !isSnapAd && !isDeepLink;
  const showCta = !isCollection && !isSnapAd;
  const showAdvancedWebView = !isSnapAd && !isDeepLink && !isLeadGen && !isAppInstall && !isInfluencer;

  const hasContent = !!(asset.brandName || asset.headline || asset.cta || asset.websiteUrl);
  const canApplyToAll = total > 1 && hasContent && !!onApplyToAll;

  // Collapsed summary line
  const summaryParts: string[] = [];
  if (asset.url) summaryParts.push(asset.mediaType === "VIDEO" ? "Video" : "Image");
  else if (asset.claimStatus === "READY") summaryParts.push("Influencer");
  else summaryParts.push("No media");
  if (asset.brandName) summaryParts.push(asset.brandName);
  if (asset.headline) summaryParts.push(`"${asset.headline}"`);

  return (
    <div className={cn(
      "rounded-lg border bg-background transition-all",
      isExpanded ? "border-primary/30 shadow-sm" : "border-border hover:border-primary/20"
    )}>
      {/* ── Header ── */}
      <div
        className={cn("flex items-center gap-2 px-3 py-2 cursor-pointer", isExpanded && "bg-primary/[0.02]")}
        onClick={onToggleExpand}
      >
        {isStory && <GripVertical className="size-3.5 cursor-grab text-muted-foreground" onClick={(e) => e.stopPropagation()} />}
        <div className="flex items-center gap-1.5">
          {asset.url || asset.claimStatus === "READY" ? (
            <CheckCircle2 className="size-3 text-emerald-500" />
          ) : asset.mediaType === "VIDEO" ? (
            <Film className="size-3 text-primary" />
          ) : (
            <ImageIcon className="size-3 text-primary" />
          )}
          <span className="text-xs font-semibold text-foreground">
            {isStory ? `Snap ${index + 1}` : `Creative ${index + 1}`}
          </span>
        </div>

        {/* Collapsed summary */}
        {!isExpanded && (
          <span className="flex-1 truncate text-[11px] text-muted-foreground">
            {summaryParts.join(" · ")}
          </span>
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

      {isExpanded && (
        <div className="flex flex-col gap-0 border-t border-border">

          {/* ── Section 1: Media ── */}
          <div className="px-3 py-3">
            {isInfluencer ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5">
                  <Link2 className="size-3 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Influencer Ad Code</span>
                </div>
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
                          <Input
                            placeholder="Creator's Snapchat Profile ID"
                            value={asset.creatorProfileId === "creator_profile_placeholder" ? "" : (asset.creatorProfileId ?? "")}
                            onChange={(e) => onUpdate({ creatorProfileId: e.target.value || "creator_profile_placeholder" })}
                            className="h-7 font-mono text-xs"
                          />
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
              <UploadZone
                accept="image/png,image/jpeg,video/mp4,video/quicktime"
                label="Drop image or video"
                sublabel="Image: PNG/JPG, 1080x1920, max 5MB | Video: MP4/MOV, 3-180s, max 32MB"
                preview={asset.url || undefined}
                previewMediaType={asset.mediaType}
                previewFile={asset.file}
                onFile={handleFile}
                onClear={() => onUpdate({ url: "", file: undefined, mediaType: "IMAGE" })}
              />
            )}
          </div>

          {/* ── Section 2: Ad Copy ── */}
          <div className="border-t border-border px-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Brand Name</Label>
                  <CharCounter current={asset.brandName.length} max={32} />
                </div>
                <Input placeholder="Your brand" value={asset.brandName} maxLength={32} onChange={(e) => onUpdate({ brandName: e.target.value.slice(0, 32) })} className={cn("h-8 text-xs", asset.brandName.length >= 32 && "border-amber-400")} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Headline</Label>
                  <CharCounter current={asset.headline.length} max={34} />
                </div>
                <Input placeholder="Catchy headline" value={asset.headline} maxLength={34} onChange={(e) => onUpdate({ headline: e.target.value.slice(0, 34) })} className={cn("h-8 text-xs", asset.headline.length >= 34 && "border-amber-400")} />
              </div>
            </div>
            {(!asset.brandName && !asset.headline) && (
              <div className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
                <Sparkles className="mt-0.5 size-3 shrink-0 text-blue-400" />
                <span>Tip: Arabic text performs 40% better in Saudi market. Try <span className="font-medium" dir="rtl">تسوق الآن</span> or <span className="font-medium" dir="rtl">متجر الأناقة</span></span>
              </div>
            )}
          </div>

          {/* ── Section 3: CTA & Destination ── */}
          {(showCta || showUrl || isDeepLink) && (
            <div className="flex flex-col gap-2 border-t border-border px-3 py-3">
              <div className={cn("grid gap-2", showCta && !isCollection ? "grid-cols-2" : "grid-cols-1")}>
                {showCta && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-muted-foreground">Call to Action</Label>
                    <Select value={asset.cta} onValueChange={(v) => onUpdate({ cta: v as WebViewCTA })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(isAppInstall ? APP_INSTALL_CTA_OPTIONS : isLeadGen ? LEAD_CTA_OPTIONS : CTA_OPTIONS).map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {showUrl && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-muted-foreground">Swipe-Up URL</Label>
                    <Input placeholder="https://yourstore.com/product" type="url" value={asset.websiteUrl} onChange={(e) => onUpdate({ websiteUrl: e.target.value })} className={cn("h-8 text-xs", asset.websiteUrl && !asset.websiteUrl.startsWith("https://") && "border-red-400")} />
                    {asset.websiteUrl && !asset.websiteUrl.startsWith("https://") && (
                      <p className="text-[10px] text-red-600">URL must start with https://</p>
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
                <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/[0.02] p-2.5">
                  <div className="flex items-center gap-1.5">
                    <Link2 className="size-3 text-primary" />
                    <Label className="text-xs font-semibold text-foreground">Deep Link</Label>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Input placeholder="myapp://product/123" value={asset.deepLinkProperties?.deepLinkUri ?? ""} onChange={(e) => onUpdate({ deepLinkProperties: { ...asset.deepLinkProperties, deepLinkUri: e.target.value, fallbackUrl: asset.deepLinkProperties?.fallbackUrl ?? "", fallbackType: asset.deepLinkProperties?.fallbackType ?? "WEB_VIEW_FALLBACK" } })} className="h-8 text-xs font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="iOS App ID" value={asset.deepLinkProperties?.iosAppId ?? ""} onChange={(e) => onUpdate({ deepLinkProperties: { ...asset.deepLinkProperties, deepLinkUri: asset.deepLinkProperties?.deepLinkUri ?? "", iosAppId: e.target.value || undefined, fallbackUrl: asset.deepLinkProperties?.fallbackUrl ?? "", fallbackType: asset.deepLinkProperties?.fallbackType ?? "WEB_VIEW_FALLBACK" } })} className="h-8 text-xs" />
                    <Input placeholder="Android Package" value={asset.deepLinkProperties?.androidAppUrl ?? ""} onChange={(e) => onUpdate({ deepLinkProperties: { ...asset.deepLinkProperties, deepLinkUri: asset.deepLinkProperties?.deepLinkUri ?? "", androidAppUrl: e.target.value || undefined, fallbackUrl: asset.deepLinkProperties?.fallbackUrl ?? "", fallbackType: asset.deepLinkProperties?.fallbackType ?? "WEB_VIEW_FALLBACK" } })} className="h-8 text-xs font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="https://fallback-url.com" type="url" value={asset.deepLinkProperties?.fallbackUrl ?? ""} onChange={(e) => onUpdate({ deepLinkProperties: { ...asset.deepLinkProperties, deepLinkUri: asset.deepLinkProperties?.deepLinkUri ?? "", fallbackUrl: e.target.value, fallbackType: asset.deepLinkProperties?.fallbackType ?? "WEB_VIEW_FALLBACK" } })} className="h-8 text-xs" />
                    <Select value={asset.deepLinkProperties?.fallbackType ?? "WEB_VIEW_FALLBACK"} onValueChange={(v: "WEB_VIEW_FALLBACK" | "APP_STORE_FALLBACK") => onUpdate({ deepLinkProperties: { ...asset.deepLinkProperties, deepLinkUri: asset.deepLinkProperties?.deepLinkUri ?? "", fallbackUrl: asset.deepLinkProperties?.fallbackUrl ?? "", fallbackType: v } })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEB_VIEW_FALLBACK">Web Fallback</SelectItem>
                        <SelectItem value="APP_STORE_FALLBACK">App Store</SelectItem>
                      </SelectContent>
                    </Select>
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
                Apply brand, headline, CTA & URL to all creatives
              </button>
            </div>
          )}

          {/* ── Advanced Settings (includes crop, CTA color, shareable, web view) ── */}
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <span>Advanced Settings</span>
              {showAdvanced ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>
            {showAdvanced && (
              <div className="flex flex-col gap-3 px-3 pb-3">
                {/* Crop, CTA color, Shareable */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-foreground">Crop</Label>
                    <Select value={asset.cropPosition} onValueChange={(v) => onUpdate({ cropPosition: v as CropPosition })}>
                      <SelectTrigger className="h-7 w-32 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CROP_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {showCta && (
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-foreground">CTA Color</Label>
                      <Select value={asset.ctaColorDisplayMode || "AUTO"} onValueChange={(v) => onUpdate({ ctaColorDisplayMode: v as "AUTO" | "DEFAULT" })}>
                        <SelectTrigger className="h-7 w-20 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AUTO">Auto</SelectItem>
                          <SelectItem value="DEFAULT">Default</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {!isSnapAd && (
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-foreground">Shareable</Label>
                      <Switch checked={asset.shareable} onCheckedChange={(v) => onUpdate({ shareable: v })} className="scale-75" />
                    </div>
                  )}
                </div>

                {/* Web View settings */}
                {showAdvancedWebView && (
                  <div className="flex flex-col gap-2.5 border-t border-border pt-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Web View</p>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-foreground">Snap Browser</Label>
                      <Switch checked={asset.webViewProperties?.useSnapBrowser ?? true} onCheckedChange={(v) => onUpdate({ webViewProperties: { ...asset.webViewProperties, url: asset.websiteUrl, useSnapBrowser: v, preloadEnabled: asset.webViewProperties?.preloadEnabled ?? true, blockPreload: asset.webViewProperties?.blockPreload ?? false } })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-foreground">Preload Page</Label>
                      <Switch checked={asset.webViewProperties?.preloadEnabled ?? true} onCheckedChange={(v) => onUpdate({ webViewProperties: { ...asset.webViewProperties, url: asset.websiteUrl, useSnapBrowser: asset.webViewProperties?.useSnapBrowser ?? true, preloadEnabled: v, blockPreload: asset.webViewProperties?.blockPreload ?? false } })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-foreground">App Deep Link URL</Label>
                      <Input placeholder="myapp://product/123" value={asset.webViewProperties?.deepLinkUrl || ""} onChange={(e) => onUpdate({ webViewProperties: { ...asset.webViewProperties, url: asset.websiteUrl, useSnapBrowser: asset.webViewProperties?.useSnapBrowser ?? true, preloadEnabled: asset.webViewProperties?.preloadEnabled ?? true, blockPreload: asset.webViewProperties?.blockPreload ?? false, deepLinkUrl: e.target.value } })} className="h-7 text-xs" />
                      <p className="text-[10px] text-muted-foreground">Opens in app if installed, else falls back to web URL</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
