"use client";

import { useState, useEffect } from "react";
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
import {
  Search,
  Check,
  Package,
  ShoppingBag,
  FolderOpen,
  FileText,
  X,
  Star,
  ExternalLink,
} from "lucide-react";
import {
  type SallaProduct,
  type SallaCategory,
  type SallaPage,
  fetchProducts,
  fetchCategoryDetails,
  fetchPages,
  formatSAR,
} from "@/lib/salla/store-api";

type PickerMode = "product" | "category" | "landing_page";

const MODE_CONFIG = {
  product: {
    icon: <ShoppingBag className="size-4 text-primary" />,
    title: "Select Product",
    description: "Choose a product to link your ad to",
    searchPlaceholder: "Search by name or SKU...",
    emptyIcon: <Package className="mb-2 size-8 text-muted-foreground" />,
    emptyTitle: "No products found",
    emptyHint: "Try a different search term.",
  },
  category: {
    icon: <FolderOpen className="size-4 text-primary" />,
    title: "Select Category",
    description: "Choose a category to link your ad to",
    searchPlaceholder: "Search categories...",
    emptyIcon: <FolderOpen className="mb-2 size-8 text-muted-foreground" />,
    emptyTitle: "No categories found",
    emptyHint: "Try a different search term.",
  },
  landing_page: {
    icon: <FileText className="size-4 text-primary" />,
    title: "Select Landing Page",
    description: "Choose a page to link your ad to",
    searchPlaceholder: "Search pages...",
    emptyIcon: <FileText className="mb-2 size-8 text-muted-foreground" />,
    emptyTitle: "No pages found",
    emptyHint: "Try a different search term.",
  },
} as const;

export function LinkPickerSheet({
  open,
  onOpenChange,
  mode,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: PickerMode;
  onSelect: (url: string, label: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<SallaProduct[]>([]);
  const [categories, setCategories] = useState<SallaCategory[]>([]);
  const [pages, setPages] = useState<SallaPage[]>([]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setLoading(true);
    if (mode === "product") {
      fetchProducts({ pageSize: 50, inStockOnly: true }).then((r) => {
        setProducts(r.products);
        setLoading(false);
      });
    } else if (mode === "category") {
      fetchCategoryDetails().then((r) => {
        setCategories(r);
        setLoading(false);
      });
    } else {
      fetchPages().then((r) => {
        setPages(r);
        setLoading(false);
      });
    }
  }, [open, mode]);

  const filteredProducts = search
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const filteredCategories = search
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  const filteredPages = search
    ? pages.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      )
    : pages;

  const config = MODE_CONFIG[mode];

  const handleSelect = (url: string, label: string) => {
    onSelect(url, label);
    onOpenChange(false);
  };

  const itemCount =
    mode === "product"
      ? filteredProducts.length
      : mode === "category"
        ? filteredCategories.length
        : filteredPages.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border px-5 pb-3 pt-5">
          <SheetTitle className="flex items-center gap-2 text-base">
            {config.icon}
            {config.title}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {config.description}
            {!loading && (
              <>
                {" "}
                &middot;{" "}
                <span className="font-medium text-foreground">
                  {itemCount}
                </span>{" "}
                {mode === "product"
                  ? "products"
                  : mode === "category"
                    ? "categories"
                    : "pages"}{" "}
                available
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="border-b border-border px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={config.searchPlaceholder}
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-3 text-xs text-muted-foreground">
                Loading...
              </p>
            </div>
          ) : mode === "product" ? (
            <ProductGrid
              products={filteredProducts}
              emptyIcon={config.emptyIcon}
              emptyTitle={config.emptyTitle}
              emptyHint={config.emptyHint}
              onSelect={handleSelect}
            />
          ) : mode === "category" ? (
            <CategoryList
              categories={filteredCategories}
              emptyIcon={config.emptyIcon}
              emptyTitle={config.emptyTitle}
              emptyHint={config.emptyHint}
              onSelect={handleSelect}
            />
          ) : (
            <PageList
              pages={filteredPages}
              emptyIcon={config.emptyIcon}
              emptyTitle={config.emptyTitle}
              emptyHint={config.emptyHint}
              onSelect={handleSelect}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Click an item to select it
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Grid                                                       */
/* ------------------------------------------------------------------ */

function ProductGrid({
  products,
  emptyIcon,
  emptyTitle,
  emptyHint,
  onSelect,
}: {
  products: SallaProduct[];
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyHint: string;
  onSelect: (url: string, label: string) => void;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {emptyIcon}
        <p className="text-sm font-medium text-muted-foreground">
          {emptyTitle}
        </p>
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {products.map((product) => {
        const hasSale =
          product.salePrice != null && product.salePrice < product.price;

        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(product.url, product.name)}
            className="group relative flex flex-col overflow-hidden rounded-xl border-2 border-border text-left transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name}
                className="size-full object-cover transition-transform group-hover:scale-105"
                crossOrigin="anonymous"
              />
              {hasSale && (
                <div className="absolute left-2 top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  SALE
                </div>
              )}
              {!product.inStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                    Out of stock
                  </span>
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Check className="size-4" />
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-1 p-2.5">
              <p className="line-clamp-2 text-xs font-medium leading-tight text-foreground">
                {product.name}
              </p>
              {product.rating != null && (
                <div className="flex items-center gap-1">
                  <Star className="size-2.5 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {product.rating}
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
                      <span className="text-[10px] tabular-nums text-muted-foreground line-through">
                        {formatSAR(product.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-bold tabular-nums text-foreground">
                      {formatSAR(product.price)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {product.sku}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Category List                                                      */
/* ------------------------------------------------------------------ */

function CategoryList({
  categories,
  emptyIcon,
  emptyTitle,
  emptyHint,
  onSelect,
}: {
  categories: SallaCategory[];
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyHint: string;
  onSelect: (url: string, label: string) => void;
}) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {emptyIcon}
        <p className="text-sm font-medium text-muted-foreground">
          {emptyTitle}
        </p>
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.url, cat.name)}
          className="group flex items-center gap-3 rounded-xl border-2 border-border px-4 py-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
        >
          <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cat.image}
              alt={cat.name}
              className="size-full object-cover transition-transform group-hover:scale-105"
              crossOrigin="anonymous"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{cat.name}</p>
            <p className="text-xs text-muted-foreground">
              {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground opacity-0 transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:opacity-100">
            <Check className="size-3.5" />
          </div>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page List                                                          */
/* ------------------------------------------------------------------ */

function PageList({
  pages,
  emptyIcon,
  emptyTitle,
  emptyHint,
  onSelect,
}: {
  pages: SallaPage[];
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyHint: string;
  onSelect: (url: string, label: string) => void;
}) {
  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {emptyIcon}
        <p className="text-sm font-medium text-muted-foreground">
          {emptyTitle}
        </p>
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {pages.map((page) => (
        <button
          key={page.id}
          type="button"
          onClick={() => onSelect(page.url, page.title)}
          className="group flex items-center gap-3 rounded-xl border-2 border-border px-4 py-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            {page.type === "landing" ? (
              <ExternalLink className="size-4 text-primary" />
            ) : (
              <FileText className="size-4 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{page.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {page.url}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                page.type === "landing"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {page.type === "landing" ? "Landing" : "Custom"}
            </span>
            <div className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground opacity-0 transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:opacity-100">
              <Check className="size-3.5" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
