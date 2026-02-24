"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { fetchProductSets } from "@/lib/salla/product-sets";
import { type SallaProductSet } from "@/lib/salla/store-api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ImagePlus,
  Star,
  Tag,
} from "lucide-react";
import { type SallaProduct, PREVIEW_PRODUCTS, formatSAR } from "@/lib/salla/store-api";
import { type CollectionTile, type AdGroup, type DynamicTemplateConfig, makeDefaultDynamicTemplate } from "@/lib/snapchat/campaign-types";
import { UploadZone } from "@/components/shared/upload-zone";
import { MEDIA_SPECS } from "./constants";
import { makeTile } from "./helpers";

/* ------------------------------------------------------------------ */
/*  Product Picker Sheet (right-side slider)                          */
/* ------------------------------------------------------------------ */

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

  const categories = ["all", ...Array.from(new Set(PREVIEW_PRODUCTS.map((p) => p.category)))];
  const remainingSlots = maxTiles - existingTiles.length;

  const filtered = PREVIEW_PRODUCTS.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

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
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b border-border px-5 pb-3 pt-5">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Store className="size-4 text-primary" />
            Browse Store Products
          </SheetTitle>
          <SheetDescription className="text-xs">
            Select up to {remainingSlots} product{remainingSlots !== 1 ? "s" : ""} — image, title, and URL auto-fill from your catalog.
          </SheetDescription>
        </SheetHeader>

        {/* Search + filters */}
        <div className="flex shrink-0 flex-col gap-2 border-b border-border px-4 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
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
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Package className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No products found</p>
              <p className="text-xs text-muted-foreground/70">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((product) => {
                const isSelected = selected.has(product.id);
                const isDisabled = !isSelected && selected.size >= remainingSlots;
                const alreadyAdded = existingTiles.some(
                  (t) => t.url === product.url || t.title === product.name
                );

                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={isDisabled || alreadyAdded || !product.inStock}
                    onClick={() => toggleProduct(product.id)}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-primary ring-2 ring-primary/20"
                        : alreadyAdded
                          ? "cursor-not-allowed border-border opacity-40"
                          : isDisabled
                            ? "cursor-not-allowed border-border opacity-30"
                            : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.image} alt={product.name} className="size-full object-cover transition-transform group-hover:scale-105" crossOrigin="anonymous" />
                      {isSelected && (
                        <div className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                          <Check className="size-3" />
                        </div>
                      )}
                      {alreadyAdded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Added</span>
                        </div>
                      )}
                      {!product.inStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">Out of stock</span>
                        </div>
                      )}
                      {product.salePrice && product.salePrice < product.price && (
                        <div className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          <Tag className="size-2" />
                          {Math.round((1 - product.salePrice / product.price) * 100)}% OFF
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 p-2">
                      <p className="line-clamp-2 text-[11px] font-medium leading-tight text-foreground">{product.name}</p>
                      <div className="mt-auto flex items-center justify-between pt-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-bold tabular-nums text-foreground">{formatSAR(product.salePrice ?? product.price)}</span>
                          {product.salePrice && product.salePrice < product.price && (
                            <span className="text-[10px] tabular-nums text-muted-foreground line-through">{formatSAR(product.price)}</span>
                          )}
                        </div>
                        {product.rating && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Star className="size-2.5 fill-amber-400 text-amber-400" />
                            {product.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <span className="font-semibold tabular-nums text-foreground">{selected.size}</span> of {remainingSlots} selected
            </span>
            {selected.size > 0 && (
              <button type="button" onClick={() => setSelected(new Set())} className="text-xs text-primary hover:underline">Clear</button>
            )}
          </div>
          <Button className="w-full gap-1.5" onClick={handleConfirm} disabled={selected.size === 0}>
            <Plus className="size-3.5" />
            Add {selected.size || ""} Product{selected.size !== 1 ? "s" : ""} as Tiles
          </Button>
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

export function TileCard({ tile, index, onUpdate, onRemove }: { tile: CollectionTile; index: number; onUpdate: (p: Partial<CollectionTile>) => void; onRemove: () => void }) {
  const handleFile = useCallback(
    (file: File) => {
      if (file.size > MEDIA_SPECS.TILE.maxSize) { alert("Tile image must be under 2MB."); return; }
      onUpdate({ imageUrl: URL.createObjectURL(file), file });
    },
    [onUpdate]
  );

  const isFromStore = tile.imageUrl && !tile.imageUrl.startsWith("blob:") && tile.title;

  return (
    <div className={cn(
      "group relative flex gap-3 rounded-xl border p-3 transition-all",
      isFromStore ? "border-primary/20 bg-primary/[0.02]" : "border-border bg-background hover:border-border"
    )}>
      {/* Image */}
      <div className="w-14 shrink-0">
        {isFromStore && tile.imageUrl ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tile.imageUrl} alt={tile.title} className="size-full object-cover" crossOrigin="anonymous" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-0.5">
              <Store className="ml-auto size-2.5 text-white/80" />
            </div>
          </div>
        ) : (
          <UploadZone compact enableLibrary={false} accept="image/png,image/jpeg" label="Tile" sublabel="160x160+" preview={tile.imageUrl || undefined} onFile={handleFile} onClear={() => onUpdate({ imageUrl: "", file: undefined })} />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground">Tile {index + 1}</span>
          {isFromStore && (
            <span className="flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600">
              <CheckCircle2 className="size-2" /> From store
            </span>
          )}
        </div>
        <Input
          placeholder={isFromStore ? tile.title || "Product title" : "Product title"}
          value={tile.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="h-7 text-xs"
        />
        {tile.url && (
          <p className="truncate text-[10px] text-muted-foreground">{tile.url}</p>
        )}
      </div>

      {/* Remove */}
      <button type="button" onClick={onRemove} className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive">
        <Trash2 className="size-3" />
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
  addTile,
  removeTile,
  updateTile,
  onUpdate,
  catalogEnabled,
}: {
  ad: AdGroup;
  tileCount: number;
  addTile: () => void;
  removeTile: (id: string) => void;
  updateTile: (id: string, partial: Partial<CollectionTile>) => void;
  onUpdate: (ad: AdGroup) => void;
  catalogEnabled: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dynamicSetPicker, setDynamicSetPicker] = useState(false);
  const [productSets, setProductSets] = useState<SallaProductSet[]>([]);
  const isDynamic = ad.dynamicCollectionEnabled === true;
  const dynamicConfig = ad.dynamicTemplateConfig ?? makeDefaultDynamicTemplate();

  useEffect(() => {
    fetchProductSets("all").then(setProductSets);
  }, []);

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

  return (
    <div>
      {/* Dynamic Collection Toggle */}
      {catalogEnabled && (
        <div className={cn(
          "mb-4 rounded-xl border p-3.5 transition-colors",
          isDynamic ? "border-primary/30 bg-primary/[0.02]" : "border-border bg-muted/20"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RefreshCw className={cn("size-4", isDynamic ? "text-primary" : "text-muted-foreground")} />
              <div>
                <p className="text-xs font-semibold text-foreground">Auto-populate from Catalog</p>
                <p className="text-[11px] text-muted-foreground">Tiles auto-fill from a product set</p>
              </div>
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
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/30"
                >
                  {(() => {
                    const matchedSet = productSets.find((s) => s.id === dynamicConfig.productSetId);
                    return matchedSet?.previewImages?.length ? (
                      <div className="flex -space-x-1.5">
                        {matchedSet.previewImages.slice(0, 3).map((img, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={img} alt="" className="size-7 rounded-md border-2 border-background object-cover" crossOrigin="anonymous" />
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
                <div className="grid grid-cols-4 gap-1.5 rounded-lg border border-border bg-background p-2">
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
                <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
                  <SheetHeader className="shrink-0 border-b border-border px-5 pb-3 pt-5">
                    <SheetTitle className="flex items-center gap-2 text-base">
                      <ShoppingBag className="size-4 text-primary" />
                      Select Product Set
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                      Choose which products auto-fill your collection tiles.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-4 py-3">
                    <div className="flex flex-col gap-2">
                      {productSets.map((set) => {
                        const isSelected = dynamicConfig.productSetId === set.id;
                        return (
                          <button
                            key={set.id}
                            type="button"
                            onClick={() => {
                              updateDynamicConfig({ productSetId: set.id, productSetName: set.nameAr || set.name });
                              setDynamicSetPicker(false);
                            }}
                            className={cn(
                              "group flex flex-col overflow-hidden rounded-xl border text-left transition-all",
                              isSelected
                                ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
                                : "border-border hover:border-primary/30"
                            )}
                          >
                            {set.previewImages && set.previewImages.length > 0 && (
                              <div className="flex h-14 gap-px overflow-hidden">
                                {set.previewImages.slice(0, 4).map((img, i) => (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img key={i} src={img} alt="" className="h-full flex-1 object-cover" crossOrigin="anonymous" />
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-3 px-3 py-2.5">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-semibold text-foreground">{set.nameAr || set.name}</p>
                                  {set.seasonalTag && (
                                    <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">{set.seasonalTag}</Badge>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">{set.descriptionAr || set.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold tabular-nums text-foreground">{set.productCount}</span>
                                {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-border bg-muted/30 px-4 py-3">
                    <p className="text-center text-[11px] text-muted-foreground">
                      {productSets.length} product sets · Synced from your Salla store
                    </p>
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
          {/* Section header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Product Tiles</Label>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">{tileCount}/4</span>
            </div>
            {tileCount > 0 && canAddMore && (
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)} className="h-7 gap-1 rounded-lg text-xs">
                  <Store className="size-3" />
                  Store
                </Button>
                <Button size="sm" variant="ghost" onClick={addTile} className="h-7 gap-1 rounded-lg text-xs text-muted-foreground">
                  <Plus className="size-3" />
                  Manual
                </Button>
              </div>
            )}
          </div>

          {/* Empty state — store-first experience */}
          {tileCount === 0 && (
            <div className="mb-3 overflow-hidden rounded-xl border-2 border-dashed border-border">
              {/* Primary: Browse store */}
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors hover:bg-primary/[0.02]"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Store className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">Browse store products</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Select from your Salla catalog — image, title, and URL auto-fill
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">Recommended</span>
              </button>

              {/* Secondary: Manual */}
              <button
                type="button"
                onClick={addTile}
                className="flex w-full items-center gap-3.5 border-t border-dashed border-border px-4 py-3 text-left transition-colors hover:bg-muted/30"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                  <ImagePlus className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Add tile manually</p>
                  <p className="text-[11px] text-muted-foreground">Upload your own image and enter details</p>
                </div>
              </button>
            </div>
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
                  onUpdate={(p) => updateTile(tile.id, p)}
                  onRemove={() => removeTile(tile.id)}
                />
              ))}

              {/* Inline add-more row */}
              {canAddMore && (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
                  >
                    <Store className="size-3" />
                    From store
                  </button>
                  <span className="text-border">|</span>
                  <button
                    type="button"
                    onClick={addTile}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Plus className="size-3" />
                    Manual
                  </button>
                  <span className="ml-auto text-[10px] text-muted-foreground">{4 - tileCount} slot{4 - tileCount !== 1 ? "s" : ""} left</span>
                </div>
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
