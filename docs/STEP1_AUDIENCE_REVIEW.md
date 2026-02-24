# Step 1 (Audience) Review: Hierarchy, Misplaced Cards & Advanced Settings

## 1. Current state per platform

### Snapchat – Left column (main)
| Order | Card | In Advanced? |
|-------|------|--------------|
| 1 | Location | No |
| 2 | Demographics | No |
| 3 | Interests | No |
| 4 | Salla Smart Features | No |
| 5 | **Advanced** → Custom Audiences, Device Targeting, Regulated Content, Audience Expansion | Yes |

### Snapchat – Right column (sidebar)
| Order | Card |
|-------|------|
| 1 | LocationReachCard |
| 2 | Delivery Check |
| 3 | Targeting Summary |
| 4 | Checklist (with progress bar) |

---

### Meta – Left column
| Order | Card | In Advanced? |
|-------|------|--------------|
| 1 | Location | No |
| 2 | Demographics | No |
| 3 | Interest Targeting | No |
| 4 | **Behavior Targeting** (Meta-specific) | No |
| 5 | Salla Smart Features | No |
| 6 | **Advanced** → Custom Audiences, Device Targeting, Advantage+ Audience | Yes |

### Meta – Right column
| Order | Card |
|-------|------|
| 1 | LocationReachCard |
| 2 | Delivery Check (inline checklist, no progress bar) |
| 3 | Targeting Summary |
| 4 | Salla Tip (platform tip) |

---

### TikTok – Left column
| Order | Card | In Advanced? |
|-------|------|--------------|
| 1 | Location | No |
| 2 | Demographics | No |
| 3 | Interests | No |
| 4 | Salla Smart Features | No |
| 5 | **Advanced** → Custom Audiences, Device Targeting, Audience Expansion | Yes |

### TikTok – Right column
| Order | Card |
|-------|------|
| 1 | LocationReachCard |
| 2 | Delivery Check |
| 3 | Targeting Summary |
| 4 | Checklist (with progress bar) |

---

### Google – Left column
| Order | Card | In Advanced? |
|-------|------|--------------|
| 0 | **App Settings** (APP objective only) | No |
| 1 | Location | No |
| 2 | Demographics | No |
| 2b | **Keywords** (Search only) | No |
| 3 | Interests (In-Market & Affinity) – hidden Shopping/App | No |
| 3b | Negative Keywords (Shopping only) | No |
| 3c | Lookalike Segments (Demand Gen) | No |
| 3d | Customer Match (Demand Gen) | No |
| 3e | Remarketing / RLSA (Search) | No |
| 3f | **Display Content Targeting** (Display: keywords, topics, placements) | No |
| 4 | Salla Smart Features – hidden App | No |
| 5 | **Advanced** → Search Themes (PMax), Custom Segments (PMax), Remarketing (non-Search), Ad Schedule (Search), Device Bid Adjustments (Search) / DeviceTargetingCard (non-Search), Advanced Demographics (Search: income, parental) | Yes |

### Google – Right column
| Order | Card |
|-------|------|
| 1 | LocationReachCard |
| 2 | Product Inventory (Shopping only) |
| 3 | Audience Reach (Demand Gen only) |
| 4 | Keyword Summary (Search only) |
| 5 | Signal Strength (PMax only) |
| 6 | Delivery Check |
| 7 | Targeting Summary |

---

### DV360 – Left column (no “Advanced” section)
| Order | Card | Collapsible? |
|-------|------|--------------|
| 1 | Geographic Targeting (Location) | No |
| 2 | Demographics | No |
| 3 | Additional targeting (Parental, Household income) | Yes (showDemographics) |
| 3b | Salla Smart Features | No |
| 4 | Audience Segments (Interests – In-Market + Affinity) | Yes (showInterests) |
| 5 | Keyword Targeting | Yes (showKeywords) |
| 6 | YouTube & Partners Inventory | No |
| 7 | Device Targeting | No |
| (cond.) | Target Frequency (Awareness) | No |
| (cond.) | View Engagement Optimization (Consideration) | No |
| (cond.) | Conversion Optimization (Conversion) | No |
| (cond.) | AI Signal Optimization + Audience Signals (Performance) | No |
| (final) | Optimized Targeting | No |

### DV360 – Right column
| Order | Card |
|-------|------|
| 1 | LocationReachCard |
| 2 | TargetingSummaryCard (Audience Summary) |

---

## 2. Recommended unified hierarchy (best practice for advertisers)

**Principle:** Who → Where (geo) → What they care about (interests/behaviors) → Salla/retargeting → Refinements (devices, expansion, schedules).

### Recommended left-column order (all platforms where applicable)

