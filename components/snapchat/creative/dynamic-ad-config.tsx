"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { fetchProductSets, type ProductSetCategory } from "@/lib/salla/product-sets";
import { type SallaProductSet } from "@/lib/salla/store-api";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  ShoppingBag,
  Package,
  Tag,
  X,
  Check,
  Eye,
  Search,
  TrendingUp,
  Sparkles,
  CalendarDays,
  Layers,
  RefreshCw,
  ArrowRight,
  ImageIcon,
} from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import {
  type AdGroup,
  type DynamicTemplateConfig,
  makeDefaultDynamicTemplate,
} from "@/lib/snapchat/campaign-types";

/* ------------------------------------------------------------------ */
/*  Filter tab config                                                  */
/* ------------------------------------------------------------------ */

const SET_CATEGORIES: {
  value: ProductSetCategory | "all";
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "all", label: "All", icon: <Layers className="size-3" /> },
  { value: "standard", label: "Smart", icon: <TrendingUp className="size-3" /> },
  { value: "category", label: "Category", icon: <Tag className="size-3" /> },
  { value: "seasonal", label: "Seasonal", icon: <CalendarDays className="size-3" /> },
];

const SEASONAL_COLORS: Record<string, string> = {
  ramadan: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
  eid_fitr: "bg-violet-500/15 text-violet-700 border-violet-200",
  eid_adha: "bg-amber-500/15 text-amber-700 border-amber-200",
  national_day: "bg-green-600/15 text-green-700 border-green-200",
  white_friday: "bg-red-500/15 text-red-700 border-red-200",
  year_end: "bg-blue-500/15 text-blue-700 border-blue-200",
  back_to_school: "bg-orange-500/15 text-orange-700 border-orange-200",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DynamicAdConfig({
  ad,
  onUpdate,
  catalogStory = false,
}: {
  ad: AdGroup;
  onUpdate: (next: AdGroup) => void;
  /** When true, renders in catalog story mode with story-specific messaging */
  catalogStory?: boolean;
}) {
  const config = ad.dynamicTemplateConfig ?? makeDefaultDynamicTemplate();
  const [showSetPicker, setShowSetPicker] = useState(false);
  const [productSets, setProductSets] = useState<SallaProductSet[]>([]);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<ProductSetCategory | "all">("all");

  useEffect(() => {
    fetchProductSets("all").then(setProductSets);
  }, []);

  const updateConfig = (partial: Partial<DynamicTemplateConfig>) => {
    onUpdate({
      ...ad,
      dynamicTemplateConfig: { ...config, ...partial },
    });
  };

  const selectedSet = productSets.find((s) => s.id === config.productSetId);

  const filteredSets = useMemo(() => {
    let list = productSets;
    if (filterTab !== "all") {
      list = list.filter((s) => {
        if (filterTab === "seasonal") return !!s.seasonalTag;
        if (filterTab === "category") return s.id.startsWith("ps_cat_");
        return !s.seasonalTag && !s.id.startsWith("ps_cat_");
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.nameAr ?? "").includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [productSets, filterTab, search]);

  const openPicker = () => {
    setSearch("");
    setFilterTab("all");
    setShowSetPicker(true);
  };

  return (
    <div className="flex flex-col gap-4">

      {/* ── Info Banner ── */}
      <div className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        catalogStory
          ? "border-blue-200 bg-blue-50/80"
          : "border-amber-200 bg-amber-50/80"
      )}>
        <div className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          catalogStory ? "bg-blue-100" : "bg-amber-100"
        )}>
          {catalogStory
            ? <Layers className="size-4 text-blue-600" />
            : <Zap className="size-4 text-amber-600" />
          }
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">
            {catalogStory ? "Catalog Story Ad" : "Dynamic Product Ad"}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {catalogStory
              ? "Snapchat creates a multi-snap story from your catalog. Each snap showcases a product — users swipe through the story in Discover. Select a product set below."
              : "Snapchat auto-generates ads from your catalog based on user behavior. No creative upload needed — images, prices, and descriptions are pulled directly from your products."
            }
          </p>
        </div>
      </div>

      {/* ── Product Set Selection ── */}
      <div>
        <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <ShoppingBag className="size-3.5" />
          Product Set
          <InfoTip text="Choose which products to advertise. Smart sets auto-refresh, seasonal sets are curated for specific events." />
        </Label>

        {config.productSetId && selectedSet ? (
          <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-colors">
            {/* Preview images strip */}
            {selectedSet.previewImages && selectedSet.previewImages.length > 0 && (
              <div className="grid grid-cols-4 gap-px bg-border">
                {selectedSet.previewImages.slice(0, 4).map((img, i) => (
                  <div key={i} className="aspect-[4/3] overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt=""
                      className="size-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                ))}
                {selectedSet.previewImages.length < 4 &&
                  Array.from({ length: 4 - selectedSet.previewImages.length }).map((_, i) => (
                    <div key={`ph-${i}`} className="flex aspect-[4/3] items-center justify-center bg-muted/40">
                      <ImageIcon className="size-4 text-muted-foreground/20" />
                    </div>
                  ))
                }
              </div>
            )}

            <div className="flex items-center gap-3 border-t border-[#a4ffe5]/50 bg-[#e6fff9]/60 px-4 py-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#004956] text-white">
                <Package className="size-4.5" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[#004956]">{config.productSetName}</span>
                  {selectedSet.autoRefresh && (
                    <RefreshCw className="size-3 text-emerald-500" />
                  )}
                  {selectedSet.seasonalTag && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-1.5 py-0 text-[9px] font-medium capitalize",
                        SEASONAL_COLORS[selectedSet.seasonalTag] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {selectedSet.seasonalTag.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-[#004956]/60">
                  {selectedSet.productCount} products {selectedSet.autoRefresh ? "· Auto-refreshing" : ""}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={openPicker}
                className="h-8 gap-1.5 rounded-full border-[#004956]/20 bg-white px-4 text-xs font-medium text-[#004956] hover:bg-[#004956]/5"
              >
                Change
              </Button>
              <button
                type="button"
                onClick={() => updateConfig({ productSetId: "", productSetName: "" })}
                className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            className="group flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-5 text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/[0.02] hover:text-foreground"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-muted/60 transition-colors group-hover:bg-primary/10">
              <Package className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <span className="text-xs font-medium">Select a Product Set</span>
            <span className="text-[10px] text-muted-foreground">Choose products from your catalog for dynamic ads</span>
          </button>
        )}
      </div>

      {/* ── Template Options ── */}
      <div>
        <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Tag className="size-3.5" />
          Template Options
          <InfoTip text="Control what product info appears on each generated ad creative." />
        </Label>
        <div className="divide-y divide-border rounded-xl border border-border">
          {/* Show Price */}
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-foreground">Show product price</span>
              <span className="text-[11px] text-muted-foreground">Display the product price on each ad</span>
            </div>
            <Switch checked={config.showPrice} onCheckedChange={(v) => updateConfig({ showPrice: v })} />
          </div>
          {/* Show Sale Badge */}
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-foreground">Show sale badge</span>
              <span className="text-[11px] text-muted-foreground">Highlight discounted products with a sale tag</span>
            </div>
            <Switch checked={config.showSaleBadge} onCheckedChange={(v) => updateConfig({ showSaleBadge: v })} />
          </div>
          {/* Caption Mode */}
          <div className="px-3 py-2.5">
            <div className="mb-1.5 flex flex-col">
              <span className="text-[13px] font-medium text-foreground">Caption text</span>
              <span className="text-[11px] text-muted-foreground">What text appears below each product image</span>
            </div>
            <Select
              value={config.captionMode}
              onValueChange={(v) =>
                updateConfig({ captionMode: v as DynamicTemplateConfig["captionMode"] })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product_name">Product name only</SelectItem>
                <SelectItem value="product_name_price">Product name + price</SelectItem>
                <SelectItem value="product_description">Product description</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Preview note */}
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Eye className="size-3" />
        Preview updates live in the phone mockup
      </p>

      {/* ═══════════ Product Set Picker Sheet ═══════════ */}
      <Sheet open={showSetPicker} onOpenChange={setShowSetPicker}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]">

          {/* ── Branded header (matches Snapchat sheet style) ── */}
          <div className="bg-[#004956] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <ShoppingBag className="size-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-white">Select Product Set</SheetTitle>
                <p className="mt-0.5 text-xs text-white/70">
                  Choose which products Snapchat will use to generate dynamic ads.
                </p>
              </div>
            </div>
          </div>

          {/* ── Search + Filter ── */}
          <div className="flex flex-col gap-3 border-b border-border bg-white px-4 py-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search product sets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 rounded-full border-border bg-muted/40 pl-9 text-xs focus-visible:ring-[#a4ffe5]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {SET_CATEGORIES.map((cat) => {
                const count =
                  cat.value === "all" ? productSets.length
                  : cat.value === "seasonal" ? productSets.filter((s) => !!s.seasonalTag).length
                  : cat.value === "category" ? productSets.filter((s) => s.id.startsWith("ps_cat_")).length
                  : productSets.filter((s) => !s.seasonalTag && !s.id.startsWith("ps_cat_")).length;
                const active = filterTab === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFilterTab(cat.value)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all",
                      active
                        ? "bg-[#a4ffe5] text-[#004956] shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {cat.icon}
                    {cat.label}
                    <span className={cn("tabular-nums text-[10px]", active ? "text-[#004956]/70" : "text-muted-foreground/60")}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Product Set List ── */}
          <div className="flex-1 overflow-y-auto bg-[#f8f8f8] px-4 py-3">
            {filteredSets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted/60">
                  <Search className="size-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">No matching sets</p>
                <p className="mt-0.5 text-xs text-muted-foreground/60">Try a different search or filter</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Tip banner */}
                {!config.productSetId && filterTab === "all" && !search && (
                  <div className="mb-1 flex items-start gap-2.5 rounded-xl border border-[#a4ffe5] bg-[#e6fff9] px-3 py-2.5">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                    <p className="text-[11px] font-medium leading-relaxed text-[#004956]">
                      Start with <span className="font-bold">&quot;Best Sellers&quot;</span> or <span className="font-bold">&quot;On Sale&quot;</span> — they typically have the highest conversion rates for dynamic ads.
                    </p>
                  </div>
                )}

                {filteredSets.map((set) => {
                  const isSelected = config.productSetId === set.id;
                  const isEmpty = set.productCount === 0;
                  const maxCount = Math.max(...productSets.map((s) => s.productCount), 1);
                  const barWidth = Math.max((set.productCount / maxCount) * 100, 2);
                  const isRecommended = !config.productSetId && (set.id === "ps_best" || set.id === "ps_sale");

                  return (
                    <button
                      key={set.id}
                      type="button"
                      disabled={isEmpty}
                      onClick={() => {
                        if (isEmpty) return;
                        updateConfig({
                          productSetId: set.id,
                          productSetName: set.nameAr || set.name,
                        });
                        setShowSetPicker(false);
                      }}
                      className={cn(
                        "group flex flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition-all",
                        isEmpty
                          ? "cursor-not-allowed border-border bg-white opacity-50"
                          : isSelected
                            ? "border-[#a4ffe5] bg-[#e6fff9] shadow-md"
                            : "border-white bg-white hover:border-[#a4ffe5] hover:shadow-md"
                      )}
                    >
                      {/* Preview image strip */}
                      {set.previewImages && set.previewImages.length > 0 ? (
                        <div className="flex h-[72px] gap-px overflow-hidden rounded-t-2xl">
                          {set.previewImages.slice(0, 4).map((img, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={img}
                              alt=""
                              className="h-full flex-1 object-cover transition-transform duration-300 group-hover:scale-105"
                              crossOrigin="anonymous"
                            />
                          ))}
                          {set.previewImages.length < 4 &&
                            Array.from({ length: 4 - set.previewImages.length }).map((_, i) => (
                              <div key={`ph-${i}`} className="flex h-full flex-1 items-center justify-center bg-muted/30">
                                <ImageIcon className="size-3 text-muted-foreground/20" />
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="flex h-12 items-center justify-center gap-3 rounded-t-2xl bg-muted/20">
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="flex size-7 items-center justify-center rounded-lg bg-muted/50">
                              <ImageIcon className="size-3 text-muted-foreground/25" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Card body */}
                      <div className="flex items-center gap-3 px-3 py-3">
                        {/* Set type icon */}
                        <div className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                          isSelected ? "bg-[#004956] text-white" : "bg-[#f4f4f4] text-muted-foreground group-hover:bg-[#e6fff9] group-hover:text-[#004956]"
                        )}>
                          {set.seasonalTag
                            ? <Sparkles className="size-4" />
                            : set.autoRefresh
                              ? <TrendingUp className="size-4" />
                              : <Package className="size-4" />
                          }
                        </div>

                        {/* Name + meta */}
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className={cn("truncate text-xs font-bold", isSelected ? "text-[#004956]" : "text-foreground")}>
                              {set.nameAr || set.name}
                            </p>
                            {isRecommended && (
                              <span className="shrink-0 rounded-full bg-[#004956] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                                Recommended
                              </span>
                            )}
                            {set.seasonalTag && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0 rounded-full px-1.5 py-0 text-[9px] font-medium capitalize",
                                  SEASONAL_COLORS[set.seasonalTag] ?? "bg-muted text-muted-foreground"
                                )}
                              >
                                {set.seasonalTag.replace(/_/g, " ")}
                              </Badge>
                            )}
                          </div>
                          <p className="line-clamp-1 text-[11px] text-muted-foreground">
                            {set.descriptionAr || set.description}
                          </p>
                          {/* Count bar */}
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted/40">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  isSelected ? "bg-[#004956]" : isEmpty ? "bg-red-300" : "bg-[#a4ffe5]"
                                )}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <span className={cn("shrink-0 text-[11px] font-bold tabular-nums", isEmpty ? "text-red-500" : isSelected ? "text-[#004956]" : "text-foreground")}>
                              {set.productCount}
                            </span>
                            {set.autoRefresh && (
                              <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600">
                                <RefreshCw className="size-2.5" />
                                Auto
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right indicator */}
                        {isSelected ? (
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#004956]">
                            <Check className="size-3.5 text-white" />
                          </div>
                        ) : (
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-[#004956]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between border-t border-border bg-white px-5 py-3">
            <p className="text-[11px] text-muted-foreground">
              {filteredSets.length} of {productSets.length} sets shown
            </p>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
              <RefreshCw className="size-3" />
              Synced from Salla store
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
