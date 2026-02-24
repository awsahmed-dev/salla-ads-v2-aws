# Targeting Summary — Shared Card Plan

## 1. Current state (per platform)

### Snapchat (`components/snapchat/step-audience.tsx`)
- **Card:** "Targeting Summary" with Users icon (primary/green).
- **Rows:** Countries · Cities (if any) · Gender · Age · Languages · Interests · Devices · Exclude buyers (conditional) · Lookalike (conditional).
- **Layout:** Two-column, `text-xs`, label left (muted), value right (font-medium). Truncate long values (`max-w-[140px]`).

### Meta (`components/meta/step-audience.tsx`)
- **Card:** "Targeting Summary" with Users icon (blue `#1877F2`).
- **Rows:** Countries · Gender · Age · Languages · Interests · Behaviors · Devices · Advantage+ · Exclude Buyers (conditional) · Lookalike (conditional).
- **Layout:** Same two-column pattern. No Cities row.

### TikTok (`components/tiktok/step-audience.tsx`)
- **Card:** "Targeting Summary" with Users icon (primary).
- **Rows:** Location (countries + “+ N cities”) · Gender · Age · Languages · Interests · Devices · Exclude buyers (conditional).
- **Layout:** Same two-column pattern.

### Google (`components/google/step-audience.tsx`)
- **Card:** "Targeting Summary" with Users icon (primary).
- **Common rows:** Location (countries + city count) · Gender · Age · Languages.
- **Objective-specific rows:**
  - **App:** App Store · App ID · Goal · Targeting.
  - **PMax:** Search themes · Custom segments.
  - **Search:** Keywords · Negative keywords · Audience mode · RLSA lists · Audience segments · Search Partners · Ad schedule.
  - **Display:** Content keywords · Topics · Placements · Excluded · Optimized targeting · Audience segments · Remarketing.
  - **Other (e.g. Demand Gen):** Interests · Remarketing.
- **Layout:** Same two-column pattern.

### DV360 (`components/dv360/step-audience.tsx`)
- **Block:** "Audience Summary" (no card title “Targeting Summary”), inside a card with LocationReachCard above.
- **Rows:** Locations · Languages · Age Ranges · Genders · Interests · Keywords · Inventory · Devices · Optimized Targeting · Target Frequency (conditional, Awareness).
- **Layout:** Same two-column pattern; some values use accent color (e.g. red for Optimized Targeting On).

---

## 2. Common pattern

Across platforms:

- **Container:** Card (or card-like block) with padding.
- **Header:** Icon (Users / people) + title ("Targeting Summary" or "Audience Summary").
- **Body:** List of rows; each row = **label** (left, muted) + **value** (right, font-medium). Optional truncation for long values.
- **Accent:** Icon and optional accent color (primary, meta blue, dv360 red).

Differences:

- **Which rows:** Each platform has a different set and different state (e.g. `aud.countries` vs `audience.geoTargets`).
- **Conditional rows:** Some rows only for certain objectives or when a feature is on (e.g. Exclude buyers, Lookalike, App, Search, Display).
- **Value formatting:** Country names vs codes, “All” vs “None”, age “55+” vs “65+”, etc.

So the shared piece is **presentation** (card + header + list of label/value rows), not the **data**. Each platform should keep computing its own list of rows from its audience (and objective) state.

---

## 3. Proposed shared component

### 3.1 API

**Component:** `components/shared/targeting-summary-card.tsx`

**Props:**

- **`rows`:** `Array<{ label: string; value: React.ReactNode; highlight?: boolean }>`  
  - Each platform builds this array from its audience (and objective).
  - `highlight`: optional (e.g. for “Exclude buyers”, “Lookalike”, “Optimized Targeting On”) to use accent color on the value.
- **`title`:** `string` — e.g. `"Targeting Summary"` or `"Audience Summary"`.
- **`accent`:** `"primary" | "meta" | "dv360"` — for icon and optional highlight color.
- **`className`:** optional.

No direct dependency on campaign/audience types; all logic stays in the parent.

### 3.2 Layout and behavior

- Card: same rounded border/card style as current summaries.
- Header: icon (Users) with accent background + title.
- Body: `flex flex-col gap-2 text-xs`; each row `flex justify-between` with label (muted) and value (font-medium, optional truncate).
- If `highlight`, render value with accent color (e.g. `text-primary` / `text-[#1877F2]` / `text-red-600`).
- Optional: `valueClassName` per row for one-off overrides (e.g. truncate width).

