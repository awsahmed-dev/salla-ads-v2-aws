/**
 * Unified demographics for Salla Ads: languages, genders, and age.
 * All platforms use these constants and the same age-band UX; platform code maps to/from API shapes.
 */

/** Supported languages (English and Arabic only). */
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "Arabic" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

/** Supported genders (Male and Female only). */
export const SUPPORTED_GENDERS = [
  { id: "MALE", label: "Male" },
  { id: "FEMALE", label: "Female" },
] as const;

export type SupportedGenderId = (typeof SUPPORTED_GENDERS)[number]["id"];

/**
 * Age bands used for a unified experience across all platforms.
 * Values match DV360 (18_24, 25_34, ...); other platforms derive ageMin/ageMax from selected bands.
 */
export const AGE_BANDS = [
  { value: "18_24", label: "18-24", min: 18, max: 24 },
  { value: "25_34", label: "25-34", min: 25, max: 34 },
  { value: "35_44", label: "35-44", min: 35, max: 44 },
  { value: "45_54", label: "45-54", min: 45, max: 54 },
  { value: "55_64", label: "55-64", min: 55, max: 64 },
  { value: "65_PLUS", label: "65+", min: 65, max: 999 },
] as const;

export type AgeBandValue = (typeof AGE_BANDS)[number]["value"];

const BAND_MAP = new Map(AGE_BANDS.map((b) => [b.value, b]));

/**
 * Convert selected age band values to ageMin/ageMax (for platforms that use min/max).
 * If no bands selected, returns { ageMin: 18, ageMax: 65 } as safe default.
 */
export function ageBandsToMinMax(bandValues: string[]): { ageMin: number; ageMax: number } {
  if (bandValues.length === 0) return { ageMin: 18, ageMax: 65 };
  let min = 999;
  let max = 0;
  for (const v of bandValues) {
    const band = BAND_MAP.get(v as AgeBandValue);
    if (band) {
      min = Math.min(min, band.min);
      max = Math.max(max, band.max === 999 ? 65 : band.max);
    }
  }
  return { ageMin: min, ageMax: max === 0 ? 65 : max };
}

/**
 * Convert ageMin/ageMax to age band values (for platforms that use bands or to drive shared UI).
 * Any band that overlaps the range [ageMin, ageMax] is included.
 */
export function minMaxToAgeBands(ageMin: number, ageMax: number): string[] {
  const out: string[] = [];
  for (const band of AGE_BANDS) {
    const bandMax = band.max === 999 ? 65 : band.max;
    if (band.min <= ageMax && bandMax >= ageMin) out.push(band.value);
  }
  return out;
}
