/**
 * Shared constants for Salla Smart Features (exclude recent purchasers + lookalike audiences).
 * Used by the shared SallaSmartFeaturesCard and all platforms.
 */

export const SALLA_CATEGORIES = [
  "Perfume & Fragrance Buyers",
  "Fashion & Apparel Shoppers",
  "Electronics Enthusiasts",
  "Home & Kitchen Buyers",
  "Beauty & Skincare Shoppers",
  "Baby & Kids Products",
  "Health & Wellness",
  "Grocery & Food",
  "Jewelry & Accessories",
  "Sports & Outdoor",
] as const;

export const PURCHASER_PRESETS = [
  { days: 30, label: "30 Days" },
  { days: 45, label: "45 Days" },
  { days: 60, label: "60 Days" },
] as const;
