"use client";

import { useState, useRef, useCallback } from "react";
import { useMetaCampaign } from "@/lib/meta/campaign-context";
import { META_OBJECTIVE_CONFIGS } from "@/lib/meta/campaign-types";
import type {
  MetaAdFormat,
  MetaCTA,
  MetaAd,
  MetaCreativeAsset,
  MetaCarouselCard,
  MetaConversionLocation,
  MetaPublisherPlatform,
  MetaFacebookPosition,
  MetaInstagramPosition,
} from "@/lib/meta/campaign-types";
import {
  AD_FORMAT_OPTIONS,
  CTA_OPTIONS,
  FORMAT_TEXT_LIMITS,
  PLACEMENT_SPECS,
  COLLECTION_COVER_OPTIONS,
  type PreviewPlacement,
  type CollectionCoverType,
} from "@/lib/meta/creative-constants";
import {
  FacebookFeedPreview,
  InstagramFeedPreview,
  ReelsStoriesPreview,
} from "@/components/meta/creative-previews";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
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
  ImagePlus,
  Plus,
  Trash2,
  AlertCircle,
  Layers,
  Info,
  Video,
  Image as ImageIcon,
  Upload,
  Film,
  Link2,
  CheckCircle2,
  X,
  Smartphone,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Tag,
  Store,
  Zap,
  ShieldCheck,
  GripVertical,
  Monitor,
  Volume2,
  Eye,
  Sparkles,
  ShoppingBag,
  Database,
  Wand2,
  Package,
  Percent,
  LayoutGrid,
  FileVideo,
  ImageDown,
  Clapperboard,
  Globe,
  Megaphone,
  MessageSquare,
} from "lucide-react";

/* ================================================================== */
/*  Shared UI helpers                                                  */
/* ================================================================== */

function CharCounter({
  current,
  min,
  max,
}: {
  current: number;
  min?: number;
  max: number;
}) {
  const over = current > max;
  const under = min != null && current > 0 && current < min;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        over
          ? "font-medium text-destructive"
          : under
            ? "font-medium text-amber-600"
            : "text-muted-foreground"
      )}
    >
      {current}/{max}
    </span>
  );
}

function ApiBadge({ field }: { field: string }) {
  return (
    <Badge
      variant="secondary"
      className="rounded-full px-1 py-0 font-mono text-[8px]"
    >
      {field}
    </Badge>
  );
}

/* ================================================================== */
/*  Data helpers                                                       */
/* ================================================================== */

function makeDefaultAd(format: MetaAdFormat, index: number): MetaAd {
  return {
    id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: `Ad ${index + 1}`,
    adFormat: format,
    assets: [],
    carouselCards:
      format === "CAROUSEL"
        ? [makeCarouselCard(0), makeCarouselCard(1)]
        : [],
    primaryText: "",
    headline: "",
    description: "",
    websiteUrl: "",
    displayLink: "",
    callToAction: "SHOP_NOW",
    utmSource: "facebook",
    utmMedium: "paid",
    utmCampaign: "",
    urlParameters: "",
  };
}

