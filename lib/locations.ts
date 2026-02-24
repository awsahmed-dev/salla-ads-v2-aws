/**
 * Shared location data for all ad platforms (Step 1 — Audience).
 * Country codes align with ISO 3166-1 alpha-2. City IDs and coordinates
 * are compatible with Snapchat, Meta, Google, TikTok, and DV360 targeting.
 */

export interface CountryOption {
  code: string;
  name: string;
}

export interface CityOption {
  id: string;
  name: string;
  countryCode: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

/** Value shape for the unified LocationSelector — platform-agnostic. */
export interface LocationSelection {
  countryCodes: string[];
  cities: SelectedCity[];
}

export interface SelectedCity {
  id: string;
  name: string;
  countryCode: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

/** Primary market for advertisers — shown first in city list. */
export const PRIMARY_COUNTRY_CODE = "SA";

/** Countries supported for targeting (GCC + key MENA). Saudi first for advertiser UX. */
export const COUNTRIES: CountryOption[] = [
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "UAE" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "QA", name: "Qatar" },
  { code: "EG", name: "Egypt" },
  { code: "JO", name: "Jordan" },
  { code: "IQ", name: "Iraq" },
];

/** Cities with lat/lng/radius for geo-targeting. Saudi cities first (most advertisers). */
export const CITIES: CityOption[] = [
  // Saudi Arabia — comprehensive list for advertiser targeting
  { id: "riyadh", name: "Riyadh", countryCode: "SA", lat: 24.7136, lng: 46.6753, radiusKm: 30 },
  { id: "jeddah", name: "Jeddah", countryCode: "SA", lat: 21.5433, lng: 39.1728, radiusKm: 25 },
  { id: "mecca", name: "Mecca", countryCode: "SA", lat: 21.3891, lng: 39.8579, radiusKm: 15 },
  { id: "medina", name: "Medina", countryCode: "SA", lat: 24.4539, lng: 39.6142, radiusKm: 15 },
  { id: "dammam", name: "Dammam", countryCode: "SA", lat: 26.3927, lng: 49.9777, radiusKm: 20 },
  { id: "khobar", name: "Khobar", countryCode: "SA", lat: 26.2172, lng: 50.1971, radiusKm: 15 },
  { id: "dhahran", name: "Dhahran", countryCode: "SA", lat: 26.2886, lng: 50.1142, radiusKm: 12 },
  { id: "jubail", name: "Jubail", countryCode: "SA", lat: 27.0174, lng: 49.6572, radiusKm: 15 },
  { id: "yanbu", name: "Yanbu", countryCode: "SA", lat: 24.0895, lng: 38.0617, radiusKm: 15 },
  { id: "tabuk", name: "Tabuk", countryCode: "SA", lat: 28.3838, lng: 36.555, radiusKm: 15 },
  { id: "abha", name: "Abha", countryCode: "SA", lat: 18.2164, lng: 42.5053, radiusKm: 12 },
  { id: "khamis_mushait", name: "Khamis Mushait", countryCode: "SA", lat: 18.3093, lng: 42.7662, radiusKm: 12 },
  { id: "taif", name: "Taif", countryCode: "SA", lat: 21.2703, lng: 40.4158, radiusKm: 12 },
  { id: "hail", name: "Hail", countryCode: "SA", lat: 27.5114, lng: 41.7208, radiusKm: 12 },
  { id: "buraidah", name: "Buraidah", countryCode: "SA", lat: 26.326, lng: 43.975, radiusKm: 12 },
  { id: "al_mubarraz", name: "Al Mubarraz", countryCode: "SA", lat: 25.4416, lng: 49.5762, radiusKm: 12 },
  { id: "al_hofuf", name: "Al Hofuf", countryCode: "SA", lat: 25.3635, lng: 49.5852, radiusKm: 15 },
  { id: "jazan", name: "Jazan", countryCode: "SA", lat: 16.8892, lng: 42.5706, radiusKm: 12 },
  { id: "najran", name: "Najran", countryCode: "SA", lat: 17.4917, lng: 44.1314, radiusKm: 12 },
  { id: "arar", name: "Arar", countryCode: "SA", lat: 30.9753, lng: 41.0381, radiusKm: 12 },
  { id: "sakaka", name: "Sakaka", countryCode: "SA", lat: 29.9697, lng: 40.2064, radiusKm: 12 },
  { id: "al_bahah", name: "Al Bahah", countryCode: "SA", lat: 20.0129, lng: 41.4677, radiusKm: 12 },
  { id: "al_kharj", name: "Al Kharj", countryCode: "SA", lat: 24.1553, lng: 47.3125, radiusKm: 12 },
  { id: "qatif", name: "Qatif", countryCode: "SA", lat: 26.5582, lng: 50.0089, radiusKm: 12 },
  // UAE & other GCC / MENA
  { id: "dubai", name: "Dubai", countryCode: "AE", lat: 25.2048, lng: 55.2708, radiusKm: 25 },
  { id: "abudhabi", name: "Abu Dhabi", countryCode: "AE", lat: 24.4539, lng: 54.3773, radiusKm: 20 },
  { id: "sharjah", name: "Sharjah", countryCode: "AE", lat: 25.3463, lng: 55.4209, radiusKm: 15 },
  { id: "kuwait_city", name: "Kuwait City", countryCode: "KW", lat: 29.3759, lng: 47.9774, radiusKm: 20 },
  { id: "hawalli", name: "Hawalli", countryCode: "KW", lat: 29.3375, lng: 48.0286, radiusKm: 12 },
  { id: "manama", name: "Manama", countryCode: "BH", lat: 26.2285, lng: 50.586, radiusKm: 15 },
  { id: "riffa", name: "Riffa", countryCode: "BH", lat: 26.13, lng: 50.555, radiusKm: 10 },
  { id: "muscat", name: "Muscat", countryCode: "OM", lat: 23.588, lng: 58.3829, radiusKm: 20 },
  { id: "salalah", name: "Salalah", countryCode: "OM", lat: 17.0151, lng: 54.0924, radiusKm: 12 },
  { id: "doha", name: "Doha", countryCode: "QA", lat: 25.2854, lng: 51.531, radiusKm: 20 },
  { id: "cairo", name: "Cairo", countryCode: "EG", lat: 30.0444, lng: 31.2357, radiusKm: 30 },
  { id: "alexandria", name: "Alexandria", countryCode: "EG", lat: 31.2001, lng: 29.9187, radiusKm: 20 },
  { id: "giza", name: "Giza", countryCode: "EG", lat: 30.0131, lng: 31.2089, radiusKm: 15 },
  { id: "amman", name: "Amman", countryCode: "JO", lat: 31.9454, lng: 35.9284, radiusKm: 20 },
  { id: "irbid", name: "Irbid", countryCode: "JO", lat: 32.5568, lng: 35.8469, radiusKm: 12 },
  { id: "baghdad", name: "Baghdad", countryCode: "IQ", lat: 33.3152, lng: 44.3661, radiusKm: 25 },
  { id: "erbil", name: "Erbil", countryCode: "IQ", lat: 36.1912, lng: 44.0091, radiusKm: 15 },
  { id: "basra", name: "Basra", countryCode: "IQ", lat: 30.5085, lng: 47.7804, radiusKm: 15 },
];

export function getCountryByCode(code: string): CountryOption | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function getCitiesByCountry(countryCode: string): CityOption[] {
  return CITIES.filter((c) => c.countryCode === countryCode);
}

export function getCityById(id: string): CityOption | undefined {
  return CITIES.find((c) => c.id === id);
}

/** Top Saudi cities for one-tap "Quick select" when no search — keeps UI compact. */
export const POPULAR_CITY_IDS = [
  "riyadh",
  "jeddah",
  "mecca",
  "medina",
  "dammam",
  "khobar",
] as const;

export function getPopularCities(): CityOption[] {
  return POPULAR_CITY_IDS.map((id) => getCityById(id)).filter(
    (c): c is CityOption => c != null
  );
}

/** Emoji for country (regional indicator symbols). */
export function countryEmoji(code: string): string {
  if (code.length !== 2) return "🌐";
  const a = 0x1f1e6 - 0x41 + code.charCodeAt(0);
  const b = 0x1f1e6 - 0x41 + code.charCodeAt(1);
  return String.fromCodePoint(a, b);
}
