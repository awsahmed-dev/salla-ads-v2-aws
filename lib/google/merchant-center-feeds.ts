/**
 * Merchant Center datafeeds — the real surface Google exposes for
 * "named product groupings" at the catalog layer.
 *
 * Replaces the previous frontend mock library of Salla "product sets,"
 * which were aspirational concepts (Best Sellers, Ramadan, Eid, etc.)
 * with no native equivalent in the Merchant Center Content API.
 *
 * Truth about MC's grouping surface:
 *   - GET content/v2.1/{merchantId}/datafeeds  → list of feeds
 *   - Each feed has: id, name, target country, content language,
 *     primary-or-supplemental flag, last refresh timestamp.
 *   - The product count comes from `productstatuses` aggregated per feed.
 *   - Most Salla-connected merchants have 1 primary feed (the whole
 *     active catalog auto-pushed by the Salla→MC connector) and 0–1
 *     supplemental feeds (e.g., a "Recently Added" supplemental that
 *     the connector creates from the last-N-days delta).
 *
 * The Google Ads side then references the feed by `feed_label` on the
 * campaign's ShoppingSetting. Per-feed delivery is campaign-level, not
 * ad-group-level — to narrow further the merchant uses the Google Ads
 * listing_group tree (already wired in step-creative.tsx).
 *
 * Dev TODO at integration time:
 *   - Replace fetchMerchantCenterDatafeeds() with a real API call to
 *     content/v2.1/{merchantId}/datafeeds
 *   - Aggregate product counts via productstatuses.list filtered by
 *     destination + datasource (or pull from MC's UI surface)
 */

/** Mirrors the Merchant Center Content API datafeed resource shape. */
export interface MerchantCenterFeed {
  /** Datafeed resource ID. Maps to MC `Datafeed.id`. */
  id: string;
  /** Merchant-set name. Maps to MC `Datafeed.name`. */
  name: string;
  /** Arabic display name (Salla UI only — not part of the MC resource). */
  nameAr?: string;
  /** Primary catalog (full feed) vs supplemental (delta or overrides).
   *  Primary feeds drive the full product set; supplemental feeds
   *  layer field updates onto the primary. Maps to whether the feed
   *  appears in `DatafeedTarget.includedDestinations` as the source. */
  kind: "primary" | "supplemental";
  /** Target country for delivery — drives Google Ads `feed_label`.
   *  Two-letter ISO country code (e.g., "SA" for KSA). Maps to
   *  `DatafeedTarget.country`. */
  targetCountry: string;
  /** Content language code — e.g., "ar" or "en". Maps to
   *  `DatafeedTarget.language`. */
  contentLanguage: string;
  /** Number of approved products in this feed. Derived from
   *  productstatuses aggregated per datafeed at fetch time. */
  productCount: number;
  /** ISO 8601 timestamp of the last successful refresh. Maps to
   *  `DatafeedStatus.lastUploadDate`. */
  lastRefresh?: string;
  /** Whether the feed is currently in error state (any disapproved or
   *  fetch error). Derived from `DatafeedStatus.errors`. */
  hasErrors?: boolean;
  /** One-line human description for the picker. Frontend-only. */
  description?: string;
  descriptionAr?: string;
}

/** Mock Merchant Center datafeeds — replace with real API call.
 *
 *  Typical Salla→MC connected account returns 1 primary + 0-1
 *  supplemental feeds. Anything beyond that the merchant has set up
 *  manually in their MC dashboard. */
const MOCK_MERCHANT_CENTER_FEEDS: MerchantCenterFeed[] = [
  {
    id: "mc_feed_primary_sa",
    name: "All Products",
    nameAr: "جميع المنتجات",
    kind: "primary",
    targetCountry: "SA",
    contentLanguage: "ar",
    productCount: 1198,
    lastRefresh: "2026-05-21T05:12:00Z",
    hasErrors: false,
    description: "Auto-pushed by the Salla → Merchant Center connector. Refreshes every 15 minutes when your store inventory changes.",
    descriptionAr: "يتم تحديثه تلقائياً من سلة إلى Merchant Center كل 15 دقيقة عند تغيير المخزون.",
  },
  {
    id: "mc_feed_supplemental_new",
    name: "Recently Added",
    nameAr: "المضافة حديثاً",
    kind: "supplemental",
    targetCountry: "SA",
    contentLanguage: "ar",
    productCount: 37,
    lastRefresh: "2026-05-21T05:12:00Z",
    hasErrors: false,
    description: "Supplemental feed — products created in the last 30 days. Layered on top of the primary feed.",
    descriptionAr: "تغذية تكميلية — المنتجات المضافة خلال آخر 30 يوماً.",
  },
];

/** Fetch all Merchant Center datafeeds attached to the merchant's
 *  linked MC account. Real implementation calls
 *  `content/v2.1/{merchantId}/datafeeds`. */
export async function fetchMerchantCenterDatafeeds(): Promise<MerchantCenterFeed[]> {
  return MOCK_MERCHANT_CENTER_FEEDS;
}

/** Get a single feed by ID. */
export async function getDatafeedById(id: string): Promise<MerchantCenterFeed | null> {
  return MOCK_MERCHANT_CENTER_FEEDS.find((f) => f.id === id) ?? null;
}
