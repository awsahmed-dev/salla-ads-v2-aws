"use client";

import { useState } from "react";
import type { MetaAd, MetaCTA } from "@/lib/meta/campaign-types";
import {
  CTA_OPTIONS,
  COLLECTION_COVER_OPTIONS,
  type CollectionCoverType,
} from "@/lib/meta/creative-constants";
import { CharCounter } from "./helpers";
import { UploadZone } from "@/components/shared/upload-zone";
import { InfoTip } from "@/components/shared/info-tip";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tag,
  Store,
  Percent,
  Package,
  CheckCircle2,
  Zap,
  Wand2,
  Film,
  LayoutGrid,
  Sparkles,
  Smartphone,
  Video,
  ImageDown,
  FileVideo,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Local constants                                                    */
/* ------------------------------------------------------------------ */

const PRODUCT_DATA_OPTIONS = [
  { key: "price", label: "Show current price", tag: "{{product.current_price}}", icon: <Tag className="size-3.5" />, defaultOn: true },
  { key: "brand", label: "Show brand name", tag: "{{product.brand}}", icon: <Store className="size-3.5" />, defaultOn: false },
  { key: "discount", label: "Show price overlays", tag: "__overlay__", icon: <Percent className="size-3.5" />, defaultOn: true, isOverlay: true },
  { key: "shipping", label: "Show \"Free Shipping\"", tag: "Free Shipping", icon: <Package className="size-3.5" />, defaultOn: false, isFreeform: true },
] as const;

const SALLA_PRODUCT_SETS = [
  { id: "all_products", label: "All Products", count: null, desc: "Every product in your Salla catalog" },
  { id: "bestsellers", label: "Bestsellers", count: null, desc: "Top-selling items based on your Salla data" },
  { id: "new_arrivals", label: "New Arrivals", count: null, desc: "Recently added products" },
  { id: "on_sale", label: "On Sale", count: null, desc: "Items with active discounts" },
];

/* ------------------------------------------------------------------ */
/*  CatalogTemplateSection                                             */
/* ------------------------------------------------------------------ */

