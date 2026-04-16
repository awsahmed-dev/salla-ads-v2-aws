"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { fetchProductSets } from "@/lib/salla/product-sets";
import { type SallaProductSet } from "@/lib/salla/store-api";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Search,
  Store,
  Check,
  CheckCircle2,
  X,
  RefreshCw,
  ShoppingBag,
  Package,
  Plus,
  AlertCircle,
  Trash2,
  Star,
  Tag,
  ArrowRight,
  GripVertical,
  Upload,
  Sparkles,
  Info,
} from "lucide-react";
import { type SallaProduct, PREVIEW_PRODUCTS, formatSAR } from "@/lib/salla/store-api";
import { type CollectionTile, type AdGroup, type DynamicTemplateConfig, makeDefaultDynamicTemplate } from "@/lib/snapchat/campaign-types";

/* ------------------------------------------------------------------ */
/*  Product Picker Sheet (right-side slider)                          */
/* ------------------------------------------------------------------ */

type SortKey = "best_selling" | "price_low" | "price_high" | "newest" | "rating";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "best_selling", label: "Best Selling" },
  { value: "price_low", label: "Price: Low → High" },
  { value: "price_high", label: "Price: High → Low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top Rated" },
];

function sortProducts(products: SallaProduct[], key: SortKey): SallaProduct[] {
  const sorted = [...products];
  switch (key) {
    case "best_selling": return sorted.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
    case "price_low":    return sorted.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    case "price_high":   return sorted.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    case "newest":       return sorted.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    case "rating":       return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
}

export function ProductPickerSheet({
  open,
  onOpenChange,
  existingTiles,
  maxTiles,
  onAddProducts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTiles: CollectionTile[];
  maxTiles: number;
  onAddProducts: (products: SallaProduct[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortKey>("best_selling");

  const categories = ["all", ...Array.from(new Set(PREVIEW_PRODUCTS.map((p) => p.category)))];
  const remainingSlots = maxTiles - existingTiles.length;

  const filtered = sortProducts(
    PREVIEW_PRODUCTS.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchSearch && matchCategory;
    }),
    sortBy
  );

  const selectedProducts = PREVIEW_PRODUCTS.filter((p) => selected.has(p.id));

  const toggleProduct = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < remainingSlots) {
      next.add(id);
    }
    setSelected(next);
  };

  const handleConfirm = () => {
    const products = PREVIEW_PRODUCTS.filter((p) => selected.has(p.id));
    onAddProducts(products);
    setSelected(new Set());
    setSearch("");
    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setSearch("");
      setSelectedCategory("all");
      setSortBy("best_selling");
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {/* Header */}
        <SheetHeader className="border-b border-border px-5 pb-3 pt-5">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="size-4 text-primary" />
            Select Products
          </SheetTitle>
          <SheetDescription className="text-xs">
            Choose up to {remainingSlots} product{remainingSlots !== 1 ? "s" : ""} for collection tiles
            {" "}&middot;{" "}
            <span className="font-medium text-foreground">{filtered.length}</span> available
          </SheetDescription>
        </SheetHeader>

        {/* Selected products strip */}
        {selectedProducts.length > 0 && (
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-primary/[0.02] px-5 py-2.5">
            <span className="shrink-0 text-[11px] font-semibold text-primary">{selectedProducts.length} selected</span>
            <div className="flex flex-1 gap-1.5 overflow-x-auto">
              {selectedProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProduct(p.id)}
                  className="group flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-white py-0.5 pl-0.5 pr-2 transition-colors hover:border-destructive/30 hover:bg-destructive/5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="size-5 rounded-full object-cover" crossOrigin="anonymous" />
                  <span className="max-w-[80px] truncate text-[10px] font-medium text-foreground">{p.name}</span>
                  <X className="size-2.5 shrink-0 text-muted-foreground group-hover:text-destructive" />
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setSelected(new Set())} className="shrink-0 text-[10px] font-medium text-primary hover:underline">Clear</button>
          </div>
        )}

        {/* Search + filters */}
        <div className="flex shrink-0 flex-col gap-2.5 border-b border-border px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full pl-9 text-xs"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground">
                <X className="size-3" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    selectedCategory === cat
                      ? "border-primary/60 bg-primary/[0.06] text-primary"
                      : "border-border bg-white text-foreground hover:border-primary/30"
                  )}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="h-7 shrink-0 rounded-lg border border-border bg-white px-2 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-primary/30"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Package className="mb-2 size-8 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">No products found</p>
              <p className="text-xs text-muted-foreground">Try a different search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((product) => {
                const isSelected = selected.has(product.id);
                const isDisabled = !isSelected && selected.size >= remainingSlots;
                const alreadyAdded = existingTiles.some(
                  (t) => t.url === product.url || t.title === product.name
                );
                const hasSale = product.salePrice != null && product.salePrice < product.price;

                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={isDisabled || alreadyAdded || !product.inStock}
                    onClick={() => toggleProduct(product.id)}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all",
                      isSelected
                        ? "border-primary shadow-sm"
                        : alreadyAdded
                          ? "cursor-not-allowed border-border opacity-40"
                          : isDisabled
                            ? "cursor-not-allowed border-border opacity-30"
                            : "border-border hover:border-primary/40 hover:shadow-sm"
                    )}
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.image} alt={product.name} className="size-full object-cover transition-transform group-hover:scale-105" crossOrigin="anonymous" />

                      {/* Selection check */}
                      {isSelected && (
                        <div className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="size-3" />
                        </div>
                      )}

                      {/* Sale badge */}
                      {hasSale && (
                        <div className="absolute left-1.5 top-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          -{Math.round((1 - product.salePrice! / product.price) * 100)}%
                        </div>
                      )}

                      {/* Out of stock overlay */}
                      {!product.inStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Out of stock</span>
                        </div>
                      )}

                      {/* Already added overlay */}
                      {alreadyAdded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Already added</span>
                        </div>
                      )}

                      {/* Hover overlay */}
                      {!isSelected && !alreadyAdded && !isDisabled && product.inStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                            <Check className="size-4" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-1 p-2.5">
                      <p className="line-clamp-2 text-xs font-medium leading-tight text-foreground">{product.name}</p>
                      {product.rating != null && (
                        <div className="flex items-center gap-1">
                          <Star className="size-2.5 fill-amber-400 text-amber-400" />
                          <span className="text-[10px] tabular-nums text-muted-foreground">{product.rating}</span>
                        </div>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-0.5">
                        <div className="flex items-baseline gap-1">
                          {hasSale ? (
                            <>
                              <span className="text-xs font-bold tabular-nums text-red-600">{formatSAR(product.salePrice!)}</span>
                              <span className="text-[10px] tabular-nums text-muted-foreground line-through">{formatSAR(product.price)}</span>
                            </>
                          ) : (
                            <span className="text-xs font-bold tabular-nums text-foreground">{formatSAR(product.price)}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{product.sku}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{selected.size}</span> of {remainingSlots} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={selected.size === 0} className="gap-1">
              <Plus className="size-3" />
              Add {selected.size || ""} Tile{selected.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* Keep legacy name export for backward compat */
export const ProductPickerDialog = ProductPickerSheet;

/* ------------------------------------------------------------------ */
/*  Collection Tile Card                                              */
/* ------------------------------------------------------------------ */

function TileCard({
  tile,
  index,
  onRemove,
}: {
  tile: CollectionTile;
  index: number;
  onRemove: () => void;
}) {
  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5 transition-all hover:border-primary/30 hover:shadow-sm">
      {/* Drag handle */}
      <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground/30" />

      {/* Image */}
      {tile.imageUrl ? (
        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tile.imageUrl} alt={tile.title} className="size-full object-cover" crossOrigin="anonymous" />
        </div>
      ) : (
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted/60">
          <Package className="size-4 text-muted-foreground" />
        </div>
      )}

      {/* Info */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <p className="truncate text-xs font-medium text-foreground">{tile.title || "Untitled product"}</p>
        {tile.url && <p className="truncate text-[10px] text-muted-foreground">{tile.url}</p>}
      </div>

      {/* Tile number */}
      <span className="shrink-0 flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground">{index + 1}</span>

      {/* Remove */}
      <button type="button" onClick={onRemove} className="shrink-0 rounded-md p-1 text-muted-foreground/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive">
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collection Tiles Section                                          */
/* ------------------------------------------------------------------ */

export function CollectionTilesSection({
  ad,
  tileCount,
  removeTile,
  onUpdate,
  catalogEnabled,
}: {
  ad: AdGroup;
  tileCount: number;
  removeTile: (id: string) => void;
  onUpdate: (ad: AdGroup) => void;
  catalogEnabled: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dynamicSetPicker, setDynamicSetPicker] = useState(false);
  const [productSets, setProductSets] = useState<SallaProductSet[]>([]);
  const isDynamic = ad.dynamicCollectionEnabled === true;
  const dynamicConfig = ad.dynamicTemplateConfig ?? makeDefaultDynamicTemplate();
  const hasAutoOpened = useRef(false);

  /** Catalog collection mode — always dynamic tiles, hero is STATIC (upload) or DYNAMIC (auto) */
  const isCatalogMode = catalogEnabled && ad.dynamicCollectionEnabled === true;
  const heroMode = ad.catalogRenderType ?? "STATIC";

  useEffect(() => {
    fetchProductSets("all").then(setProductSets);
  }, []);

  useEffect(() => {
    if (tileCount === 0 && !isDynamic && !isCatalogMode && !hasAutoOpened.current) {
      hasAutoOpened.current = true;
      const timer = setTimeout(() => setPickerOpen(true), 300);
      return () => clearTimeout(timer);
    }
  }, [tileCount, isDynamic, isCatalogMode]);

  const handleAddProducts = (products: SallaProduct[]) => {
    const newTiles: CollectionTile[] = products.map((p) => ({
      id: `tile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${p.id}`,
      imageUrl: p.image,
      title: p.name,
      url: p.url,
    }));
    onUpdate({
      ...ad,
      collectionTiles: [...ad.collectionTiles, ...newTiles].slice(0, 4),
    });
  };

  const toggleDynamic = (enabled: boolean) => {
    onUpdate({
      ...ad,
      dynamicCollectionEnabled: enabled,
      dynamicTemplateConfig: enabled ? (ad.dynamicTemplateConfig ?? makeDefaultDynamicTemplate()) : ad.dynamicTemplateConfig,
    });
  };

  const updateDynamicConfig = (partial: Partial<DynamicTemplateConfig>) => {
    onUpdate({
      ...ad,
      dynamicTemplateConfig: { ...dynamicConfig, ...partial },
    });
  };

  const canAddMore = tileCount < 4;

  /* ------------------------------------------------------------------ */
  /*  Catalog Collection Mode (catalogEnabled + COLLECTION)             */
  /* ------------------------------------------------------------------ */
  if (isCatalogMode) {
    return (
      <div className="flex flex-col gap-5">
        {/* ── Section: Hero Media Source ── */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Label className="text-sm font-bold text-foreground">Hero Media</Label>
            <span className="rounded-full bg-[#e6fff9] px-2 py-0.5 text-[10px] font-medium text-[#004956]">Top Snap</span>
          </div>
          <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
            The hero is the full-screen media shown first. Product tiles from your catalog appear below it.
          </p>

          {/* Hero source toggle cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Upload your own */}
            <button
              type="button"
              onClick={() => onUpdate({ ...ad, catalogRenderType: "STATIC" })}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition-all",
                heroMode === "STATIC"
                  ? "border-[#a4ffe5] bg-[#e6fff9]"
                  : "border-border bg-card hover:border-[#a4ffe5] hover:bg-[#e6fff9]/40"
              )}
            >
              <div className={cn(
                "flex size-9 items-center justify-center rounded-full transition-colors",
                heroMode === "STATIC" ? "bg-[#a4ffe5]" : "bg-muted/60"
              )}>
                <Upload className={cn("size-4", heroMode === "STATIC" ? "text-[#004956]" : "text-muted-foreground")} />
              </div>
              <div>
                <p className={cn("text-xs font-bold", heroMode === "STATIC" ? "text-[#004956]" : "text-foreground")}>Upload Your Own</p>
                <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">Image or video as hero snap</p>
              </div>
              {heroMode === "STATIC" && (
                <div className="flex size-4 items-center justify-center rounded-full bg-[#004956]">
                  <Check className="size-2.5 text-white" />
                </div>
              )}
            </button>

            {/* Auto from catalog */}
            <button
              type="button"
              onClick={() => onUpdate({ ...ad, catalogRenderType: "DYNAMIC", assets: [] })}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition-all",
                heroMode === "DYNAMIC"
                  ? "border-[#a4ffe5] bg-[#e6fff9]"
                  : "border-border bg-card hover:border-[#a4ffe5] hover:bg-[#e6fff9]/40"
              )}
            >
              <div className={cn(
                "flex size-9 items-center justify-center rounded-full transition-colors",
                heroMode === "DYNAMIC" ? "bg-[#a4ffe5]" : "bg-muted/60"
              )}>
                <Sparkles className={cn("size-4", heroMode === "DYNAMIC" ? "text-[#004956]" : "text-muted-foreground")} />
              </div>
              <div>
                <p className={cn("text-xs font-bold", heroMode === "DYNAMIC" ? "text-[#004956]" : "text-foreground")}>Auto from Catalog</p>
                <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">Best product as hero snap</p>
              </div>
              {heroMode === "DYNAMIC" && (
                <div className="flex size-4 items-center justify-center rounded-full bg-[#004956]">
                  <Check className="size-2.5 text-white" />
                </div>
              )}
            </button>
          </div>

          {/* Info about selected mode */}
          {heroMode === "STATIC" && (
            <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <Info className="mt-0.5 size-3 shrink-0 text-blue-500" />
              <p className="text-[11px] leading-relaxed text-blue-700">
                Upload a custom image or video above in the <span className="font-medium">Ad Content</span> section. This becomes the first snap users see — catalog products appear as swipeable tiles below.
              </p>
            </div>
          )}
          {heroMode === "DYNAMIC" && (
            <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <Sparkles className="mt-0.5 size-3 shrink-0 text-emerald-500" />
              <p className="text-[11px] leading-relaxed text-emerald-700">
                Snapchat will auto-select the best-performing product image from your catalog as the hero. No upload needed.
              </p>
            </div>
          )}
        </div>

        {/* ── Section: Product Set for Tiles ── */}
        <div className="border-t border-border pt-4">
          <div className="mb-2 flex items-center gap-2">
            <Label className="text-sm font-bold text-foreground">Product Tiles</Label>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">From Catalog</span>
          </div>
          <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
            2-4 product tiles auto-populated from your catalog. Users can swipe through and tap to visit each product page.
          </p>

          {/* Product set selection */}
          {dynamicConfig.productSetId ? (
            <button
              type="button"
              onClick={() => setDynamicSetPicker(true)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-2.5 text-left transition-colors hover:border-[#a4ffe5] hover:shadow-sm"
            >
              {(() => {
                const matchedSet = productSets.find((s) => s.id === dynamicConfig.productSetId);
                return matchedSet?.previewImages?.length ? (
                  <div className="flex -space-x-1.5">
                    {matchedSet.previewImages.slice(0, 3).map((img, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={img} alt="" className="size-8 rounded-lg border-2 border-white object-cover" crossOrigin="anonymous" />
                    ))}
                  </div>
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[#e6fff9]">
                    <Package className="size-4 text-[#004956]" />
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{dynamicConfig.productSetName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {productSets.find((s) => s.id === dynamicConfig.productSetId)?.productCount ?? 0} products
                </p>
              </div>
              <span className="rounded-full bg-[#e6fff9] px-2.5 py-1 text-[11px] font-medium text-[#004956] transition-colors hover:bg-[#a4ffe5]">Change</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDynamicSetPicker(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#a4ffe5] bg-[#e6fff9]/30 py-4 text-[#004956] transition-colors hover:bg-[#e6fff9]"
            >
              <Package className="size-4" />
              <span className="text-xs font-semibold">Select Product Set</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}

          {/* Template options */}
          <div className="mt-3 flex items-center gap-4">
            <label className="flex items-center gap-1.5">
              <Switch checked={dynamicConfig.showPrice} onCheckedChange={(v) => updateDynamicConfig({ showPrice: v })} className="scale-90" />
              <span className="text-[11px] text-foreground">Show prices</span>
            </label>
            <label className="flex items-center gap-1.5">
              <Switch checked={dynamicConfig.showSaleBadge} onCheckedChange={(v) => updateDynamicConfig({ showSaleBadge: v })} className="scale-90" />
              <span className="text-[11px] text-foreground">Sale badge</span>
            </label>
          </div>

          {/* Live tile preview */}
          {dynamicConfig.productSetId && (
            <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-xl border border-border bg-white p-2">
              {PREVIEW_PRODUCTS.slice(0, 4).map((p) => (
                <div key={p.id} className="overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name} className="aspect-square w-full object-cover" crossOrigin="anonymous" />
                  <div className="p-1">
                    <p className="truncate text-[7px] font-medium text-foreground">{p.name}</p>
                    {dynamicConfig.showPrice && (
                      <p className="text-[7px] font-bold text-[#004956]">{formatSAR(p.salePrice ?? p.price)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Set Picker Sheet (shared) */}
        <Sheet open={dynamicSetPicker} onOpenChange={setDynamicSetPicker}>
          <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]">
            <SheetHeader className="shrink-0 bg-[#004956] px-6 pb-4 pt-5">
              <SheetTitle className="flex items-center gap-2.5 text-base font-bold text-white">
                <div className="flex size-8 items-center justify-center rounded-xl bg-white/15">
                  <Package className="size-4 text-[#a4ffe5]" />
                </div>
                Select Product Set
              </SheetTitle>
              <SheetDescription className="text-xs text-white/70">
                Products from this set will auto-fill your collection tiles.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto bg-[#f8f8f8] px-4 py-3">
              <div className="flex flex-col gap-2">
                {productSets.map((set) => {
                  const isSelected = dynamicConfig.productSetId === set.id;
                  const isEmpty = set.productCount === 0;
                  return (
                    <button
                      key={set.id}
                      type="button"
                      disabled={isEmpty}
                      onClick={() => {
                        if (isEmpty) return;
                        updateDynamicConfig({ productSetId: set.id, productSetName: set.nameAr || set.name });
                        setDynamicSetPicker(false);
                      }}
                      className={cn(
                        "group flex flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition-all",
                        isEmpty
                          ? "cursor-not-allowed border-border opacity-50"
                          : isSelected
                            ? "border-[#a4ffe5] bg-[#e6fff9] shadow-md"
                            : "border-white bg-white hover:border-[#a4ffe5]"
                      )}
                    >
                      {set.previewImages && set.previewImages.length > 0 && (
                        <div className="flex h-[72px] gap-px overflow-hidden rounded-t-2xl">
                          {set.previewImages.slice(0, 4).map((img, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={img} alt="" className="h-full flex-1 object-cover transition-transform duration-300 group-hover:scale-105" crossOrigin="anonymous" />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 px-3 py-3">
                        <div className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                          isSelected ? "bg-[#004956] text-white" : "bg-[#f4f4f4] text-muted-foreground group-hover:bg-[#e6fff9]"
                        )}>
                          <Package className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("text-xs font-bold", isSelected ? "text-[#004956]" : "text-foreground")}>{set.nameAr || set.name}</p>
                            {set.seasonalTag && (
                              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{set.seasonalTag}</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{set.descriptionAr || set.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-bold tabular-nums", isEmpty ? "text-red-500" : isSelected ? "text-[#004956]" : "text-foreground")}>{set.productCount}{isEmpty ? " (empty)" : ""}</span>
                          {isSelected ? (
                            <div className="flex size-5 items-center justify-center rounded-full bg-[#004956]">
                              <Check className="size-3 text-white" />
                            </div>
                          ) : (
                            <ArrowRight className="size-3.5 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-[#004956]" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-xs text-muted-foreground">
                {productSets.length} product sets
              </p>
              <Button variant="outline" size="sm" onClick={() => setDynamicSetPicker(false)}>
                Cancel
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Standard Collection Mode (non-catalog)                            */
  /* ------------------------------------------------------------------ */
  return (
    <div>
      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-bold text-foreground">Product Tiles</Label>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums",
            tileCount < 2 ? "bg-amber-100 text-amber-700" : tileCount >= 2 ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
          )}>{tileCount}/4 {tileCount < 2 ? "(min 2)" : ""}</span>
        </div>
        {!isDynamic && tileCount > 0 && canAddMore && (
          <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)} className="h-7 gap-1 rounded-lg text-xs">
            <Plus className="size-3" />
            Add product
          </Button>
        )}
      </div>

      <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
        Swipeable product tiles shown below the top snap. Each tile links to its own product page.
      </p>

      {/* Dynamic Collection Toggle (non-catalog mode) */}
      {catalogEnabled && !isCatalogMode && (
        <div className={cn(
          "mb-4 rounded-xl border p-3.5 transition-colors",
          isDynamic ? "border-primary/30 bg-primary/[0.02]" : "border-border"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-foreground">Auto-populate from Catalog</span>
              <span className="text-[11px] leading-tight text-muted-foreground">Tiles auto-fill from a product set</span>
            </div>
            <Switch checked={isDynamic} onCheckedChange={toggleDynamic} />
          </div>

          {isDynamic && (
            <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
              {/* Product Set Selection */}
              {dynamicConfig.productSetId ? (
                <button
                  type="button"
                  onClick={() => setDynamicSetPicker(true)}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-white px-3 py-2.5 text-left transition-colors hover:border-primary/30"
                >
                  {(() => {
                    const matchedSet = productSets.find((s) => s.id === dynamicConfig.productSetId);
                    return matchedSet?.previewImages?.length ? (
                      <div className="flex -space-x-1.5">
                        {matchedSet.previewImages.slice(0, 3).map((img, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={img} alt="" className="size-7 rounded-md border-2 border-white object-cover" crossOrigin="anonymous" />
                        ))}
                      </div>
                    ) : (
                      <Package className="size-4 text-primary" />
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{dynamicConfig.productSetName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {productSets.find((s) => s.id === dynamicConfig.productSetId)?.productCount ?? 0} products
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-primary">Change</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDynamicSetPicker(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 py-3.5 text-primary transition-colors hover:border-primary/50 hover:bg-primary/[0.02]"
                >
                  <Package className="size-4" />
                  <span className="text-xs font-medium">Select Product Set</span>
                </button>
              )}

              {/* Options */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5">
                  <Switch checked={dynamicConfig.showPrice} onCheckedChange={(v) => updateDynamicConfig({ showPrice: v })} className="scale-90" />
                  <span className="text-[11px] text-foreground">Prices</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <Switch checked={dynamicConfig.showSaleBadge} onCheckedChange={(v) => updateDynamicConfig({ showSaleBadge: v })} className="scale-90" />
                  <span className="text-[11px] text-foreground">Sale badge</span>
                </label>
              </div>

              {/* Preview */}
              {dynamicConfig.productSetId && (
                <div className="grid grid-cols-4 gap-1.5 rounded-lg border border-border bg-white p-2">
                  {PREVIEW_PRODUCTS.slice(0, 4).map((p) => (
                    <div key={p.id} className="overflow-hidden rounded-md bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt={p.name} className="aspect-square w-full object-cover" crossOrigin="anonymous" />
                      <div className="p-1">
                        <p className="truncate text-[7px] font-medium text-foreground">{p.name}</p>
                        {dynamicConfig.showPrice && (
                          <p className="text-[7px] font-bold text-primary">{formatSAR(p.salePrice ?? p.price)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Product Set Picker Sheet */}
              <Sheet open={dynamicSetPicker} onOpenChange={setDynamicSetPicker}>
                <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]">
                  <SheetHeader className="border-b border-border px-5 pb-3 pt-5">
                    <SheetTitle className="flex items-center gap-2 text-base">
                      <Package className="size-4 text-primary" />
                      Select Product Set
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                      Choose which products auto-fill your collection tiles.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    <div className="flex flex-col gap-2">
                      {productSets.map((set) => {
                        const isSelected = dynamicConfig.productSetId === set.id;
                        const isEmpty = set.productCount === 0;
                        return (
                          <button
                            key={set.id}
                            type="button"
                            disabled={isEmpty}
                            onClick={() => {
                              if (isEmpty) return;
                              updateDynamicConfig({ productSetId: set.id, productSetName: set.nameAr || set.name });
                              setDynamicSetPicker(false);
                            }}
                            className={cn(
                              "group flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all",
                              isEmpty
                                ? "cursor-not-allowed border-border opacity-50"
                                : isSelected
                                  ? "border-primary shadow-sm"
                                  : "border-border hover:border-primary/40 hover:shadow-sm"
                            )}
                          >
                            {set.previewImages && set.previewImages.length > 0 && (
                              <div className="flex h-16 gap-px overflow-hidden">
                                {set.previewImages.slice(0, 4).map((img, i) => (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img key={i} src={img} alt="" className="h-full flex-1 object-cover transition-transform duration-300 group-hover:scale-105" crossOrigin="anonymous" />
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-3 px-3 py-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={cn("text-xs font-bold", isSelected ? "text-primary" : "text-foreground")}>{set.nameAr || set.name}</p>
                                  {set.seasonalTag && (
                                    <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{set.seasonalTag}</Badge>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">{set.descriptionAr || set.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn("text-xs font-bold tabular-nums", isEmpty ? "text-red-500" : isSelected ? "text-primary" : "text-foreground")}>{set.productCount}{isEmpty ? " (empty)" : ""}</span>
                                {isSelected ? (
                                  <div className="flex size-5 items-center justify-center rounded-full bg-primary">
                                    <Check className="size-3 text-primary-foreground" />
                                  </div>
                                ) : (
                                  <ArrowRight className="size-3.5 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border px-5 py-3">
                    <p className="text-xs text-muted-foreground">
                      {productSets.length} product sets
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setDynamicSetPicker(false)}>
                      Cancel
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      )}

      {/* Manual Tiles Section */}
      {!isDynamic && (
        <>
          {/* Empty state */}
          {tileCount === 0 && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="group flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-border px-5 py-6 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.02]"
            >
              {/* Mini tile preview */}
              <div className="flex shrink-0 gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex size-10 items-center justify-center rounded-lg bg-muted/60">
                    <Package className="size-3.5 text-muted-foreground/40" />
                  </div>
                ))}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Add products from your store</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Pick 2-4 products — image, title, and URL auto-fill from your catalog
                </p>
              </div>
            </button>
          )}

          {/* Minimum tile warning */}
          {tileCount > 0 && tileCount < 2 && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
              <AlertCircle className="size-3 shrink-0 text-amber-500" />
              <span className="text-xs text-amber-700">Snap requires at least 2 tiles — add {2 - tileCount} more</span>
            </div>
          )}

          {/* Tile cards */}
          {tileCount > 0 && (
            <div className="flex flex-col gap-2">
              {ad.collectionTiles.map((tile, i) => (
                <TileCard
                  key={tile.id}
                  tile={tile}
                  index={i}
                  onRemove={() => removeTile(tile.id)}
                />
              ))}

              {/* Add more button */}
              {canAddMore && (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/[0.02] hover:text-primary"
                >
                  <Plus className="size-3.5" />
                  Add product
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground/70">({4 - tileCount} remaining)</span>
                </button>
              )}
            </div>
          )}

          <ProductPickerSheet
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            existingTiles={ad.collectionTiles}
            maxTiles={4}
            onAddProducts={handleAddProducts}
          />
        </>
      )}
    </div>
  );
}
