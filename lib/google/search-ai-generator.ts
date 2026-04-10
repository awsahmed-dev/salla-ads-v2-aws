/**
 * Search Campaign AI Draft Generator
 *
 * Generates Search campaign content (headlines, descriptions, keywords,
 * sitelinks, callouts, structured snippets) from Salla store data.
 *
 * Uses the same store-api service layer as PMax's buildAiTextDraft()
 * but tailored to RSA constraints (30-char headlines, 90-char descriptions,
 * keyword match types, ad extension formats).
 */

import type { KeywordMatchType, SearchSitelinkAsset, SearchCalloutAsset, SearchStructuredSnippet, SearchPriceAsset, SearchPromotionAsset, SearchAdGroup, SearchKeyword, GoogleSearchAd, RSAHeadline, RSADescription } from "@/lib/google/campaign-types";
import { getStoreInfo, fetchBestSellers, fetchNewArrivals, fetchOnSale, getCategories, type SallaProduct, type SallaStoreInfo } from "@/lib/salla/store-api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GeneratedKeyword {
  text: string;
  matchType: KeywordMatchType;
  source: "product" | "category" | "brand" | "intent";
  group: string;
}

export interface GeneratedHeadline {
  text: string;
  source: string;
}

export interface GeneratedDescription {
  text: string;
  source: string;
}

export interface SearchAiDraft {
  headlines: GeneratedHeadline[];
  descriptions: GeneratedDescription[];
  keywords: GeneratedKeyword[];
  negativeKeywords: string[];
  sitelinks: SearchSitelinkAsset[];
  callouts: string[];
  snippets: SearchStructuredSnippet[];
  displayPath1: string;
  displayPath2: string;
  finalUrl: string;
  campaignName: string;
}

export interface StoreSnapshot {
  store: SallaStoreInfo;
  bestSellers: SallaProduct[];
  newArrivals: SallaProduct[];
  onSale: SallaProduct[];
  categories: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Truncate text to max length, adding ... if truncated */
function trunc(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

/** Truncate text to max length, hard cut (no ellipsis) for char-limited fields */
function hardTrunc(text: string, max: number): string {
  return text.slice(0, max).trimEnd();
}

/** Deduplicate by text content (case-insensitive) */
function dedup<T extends { text: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.text.toLowerCase().trim();
    if (seen.has(key) || !key) return false;
    seen.add(key);
    return true;
  });
}

/** Get discount percentage */
function discountPct(product: SallaProduct): number | null {
  if (!product.salePrice || product.salePrice >= product.price) return null;
  return Math.round(((product.price - product.salePrice) / product.price) * 100);
}

/** Current month name */
function currentMonth(): string {
  return new Date().toLocaleString("en", { month: "short" });
}

/** Current year */
function currentYear(): number {
  return new Date().getFullYear();
}

