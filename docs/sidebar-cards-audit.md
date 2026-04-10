# Right Sidebar Cards Audit - All Platforms

**Date:** 2026-04-10

---

## 1. Current State: What Exists Today

### Step 0 (Objective) - No Platform Has a Sidebar
All 5 platforms use a single-column layout. **This is correct** -- the objective step is a simple form that doesn't need supplementary cards.

---

### Step 1 (Audience) - Sidebar by Platform

| Card | Type | Meta | TikTok | Google | Snapchat | DV360 |
|------|------|------|--------|--------|----------|-------|
| LocationMapPreview | Shared | -- | -- | Inline | Yes | -- |
| LocationReachCard | Shared | Yes | Yes | -- | Yes | Yes |
| DeliveryCheckCard | Shared | Yes | Yes | Yes | Yes | Yes |
| AudienceReadinessChecklist | Shared | Yes | Yes | Yes | Yes | Yes |
| TargetingSummaryCard | Shared | Yes | Yes | Yes | Yes | Yes |
| Salla Tip | Inline | Yes | -- | -- | -- | -- |
| Product Inventory | Inline | -- | -- | Shopping only | -- | -- |
| Audience Reach | Inline | -- | -- | DemandGen only | -- | -- |
| Keyword Summary | Inline | -- | -- | Search only | -- | -- |
| Signal Strength | Inline | -- | -- | PMax only | -- | -- |

**What each card does:**
- **LocationMapPreview**: Visual map of selected countries/cities with radius circles
- **LocationReachCard**: Shows count of countries and cities selected, estimated audience size
- **DeliveryCheckCard**: Validates targeting (no country, no language, invalid age) -- shows warnings
- **AudienceReadinessChecklist**: Progress checklist (4-5 items) with green/amber indicators
- **TargetingSummaryCard**: Key-value summary of ALL targeting selections (location, gender, age, languages, interests, devices, etc.)
- **Product Inventory** (Google Shopping): Active products count, categories, feed sync status
- **Audience Reach** (Google DemandGen): Weekly reach estimate, lookalike segments count
- **Keyword Summary** (Google Search): Keyword count by match type (Broad/Phrase/Exact)
- **Signal Strength** (Google PMax): Progress bar showing signal quality for AI optimization

---

### Step 2 (Budget) - Sidebar by Platform

| Card | Type | Meta | TikTok | Google | Snapchat | DV360 |
|------|------|------|--------|--------|----------|-------|
| CostSummaryCard | Shared | Yes | Yes | Yes | -- | Yes |
| EstimatedResultsCard | Shared | Yes | Yes | Yes | -- | Yes |
| ConfigCheckCard | Shared | Yes | Yes | Yes | -- | Yes |
| CampaignEstimateCard | Snap-only | -- | -- | -- | Yes | -- |
| DeliveryReadinessCard | Snap-only | -- | -- | -- | Yes | -- |
| Benchmarks Card | DV360-only | -- | -- | -- | -- | Yes |
| Salla Tips | Inline | -- | -- | -- | -- | Yes |
| Disclaimer | Inline | Yes | Yes | -- | -- | Yes |

**What each card does:**
- **CostSummaryCard**: Budget breakdown -- daily amount, duration, total spend, boost addon, auto-increase projection
- **EstimatedResultsCard**: Predicted metrics (conversions, reach, cost-per-result). Rows change by objective:
  - Sales/Conversion: daily conversions, reach, cost per conversion
  - Traffic: daily clicks/page views, reach, cost per click
  - Awareness/Reach: daily impressions, unique reach, CPM
  - Video Views: daily views, reach, CPV
  - Lead Gen: daily leads, reach, cost per lead
  - App: daily installs, reach, cost per install
- **ConfigCheckCard**: Configuration validation -- shows budget health, duration adequacy, bid strategy status, pixel requirement, billing event. Items vary by objective.
- **CampaignEstimateCard** (Snapchat custom): Same purpose as CostSummaryCard but different implementation
- **DeliveryReadinessCard** (Snapchat custom): Same purpose as ConfigCheckCard but different implementation
- **Benchmarks Card** (DV360): Saudi Arabia-specific KPI ranges (CPM, CPV, CPA, ROAS) by objective

