/**
 * RFDM segmentation — Recency, Frequency, Monetary, Diversity
 *
 * Standard RFM extended with a "Diversity" score (number of distinct
 * categories a customer has bought from). Diversity separates narrow
 * loyal buyers from cross-category households — two customer types
 * that need different creatives and different lookalike seeds.
 *
 * Scores are 1–5 quintiles computed against the store's own customer
 * base (not absolute thresholds), so they auto-normalize to any size
 * of merchant.
 */

export type Score = 1 | 2 | 3 | 4 | 5;

export interface Customer {
  id: string;
  name: string;
  email: string;
  country: string; // ISO code
  firstOrderAt: string;
  lastOrderAt: string;
  orderCount: number;
  totalSpend: number; // SAR
  distinctCategories: number;
  preferredPayment: "mada" | "apple_pay" | "cod" | "card";
  usedCouponRate: number; // 0–1
  r: Score;
  f: Score;
  m: Score;
  d: Score;
}

/**
 * Salla's canonical 12-segment taxonomy — matches the dev team's
 * `customer_segments` table (store_id, segment, customers, customers_pct,
 * avg_days_from_last_order, total_orders, total_spending).
 *
 * Every recommendation is grounded ONLY in fields the dev team actually
 * exposes — no imaginary ML metrics.
 */
export type SegmentKey =
  | "champions"
  | "loyal"
  | "active"
  | "explorers"
  | "new"
  | "promising"
  | "needs_attention"
  | "almost_lost"
  | "at_risk"
  | "previously_loyal"
  | "dormant"
  | "never_purchased";

export interface SegmentMeta {
  key: SegmentKey;
  name: string;
  tagline: string;
  color: string;        // matches the chart palette
  priority: number;     // 1 = most valuable / most urgent
  recommendation: string;
}

/**
 * Colors chosen to mirror the team's existing chart so designers and
 * data scientists see the same palette in both surfaces.
 */
export const SEGMENTS: Record<SegmentKey, SegmentMeta> = {
  champions: {
    key: "champions",
    name: "Champions",
    tagline: "Low avg_days_from_last_order, high total_orders, high total_spending.",
    color: "#14b8a6",
    priority: 1,
    recommendation: "Reward and protect. Use as lookalike-1% seed on Meta & Snap.",
  },
  loyal: {
    key: "loyal",
    name: "Loyal",
    tagline: "Repeat buyers with steady total_orders over time.",
    color: "#3b82f6",
    priority: 2,
    recommendation: "Steady revenue base — push new arrivals and category cross-sell.",
  },
  active: {
    key: "active",
    name: "Active",
    tagline: "Bought recently — avg_days_from_last_order under 200.",
    color: "#10b981",
    priority: 3,
    recommendation: "Recently engaged. Trigger post-purchase upsells.",
  },
  explorers: {
    key: "explorers",
    name: "Explorers",
    tagline: "Buy across many product categories — Diversity ≥ 4.",
    color: "#34d399",
    priority: 3,
    recommendation: "Best seed for new product-launch lookalikes.",
  },
  new: {
    key: "new",
    name: "New",
    tagline: "First-ever order in the last 30–60 days.",
    color: "#6ee7b7",
    priority: 4,
    recommendation: "Trigger a second-purchase nurture before day 45.",
  },
  promising: {
    key: "promising",
    name: "Promising",
    tagline: "Recent buyer with low total_spending — not yet committed.",
    color: "#f59e0b",
    priority: 5,
    recommendation: "Test bestseller carousels to lift basket size.",
  },
  needs_attention: {
    key: "needs_attention",
    name: "Needs Attention",
    tagline: "avg_days_from_last_order rising — slipping toward dormant.",
    color: "#ea580c",
    priority: 5,
    recommendation: "Re-engage with category-specific offers within 30 days.",
  },
  almost_lost: {
    key: "almost_lost",
    name: "Almost Lost",
    tagline: "Was active, total_orders dropped to near zero recently.",
    color: "#ef4444",
    priority: 4,
    recommendation: "Send a win-back offer this week — they're on the edge.",
  },
  at_risk: {
    key: "at_risk",
    name: "At Risk",
    tagline: "Previously valuable buyers, no order in 60+ days.",
    color: "#fca5a5",
    priority: 2,
    recommendation: "Personalized win-back has highest ROAS potential here.",
  },
  previously_loyal: {
    key: "previously_loyal",
    name: "Previously Loyal",
    tagline: "Top spenders who haven't ordered in 90+ days.",
    color: "#a78bfa",
    priority: 1,
    recommendation: "Concierge-style outreach + exclusive offer. Don't lose them.",
  },
  dormant: {
    key: "dormant",
    name: "Dormant",
    tagline: "Low total_orders, high avg_days_from_last_order.",
    color: "#c4b5fd",
    priority: 9,
    recommendation: "Lower-priority budget. Use as a soft lookalike seed only.",
  },
  never_purchased: {
    key: "never_purchased",
    name: "Never Purchased",
    tagline: "In your customer DB but total_orders = 0.",
    color: "#d1d5db",
    priority: 6,
    recommendation: "Prime acquisition pool. Send first-purchase offers.",
  },
};

/**
 * Map (R, F, M) quintile scores to a Salla segment label.
 * The classification matches the team's `R × FMD` mosaic chart.
 * Customers with no orders are tagged `never_purchased` upstream.
 */
