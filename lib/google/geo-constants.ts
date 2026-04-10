/* ================================================================
   Google Ads GeoTargetConstant & Language Constant ID Mappings
   ================================================================
   Maps Salla's internal codes (ISO 3166-1 alpha-2 country codes,
   ISO 639-1 language codes) to Google Ads API criterion IDs.

   Source: Google Ads API GeoTargetConstantService
   Reference: https://developers.google.com/google-ads/api/reference/data/geotargets
   ================================================================ */

/**
 * Country ISO alpha-2 code → Google Ads GeoTargetConstant criterion ID.
 * These IDs are used in CampaignCriterion.location targeting.
 * Resource name format: `geoTargetConstants/{criterionId}`
 *
 * Coverage: MENA/GCC region (Salla's primary markets).
 */
export const COUNTRY_GEO_IDS: Record<string, number> = {
  /* ---- GCC ---- */
  SA: 2682, // Saudi Arabia
  AE: 2784, // United Arab Emirates
  KW: 2414, // Kuwait
  BH: 2048, // Bahrain
  OM: 2512, // Oman
  QA: 2634, // Qatar

  /* ---- Levant ---- */
  EG: 2818, // Egypt
  JO: 2400, // Jordan
  IQ: 2368, // Iraq
  LB: 2422, // Lebanon
  PS: 2275, // Palestine

  /* ---- North Africa ---- */
  MA: 2504, // Morocco
  TN: 2788, // Tunisia
  DZ: 2012, // Algeria
  LY: 2434, // Libya
  SD: 2736, // Sudan

  /* ---- Other ---- */
  YE: 2887, // Yemen
};

/**
 * Major Saudi cities → Google Ads GeoTargetConstant criterion IDs.
 * Maps the Salla city ID to Google's criterion ID.
 *
 * Note: These are approximate mappings. For production use,
 * call GeoTargetConstantService.suggest_geo_target_constants()
 * to get exact IDs.
 */
export const CITY_GEO_IDS: Record<string, number> = {
  /* ---- Saudi Arabia ---- */
  "sa-riyadh": 1002316, // Riyadh
  "sa-jeddah": 1002331, // Jeddah
  "sa-makkah": 1002326, // Makkah
  "sa-madinah": 1002323, // Madinah
  "sa-dammam": 1002306, // Dammam
  "sa-khobar": 1002319, // Khobar
  "sa-dhahran": 1002307, // Dhahran
  "sa-taif": 1002337, // Taif
  "sa-tabuk": 1002336, // Tabuk
  "sa-buraidah": 1002303, // Buraidah
  "sa-khamis-mushait": 1002318, // Khamis Mushait
  "sa-abha": 1002299, // Abha
  "sa-najran": 1002328, // Najran
  "sa-hail": 1002310, // Hail
  "sa-jubail": 1002314, // Jubail
  "sa-yanbu": 1002342, // Yanbu
  "sa-hofuf": 1002311, // Hofuf (Al-Ahsa)
  "sa-jazan": 1002313, // Jazan

  /* ---- UAE ---- */
  "ae-dubai": 1000463, // Dubai
  "ae-abu-dhabi": 1000456, // Abu Dhabi
  "ae-sharjah": 1000467, // Sharjah
  "ae-ajman": 1000457, // Ajman
  "ae-ras-al-khaimah": 1000466, // Ras al-Khaimah
  "ae-fujairah": 1000464, // Fujairah
  "ae-umm-al-quwain": 1000468, // Umm al-Quwain

  /* ---- Kuwait ---- */
  "kw-kuwait-city": 1003632, // Kuwait City

  /* ---- Egypt ---- */
  "eg-cairo": 1000110, // Cairo
  "eg-alexandria": 1000098, // Alexandria
  "eg-giza": 1000102, // Giza
};

/**
 * Language ISO 639-1 code → Google Ads Language constant criterion ID.
 * Used in CampaignCriterion.language targeting.
 * Resource name format: `languageConstants/{criterionId}`
 */
export const LANGUAGE_IDS: Record<string, number> = {
  ar: 1019, // Arabic
  en: 1000, // English
  fr: 1002, // French
  ur: 1041, // Urdu
  hi: 1023, // Hindi
  fil: 1042, // Filipino/Tagalog
  bn: 1056, // Bengali
};

/* ---- Utility functions ---- */

/**
 * Convert an ISO country code to a Google Ads geo_target_constant resource name.
 * Returns undefined if the country is not in our mapping.
 */
export function countryToGeoTargetResource(countryCode: string): string | undefined {
  const id = COUNTRY_GEO_IDS[countryCode.toUpperCase()];
  return id ? `geoTargetConstants/${id}` : undefined;
}

/**
 * Convert a Salla city ID to a Google Ads geo_target_constant resource name.
 * Returns undefined if the city is not in our mapping.
 */
export function cityToGeoTargetResource(cityId: string): string | undefined {
  const id = CITY_GEO_IDS[cityId];
  return id ? `geoTargetConstants/${id}` : undefined;
}

/**
 * Convert a language code to a Google Ads language_constant resource name.
 */
export function languageToConstantResource(langCode: string): string | undefined {
  const id = LANGUAGE_IDS[langCode.toLowerCase()];
  return id ? `languageConstants/${id}` : undefined;
}
