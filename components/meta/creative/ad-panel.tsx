"use client";

import { useState } from "react";
import type {
  MetaAd,
  MetaAdFormat,
  MetaCTA,
  MetaCreativeAsset,
  MetaObjectiveConfig,
} from "@/lib/meta/campaign-types";
import {
  AD_FORMAT_OPTIONS,
  CTA_OPTIONS,
  FORMAT_TEXT_LIMITS,
} from "@/lib/meta/creative-constants";
import {
  CharCounter,
  FORMAT_ICONS,
  makeCarouselCard,
} from "./helpers";
import { CarouselCardEditor } from "./carousel-editor";
import { CatalogTemplateSection } from "./catalog-section";
import { UploadZone } from "@/components/shared/upload-zone";
import { LinkTypeSection, type CtaOption } from "@/components/shared/link-type-section";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Copy,
  Trash2,
  CheckCircle2,
  ChevronDown,
  Film,
  ShoppingBag,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CTA helpers for LinkTypeSection                                    */
/* ------------------------------------------------------------------ */

const RECOMMENDED_CTAS: CtaOption[] = CTA_OPTIONS
  .filter((c) => c.salesRelevant || ["LEARN_MORE", "SIGN_UP"].includes(c.value))
  .map((c) => ({ value: c.value, label: c.label }));

