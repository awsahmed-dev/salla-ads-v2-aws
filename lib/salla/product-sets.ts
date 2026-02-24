/**
 * Product Set definitions for Salla stores.
 *
 * Product sets are groups of products used for Dynamic Ads, Collection Ads,
 * and catalog-powered campaigns. Includes Saudi-market seasonal sets.
 */

import type { SallaProductSet } from "./store-api";

/* ------------------------------------------------------------------ */
/*  Standard Product Sets (always available)                          */
/* ------------------------------------------------------------------ */

export const STANDARD_PRODUCT_SETS: SallaProductSet[] = [
  {
    id: "ps_all",
    name: "All Products",
    nameAr: "جميع المنتجات",
    productCount: 156,
    description: "All active products synced from your Salla store",
    descriptionAr: "جميع المنتجات النشطة من متجرك على سلة",
    autoRefresh: true,
    sourceRule: "status = active",
    previewImages: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=100&h=100&fit=crop",
    ],
  },
  {
    id: "ps_best",
    name: "Best Sellers",
    nameAr: "الأكثر مبيعاً",
    productCount: 24,
    description: "Top performing products by sales volume in the last 90 days",
    descriptionAr: "المنتجات الأكثر مبيعاً خلال آخر 90 يوم",
    autoRefresh: true,
    sourceRule: "sort_by = sold_count DESC, limit = 24",
    previewImages: [
      "https://images.unsplash.com/photo-1590080876351-941da357b39e?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1585036156171-384164a8c159?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=100&h=100&fit=crop",
    ],
  },
  {
    id: "ps_new",
    name: "New Arrivals",
    nameAr: "وصل حديثاً",
    productCount: 18,
    description: "Products added in the last 30 days",
    descriptionAr: "المنتجات المضافة خلال آخر 30 يوم",
    autoRefresh: true,
    sourceRule: "created_at >= now() - 30d",
    previewImages: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1601924921557-06d2a8a4eda6?w=100&h=100&fit=crop",
    ],
  },
  {
    id: "ps_sale",
    name: "On Sale",
    nameAr: "عروض وتخفيضات",
    productCount: 32,
    description: "Products with active discounts and promotions",
    descriptionAr: "المنتجات التي عليها خصومات وعروض",
    autoRefresh: true,
    sourceRule: "sale_price IS NOT NULL AND sale_price < price",
    previewImages: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1585036156171-384164a8c159?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100&h=100&fit=crop",
    ],
  },
  {
    id: "ps_high_margin",
    name: "High Margin",
    nameAr: "أعلى هامش ربح",
    productCount: 15,
    description: "Products with the highest profit margin",
    descriptionAr: "المنتجات ذات هامش الربح الأعلى",
    autoRefresh: true,
    sourceRule: "margin_pct DESC, limit = 15",
  },
  {
    id: "ps_restock",
    name: "Recently Restocked",
    nameAr: "عادت للمخزون",
    productCount: 8,
    description: "Products back in stock — great for retargeting ads",
    descriptionAr: "منتجات عادت للمخزون — ممتازة لإعادة الاستهداف",
    autoRefresh: true,
    sourceRule: "restocked_at >= now() - 7d",
  },
  {
    id: "ps_abandoned",
    name: "Abandoned Cart Products",
    nameAr: "منتجات السلة المتروكة",
    productCount: 42,
    description: "Products frequently added to cart but not purchased — ideal for retargeting",
    descriptionAr: "منتجات يتم إضافتها للسلة بكثرة دون شراء — مثالية لإعادة الاستهداف",
    autoRefresh: true,
    sourceRule: "cart_abandonment_rate DESC, limit = 42",
  },
  {
    id: "ps_most_viewed",
    name: "Most Viewed",
    nameAr: "الأكثر مشاهدة",
    productCount: 20,
    description: "Products with the highest page views in the last 30 days",
    descriptionAr: "المنتجات الأكثر زيارة خلال آخر 30 يوم",
    autoRefresh: true,
    sourceRule: "page_views DESC, period = 30d, limit = 20",
  },
];

/* ------------------------------------------------------------------ */
/*  Category-based Product Sets                                       */
/* ------------------------------------------------------------------ */

export const CATEGORY_PRODUCT_SETS: SallaProductSet[] = [
  { id: "ps_cat_clothing", name: "Clothing & Fashion", nameAr: "ملابس وأزياء", productCount: 45, description: "Clothing and fashion items", descriptionAr: "ملابس ومنتجات أزياء", autoRefresh: true, sourceRule: "category = Clothing" },
  { id: "ps_cat_electronics", name: "Electronics", nameAr: "إلكترونيات", productCount: 28, description: "Electronics and gadgets", descriptionAr: "أجهزة إلكترونية", autoRefresh: true, sourceRule: "category = Electronics" },
  { id: "ps_cat_accessories", name: "Accessories", nameAr: "إكسسوارات", productCount: 35, description: "Accessories and jewelry", descriptionAr: "إكسسوارات ومجوهرات", autoRefresh: true, sourceRule: "category = Accessories" },
  { id: "ps_cat_perfume", name: "Perfume & Oud", nameAr: "عطور وعود", productCount: 22, description: "Fragrances, oud, and bakhoor", descriptionAr: "عطور وعود وبخور", autoRefresh: true, sourceRule: "category IN (Perfume, Oud)" },
  { id: "ps_cat_home", name: "Home & Living", nameAr: "المنزل والمعيشة", productCount: 30, description: "Home decor and living essentials", descriptionAr: "ديكور المنزل ومستلزمات المعيشة", autoRefresh: true, sourceRule: "category = Home" },
  { id: "ps_cat_food", name: "Food & Beverages", nameAr: "أطعمة ومشروبات", productCount: 18, description: "Food items, dates, coffee, and beverages", descriptionAr: "أغذية وتمور وقهوة ومشروبات", autoRefresh: true, sourceRule: "category = Food" },
];