| # | Category | Cards (unified concept) | Rationale |
|---|----------|-------------------------|-----------|
| 1 | **Who & Where** | Location, then Demographics | Advertisers think “who and where” first; demographics define who. |
| 2 | **Interest / intent** | Interests (or In-Market/Affinity, Behaviors) | Core targeting: what they like or intend. |
| 3 | **Salla & first-party** | Salla Smart Features, then Custom Audiences (include/exclude) | Brand-specific: exclusions and lookalikes before generic refinements. |
| 4 | **Refinements** | Device targeting, Regulated content (if any), Audience expansion / Advantage+ / Optimized targeting | Optional narrowing or AI expansion. |

### Recommended right-column order (sidebar)

| # | Card | Rationale |
|---|------|-----------|
| 1 | Location Reach | Immediate feedback on geo choices. |
| 2 | Delivery Check | Clear go/no-go before proceeding. |
| 3 | Targeting Summary | At-a-glance recap. |
| 4 | Checklist (optional) | Snapchat/TikTok-style progress; can merge with Delivery Check. |
| 5 | Platform tip (optional) | e.g. Meta’s “Salla Tip”; keep last so it doesn’t distract. |

---

## 3. Cards that may be in Step 1 by mistake (and where to move them)

| Card | Platform | Current location | Recommendation | Reason |
|------|----------|------------------|----------------|--------|
| **App Settings** (App ID, store, goal) | Google | Step 1 (Audience) top when objective = APP | **Move to Step 0 (Objective)** or keep as first card only when Objective = App. | App ID and store are campaign/objective-level; they define *what* is promoted, not *who*. Keeping them in Step 0 (or a dedicated “App campaign setup” right after objective) gives a clearer mental model. If we keep in Step 1, keep at very top and label as “App campaign setup” so it’s clear it’s not “audience” in the classic sense. |
| **Display Content Targeting** (keywords, topics, placements, excluded placements) | Google | Step 1 (main, 3f) | **Consider moving to Step 3 (Ad Design)** or keep in Step 1 but group under “Display targeting”. | In Google Ads API this lives on the ad group/creative (Display campaign). Putting it in Ad Design would align “where the ad shows” (placements/topics) with creative. Keeping it in Step 1 is also defensible as “audience/content context.” **Recommendation:** Keep in Step 1 but clearly label as “Display content & placements” so advertisers see it as part of “who sees my ad and in what context.” |
| **Product Inventory** (Shopping) | Google | Step 1 right column | **Keep in Step 1** or move to **Step 4 (Launch/Review)**. | It’s read-only feedback (feed status). Step 1 is fine as “context for this campaign”; alternatively Review step could show “Product feed status” with other pre-launch checks. **Recommendation:** Keep in Step 1 sidebar as is. |
| **Ad Schedule / Dayparting** | Google | Step 1 Advanced (Search only) | **Move to Step 2 (Budget)**. | When ads run is a budget/scheduling concern, not who we target. Most platforms put schedule in Budget step. **Recommendation:** Move Ad Schedule to Step 2 (Budget) for Google Search; keep device bid adjustments in Step 1 Advanced. |
| **Device Bid Adjustments** (Search) | Google | Step 1 Advanced | **Keep in Step 1** (Advanced). | Device is a targeting/delivery dimension; bid adjustment is a targeting refinement. Keeping in Audience step is consistent. |
| **Household Income / Parental Status** (Search) | Google | Step 1 Advanced | **Keep in Step 1** (Advanced). | These are demographic refinements; Audience step is correct. |
| **Target Frequency** (Awareness) | DV360 | Step 1 main | **Consider moving to Step 2 (Budget)**. | Frequency cap is often a budget/delivery setting. **Recommendation:** Either keep in Step 1 under “Delivery options” or move to Step 2; document the choice so DV360 matches other platforms (if we move schedule to Budget elsewhere, moving frequency to Budget here is consistent). |

---

## 4. Advanced settings: keep vs show on same page

| Platform | Current Advanced contents | Recommendation |
|----------|---------------------------|----------------|
| **Snapchat** | Custom Audiences, Device, Regulated Content, Audience Expansion | **Keep Advanced.** Custom Audiences and Device are refinements; Regulated and Expansion are secondary. One “Advanced” section is clean. |
| **Meta** | Custom Audiences, Device, Advantage+ Audience | **Keep Advanced.** Same logic; keeps main flow to Location → Demographics → Interests → Behaviors → Salla. |
| **TikTok** | Custom Audiences, Device, Audience Expansion | **Keep Advanced.** Same as Snapchat. |
| **Google** | Search Themes, Custom Segments, Remarketing (non-Search), Ad Schedule (Search), Device, Advanced Demographics (Search) | **Keep Advanced**, but **move Ad Schedule to Step 2 (Budget)**. Rest (themes, segments, remarketing, device, demographics) are refinements and fit well in Advanced. |
| **DV360** | No single “Advanced” block; uses collapsible sections (Additional targeting, Audience Segments, Keyword Targeting) | **Option A:** Keep as is (collapsible sections). **Option B:** Add one “Advanced” section containing: Additional targeting (parental, income), Keyword targeting, Inventory, Device, then objective-specific (Frequency, Optimized Targeting, etc.). **Recommendation:** Option A for now; DV360 has many objective-specific blocks, so a single “Advanced” might be long. Unify **order** with other platforms instead of forcing one big Advanced. |