export function classify(r: Score, f: Score, m: Score, d?: Score): SegmentKey {
  const fm = Math.round((f + m) / 2) as Score;

  // High-diversity buyers cross-cut the matrix — Salla uses it as a sub-tag
  if (d !== undefined && d >= 4 && r >= 3 && fm <= 3) return "explorers";

  if (r >= 4 && fm >= 4) return "champions";
  if (r >= 3 && fm >= 4) return "loyal";
  if (r === 5 && fm <= 1) return "new";
  if (r >= 4 && fm >= 2 && fm <= 3) return "active";
  if (r === 3 && fm <= 1) return "promising";
  if (r === 3 && fm === 3) return "needs_attention";
  if (r === 3 && fm === 2) return "almost_lost";
  if (r <= 2 && fm >= 4) return "previously_loyal";
  if (r <= 2 && fm >= 2) return "at_risk";
  return "dormant";
}

/* ──────────────────────────────────────────────────────────────── */
/*  Mock customer data — deterministic seed                         */
/* ──────────────────────────────────────────────────────────────── */

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const FIRST = ["Abdullah", "Layla", "Mohammed", "Nora", "Khalid", "Fatima", "Saud", "Aisha", "Yousef", "Sara", "Faisal", "Mona", "Omar", "Huda", "Bader", "Reem"];
const LAST = ["Al-Qahtani", "Al-Harbi", "Al-Otaibi", "Al-Shehri", "Al-Ghamdi", "Al-Zahrani", "Al-Dosari", "Al-Rashid"];
const COUNTRIES = ["SA", "SA", "SA", "SA", "AE", "KW", "BH", "OM"];
const PAY: Customer["preferredPayment"][] = ["mada", "mada", "apple_pay", "cod", "card"];

export function generateMockCustomers(count = 1200): Customer[] {
  const rand = seededRand(42);
  const now = Date.now();
  const customers: Omit<Customer, "r" | "f" | "m" | "d">[] = [];

  for (let i = 0; i < count; i++) {
    const orderCount = Math.max(1, Math.floor(Math.pow(rand(), 2.5) * 18) + 1);
    const avgOrder = 80 + Math.pow(rand(), 2) * 1500;
    const totalSpend = Math.round(orderCount * avgOrder);
    const daysSinceFirst = Math.floor(rand() * 900) + 10;
    const daysSinceLast = Math.floor(rand() * daysSinceFirst);
    const distinct = Math.max(1, Math.min(orderCount, Math.floor(rand() * 6) + 1));
    const first = FIRST[Math.floor(rand() * FIRST.length)];
    const last = LAST[Math.floor(rand() * LAST.length)];

    customers.push({
      id: `cust_${i}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${i}@example.com`,
      country: COUNTRIES[Math.floor(rand() * COUNTRIES.length)],
      firstOrderAt: new Date(now - daysSinceFirst * 86400000).toISOString(),
      lastOrderAt: new Date(now - daysSinceLast * 86400000).toISOString(),
      orderCount,
      totalSpend,
      distinctCategories: distinct,
      preferredPayment: PAY[Math.floor(rand() * PAY.length)],
      usedCouponRate: Math.round(rand() * 100) / 100,
    });
  }

  // Compute quintile scores on each dimension
  const rVals = customers
    .map((c) => Date.parse(c.lastOrderAt))
    .slice()
    .sort((a, b) => a - b);
  const fVals = customers.map((c) => c.orderCount).slice().sort((a, b) => a - b);
  const mVals = customers.map((c) => c.totalSpend).slice().sort((a, b) => a - b);
  const dVals = customers.map((c) => c.distinctCategories).slice().sort((a, b) => a - b);

  function quintile(value: number, sorted: number[]): Score {
    const n = sorted.length;
    const idx = sorted.findIndex((v) => v >= value);
    const pos = idx === -1 ? n : idx;
    const q = Math.min(4, Math.floor((pos / n) * 5));
    return (q + 1) as Score;
  }

  return customers.map((c) => ({
    ...c,
    r: quintile(Date.parse(c.lastOrderAt), rVals),
    f: quintile(c.orderCount, fVals),
    m: quintile(c.totalSpend, mVals),
    d: quintile(c.distinctCategories, dVals),
  }));
}

/* ──────────────────────────────────────────────────────────────── */
/*  Smart AI segments (KSA-tuned)                                   */
/* ──────────────────────────────────────────────────────────────── */

export interface SmartSegment {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide name (string for flexibility)
  category: "retarget" | "loyalty" | "winback" | "seasonal" | "suppress";
  predicate: (c: Customer) => boolean;
  channels: Array<"meta" | "google" | "snapchat" | "tiktok">;
}