export function CatalogTemplateSection({
  ad,
  onUpdate,
}: {
  ad: MetaAd;
  onUpdate: (updates: Partial<MetaAd>) => void;
}) {
  const [productSet, setProductSet] = useState("all_products");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [coverType, setCoverType] = useState<CollectionCoverType>("ADVANTAGE_CATALOG_VIDEO");
  const [dataToggles, setDataToggles] = useState<Record<string, boolean>>({
    price: true, brand: false, discount: true, shipping: false,
  });
  const [adaptToPlacement, setAdaptToPlacement] = useState(false);
  const [mediaTypeAuto, setMediaTypeAuto] = useState(true);
  const [textOverlay, setTextOverlay] = useState(true);
  const [productExtensions, setProductExtensions] = useState(false);

  const toggleData = (key: string) =>
    setDataToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeOverlays = PRODUCT_DATA_OPTIONS.filter((d) => dataToggles[d.key]).length;
  const advancedChanges =
    (coverType !== "ADVANTAGE_CATALOG_VIDEO" ? 1 : 0) +
    (adaptToPlacement ? 1 : 0) +
    (!mediaTypeAuto ? 1 : 0) +
    (productExtensions ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Salla Sync Status Bar */}
      <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5">
        <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="size-4 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">Catalog synced with Meta</p>
          <p className="text-[10px] text-muted-foreground">
            Your Salla products are connected and ready. Meta will use product images, names, and prices directly from your catalog.
          </p>
        </div>
      </div>

      {/* 1. Product Set */}
      <div>
        <Label className="mb-2 block text-xs font-semibold text-foreground">
          Which products to advertise?
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {SALLA_PRODUCT_SETS.map((ps) => {
            const selected = productSet === ps.id;
            return (
              <button
                key={ps.id}
                type="button"
                onClick={() => setProductSet(ps.id)}
                className={cn(
                  "flex flex-col rounded-lg border-2 p-3 text-left transition-all",
                  selected
                    ? "border-[#1877F2] bg-[#1877F2]/[0.04] shadow-sm"
                    : "border-border hover:border-[#1877F2]/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className={cn("text-xs font-semibold", selected ? "text-[#1877F2]" : "text-foreground")}>
                    {ps.label}
                  </p>
                  {selected && <CheckCircle2 className="size-3.5 text-[#1877F2]" />}
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{ps.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Ad Message */}
      <div>
        <Label className="mb-2 block text-xs font-semibold text-foreground">Ad message</Label>
        <Textarea
          value={ad.primaryText}
          onChange={(e) => onUpdate({ primaryText: e.target.value })}
          placeholder="Shop our latest collection! Find the perfect item for you."
          rows={3}
          className="resize-none text-sm"
        />
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            This is the text above your ad. Product names and prices are added automatically from your catalog.
          </p>
          <CharCounter current={ad.primaryText.length} min={50} max={125} />
        </div>
      </div>

      {/* 3. Product Data Toggles */}
      <div>
        <Label className="mb-2 block text-xs font-semibold text-foreground">Product info to display</Label>
        <p className="mb-3 text-[10px] text-muted-foreground">
          Choose what product details appear on each ad card. Product name and image are always shown.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PRODUCT_DATA_OPTIONS.map((opt) => {
            const active = dataToggles[opt.key];
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleData(opt.key)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-left transition-all",
                  active
                    ? "border-[#1877F2] bg-[#1877F2]/[0.04]"
                    : "border-border hover:border-[#1877F2]/30"
                )}
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
                    active ? "bg-[#1877F2] text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {opt.icon}
                </div>
                <span className={cn("text-xs font-medium", active ? "text-[#1877F2]" : "text-foreground")}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2">
          <Zap className="mt-0.5 size-3 shrink-0 text-[#1877F2]" />
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground">{activeOverlays} active</span> -- Meta will show this data on each product card. Pricing overlays are rendered automatically.
          </p>
        </div>
      </div>

      {/* 4. Landing Page */}
      <div>
        <Label className="mb-2 block text-xs font-semibold text-foreground">
          Store URL <span className="text-destructive">*</span>
        </Label>
        <Input
          value={ad.websiteUrl}
          onChange={(e) => onUpdate({ websiteUrl: e.target.value })}
          placeholder="https://store.salla.sa/"
          className="text-sm"
        />
        <p className="mt-1 text-[10px] text-muted-foreground">
          Fallback page. Users are directed to each product&apos;s page when available via Salla deep links.
        </p>
      </div>

      {/* 5. CTA */}
      <div>
        <Label className="mb-2 block text-xs font-semibold text-foreground">Button text</Label>
        <div className="flex flex-wrap gap-2">
          {CTA_OPTIONS.filter(
            (c) => c.salesRelevant || c.value === "LEARN_MORE" || c.value === "SEND_MESSAGE"
          ).map((c) => {
            const selected = ad.callToAction === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onUpdate({ callToAction: c.value as MetaCTA })}
                className={cn(
                  "rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all",
                  selected
                    ? "border-[#1877F2] bg-[#1877F2] text-white"
                    : "border-border text-foreground hover:border-[#1877F2]/40"
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. How Meta shows your catalog */}
      <div className="rounded-xl border border-[#1877F2]/20 bg-[#1877F2]/[0.03] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Wand2 className="size-4 text-[#1877F2]" />
          <p className="text-xs font-semibold text-foreground">How Meta shows your products</p>
        </div>
        <p className="mb-3 text-[10px] leading-relaxed text-muted-foreground">
          Meta automatically picks the best format for each person. Your products are shown as scrollable cards or a grid with a cover -- whichever drives more purchases.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-lg bg-card p-3">
            <div className="mb-2 flex items-center gap-2">
              <Film className="size-3.5 text-[#1877F2]" />
              <p className="text-[10px] font-semibold text-foreground">Carousel</p>
            </div>
            <p className="text-[9px] leading-relaxed text-muted-foreground">
              Swipeable product cards in Feed. Each card links to its product page on your store.
            </p>
          </div>
          <div className="rounded-lg bg-card p-3">
            <div className="mb-2 flex items-center gap-2">
              <LayoutGrid className="size-3.5 text-[#1877F2]" />
              <p className="text-[10px] font-semibold text-foreground">Collection</p>
            </div>
            <p className="text-[9px] leading-relaxed text-muted-foreground">
              Cover media + product grid. Opens a fullscreen shopping experience powered by your Salla catalog.
            </p>
          </div>
        </div>
      </div>

      {/* 7. Advanced Settings */}
      <div className="rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Advanced settings</span>
            {advancedChanges > 0 && (
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">
                {advancedChanges} changed
              </Badge>
            )}
          </div>
          {showAdvanced ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {showAdvanced && (
          <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
            {/* Cover Media */}
            <div>
              <Label className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                Collection cover media
                <InfoTip text="The hero image/video shown above the product grid in Collection format. Advantage Catalog Video is auto-generated from your product images." />
              </Label>
              <div className="space-y-1.5">
                {COLLECTION_COVER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCoverType(opt.value)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                      coverType === opt.value
                        ? "border-[#1877F2] bg-[#1877F2]/[0.03]"
                        : "border-border hover:border-[#1877F2]/30"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md",
                        coverType === opt.value
                          ? "bg-[#1877F2] text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {opt.value === "ADVANTAGE_CATALOG_VIDEO" ? (
                        <Wand2 className="size-3.5" />
                      ) : opt.value === "CUSTOM_IMAGE" ? (
                        <ImageDown className="size-3.5" />
                      ) : (
                        <FileVideo className="size-3.5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={cn(
                            "text-[11px] font-medium",
                            coverType === opt.value ? "text-[#1877F2]" : "text-foreground"
                          )}
                        >
                          {opt.label}
                        </p>
                        {opt.isDefault && (
                          <Badge variant="outline" className="rounded-full px-1 py-0 text-[8px]">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-[9px] text-muted-foreground">{opt.description}</p>
                    </div>
                    {coverType === opt.value && (
                      <CheckCircle2 className="size-3.5 text-[#1877F2]" />
                    )}
                  </button>
                ))}
              </div>
              {coverType === "CUSTOM_IMAGE" && (
                <div className="mt-2">
                  <UploadZone
                    accept="image/jpeg,image/png"
                    label="Upload cover image"
                    sublabel="JPG, PNG -- 1:1 or 4:5"
                    onFile={() => {}}
                    compact
                    libraryContext="IMAGE"
                  />
                </div>
              )}
              {coverType === "CUSTOM_VIDEO" && (
                <div className="mt-2">
                  <UploadZone
                    accept="video/mp4,video/quicktime"
                    label="Upload cover video"
                    sublabel="MP4, MOV -- Max 4 GB"
                    onFile={() => {}}
                    compact
                    libraryContext="VIDEO"
                  />
                </div>
              )}
            </div>

            {/* Advantage+ Creative Features */}
            <div>
              <Label className="mb-2 block text-xs font-semibold text-foreground">
                Advantage+ enhancements
              </Label>
              <div className="flex flex-col gap-2">
                {[
                  { key: "adaptToPlacement", label: "Reels & Stories optimization", desc: "Use 9:16 product images for vertical placements", icon: <Smartphone className="size-3.5" />, checked: adaptToPlacement, onChange: setAdaptToPlacement },
                  { key: "mediaTypeAuto", label: "Auto-use product videos", desc: "Show catalog videos when available", icon: <Video className="size-3.5" />, checked: mediaTypeAuto, onChange: setMediaTypeAuto },
                  { key: "textOverlay", label: "Price & discount overlays", desc: "Add price tags and sale badges on images", icon: <Percent className="size-3.5" />, checked: textOverlay, onChange: setTextOverlay },
                  { key: "productExtensions", label: "Product extensions", desc: "Show extra products below non-catalog ads", icon: <Package className="size-3.5" />, checked: productExtensions, onChange: setProductExtensions },
                ].map((f) => (
                  <div
                    key={f.key}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="text-[#1877F2]">{f.icon}</div>
                      <div>
                        <p className="text-[11px] font-medium text-foreground">{f.label}</p>
                        <p className="text-[9px] text-muted-foreground">{f.desc}</p>
                      </div>
                    </div>
                    <Switch checked={f.checked} onCheckedChange={f.onChange} />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Name Template */}
            <div>
              <Label className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                Product title template
                <InfoTip text="How the product name appears on each card. Default uses your catalog product name directly." />
              </Label>
              <Input
                value={ad.headline || "{{product.name}}"}
                onChange={(e) => onUpdate({ headline: e.target.value })}
                placeholder="{{product.name}}"
                className="font-mono text-sm"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Leave as default to use each product&apos;s name from your Salla catalog.
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