### 3.3 Row contract

- **label:** string, shown on the left.
- **value:** ReactNode, shown on the right (string, number, or inline elements).
- **highlight:** optional boolean for accent-colored value.

Platforms can add any number of rows in any order (including platform-only and conditional rows).

---

## 4. Platform mapping (what each passes)

Each platform’s step-audience (or equivalent) would:

1. Compute `rows` from `audience` (and `campaign.objective` where needed).
2. Render `<TargetingSummaryCard title="Targeting Summary" accent="…" rows={rows} />`.

Suggested row **labels** for consistency where the meaning is the same (platforms can still use a different label if needed):

| Concept        | Suggested label | Notes |
|----------------|------------------|--------|
| Geography      | "Countries" / "Location" / "Locations" | Snap/Google use Location + cities; Meta Countries; DV360 Locations. |
| Cities         | "Cities"         | Only when shown as separate row (e.g. Snap). |
| Gender         | "Gender"         | |
| Age            | "Age" / "Age Ranges" | DV360 uses “Age Ranges”. |
| Languages      | "Languages"      | |
| Interests      | "Interests"      | |
| Devices        | "Devices"        | |
| Exclude buyers | "Exclude buyers" / "Exclude Buyers" | Conditional. |
| Lookalike      | "Lookalike"      | Conditional. |
| Behaviors      | "Behaviors"      | Meta-only. |
| Advantage+     | "Advantage+"     | Meta-only. |
| Custom audiences | (optional)      | If we add a row for include/exclude counts. |

Platform-specific rows (App, Search, Display, PMax, DV360 Inventory/Keywords/Target Frequency/Optimized Targeting, etc.) stay as extra entries in that platform’s `rows` array.

---

## 5. Implementation steps

1. **Add shared component**  
   - Create `components/shared/targeting-summary-card.tsx` with props above.  
   - Use existing card + two-column row layout; support `highlight` and optional `valueClassName` if needed.

2. **Snapchat**  
   - Build `rows` from `aud` (countries, cities, gender, age, languages, interests, devices, exclude buyers, lookalike).  
   - Replace current Targeting Summary block with `<TargetingSummaryCard title="Targeting Summary" accent="primary" rows={rows} />`.

3. **Meta**  
   - Build `rows` from `aud` (countries, gender, age, languages, interests, behaviors, devices, Advantage+, exclude buyers, lookalike).  
   - Replace current block with `<TargetingSummaryCard title="Targeting Summary" accent="meta" rows={rows} />`.

4. **TikTok**  
   - Build `rows` from `aud` (location + cities, gender, age, languages, interests, devices, exclude buyers).  
   - Replace current block with `<TargetingSummaryCard title="Targeting Summary" accent="primary" rows={rows} />`.

5. **Google**  
   - Build common rows (location, gender, age, languages) plus objective-based rows (App / PMax / Search / Display / other).  
   - Replace current block with `<TargetingSummaryCard title="Targeting Summary" accent="primary" rows={rows} />`.

6. **DV360**  
   - Build `rows` from `audience` (locations, languages, age ranges, genders, interests, keywords, inventory, devices, optimized targeting, target frequency if awareness).  
   - Replace “Audience Summary” block with `<TargetingSummaryCard title="Audience Summary" accent="dv360" rows={rows} />` (or keep title "Audience Summary" for consistency with current copy).

7. **Docs and tests**  
   - Update this doc with “Implemented” and any prop changes.  
   - Optionally add a short story or test that renders the card with mock `rows` for each accent.

---

## 6. Benefits

- **Single UI:** One card component for all platforms; same look, spacing, and behavior.
- **Easier changes:** Summary layout/accessibility/truncation improved in one place.
- **Clear data boundary:** Each platform keeps full control over which rows exist and how values are formatted; no shared audience type required.
- **Scalable:** New rows or platforms = pass more or different `rows`; no component API change needed for simple cases.

---

## 7. Optional enhancements (later)

- **Expand/collapse** for long lists (e.g. “Show 5 more”).
- **Tooltips** on truncated values (e.g. full country or segment list).
- **Localization:** Pass translated `title` and row `label`s from the parent so the component stays presentational.