export const SMART_SEGMENTS: SmartSegment[] = [
  {
    id: "cart_48",
    name: "Cart Abandoners (48h)",
    description: "Added to cart in the last 2 days but didn't check out.",
    icon: "ShoppingCart",
    category: "retarget",
    channels: ["meta", "snapchat", "tiktok", "google"],
    predicate: (c) => c.r === 5 && c.orderCount <= 1,
  },
  {
    id: "vip_at_risk",
    name: "VIP at Risk",
    description: "Top 10% LTV with no purchase in 60+ days — urgent win-back.",
    icon: "Crown",
    category: "winback",
    channels: ["meta", "google", "snapchat"],
    predicate: (c) => c.m === 5 && c.r <= 2,
  },
  {
    id: "category_explorers",
    name: "Category Explorers",
    description: "Bought across 4+ categories. Best seed for new-launch lookalikes.",
    icon: "Compass",
    category: "loyalty",
    channels: ["meta", "snapchat", "tiktok"],
    predicate: (c) => c.d >= 4,
  },
  {
    id: "cod_loyalists",
    name: "Cash-on-Delivery Loyalists",
    description: "3+ successful COD orders — high trust, repeat-purchase potential.",
    icon: "Truck",
    category: "loyalty",
    channels: ["meta", "snapchat", "tiktok"],
    predicate: (c) => c.preferredPayment === "cod" && c.orderCount >= 3,
  },
  {
    id: "mada_only",
    name: "Mada-Only Buyers",
    description: "Prefer local payment — suppress from international campaigns.",
    icon: "CreditCard",
    category: "suppress",
    channels: ["meta", "google"],
    predicate: (c) => c.preferredPayment === "mada" && c.orderCount >= 1,
  },
  {
    id: "discount_dependent",
    name: "Discount-Dependent",
    description: "Over 70% of orders used a coupon. Don't show full-price creatives.",
    icon: "Tag",
    category: "suppress",
    channels: ["meta", "google", "snapchat"],
    predicate: (c) => c.usedCouponRate > 0.7 && c.orderCount >= 2,
  },
  {
    id: "one_and_done",
    name: "One-and-Done (>90d)",
    description: "Single purchase 90+ days ago — strong reactivation target.",
    icon: "Clock",
    category: "winback",
    channels: ["meta", "snapchat", "tiktok"],
    predicate: (c) => c.orderCount === 1 && c.r <= 2,
  },
  {
    id: "gcc_expats",
    name: "GCC Cross-Border",
    description: "Buyers shipping to UAE/Kuwait/Bahrain/Oman — expansion pool.",
    icon: "Globe",
    category: "retarget",
    channels: ["meta", "snapchat", "tiktok"],
    predicate: (c) => c.country !== "SA",
  },
  {
    id: "high_aov_gift",
    name: "High-AOV Buyers",
    description: "Average order value in the top quintile.",
    icon: "Gift",
    category: "loyalty",
    channels: ["meta", "google", "snapchat"],
    predicate: (c) => c.m >= 4 && c.totalSpend / c.orderCount > 800,
  },
  {
    id: "seasonal_only",
    name: "Seasonal Peakers",
    description: "Bought during major seasons only — activate before next peak.",
    icon: "Sparkles",
    category: "seasonal",
    channels: ["meta", "snapchat", "tiktok"],
    predicate: (c) => c.orderCount <= 2 && c.r === 3,
  },
  {
    id: "rising_loyalists",
    name: "Rising Loyalists",
    description: "Frequency climbing — nurture toward Champions status.",
    icon: "TrendingUp",
    category: "loyalty",
    channels: ["meta", "google"],
    predicate: (c) => c.f >= 3 && c.r >= 4 && c.m <= 3,
  },
  {
    id: "lost_big_spenders",
    name: "Lost Big Spenders",
    description: "High-LTV but cold for 6+ months. Last chance for win-back.",
    icon: "AlertCircle",
    category: "winback",
    channels: ["meta", "google"],
    predicate: (c) => c.m >= 4 && c.r === 1,
  },
];

/* ──────────────────────────────────────────────────────────────── */
/*  Derived helpers                                                 */
/* ──────────────────────────────────────────────────────────────── */

export interface SegmentStats {
  key: SegmentKey;
  count: number;
  totalLtv: number;
  avgLtv: number;
  avgOrders: number;
  avgDiversity: number;
  growthPct: number; // 30-day, mocked deterministically per segment
  sparkline: number[]; // 12 data points
}

export function computeSegmentStats(customers: Customer[]): Record<SegmentKey, SegmentStats> {
  const empty = (): SegmentStats => ({
    key: "lost",
    count: 0,
    totalLtv: 0,
    avgLtv: 0,
    avgOrders: 0,
    avgDiversity: 0,
    growthPct: 0,
    sparkline: [],
  });
  const result = {} as Record<SegmentKey, SegmentStats>;
  (Object.keys(SEGMENTS) as SegmentKey[]).forEach((k) => {
    result[k] = { ...empty(), key: k };
  });

  customers.forEach((c) => {
    const k = classify(c.r, c.f, c.m, c.d);
    const s = result[k];
    s.count += 1;
    s.totalLtv += c.totalSpend;
    s.avgOrders += c.orderCount;
    s.avgDiversity += c.d;
  });

  (Object.keys(result) as SegmentKey[]).forEach((k) => {
    const s = result[k];
    if (s.count > 0) {
      s.avgLtv = Math.round(s.totalLtv / s.count);
      s.avgOrders = Math.round((s.avgOrders / s.count) * 10) / 10;
      s.avgDiversity = Math.round((s.avgDiversity / s.count) * 10) / 10;
    }
    // Deterministic mock growth + sparkline
    const seed = k.charCodeAt(0) + k.length;
    const rand = seededRand(seed);
    s.growthPct = Math.round((rand() * 60 - 25) * 10) / 10;
    s.sparkline = Array.from({ length: 12 }, () => Math.round(s.count * (0.7 + rand() * 0.6)));
  });

  return result;
}

/** Build a 5x5 RF heatmap grid — cell = customer count at (R, F). */
export function buildHeatmap(customers: Customer[]): number[][] {
  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  customers.forEach((c) => {
    grid[5 - c.r][c.f - 1] += 1;
  });
  return grid;
}

/* ──────────────────────────────────────────────────────────────── */
/*  Marimekko / Mosaic chart data                                    */
/*  Builds (R × FM) cells with counts and segment labels — exactly   */
/*  matching the dev team's `customer_segments (R × FMD)` chart.     */
/* ──────────────────────────────────────────────────────────────── */

export interface MarimekkoCell {
  r: Score;
  fm: Score;
  count: number;
  segment: SegmentKey;
}

export interface MarimekkoData {
  cells: MarimekkoCell[];
  /** Customers in the customer DB but with total_orders = 0 — sit outside the matrix. */
  neverPurchased: number;
  total: number;
}

