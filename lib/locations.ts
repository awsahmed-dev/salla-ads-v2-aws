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

export interface RegionOption {
  id: string;
  name: string;
  countryCode: string;
}

/** Value shape for the unified LocationSelector — platform-agnostic. */
export interface LocationSelection {
  countryCodes: string[];
  cities: SelectedCity[];
  regions: string[];
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

/** Countries supported for targeting (GCC + MENA). Saudi first for advertiser UX. */
export const COUNTRIES: CountryOption[] = [
  // GCC
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "UAE" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "QA", name: "Qatar" },
  // Levant
  { code: "EG", name: "Egypt" },
  { code: "JO", name: "Jordan" },
  { code: "IQ", name: "Iraq" },
  { code: "LB", name: "Lebanon" },
  { code: "PS", name: "Palestine" },
  // North Africa
  { code: "MA", name: "Morocco" },
  { code: "TN", name: "Tunisia" },
  { code: "DZ", name: "Algeria" },
  { code: "LY", name: "Libya" },
  { code: "SD", name: "Sudan" },
  // Other MENA
  { code: "YE", name: "Yemen" },
];

/** Regions / administrative divisions for optional narrowing within a country. */
export const REGIONS: RegionOption[] = [
  // Saudi Arabia — 13 administrative regions
  { id: "sa_riyadh", name: "Riyadh", countryCode: "SA" },
  { id: "sa_makkah", name: "Makkah", countryCode: "SA" },
  { id: "sa_madinah", name: "Madinah", countryCode: "SA" },
  { id: "sa_eastern", name: "Eastern Province", countryCode: "SA" },
  { id: "sa_qassim", name: "Qassim", countryCode: "SA" },
  { id: "sa_asir", name: "Asir", countryCode: "SA" },
  { id: "sa_tabuk", name: "Tabuk", countryCode: "SA" },
  { id: "sa_hail", name: "Hail", countryCode: "SA" },
  { id: "sa_northern_borders", name: "Northern Borders", countryCode: "SA" },
  { id: "sa_jazan", name: "Jazan", countryCode: "SA" },
  { id: "sa_najran", name: "Najran", countryCode: "SA" },
  { id: "sa_bahah", name: "Al Bahah", countryCode: "SA" },
  { id: "sa_jawf", name: "Al Jawf", countryCode: "SA" },
  // UAE — 7 emirates
  { id: "ae_abudhabi", name: "Abu Dhabi", countryCode: "AE" },
  { id: "ae_dubai", name: "Dubai", countryCode: "AE" },
  { id: "ae_sharjah", name: "Sharjah", countryCode: "AE" },
  { id: "ae_ajman", name: "Ajman", countryCode: "AE" },
  { id: "ae_umm_al_quwain", name: "Umm Al Quwain", countryCode: "AE" },
  { id: "ae_ras_al_khaimah", name: "Ras Al Khaimah", countryCode: "AE" },
  { id: "ae_fujairah", name: "Fujairah", countryCode: "AE" },
  // Egypt — key governorates
  { id: "eg_cairo", name: "Cairo", countryCode: "EG" },
  { id: "eg_giza", name: "Giza", countryCode: "EG" },
  { id: "eg_alexandria", name: "Alexandria", countryCode: "EG" },
  { id: "eg_dakahlia", name: "Dakahlia", countryCode: "EG" },
  { id: "eg_sharqia", name: "Sharqia", countryCode: "EG" },
  { id: "eg_qalyubia", name: "Qalyubia", countryCode: "EG" },
  { id: "eg_red_sea", name: "Red Sea", countryCode: "EG" },
  // Jordan
  { id: "jo_amman", name: "Amman", countryCode: "JO" },
  { id: "jo_irbid", name: "Irbid", countryCode: "JO" },
  { id: "jo_zarqa", name: "Zarqa", countryCode: "JO" },
  { id: "jo_aqaba", name: "Aqaba", countryCode: "JO" },
  // Iraq
  { id: "iq_baghdad", name: "Baghdad", countryCode: "IQ" },
  { id: "iq_erbil", name: "Erbil", countryCode: "IQ" },
  { id: "iq_basra", name: "Basra", countryCode: "IQ" },
  { id: "iq_sulaymaniyah", name: "Sulaymaniyah", countryCode: "IQ" },
  // Kuwait
  { id: "kw_capital", name: "Capital", countryCode: "KW" },
  { id: "kw_hawalli", name: "Hawalli", countryCode: "KW" },
  { id: "kw_farwaniya", name: "Farwaniya", countryCode: "KW" },
  { id: "kw_ahmadi", name: "Ahmadi", countryCode: "KW" },
  // Morocco
  { id: "ma_casablanca", name: "Casablanca-Settat", countryCode: "MA" },
  { id: "ma_rabat", name: "Rabat-Salé-Kénitra", countryCode: "MA" },
  { id: "ma_marrakech", name: "Marrakech-Safi", countryCode: "MA" },
  { id: "ma_tangier", name: "Tangier-Tétouan-Al Hoceïma", countryCode: "MA" },
  { id: "ma_fes", name: "Fès-Meknès", countryCode: "MA" },
];