---

### Step 3 (Creative) - Sidebar by Platform

| Card | Type | Meta | TikTok | Google | Snapchat | DV360 |
|------|------|------|--------|--------|----------|-------|
| Ad Preview | Platform-specific | Yes | Yes | Yes (6 types) | Yes | Yes |
| Placement Preview Selector | Inline | Yes | -- | -- | -- | -- |
| Ad Strength/Quality | Inline | -- | -- | Search, DemandGen, App | -- | -- |
| Creative Checklist | Inline | Yes | -- | -- | -- | -- |
| Media Specs | Inline | Yes | -- | -- | -- | -- |
| Ad Delivery Summary | Inline | Yes | -- | -- | -- | -- |
| Ad Summary | Inline | -- | Yes | Display, DemandGen, App, Shopping | -- | -- |
| Lead Form Summary | Inline | -- | Yes (Lead obj) | -- | -- | -- |
| API Mapping | Inline | -- | -- | Search, Shopping | -- | -- |
| Platform Tips | Inline | Yes | -- | Shopping, App | -- | -- |
| Format-specific Preview | Inline | -- | -- | -- | -- | Yes (InFeed, Shorts) |

**What each card does:**
- **Ad Preview**: Live preview of how the ad will look on the platform (phone mockup for TikTok/Snap, feed mockup for Meta, search result for Google, player for DV360)
- **Placement Preview Selector** (Meta): Toggle between Facebook/Instagram placements to see different previews
- **Ad Strength** (Google): Progress bar (0-100%) with label (Poor/Average/Good/Excellent). Calculates based on headline count, description count, images, videos, uniqueness
- **Creative Checklist** (Meta): 7-8 item checklist validating all creative requirements are met (media uploaded, text written, URL set, CTA selected)
- **Media Specs** (Meta): Technical specifications for the selected placement (aspect ratio, resolution, max sizes)
- **Ad Delivery Summary** (Meta): Shows conversion location, placement mode, platform badges
- **Ad Summary** (TikTok/Google): Compact summary of identity, placement, pixel status, ad count
- **Lead Form Summary** (TikTok): Shows form template, intent level, field count -- only for Lead Gen objective

---

### Step 4 (Review) - Sidebar by Platform

| Card | Type | Meta | TikTok | Google | Snapchat | DV360 |
|------|------|------|--------|--------|----------|-------|
| Launch Checklist | Inline | Yes | -- | PMax only | -- | -- |
| Cost Breakdown | Inline | Yes | Yes | Yes | Yes | -- |
| Payment Method | Inline | -- | -- | Yes | Yes | -- |
| CouponCodeCard | Shared | -- | Yes | Yes | Yes | -- |
| API Payload | Inline | -- | -- | -- | Yes | -- |
| Terms Agreement | Inline | Yes | -- | -- | Yes | -- |
| Launch/Draft Buttons | Inline | -- | Yes | Yes | Yes | -- |
| Campaign Summary | Inline | -- | -- | PMax | -- | Yes |
| Channels/Devices | Inline | -- | -- | -- | -- | Yes |

---

## 2. Analysis: What Should Be Added, Removed, or Changed

### Step 1 (Audience) Recommendations

| Change | Platform | Why |
|--------|----------|-----|
| **ADD LocationMapPreview** | Meta | Meta has LocationReachCard but no map. Google, Snapchat show a map. Helps merchants visualize their targeting. |
| **ADD LocationMapPreview** | TikTok | Already added in Phase 2 -- done. |
| **ADD LocationMapPreview** | DV360 | Already added in Phase 2 -- done. |
| **ADD LocationReachCard** | Google | Google has its own inline "Audience Reach" (DemandGen only) but missing the standard LocationReachCard for all types. Other 4 platforms have it. |
| **KEEP Product Inventory** | Google Shopping | Shopping-specific, shows feed health. No other platform needs this. |
| **KEEP Keyword Summary** | Google Search | Search-specific, shows keyword coverage. Unique to Search. |
| **KEEP Signal Strength** | Google PMax | PMax-specific, shows AI signal quality. Unique to PMax. |
| **REMOVE Salla Tip** | Meta | Static text that's Sales-specific. Better placed as a contextual tooltip than a permanent sidebar card. |