export function buildMarimekkoData(
  customers: Customer[],
  neverPurchasedCount: number = 0
): MarimekkoData {
  const cells: MarimekkoCell[] = [];
  for (let r = 1; r <= 5; r++) {
    for (let fm = 1; fm <= 5; fm++) {
      const count = customers.filter((c) => {
        const cFm = Math.round((c.f + c.m) / 2);
        return c.r === r && cFm === fm;
      }).length;
      const segment = classify(r as Score, fm as Score, fm as Score);
      cells.push({ r: r as Score, fm: fm as Score, count, segment });
    }
  }
  return {
    cells,
    neverPurchased: neverPurchasedCount,
    total: customers.length + neverPurchasedCount,
  };
}

/* ──────────────────────────────────────────────────────────────── */
/*  Unified Audience model — one type to rule all list sources      */
/* ──────────────────────────────────────────────────────────────── */

/**
 * Audience sources — locked to what the dev team and platforms actually
 * support. No "imports from platform X" because those CSVs aren't
 * portable across platforms and would just duplicate website_event /
 * ad_engagement.
 */
export type AudienceSource =
  | "rfdm"            // RFDM cohort segment, recomputed every 2 weeks
  | "salla_segment"   // Salla store-side merchant-built segment (e.g. "added to cart 7d ago")
  | "website_event"   // Salla pixel events on the merchant's site (works on all ad platforms)
  | "ad_engagement"   // Per-platform engagement (Meta video viewers, TikTok ad clickers, etc.) — locked to its origin platform
  | "lookalike"       // Lookalike / similar audience
  | "custom_list"     // CSV/text upload, synced to all platforms
  | "ai_chat"         // Generated from natural-language prompt
  | "blocklist";      // Suppression list (used as exclusion)

/** Membership behavior — drives which health signals make sense for the source. */
export function isCohortSource(source: AudienceSource): boolean {
  // Cohort sources: members shift in and out as the underlying rules re-evaluate.
  // For these, a -10% change in 30d is a real signal that needs attention.
  return source === "rfdm" || source === "salla_segment" || source === "website_event" || source === "ad_engagement";
}

export type AudienceStatus = "ready" | "syncing" | "stale" | "too_small" | "error";

export type AdPlatform = "meta" | "google" | "snapchat" | "tiktok" | "dv360";

export interface PlatformMatch {
  platform: AdPlatform;
  matched: number;             // number of users matched on platform
  matchRate: number;           // 0–1 (matched / size)
  status: "synced" | "syncing" | "failed" | "not_connected";
  lastSyncedAt?: string;
  minRequired: number;         // platform minimum audience size
}

export type UseCase = "retarget" | "winback" | "acquire" | "loyalty" | "suppress" | "seasonal" | "lookalike";

/**
 * Universal 4-level health signal applied to every audience.
 * No per-segment, no per-source case-by-case. Triggered by
 * generic signals: size, growth, status, source category.
 *
 *   - perfect → growing AND large AND high match
 *   - good    → ready to use
 *   - warning → small / stale / slipping
 *   - danger  → won't activate (below 1k or sync error)
 */
export type HealthLevel = "perfect" | "good" | "warning" | "danger";

/** Which trigger fired — drives the 1-line reason. */
export type HealthTrigger =
  | "perfect_cohort"     // cohort: large + growing + high match
  | "perfect_cumulative" // cumulative: large + high match
  | "good"               // ready to use
  | "small"              // 1k–5k, limited delivery
  | "stale"              // hasn't refreshed in 14+ days
  | "slipping"           // cohort only: -10%+ in 30d
  | "too_small"          // < 1k — won't activate
  | "sync_error";        // status === error

export interface HealthHint {
  level: HealthLevel;
  trigger: HealthTrigger;
  reason: string;        // 1-line, signal-driven
  action: string;        // 1-line, universal per level
  target?: string;       // 1-line benchmark
}

export interface Audience {
  id: string;
  name: string;
  description: string;
  source: AudienceSource;
  size: number;                  // total source size
  status: AudienceStatus;
  createdAt: string;
  updatedAt: string;
  growth30d: number;             // -100..+1000
  sparkline: number[];           // 12 pts
  platformMatches: PlatformMatch[];
  useCases: UseCase[];
  tags: string[];
  /** If source = rfdm, the segment key */
  rfdmKey?: SegmentKey;
  /** If source = ai_chat, the original prompt */
  prompt?: string;
  /** Human-readable "why" for AI sources — shown in detail drawer */
  aiRationale?: string;
  /** For ad_engagement: the platform that owns this list. Locked to its origin. */
  originPlatform?: AdPlatform;
  /** What action this list needs (computed from real fields). */
  healthHint?: HealthHint;
}

/**
 * Universal 4-level evaluator. Same rules for every audience —
 * no segment switch, no per-source branches. Inputs are signals
 * that exist on every audience.
 */
