"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Store, Search, Check, Package, Plus, X, Star, ArrowUpDown } from "lucide-react";
import {
  type SallaProduct,
  fetchProducts,
  getCategories,
  formatSAR,
  type ProductFetchOptions,
} from "@/lib/salla/store-api";

export type { SallaProduct };

type SortOption = ProductFetchOptions["sortBy"];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "best_selling", label: "Best Selling" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating", label: "Top Rated" },
];

/**
 * Reusable product picker dialog for selecting products from the Salla store.
 * Used across all platforms for collection/catalog ad creation.
 */
export function ProductPickerDialog({
  open,
  onOpenChange,
  existingProductNames,
  maxProducts,
  onAddProducts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingProductNames: string[];
  maxProducts: number;
  onAddProducts: (products: SallaProduct[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("best_selling");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Record<string, SallaProduct>>({});
  const [products, setProducts] = useState<SallaProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const remainingSlots = maxProducts;
  const selectedProducts = Object.values(selectedItems);

  const loadProducts = useCallback(async () => {
    const result = await fetchProducts({
      query: search || undefined,
      category: selectedCategory === "all" ? undefined : selectedCategory,
      sortBy,
      pageSize: 50,
    });
    setProducts(result.products);
    setTotal(result.total);
  }, [search, selectedCategory, sortBy]);

  useEffect(() => {
    if (open) {
      loadProducts();
      getCategories().then(setCategories);
      setSelected(new Set());
      setSelectedItems({});
      setSearch("");
    }
  }, [open, loadProducts]);

  const toggleProduct = (product: SallaProduct) => {
    const id = product.id;
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
      setSelectedItems((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } else if (next.size < remainingSlots) {
      next.add(id);
      setSelectedItems((prev) => ({ ...prev, [id]: product }));
    }
    setSelected(next);
  };

  const handleConfirm = () => {
    const chosen = selectedProducts;
    onAddProducts(chosen);
    setSelected(new Set());
    setSelectedItems({});
    setSearch("");
    onOpenChange(false);
  };

  const allCategories = ["all", ...categories];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-5 pb-3 pt-5">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Store className="size-4 text-primary" />
            Select Products from Store
          </SheetTitle>
          <SheetDescription className="text-xs">
            Choose up to {remainingSlots} product{remainingSlots !== 1 ? "s" : ""} &middot;{" "}
            <span className="font-medium text-foreground">{total}</span> products available
          </SheetDescription>
        </SheetHeader>

        {selectedProducts.length > 0 && (
          <div className="flex shrink-0 items-center gap-2 border-b border-primary/20 bg-primary/[0.03] px-5 py-2">
            <span className="shrink-0 text-[11px] font-semibold text-primary">{selectedProducts.length} selected</span>
            <div className="flex flex-1 gap-1.5 overflow-x-auto">
              {selectedProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProduct(p)}
                  className="group flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-background py-0.5 pl-0.5 pr-2 transition-colors hover:border-destructive/30 hover:bg-destructive/5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="size-5 rounded-full object-cover" crossOrigin="anonymous" />
                  <span className="max-w-[80px] truncate text-xs font-medium text-foreground">{p.name}</span>
                  <X className="size-2.5 shrink-0 text-muted-foreground group-hover:text-destructive" />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(new Set());
                setSelectedItems({});
              }}
              className="shrink-0 text-xs text-primary hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Search + Category filter + Sort */}
        <div className="flex flex-col gap-2.5 border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full pl-9 text-xs"
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
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <ArrowUpDown className="size-3" />
                Sort
              </Button>
              {showSortMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-border bg-popover p-1 shadow-lg">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                        sortBy === opt.value
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {sortBy === opt.value && <Check className="size-3" />}
                      <span className={sortBy !== opt.value ? "pl-5" : ""}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allCategories.map((cat) => {
              const isActive = selectedCategory === cat;
              const label = cat === "all" ? "All" : cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="mb-2 size-8 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">No products found</p>
              <p className="text-xs text-muted-foreground">Try a different search term or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {products.map((product) => {
                const isSelected = selected.has(product.id);
                const isDisabled = !isSelected && selected.size >= remainingSlots;
                const alreadyAdded = existingProductNames.includes(product.name);
                const hasSale = product.salePrice != null && product.salePrice < product.price;

                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={isDisabled || alreadyAdded || !product.inStock}
                  onClick={() => toggleProduct(product)}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/[0.04] shadow-sm"
                        : alreadyAdded
                          ? "cursor-not-allowed border-border bg-muted/20 opacity-50"
                          : isDisabled
                            ? "cursor-not-allowed border-border opacity-40"
                            : "border-border hover:border-primary/40 hover:shadow-sm"
                    )}
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="size-full object-cover transition-transform group-hover:scale-105"
                        crossOrigin="anonymous"
                      />
                      {isSelected && (
                        <div className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="size-3.5" />
                        </div>
                      )}
                      {hasSale && !alreadyAdded && product.inStock && (
                        <div className="absolute left-2 top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white shadow-sm">
                          SALE
                        </div>
                      )}
                      {alreadyAdded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Already added</span>
                        </div>
                      )}
                      {!product.inStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Out of stock</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-2.5">
                      <p className="line-clamp-2 text-xs font-medium leading-tight text-foreground">
                        {product.name}
                      </p>
                      {product.rating != null && (
                        <div className="flex items-center gap-1">
                          <Star className="size-2.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {product.rating} ({product.reviewCount ?? 0})
                          </span>
                        </div>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-0.5">
                        <div className="flex items-baseline gap-1">
                          {hasSale ? (
                            <>
                              <span className="text-xs font-bold tabular-nums text-red-600">
                                {formatSAR(product.salePrice!)}
                              </span>
                              <span className="text-xs tabular-nums text-muted-foreground line-through">
                                {formatSAR(product.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs font-bold tabular-nums text-foreground">
                              {formatSAR(product.price)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{product.sku}</span>
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums font-medium text-foreground">{selected.size}</span>
            <span>of {remainingSlots} slots selected</span>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="ml-1 text-xs text-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="gap-1.5"
            >
              <Plus className="size-3" />
              Add {selected.size} Product{selected.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