/** Generate a unique ID */
function uid(): string {
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ------------------------------------------------------------------ */
/*  Data Fetcher                                                       */
/* ------------------------------------------------------------------ */

let cachedSnapshot: StoreSnapshot | null = null;

export async function getStoreSnapshot(): Promise<StoreSnapshot> {
  if (cachedSnapshot) return cachedSnapshot;

  const [store, bestSellers, newArrivals, onSale, categories] = await Promise.all([
    getStoreInfo(),
    fetchBestSellers(8),
    fetchNewArrivals(6),
    fetchOnSale(6),
    getCategories(),
  ]);

  cachedSnapshot = { store, bestSellers, newArrivals, onSale, categories };
  return cachedSnapshot;
}

/** Clear cached data (for testing) */
export function clearSnapshotCache(): void {
  cachedSnapshot = null;
}

/* ------------------------------------------------------------------ */
/*  Campaign Name Generator                                            */
/* ------------------------------------------------------------------ */

export function generateCampaignName(store: SallaStoreInfo, categories: string[]): string {
  const topCategory = categories[0] ?? "Products";
  return `${store.name} - Search - ${topCategory} - ${currentMonth()} ${currentYear()}`;
}

/* ------------------------------------------------------------------ */
/*  Keyword Generator                                                  */
/* ------------------------------------------------------------------ */

export function generateKeywords(snapshot: StoreSnapshot): GeneratedKeyword[] {
  const { store, bestSellers, categories } = snapshot;
  const keywords: GeneratedKeyword[] = [];

  // 1. Brand keywords
  keywords.push(
    { text: store.name, matchType: "EXACT", source: "brand", group: "Brand" },
    { text: `${store.name} store`, matchType: "BROAD", source: "brand", group: "Brand" },
    { text: `shop ${store.name}`, matchType: "BROAD", source: "brand", group: "Brand" },
    { text: `${store.name} online`, matchType: "PHRASE", source: "brand", group: "Brand" },
  );

  // 2. Category keywords (with commercial intent)
  for (const cat of categories.slice(0, 6)) {
    keywords.push(
      { text: `buy ${cat.toLowerCase()} online`, matchType: "BROAD", source: "category", group: `Category: ${cat}` },
      { text: `${cat.toLowerCase()} store`, matchType: "PHRASE", source: "category", group: `Category: ${cat}` },
      { text: `${cat.toLowerCase()} saudi arabia`, matchType: "BROAD", source: "category", group: `Category: ${cat}` },
      { text: `best ${cat.toLowerCase()} price`, matchType: "BROAD", source: "category", group: `Category: ${cat}` },
      { text: `order ${cat.toLowerCase()}`, matchType: "BROAD", source: "category", group: `Category: ${cat}` },
    );
  }

  // 3. Product keywords (from best sellers)
  for (const product of bestSellers.slice(0, 6)) {
    const name = product.name.toLowerCase();
    if (name.length <= 60) {
      keywords.push(
        { text: name, matchType: "PHRASE", source: "product", group: "Products" },
        { text: `buy ${name}`, matchType: "BROAD", source: "product", group: "Products" },
      );
    }
  }

  // 4. Commercial intent templates
  const intentTemplates = [
    "free shipping", "best deals", "online shopping", "fast delivery",
    "original products", "cash on delivery", "new arrivals",
  ];
  for (const term of intentTemplates) {
    keywords.push({ text: term, matchType: "BROAD", source: "intent", group: "Shopping Intent" });
  }

  return dedup(keywords);
}

/* ------------------------------------------------------------------ */
/*  Negative Keywords Generator                                        */
/* ------------------------------------------------------------------ */

export function generateNegativeKeywords(): string[] {
  return [
    "free", "used", "cheap", "wholesale", "DIY", "repair",
    "tutorial", "how to", "download", "pdf", "jobs", "career",
    "sample", "template", "course", "class", "training",
  ];
}

/* ------------------------------------------------------------------ */
/*  Headlines Generator (30 chars max)                                 */
/* ------------------------------------------------------------------ */

export function generateHeadlines(snapshot: StoreSnapshot, category?: string): GeneratedHeadline[] {
  const { store, bestSellers, newArrivals, onSale, categories } = snapshot;
  const cat = category ?? categories[0] ?? "Products";
  const headlines: GeneratedHeadline[] = [];

  // Brand headlines
  headlines.push(
    { text: hardTrunc(`${store.name} Official Store`, 30), source: "Brand" },
    { text: hardTrunc(`Shop ${store.name} Online`, 30), source: "Brand" },
    { text: hardTrunc(`${store.name} - ${cat}`, 30), source: "Brand + Category" },
  );

  // Category headlines
  headlines.push(
    { text: hardTrunc(`${cat} at ${store.name}`, 30), source: "Category" },
    { text: hardTrunc(`Shop ${cat} Online`, 30), source: "Category" },
    { text: hardTrunc(`Best ${cat} Deals`, 30), source: "Category" },
    { text: hardTrunc(`New ${cat} Collection`, 30), source: "Category" },
    { text: hardTrunc(`Top Rated ${cat}`, 30), source: "Category" },
    { text: hardTrunc(`Order ${cat} Now`, 30), source: "Category" },
  );

  // Product headlines (from best sellers)
  for (const p of bestSellers.slice(0, 4)) {
    headlines.push({ text: hardTrunc(`Shop ${p.name}`, 30), source: `Product: ${p.name}` });
    const disc = discountPct(p);
    if (disc) {
      headlines.push({ text: hardTrunc(`${disc}% Off ${p.name}`, 30), source: `Sale: ${p.name}` });
    }
  }

  // Benefit headlines
  headlines.push(
    { text: hardTrunc(`Free Shipping on ${cat}`, 30), source: "Benefit" },
    { text: hardTrunc(`Secure Checkout · ${store.name}`, 30), source: "Trust" },
    { text: hardTrunc(`Fast Delivery in Saudi`, 30), source: "Benefit" },
  );

  // Social proof
  const topRated = bestSellers.find((p) => p.rating && p.rating >= 4.5);
  if (topRated?.rating) {
    headlines.push({ text: hardTrunc(`${topRated.rating}★ Rated ${cat}`, 30), source: "Social Proof" });
  }

  // On-sale headlines
  if (onSale.length > 0) {
    const maxDisc = Math.max(...onSale.map((p) => discountPct(p) ?? 0));
    if (maxDisc > 0) {
      headlines.push({ text: hardTrunc(`Save Up to ${maxDisc}% Off`, 30), source: "Sale" });
    }
  }

  // New arrivals
  if (newArrivals.length > 0) {
    headlines.push({ text: hardTrunc(`New Arrivals - ${cat}`, 30), source: "New Arrivals" });
  }

  return dedup(headlines).slice(0, 15);
}

/* ------------------------------------------------------------------ */
/*  Descriptions Generator (90 chars max)                              */
/* ------------------------------------------------------------------ */

export function generateDescriptions(snapshot: StoreSnapshot, category?: string): GeneratedDescription[] {
  const { store, bestSellers, onSale, categories } = snapshot;
  const cat = category ?? categories[0] ?? "Products";
  const descriptions: GeneratedDescription[] = [];

  // Core description
  const totalSold = bestSellers.reduce((s, p) => s + (p.soldCount ?? 0), 0);
  descriptions.push({
    text: hardTrunc(`Shop ${cat} from ${store.name}. ${totalSold > 0 ? `${totalSold}+ orders.` : ""} Free shipping & secure checkout.`, 90),
    source: "Core",
  });

  // Product showcase
  const topTwo = bestSellers.slice(0, 2).map((p) => p.name);
  if (topTwo.length === 2) {
    descriptions.push({
      text: hardTrunc(`Discover ${topTwo[0]}, ${topTwo[1]} & more. Trusted Saudi store.`, 90),
      source: "Product Showcase",
    });
  }

  // Social proof
  const avgRating = bestSellers.filter((p) => p.rating).reduce((s, p, _, a) => s + (p.rating ?? 0) / a.length, 0);
  const totalReviews = bestSellers.reduce((s, p) => s + (p.reviewCount ?? 0), 0);
  if (avgRating > 0 && totalReviews > 0) {
    descriptions.push({
      text: hardTrunc(`Rated ${avgRating.toFixed(1)}/5 by ${totalReviews}+ customers. Fast delivery across Saudi Arabia.`, 90),
      source: "Social Proof",
    });
  }

  // Sale description
  if (onSale.length > 0) {
    const maxDisc = Math.max(...onSale.map((p) => discountPct(p) ?? 0));
    descriptions.push({
      text: hardTrunc(`Save up to ${maxDisc}% on ${cat}. Browse ${onSale.length}+ sale items. Limited time offer.`, 90),
      source: "Sale",
    });
  }

  return dedup(descriptions).slice(0, 4);
}

/* ------------------------------------------------------------------ */
/*  Sitelinks Generator                                                */
/* ------------------------------------------------------------------ */

export function generateSitelinks(snapshot: StoreSnapshot): SearchSitelinkAsset[] {
  const { store, categories, onSale, bestSellers } = snapshot;
  const domain = store.domain.startsWith("http") ? store.domain : `https://${store.domain}`;
  const sitelinks: SearchSitelinkAsset[] = [];

  // Best Sellers
  if (bestSellers.length > 0) {
    sitelinks.push({
      id: uid(),
      linkText: "Best Sellers",
      description1: "Shop our most popular products",
      description2: `${bestSellers.length}+ top-rated items`,
      finalUrl: `${domain}/best-sellers`,
    });
  }

  // New Arrivals
  sitelinks.push({
    id: uid(),
    linkText: "New Arrivals",
    description1: "Fresh additions to our store",
    description2: "Updated weekly",
    finalUrl: `${domain}/new-arrivals`,
  });

  // On Sale
  if (onSale.length > 0) {
    const maxDisc = Math.max(...onSale.map((p) => discountPct(p) ?? 0));
    sitelinks.push({
      id: uid(),
      linkText: "On Sale",
      description1: `Save up to ${maxDisc}% off`,
      description2: `${onSale.length}+ items on sale`,
      finalUrl: `${domain}/sale`,
    });
  }

  // Top categories as sitelinks
  for (const cat of categories.slice(0, 3)) {
    sitelinks.push({
      id: uid(),
      linkText: hardTrunc(cat, 25),
      description1: hardTrunc(`Browse ${cat} collection`, 35),
      description2: "Free shipping available",
      finalUrl: `${domain}/c/${cat.toLowerCase().replace(/\s+/g, "-")}`,
    });
  }

  return sitelinks.slice(0, 6);
}

/* ------------------------------------------------------------------ */
/*  Callouts Generator                                                 */
/* ------------------------------------------------------------------ */

export function generateCallouts(): string[] {
  return [
    "Free Shipping",
    "Secure Checkout",
    "Fast Delivery",
    "100% Original",
    "Cash on Delivery",
    "Easy Returns",
    "24/7 Support",
    "Saudi Store",
  ];
}

/* ------------------------------------------------------------------ */
/*  Structured Snippets Generator                                      */
/* ------------------------------------------------------------------ */

export function generateSnippets(snapshot: StoreSnapshot): SearchStructuredSnippet[] {
  const { categories } = snapshot;
  const snippets: SearchStructuredSnippet[] = [];

  if (categories.length >= 3) {
    snippets.push({
      id: uid(),
      header: "Types",
      values: categories.slice(0, 8).map((c) => hardTrunc(c, 25)),
    });
  }

  return snippets;
}

/* ------------------------------------------------------------------ */
/*  Display Path Generator                                             */
/* ------------------------------------------------------------------ */

export function generateDisplayPaths(category?: string): { path1: string; path2: string } {
  if (category) {
    const slug = category.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
    return {
      path1: hardTrunc(slug, 15),
      path2: "Shop",
    };
  }
  return { path1: "Products", path2: "Shop" };
}

/* ------------------------------------------------------------------ */
/*  Smart Budget Recommendation                                        */
/* ------------------------------------------------------------------ */

export interface BudgetRecommendation {
  dailyBudget: number;
  targetCpa: number;
  biddingStrategy: string;
  reasoning: string;
  storeMaturity: "new" | "growing" | "established";
}

export function generateBudgetRecommendation(snapshot: StoreSnapshot): BudgetRecommendation {
  const { bestSellers } = snapshot;
  const totalProducts = bestSellers.length;
  const totalSales = bestSellers.reduce((s, p) => s + (p.soldCount ?? 0), 0);
  const avgPrice = bestSellers.reduce((s, p) => s + p.price, 0) / Math.max(bestSellers.length, 1);

  const suggestedDaily = Math.max(50, Math.round(avgPrice * 0.5 / 10) * 10); // Round to nearest 10
  const suggestedCpa = Math.max(5, Math.round(avgPrice * 0.15));

  if (totalProducts < 10 && totalSales < 100) {
    return {
      dailyBudget: Math.max(50, suggestedDaily),
      targetCpa: suggestedCpa,
      biddingStrategy: "TARGET_SPEND",
      reasoning: `Your store is getting started. We recommend Maximize Clicks (SAR ${Math.max(50, suggestedDaily)}/day) to build initial traffic and collect conversion data.`,
      storeMaturity: "new",
    };
  }

  if (totalSales < 1000) {
    return {
      dailyBudget: suggestedDaily,
      targetCpa: suggestedCpa,
      biddingStrategy: "MAXIMIZE_CONVERSIONS",
      reasoning: `Based on your average product price of SAR ${Math.round(avgPrice)}, we recommend SAR ${suggestedDaily}/day with Maximize Conversions to optimize for sales.`,
      storeMaturity: "growing",
    };
  }

  return {
    dailyBudget: Math.max(200, suggestedDaily),
    targetCpa: suggestedCpa,
    biddingStrategy: "TARGET_ROAS",
    reasoning: `Your store has ${totalSales}+ sales. We recommend Target ROAS (SAR ${Math.max(200, suggestedDaily)}/day) to maximize revenue efficiently.`,
    storeMaturity: "established",
  };
}

/* ------------------------------------------------------------------ */
/*  Full Draft Generator                                               */
/* ------------------------------------------------------------------ */

export async function generateSearchDraft(options?: {
  category?: string;
}): Promise<SearchAiDraft> {
  const snapshot = await getStoreSnapshot();
  const category = options?.category;

  const headlines = generateHeadlines(snapshot, category);
  const descriptions = generateDescriptions(snapshot, category);
  const keywords = generateKeywords(snapshot);
  const negativeKeywords = generateNegativeKeywords();
  const sitelinks = generateSitelinks(snapshot);
  const callouts = generateCallouts();
  const snippets = generateSnippets(snapshot);
  const paths = generateDisplayPaths(category);
  const domain = snapshot.store.domain.startsWith("http")
    ? snapshot.store.domain
    : `https://${snapshot.store.domain}`;

  return {
    headlines,
    descriptions,
    keywords,
    negativeKeywords,
    sitelinks,
    callouts,
    snippets,
    displayPath1: paths.path1,
    displayPath2: paths.path2,
    finalUrl: category
      ? `${domain}/c/${category.toLowerCase().replace(/\s+/g, "-")}`
      : domain,
    campaignName: generateCampaignName(snapshot.store, snapshot.categories),
  };
}

/* ------------------------------------------------------------------ */
/*  Themed Ad Groups Generator                                         */
/* ------------------------------------------------------------------ */

/** Generates themed ad groups following Google best practice:
 *  - Brand ad group (exact match on store name + variations)
 *  - Category ad groups (one per top category, phrase/broad match)
 *  - Product ad group (best sellers, phrase match)
 *
 *  Each group gets its own RSA with relevant headlines/descriptions. */
export async function generateThemedAdGroups(): Promise<SearchAdGroup[]> {
  const snapshot = await getStoreSnapshot();
  const { store, bestSellers, categories } = snapshot;
  const domain = store.domain.startsWith("http") ? store.domain : `https://${store.domain}`;
  const adGroups: SearchAdGroup[] = [];

  // 1. Brand Ad Group
  const brandKeywords: SearchKeyword[] = [
    { id: uid(), text: store.name, matchType: "EXACT" },
    { id: uid(), text: `${store.name} store`, matchType: "EXACT" },
    { id: uid(), text: `${store.name} online`, matchType: "PHRASE" },
    { id: uid(), text: `shop ${store.name}`, matchType: "PHRASE" },
    { id: uid(), text: `${store.name} saudi`, matchType: "BROAD" },
  ];
  const brandHeadlines: RSAHeadline[] = [
    { id: uid(), text: hardTrunc(`${store.name} Official Store`, 30), pinnedPosition: 1 as const },
    { id: uid(), text: hardTrunc(`Shop ${store.name} Online`, 30), pinnedPosition: null },
    { id: uid(), text: hardTrunc(`${store.name} - Best Prices`, 30), pinnedPosition: null },
    ...categories.slice(0, 4).map(cat => ({ id: uid(), text: hardTrunc(`${cat} at ${store.name}`, 30), pinnedPosition: null as 1 | 2 | 3 | null })),
    { id: uid(), text: "Free Shipping Available", pinnedPosition: null },
    { id: uid(), text: "Secure Checkout", pinnedPosition: null },
    { id: uid(), text: "Shop Now & Save", pinnedPosition: null },
    { id: uid(), text: hardTrunc(`Trusted Saudi Store`, 30), pinnedPosition: null },
    { id: uid(), text: "New Arrivals Weekly", pinnedPosition: null },
    { id: uid(), text: "100% Original Products", pinnedPosition: null },
    { id: uid(), text: "Fast Delivery in KSA", pinnedPosition: null },
  ].slice(0, 15);
  const brandDescs: RSADescription[] = [
    { id: uid(), text: hardTrunc(`Shop ${categories.slice(0, 3).join(", ")} & more from ${store.name}. Free shipping & secure checkout.`, 90), pinnedPosition: null },
    { id: uid(), text: hardTrunc(`${store.name} - your trusted Saudi store. Browse ${bestSellers.length}+ best sellers. Fast delivery.`, 90), pinnedPosition: null },
    { id: uid(), text: hardTrunc(`Discover new arrivals & top deals at ${store.name}. Original products, easy returns.`, 90), pinnedPosition: null },
    { id: uid(), text: hardTrunc(`Official ${store.name} store. Cash on delivery. 24/7 support. Shop now.`, 90), pinnedPosition: null },
  ];
  adGroups.push({
    id: uid(),
    name: "Brand",
    keywords: brandKeywords,
    negativeKeywords: [],
    ads: [{ id: uid(), name: "Brand RSA", headlines: brandHeadlines, descriptions: brandDescs, finalUrl: domain, displayPath1: "Official", displayPath2: "Store" }],
  });

  // 2. Category Ad Groups (one per top category, max 4)
  for (const cat of categories.slice(0, 4)) {
    const slug = cat.toLowerCase().replace(/\s+/g, "-");
    const catProducts = bestSellers.filter(p => p.category.toLowerCase() === cat.toLowerCase()).slice(0, 3);
    const catKeywords: SearchKeyword[] = [
      { id: uid(), text: `buy ${cat.toLowerCase()} online`, matchType: "BROAD" },
      { id: uid(), text: `${cat.toLowerCase()} store`, matchType: "PHRASE" },
      { id: uid(), text: `best ${cat.toLowerCase()} price`, matchType: "BROAD" },
      { id: uid(), text: `order ${cat.toLowerCase()} saudi`, matchType: "BROAD" },
      { id: uid(), text: `${cat.toLowerCase()} shop`, matchType: "PHRASE" },
      { id: uid(), text: `${cat.toLowerCase()} online`, matchType: "BROAD" },
      ...catProducts.map(p => ({ id: uid(), text: p.name.toLowerCase(), matchType: "PHRASE" as KeywordMatchType })),
    ];
    const catHeadlines: RSAHeadline[] = [
      { id: uid(), text: hardTrunc(`Shop ${cat} Online`, 30), pinnedPosition: 1 as const },
      { id: uid(), text: hardTrunc(`${cat} at ${store.name}`, 30), pinnedPosition: null },
      { id: uid(), text: hardTrunc(`Best ${cat} Deals`, 30), pinnedPosition: null },
      { id: uid(), text: hardTrunc(`New ${cat} Collection`, 30), pinnedPosition: null },
      { id: uid(), text: hardTrunc(`Top Rated ${cat}`, 30), pinnedPosition: null },
      { id: uid(), text: hardTrunc(`${cat} - Free Shipping`, 30), pinnedPosition: null },
      { id: uid(), text: hardTrunc(`Order ${cat} Now`, 30), pinnedPosition: null },
      ...catProducts.map(p => ({ id: uid(), text: hardTrunc(`Shop ${p.name}`, 30), pinnedPosition: null as 1 | 2 | 3 | null })),
      { id: uid(), text: hardTrunc(`${store.name} ${cat}`, 30), pinnedPosition: null },
      { id: uid(), text: "Secure Checkout", pinnedPosition: null },
      { id: uid(), text: "Fast Delivery in KSA", pinnedPosition: null },
      { id: uid(), text: "100% Original Products", pinnedPosition: null },
      { id: uid(), text: "Cash on Delivery", pinnedPosition: null },
      { id: uid(), text: "Easy Returns", pinnedPosition: null },
      { id: uid(), text: "24/7 Support", pinnedPosition: null },
    ].slice(0, 15);
    const catDescs: RSADescription[] = [
      { id: uid(), text: hardTrunc(`Shop ${cat} from ${store.name}. Free shipping & secure checkout. Fast delivery across KSA.`, 90), pinnedPosition: null },
      { id: uid(), text: hardTrunc(`Browse ${catProducts.length > 0 ? catProducts.length + "+ " : ""}${cat} items. Top-rated products, original quality, easy returns.`, 90), pinnedPosition: null },
      { id: uid(), text: hardTrunc(`Discover new ${cat} arrivals. Best prices on ${cat.toLowerCase()} in Saudi Arabia.`, 90), pinnedPosition: null },
      { id: uid(), text: hardTrunc(`${store.name} ${cat} store. Cash on delivery. 24/7 support. Shop now.`, 90), pinnedPosition: null },
    ];
    adGroups.push({
      id: uid(),
      name: cat,
      keywords: catKeywords,
      negativeKeywords: [],
      ads: [{ id: uid(), name: `${cat} RSA`, headlines: catHeadlines, descriptions: catDescs, finalUrl: `${domain}/c/${slug}`, displayPath1: hardTrunc(slug, 15), displayPath2: "Shop" }],
    });
  }

  return adGroups;
}

/* ------------------------------------------------------------------ */
/*  Price Extensions Generator                                         */
/* ------------------------------------------------------------------ */

export function generatePriceExtensions(snapshot: StoreSnapshot): SearchPriceAsset[] {
  const { store, bestSellers, categories } = snapshot;
  const domain = store.domain.startsWith("http") ? store.domain : `https://${store.domain}`;

  if (bestSellers.length < 3) return [];

  const offerings = bestSellers.slice(0, 8).map(p => ({
    id: uid(),
    header: hardTrunc(p.name, 25),
    description: hardTrunc(p.category, 25),
    priceMicros: Math.round((p.salePrice ?? p.price) * 1_000_000),
    unit: "NONE" as const,
    finalUrl: p.url || `${domain}/p/${p.id}`,
  }));

  return [{
    id: uid(),
    type: "PRODUCT_CATEGORIES" as const,
    priceQualifier: "FROM" as const,
    languageCode: "ar",
    offerings,
  }];
}

/* ------------------------------------------------------------------ */
/*  Promotion Extensions Generator                                     */
/* ------------------------------------------------------------------ */

/** Detect the current seasonal occasion for Saudi/MENA market.
 *  Uses approximate Hijri calendar dates (shifts ~11 days/year). */
function detectCurrentOccasion(): SearchPromotionAsset["occasion"] {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Saudi National Day: September 23
  if (month === 9 && day >= 15 && day <= 30) return "NATIONAL_DAY";
  // Back to School: August-September
  if (month === 8 || (month === 9 && day <= 14)) return "BACK_TO_SCHOOL";
  // Black Friday / White Friday: November
  if (month === 11 && day >= 20 && day <= 30) return "BLACK_FRIDAY";
  // Year-end / Christmas season: December
  if (month === 12) return "END_OF_SEASON";
  // New Years: January 1-7
  if (month === 1 && day <= 7) return "NEW_YEARS";
  // Summer Sale: June-July
  if (month === 6 || month === 7) return "SUMMER_SALE";
  // Spring Sale: March-April (approximate)
  if (month === 3 || month === 4) return "SPRING_SALE";
  // Winter Sale: January-February
  if ((month === 1 && day > 7) || month === 2) return "WINTER_SALE";

  // Ramadan/Eid dates shift yearly — these are approximate for 2026
  // Ramadan 2026: ~Feb 18 - Mar 19 (already covered by WINTER/SPRING_SALE above)
  // Eid al-Fitr 2026: ~Mar 20-22
  // Eid al-Adha 2026: ~May 27-30
  if (month === 5 && day >= 25 && day <= 31) return "EID_AL_ADHA";

  return "NONE";
}

export function generatePromotionExtensions(snapshot: StoreSnapshot): SearchPromotionAsset[] {
  const { store, onSale } = snapshot;
  const domain = store.domain.startsWith("http") ? store.domain : `https://${store.domain}`;

  if (onSale.length === 0) return [];

  const maxDisc = Math.max(...onSale.map(p => {
    if (!p.salePrice || p.salePrice >= p.price) return 0;
    return Math.round(((p.price - p.salePrice) / p.price) * 100);
  }));

  if (maxDisc <= 0) return [];

  const today = new Date();
  const endDate = new Date(today.getTime() + 14 * 86400000);
  const occasion = detectCurrentOccasion();

  return [{
    id: uid(),
    promotionTarget: hardTrunc(`${onSale.length}+ Items on Sale`, 20),
    discountModifier: "UP_TO" as const,
    discountType: "PERCENT_OFF" as const,
    moneyAmountMicros: 0,
    percentOff: maxDisc,
    occasion,
    finalUrl: `${domain}/sale`,
    startDate: today.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  }];
}

/* ------------------------------------------------------------------ */
/*  Headline Diversity Classifier                                      */
/* ------------------------------------------------------------------ */

export type HeadlineCategory = "brand" | "product" | "benefit" | "cta" | "flexible";

export interface HeadlineDiversityScore {
  total: number;
  brand: number;
  product: number;
  benefit: number;
  cta: number;
  flexible: number;
  score: "poor" | "average" | "good" | "excellent";
  suggestion: string;
}

const BENEFIT_TERMS = ["free", "shipping", "delivery", "secure", "checkout", "original", "returns", "support", "cash", "trusted", "rated", "fast"];
const CTA_TERMS = ["shop", "buy", "order", "get", "save", "discover", "browse", "find"];

export function classifyHeadline(text: string, storeName: string): HeadlineCategory {
  const lower = text.toLowerCase();
  if (lower.includes(storeName.toLowerCase())) return "brand";
  if (CTA_TERMS.some(t => lower.startsWith(t))) return "cta";
  if (BENEFIT_TERMS.some(t => lower.includes(t))) return "benefit";
  if (lower.includes("%") || lower.includes("sar") || lower.includes("new") || lower.includes("collection")) return "product";
  return "flexible";
}

export function scoreHeadlineDiversity(headlines: { text: string }[], storeName: string): HeadlineDiversityScore {
  const filled = headlines.filter(h => h.text.trim());
  const classified = filled.map(h => classifyHeadline(h.text, storeName));
  const counts = {
    brand: classified.filter(c => c === "brand").length,
    product: classified.filter(c => c === "product").length,
    benefit: classified.filter(c => c === "benefit").length,
    cta: classified.filter(c => c === "cta").length,
    flexible: classified.filter(c => c === "flexible").length,
  };

  const categories = [counts.brand > 0, counts.product > 0, counts.benefit > 0, counts.cta > 0].filter(Boolean).length;
  const score = filled.length >= 12 && categories >= 4 ? "excellent"
    : filled.length >= 8 && categories >= 3 ? "good"
    : filled.length >= 5 && categories >= 2 ? "average"
    : "poor";

  const missing: string[] = [];
  if (counts.brand === 0) missing.push("brand");
  if (counts.product === 0) missing.push("product/category");
  if (counts.benefit === 0) missing.push("benefit");
  if (counts.cta === 0) missing.push("call-to-action");

  const suggestion = score === "excellent" ? "Great headline diversity! Your ad will test many combinations."
    : score === "good" ? `Good variety. Try adding ${missing.slice(0, 2).join(" and ")} headlines for more combinations.`
    : `Add more diverse headlines: ${missing.join(", ")}. Google recommends 4 categories for best results.`;

  return { total: filled.length, ...counts, score, suggestion };
}
