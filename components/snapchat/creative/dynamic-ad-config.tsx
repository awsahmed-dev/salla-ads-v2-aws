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
}: {
  ad: AdGroup;
  onUpdate: (next: AdGroup) => void;
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
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
          <Zap className="size-4 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">Dynamic Product Ad</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Snapchat auto-generates ads from your catalog based on user behavior. No creative upload needed — images, prices, and descriptions are pulled directly from your products.
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
          <div className="group relative overflow-hidden rounded-xl border border-primary/30 bg-primary/[0.03] transition-colors">
            {/* Preview images strip */}
            {selectedSet.previewImages && selectedSet.previewImages.length > 0 && (
              <div className="flex h-14 gap-px overflow-hidden bg-muted/30">
                {selectedSet.previewImages.slice(0, 4).map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="h-full flex-1 object-cover"
                    crossOrigin="anonymous"
                  />
                ))}
                {selectedSet.previewImages.length < 4 &&
                  Array.from({ length: 4 - selectedSet.previewImages.length }).map((_, i) => (
                    <div key={`ph-${i}`} className="flex h-full flex-1 items-center justify-center bg-muted/40">
                      <ImageIcon className="size-3 text-muted-foreground/30" />
                    </div>
                  ))
                }
              </div>
            )}

            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Package className="size-4 text-primary" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">{config.productSetName}</span>
                  {selectedSet.autoRefresh && (
                    <RefreshCw className="size-2.5 text-emerald-500" />
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
                <span className="text-[11px] text-muted-foreground">
                  {selectedSet.productCount} products {selectedSet.autoRefresh ? "· Auto-refreshing" : ""}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={openPicker}
                className="h-7 gap-1 rounded-full text-[11px]"
              >
                Change
              </Button>
              <button
                type="button"
                onClick={() => updateConfig({ productSetId: "", productSetName: "" })}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="size-3.5" />
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
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="size-5 text-primary" />
              Select Product Set
            </SheetTitle>
            <p className="text-[13px] text-muted-foreground">
              Choose which products Snapchat will use to generate dynamic ads.
            </p>
          </SheetHeader>

          {/* Search + Filter */}
          <div className="flex flex-col gap-3 border-b border-border px-5 py-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search product sets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground">
                  <X className="size-3" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {SET_CATEGORIES.map((cat) => {
                  const count = cat.value === "all" ? productSets.length
                    : cat.value === "seasonal" ? productSets.filter((s) => !!s.seasonalTag).length
                    : cat.value === "category" ? productSets.filter((s) => s.id.startsWith("ps_cat_")).length
                    : productSets.filter((s) => !s.seasonalTag && !s.id.startsWith("ps_cat_")).length;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFilterTab(cat.value)}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                        filterTab === cat.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      )}
                    >
                      {cat.icon}
                      {cat.label}
                      <span className={cn("tabular-nums", filterTab === cat.value ? "text-primary-foreground/70" : "text-muted-foreground/60")}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Tab explainer */}
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              {filterTab === "all" && "All product sets from your store — smart, category-based, and seasonal."}
              {filterTab === "standard" && "Auto-updating sets based on store performance — best sellers, new arrivals, on sale, etc."}
              {filterTab === "category" && "Sets grouped by product category — clothing, electronics, perfume, etc."}
              {filterTab === "seasonal" && "Curated sets for Saudi holidays and events — Ramadan, Eid, National Day, and more."}
            </p>
          </div>

          {/* Product Set List */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {filteredSets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="mb-2 size-6 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No matching sets</p>
                <p className="text-xs text-muted-foreground/60">Try a different search or filter</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Recommended banner for first-time selection */}
                {!config.productSetId && filterTab === "all" && !search && (
                  <div className="mb-1 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 dark:border-blue-900/40 dark:bg-blue-950/20">
                    <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                      Tip: Start with <span className="font-bold">&quot;Best Sellers&quot;</span> or <span className="font-bold">&quot;On Sale&quot;</span> — these typically have the highest conversion rates for dynamic ads.
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
                        "group flex flex-col overflow-hidden rounded-xl border text-left transition-all",
                        isEmpty
                          ? "cursor-not-allowed border-border opacity-50"
                          : isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : isRecommended
                              ? "border-blue-200 bg-blue-50/20 hover:border-primary/40 hover:bg-primary/[0.03] dark:border-blue-900/30 dark:bg-blue-950/10"
                              : "border-border hover:border-primary/30 hover:bg-muted/20"
                      )}
                    >
                      {/* Preview images */}
                      {set.previewImages && set.previewImages.length > 0 ? (
                        <div className="flex h-14 gap-px overflow-hidden">
                          {set.previewImages.slice(0, 4).map((img, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={img}
                              alt=""
                              className="h-full flex-1 object-cover transition-transform group-hover:scale-105"
                              crossOrigin="anonymous"
                            />
                          ))}
                          {set.previewImages.length < 4 &&
                            Array.from({ length: 4 - set.previewImages.length }).map((_, i) => (
                              <div key={`ph-${i}`} className="flex h-full flex-1 items-center justify-center bg-muted/30">
                                <ImageIcon className="size-3 text-muted-foreground/20" />
                              </div>
                            ))
                          }
                        </div>
                      ) : (
                        <div className="flex h-10 items-center justify-center gap-2 bg-muted/20">
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="flex size-6 items-center justify-center rounded bg-muted/40">
                              <ImageIcon className="size-2.5 text-muted-foreground/25" />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <div className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          isSelected ? "bg-primary/15" : "bg-muted"
                        )}>
                          {set.seasonalTag ? (
                            <Sparkles className={cn("size-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                          ) : set.autoRefresh ? (
                            <TrendingUp className={cn("size-3.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                          ) : (
                            <Package className={cn("size-3.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-xs font-semibold text-foreground">{set.nameAr || set.name}</p>
                            {isRecommended && (
                              <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">Recommended</span>
                            )}
                            {set.seasonalTag && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0 rounded-full px-1.5 py-0 text-[8px] font-medium capitalize",
                                  SEASONAL_COLORS[set.seasonalTag] ?? "bg-muted"
                                )}
                              >
                                {set.seasonalTag.replace(/_/g, " ")}
                              </Badge>
                            )}
                          </div>
                          <p className="line-clamp-1 text-[10px] text-muted-foreground">
                            {set.descriptionAr || set.description}
                          </p>
                          {/* Product count bar */}
                          <div className="mt-0.5 flex items-center gap-2">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted/50">
                              <div
                                className={cn("h-full rounded-full transition-all", isSelected ? "bg-primary" : isEmpty ? "bg-red-300" : "bg-emerald-400")}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <span className={cn("shrink-0 text-[10px] font-semibold tabular-nums", isEmpty ? "text-red-500" : "text-foreground")}>
                              {set.productCount}
                            </span>
                            {set.autoRefresh && (
                              <span className="flex shrink-0 items-center gap-0.5 text-[9px] text-emerald-600">
                                <RefreshCw className="size-2" />
                                Auto
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary">
                            <Check className="size-3 text-white" />
                          </div>
                        ) : (
                          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer summary */}
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-3">
            <p className="text-[11px] text-muted-foreground">
              {filteredSets.length} of {productSets.length} sets shown
            </p>
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <RefreshCw className="size-2.5 text-emerald-500" />
              Synced from Salla store
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