---

### Step 2 (Budget) Recommendations

| Change | Platform | Why |
|--------|----------|-----|
| **REPLACE CampaignEstimateCard with CostSummaryCard** | Snapchat | CampaignEstimateCard does the same thing as the shared CostSummaryCard (budget breakdown, duration, total). Using the shared component ensures consistent UX and reduces maintenance. |
| **REPLACE DeliveryReadinessCard with ConfigCheckCard** | Snapchat | DeliveryReadinessCard does the same thing as ConfigCheckCard (validation checks). The shared component already supports all the checks Snapchat needs via props. |
| **ADD EstimatedResultsCard** | Snapchat | Missing entirely. Every other platform shows predicted metrics (conversions, reach, cost). Snapchat merchants get no performance estimate before launching. This is the biggest gap. |
| **ADD Benchmarks Card** | All platforms | DV360 has Saudi Arabia-specific benchmark ranges. This is valuable for all platforms -- shows merchants what to expect (e.g., "Average CPA for Sales campaigns: SAR 15-40"). Could be a shared component. |
| **KEEP Disclaimer** | All | Legal requirement, keep as-is. |

**Estimated results should vary by Snapchat objective:**
- SALES: daily purchases, reach, cost per purchase
- WEBSITE_VISITS: daily swipe-ups, landing page views, cost per visit
- ENGAGEMENT: daily impressions, story opens, video views
- APP_PROMOTION: daily installs, reach, cost per install
- LEADS: daily form submissions, reach, cost per lead
- SPONSORED_CHAT: daily impressions, chat opens

---

### Step 3 (Creative) Recommendations

| Change | Platform | Why |
|--------|----------|-----|
| **ADD Creative Checklist** | TikTok | Meta has a creative checklist (7-8 items). TikTok has none. Helps merchants verify all required fields before moving to review. |
| **ADD Creative Checklist** | DV360 | Same -- no checklist. DV360 creative is minimal (just YouTube URL + format). A checklist would validate: video URL valid, format selected, CTA set, landing page set. |
| **ADD Ad Strength** | Meta | Google shows ad strength for Search/DemandGen/App. Meta doesn't show it at all despite having the same concept (more headlines + descriptions = better performance). Useful for PMax-style asset groups. |
| **ADD Ad Summary** | Snapchat | TikTok and Google show a compact summary (identity, placement, ad count). Snapchat has nothing. |
| **ADD Media Specs** | TikTok | Meta shows technical specs for the selected format (aspect ratio, resolution, max sizes). TikTok doesn't. Helpful for merchants uploading media. |
| **ADD Media Specs** | Snapchat | Same as TikTok. |
| **KEEP Ad Preview platform-specific** | All | Each platform's ad looks different. These must remain custom per platform. |
| **KEEP Lead Form Summary** | TikTok | Only shows for Lead Gen objective. Correct behavior. |
| **KEEP API Mapping** | Google | Useful for developers. Not needed on other platforms. |

**Creative Checklist items should vary by objective:**

**Sales objective checklist (all platforms):**
- Media uploaded
- Primary text / ad copy written
- Headline set (if applicable)
- CTA selected
- Landing page URL set
- Pixel/tracking configured (shows "Set in Step 0" if done)

**Lead Gen objective checklist:**
- All Sales items above
- Lead form configured (fields, privacy policy)
- Form name set

**App Promotion checklist:**
- Media uploaded
- Ad copy written
- CTA selected (Install Now)
- App ID configured (shows "Set in Step 0")
- Deep link set (if applicable)

**Awareness/Engagement checklist:**
- Media uploaded
- Ad copy written
- CTA selected (or "No CTA" for awareness)

---

### Step 4 (Review) Recommendations