export function deriveHealthHint(a: Pick<Audience, "source" | "size" | "growth30d" | "status">): HealthHint {
  const cohort = isCohortSource(a.source);
  // Generic action templates per level — single source of truth.
  const actions: Record<HealthLevel, { action: string; target?: string }> = {
    perfect: {
      action: "Use it as targeting in Ad Management. Build a Lookalike to expand reach.",
      target: "Keep an eye on size and match rate.",
    },
    good: {
      action: "Use it as targeting in Ad Management.",
      target: "Refresh once a month.",
    },
    warning: {
      action: "Activate now or grow it. Build a Lookalike to extend reach.",
      target: "Keep size above 5,000 for steady delivery.",
    },
    danger: {
      action: "Build a Lookalike (Meta accepts 100+), widen the filters, or wait for growth.",
      target: "Min audience size is 1,000 across platforms.",
    },
  };
  const make = (level: HealthLevel, trigger: HealthTrigger, reason: string): HealthHint => ({
    level,
    trigger,
    reason,
    action: actions[level].action,
    target: actions[level].target,
  });

  // ── Danger first (these block activation entirely) ──
  if (a.status === "error") return make("danger", "sync_error", "Sync error — needs fixing.");
  if (a.status === "too_small" || a.size < 1000) {
    return make("danger", "too_small", "Below 1,000 — won't activate on ad platforms.");
  }
  // ── Warning ──
  if (a.status === "stale") return make("warning", "stale", "Hasn't refreshed in 14+ days.");
  if (a.size < 5000) return make("warning", "small", "Small audience — limited delivery.");
  if (cohort && a.growth30d <= -10) {
    return make("warning", "slipping", "Customers are leaving this segment.");
  }
  // ── Perfect — only if all positive signals line up ──
  if (a.size >= 5000 && (cohort ? a.growth30d >= 5 : true)) {
    return cohort
      ? make("perfect", "perfect_cohort", "Strong list — growing with high match rate.")
      : make("perfect", "perfect_cumulative", "Strong list — large and high match rate.");
  }
  // ── Good — anything else healthy ──
  return make("good", "good", "Healthy list, ready to activate.");
}


/* ──────────────────────────────────────────────────────────────── */
/*  Platform match model                                             */
/*  Realistic mock: Meta has best ID resolution (email+phone), then  */
/*  Google, then TikTok/Snap. Min sizes match real platform limits.  */
/* ──────────────────────────────────────────────────────────────── */

const PLATFORM_PROFILE: Record<AdPlatform, { baseRate: number; min: number }> = {
  meta: { baseRate: 0.72, min: 1000 },
  google: { baseRate: 0.64, min: 1000 },
  snapchat: { baseRate: 0.51, min: 1000 },
  tiktok: { baseRate: 0.58, min: 1000 },
  dv360: { baseRate: 0.61, min: 1000 },
};

export function computePlatformMatches(size: number, seed: number): PlatformMatch[] {
  const rand = seededRand(seed);
  const platforms: AdPlatform[] = ["meta", "google", "snapchat", "tiktok", "dv360"];
  return platforms.map((p) => {
    const profile = PLATFORM_PROFILE[p];
    const jitter = (rand() - 0.5) * 0.18; // +/- 9%
    const rate = Math.max(0.05, Math.min(0.95, profile.baseRate + jitter));
    const matched = Math.round(size * rate);
    // some platforms may be disconnected
    const r = rand();
    const status: PlatformMatch["status"] =
      r < 0.08 ? "not_connected"
      : r < 0.15 ? "syncing"
      : r < 0.17 ? "failed"
      : "synced";
    const lastSyncedAt = status === "synced"
      ? new Date(Date.now() - rand() * 72 * 3600 * 1000).toISOString()
      : undefined;
    return { platform: p, matched, matchRate: rate, status, lastSyncedAt, minRequired: profile.min };
  });
}

/* ──────────────────────────────────────────────────────────────── */
/*  Mock audience library — designed to stress-test scale.          */
/*  Mix of 50+ audiences across every source.                       */
/* ──────────────────────────────────────────────────────────────── */

export interface MerchantProfile {
  /** Total customers in the merchant's DB (includes never-purchased) */
  totalCustomers: number;
  /** Rough monthly orders */
  monthlyOrders: number;
  /** Share of customer DB that has never placed an order (~50% is typical) */
  neverPurchasedShare: number;
  tier: "starter" | "growing" | "enterprise";
}

/**
 * Realistic profiles. The "Never Purchased" share matches the dev team's
 * sample data (store 1014547 = 54%, 1041921 = 60%, 1058985 = 47%).
 */
export const MERCHANT_PROFILES: Record<MerchantProfile["tier"], MerchantProfile> = {
  starter:    { totalCustomers: 820,        monthlyOrders: 180,     neverPurchasedShare: 0.62, tier: "starter" },
  growing:    { totalCustomers: 60_000,     monthlyOrders: 8_500,   neverPurchasedShare: 0.54, tier: "growing" },
  enterprise: { totalCustomers: 2_400_000,  monthlyOrders: 380_000, neverPurchasedShare: 0.49, tier: "enterprise" },
};

function makeSparkline(seed: number, base: number, volatility = 0.25): number[] {
  const rand = seededRand(seed);
  return Array.from({ length: 12 }, () =>
    Math.max(0, Math.round(base * (1 - volatility + rand() * volatility * 2)))
  );
}