/* ------------------------------------------------------------------ */
/*  Seasonal Product Sets (Saudi market)                              */
/* ------------------------------------------------------------------ */

export const SEASONAL_PRODUCT_SETS: SallaProductSet[] = [
  {
    id: "ps_ramadan",
    name: "Ramadan Collection",
    nameAr: "تشكيلة رمضان",
    productCount: 36,
    description: "Curated products for Ramadan — gifts, dates, prayer items, home decor",
    descriptionAr: "منتجات مختارة لرمضان — هدايا وتمور وأدوات صلاة وديكور",
    autoRefresh: false,
    sourceRule: "tag = ramadan",
    seasonalTag: "ramadan",
    previewImages: [
      "https://images.unsplash.com/photo-1590080876351-941da357b39e?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1585036156171-384164a8c159?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1600891964599-f94e5e5e2c14?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=100&h=100&fit=crop",
    ],
  },
  {
    id: "ps_eid_fitr",
    name: "Eid al-Fitr Gifts",
    nameAr: "هدايا عيد الفطر",
    productCount: 28,
    description: "Gift sets and celebration items for Eid al-Fitr",
    descriptionAr: "أطقم هدايا ومنتجات احتفالية لعيد الفطر",
    autoRefresh: false,
    sourceRule: "tag = eid_fitr",
    seasonalTag: "eid_fitr",
  },
  {
    id: "ps_eid_adha",
    name: "Eid al-Adha Collection",
    nameAr: "تشكيلة عيد الأضحى",
    productCount: 22,
    description: "Products for Eid al-Adha celebrations and gifts",
    descriptionAr: "منتجات لاحتفالات عيد الأضحى والهدايا",
    autoRefresh: false,
    sourceRule: "tag = eid_adha",
    seasonalTag: "eid_adha",
  },
  {
    id: "ps_national_day",
    name: "Saudi National Day",
    nameAr: "اليوم الوطني السعودي",
    productCount: 15,
    description: "Special products for Saudi National Day (September 23)",
    descriptionAr: "منتجات خاصة باليوم الوطني السعودي (23 سبتمبر)",
    autoRefresh: false,
    sourceRule: "tag = national_day",
    seasonalTag: "national_day",
  },
  {
    id: "ps_white_friday",
    name: "White Friday Deals",
    nameAr: "عروض الجمعة البيضاء",
    productCount: 50,
    description: "Biggest discounts of the year — White Friday sale products",
    descriptionAr: "أكبر تخفيضات السنة — منتجات الجمعة البيضاء",
    autoRefresh: false,
    sourceRule: "tag = white_friday AND sale_price IS NOT NULL",
    seasonalTag: "white_friday",
  },
  {
    id: "ps_year_end",
    name: "Year-End Sale",
    nameAr: "تخفيضات نهاية السنة",
    productCount: 40,
    description: "End-of-year clearance and holiday specials",
    descriptionAr: "تصفية نهاية السنة وعروض الأعياد",
    autoRefresh: false,
    sourceRule: "tag = year_end_sale",
    seasonalTag: "year_end",
  },
  {
    id: "ps_back_to_school",
    name: "Back to School",
    nameAr: "العودة للمدارس",
    productCount: 25,
    description: "School supplies, bags, electronics, and essentials",
    descriptionAr: "مستلزمات مدرسية وحقائب وأجهزة إلكترونية",
    autoRefresh: false,
    sourceRule: "tag = back_to_school",
    seasonalTag: "back_to_school",
  },
];

/* ------------------------------------------------------------------ */
/*  Aggregated fetch function                                         */
/* ------------------------------------------------------------------ */

export type ProductSetCategory = "standard" | "category" | "seasonal" | "all";

/** Fetch all product sets, optionally filtered by category */
export async function fetchProductSets(filter: ProductSetCategory = "all"): Promise<SallaProductSet[]> {
  switch (filter) {
    case "standard": return STANDARD_PRODUCT_SETS;
    case "category": return CATEGORY_PRODUCT_SETS;
    case "seasonal": return SEASONAL_PRODUCT_SETS;
    case "all": return [...STANDARD_PRODUCT_SETS, ...CATEGORY_PRODUCT_SETS, ...SEASONAL_PRODUCT_SETS];
  }
}

/** Get a single product set by ID */
export async function getProductSetById(id: string): Promise<SallaProductSet | null> {
  const all = [...STANDARD_PRODUCT_SETS, ...CATEGORY_PRODUCT_SETS, ...SEASONAL_PRODUCT_SETS];
  return all.find((s) => s.id === id) ?? null;
}