/** Cities with lat/lng/radius for geo-targeting. Saudi cities first (most advertisers). */
export const CITIES: CityOption[] = [
  // Saudi Arabia
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
  // UAE
  { id: "dubai", name: "Dubai", countryCode: "AE", lat: 25.2048, lng: 55.2708, radiusKm: 25 },
  { id: "abudhabi", name: "Abu Dhabi", countryCode: "AE", lat: 24.4539, lng: 54.3773, radiusKm: 20 },
  { id: "sharjah", name: "Sharjah", countryCode: "AE", lat: 25.3463, lng: 55.4209, radiusKm: 15 },
  // Kuwait
  { id: "kuwait_city", name: "Kuwait City", countryCode: "KW", lat: 29.3759, lng: 47.9774, radiusKm: 20 },
  { id: "hawalli", name: "Hawalli", countryCode: "KW", lat: 29.3375, lng: 48.0286, radiusKm: 12 },
  // Bahrain
  { id: "manama", name: "Manama", countryCode: "BH", lat: 26.2285, lng: 50.586, radiusKm: 15 },
  { id: "riffa", name: "Riffa", countryCode: "BH", lat: 26.13, lng: 50.555, radiusKm: 10 },
  // Oman
  { id: "muscat", name: "Muscat", countryCode: "OM", lat: 23.588, lng: 58.3829, radiusKm: 20 },
  { id: "salalah", name: "Salalah", countryCode: "OM", lat: 17.0151, lng: 54.0924, radiusKm: 12 },
  // Qatar
  { id: "doha", name: "Doha", countryCode: "QA", lat: 25.2854, lng: 51.531, radiusKm: 20 },
  // Egypt
  { id: "cairo", name: "Cairo", countryCode: "EG", lat: 30.0444, lng: 31.2357, radiusKm: 30 },
  { id: "alexandria", name: "Alexandria", countryCode: "EG", lat: 31.2001, lng: 29.9187, radiusKm: 20 },
  { id: "giza", name: "Giza", countryCode: "EG", lat: 30.0131, lng: 31.2089, radiusKm: 15 },
  // Jordan
  { id: "amman", name: "Amman", countryCode: "JO", lat: 31.9454, lng: 35.9284, radiusKm: 20 },
  { id: "irbid", name: "Irbid", countryCode: "JO", lat: 32.5568, lng: 35.8469, radiusKm: 12 },
  // Iraq
  { id: "baghdad", name: "Baghdad", countryCode: "IQ", lat: 33.3152, lng: 44.3661, radiusKm: 25 },
  { id: "erbil", name: "Erbil", countryCode: "IQ", lat: 36.1912, lng: 44.0091, radiusKm: 15 },
  { id: "basra", name: "Basra", countryCode: "IQ", lat: 30.5085, lng: 47.7804, radiusKm: 15 },
  // Lebanon
  { id: "beirut", name: "Beirut", countryCode: "LB", lat: 33.8938, lng: 35.5018, radiusKm: 15 },
  { id: "tripoli_lb", name: "Tripoli", countryCode: "LB", lat: 34.4367, lng: 35.8497, radiusKm: 12 },
  // Palestine
  { id: "ramallah", name: "Ramallah", countryCode: "PS", lat: 31.9038, lng: 35.2034, radiusKm: 10 },
  { id: "gaza", name: "Gaza", countryCode: "PS", lat: 31.5017, lng: 34.4668, radiusKm: 12 },
  { id: "nablus", name: "Nablus", countryCode: "PS", lat: 32.2211, lng: 35.2544, radiusKm: 10 },
  // Morocco
  { id: "casablanca", name: "Casablanca", countryCode: "MA", lat: 33.5731, lng: -7.5898, radiusKm: 25 },
  { id: "rabat", name: "Rabat", countryCode: "MA", lat: 34.0209, lng: -6.8416, radiusKm: 15 },
  { id: "marrakech", name: "Marrakech", countryCode: "MA", lat: 31.6295, lng: -7.9811, radiusKm: 15 },
  { id: "tangier", name: "Tangier", countryCode: "MA", lat: 35.7595, lng: -5.834, radiusKm: 12 },
  { id: "fes", name: "Fes", countryCode: "MA", lat: 34.0181, lng: -5.0078, radiusKm: 15 },
  // Tunisia
  { id: "tunis", name: "Tunis", countryCode: "TN", lat: 36.8065, lng: 10.1815, radiusKm: 20 },
  { id: "sfax", name: "Sfax", countryCode: "TN", lat: 34.7406, lng: 10.7603, radiusKm: 12 },
  { id: "sousse", name: "Sousse", countryCode: "TN", lat: 35.8254, lng: 10.636, radiusKm: 12 },
  // Algeria
  { id: "algiers", name: "Algiers", countryCode: "DZ", lat: 36.7538, lng: 3.0588, radiusKm: 25 },
  { id: "oran", name: "Oran", countryCode: "DZ", lat: 35.6969, lng: -0.6331, radiusKm: 15 },
  { id: "constantine", name: "Constantine", countryCode: "DZ", lat: 36.365, lng: 6.6147, radiusKm: 12 },
  // Libya
  { id: "tripoli_ly", name: "Tripoli", countryCode: "LY", lat: 32.8872, lng: 13.1913, radiusKm: 20 },
  { id: "benghazi", name: "Benghazi", countryCode: "LY", lat: 32.1194, lng: 20.0868, radiusKm: 15 },
  // Sudan
  { id: "khartoum", name: "Khartoum", countryCode: "SD", lat: 15.5007, lng: 32.5599, radiusKm: 20 },
  { id: "omdurman", name: "Omdurman", countryCode: "SD", lat: 15.6445, lng: 32.4777, radiusKm: 15 },
  // Yemen
  { id: "sanaa", name: "Sanaa", countryCode: "YE", lat: 15.3694, lng: 44.191, radiusKm: 20 },
  { id: "aden", name: "Aden", countryCode: "YE", lat: 12.7855, lng: 45.0187, radiusKm: 15 },
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

export function getRegionsByCountry(countryCode: string): RegionOption[] {
  return REGIONS.filter((r) => r.countryCode === countryCode);
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