const OTHER_CTAS: CtaOption[] = CTA_OPTIONS
  .filter((c) => !c.salesRelevant && !["LEARN_MORE", "SIGN_UP", "NO_BUTTON"].includes(c.value))
  .map((c) => ({ value: c.value, label: c.label }));

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface MetaAdPanelProps {
  ad: MetaAd;
  adIndex: number;
  totalAds: number;
  isActive: boolean;
  catalogEnabled: boolean;
  objConfig: MetaObjectiveConfig;
  onSelect: () => void;
  onUpdate: (updates: Partial<MetaAd>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

/* ------------------------------------------------------------------ */
/*  Media specs bar (compact, like TikTok)                             */
/* ------------------------------------------------------------------ */

function MediaSpecsBar({ format }: { format: MetaAdFormat }) {
  const specs: Record<MetaAdFormat, { text: string; badge?: string }> = {
    SINGLE_IMAGE: { text: "JPG/PNG · 1:1 or 4:5 recommended · max 30MB", badge: "Best Format" },
    SINGLE_VIDEO: { text: "MP4/MOV · 1:1 or 4:5 (Feed) / 9:16 (Reels) · max 4GB · H.264", badge: "Best Format" },
    CAROUSEL: { text: "JPG/PNG/MP4 · 1:1 per card · 2–5 cards · max 30MB img / 4GB video" },
    DYNAMIC: { text: "Auto-generated from Salla catalog" },
    COLLECTION: { text: "Auto-generated from Salla catalog" },
  };
  const s = specs[format] || specs.SINGLE_IMAGE;
  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
      <Film className="size-3.5 shrink-0 text-muted-foreground" />
      <p className="text-[11px] text-muted-foreground">{s.text}</p>
      {s.badge && (
        <span className="ml-auto shrink-0 rounded-md bg-[#1877F2]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#1877F2]">
          {s.badge}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MetaAdPanel                                                        */
/* ------------------------------------------------------------------ */

export function MetaAdPanel({
  ad,
  adIndex,
  totalAds,
  isActive,
  catalogEnabled,
  objConfig,
  onSelect,
  onUpdate,
  onRemove,
  onDuplicate,
}: MetaAdPanelProps) {
  const [editingName, setEditingName] = useState(false);

  const isCatalogFormat = ad.adFormat === "DYNAMIC" || ad.adFormat === "COLLECTION";
  const isCarousel = ad.adFormat === "CAROUSEL";
  const formatLimits = FORMAT_TEXT_LIMITS[ad.adFormat] || FORMAT_TEXT_LIMITS.SINGLE_IMAGE;
  const formatConfig = AD_FORMAT_OPTIONS.find((f) => f.value === ad.adFormat);

  const handleMediaUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const asset: MetaCreativeAsset = {
      id: `asset_${Date.now()}`,
      type: file.type.startsWith("video") ? "VIDEO" : "IMAGE",
      url,
      file,
    };
    onUpdate({ assets: [asset] });
  };

  /* ---- Subtitle for collapsed state ---- */
  const assetCount = isCarousel
    ? ad.carouselCards.filter((c) => c.imageUrl).length
    : ad.assets.length;
  const formatLabel = isCatalogFormat
    ? "Catalog Ads"
    : (formatConfig?.label || "Single Image");
  const hasMedia = isCatalogFormat || assetCount > 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border-2 transition-all",
        isActive
          ? "border-[#1877F2] shadow-md"
          : "border-border hover:border-[#1877F2]/30"
      )}
    >
      {/* ============================================================ */}
      {/* Header (always visible)                                       */}
      {/* ============================================================ */}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-t-xl px-4 py-3 text-left transition-colors",
          isActive ? "bg-[#1877F2]/5" : "bg-muted/30 hover:bg-muted/50"
        )}
      >
        {/* Number badge */}
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
            isActive
              ? "bg-[#1877F2] text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          {adIndex + 1}
        </div>

        {/* Name + subtitle */}
        <div className="flex min-w-0 flex-1 flex-col">
          {editingName && isActive ? (
            <Input
              value={ad.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); }}
              autoFocus
              maxLength={100}
              className="h-6 w-40 text-xs font-semibold"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="truncate text-xs font-semibold text-foreground">
                {ad.name}
              </span>
              {isActive && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditingName(true); }}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3" />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className={cn("inline-block size-1.5 rounded-full", hasMedia ? "bg-emerald-500" : "bg-amber-400")} />
            <span>{formatLabel}</span>
            {!isCatalogFormat && (
              <>
                <span className="text-border">&bull;</span>
                <span>
                  {assetCount} {isCarousel ? "card" : "asset"}
                  {assetCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
            {isCatalogFormat && (
              <Badge variant="outline" className="ml-1 rounded-full px-1 py-0 text-[8px]">
                Catalog
              </Badge>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Copy className="size-3.5" />
          </button>
          {totalAds > 1 && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Expanded body (only when active)                              */}
      {/* ============================================================ */}
      {isActive && (
        <div className="flex flex-col border-t border-border">

          {/* ── Ad Format Picker ── */}
          <div className="px-6 py-5">
            <p className="mb-1 text-xs font-bold text-foreground">Ad Format</p>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Choose a format for this ad. You can add more ads in different formats.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AD_FORMAT_OPTIONS.filter((f) => objConfig.allowedAdFormats.includes(f.value))
                .filter((f) => f.value !== "COLLECTION")
                .filter((f) => f.value !== "DYNAMIC" || catalogEnabled)
                .map((fmt) => {
                  const selected =
                    fmt.value === "DYNAMIC"
                      ? ad.adFormat === "DYNAMIC" || ad.adFormat === "COLLECTION"
                      : ad.adFormat === fmt.value;
                  const isCatalog = fmt.value === "DYNAMIC";
                  const displayLabel = isCatalog ? "Catalog Ads" : fmt.label;

                  return (
                    <button
                      key={fmt.value}
                      type="button"
                      onClick={() => {
                        if (fmt.value === ad.adFormat) return;
                        const updates: Partial<MetaAd> = {
                          adFormat: fmt.value,
                          assets: [],
                          carouselCards: fmt.value === "CAROUSEL"
                            ? (ad.carouselCards.length >= 2 ? ad.carouselCards : [makeCarouselCard(0), makeCarouselCard(1)])
                            : [],
                        };
                        onUpdate(updates);
                      }}
                      className={cn(
                        "group flex flex-col items-center rounded-xl border-2 px-3 py-4 text-center transition-all",
                        selected
                          ? "border-[#1877F2] bg-[#1877F2]/[0.04] shadow-sm"
                          : "border-border hover:border-[#1877F2]/40"
                      )}
                    >
                      <div
                        className={cn(
                          "mb-2 flex size-10 items-center justify-center rounded-xl transition-colors",
                          selected
                            ? "bg-[#1877F2]/10 text-[#1877F2]"
                            : "bg-muted text-muted-foreground group-hover:bg-[#1877F2]/10 group-hover:text-[#1877F2]"
                        )}
                      >
                        {FORMAT_ICONS[fmt.value]}
                      </div>
                      <p className={cn(
                        "text-xs font-semibold",
                        selected ? "text-[#1877F2]" : "text-foreground"
                      )}>
                        {displayLabel}
                      </p>
                      <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">
                        {fmt.desc}
                      </p>
                      {(fmt.recommended || isCatalog) && catalogEnabled && (
                        <Badge className="mt-1 w-fit rounded-full bg-[#1877F2] px-1.5 py-0 text-[8px] text-white">
                          {isCatalog ? "Recommended" : "Recommended"}
                        </Badge>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* ── Format-specific content ── */}
          {isCatalogFormat ? (
            /* ---- CATALOG FORMAT ---- */
            <div className="flex flex-col border-t border-border">
              {/* Link Type + CTA */}
              <div className="px-6 py-5">
                <LinkTypeSection
                  url={ad.websiteUrl}
                  onUrlChange={(url) => onUpdate({ websiteUrl: url })}
                  cta={ad.callToAction}
                  onCtaChange={(v) => onUpdate({ callToAction: v as MetaCTA })}
                  recommendedCtas={RECOMMENDED_CTAS}
                  otherCtas={OTHER_CTAS}
                />
              </div>

              {/* Catalog Setup */}
              <div className="border-t border-border px-6 py-5">
                <div className="mb-3 flex items-center gap-2">
                  <ShoppingBag className="size-4 text-[#1877F2]" />
                  <Label className="text-xs font-semibold text-foreground">Catalog Ad Setup</Label>
                </div>
                <CatalogTemplateSection ad={ad} onUpdate={onUpdate} />
              </div>

            </div>
          ) : isCarousel ? (
            /* ---- CAROUSEL ---- */
            <div className="flex flex-col border-t border-border">
              {/* Link Type + CTA */}
              <div className="px-6 py-5">
                <LinkTypeSection
                  url={ad.websiteUrl}
                  onUrlChange={(url) => onUpdate({ websiteUrl: url })}
                  cta={ad.callToAction}
                  onCtaChange={(v) => onUpdate({ callToAction: v as MetaCTA })}
                  recommendedCtas={RECOMMENDED_CTAS}
                  otherCtas={OTHER_CTAS}
                />
              </div>

              {/* Media Upload */}
              <div className="border-t border-border px-6 py-5">
                <MediaSpecsBar format="CAROUSEL" />
                <CarouselCardEditor
                  cards={ad.carouselCards}
                  onUpdate={(cards) => onUpdate({ carouselCards: cards })}
                />
              </div>

              {/* Ad Copy */}
              <div className="border-t border-border px-6 py-5">
                <AdCopySection ad={ad} onUpdate={onUpdate} formatLimits={formatLimits} formatLabel={formatConfig?.label || "Carousel"} />
              </div>
            </div>
          ) : ad.adFormat === "SINGLE_VIDEO" ? (
            /* ---- SINGLE VIDEO ---- */
            <div className="flex flex-col border-t border-border">
              {/* Link Type + CTA */}
              <div className="px-6 py-5">
                <LinkTypeSection
                  url={ad.websiteUrl}
                  onUrlChange={(url) => onUpdate({ websiteUrl: url })}
                  cta={ad.callToAction}
                  onCtaChange={(v) => onUpdate({ callToAction: v as MetaCTA })}
                  recommendedCtas={RECOMMENDED_CTAS}
                  otherCtas={OTHER_CTAS}
                />
              </div>

              {/* Media Upload */}
              <div className="border-t border-border px-6 py-5">
                <MediaSpecsBar format="SINGLE_VIDEO" />
                <UploadZone
                  accept="video/mp4,video/quicktime,image/gif"
                  label="Drop video here"
                  sublabel="MP4, MOV, GIF — Max 4 GB"
                  preview={ad.assets[0]?.url || undefined}
                  previewMediaType={ad.assets[0]?.type}
                  previewFile={ad.assets[0]?.file}
                  onFile={handleMediaUpload}
                  onClear={() => onUpdate({ assets: [] })}
                  libraryContext="VIDEO"
                />
              </div>

              {/* Ad Copy */}
              <div className="border-t border-border px-6 py-5">
                <AdCopySection ad={ad} onUpdate={onUpdate} formatLimits={formatLimits} formatLabel="Single Video" />
              </div>

            </div>
          ) : (
            /* ---- SINGLE IMAGE (default) ---- */
            <div className="flex flex-col border-t border-border">
              {/* Link Type + CTA */}
              <div className="px-6 py-5">
                <LinkTypeSection
                  url={ad.websiteUrl}
                  onUrlChange={(url) => onUpdate({ websiteUrl: url })}
                  cta={ad.callToAction}
                  onCtaChange={(v) => onUpdate({ callToAction: v as MetaCTA })}
                  recommendedCtas={RECOMMENDED_CTAS}
                  otherCtas={OTHER_CTAS}
                />
              </div>

              {/* Media Upload */}
              <div className="border-t border-border px-6 py-5">
                <MediaSpecsBar format="SINGLE_IMAGE" />
                <UploadZone
                  accept="image/jpeg,image/png"
                  label="Drop image here"
                  sublabel="JPG, PNG — Max 30 MB"
                  preview={ad.assets[0]?.url || undefined}
                  previewMediaType={ad.assets[0]?.type}
                  previewFile={ad.assets[0]?.file}
                  onFile={handleMediaUpload}
                  onClear={() => onUpdate({ assets: [] })}
                  libraryContext="IMAGE"
                />
              </div>

              {/* Ad Copy */}
              <div className="border-t border-border px-6 py-5">
                <AdCopySection ad={ad} onUpdate={onUpdate} formatLimits={formatLimits} formatLabel="Single Image" />
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ad Copy Section (shared across non-catalog formats)                */
/* ------------------------------------------------------------------ */

function AdCopySection({
  ad,
  onUpdate,
  formatLimits,
  formatLabel,
}: {
  ad: MetaAd;
  onUpdate: (u: Partial<MetaAd>) => void;
  formatLimits: { primaryMin: number; primaryMax: number; headline: number; description: number; headlineNote: string };
  formatLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Primary Text */}
        <div className="col-span-2 flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">
            Primary Text <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Textarea
              value={ad.primaryText}
              onChange={(e) => onUpdate({ primaryText: e.target.value })}
              placeholder="Write your main ad text..."
              rows={3}
              maxLength={formatLimits.primaryMax}
              className={cn("resize-none pr-14 text-sm", ad.primaryText.length >= formatLimits.primaryMax && "border-amber-400")}
            />
            <span className="pointer-events-none absolute right-3 top-3 text-xs tabular-nums text-muted-foreground">
              {ad.primaryText.length}/{formatLimits.primaryMax}
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">Headline</Label>
          <div className="relative">
            <Input
              value={ad.headline}
              onChange={(e) => onUpdate({ headline: e.target.value })}
              placeholder="Short headline"
              maxLength={formatLimits.headline}
              className={cn("h-10 pr-14 text-sm", ad.headline.length >= formatLimits.headline && "border-amber-400")}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">
              {ad.headline.length}/{formatLimits.headline}
            </span>
          </div>
        </div>

        {/* Description */}
        {formatLimits.description > 0 && (
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-foreground">Description</Label>
            <div className="relative">
              <Input
                value={ad.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Link description"
                maxLength={formatLimits.description}
                className={cn("h-10 pr-14 text-sm", ad.description.length >= formatLimits.description && "border-amber-400")}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">
                {ad.description.length}/{formatLimits.description}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

