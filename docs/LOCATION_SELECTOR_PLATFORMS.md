# Location selector — all 5 platforms, same UX and shared logic

## Summary

All five platforms (Snapchat, TikTok, Meta, Google, DV360) use the **same shared component** (`components/shared/location-selector.tsx`) and the **same logic**:

- **Same UI:** Cities tab (quick select + search) + Country / Region tab on every platform.
- **Same value shape:** `{ countryCodes: string[], cities: SelectedCity[] }` from `lib/locations.ts`.
- **Same behaviour:** Quick-select Saudi cities when no search; full filtered list when searching; selected cities list; country grid with search.
- **Only difference:** How each platform stores and sends the data (see table below). Snapchat is the only one with per-city **radius** (`enableRadiusPerCity`); the rest store city ids only.

## Per-platform mapping (same component, different state/API)

| Platform   | State / API shape | Cities stored as | Radius |
|-----------|-------------------|------------------|--------|
| **Snapchat** | `audience.countries`, `audience.cities` (id, name, lat, lng, radius in metres) | ✅ Full city + radius | ✅ Yes |
| **TikTok**   | `audience.locationIds`, `audience.cities` (our city ids) | ✅ City ids only (API has no radius) | ❌ No |
| **Meta**     | `audience.countries`, `audience.cities`, `audience.cityRadii` (km) | ✅ City ids + radius → geo_locations / proximity | ✅ Yes |
| **Google**   | `audience.locationIds`, `audience.cityIds`, `audience.cityRadii` (km) | ✅ City ids + radius → ProximityInfo | ✅ Yes |
| **DV360**    | `audience.geoTargets` (type `"country"` or `"city"`, id, name, radiusKm for cities) | ✅ type `"city"` with radiusKm | ✅ Yes |

## Data source

- **Single source of truth:** `lib/locations.ts` — `COUNTRIES`, `CITIES`, `getCountryByCode`, `getCityById`, `getPopularCities`. All platforms use these; add new countries/cities there only.

---

## Radius (per-city targeting radius): API support

**Radius is not Snapchat-only.** Several platforms support lat/lng + radius in their APIs:

| Platform   | API support for radius? | Notes |
|-----------|--------------------------|--------|
| **Snapchat** | ✅ Yes | Location circles: lat, lng, radius (metres). We already use `enableRadiusPerCity`. |
| **Meta**     | ✅ Yes | `geo_locations` can use **latitude, longitude, radius** (miles or km) for local / store traffic. |
| **Google**   | ✅ Yes | **Proximity targeting**: `ProximityInfo` with lat, lng, radius, units (e.g. km). Min radius 1 km. |
| **DV360**    | ✅ Yes | **Proximity targeting**: lat/lng + radius (miles or km). Min 1 km; radius must cover ≥1000 people. |
| **TikTok**   | ❌ No  | No radius targeting. Only country, state, city, county, DMA, zip — no “radius around a point”. |

So if we **enable radius for all** in the UI and then map to each API:

- **Snapchat** — already sends radius (metres).
- **Meta, Google, DV360** — we could turn on `enableRadiusPerCity` and store `radiusKm` per city, then when building the API request map each city to their format (Meta: geo_locations with lat/lng/radius; Google: `ProximityInfo`; DV360: proximity with lat/lng/radius). **Not a blocker.**
- **TikTok** — API does **not** support radius; we keep **no radius** for TikTok (city = city-level only, no slider).

**Summary:** Radius is supported by Snapchat, Meta, Google, and DV360. Only TikTok does not support it. We can safely enable the radius slider for Meta, Google, and DV360 once we map their payloads to the corresponding proximity/radius parameters.