**Summary:** Keep “Advanced” on Snapchat, Meta, TikTok, and Google. Move only **Ad Schedule** (Google Search) from Step 1 Advanced to Step 2 (Budget). Show all other cards on the same page (within main vs advanced) as today; no need to flatten Advanced into the main list.

---

## 5. Proposed reorder changes (implementation)

### 5.1 Snapchat
- **Left:** 1 Location, 2 Demographics, 3 Interests, **4 Salla Smart Features**, **5 Custom Audiences** (promote from Advanced), **6 Advanced** → Device, Regulated Content, Audience Expansion.
- **Rationale:** Custom Audiences (include/exclude) are high value; promote so they’re visible without expanding Advanced. Optional: keep Custom Audiences inside Advanced to avoid clutter; then order inside Advanced: Custom Audiences → Device → Regulated → Expansion.
- **Right:** Keep: Location Reach → Delivery Check → Targeting Summary → Checklist. (No change.)

### 5.2 Meta
- **Left:** 1 Location, 2 Demographics, 3 Interest, 4 **Salla Smart Features**, 5 Behavior, **6 Advanced** → Custom Audiences, Device, Advantage+.
- **Rationale:** Salla before Behavior so “my store” settings come before platform-specific behavior. Alternatively: keep Behavior before Salla (current) so “who they are” (interests + behavior) is one block, then Salla. **Recommended:** Location → Demographics → Interests → **Salla Smart Features** → Behavior → Advanced (Custom, Device, Advantage+).
- **Right:** Location Reach → Delivery Check → Targeting Summary → Salla Tip. Consider adding Checklist with progress bar (like Snapchat/TikTok) for consistency.

### 5.3 TikTok
- **Left:** 1 Location, 2 Demographics, 3 Interests, **4 Salla Smart Features**, **5 Advanced** → Custom Audiences, Device, Audience Expansion. (No reorder; already correct.)
- **Right:** No change.

### 5.4 Google
- **Left:** Keep objective-specific order; only structural change: **move Ad Schedule (Search) to Step 2 (Budget)**. Optionally reorder: Salla Smart Features before Display Content Targeting for Display so “Salla” sits with other audience signals.
- **Right:** Location Reach → (objective-specific cards) → Delivery Check → Targeting Summary. No change.

### 5.5 DV360
- **Left:** 1 Location, 2 Demographics, **3 Salla Smart Features**, 4 Additional targeting (parental, income), 5 Audience Segments (Interests), 6 Keyword, 7 Inventory, 8 Device, then objective-specific (Frequency, Optimized Targeting, etc.). **Change:** Move Salla Smart Features to immediately after Demographics (before Additional targeting and Interests) so it matches other platforms (Salla early in the flow).
- **Right:** No change.

---

## 6. Summary table: misplaced cards

| Card | Platform | Recommend move to |
|------|----------|--------------------|
| App Settings (App ID, store) | Google (APP) | Step 0 (Objective) or keep at top of Step 1 with clear “App setup” label |
| Ad Schedule / Dayparting | Google (Search) | **Step 2 (Budget)** |
| Target Frequency | DV360 (Awareness) | Optional: Step 2 (Budget) for consistency with “when/how often” |
| Display Content Targeting | Google (Display) | Keep in Step 1; consider renaming to “Display content & placements” |
| Product Inventory | Google (Shopping) | Keep in Step 1 sidebar |

---

## 7. Summary: Advanced vs same page

- **Keep Advanced** on Snapchat, Meta, TikTok, Google.
- **Content of Advanced:** Custom Audiences, Device targeting, Regulated content (Snap), Audience Expansion (Snap/TikTok), Advantage+ (Meta), Search themes/Custom segments/Remarketing/Device/Advanced demographics (Google). All appropriate in Advanced.
- **Single change:** Move **Ad Schedule** (Google Search) from Step 1 Advanced to **Step 2 (Budget)**.
- **DV360:** No single “Advanced” block; keep collapsible sections, but align **order** of main cards with the unified hierarchy (e.g. Salla right after Demographics).

This gives advertisers a consistent mental model: **Who & Where → Interests/Intent → Salla & first-party → Refinements (Advanced)**, with schedule and budget in Step 2 where applicable.