function makeCarouselCard(index: number): MetaCarouselCard {
  return {
    id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${index}`,
    imageUrl: "",
    headline: "",
    description: "",
    link: "",
  };
}

const FORMAT_ICONS: Record<MetaAdFormat, React.ReactNode> = {
  SINGLE_IMAGE: <ImageIcon className="size-5" />,
  SINGLE_VIDEO: <Video className="size-5" />,
  CAROUSEL: <Film className="size-5" />,
  COLLECTION: <Layers className="size-5" />,
  DYNAMIC: <Wand2 className="size-5" />,
};

/* ================================================================== */
/*  Upload Drop Zone                                                   */
/* ================================================================== */

function UploadZone({
  accept,
  label,
  sublabel,
  preview,
  previewFile,
  onFile,
  onClear,
  compact,
}: {
  accept: string;
  label: string;
  sublabel: string;
  preview?: string;
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
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[#1877F2]/40 bg-[#1877F2]/5 px-3 py-2.5">
        <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="size-full object-cover" crossOrigin="anonymous" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-medium text-foreground">{previewFile?.name || "image.jpg"}</span>
          {previewFile?.size && <span className="text-[10px] text-muted-foreground">{formatSize(previewFile.size)}</span>}
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Upload className="size-3.5" /></button>
        {onClear && <button type="button" onClick={onClear} className="shrink-0 rounded-md p-1.5 text-destructive/60 transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></button>}
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
        dragOver ? "border-[#1877F2] bg-[#1877F2]/5" : "border-border bg-muted/10 hover:border-[#1877F2]/40 hover:bg-muted/20",
        compact ? "gap-1 py-3" : "gap-1.5 py-6"
      )}
    >
      <Upload className={cn("text-muted-foreground", compact ? "size-4" : "size-5")} />
      <span className={cn("font-medium text-foreground", compact ? "text-[11px]" : "text-xs")}>{label}</span>
      <span className={cn("text-center text-muted-foreground", compact ? "text-[9px]" : "text-[10px]")}>{sublabel}</span>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </button>
  );
}

/* ================================================================== */
/*  Carousel Card Editor                                               */
/* ================================================================== */

function CarouselCardEditor({
  cards,
  onUpdate,
}: {
  cards: MetaCarouselCard[];
  onUpdate: (cards: MetaCarouselCard[]) => void;
}) {
  const limits = FORMAT_TEXT_LIMITS.CAROUSEL;

  const handleCardMediaUpload = (index: number, file: File) => {
    const url = URL.createObjectURL(file);
    const updated = [...cards];
    updated[index] = { ...updated[index], imageUrl: url, file };
    onUpdate(updated);
  };

  const updateCard = (index: number, updates: Partial<MetaCarouselCard>) => {
    const updated = [...cards];
    updated[index] = { ...updated[index], ...updates };
    onUpdate(updated);
  };

  const removeCard = (index: number) => onUpdate(cards.filter((_, i) => i !== index));
  const addCard = () => { if (cards.length < 10) onUpdate([...cards, makeCarouselCard(cards.length)]); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-foreground">Carousel Cards ({cards.length}/10)</Label>
        {cards.length < 10 && (
          <Button variant="outline" size="sm" onClick={addCard} className="h-7 gap-1 text-xs"><Plus className="size-3" /> Add Card</Button>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {cards.map((card, i) => (
          <div key={card.id} className="rounded-lg border border-border bg-muted/10 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GripVertical className="size-3 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-foreground">Card {i + 1}</span>
              </div>
              {cards.length > 2 && (
                <button type="button" onClick={() => removeCard(i)} className="rounded p-0.5 text-muted-foreground hover:text-destructive"><X className="size-3" /></button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-[100px_1fr]">
              <UploadZone accept="image/*,video/*" label="Media" sublabel="1:1 or 4:5" preview={card.imageUrl || undefined} onFile={(f) => handleCardMediaUpload(i, f)} onClear={() => updateCard(i, { imageUrl: "", file: undefined })} compact />
              <div className="flex flex-col gap-1.5">
                <div>
                  <Input value={card.headline || ""} onChange={(e) => updateCard(i, { headline: e.target.value })} placeholder="Card headline" className="h-7 text-xs" maxLength={limits.headline} />
                  <div className="mt-0.5 text-right"><CharCounter current={(card.headline || "").length} max={limits.headline} /></div>
                </div>
                <div>
                  <Input value={card.description || ""} onChange={(e) => updateCard(i, { description: e.target.value })} placeholder="Card description" className="h-7 text-xs" maxLength={limits.description} />
                  <div className="mt-0.5 text-right"><CharCounter current={(card.description || "").length} max={limits.description} /></div>
                </div>
                <Input value={card.link || ""} onChange={(e) => updateCard(i, { link: e.target.value })} placeholder="https://store.salla.sa/product/..." className="h-7 font-mono text-[10px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Maps to <code className="rounded bg-muted px-1">child_attachments[]</code> in object_story_spec.link_data. Min 2, max 10 cards.
      </p>
    </div>
  );
}

/* ================================================================== */
/*  Catalog Ads Section (unified DYNAMIC + COLLECTION)                 */
/*  ---                                                                */
/*  Simplified for Salla advertisers:                                  */
/*  - Catalog is already synced with Meta                              */
/*  - Salla has all product data (names, prices, images)               */
/*  - Smart defaults pre-fill everything                               */
/*  - Advanced settings collapsed by default                           */
/* ================================================================== */

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

function CatalogTemplateSection({
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

  const toggleData = (key: string) => setDataToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeOverlays = PRODUCT_DATA_OPTIONS.filter((d) => dataToggles[d.key]).length;
  const advancedChanges = (coverType !== "ADVANTAGE_CATALOG_VIDEO" ? 1 : 0)
    + (adaptToPlacement ? 1 : 0) + (!mediaTypeAuto ? 1 : 0) + (productExtensions ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Salla Sync Status Bar */}
      <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5">
        <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="size-4 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">Catalog synced with Meta</p>
          <p className="text-[10px] text-muted-foreground">Your Salla products are connected and ready. Meta will use product images, names, and prices directly from your catalog.</p>
        </div>
      </div>

      {/* 1. Product Set -- simple picker */}
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
                  selected ? "border-[#1877F2] bg-[#1877F2]/[0.04] shadow-sm" : "border-border hover:border-[#1877F2]/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className={cn("text-xs font-semibold", selected ? "text-[#1877F2]" : "text-foreground")}>{ps.label}</p>
                  {selected && <CheckCircle2 className="size-3.5 text-[#1877F2]" />}
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{ps.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Ad Message -- the only text field the user needs to write */}
      <div>
        <Label className="mb-2 block text-xs font-semibold text-foreground">
          Ad message
        </Label>
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

      {/* 3. Product Data to Show -- friendly toggles instead of raw template tags */}
      <div>
        <Label className="mb-2 block text-xs font-semibold text-foreground">
          Product info to display
        </Label>
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
                  active ? "border-[#1877F2] bg-[#1877F2]/[0.04]" : "border-border hover:border-[#1877F2]/30"
                )}
              >
                <div className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
                  active ? "bg-[#1877F2] text-white" : "bg-muted text-muted-foreground"
                )}>
                  {opt.icon}
                </div>
                <span className={cn("text-xs font-medium", active ? "text-[#1877F2]" : "text-foreground")}>{opt.label}</span>
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
          Fallback page. Users are directed to each product's page when available via Salla deep links.
        </p>
      </div>

      {/* 5. CTA */}
      <div>
        <Label className="mb-2 block text-xs font-semibold text-foreground">Button text</Label>
        <div className="flex flex-wrap gap-2">
          {CTA_OPTIONS.filter((c) => c.salesRelevant || c.value === "LEARN_MORE" || c.value === "SEND_MESSAGE").map((c) => {
            const selected = ad.callToAction === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onUpdate({ callToAction: c.value as MetaCTA })}
                className={cn(
                  "rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all",
                  selected ? "border-[#1877F2] bg-[#1877F2] text-white" : "border-border text-foreground hover:border-[#1877F2]/40"
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. How Meta shows your catalog -- visual explainer */}
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
            <p className="text-[9px] leading-relaxed text-muted-foreground">Swipeable product cards in Feed. Each card links to its product page on your store.</p>
          </div>
          <div className="rounded-lg bg-card p-3">
            <div className="mb-2 flex items-center gap-2">
              <LayoutGrid className="size-3.5 text-[#1877F2]" />
              <p className="text-[10px] font-semibold text-foreground">Collection</p>
            </div>
            <p className="text-[9px] leading-relaxed text-muted-foreground">Cover media + product grid. Opens a fullscreen shopping experience powered by your Salla catalog.</p>
          </div>
        </div>
      </div>

      {/* 7. Advanced Settings -- collapsed by default */}
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
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{advancedChanges} changed</Badge>
            )}
          </div>
          {showAdvanced ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
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
                      coverType === opt.value ? "border-[#1877F2] bg-[#1877F2]/[0.03]" : "border-border hover:border-[#1877F2]/30"
                    )}
                  >
                    <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", coverType === opt.value ? "bg-[#1877F2] text-white" : "bg-muted text-muted-foreground")}>
                      {opt.value === "ADVANTAGE_CATALOG_VIDEO" ? <Wand2 className="size-3.5" /> : opt.value === "CUSTOM_IMAGE" ? <ImageDown className="size-3.5" /> : <FileVideo className="size-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className={cn("text-[11px] font-medium", coverType === opt.value ? "text-[#1877F2]" : "text-foreground")}>{opt.label}</p>
                        {opt.isDefault && <Badge variant="outline" className="rounded-full px-1 py-0 text-[8px]">Default</Badge>}
                      </div>
                      <p className="text-[9px] text-muted-foreground">{opt.description}</p>
                    </div>
                    {coverType === opt.value && <CheckCircle2 className="size-3.5 text-[#1877F2]" />}
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

            {/* Advantage+ Creative Features -- simplified toggles */}
            <div>
              <Label className="mb-2 block text-xs font-semibold text-foreground">Advantage+ enhancements</Label>
              <div className="flex flex-col gap-2">
                {[
                  { key: "adaptToPlacement", label: "Reels & Stories optimization", desc: "Use 9:16 product images for vertical placements", icon: <Smartphone className="size-3.5" />, checked: adaptToPlacement, onChange: setAdaptToPlacement },
                  { key: "mediaTypeAuto", label: "Auto-use product videos", desc: "Show catalog videos when available", icon: <Video className="size-3.5" />, checked: mediaTypeAuto, onChange: setMediaTypeAuto },
                  { key: "textOverlay", label: "Price & discount overlays", desc: "Add price tags and sale badges on images", icon: <Percent className="size-3.5" />, checked: textOverlay, onChange: setTextOverlay },
                  { key: "productExtensions", label: "Product extensions", desc: "Show extra products below non-catalog ads", icon: <Package className="size-3.5" />, checked: productExtensions, onChange: setProductExtensions },
                ].map((f) => (
                  <div key={f.key} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
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
                Leave as default to use each product's name from your Salla catalog.
              </p>
            </div>

            {/* API Mapping Reference */}
            <div className="rounded-md border border-muted bg-muted/20 p-3">
              <p className="mb-2 text-[10px] font-semibold text-muted-foreground">API Field Mapping</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  ["Product Set", "product_set_id"],
                  ["Ad Message", "template_data.message"],
                  ["Product Name", "template_data.name"],
                  ["Landing Page", "template_data.link"],
                  ["CTA", "call_to_action.type"],
                  ["Format", "FORMAT_AUTOMATION"],
                  ["Cover Media", "asset_feed_spec"],
                  ["Overlays", "creative_features_spec"],
                ].map(([label, field]) => (
                  <div key={field} className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">{label}</span>
                    <code className="rounded bg-muted px-1 text-[8px] text-muted-foreground">{field}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tracking Section                                                   */
/* ================================================================== */

function AdTrackingSection({ ad, onUpdate }: { ad: MetaAd; onUpdate: (u: Partial<MetaAd>) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-muted/10">
      <button type="button" onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Tracking & UTM</span>
          <ApiBadge field="url_tags" />
        </div>
        {expanded ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="flex flex-col gap-3 border-t border-border px-3 pb-3 pt-2.5">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { key: "utmSource" as const, label: "utm_source", ph: "facebook" },
              { key: "utmMedium" as const, label: "utm_medium", ph: "paid" },
              { key: "utmCampaign" as const, label: "utm_campaign", ph: "sales_feb_2026" },
            ].map((f) => (
              <div key={f.key}>
                <Label className="mb-1 block text-[10px] text-muted-foreground">{f.label}</Label>
                <Input value={ad[f.key]} onChange={(e) => onUpdate({ [f.key]: e.target.value })} placeholder={f.ph} className="h-7 text-xs" />
              </div>
            ))}
          </div>
          <div>
            <Label className="mb-1 block text-[10px] text-muted-foreground">URL Parameters</Label>
            <Input value={ad.urlParameters} onChange={(e) => onUpdate({ urlParameters: e.target.value })} placeholder="key1=value1&key2=value2" className="h-7 font-mono text-[10px]" />
            <p className="mt-1 text-[10px] text-muted-foreground">Appended to landing page URL. Maps to <code className="rounded bg-muted px-1">url_tags</code>.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Advantage+ Creative Toggle (non-catalog)                           */
/* ================================================================== */

function AdvantagePlusCreativeSection() {
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-muted/10">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-[#1877F2]" />
          <span className="text-xs font-medium text-foreground">Advantage+ Creative</span>
          <ApiBadge field="degrees_of_freedom_spec" />
          <InfoTip text="Meta's AI automatically generates creative variations (brightness, contrast, aspect ratio, text placement) to optimize delivery per placement." />
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>
      {enabled && (
        <div className="border-t border-border px-3 pb-3 pt-2">
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            When enabled, Meta may automatically: adjust media brightness & contrast, apply different aspect ratio crops per placement,
            reposition text overlays, add subtle motion to static images. Maps to <code className="rounded bg-muted px-1">degrees_of_freedom_spec.creative_features_spec</code>.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {["Standard enhancements", "Brightness & contrast", "Aspect ratio variations", "Text optimization"].map((f) => (
              <div key={f} className="flex items-center gap-1.5 rounded-md bg-[#1877F2]/5 px-2 py-1">
                <CheckCircle2 className="size-3 text-[#1877F2]" />
                <span className="text-[10px] text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Conversion Location Section                                        */
/* ================================================================== */

const CONVERSION_LOCATIONS: {
  value: MetaConversionLocation;
  label: string;
  desc: string;
  icon: React.ReactNode;
  objectives: string[];
}[] = [
  {
    value: "WEBSITE",
    label: "Website",
    desc: "People complete actions on your Salla store",
    icon: <Monitor className="size-4" />,
    objectives: ["OUTCOME_SALES", "OUTCOME_TRAFFIC", "OUTCOME_LEADS"],
  },
  {
    value: "MESSAGING",
    label: "Messaging",
    desc: "Via Messenger, WhatsApp, or IG Direct",
    icon: <MessageSquare className="size-4" />,
    objectives: ["OUTCOME_SALES", "OUTCOME_ENGAGEMENT", "OUTCOME_LEADS"],
  },
  {
    value: "INSTANT_FORM",
    label: "Instant Forms",
    desc: "In-app lead forms on Meta",
    icon: <Store className="size-4" />,
    objectives: ["OUTCOME_LEADS"],
  },
  {
    value: "CALLS",
    label: "Calls",
    desc: "Phone call conversions",
    icon: <Smartphone className="size-4" />,
    objectives: ["OUTCOME_LEADS"],
  },
  {
    value: "APP",
    label: "App",
    desc: "In-app events and installs",
    icon: <Smartphone className="size-4" />,
    objectives: ["OUTCOME_APP_PROMOTION"],
  },
];

function ConversionLocationSection() {
  const { campaign, updateNested } = useMetaCampaign();
  const obj = campaign.objective;
  const objConfig = META_OBJECTIVE_CONFIGS[obj.objective] ?? META_OBJECTIVE_CONFIGS.OUTCOME_SALES;
  const availableLocations = CONVERSION_LOCATIONS.filter(
    (loc) => loc.objectives.includes(obj.objective) && objConfig.conversionLocations.includes(loc.value)
  );

  if (availableLocations.length <= 1) return null;

  return (
    <SectionCard>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1877F2]/10">
          <Globe className="size-4 text-[#1877F2]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold text-foreground">Conversion Location</Label>
            <ApiBadge field="promoted_object" />
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Where do you want people to complete the desired action? This determines your ad destination and which creative options are available.
          </p>
        </div>
      </div>
      <div className={cn("grid gap-3", availableLocations.length <= 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3")}>
        {availableLocations.map((loc) => {
          const selected = obj.conversionLocation === loc.value;
          return (
            <button
              key={loc.value}
              type="button"
              onClick={() => updateNested("objective", { conversionLocation: loc.value })}
              className={cn(
                "group flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                selected
                  ? "border-[#1877F2] bg-[#1877F2]/[0.04] shadow-sm"
                  : "border-border hover:border-[#1877F2]/40"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className={cn(
                  "flex size-8 items-center justify-center rounded-lg transition-colors",
                  selected ? "bg-[#1877F2] text-white" : "bg-muted text-muted-foreground group-hover:bg-[#1877F2]/10 group-hover:text-[#1877F2]"
                )}>
                  {loc.icon}
                </div>
                {selected && <CheckCircle2 className="size-4 text-[#1877F2]" />}
              </div>
              <p className={cn("text-xs font-semibold", selected ? "text-[#1877F2]" : "text-foreground")}>{loc.label}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{loc.desc}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-md border border-[#1877F2]/20 bg-[#1877F2]/5 px-3 py-2">
        <Info className="mt-0.5 size-3 shrink-0 text-[#1877F2]" />
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Maps to <code className="rounded bg-muted px-1">promoted_object.destination_type</code> in the Meta API. Changing this may affect available ad formats and placements.
        </p>
      </div>
    </SectionCard>
  );
}

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
    <SectionCard>
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
                {showManualDetails ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
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

          {/* Platform / preview link info */}
          <div className="flex items-start gap-2 rounded-md border border-[#1877F2]/20 bg-[#1877F2]/5 px-3 py-2">
            <Info className="mt-0.5 size-3 shrink-0 text-[#1877F2]" />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Your creative preview below automatically adapts to show how ads appear in each selected placement. Meta optimizes delivery across selected placements.
            </p>
          </div>
        </div>
      )}
    </SectionCard>
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
  const objConfig = META_OBJECTIVE_CONFIGS[objective.objective] ?? META_OBJECTIVE_CONFIGS.OUTCOME_SALES;

  const catalogEnabled = objective.catalogEnabled;

  const updateAds = (updatedAds: MetaAd[]) => updateNested("creative", { ads: updatedAds });

  const updateCurrentAd = (updates: Partial<MetaAd>) => {
    const updated = [...ads];
    updated[activeAdIndex] = { ...updated[activeAdIndex], ...updates };
    updateAds(updated);
  };

  const addAd = () => {
    const newAd = makeDefaultAd("SINGLE_IMAGE", ads.length);
    updateAds([...ads, newAd]);
    setActiveAdIndex(ads.length);
  };

  const removeAd = (index: number) => {
    const updated = ads.filter((_, i) => i !== index);
    updateAds(updated);
    if (activeAdIndex >= updated.length) setActiveAdIndex(Math.max(0, updated.length - 1));
  };

  const handleMediaUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const asset: MetaCreativeAsset = {
      id: `asset_${Date.now()}`,
      type: file.type.startsWith("video") ? "VIDEO" : "IMAGE",
      url,
      file,
    };
    const currentAd = ads[activeAdIndex];
    updateCurrentAd({ assets: [...(currentAd?.assets || []), asset] });
  };

  /* Auto-create first ad if none exists */
  if (ads.length === 0) {
    const firstAd = makeDefaultAd(catalogEnabled ? "DYNAMIC" : "SINGLE_IMAGE", 0);
    updateAds([firstAd]);
    return null;
  }

  const currentAd = ads[activeAdIndex];
  if (!currentAd) return null;

  const isDynamic = currentAd.adFormat === "DYNAMIC";
  const isCollection = currentAd.adFormat === "COLLECTION";
  const isCatalogFormat = isDynamic || isCollection;
  const isCarousel = currentAd.adFormat === "CAROUSEL";
  const formatLimits = FORMAT_TEXT_LIMITS[currentAd.adFormat] || FORMAT_TEXT_LIMITS.SINGLE_IMAGE;
  const formatConfig = AD_FORMAT_OPTIONS.find((f) => f.value === currentAd.adFormat);
  const supportedPlacements = formatConfig?.supportedPlacements || ["FACEBOOK_FEED"];

  const isValid = isCatalogFormat
    ? ads.every((ad) => ad.primaryText && ad.websiteUrl)
    : ads.every((ad) => ad.primaryText && ad.headline && ad.websiteUrl);

  /* Ensure preview placement is valid for current format */
  const activePlacement = supportedPlacements.includes(previewPlacement) ? previewPlacement : supportedPlacements[0];
  const activeSpec = PLACEMENT_SPECS[activePlacement];
  const isReelsOrStory = activePlacement.includes("REELS") || activePlacement.includes("STORY");

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>
        {/* ============================================================ */}
        {/* LEFT COLUMN -- Edit Pane                                      */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">
          {/* Catalog mode banner */}
          {catalogEnabled && (
            <div className="flex items-start gap-3 rounded-xl border border-[#1877F2]/30 bg-[#1877F2]/[0.03] px-4 py-3">
              <ShoppingBag className="mt-0.5 size-5 shrink-0 text-[#1877F2]" />
              <div>
                <p className="text-sm font-semibold text-foreground">Catalog Connected</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Your Salla product catalog is active. You can use <span className="font-medium text-foreground">Advantage+ Catalog</span> to auto-generate ads from your products,
                  or create manual ads with Single Image, Video, or Carousel formats. Catalog ads use <code className="rounded bg-muted px-1">template_data</code> + <code className="rounded bg-muted px-1">product_set_id</code> instead of static creatives.
                </p>
              </div>
            </div>
          )}

          {/* Ad tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {ads.map((ad, i) => (
              <div
                key={ad.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveAdIndex(i)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveAdIndex(i); } }}
                className={cn(
                  "flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  i === activeAdIndex ? "border-[#1877F2] bg-[#1877F2]/5 text-[#1877F2]" : "border-border text-foreground hover:border-[#1877F2]/30"
                )}
              >
                {ad.name}
                {isCatalogFormat && <Database className="size-3 text-muted-foreground" />}
                {ads.length > 1 && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeAd(i); }} className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <X className="size-3" />
                  </button>
                )}
              </div>
            ))}
            {ads.length < 6 && (
              <button type="button" onClick={addAd} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-[#1877F2]/40 hover:text-foreground">
                <Plus className="size-3.5" /> Add Ad
              </button>
            )}
          </div>

          {/* ---- 0a. Conversion Location ---- */}
          <ConversionLocationSection />

          {/* ---- 0b. Placement Configuration ---- */}
          <PlacementSection />

          {/* ---- 1. Ad Format ---- */}
          <SectionCard>
            <div className="mb-4 flex items-center gap-2">
              <Layers className="size-4 text-[#1877F2]" />
              <Label className="text-sm font-semibold text-foreground">Ad Format</Label>
              <InfoTip text="Choose how your ad looks. Catalog Ads uses your synced Salla products. Other formats require you to upload your own media." />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {/* Merge COLLECTION + DYNAMIC into one "Catalog Ads" option */}
              {AD_FORMAT_OPTIONS
                .filter((f) => objConfig.allowedAdFormats.includes(f.value))
                .filter((f) => f.value !== "COLLECTION") // hide separate Collection; merged into Catalog Ads (DYNAMIC)
                .map((fmt) => {
                const selected = fmt.value === "DYNAMIC"
                  ? (currentAd.adFormat === "DYNAMIC" || currentAd.adFormat === "COLLECTION")
                  : currentAd.adFormat === fmt.value;
                const isCatalogRequired = fmt.value === "DYNAMIC";
                const disabled = isCatalogRequired && !catalogEnabled;
                const isCatalog = fmt.value === "DYNAMIC";

                // Override label/desc for the merged catalog format
                const displayLabel = isCatalog ? "Catalog Ads" : fmt.label;
                const displayDesc = isCatalog
                  ? "Auto-generated from your Salla products. Meta picks the best format per viewer."
                  : fmt.desc;

                return (
                  <button
                    key={fmt.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      const updates: Partial<MetaAd> = { adFormat: fmt.value };
                      if (fmt.value === "CAROUSEL" && currentAd.carouselCards.length < 2) {
                        updates.carouselCards = [makeCarouselCard(0), makeCarouselCard(1)];
                      }
                      updateCurrentAd(updates);
                    }}
                    className={cn(
                      "group flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                      disabled ? "cursor-not-allowed border-border bg-muted/30 opacity-50"
                        : selected ? "border-[#1877F2] bg-[#1877F2]/[0.04] shadow-sm"
                        : "border-border hover:border-[#1877F2]/40"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className={cn("flex size-9 items-center justify-center rounded-lg transition-colors", disabled ? "bg-muted text-muted-foreground/50" : selected ? "bg-[#1877F2] text-white" : "bg-muted text-muted-foreground group-hover:bg-[#1877F2]/10 group-hover:text-[#1877F2]")}>
                        {FORMAT_ICONS[fmt.value]}
                      </div>
                      {selected && !disabled && <CheckCircle2 className="size-4 text-[#1877F2]" />}
                    </div>
                    <p className={cn("text-xs font-semibold", disabled ? "text-muted-foreground/60" : selected ? "text-[#1877F2]" : "text-foreground")}>{displayLabel}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{displayDesc}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {isCatalog ? (
                        <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[8px]">All placements</Badge>
                      ) : fmt.supportedPlacements.length === 6 ? (
                        <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[8px]">All placements</Badge>
                      ) : (
                        fmt.supportedPlacements.slice(0, 3).map((p) => (
                          <Badge key={p} variant="outline" className="rounded-full px-1 py-0 text-[7px]">{PLACEMENT_SPECS[p].label.replace("Facebook ", "FB ").replace("Instagram ", "IG ")}</Badge>
                        ))
                      )}
                    </div>
                    {disabled && <Badge variant="outline" className="mt-2 w-fit rounded-full px-1.5 py-0 text-[9px] text-muted-foreground">Requires catalog</Badge>}
                    {!disabled && (fmt.recommended || isCatalog) && catalogEnabled && (
                      <Badge className="mt-1 w-fit rounded-full bg-[#1877F2] px-1.5 py-0 text-[9px] text-white">
                        {isCatalog ? "Recommended for Sales" : "Recommended"}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* ---- Catalog Ads Section (unified, simplified) ---- */}
          {isCatalogFormat ? (
            <SectionCard>
              <div className="mb-4 flex items-center gap-2">
                <ShoppingBag className="size-4 text-[#1877F2]" />
                <Label className="text-sm font-semibold text-foreground">Catalog Ad Setup</Label>
                <InfoTip text="Configure how your Salla products appear in ads. Meta automatically picks the best format (Carousel or Collection) per viewer." />
              </div>
              <CatalogTemplateSection ad={currentAd} onUpdate={updateCurrentAd} />
            </SectionCard>
          ) : (
            <>
              {/* ---- 2. Creative Media (non-catalog) ---- */}
              <SectionCard>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="size-4 text-[#1877F2]" />
                    <Label className="text-sm font-semibold text-foreground">Creative Media</Label>
                    <ApiBadge field={currentAd.adFormat === "SINGLE_VIDEO" ? "video_data.video_id" : "link_data.image_hash"} />
                  </div>
                </div>

                {/* Media requirements */}
                <div className="mb-4 rounded-lg border border-border bg-muted/20 p-3">
                  <p className="mb-2 text-[11px] font-semibold text-foreground">Media Requirements (per Meta Business Help Center)</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {currentAd.adFormat === "SINGLE_VIDEO" ? (
                      <>
                        <div className="flex items-start gap-2"><Video className="mt-0.5 size-3 shrink-0 text-[#1877F2]" /><div><p className="text-[10px] font-medium text-foreground">Feed: 1:1 or 4:5</p><p className="text-[9px] text-muted-foreground">1440x1440 or 1440x1800 px</p></div></div>
                        <div className="flex items-start gap-2"><Smartphone className="mt-0.5 size-3 shrink-0 text-[#1877F2]" /><div><p className="text-[10px] font-medium text-foreground">Reels/Stories: 9:16</p><p className="text-[9px] text-muted-foreground">1080x1920 px recommended</p></div></div>
                        <div className="flex items-start gap-2"><Monitor className="mt-0.5 size-3 shrink-0 text-[#1877F2]" /><div><p className="text-[10px] font-medium text-foreground">Duration: 1 sec -- 241 min</p><p className="text-[9px] text-muted-foreground">Reels: max 90 sec recommended</p></div></div>
                        <div className="flex items-start gap-2"><Upload className="mt-0.5 size-3 shrink-0 text-[#1877F2]" /><div><p className="text-[10px] font-medium text-foreground">Max 4 GB -- MP4, MOV, GIF</p><p className="text-[9px] text-muted-foreground">H.264, AAC audio 128kbps+</p></div></div>
                      </>
                    ) : isCarousel ? (
                      <>
                        <div className="flex items-start gap-2"><ImageIcon className="mt-0.5 size-3 shrink-0 text-[#1877F2]" /><div><p className="text-[10px] font-medium text-foreground">1:1 or 4:5 per card</p><p className="text-[9px] text-muted-foreground">Min 1080x1080 px</p></div></div>
                        <div className="flex items-start gap-2"><Film className="mt-0.5 size-3 shrink-0 text-[#1877F2]" /><div><p className="text-[10px] font-medium text-foreground">2--10 cards</p><p className="text-[9px] text-muted-foreground">Image/video per card</p></div></div>
                        <div className="flex items-start gap-2"><Upload className="mt-0.5 size-3 shrink-0 text-[#1877F2]" /><div><p className="text-[10px] font-medium text-foreground">Image: 30 MB | Video: 4 GB</p><p className="text-[9px] text-muted-foreground">JPG, PNG, MP4, MOV, GIF</p></div></div>
                        <div className="flex items-start gap-2"><Monitor className="mt-0.5 size-3 shrink-0 text-[#1877F2]" /><div><p className="text-[10px] font-medium text-foreground">Video: 1 sec -- 240 min</p><p className="text-[9px] text-muted-foreground">Aspect ratio tolerance: 3%</p></div></div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-2"><ImageIcon className="mt-0.5 size-3 shrink-0 text-[#1877F2]" /><div><p className="text-[10px] font-medium text-foreground">Feed: 1:1 or 4:5</p><p className="text-[9px] text-muted-foreground">1:1 = 1440x1440 | 4:5 = 1440x1800 px</p></div></div>
                        <div className="flex items-start gap-2"><Smartphone className="mt-0.5 size-3 shrink-0 text-[#1877F2]" /><div><p className="text-[10px] font-medium text-foreground">Reels/Stories: 9:16</p><p className="text-[9px] text-muted-foreground">1080x1920 px recommended</p></div></div>
                        <div className="flex items-start gap-2"><Upload className="mt-0.5 size-3 shrink-0 text-[#1877F2]" /><div><p className="text-[10px] font-medium text-foreground">Max 30 MB -- JPG, PNG</p><p className="text-[9px] text-muted-foreground">Min width: 600 px</p></div></div>
                        <div className="flex items-start gap-2"><Eye className="mt-0.5 size-3 shrink-0 text-[#1877F2]" /><div><p className="text-[10px] font-medium text-foreground">Aspect ratio tolerance: 3%</p><p className="text-[9px] text-muted-foreground">High resolution recommended</p></div></div>
                      </>
                    )}
                  </div>
                </div>

                {isCarousel ? (
                  <CarouselCardEditor cards={currentAd.carouselCards} onUpdate={(cards) => updateCurrentAd({ carouselCards: cards })} />
                ) : (
                  <>
                    {currentAd.assets.length > 0 && (
                      <div className="mb-4 grid grid-cols-3 gap-2">
                        {currentAd.assets.map((asset, i) => (
                          <div key={asset.id} className="group relative overflow-hidden rounded-lg border border-border">
                            {asset.type === "VIDEO" ? (
                              <video src={asset.url} muted className="aspect-square w-full object-cover" />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={asset.url} alt={`Asset ${i + 1}`} className="aspect-square w-full object-cover" crossOrigin="anonymous" />
                            )}
                            <div className="absolute left-1 top-1"><Badge className="rounded px-1 py-0 text-[8px]">{asset.type}</Badge></div>
                            <button type="button" onClick={() => updateCurrentAd({ assets: currentAd.assets.filter((_, j) => j !== i) })} className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"><Trash2 className="size-3 text-destructive" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <UploadZone
                      accept={currentAd.adFormat === "SINGLE_VIDEO" ? "video/mp4,video/quicktime,image/gif" : "image/jpeg,image/png"}
                      label={currentAd.adFormat === "SINGLE_VIDEO" ? "Upload Video" : "Upload Image"}
                      sublabel={currentAd.adFormat === "SINGLE_VIDEO" ? "MP4, MOV, GIF -- Max 4 GB" : "JPG, PNG -- Max 30 MB"}
                      onFile={handleMediaUpload}
                      libraryContext={currentAd.adFormat === "SINGLE_VIDEO" ? "VIDEO" : "IMAGE"}
                      multiSelect
                    />
                    {currentAd.adFormat === "SINGLE_VIDEO" && (
                      <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                        <Volume2 className="mt-0.5 size-3 shrink-0 text-amber-600" />
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground">Reels Best Practice:</span> Upload 9:16 vertical video for Reels & Stories. Keep bottom 35% free of text/logos. Sound on strongly recommended.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </SectionCard>

              {/* ---- 3. Ad Copy (non-catalog) ---- */}
              <SectionCard>
                <div className="mb-4 flex items-center gap-2">
                  <Tag className="size-4 text-[#1877F2]" />
                  <Label className="text-sm font-semibold text-foreground">Ad Copy</Label>
                  <InfoTip text="Text fields map to object_story_spec.link_data: message (primary text), name (headline), description (link description). Limits vary by format." />
                </div>
                <div className="mb-4 rounded-md border border-[#1877F2]/15 bg-[#1877F2]/5 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-medium text-foreground">{AD_FORMAT_OPTIONS.find((f) => f.value === currentAd.adFormat)?.label || "Single Image"} text limits:</span>{" "}
                    Primary {formatLimits.primaryMin}--{formatLimits.primaryMax} chars | Headline {formatLimits.headline} chars
                    {formatLimits.description > 0 && ` | Description ${formatLimits.description} chars`}
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <Label className="flex items-center gap-1 text-xs font-medium text-foreground">Primary Text <ApiBadge field="message" /></Label>
                      <CharCounter current={currentAd.primaryText.length} min={formatLimits.primaryMin} max={formatLimits.primaryMax} />
                    </div>
                    <Textarea value={currentAd.primaryText} onChange={(e) => updateCurrentAd({ primaryText: e.target.value })} placeholder="Write your main ad text..." rows={3} className="resize-none text-sm" />
                    <p className="mt-1 text-[10px] text-muted-foreground">Recommended: {formatLimits.primaryMin}--{formatLimits.primaryMax} chars. Not shown on Reels/Stories.</p>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <Label className="flex items-center gap-1 text-xs font-medium text-foreground">Headline <ApiBadge field="name" /></Label>
                      <CharCounter current={currentAd.headline.length} max={formatLimits.headline} />
                    </div>
                    <Input value={currentAd.headline} onChange={(e) => updateCurrentAd({ headline: e.target.value })} placeholder="Short, attention-grabbing headline" className="text-sm" />
                    <p className="mt-1 text-[10px] text-muted-foreground">{formatLimits.headlineNote}. Max {formatLimits.headline} chars. Not shown on Reels/Stories.</p>
                  </div>
                  {formatLimits.description > 0 && (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <Label className="flex items-center gap-1 text-xs font-medium text-foreground">Link Description <ApiBadge field="description" /></Label>
                        <CharCounter current={currentAd.description.length} max={formatLimits.description} />
                      </div>
                      <Input value={currentAd.description} onChange={(e) => updateCurrentAd({ description: e.target.value })} placeholder="Optional supporting text" className="text-sm" />
                      <p className="mt-1 text-[10px] text-muted-foreground">Desktop only. Max {formatLimits.description} chars.</p>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* ---- 4. Destination & CTA (non-catalog) ---- */}
              <SectionCard>
                <div className="mb-4 flex items-center gap-2">
                  <Link2 className="size-4 text-[#1877F2]" />
                  <Label className="text-sm font-semibold text-foreground">Destination & Call-to-Action</Label>
                  <InfoTip text="Maps to link (website_url), caption (display_url), and call_to_action.type on the ad creative." />
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-foreground">Website URL <ApiBadge field="link" /> <span className="text-destructive">*</span></Label>
                    <Input value={currentAd.websiteUrl} onChange={(e) => updateCurrentAd({ websiteUrl: e.target.value })} placeholder="https://store.salla.sa/product/..." className="font-mono text-sm" />
                  </div>
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-foreground">Display Link <ApiBadge field="caption" /></Label>
                    <Input value={currentAd.displayLink} onChange={(e) => updateCurrentAd({ displayLink: e.target.value })} placeholder="store.salla.sa" className="text-sm" />
                    <p className="mt-1 text-[10px] text-muted-foreground">Optional shortened URL shown in footer. Derived from website URL if blank.</p>
                  </div>
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-foreground">Call to Action <ApiBadge field="call_to_action.type" /></Label>
                    <Select value={currentAd.callToAction} onValueChange={(v) => updateCurrentAd({ callToAction: v as MetaCTA })}>
                      <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CTA_OPTIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            <div className="flex items-center gap-2">
                              {c.label}
                              {c.salesRelevant && <Badge className="rounded-full bg-emerald-500/10 px-1 py-0 text-[8px] text-emerald-600">Sales</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-[10px] text-muted-foreground">For OUTCOME_SALES: SHOP_NOW, ORDER_NOW, GET_OFFER recommended.</p>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ---- 5. Advantage+ Creative (non-catalog only -- catalog has its own creative_features_spec) ---- */}
          {!isCatalogFormat && <AdvantagePlusCreativeSection />}

          {/* ---- 6. Tracking ---- */}
          <AdTrackingSection ad={currentAd} onUpdate={updateCurrentAd} />
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN -- Live Preview + Specs                          */}
        {/* ============================================================ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="sticky top-20 flex flex-col gap-4">
            {/* Placement preview selector */}
            <SectionCard className="p-3">
              <Label className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Preview Placement</Label>
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
                          ? spec.platform === "instagram" ? "border-[#E4405F] bg-[#E4405F]/5" : "border-[#1877F2] bg-[#1877F2]/5"
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

            {/* Preview */}
            {isReelsOrStory ? (
              <ReelsStoriesPreview ad={currentAd} placement={activePlacement} pageName={objective.facebookPageName} accountName={objective.instagramAccountName || objective.facebookPageName} isCatalog={isCatalogFormat} />
            ) : activePlacement === "INSTAGRAM_FEED" ? (
              <InstagramFeedPreview ad={currentAd} accountName={objective.instagramAccountName || objective.facebookPageName} isCatalog={isCatalogFormat} />
            ) : (
              <FacebookFeedPreview ad={currentAd} pageName={objective.facebookPageName} isCatalog={isCatalogFormat} />
            )}

            {/* Catalog API Summary (shown for DYNAMIC/COLLECTION) */}
            {isCatalogFormat && (
              <SectionCard className="p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <Database className="size-3.5 text-[#1877F2]" />
                  <Label className="text-xs font-semibold text-foreground">Catalog API Mapping</Label>
                </div>
                <div className="flex flex-col gap-1.5 text-[10px]">
                  {[
                    { label: "Product Set", field: "product_set_id", status: "Required" },
                    { label: "Template Data", field: "object_story_spec.template_data", status: "Required" },
                    { label: "Format Automation", field: "asset_feed_spec.optimization_type", status: "FORMAT_AUTOMATION" },
                    { label: "Ad Formats", field: "asset_feed_spec.ad_formats", status: "[CAROUSEL, COLLECTION]" },
                    { label: "Descriptions", field: "asset_feed_spec.descriptions", status: "Up to 3" },
                    { label: "Creative Features", field: "degrees_of_freedom_spec", status: "Optional" },
                    { label: "Tracking Specs", field: "tracking_specs", status: "fb_pixel" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-2">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="text-right font-mono font-medium text-foreground">{row.status}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Placement-specific Specs */}
            <SectionCard className="p-4">
              <div className="mb-2.5 flex items-center gap-2">
                <Monitor className="size-3.5 text-[#1877F2]" />
                <Label className="text-xs font-semibold text-foreground">{activeSpec.label} Specs</Label>
                <ApiBadge field={activeSpec.apiFormat.split(" / ")[0]} />
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Aspect Ratio", value: activeSpec.aspectRatio },
                  { label: "Resolution", value: activeSpec.resolution },
                  { label: "Image Max", value: activeSpec.imageMax },
                  { label: "Video Max", value: activeSpec.videoMax },
                  { label: "Video Duration", value: activeSpec.videoDuration },
                  { label: "Image Formats", value: activeSpec.imageFormats },
                  { label: "Video Formats", value: activeSpec.videoFormats },
                  { label: "Primary Text", value: activeSpec.primaryText },
                  { label: "Headline", value: activeSpec.headline },
                ].map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-2">
                    <span className="shrink-0 text-[10px] text-muted-foreground">{row.label}</span>
                    <span className="text-right text-[10px] font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
              {activeSpec.notes.length > 0 && (
                <div className="mt-2.5 border-t border-border pt-2">
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
                  {activeSpec.notes.map((note) => (
                    <div key={note} className="flex items-start gap-1.5 py-0.5">
                      <div className="mt-1 size-1 shrink-0 rounded-full bg-[#1877F2]" />
                      <span className="text-[10px] leading-relaxed text-muted-foreground">{note}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Ad Delivery Summary */}
            <SectionCard className="p-4">
              <div className="mb-2.5 flex items-center gap-2">
                <Globe className="size-3.5 text-[#1877F2]" />
                <Label className="text-xs font-semibold text-foreground">Ad Delivery</Label>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Conversion</span>
                  <span className="font-medium text-foreground">{campaign.objective.conversionLocation.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Placements</span>
                  <span className="font-medium text-foreground">
                    {campaign.objective.placementMode === "AUTOMATIC"
                      ? "Advantage+ (Auto)"
                      : `Manual (${campaign.objective.facebookPositions.length + campaign.objective.instagramPositions.length})`}
                  </span>
                </div>
                {campaign.objective.placementMode === "MANUAL" && (
                  <div className="flex flex-wrap gap-1">
                    {campaign.objective.publisherPlatforms.map((p) => (
                      <Badge key={p} variant="outline" className="rounded-full px-1.5 py-0 text-[8px]">
                        {p === "facebook" ? "FB" : p === "instagram" ? "IG" : p === "audience_network" ? "AN" : "Msg"}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Creative Checklist */}
            <SectionCard className="p-4">
              <div className="mb-2.5 flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-[#1877F2]" />
                <Label className="text-xs font-semibold text-foreground">Creative Checklist</Label>
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  ...(isCatalogFormat
                    ? [
                        { label: "Conversion location set", done: !!campaign.objective.conversionLocation },
                        { label: "Placements configured", done: campaign.objective.placementMode === "AUTOMATIC" || (campaign.objective.facebookPositions.length + campaign.objective.instagramPositions.length) > 0 },
                        { label: "Product set selected", done: true },
                        { label: "Landing page URL set", done: currentAd.websiteUrl.length > 0 },
                        { label: "Ad message written", done: currentAd.primaryText.length > 0 },
                        { label: "CTA selected", done: currentAd.callToAction !== "NO_BUTTON" },
                        { label: "Product info configured", done: true },
                      ]
                    : [
                        { label: "Conversion location set", done: !!campaign.objective.conversionLocation },
                        { label: "Placements configured", done: campaign.objective.placementMode === "AUTOMATIC" || (campaign.objective.facebookPositions.length + campaign.objective.instagramPositions.length) > 0 },
                        { label: "Media uploaded", done: isCarousel ? currentAd.carouselCards.some((c) => !!c.imageUrl) : currentAd.assets.length > 0 },
                        { label: `Primary text (${formatLimits.primaryMin}--${formatLimits.primaryMax} chars)`, done: currentAd.primaryText.length >= formatLimits.primaryMin },
                        { label: `Headline (max ${formatLimits.headline} chars)`, done: currentAd.headline.length > 0 && currentAd.headline.length <= formatLimits.headline },
                        { label: "Website URL set", done: currentAd.websiteUrl.length > 0 },
                        { label: "CTA selected", done: currentAd.callToAction !== "NO_BUTTON" },
                        ...(isCarousel ? [{ label: "Min 2 carousel cards", done: currentAd.carouselCards.length >= 2 }] : []),
                        ...(currentAd.adFormat === "SINGLE_VIDEO" ? [{ label: "9:16 video for Reels (recommended)", done: currentAd.assets.some((a) => a.type === "VIDEO") }] : []),
                      ]
                  ),
                ].map((check) => (
                  <div key={check.label} className="flex items-center gap-2">
                    {check.done ? <CheckCircle2 className="size-3 shrink-0 text-emerald-500" /> : <AlertCircle className="size-3 shrink-0 text-amber-500" />}
                    <span className={cn("text-[11px]", check.done ? "text-muted-foreground" : "text-amber-700 dark:text-amber-400")}>{check.label}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Salla Tip */}
            <div className="flex items-start gap-2 rounded-lg border border-[#1877F2]/20 bg-[#1877F2]/5 px-3 py-2.5">
              <Zap className="mt-0.5 size-3.5 shrink-0 text-[#1877F2]" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Salla Tip:</span>{" "}
                {isCatalogFormat
                  ? "Catalog Ads automatically show your best Salla products to each viewer. Meta picks the format (Carousel or Collection) that drives the most purchases. Check Advanced settings to enable video and Reels optimization."
                  : "Upload both 1:1 (Feed) and 9:16 (Reels/Stories) versions of your creative. Meta will auto-select the best aspect ratio per placement. For best Reels results, add audio and keep key content outside the bottom 35% safe zone."}
              </p>
            </div>
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