| Change | Platform | Why |
|--------|----------|-----|
| **ADD CouponCodeCard** | Meta | Missing. Other 3 platforms (TikTok, Google, Snapchat) have it. |
| **ADD CouponCodeCard** | DV360 | Missing. Should be available on all platforms. |
| **ADD Cost Breakdown** | DV360 | DV360 review sidebar only shows campaign summary and channels. No cost breakdown or payment method. |
| **ADD Launch Checklist** | TikTok | Meta has a launch checklist in review sidebar. TikTok has validation in the main content area but not in the sidebar as a quick reference. |
| **ADD Launch Checklist** | Snapchat | Same as TikTok -- validation exists inline but not as a sidebar card. |
| **ADD API Payload** | Meta, TikTok, DV360 | Google already has it in some types. Snapchat was just added. Meta and TikTok have it in the main content area. DV360 has it. Standardize as a sidebar card. |
| **STANDARDIZE Terms Agreement** | All | Meta has it in sidebar. Others have it in main content. Should be consistent. |

---

## 3. Priority Matrix

### HIGH Priority (Missing core functionality)

| # | Change | Platform | Impact |
|---|--------|----------|--------|
| 1 | Replace Snap custom cards with shared CostSummaryCard + ConfigCheckCard | Snapchat | Reduces code duplication, consistent UX |
| 3 | Add EstimatedResultsCard to Snapchat Budget | Snapchat | No performance estimates for merchants |
| 4 | Add Creative Checklist to TikTok Creative sidebar | TikTok | No validation before review step |
| 5 | Add LocationReachCard to Google Audience sidebar | Google | Missing from only platform that doesn't have it |

### MEDIUM Priority (Consistency improvements)

| # | Change | Platform | Impact |
|---|--------|----------|--------|
| 6 | Add Creative Checklist to Snapchat, DV360 | Snap, DV360 | Consistent validation across platforms |
| 7 | Add CouponCodeCard to Meta, DV360 review | Meta, DV360 | Feature gap vs other platforms |
| 8 | Add LocationMapPreview to Meta audience | Meta | Visual gap vs Snapchat, Google |
| 9 | Add Media Specs card to TikTok, Snapchat creative | TikTok, Snap | Merchants need to know upload requirements |
| 10 | Add Ad Summary to Snapchat creative | Snapchat | Quick reference while designing |

### LOW Priority (Nice-to-have)

| # | Change | Platform | Impact |
|---|--------|----------|--------|
| 11 | Add Benchmarks card to all platforms (shared) | All | Useful but not blocking |
| 12 | Add Ad Strength to Meta creative | Meta | Google has it, Meta doesn't |
| 13 | Add Cost Breakdown to DV360 review | DV360 | Minimal review sidebar |
| 14 | Standardize Terms Agreement placement | All | Minor UX consistency |
| 15 | Remove static Salla Tip from Meta audience | Meta | Replace with contextual tooltip |

---

## 4. Shared Component Reuse Summary

**Already shared and well-used (no changes needed):**
- `LocationReachCard` -- 4/5 platforms (add to Google)
- `DeliveryCheckCard` -- 5/5 platforms
- `AudienceReadinessChecklist` -- 5/5 platforms
- `TargetingSummaryCard` -- 5/5 platforms
- `CostSummaryCard` -- 4/5 platforms (replace Snap custom)
- `EstimatedResultsCard` -- 4/5 platforms (add to Snap)
- `ConfigCheckCard` -- 4/5 platforms (replace Snap custom)

**Should be created as shared components:**
- `CreativeChecklist` -- a shared creative validation checklist that accepts check items via props. Would replace Meta's inline checklist and be added to TikTok, Snapchat, DV360.
- `MediaSpecsCard` -- a shared card showing format specs (aspect ratio, resolution, max sizes). Would replace Meta's inline specs card and be added to TikTok, Snapchat.
- `BenchmarksCard` -- a shared card showing KPI benchmarks by objective. Currently DV360-only inline.

**Must remain platform-specific:**
- Ad Preview components (each platform looks completely different)
- Google's objective-specific cards (Product Inventory, Keyword Summary, Signal Strength)
- DV360's format-specific previews (InFeed, Shorts)
