/**
 * Salla Store API — typed service layer for accessing store data.
 *
 * In production, each function calls the real Salla API.
 * For prototyping, everything returns mock data through the same interface
 * so the UI is fully functional and the swap to real APIs is seamless.
 */

/* ------------------------------------------------------------------ */
/*  Shared Types                                                      */
/* ------------------------------------------------------------------ */

export interface SallaProduct {
  id: string;
  name: string;
  nameAr?: string;
  image: string;
  images?: string[];
  price: number;
  salePrice?: number;
  currency: string;
  url: string;
  sku: string;
  inStock: boolean;
  category: string;
  categoryAr?: string;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  createdAt?: string;
}

export interface SallaProductSet {
  id: string;
  name: string;
  nameAr?: string;
  productCount: number;
  description: string;
  descriptionAr?: string;
  /** Whether this set auto-refreshes based on rules */
  autoRefresh: boolean;
  /** Rule that generated this set (for smart sets) */
  sourceRule?: string;
  /** Preview of first 4 product images */
  previewImages?: string[];
  /** Seasonal tag for quick-start templates */
  seasonalTag?: string;
}

export interface SallaCatalogStatus {
  connected: boolean;
  storeName: string;
  storeNameAr?: string;
  totalProducts: number;
  activeProducts: number;
  productsWithImages: number;
  lastSyncAt: string;
  syncHealth: "healthy" | "warning" | "error";
  syncMessage?: string;
}

export interface SallaStoreInfo {
  id: string;
  name: string;
  nameAr?: string;
  domain: string;
  logo: string;
  currency: string;
  country: string;
  vatRate: number;
}

/**
 * Snapchat Public Profile linked through the Salla dashboard.
 * When the store owner has connected their Snap account via Salla,
 * this data is available and the profile ID is auto-filled.
 */
export interface SnapPublicProfile {
  /** Snap API profile_id (UUID) */
  profileId: string;
  /** Display name from Snapchat (e.g. store name / brand) */
  displayName: string;
  /** Optional Arabic display name */
  displayNameAr?: string;
  /** Profile avatar/logo URL */
  avatarUrl: string;
  /** Whether the profile is verified on Snapchat */
  verified: boolean;
}

/**
 * Snap Pixel connected through the advertiser's Snapchat Ads Manager account.
 * Retrieved after OAuth authentication — merchants cannot manually paste pixel IDs.
 */
export interface SnapPixelInfo {
  /** Snap Pixel ID (UUID) */
  pixelId: string;
  /** Display name set in Snapchat Ads Manager */
  name: string;
  /** Domain the pixel is installed on */
  domain: string;
  /** Pixel status */
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  /** When the pixel last fired an event */
  lastEventAt: string;
}

export interface ProductFetchOptions {
  query?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "best_selling" | "newest" | "price_asc" | "price_desc" | "rating";
  inStockOnly?: boolean;
}

