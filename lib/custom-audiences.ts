/**
 * Shared data and config for Custom Audiences (include/exclude).
 * Used by the shared CustomAudiencesCard on platforms that support this feature.
 *
 * In production these would come from the Salla backend (synced from Snap/Meta).
 */

export type AudienceSource = "pixel" | "engagement" | "email" | "lookalike" | "app";

export interface CustomAudienceOption {
  id: string;
  name: string;
  source: AudienceSource;
  /** Approximate audience size */
  size: number;
  /** When the audience was last updated */
  updatedDaysAgo: number;
}

export const SOURCE_META: Record<AudienceSource, { label: string; icon: string; color: string }> = {
  pixel:      { label: "Pixel",       icon: "🔵", color: "text-blue-600 bg-blue-50" },
  engagement: { label: "Engagement",  icon: "💬", color: "text-violet-600 bg-violet-50" },
  email:      { label: "Email List",  icon: "📧", color: "text-amber-600 bg-amber-50" },
  lookalike:  { label: "Lookalike",   icon: "👥", color: "text-emerald-600 bg-emerald-50" },
  app:        { label: "App Activity", icon: "📱", color: "text-rose-600 bg-rose-50" },
};

export const MOCK_CUSTOM_AUDIENCES: CustomAudienceOption[] = [
  { id: "aud_1", name: "Website Visitors (30d)",   source: "pixel",      size: 12400, updatedDaysAgo: 1 },
  { id: "aud_2", name: "Purchasers (90d)",         source: "pixel",      size: 3200,  updatedDaysAgo: 1 },
  { id: "aud_3", name: "Cart Abandoners",          source: "pixel",      size: 5800,  updatedDaysAgo: 2 },
  { id: "aud_4", name: "Email Subscribers",         source: "email",      size: 8900,  updatedDaysAgo: 7 },
  { id: "aud_5", name: "High-Value Customers",      source: "pixel",      size: 1100,  updatedDaysAgo: 3 },
  { id: "aud_6", name: "Product Page Viewers",      source: "pixel",      size: 18700, updatedDaysAgo: 1 },
  { id: "aud_7", name: "Engaged Story Viewers",     source: "engagement", size: 6300,  updatedDaysAgo: 4 },
  { id: "aud_8", name: "Lookalike — Purchasers",    source: "lookalike",  size: 45000, updatedDaysAgo: 5 },
];

export function formatAudienceSize(size: number): string {
  if (size >= 1000) return `${(size / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(size);
}

/**
 * Platforms that show the unified Custom Audiences card.
 */
export const CUSTOM_AUDIENCES_SUPPORTED_PLATFORMS = [
  "snapchat",
  "meta",
  "tiktok",
] as const;

export type CustomAudiencesSupportedPlatform =
  (typeof CUSTOM_AUDIENCES_SUPPORTED_PLATFORMS)[number];
