# Audience Size card — logic, source, and enhancements

## Current Step 1 behaviour

**Step 1 (Audience)** now shows only the **location-only** reach card (`LocationReachCard`), which estimates reach from selected countries and cities only. Full estimated reach (gender, age, interests, etc.) is **not** shown in Step 1. It may be introduced later (e.g. after budget is set) if the product adds it. See `components/shared/location-reach-card.tsx` and `docs/LOCATION_SELECTOR_PLATFORMS.md` for the location-only logic and platform usage.

---

## What the old Audience Size card was (reference)

The **Audience Size** card (previously in the right column on Step 1) showed:

- A **Narrow → Broad** bar (fill % and label: Very narrow / Narrow / Balanced / Broad / Very broad)
- **Estimated range** (e.g. 6.8M - 9.2M)
- Copy: *"Estimated audience size based on your targeting settings."*
- Optional warning when the audience is very narrow (<20%)

---

## Built by us, not from platform APIs

The numbers and the bar are **not** from Snapchat, Meta, Google, TikTok, or DV360 APIs. They are a **client-side heuristic** implemented in each platform’s `step-audience.tsx`. There is no call to a “reach estimate” or “audience size” endpoint; the same idea is reimplemented per platform with small differences.

So:

- **Source:** Our own formula in the Salla Ads UI.
- **Purpose:** Give advertisers instant feedback on how targeting choices affect potential reach (narrow vs broad).
- **Limitation:** It’s an approximation. Real reach depends on platform delivery, competition, and budget.

---

## How the logic works (per platform)

### Shared idea

1. **Base size** from location (countries):
   - `baseSize = number_of_countries × per_country_cap`
   - Snapchat, TikTok, Google: `8_000_000` per country.
   - Meta: `9_000_000` per country.

2. **Multipliers** (0–1) from other targeting:
   - **Gender:** one gender selected → 0.5; both / all → 1.
   - **Age:** `min(1, (ageMax - ageMin) / 42)` or `…/ 47` (wider range → closer to 1).
   - **Interests:** if any selected → `max(0.3, 1 - count × 0.07)` (or 0.05 for Google segments); else 1.
   - **Meta only:** behaviors → `max(0.4, 1 - count × 0.08)`; else 1.

3. **Point estimate and range:**
   - `estimatedSize = round(baseSize × genderMult × ageMult × interestMult [× behaviorMult])`
   - `estimatedMin = round(estimatedSize × 0.85)`, `estimatedMax = round(estimatedSize × 1.15)`.

4. **Narrow–Broad bar and label:**
   - `sizePercent = min(100, (estimatedSize / 30_000_000) × 100)` (cap at 30M).
   - Labels: &lt;20% Very narrow, &lt;40% Narrow, &lt;65% Balanced, &lt;85% Broad, ≥85% Very broad.
   - Bar width = `sizePercent%`; color by band (red / amber / green / blue / purple).

5. **Display:** `estimatedMin`–`estimatedMax` is shown (e.g. 6.8M - 9.2M); the label under the bar is the band (e.g. “Narrow”).

### What is not in the formula today

- **Cities:** Selecting cities (or city + radius) does **not** reduce the estimate; only countries count in `baseSize`. So city-level targeting can make the real reach smaller than the card suggests.
- **Radius:** Tighter radius is not reflected; the card treats country/city the same for the base.
- **DV360:** There is no Audience Size card in DV360 step-audience yet; the same logic could be added.

---

## How we can enhance it

1. **Unify in a shared component**  
   - One `AudienceSizeCard` in `components/shared/` that takes:
     - `estimatedSize`, `estimatedMin`, `estimatedMax` (or a small config that encodes the formula).
     - Optional `sizePercent` / `sizeLabel` / colors, or derive them inside the component.
   - All platforms (including DV360) use this component so the UI and bands are identical and we improve the logic in one place.

2. **Factor in location granularity (cities + radius)**  
   - When the user has selected cities (and optionally radius), apply a **location multiplier** (e.g. &lt;1) so that:
     - Country-only → multiplier 1 (current behavior).
     - Cities selected → e.g. `0.3–0.7` depending on number of cities and total radius (e.g. sum of city “area” or population proxy).
   - Use the same `LocationSelection` (and radius where we have it) so the card stays in sync with the unified location selector.

3. **Unify the formula across platforms**  
   - Same `baseSize` rule (e.g. per-country cap), same multiplier rules (gender, age, interests), and for Meta add behaviors in the shared helper.  
   - Platform-specific only where needed (e.g. “segment count” for Google instead of “interests” if we keep different targeting models).  
   - Document the single formula in this file and in the shared component.

4. **Add DV360**  
   - Reuse the same shared card and formula for DV360 (e.g. `baseSize` from geoTargets countries, then age/gender/interests if we have them in the UI).

5. **Optional: use platform reach APIs when available**  
   - Some platforms expose reach or audience size endpoints (e.g. Meta reach estimate, Google forecast).  
   - We could:
     - Call those when the user has finished selecting targeting (e.g. debounced) and show “Estimated reach from [Platform]” when available.
     - Fall back to our heuristic when the API is not available or not called.  
   - That would make the card “supported” by the platform only where we integrate such an API; the rest remains our estimate.

6. **Tooltip and copy**  
   - Add a short tooltip or help text: “Rough estimate from your targeting. Real reach depends on platform, competition, and budget.”  
   - Optionally: “City and radius targeting can reduce actual reach further.”

7. **Warning thresholds**  
   - Keep the “Audience may be too narrow” warning when `sizePercent < 20` (or a configurable threshold).  
   - Optionally add a “Very broad” tip when &gt;85% to suggest narrowing for relevance.

---

## Summary

| Question | Answer |
|----------|--------|
| **Logic** | Client-side formula: base (countries × 8–9M) × gender × age × interests [× behaviors]; then ±15% range and a 0–100% gauge vs 30M cap. |
| **Built by us or platform?** | **Built by us.** No platform API is used for this card. |
| **Enhancements** | Unify in a shared component, factor in cities/radius, add DV360, optionally plug in platform reach APIs where available, improve tooltips and thresholds. |