export interface ProductFetchResult {
  products: SallaProduct[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                         */
/* ------------------------------------------------------------------ */

const MOCK_STORE_INFO: SallaStoreInfo = {
  id: "store_salla_001",
  name: "My Salla Store",
  nameAr: "متجري على سلة",
  domain: "store.salla.sa",
  logo: "https://images.unsplash.com/photo-1560472355-536de3962603?w=100&h=100&fit=crop",
  currency: "SAR",
  country: "SA",
  vatRate: 0.15,
};

const MOCK_SNAP_PROFILE: SnapPublicProfile = {
  profileId: "72cf5c50-8343-48d3-a0a7-3ed45b75faaa",
  displayName: "Mahally",
  displayNameAr: "محلي",
  avatarUrl: "https://images.unsplash.com/photo-1560472355-536de3962603?w=100&h=100&fit=crop",
  verified: true,
};

const MOCK_SNAP_PIXEL: SnapPixelInfo = {
  pixelId: "abc12345-1234-1234-1234-abc123456789",
  name: "Mahally Store Pixel",
  domain: "mahally.salla.sa",
  status: "ACTIVE",
  lastEventAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
};

const MOCK_PRODUCTS: SallaProduct[] = [
  { id: "p1", name: "Classic White T-Shirt", nameAr: "تيشيرت أبيض كلاسيكي", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop", price: 89, currency: "SAR", url: "https://store.salla.sa/product/classic-white-tshirt", sku: "TS-001", inStock: true, category: "Clothing", categoryAr: "ملابس", rating: 4.5, reviewCount: 124, soldCount: 890, createdAt: "2025-11-01" },
  { id: "p2", name: "Premium Leather Watch", nameAr: "ساعة جلد فاخرة", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop", price: 450, salePrice: 380, currency: "SAR", url: "https://store.salla.sa/product/leather-watch", sku: "WA-002", inStock: true, category: "Accessories", categoryAr: "إكسسوارات", rating: 4.8, reviewCount: 67, soldCount: 340, createdAt: "2025-09-15" },
  { id: "p3", name: "Running Sneakers", nameAr: "حذاء رياضي للجري", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", price: 320, currency: "SAR", url: "https://store.salla.sa/product/running-sneakers", sku: "SH-003", inStock: true, category: "Shoes", categoryAr: "أحذية", rating: 4.3, reviewCount: 89, soldCount: 560, createdAt: "2025-10-20" },
  { id: "p4", name: "Wireless Earbuds Pro", nameAr: "سماعات لاسلكية برو", image: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop", price: 199, currency: "SAR", url: "https://store.salla.sa/product/wireless-earbuds", sku: "EL-004", inStock: true, category: "Electronics", categoryAr: "إلكترونيات", rating: 4.6, reviewCount: 203, soldCount: 1250, createdAt: "2025-08-10" },
  { id: "p5", name: "Minimalist Backpack", nameAr: "حقيبة ظهر بسيطة", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop", price: 175, currency: "SAR", url: "https://store.salla.sa/product/minimalist-backpack", sku: "BG-005", inStock: true, category: "Bags", categoryAr: "حقائب", rating: 4.1, reviewCount: 45, soldCount: 210, createdAt: "2025-12-01" },
  { id: "p6", name: "Organic Coffee Beans 1kg", nameAr: "قهوة عضوية 1 كيلو", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop", price: 95, currency: "SAR", url: "https://store.salla.sa/product/organic-coffee", sku: "FD-006", inStock: true, category: "Food", categoryAr: "أغذية", rating: 4.9, reviewCount: 312, soldCount: 2100, createdAt: "2025-07-22" },
  { id: "p7", name: "Silk Scarf Collection", nameAr: "مجموعة أوشحة حرير", image: "https://images.unsplash.com/photo-1601924921557-06d2a8a4eda6?w=400&h=400&fit=crop", price: 140, currency: "SAR", url: "https://store.salla.sa/product/silk-scarf", sku: "AC-007", inStock: true, category: "Accessories", categoryAr: "إكسسوارات", rating: 4.4, reviewCount: 56, soldCount: 380, createdAt: "2025-10-05" },
  { id: "p8", name: "Ceramic Mug Set (4 pcs)", nameAr: "طقم أكواب سيراميك (4 قطع)", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop", price: 65, currency: "SAR", url: "https://store.salla.sa/product/ceramic-mug-set", sku: "HM-008", inStock: true, category: "Home", categoryAr: "المنزل", rating: 4.2, reviewCount: 78, soldCount: 620, createdAt: "2025-11-18" },
  { id: "p9", name: "Denim Jacket", nameAr: "جاكيت جينز", image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=400&fit=crop", price: 280, currency: "SAR", url: "https://store.salla.sa/product/denim-jacket", sku: "CL-009", inStock: true, category: "Clothing", categoryAr: "ملابس", rating: 4.7, reviewCount: 92, soldCount: 450, createdAt: "2025-09-30" },
  { id: "p10", name: "Sunglasses Aviator", nameAr: "نظارات شمسية أفياتور", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop", price: 210, currency: "SAR", url: "https://store.salla.sa/product/aviator-sunglasses", sku: "AC-010", inStock: false, category: "Accessories", categoryAr: "إكسسوارات", rating: 4.0, reviewCount: 34, soldCount: 180, createdAt: "2025-06-12" },
  { id: "p11", name: "Yoga Mat Premium", nameAr: "سجادة يوغا فاخرة", image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop", price: 120, currency: "SAR", url: "https://store.salla.sa/product/yoga-mat", sku: "SP-011", inStock: true, category: "Sports", categoryAr: "رياضة", rating: 4.3, reviewCount: 61, soldCount: 290, createdAt: "2025-10-14" },
  { id: "p12", name: "Perfume Oud Collection", nameAr: "مجموعة عطور العود", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop", price: 550, salePrice: 449, currency: "SAR", url: "https://store.salla.sa/product/oud-perfume", sku: "PF-012", inStock: true, category: "Perfume", categoryAr: "عطور", rating: 4.9, reviewCount: 187, soldCount: 980, createdAt: "2025-08-28" },
  { id: "p13", name: "Arabic Calligraphy Frame", nameAr: "إطار خط عربي", image: "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=400&h=400&fit=crop", price: 185, currency: "SAR", url: "https://store.salla.sa/product/calligraphy-frame", sku: "HM-013", inStock: true, category: "Home", categoryAr: "المنزل", rating: 4.6, reviewCount: 41, soldCount: 165, createdAt: "2025-12-10" },
  { id: "p14", name: "Bakhoor Incense Set", nameAr: "طقم بخور فاخر", image: "https://images.unsplash.com/photo-1600891964599-f94e5e5e2c14?w=400&h=400&fit=crop", price: 135, currency: "SAR", url: "https://store.salla.sa/product/bakhoor-set", sku: "PF-014", inStock: true, category: "Perfume", categoryAr: "عطور", rating: 4.8, reviewCount: 156, soldCount: 870, createdAt: "2025-09-05" },
  { id: "p15", name: "Prayer Rug Luxury", nameAr: "سجادة صلاة فاخرة", image: "https://images.unsplash.com/photo-1585036156171-384164a8c159?w=400&h=400&fit=crop", price: 240, salePrice: 199, currency: "SAR", url: "https://store.salla.sa/product/prayer-rug", sku: "HM-015", inStock: true, category: "Home", categoryAr: "المنزل", rating: 4.7, reviewCount: 213, soldCount: 1450, createdAt: "2025-02-15" },
  { id: "p16", name: "Dates Gift Box Premium", nameAr: "علبة تمور فاخرة", image: "https://images.unsplash.com/photo-1590080876351-941da357b39e?w=400&h=400&fit=crop", price: 320, currency: "SAR", url: "https://store.salla.sa/product/dates-gift-box", sku: "FD-016", inStock: true, category: "Food", categoryAr: "أغذية", rating: 4.9, reviewCount: 289, soldCount: 2300, createdAt: "2025-01-20" },
];

const MOCK_CATEGORIES = [...new Set(MOCK_PRODUCTS.map((p) => p.category))];

/**
 * Synchronous access to preview products for components that render
 * product imagery in ad previews (no async needed for mock data).
 */
export const PREVIEW_PRODUCTS: readonly SallaProduct[] = MOCK_PRODUCTS;

/* ------------------------------------------------------------------ */
/*  Public API Functions                                              */
/* ------------------------------------------------------------------ */

/** Get store info (name, domain, currency, VAT rate) */
export async function getStoreInfo(): Promise<SallaStoreInfo> {
  return MOCK_STORE_INFO;
}

/** Fetch products with filtering, search, pagination, and sorting */
export async function fetchProducts(opts: ProductFetchOptions = {}): Promise<ProductFetchResult> {
  const { query, category, page = 1, pageSize = 12, sortBy = "best_selling", inStockOnly = false } = opts;

  let filtered = [...MOCK_PRODUCTS];

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.nameAr?.includes(q) || p.sku.toLowerCase().includes(q));
  }
  if (category && category !== "All") {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (inStockOnly) {
    filtered = filtered.filter((p) => p.inStock);
  }

  switch (sortBy) {
    case "best_selling": filtered.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0)); break;
    case "newest": filtered.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")); break;
    case "price_asc": filtered.sort((a, b) => a.price - b.price); break;
    case "price_desc": filtered.sort((a, b) => b.price - a.price); break;
    case "rating": filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
  }

  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return { products: paged, total: filtered.length, page, pageSize, hasMore: start + pageSize < filtered.length };
}

/** Get all product categories */
export async function getCategories(): Promise<string[]> {
  return MOCK_CATEGORIES;
}

/** Get best-selling products (for quick-collection builder) */
export async function fetchBestSellers(limit = 4): Promise<SallaProduct[]> {
  const sorted = [...MOCK_PRODUCTS].filter((p) => p.inStock).sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
  return sorted.slice(0, limit);
}

/** Get newest products */
export async function fetchNewArrivals(limit = 4): Promise<SallaProduct[]> {
  const sorted = [...MOCK_PRODUCTS].filter((p) => p.inStock).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return sorted.slice(0, limit);
}

/** Get products on sale */
export async function fetchOnSale(limit = 4): Promise<SallaProduct[]> {
  return MOCK_PRODUCTS.filter((p) => p.salePrice != null && p.inStock).slice(0, limit);
}

/** Look up a product by its store URL (for smart auto-fill) */
export async function lookupProductByUrl(url: string): Promise<SallaProduct | null> {
  const match = MOCK_PRODUCTS.find((p) => url.includes(p.url) || url.includes(p.sku.toLowerCase()));
  return match ?? null;
}

/**
 * Get the Snapchat Public Profile linked via Salla dashboard.
 * Returns null if the store owner hasn't connected their Snap account.
 */
export async function getSnapPublicProfile(): Promise<SnapPublicProfile | null> {
  return MOCK_SNAP_PROFILE;
}

/**
 * Get the Snap Pixel connected via the advertiser's Snapchat Ads Manager.
 * Returns null if no pixel has been connected through OAuth.
 */
export async function getSnapPixel(): Promise<SnapPixelInfo | null> {
  return MOCK_SNAP_PIXEL;
}

/** Get catalog sync status */
export async function getCatalogStatus(): Promise<SallaCatalogStatus> {
  const active = MOCK_PRODUCTS.filter((p) => p.inStock).length;
  const withImages = MOCK_PRODUCTS.filter((p) => p.image).length;
  return {
    connected: true,
    storeName: MOCK_STORE_INFO.name,
    storeNameAr: MOCK_STORE_INFO.nameAr,
    totalProducts: MOCK_PRODUCTS.length,
    activeProducts: active,
    productsWithImages: withImages,
    lastSyncAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 min ago
    syncHealth: withImages >= active * 0.9 ? "healthy" : withImages >= active * 0.7 ? "warning" : "error",
    syncMessage: withImages < active ? `${active - withImages} products missing images` : undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  Formatting Utilities                                              */
/* ------------------------------------------------------------------ */

/** Format price in SAR with Arabic-friendly display */
export function formatSAR(amount: number, opts?: { showCurrency?: boolean; compact?: boolean }): string {
  const { showCurrency = true, compact = false } = opts ?? {};
  if (compact) {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M${showCurrency ? " SAR" : ""}`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(amount >= 10_000 ? 0 : 1)}K${showCurrency ? " SAR" : ""}`;
  }
  const formatted = new Intl.NumberFormat("en-SA", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
  return showCurrency ? `${formatted} SAR` : formatted;
}

/** Calculate VAT amount (15% Saudi VAT) */
export function calculateVAT(amount: number): number {
  return amount * MOCK_STORE_INFO.vatRate;
}

/** Check if a URL belongs to the advertiser's Salla store */
export function isSallaStoreUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("salla.sa") || parsed.hostname.includes(MOCK_STORE_INFO.domain);
  } catch {
    return false;
  }
}
