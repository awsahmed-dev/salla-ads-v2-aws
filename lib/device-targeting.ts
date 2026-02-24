/**
 * Shared constants for Device Targeting (OS-level: iOS / Android).
 * Used by the shared DeviceTargetingCard on Snapchat, Meta, TikTok, and Google (non-Search).
 * DV360 uses device types (Desktop, Mobile, Tablet, Connected TV) and keeps its own UI.
 */

export interface DeviceOSOption {
  id: string;
  label: string;
}

/** Options for OS-based device targeting (iOS, Android). */
export const DEVICE_OS_OPTIONS: DeviceOSOption[] = [
  { id: "iOS", label: "iOS (iPhone)" },
  { id: "ANDROID", label: "Android" },
];

/** Platforms that use the unified OS-based Device Targeting card. */
export const DEVICE_TARGETING_OS_PLATFORMS = [
  "snapchat",
  "meta",
  "tiktok",
  "google",
] as const;