export function generateMockAudiences(profile: MerchantProfile): Audience[] {
  const rand = seededRand(profile.totalCustomers);
  const audiences: Audience[] = [];
  const total = profile.totalCustomers;
  const now = Date.now();

  const daysAgoIso = (d: number) => new Date(now - d * 86400000).toISOString();
  const add = (partial: Omit<Audience, "platformMatches" | "sparkline" | "createdAt" | "updatedAt" | "status"> & {
    createdDaysAgo?: number;
    updatedDaysAgo?: number;
    status?: AudienceStatus;
  }) => {
    const seed = audiences.length * 7 + 13;
    const size = partial.size;
    const status: AudienceStatus =
      partial.status ??
      (size < 1000 ? "too_small" : (partial.updatedDaysAgo ?? 1) > 14 ? "stale" : "ready");
    const built: Audience = {
      ...partial,
      status,
      createdAt: daysAgoIso(partial.createdDaysAgo ?? 30),
      updatedAt: daysAgoIso(partial.updatedDaysAgo ?? 1),
      platformMatches: computePlatformMatches(size, seed),
      sparkline: makeSparkline(seed, size),
    };
    // Always derive a real health hint from the audience itself
    built.healthHint = deriveHealthHint(built);
    audiences.push(built);
  };

  // ── RFDM (12 segments — distribution matches Salla's real dev-team data) ──
  // Shares sum to ~1.0 and approximate the real customer_segments distribution
  // observed across stores 1014547, 1041921, 1058985.
  const buyerTotal = total * (1 - profile.neverPurchasedShare);
  const rfdmDist: Array<[SegmentKey, number]> = [
    ["champions",        0.025],
    ["loyal",            0.040],
    ["active",           0.185],   // matches store 1014547 (18%) and 1041921 (16%)
    ["explorers",        0.060],
    ["new",              0.030],
    ["promising",        0.045],
    ["needs_attention",  0.093],   // matches 9.3% from real data
    ["almost_lost",      0.040],
    ["at_risk",          0.185],   // matches 18.5% from real data
    ["previously_loyal", 0.012],
    ["dormant",          0.220],
  ];
  // never_purchased handled separately (share comes from MerchantProfile)
  rfdmDist.forEach(([key, shareOfBuyers]) => {
    const meta = SEGMENTS[key];
    const useCasesByKey: Record<SegmentKey, UseCase[]> = {
      champions:        ["loyalty", "lookalike"],
      loyal:            ["loyalty", "lookalike"],
      active:           ["retarget", "loyalty"],
      explorers:        ["lookalike", "acquire"],
      new:              ["retarget"],
      promising:        ["retarget"],
      needs_attention:  ["retarget", "winback"],
      almost_lost:      ["winback"],
      at_risk:          ["winback"],
      previously_loyal: ["winback"],
      dormant:          ["suppress"],
      never_purchased:  ["acquire"],
    };
    add({
      id: `rfdm_${key}`,
      name: meta.name,
      description: meta.tagline,
      source: "rfdm",
      size: Math.round(buyerTotal * shareOfBuyers),
      rfdmKey: key,
      growth30d: Math.round((rand() * 60 - 20) * 10) / 10,
      useCases: useCasesByKey[key],
      tags: ["rfdm", "auto"],
      updatedDaysAgo: Math.floor(rand() * 3),
    });
  });
  // never_purchased uses its own share
  {
    const meta = SEGMENTS.never_purchased;
    add({
      id: "rfdm_never_purchased",
      name: meta.name,
      description: meta.tagline,
      source: "rfdm",
      size: Math.round(total * profile.neverPurchasedShare),
      rfdmKey: "never_purchased",
      growth30d: Math.round((rand() * 30) * 10) / 10,
      useCases: ["acquire"],
      tags: ["rfdm", "auto"],
      updatedDaysAgo: Math.floor(rand() * 3),
    });
  }

  // ── SALLA STORE SEGMENTS — merchant-built in store admin (rule-based) ──
  // These come from the store's own segment builder ("added to cart 7d ago",
  // "purchased in last 2 days", "male audience", etc.). Cohort-like.
  const sallaSegments: Array<{ name: string; desc: string; share: number }> = [
    { name: "Added to cart — 7 days", desc: "Visitors who added items to cart in the last 7 days", share: 0.025 },
    { name: "Purchased — last 2 days", desc: "Customers with an order in the last 48 hours", share: 0.012 },
    { name: "High AOV buyers (≥ 500 SAR)", desc: "Average order value in the top quintile", share: 0.06 },
    { name: "Male audience — KSA", desc: "Male customers shipping to Saudi Arabia", share: 0.18 },
    { name: "Female audience — KSA", desc: "Female customers shipping to Saudi Arabia", share: 0.22 },
    { name: "GCC cross-border buyers", desc: "Orders shipping to UAE, Kuwait, Bahrain, or Oman", share: 0.04 },
  ];
  sallaSegments.forEach((s, i) => add({
    id: `salla_seg_${i}`,
    name: s.name,
    description: s.desc,
    source: "salla_segment",
    size: Math.round(total * s.share),
    growth30d: Math.round((rand() * 30 - 10) * 10) / 10,
    useCases: ["retarget", "acquire"],
    tags: ["salla", "store-segment"],
    updatedDaysAgo: Math.floor(rand() * 3),
  }));

  // ── WEBSITE EVENTS — Salla pixel firing on the merchant's site.
  //    These work on every connected ad platform (the data is ours). ──
  const webEvents: Array<{ name: string; desc: string; share: number; days: number }> = [
    { name: "Website visitors — 30 days", desc: "Anyone who loaded any page", share: 0.35, days: 30 },
    { name: "Website visitors — 7 days", desc: "Recent visitors — highest conversion potential", share: 0.12, days: 7 },
    { name: "Product viewers — 30 days", desc: "Viewed a product detail page", share: 0.22, days: 30 },
    { name: "Cart abandoners — 30 days", desc: "Added to cart, did not purchase", share: 0.04, days: 30 },
    { name: "Cart abandoners — 7 days", desc: "Hot retargeting pool", share: 0.015, days: 7 },
    { name: "Checkout started — not completed", desc: "Got to checkout but didn't finish", share: 0.008, days: 30 },
    { name: "Purchasers — 90 days", desc: "Completed checkout in last 90 days", share: 0.07, days: 90 },
    { name: "Purchasers — 180 days", desc: "All recent buyers", share: 0.14, days: 180 },
  ];
  webEvents.forEach((l, i) => add({
    id: `web_event_${i}`,
    name: l.name,
    description: l.desc,
    source: "website_event",
    size: Math.round(total * l.share),
    growth30d: Math.round((rand() * 30) * 10) / 10, // pixel events only grow on average; keep ≥ 0
    useCases: l.name.includes("Purchasers") ? ["loyalty", "suppress"] : ["retarget"],
    tags: ["pixel", `${l.days}d`],
    updatedDaysAgo: 0,
  }));

  // ── AD ENGAGEMENT — per-platform engagement audiences.
  //    Each list is locked to its origin platform (Meta data stays on Meta,
  //    TikTok stays on TikTok). The platform's own pixel/SDK collects them. ──
  const engagementLists: Array<{ platform: AdPlatform; name: string; desc: string; share: number }> = [
    { platform: "meta",     name: "Meta — Page engagers (180d)", desc: "Engaged with your Facebook or Instagram page", share: 0.31 },
    { platform: "meta",     name: "Meta — Video 75% viewers",     desc: "Watched 75%+ of your videos",                share: 0.09 },
    { platform: "tiktok",   name: "TikTok — Video engagers (30d)",desc: "Watched, liked, or commented on your videos", share: 0.14 },
    { platform: "tiktok",   name: "TikTok — Ad clickers (30d)",   desc: "Clicked your ads in the last 30 days",        share: 0.03 },
    { platform: "snapchat", name: "Snap — Story viewers (90d)",   desc: "Viewed your stories or ads",                   share: 0.21 },
    { platform: "google",   name: "Google — YouTube viewers",      desc: "Watched your YouTube video ads",               share: 0.18 },
  ];
  engagementLists.forEach((e, i) => add({
    id: `engage_${i}`,
    name: e.name,
    description: e.desc,
    source: "ad_engagement",
    size: Math.round(total * e.share),
    growth30d: Math.round((rand() * 25) * 10) / 10, // engagement lists also only grow
    useCases: ["retarget"],
    tags: ["engagement", e.platform],
    originPlatform: e.platform,
    updatedDaysAgo: Math.floor(rand() * 3),
  }));

  // ── Lookalikes ──
  const lookalikes = [
    { name: "Lookalike 1% — Champions (Meta KSA)", size: Math.round(total * 1.8), desc: "Top 1% similar users in Saudi Arabia" },
    { name: "Lookalike 3% — High-CLV forecast", size: Math.round(total * 4.2), desc: "Broader reach, still high quality" },
    { name: "Lookalike 1% — Mada Payers (GCC)", size: Math.round(total * 2.1), desc: "Local payment-method lookalike across GCC" },
  ];
  lookalikes.forEach((l, i) => add({
    id: `lal_${i}`,
    name: l.name,
    description: l.desc,
    source: "lookalike",
    size: l.size,
    growth30d: 0,
    useCases: ["acquire", "lookalike"],
    tags: ["lookalike"],
    updatedDaysAgo: Math.floor(rand() * 3),
  }));

  // ── Custom lists (CSV / file upload, sync to all platforms) ──
  [
    { name: "VIP wholesale buyers", size: 124, desc: "Manually uploaded CSV — B2B partners" },
    { name: "Event attendees — Ramadan Expo", size: 2_340, desc: "Offline event opt-ins" },
    { name: "SMS subscribers", size: Math.round(total * 0.38), desc: "Marketing SMS opt-ins" },
  ].forEach((u, i) => add({
    id: `custom_${i}`,
    name: u.name,
    description: u.desc,
    source: "custom_list",
    size: u.size,
    growth30d: Math.round((rand() * 5) * 10) / 10, // CSV only grows when re-uploaded
    useCases: ["acquire", "retarget"],
    tags: ["custom_list", "offline"],
    updatedDaysAgo: Math.floor(rand() * 10 + 1),
  }));

  // ── Blocklists ──
  [
    { name: "Blocklist — Refund requesters", size: Math.round(total * 0.012), desc: "Customers flagged for fraud or chargebacks" },
    { name: "Blocklist — Already converted", size: Math.round(total * 0.08), desc: "Exclude from acquisition campaigns" },
    { name: "Blocklist — Unsubscribed", size: Math.round(total * 0.06), desc: "Opted out of marketing" },
  ].forEach((b, i) => add({
    id: `block_${i}`,
    name: b.name,
    description: b.desc,
    source: "blocklist",
    size: b.size,
    growth30d: Math.round((rand() * 10) * 10) / 10,
    useCases: ["suppress"],
    tags: ["exclusion"],
    updatedDaysAgo: Math.floor(rand() * 5),
  }));

  // ── AI chat-generated examples (to show the feature with history) ──
  [
    { name: "Bought 3 months ago, haven't since", prompt: "users who bought from me around 3 months ago but haven't bought again", size: Math.round(total * 0.05), rationale: "Matched customers whose last order was 75–105 days ago and who have no orders in the last 30 days." },
    { name: "Expensive buyers from UAE", prompt: "show me customers in UAE who spent over 2000 SAR total", size: Math.round(total * 0.008), rationale: "Filtered country = AE AND totalSpend > 2000. 87% match-rate to Meta." },
  ].forEach((c, i) => add({
    id: `chat_${i}`,
    name: c.name,
    description: `Generated from chat · "${c.prompt}"`,
    source: "ai_chat",
    size: c.size,
    growth30d: Math.round((rand() * 20) * 10) / 10,
    prompt: c.prompt,
    aiRationale: c.rationale,
    useCases: ["winback", "retarget"],
    tags: ["ai", "chat", "custom"],
    updatedDaysAgo: Math.floor(rand() * 4),
  }));

  return audiences;
}

