/**
 * Mock TikTok audience-signals catalog.
 *
 * TikTok's real ad-group create API takes IDs from a predefined library
 * for these three fields:
 *   - interest_category_ids     (broad buckets: Fashion, Beauty, Electronics…)
 *   - interest_keyword_ids       (specific topics: "Abaya", "Smart Watch"…)
 *   - purchase_intention_keyword_ids  (active commercial intent: "Buy
 *                                     skincare", "Best perfume for Eid")
 *
 * The merchant doesn't type arbitrary strings — they pick from this
 * catalog (TikTok's library calls `/tool/interest_keyword/get/` and
 * `/tool/interest_keyword_recommend/` to populate UI search results).
 *
 * This file is the prototype catalog. Hand-curated, ~150 entries scoped
 * to common Salla store categories. Swap for a real API fetch when the
 * backend integration lands — no UI changes required.
 */

export type SignalType = "CATEGORY" | "INTEREST" | "SHOPPING_INTENT";

export type StoreCategory =
  | "FASHION"
  | "BEAUTY"
  | "ELECTRONICS"
  | "FOOD"
  | "HOME"
  | "GIFTS"
  | "BABY_KIDS"
  | "SPORTS"
  | "PETS"
  | "BOOKS_MEDIA";

export type SeasonalTag =
  | "RAMADAN"
  | "EID_AL_FITR"
  | "EID_AL_ADHA"
  | "WHITE_FRIDAY"
  | "NATIONAL_DAY"
  | "BACK_TO_SCHOOL"
  | "HAJJ"
  | "SUMMER";

