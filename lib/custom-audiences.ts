/**
 * Shared data and config for Custom Audiences (include/exclude).
 * Used by the shared CustomAudiencesCard on platforms that support this feature.
 */

export interface CustomAudienceOption {
  id: string;
  name: string;
}

/** Mock saved audiences for prototype. Same options across supported platforms. */
export const MOCK_CUSTOM_AUDIENCES: CustomAudienceOption[] = [
  { id: "aud_1", name: "Website Visitors (30d)" },
  { id: "aud_2", name: "Purchasers (90d)" },
  { id: "aud_3", name: "Cart Abandoners" },
  { id: "aud_4", name: "Email Subscribers" },
  { id: "aud_5", name: "High-Value Customers" },
];

/**
 * Platforms that show the unified Custom Audiences card.
 * Only these should render CustomAudiencesCard in step-audience.
 */
export const CUSTOM_AUDIENCES_SUPPORTED_PLATFORMS = [
  "snapchat",
  "meta",
  "tiktok",
] as const;

export type CustomAudiencesSupportedPlatform =
  (typeof CUSTOM_AUDIENCES_SUPPORTED_PLATFORMS)[number];