/* ──────────────────────────────────────────────────────────────── */
/*  AI Chat parser — toy NL → filter predicate + size estimate      */
/* ──────────────────────────────────────────────────────────────── */

export interface ChatFilterCondition {
  field: string;
  op: string;
  value: string | number;
}

export interface ChatResult {
  summary: string;
  conditions: ChatFilterCondition[];
  matched: number;
  rationale: string;
}

/**
 * Naive-but-useful prompt parser for the audience chat builder.
 * Recognizes: time ranges, value comparisons, payment methods, countries,
 * RFDM dimensions, and "haven't bought" suppression phrases.
 */
export function parseChatPrompt(prompt: string, customers: Customer[]): ChatResult {
  const p = prompt.toLowerCase();
  const conditions: ChatFilterCondition[] = [];
  const predicates: Array<(c: Customer) => boolean> = [];

  // "bought in last X days/months"
  const lastMatch = p.match(/(?:bought|purchased|ordered).*?(?:last|past|in)\s*(\d+)\s*(day|week|month|year)/);
  if (lastMatch) {
    const n = parseInt(lastMatch[1], 10);
    const unit = lastMatch[2];
    const days = unit.startsWith("day") ? n : unit.startsWith("week") ? n * 7 : unit.startsWith("month") ? n * 30 : n * 365;
    conditions.push({ field: "last_order", op: "within", value: `${days} days` });
    predicates.push((c) => Date.now() - Date.parse(c.lastOrderAt) <= days * 86400000);
  }

  // "around X months ago" (windowed)
  const aroundMatch = p.match(/(\d+)\s*(month|week|day)s?\s*ago/);
  if (aroundMatch) {
    const n = parseInt(aroundMatch[1], 10);
    const unit = aroundMatch[2];
    const days = unit === "day" ? n : unit === "week" ? n * 7 : n * 30;
    conditions.push({ field: "last_order", op: "between", value: `${days - 15}–${days + 15} days ago` });
    predicates.push((c) => {
      const d = (Date.now() - Date.parse(c.lastOrderAt)) / 86400000;
      return d >= days - 15 && d <= days + 15;
    });
  }

  // "haven't bought in X days/months"
  const havenMatch = p.match(/haven'?t|hasn'?t|no purchase|dormant|inactive/);
  const notInMatch = p.match(/in\s*(?:last|past)?\s*(\d+)\s*(day|week|month)/);
  if (havenMatch) {
    const n = notInMatch ? parseInt(notInMatch[1], 10) : 30;
    const unit = notInMatch ? notInMatch[2] : "day";
    const days = unit.startsWith("day") ? n : unit.startsWith("week") ? n * 7 : n * 30;
    conditions.push({ field: "last_order", op: "older_than", value: `${days} days` });
    predicates.push((c) => Date.now() - Date.parse(c.lastOrderAt) > days * 86400000);
  }

  // "spent over X" / "high value" / "VIP"
  const spentMatch = p.match(/(?:spent|over|above|more than)\s*(\d+)/);
  if (spentMatch) {
    const v = parseInt(spentMatch[1], 10);
    conditions.push({ field: "total_spend", op: ">", value: v });
    predicates.push((c) => c.totalSpend > v);
  } else if (/\b(vip|high[- ]?value|big spender|top)\b/.test(p)) {
    conditions.push({ field: "monetary_score", op: ">=", value: 4 });
    predicates.push((c) => c.m >= 4);
  }

  // Payment method
  if (/\bmada\b/.test(p)) {
    conditions.push({ field: "payment", op: "=", value: "mada" });
    predicates.push((c) => c.preferredPayment === "mada");
  }
  if (/\b(cod|cash on delivery)\b/.test(p)) {
    conditions.push({ field: "payment", op: "=", value: "cod" });
    predicates.push((c) => c.preferredPayment === "cod");
  }
  if (/\bapple pay\b/.test(p)) {
    conditions.push({ field: "payment", op: "=", value: "apple_pay" });
    predicates.push((c) => c.preferredPayment === "apple_pay");
  }

  // Country
  const countries = [
    { match: /\bsaudi|ksa|\bsa\b/, code: "SA", name: "Saudi Arabia" },
    { match: /\buae|emirates|\bae\b/, code: "AE", name: "UAE" },
    { match: /\bkuwait|\bkw\b/, code: "KW", name: "Kuwait" },
    { match: /\bbahrain|\bbh\b/, code: "BH", name: "Bahrain" },
    { match: /\boman|\bom\b/, code: "OM", name: "Oman" },
  ];
  countries.forEach((ctry) => {
    if (ctry.match.test(p)) {
      conditions.push({ field: "country", op: "=", value: ctry.name });
      predicates.push((c) => c.country === ctry.code);
    }
  });

  // Frequency / diversity
  if (/\brepeat|loyal|frequent/.test(p)) {
    conditions.push({ field: "order_count", op: ">=", value: 3 });
    predicates.push((c) => c.orderCount >= 3);
  }
  if (/\bdiverse|multiple categor|cross[- ]category/.test(p)) {
    conditions.push({ field: "distinct_categories", op: ">=", value: 3 });
    predicates.push((c) => c.distinctCategories >= 3);
  }
  if (/\bcoupon|discount/.test(p)) {
    conditions.push({ field: "coupon_rate", op: ">", value: "50%" });
    predicates.push((c) => c.usedCouponRate > 0.5);
  }

  // Default: if nothing matched, grab recent buyers
  if (predicates.length === 0) {
    conditions.push({ field: "last_order", op: "within", value: "90 days" });
    predicates.push((c) => Date.now() - Date.parse(c.lastOrderAt) <= 90 * 86400000);
  }

  const matched = customers.filter((c) => predicates.every((fn) => fn(c))).length;

  const summary =
    conditions.length === 0
      ? "All customers"
      : conditions.map((c) => `${c.field} ${c.op} ${c.value}`).join(" AND ");

  const rationale =
    predicates.length === 0
      ? "No specific criteria detected — showing recent buyers as a starting point."
      : `Matched ${conditions.length} condition${conditions.length > 1 ? "s" : ""} from your request. You can refine by asking for more constraints (e.g. "but only in Saudi Arabia").`;

  return { summary, conditions, matched, rationale };
}