export interface AudienceSignal {
  /** TikTok-style catalog ID (mocked). Real format is similar. */
  id: string;
  /** Display label, English first; bilingual stores can swap. */
  label: string;
  /** Optional Arabic label for KSA bilingual stores. */
  labelAr?: string;
  type: SignalType;
  /** Parent category slug (only for INTEREST/SHOPPING_INTENT rows). */
  parent?: StoreCategory;
  /** Which Salla store categories this signal is recommended for. */
  storeCategories: StoreCategory[];
  /** Seasonal tag if the signal spikes around a specific event. */
  seasonal?: SeasonalTag;
  /** TikTok-reported approximate reach in KSA (mocked, used for sort). */
  reachKsa: number;
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Interest Categories (CATEGORY) — broad buckets                       */
/* ──────────────────────────────────────────────────────────────────── */

export const CATEGORIES: AudienceSignal[] = [
  { id: "TT_CAT_fashion",        label: "Fashion & Apparel",        labelAr: "أزياء وملابس",   type: "CATEGORY", storeCategories: ["FASHION"],     reachKsa: 4_800_000 },
  { id: "TT_CAT_beauty",         label: "Beauty & Cosmetics",        labelAr: "تجميل ومستحضرات", type: "CATEGORY", storeCategories: ["BEAUTY"],      reachKsa: 4_200_000 },
  { id: "TT_CAT_electronics",    label: "Electronics & Gadgets",     labelAr: "إلكترونيات",     type: "CATEGORY", storeCategories: ["ELECTRONICS"], reachKsa: 3_600_000 },
  { id: "TT_CAT_food",           label: "Food & Beverage",            labelAr: "طعام ومشروبات",  type: "CATEGORY", storeCategories: ["FOOD"],        reachKsa: 5_100_000 },
  { id: "TT_CAT_home",           label: "Home & Living",               labelAr: "منزل ومعيشة",   type: "CATEGORY", storeCategories: ["HOME"],        reachKsa: 3_300_000 },
  { id: "TT_CAT_gifts",          label: "Gifts & Occasions",           labelAr: "هدايا ومناسبات", type: "CATEGORY", storeCategories: ["GIFTS"],       reachKsa: 2_900_000 },
  { id: "TT_CAT_baby_kids",      label: "Baby & Kids",                 labelAr: "أطفال ورضع",    type: "CATEGORY", storeCategories: ["BABY_KIDS"],   reachKsa: 2_400_000 },
  { id: "TT_CAT_sports",         label: "Sports & Outdoors",           labelAr: "رياضة",          type: "CATEGORY", storeCategories: ["SPORTS"],      reachKsa: 2_100_000 },
  { id: "TT_CAT_pets",           label: "Pets & Pet Supplies",         labelAr: "حيوانات أليفة",  type: "CATEGORY", storeCategories: ["PETS"],        reachKsa: 1_100_000 },
  { id: "TT_CAT_books_media",    label: "Books & Media",               labelAr: "كتب ووسائط",    type: "CATEGORY", storeCategories: ["BOOKS_MEDIA"], reachKsa: 1_400_000 },
];

/* ──────────────────────────────────────────────────────────────────── */
/*  Interest Keywords (INTEREST) — specific topics within a category    */
/* ──────────────────────────────────────────────────────────────────── */

export const INTEREST_KEYWORDS: AudienceSignal[] = [
  // Fashion
  { id: "TT_INT_abaya",         label: "Abaya & modest wear",     labelAr: "عباية",         type: "INTEREST", parent: "FASHION", storeCategories: ["FASHION"], reachKsa: 1_900_000 },
  { id: "TT_INT_streetwear",    label: "Streetwear",               labelAr: "ملابس عصرية",    type: "INTEREST", parent: "FASHION", storeCategories: ["FASHION"], reachKsa: 1_400_000 },
  { id: "TT_INT_luxury_fashion",label: "Luxury fashion",           labelAr: "أزياء فاخرة",    type: "INTEREST", parent: "FASHION", storeCategories: ["FASHION"], reachKsa: 800_000 },
  { id: "TT_INT_thobe",         label: "Thobe & traditional wear", labelAr: "ثوب",            type: "INTEREST", parent: "FASHION", storeCategories: ["FASHION"], reachKsa: 1_600_000 },
  { id: "TT_INT_handbags",      label: "Handbags & accessories",   labelAr: "حقائب",          type: "INTEREST", parent: "FASHION", storeCategories: ["FASHION"], reachKsa: 1_200_000 },
  { id: "TT_INT_shoes",         label: "Shoes & sneakers",         labelAr: "أحذية",          type: "INTEREST", parent: "FASHION", storeCategories: ["FASHION", "SPORTS"], reachKsa: 1_800_000 },

  // Beauty
  { id: "TT_INT_skincare",      label: "Skincare routine",         labelAr: "العناية بالبشرة", type: "INTEREST", parent: "BEAUTY", storeCategories: ["BEAUTY"], reachKsa: 2_400_000 },
  { id: "TT_INT_makeup",        label: "Makeup tutorials",         labelAr: "مكياج",           type: "INTEREST", parent: "BEAUTY", storeCategories: ["BEAUTY"], reachKsa: 2_100_000 },
  { id: "TT_INT_oud",           label: "Oud & Arabic perfumes",    labelAr: "عود وعطور",       type: "INTEREST", parent: "BEAUTY", storeCategories: ["BEAUTY", "GIFTS"], reachKsa: 1_700_000 },
  { id: "TT_INT_haircare",      label: "Hair care",                 labelAr: "العناية بالشعر",  type: "INTEREST", parent: "BEAUTY", storeCategories: ["BEAUTY"], reachKsa: 1_500_000 },
  { id: "TT_INT_korean_beauty", label: "K-Beauty & glass skin",     labelAr: "جمال كوري",        type: "INTEREST", parent: "BEAUTY", storeCategories: ["BEAUTY"], reachKsa: 900_000 },

  // Electronics
  { id: "TT_INT_smartphones",   label: "Smartphones & accessories", labelAr: "هواتف ذكية",     type: "INTEREST", parent: "ELECTRONICS", storeCategories: ["ELECTRONICS"], reachKsa: 2_800_000 },
  { id: "TT_INT_smartwatch",    label: "Smart watches",              labelAr: "ساعات ذكية",      type: "INTEREST", parent: "ELECTRONICS", storeCategories: ["ELECTRONICS", "SPORTS"], reachKsa: 1_300_000 },
  { id: "TT_INT_headphones",    label: "Headphones & audio",         labelAr: "سماعات",          type: "INTEREST", parent: "ELECTRONICS", storeCategories: ["ELECTRONICS"], reachKsa: 1_400_000 },
  { id: "TT_INT_gaming",        label: "Gaming & consoles",          labelAr: "ألعاب",            type: "INTEREST", parent: "ELECTRONICS", storeCategories: ["ELECTRONICS"], reachKsa: 1_900_000 },
  { id: "TT_INT_laptops",       label: "Laptops & computers",        labelAr: "لابتوب",           type: "INTEREST", parent: "ELECTRONICS", storeCategories: ["ELECTRONICS"], reachKsa: 1_200_000 },

  // Food & Beverage
  { id: "TT_INT_coffee",        label: "Coffee & specialty drinks",  labelAr: "قهوة",             type: "INTEREST", parent: "FOOD", storeCategories: ["FOOD"], reachKsa: 2_100_000 },
  { id: "TT_INT_dates",         label: "Dates & traditional sweets", labelAr: "تمر وحلويات",     type: "INTEREST", parent: "FOOD", storeCategories: ["FOOD", "GIFTS"], reachKsa: 1_800_000, seasonal: "RAMADAN" },
  { id: "TT_INT_healthy_food",  label: "Healthy eating & nutrition",  labelAr: "أكل صحي",          type: "INTEREST", parent: "FOOD", storeCategories: ["FOOD", "SPORTS"], reachKsa: 1_500_000 },
  { id: "TT_INT_meal_kits",     label: "Meal kits & subscriptions",   labelAr: "وجبات اشتراك",   type: "INTEREST", parent: "FOOD", storeCategories: ["FOOD"], reachKsa: 700_000 },

  // Home & Living
  { id: "TT_INT_home_decor",    label: "Home decor & interior",       labelAr: "ديكور منزلي",     type: "INTEREST", parent: "HOME", storeCategories: ["HOME"], reachKsa: 1_700_000 },
  { id: "TT_INT_furniture",     label: "Furniture",                    labelAr: "أثاث",             type: "INTEREST", parent: "HOME", storeCategories: ["HOME"], reachKsa: 1_300_000 },
  { id: "TT_INT_kitchen",       label: "Kitchen & cookware",           labelAr: "أدوات المطبخ",   type: "INTEREST", parent: "HOME", storeCategories: ["HOME"], reachKsa: 1_400_000 },
  { id: "TT_INT_aromatherapy",  label: "Aromatherapy & candles",       labelAr: "عطور وشموع",      type: "INTEREST", parent: "HOME", storeCategories: ["HOME", "BEAUTY"], reachKsa: 600_000 },

  // Gifts (heavy seasonal weighting)
  { id: "TT_INT_gift_ideas",    label: "Gift ideas",                   labelAr: "أفكار هدايا",     type: "INTEREST", parent: "GIFTS", storeCategories: ["GIFTS"], reachKsa: 2_300_000, seasonal: "EID_AL_FITR" },
  { id: "TT_INT_corporate_gifts", label: "Corporate & branded gifts",  labelAr: "هدايا شركات",    type: "INTEREST", parent: "GIFTS", storeCategories: ["GIFTS"], reachKsa: 400_000, seasonal: "NATIONAL_DAY" },

  // Baby & Kids
  { id: "TT_INT_baby_essentials", label: "Baby essentials",            labelAr: "مستلزمات أطفال", type: "INTEREST", parent: "BABY_KIDS", storeCategories: ["BABY_KIDS"], reachKsa: 1_100_000 },
  { id: "TT_INT_kids_toys",     label: "Kids toys & games",            labelAr: "ألعاب أطفال",     type: "INTEREST", parent: "BABY_KIDS", storeCategories: ["BABY_KIDS", "GIFTS"], reachKsa: 1_400_000 },
  { id: "TT_INT_school_supplies", label: "School supplies",            labelAr: "مستلزمات مدرسية", type: "INTEREST", parent: "BABY_KIDS", storeCategories: ["BABY_KIDS"], reachKsa: 800_000, seasonal: "BACK_TO_SCHOOL" },

  // Sports
  { id: "TT_INT_fitness",       label: "Fitness & gym",                labelAr: "لياقة",            type: "INTEREST", parent: "SPORTS", storeCategories: ["SPORTS"], reachKsa: 1_900_000 },
  { id: "TT_INT_running",       label: "Running & marathons",          labelAr: "جري",              type: "INTEREST", parent: "SPORTS", storeCategories: ["SPORTS"], reachKsa: 700_000 },
  { id: "TT_INT_supplements",   label: "Sports supplements",           labelAr: "مكملات",           type: "INTEREST", parent: "SPORTS", storeCategories: ["SPORTS"], reachKsa: 600_000 },

  // Pets
  { id: "TT_INT_cats",          label: "Cats & cat supplies",          labelAr: "قطط",              type: "INTEREST", parent: "PETS", storeCategories: ["PETS"], reachKsa: 700_000 },
  { id: "TT_INT_dogs",          label: "Dogs & dog supplies",          labelAr: "كلاب",             type: "INTEREST", parent: "PETS", storeCategories: ["PETS"], reachKsa: 400_000 },

  // Books / Media
  { id: "TT_INT_books_arabic",  label: "Arabic books & literature",    labelAr: "كتب عربية",       type: "INTEREST", parent: "BOOKS_MEDIA", storeCategories: ["BOOKS_MEDIA"], reachKsa: 1_100_000 },
  { id: "TT_INT_islamic",       label: "Islamic & religious content",  labelAr: "إسلاميات",         type: "INTEREST", parent: "BOOKS_MEDIA", storeCategories: ["BOOKS_MEDIA", "GIFTS"], reachKsa: 1_400_000, seasonal: "RAMADAN" },
];

/* ──────────────────────────────────────────────────────────────────── */
/*  Shopping Intent (SHOPPING_INTENT) — active commercial intent         */
/*  These are stronger conversion signals than interest keywords.        */
/* ──────────────────────────────────────────────────────────────────── */

export const SHOPPING_INTENT: AudienceSignal[] = [
  // Fashion
  { id: "TT_PI_buy_abaya",        label: "Shopping for abayas",        labelAr: "شراء عبايات",   type: "SHOPPING_INTENT", parent: "FASHION", storeCategories: ["FASHION"], reachKsa: 600_000 },
  { id: "TT_PI_buy_sneakers",     label: "Shopping for sneakers",       labelAr: "شراء أحذية رياضية", type: "SHOPPING_INTENT", parent: "FASHION", storeCategories: ["FASHION", "SPORTS"], reachKsa: 800_000 },
  { id: "TT_PI_buy_eid_outfit",   label: "Eid outfit shopping",         labelAr: "ملابس العيد",   type: "SHOPPING_INTENT", parent: "FASHION", storeCategories: ["FASHION"], reachKsa: 1_200_000, seasonal: "EID_AL_FITR" },

  // Beauty
  { id: "TT_PI_buy_skincare",     label: "Shopping for skincare",       labelAr: "شراء عناية بالبشرة", type: "SHOPPING_INTENT", parent: "BEAUTY", storeCategories: ["BEAUTY"], reachKsa: 1_100_000 },
  { id: "TT_PI_buy_perfume",      label: "Shopping for perfume",        labelAr: "شراء عطر",       type: "SHOPPING_INTENT", parent: "BEAUTY", storeCategories: ["BEAUTY", "GIFTS"], reachKsa: 900_000, seasonal: "EID_AL_FITR" },
  { id: "TT_PI_buy_oud",          label: "Shopping for oud",            labelAr: "شراء عود",       type: "SHOPPING_INTENT", parent: "BEAUTY", storeCategories: ["BEAUTY", "GIFTS"], reachKsa: 700_000, seasonal: "EID_AL_ADHA" },

  // Electronics
  { id: "TT_PI_buy_phone",        label: "Shopping for smartphones",    labelAr: "شراء جوال",       type: "SHOPPING_INTENT", parent: "ELECTRONICS", storeCategories: ["ELECTRONICS"], reachKsa: 1_400_000, seasonal: "WHITE_FRIDAY" },
  { id: "TT_PI_buy_headphones",   label: "Shopping for headphones",     labelAr: "شراء سماعات",    type: "SHOPPING_INTENT", parent: "ELECTRONICS", storeCategories: ["ELECTRONICS"], reachKsa: 600_000 },
  { id: "TT_PI_buy_gaming",       label: "Shopping for gaming gear",    labelAr: "شراء ألعاب",      type: "SHOPPING_INTENT", parent: "ELECTRONICS", storeCategories: ["ELECTRONICS"], reachKsa: 700_000 },

  // Food
  { id: "TT_PI_buy_ramadan_food", label: "Ramadan groceries",            labelAr: "بقالة رمضان",    type: "SHOPPING_INTENT", parent: "FOOD", storeCategories: ["FOOD"], reachKsa: 1_900_000, seasonal: "RAMADAN" },
  { id: "TT_PI_buy_dates_gift",   label: "Dates gift boxes",             labelAr: "علب تمر هدية",   type: "SHOPPING_INTENT", parent: "FOOD", storeCategories: ["FOOD", "GIFTS"], reachKsa: 800_000, seasonal: "EID_AL_FITR" },

  // Home
  { id: "TT_PI_buy_furniture",    label: "Shopping for furniture",       labelAr: "شراء أثاث",       type: "SHOPPING_INTENT", parent: "HOME", storeCategories: ["HOME"], reachKsa: 500_000 },
  { id: "TT_PI_buy_majlis",       label: "Majlis decor shopping",        labelAr: "ديكور مجلس",     type: "SHOPPING_INTENT", parent: "HOME", storeCategories: ["HOME"], reachKsa: 600_000, seasonal: "NATIONAL_DAY" },

  // Gifts
  { id: "TT_PI_buy_eid_gifts",    label: "Eid gift shopping",            labelAr: "هدايا العيد",    type: "SHOPPING_INTENT", parent: "GIFTS", storeCategories: ["GIFTS"], reachKsa: 1_600_000, seasonal: "EID_AL_FITR" },
  { id: "TT_PI_buy_national_day", label: "National Day gifts",           labelAr: "هدايا اليوم الوطني", type: "SHOPPING_INTENT", parent: "GIFTS", storeCategories: ["GIFTS"], reachKsa: 700_000, seasonal: "NATIONAL_DAY" },
  { id: "TT_PI_buy_back_to_school", label: "Back-to-school shopping",     labelAr: "تسوق المدرسة",   type: "SHOPPING_INTENT", parent: "BABY_KIDS", storeCategories: ["BABY_KIDS"], reachKsa: 1_100_000, seasonal: "BACK_TO_SCHOOL" },

  // White Friday cross-category
  { id: "TT_PI_white_friday",     label: "White Friday deals",           labelAr: "عروض الجمعة البيضاء", type: "SHOPPING_INTENT", storeCategories: ["FASHION", "BEAUTY", "ELECTRONICS", "HOME", "GIFTS"], reachKsa: 3_400_000, seasonal: "WHITE_FRIDAY" },
];

/* ──────────────────────────────────────────────────────────────────── */
/*  Full catalog (unified)                                                */
/* ──────────────────────────────────────────────────────────────────── */

export const AUDIENCE_CATALOG: AudienceSignal[] = [
  ...CATEGORIES,
  ...INTEREST_KEYWORDS,
  ...SHOPPING_INTENT,
];

/** Look up a single signal by ID. */
export function getSignal(id: string): AudienceSignal | undefined {
  return AUDIENCE_CATALOG.find((s) => s.id === id);
}

/** Resolve a set of IDs into full signal records (preserves order). */
export function getSignals(ids: string[]): AudienceSignal[] {
  return ids
    .map((id) => getSignal(id))
    .filter((s): s is AudienceSignal => s != null);
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Search                                                                 */
/* ──────────────────────────────────────────────────────────────────── */

/**
 * Search the catalog by partial label (English or Arabic), optionally
 * filtered by store category and signal type. Returns top N by reach.
 */
export function searchCatalog(
  query: string,
  opts: { storeCategory?: StoreCategory; type?: SignalType; limit?: number } = {}
): AudienceSignal[] {
  const q = query.trim().toLowerCase();
  const { storeCategory, type, limit = 50 } = opts;
  let pool = AUDIENCE_CATALOG;
  if (type) pool = pool.filter((s) => s.type === type);
  if (storeCategory) pool = pool.filter((s) => s.storeCategories.includes(storeCategory));
  if (q) {
    pool = pool.filter((s) =>
      s.label.toLowerCase().includes(q)
      || (s.labelAr && s.labelAr.toLowerCase().includes(q))
      || s.id.toLowerCase().includes(q)
    );
  }
  return pool.sort((a, b) => b.reachKsa - a.reachKsa).slice(0, limit);
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Salla-merchant best-practice bundles                                  */
/* ──────────────────────────────────────────────────────────────────── */

export interface SignalBundle {
  id: string;
  label: string;
  description: string;
  signalIds: string[];
  seasonal?: SeasonalTag;
  forCategories?: StoreCategory[];
}

/**
 * Pre-built bundles tuned to Salla-merchant best practice. Surfaced in
 * the picker when the merchant's store category matches OR a seasonal
 * window is approaching.
 */
export const SIGNAL_BUNDLES: SignalBundle[] = [
  {
    id: "eid_fitr_full",
    label: "Eid al-Fitr — full bundle",
    description: "Gift shoppers, perfume buyers, Eid outfits, dates and sweets. 14 signals.",
    seasonal: "EID_AL_FITR",
    signalIds: [
      "TT_CAT_gifts",
      "TT_INT_gift_ideas",
      "TT_PI_buy_eid_gifts",
      "TT_PI_buy_eid_outfit",
      "TT_PI_buy_perfume",
      "TT_PI_buy_dates_gift",
      "TT_INT_oud",
      "TT_INT_dates",
    ],
  },
  {
    id: "eid_adha_oud",
    label: "Eid al-Adha — Oud & gifts",
    description: "Oud, premium perfume, traditional menswear, Eid gifting.",
    seasonal: "EID_AL_ADHA",
    signalIds: [
      "TT_PI_buy_oud",
      "TT_INT_oud",
      "TT_INT_thobe",
      "TT_PI_buy_eid_gifts",
    ],
  },
  {
    id: "ramadan_food",
    label: "Ramadan — food & dates",
    description: "Iftar shopping, dates, traditional sweets, Islamic content.",
    seasonal: "RAMADAN",
    signalIds: [
      "TT_PI_buy_ramadan_food",
      "TT_INT_dates",
      "TT_INT_islamic",
      "TT_PI_buy_dates_gift",
    ],
  },
  {
    id: "white_friday",
    label: "White Friday — full bundle",
    description: "Cross-category deal-hunters. Use during 4-day window only.",
    seasonal: "WHITE_FRIDAY",
    signalIds: [
      "TT_PI_white_friday",
      "TT_PI_buy_phone",
      "TT_PI_buy_skincare",
    ],
  },
  {
    id: "national_day",
    label: "National Day — KSA",
    description: "Patriotic shopping, corporate gifting, majlis decor.",
    seasonal: "NATIONAL_DAY",
    signalIds: [
      "TT_PI_buy_national_day",
      "TT_INT_corporate_gifts",
      "TT_PI_buy_majlis",
    ],
  },
  {
    id: "back_to_school",
    label: "Back to school",
    description: "School supplies, kids essentials, parents shopping.",
    seasonal: "BACK_TO_SCHOOL",
    signalIds: [
      "TT_PI_buy_back_to_school",
      "TT_INT_school_supplies",
      "TT_INT_kids_toys",
    ],
  },
  // Store-category "starter" bundles (always available)
  {
    id: "starter_fashion",
    label: "Fashion store — starter",
    description: "Recommended 5-signal seed for new fashion campaigns.",
    forCategories: ["FASHION"],
    signalIds: ["TT_CAT_fashion", "TT_INT_abaya", "TT_INT_thobe", "TT_INT_shoes", "TT_INT_handbags"],
  },
  {
    id: "starter_beauty",
    label: "Beauty store — starter",
    description: "Recommended 5-signal seed for new beauty campaigns.",
    forCategories: ["BEAUTY"],
    signalIds: ["TT_CAT_beauty", "TT_INT_skincare", "TT_INT_makeup", "TT_INT_oud", "TT_INT_haircare"],
  },
  {
    id: "starter_electronics",
    label: "Electronics store — starter",
    description: "Recommended 5-signal seed for new electronics campaigns.",
    forCategories: ["ELECTRONICS"],
    signalIds: ["TT_CAT_electronics", "TT_INT_smartphones", "TT_INT_headphones", "TT_INT_smartwatch", "TT_INT_gaming"],
  },
];
