# Cross-Platform Component & Feature Standardization Audit

**Date:** 2026-04-10
**Revised:** 2026-04-10 (post-discussion)
**Scope:** Meta, TikTok, Google, Snapchat, DV360

---

## 1. Executive Summary

Salla Ads V2 supports **5 advertising platforms** across a **5-step wizard** pattern (Objective -> Audience -> Budget -> Creative -> Review). The codebase has a strong shared component layer (~36 shared components), but significant inconsistencies exist in **where features are placed** across steps and **how features are named/configured** across platforms.

**Key Decisions (agreed):**
- **Placement** -> Standardize to **Step 3 (Creative)** for ALL platforms. Placement is a creative decision -- the merchant needs to know where the ad appears to design the right assets.
- **Identity/Account connection** -> **Step 0 (Objective)** for connection/auth. **Step 3 (Creative)** for selecting which connected account to use.
- **Brand Safety** -> Standardize to **Step 3 (Creative)** alongside placement.
- **Ad Scheduling** -> **REMOVE entirely** from all platforms and objectives.
- **Google network/channel settings** -> Move from Step 1 to **Step 3 (Creative)**.

---

## 2. Full Feature Mapping Table

### Legend
- **Step 0** = Objective | **Step 1** = Audience | **Step 2** = Budget | **Step 3** = Creative | **Step 4** = Review
- **--** = Feature not applicable/available for this platform

---

### 2.1 Objective & Campaign Setup Features

| Feature | Component | Meta | TikTok | Google | Snapchat | DV360 | Consistent? | Decision |
|---------|-----------|------|--------|--------|----------|-------|-------------|----------|
| Campaign Name | Platform-specific | Step 0 | Step 0 | Step 0 | Step 0 | Step 0 | YES | Keep in Step 0 |
| Objective Selection | Platform-specific | Step 0 | Step 0 | Step 0 | Step 0 | Step 0 | YES | Keep in Step 0 |
| Pixel/Tag Setup | Platform-specific | Step 0 | Step 0 | Step 0 | Step 0 | Step 0 | YES | Keep in Step 0 |
| Catalog Toggle | Platform-specific | Step 0 | Step 0 | Step 0 | Step 0 | -- | YES | Keep in Step 0 |
| Product Selection Mode | Platform-specific | Step 0 | Step 0 | Step 3 | Step 3 | -- | NO | Keep as-is (catalog enable in Step 0, product filtering in Step 3) |
| App Store Config | Platform-specific | Step 0 | Step 0 | Step 0 | Step 0 | -- | YES | Keep in Step 0 |
| Special Ad Categories | Platform-specific | Step 0 | -- | -- | -- | -- | N/A | Meta-only, keep in Step 0 |
| **Account Connection / Auth** | Platform-specific | Step 0 (FB Page + IG) | **Step 3 -> Step 0** | -- | **-- -> Step 0** | -- | **NO -> YES** | **MOVE: TikTok identity linking to Step 0. Add Snapchat Public Profile connection to Step 0.** |
| Merchant Center | Platform-specific | -- | -- | Step 0 | -- | -- | N/A | Google-only, keep in Step 0 |
| EU Political Ads | Platform-specific | -- | -- | Step 0 | -- | -- | N/A | Google-only, keep in Step 0 |
| Campaign Budget Optimization | Platform-specific | -- | Step 0 | -- | -- | -- | N/A | TikTok-only, keep in Step 0 |
| YouTube Channel URL | Platform-specific | -- | -- | -- | -- | Step 0 | N/A | DV360-only, keep in Step 0 |
| Floodlight Activity | Platform-specific | -- | -- | -- | -- | Step 0 | N/A | DV360-only, keep in Step 0 |
| Lead Gen Form Location | Platform-specific | -- | Step 0 | -- | -- | -- | N/A | TikTok-only, keep in Step 0 |

---

### 2.2 Audience & Targeting Features

| Feature | Component | Meta | TikTok | Google | Snapchat | DV360 | Consistent? | Decision |
|---------|-----------|------|--------|--------|----------|-------|-------------|----------|
| Country Targeting | LocationSelector (shared) | Step 1 | Step 1 | Step 1 | Step 1 | Step 1 | YES | Keep in Step 1 |
| City Targeting + Radius | LocationSelector (shared) | Step 1 | Step 1 | Step 1 | Step 1 | Step 1 | YES | Keep in Step 1 |
| Location Map Preview | LocationMapPreview (shared) | Step 1 | -- | Step 1 | Step 1 | -- | NO | Add to TikTok and DV360 |
| Gender | DemographicsCard (shared) | Step 1 | Step 1 | Step 1 | Step 1 | Step 1 | YES | Keep in Step 1 |
| Age Range | DemographicsCard (shared) | Step 1 | Step 1 | Step 1 | Step 1 | Step 1 | YES | Keep in Step 1 |
| Languages | DemographicsCard (shared) | Step 1 | Step 1 | Step 1 | Step 1 | Step 1 | YES | Keep in Step 1 |
| Interest Targeting | InterestTargetingCard (shared) | Step 1 | Step 1 | Step 1 | Step 1 | Step 1 | YES | Keep in Step 1 |
| Behavior Targeting | Platform-specific | Step 1 | -- | -- | -- | -- | N/A | Meta-only, keep in Step 1 |
| Custom Audiences | CustomAudiencesCard (shared) | Step 1 | Step 1 | Step 1 | Step 1 | -- | MOSTLY | Add to DV360 if API supports |
| Device Targeting | DeviceTargetingCard (shared) | Step 1 | Step 1 | Step 1 | Step 1 | Step 1 | YES | Keep in Step 1 |
| Exclude Recent Purchasers | SallaSmartFeaturesCard (shared) | Step 1 | Step 1 | Step 1 | Step 1 | Step 1 | YES | Keep in Step 1 |
| Salla Lookalike/Category | SallaSmartFeaturesCard (shared) | Step 1 | Step 1 | Step 1 | Step 1 | Step 1 | YES | Keep in Step 1 |
| Advantage+/Auto-Targeting | Platform-specific | Step 1 | Step 1 | Step 1 | Step 1 | Step 1 | YES | Keep in Step 1 |
| Household Income | Platform-specific | -- | -- | Step 1 | -- | Step 1 | N/A | Google/DV360-only |
| Parental Status | Platform-specific | -- | -- | Step 1 | -- | Step 1 | N/A | Google/DV360-only |
| In-Market Segments | Platform-specific | -- | -- | Step 1 | -- | Step 1 | YES | Keep in Step 1 |
| Affinity Segments | Platform-specific | -- | -- | Step 1 | -- | Step 1 | YES | Keep in Step 1 |
| Custom Segment Keywords | Platform-specific | -- | -- | Step 1 | -- | Step 1 | YES | Keep in Step 1 |
| Custom Segment URLs | Platform-specific | -- | -- | Step 1 | -- | -- | N/A | Google-only |
| Lookalike Audiences | Platform-specific | -- | -- | Step 1 | -- | -- | N/A | Google Demand Gen only |
| Customer Match Lists | Platform-specific | -- | -- | Step 1 | -- | -- | N/A | Google-only |
| Keyword Targeting | Platform-specific | -- | -- | Step 1 | -- | Step 1 | YES | Keep in Step 1 |
| Negative Keywords | Platform-specific | -- | -- | Step 1 | -- | Step 1 | YES | Keep in Step 1 |
| Topics Targeting | Platform-specific | -- | -- | Step 1 | -- | -- | N/A | Google Display only |
| Managed Placements (URLs) | Platform-specific | -- | -- | Step 1 | -- | -- | N/A | Google Display only |
| Audience Targeting Mode | Platform-specific | -- | -- | Step 1 | -- | -- | N/A | Google Search only |
| Device Bid Adjustments | Platform-specific | -- | -- | Step 1 | -- | -- | N/A | Google Search only |
| ~~Ad Scheduling~~ | ~~AdSchedulingCard~~ | -- | ~~Step 2~~ | ~~Step 1~~ | ~~Step 2~~ | -- | ~~NO~~ | **REMOVE from all platforms** |
| Interest Expansion | Platform-specific | -- | Step 1 | -- | Step 1 | -- | YES | Keep in Step 1 |
| Custom Audience Expansion | Platform-specific | -- | -- | -- | Step 1 | -- | N/A | Snap-only |
| Smart Targeting | Platform-specific | -- | -- | -- | Step 1 | -- | N/A | Snap-only |
| Inventory Sources | Platform-specific | -- | -- | -- | -- | Step 1 | N/A | DV360-only, keep in Step 1 |
| Excluded Locations | Platform-specific | -- | -- | Step 1 | -- | -- | N/A | Google-only |
| Location Target Method | Platform-specific | -- | -- | Step 1 | -- | -- | N/A | Google-only |
| ~~Search Network Settings~~ | Platform-specific | -- | -- | ~~Step 1~~ | -- | -- | -- | **MOVE to Step 3 (Creative)** |
| Target Frequency (DV360) | Platform-specific | -- | -- | -- | -- | Step 1 | N/A | DV360 Awareness only |

---

### 2.3 Budget & Bidding Features

| Feature | Component | Meta | TikTok | Google | Snapchat | DV360 | Consistent? | Decision |
|---------|-----------|------|--------|--------|----------|-------|-------------|----------|
| Budget Type (Daily/Lifetime) | BudgetDurationCard (shared) | Step 2 | Step 2 | Step 2 | Step 2 | Step 2 | YES | Keep in Step 2 |
| Budget Amount | BudgetDurationCard (shared) | Step 2 | Step 2 | Step 2 | Step 2 | Step 2 | YES | Keep in Step 2 |
| Start/End Dates | BudgetDurationCard (shared) | Step 2 | Step 2 | Step 2 | Step 2 | Step 2 | YES | Keep in Step 2 |
| Payment Method | Platform-specific | -- | Step 2 | -- | Step 2 | -- | YES | Keep in Step 2 where used |
| Optimization Goal | OptimizationGoalCard (shared) | Step 2 | Step 2 | Step 2 | Step 2 | Step 2 | YES | Keep in Step 2 |
| Conversion Event | ConversionEventCard (shared) | Step 2 | Step 2 | Step 2 | Step 2 | -- | YES | Keep in Step 2 |
| Bid Strategy | BidStrategyCard (shared) | Step 2 | Step 2 | Step 2 | Step 2 | Step 2 | YES | Keep in Step 2 |
| Attribution Windows | AttributionWindowCard (shared) | Step 2 | Step 2 | -- | Step 2* | -- | MOSTLY | *Snap should use shared AttributionWindowCard |
| Delivery Pacing | DeliveryPacingCard (shared) | Step 2 | Step 2 | Step 2 | Step 2 | Step 2 | YES | Keep in Step 2 |
| Frequency Cap | FrequencyCapCard (shared) | -- | Step 2 | -- | Step 2 | Step 2 | PARTIAL | Keep in Step 2 where implemented |
| Auto-Increase Budget | Platform-specific | Step 2 | Step 2 | Step 2 | Step 2 | -- | YES | Keep in Step 2 |
| Performance Boost | PerformanceBoostCard (shared) | Step 2 | Step 2 | Step 2 | Step 2 | Step 2 | YES | Keep in Step 2 |
| ROAS Target | Platform-specific | Step 2 | Step 2 | Step 2 | -- | Step 2 | YES | Keep in Step 2 |
| Skip Learning Phase | Platform-specific | -- | Step 2 | -- | -- | -- | N/A | TikTok-only |
| Search Results Ads Toggle | Platform-specific | -- | Step 2 | -- | -- | -- | N/A | TikTok-only |
| Budget Strength Indicator | Platform-specific | Step 2 | -- | -- | -- | -- | N/A | Meta-only |
| AI Budget Recommendation | Platform-specific | -- | -- | Step 2 | -- | -- | N/A | Google-only |
| Demand Gen Budget Mode | Platform-specific | -- | -- | Step 2 | -- | -- | N/A | Google DemandGen only |
| Asset Automation Toggles | Platform-specific | -- | -- | Step 2 | -- | -- | N/A | Google PMax/Search only |
| AI Max for Search | Platform-specific | -- | -- | Step 2 | -- | -- | N/A | Google Search only |

---

### 2.4 Creative & Ad Design Features

| Feature | Component | Meta | TikTok | Google | Snapchat | DV360 | Consistent? | Decision |
|---------|-----------|------|--------|--------|----------|-------|-------------|----------|
| Ad Format Selection | Platform-specific | Step 3 | Step 3 | Step 3 | Step 3 | Step 3 | YES | Keep in Step 3 |
| Media Upload | UploadZone (shared) | Step 3 | Step 3 | Step 3 | Step 3 | Step 3 | YES | Keep in Step 3 |
| Primary Text / Ad Copy | Platform-specific | Step 3 | Step 3 | Step 3 | Step 3 | Step 3 | YES | Keep in Step 3 |
| Headlines | Platform-specific | Step 3 | -- | Step 3 | Step 3 | Step 3 | MOSTLY | Keep in Step 3 |
| Descriptions | Platform-specific | Step 3 | -- | Step 3 | -- | Step 3 | MOSTLY | Keep in Step 3 |
| Call-to-Action | Platform-specific | Step 3 | Step 3 | Step 3 | Step 3 | Step 3 | YES | Keep in Step 3 |
| Landing Page URL | Platform-specific | Step 3 | Step 3 | Step 3 | Step 3 | Step 3 | YES | Keep in Step 3 |
| Display/Shortened URL | Platform-specific | Step 3 | Step 3 | Step 3 | -- | Step 3 | MOSTLY | Keep in Step 3 |
| UTM Parameters | Platform-specific | Step 3 | -- | -- | -- | -- | N/A | Meta-only |
| Carousel Cards | Platform-specific | Step 3 | Step 3 | Step 3 | -- | -- | YES | Keep in Step 3 |
| Collection/Catalog Ads | Platform-specific | Step 3 | Step 3 | Step 3 | Step 3 | -- | YES | Keep in Step 3 |
| Dynamic Product Ads | Platform-specific | Step 3 | Step 3 | Step 3 | Step 3 | -- | YES | Keep in Step 3 |
| Ad Preview | Platform-specific | Step 3 | Step 3 | Step 3 | Step 3 | Step 3 | YES | Keep in Step 3 |
| Multiple Ads Management | Platform-specific | Step 3 | Step 3 | Step 3 | Step 3 | Step 3 | YES | Keep in Step 3 |
| **Placement Configuration** | Platform-specific | **Step 0 -> Step 3** | Step 3 | **Step 1 -> Step 3** | Step 3 | **Step 1 -> Step 3** | **NO -> YES** | **MOVE all to Step 3** |
| **Brand Safety** | Platform-specific | -- | Step 3 | -- | Step 3 | **Step 1 -> Step 3** | **NO -> YES** | **Standardize to Step 3. Move DV360 from Step 1.** |
| Content Controls (comments) | Platform-specific | -- | Step 3 | -- | -- | -- | N/A | TikTok-only |
| **Connected Identity Selection** | Platform-specific | Step 0* | **Step 3** | -- | **-- -> Step 3** | -- | **NO -> YES** | **Step 3: Dropdown to select connected account. *Meta keeps selection in Step 0 since it's also auth.** |
| Spark Ad / Influencer Config | Platform-specific | -- | Step 3 | -- | Step 3 | -- | YES | Keep in Step 3 |
| Music Track | Platform-specific | -- | Step 3 | -- | -- | -- | N/A | TikTok-only |
| AIGC Disclosure | Platform-specific | -- | Step 3 | -- | -- | -- | N/A | TikTok-only |
| Tracking URLs (3P) | Platform-specific | -- | Step 3 | -- | Step 3 | -- | YES | Keep in Step 3 |
| Deep Links | Platform-specific | -- | Step 3 | -- | Step 3 | -- | YES | Keep in Step 3 |
| Lead Generation Form | Platform-specific | -- | Step 3 | -- | Step 3 | -- | YES | Keep in Step 3 |
| Ad Extensions (Sitelinks) | Platform-specific | -- | -- | Step 3 | -- | -- | N/A | Google Search only |
| Product Group Partitioning | Platform-specific | -- | -- | Step 3 | -- | -- | N/A | Google Shopping only |
| Offer Disclaimer | Platform-specific | -- | -- | -- | Step 3 | -- | N/A | Snap-only |
| Commercial/Non-Skip Config | Platform-specific | -- | -- | -- | Step 3 | -- | N/A | Snap-only |
| Discover Tile | Platform-specific | -- | -- | -- | Step 3 | -- | N/A | Snap Story only |
| Sponsored Chat Config | Platform-specific | -- | -- | -- | Step 3 | -- | N/A | Snap-only |
| Video Format Selection | Platform-specific | -- | -- | -- | -- | Step 3 | N/A | DV360-only |
| **Google Network Settings** | Platform-specific | -- | -- | **Step 1 -> Step 3** | -- | -- | -- | **MOVE to Step 3** |

---

### 2.5 Review & Launch Features

| Feature | Component | Meta | TikTok | Google | Snapchat | DV360 | Consistent? | Decision |
|---------|-----------|------|--------|--------|----------|-------|-------------|----------|
| Campaign Summary | Platform-specific | Step 4 | Step 4 | Step 4 | Step 4 | Step 4 | YES | Keep in Step 4 |
| Validation Checklist | Platform-specific | Step 4 | Step 4 | Step 4 | Step 4 | Step 4 | YES | Keep in Step 4 |
| API Payload Preview | Platform-specific | Step 4 | Step 4 | Step 4 | -- | Step 4 | MOSTLY | Add to Snapchat |
| Save as Draft | Platform-specific | Step 4 | Step 4 | Step 4 | Step 4 | Step 4 | YES | Keep in Step 4 |
| Coupon Code | CouponCodeCard (shared) | Step 4 | Step 4 | Step 4 | Step 4 | Step 4 | YES | Keep in Step 4 |
| Terms Agreement | Platform-specific | Step 4 | Step 4 | Step 4 | Step 4 | Step 4 | YES | Keep in Step 4 |
| Payment Method | Platform-specific | -- | -- | Step 4 | Step 4 | -- | YES | Keep in Step 4 |
| Wallet/Credit Balance | Platform-specific | -- | -- | Step 4 | Step 4 | -- | YES | Keep in Step 4 |
| Launch Campaign | Platform-specific | Step 4 | Step 4 | Step 4 | Step 4 | Step 4 | YES | Keep in Step 4 |

---

## 3. Gap Analysis & Agreed Changes

### 3.1 Placement Configuration -> Step 3 (Creative)

**Current state:**
| Platform | Current Location | Target Location |
|----------|-----------------|-----------------|
| Meta | Step 0 (Objective) | **Step 3 (Creative)** |
| TikTok | Step 3 (Creative) | Step 3 (no change) |
| Google | Step 1 (Audience) | **Step 3 (Creative)** |
| Snapchat | Step 3 (Creative) | Step 3 (no change) |
| DV360 | Step 1 (Audience) | **Step 3 (Creative)** |

**Rationale:** Placement is a creative decision. The merchant designs ads FOR specific placements (9:16 for Stories, 1:1 for Feed, etc.). Knowing placement alongside creative ensures the right assets are created.

**Affected files:**
- `components/meta/step-objective.tsx` -- remove placement section
- `components/meta/step-creative.tsx` -- add placement section
- `components/google/step-audience.tsx` -- remove network/channel settings
- `components/google/step-creative.tsx` -- add network/channel settings
- `components/dv360/step-audience.tsx` -- remove inventory sources
- `components/dv360/step-creative.tsx` -- add inventory sources
- `lib/meta/campaign-types.ts` -- move placement fields from objective to creative settings
- `lib/google/campaign-types.ts` -- move network fields from audience to creative settings
- `lib/dv360/campaign-types.ts` -- move inventory fields from audience to creative settings

### 3.2 Identity / Account Connection -> Split: Step 0 (connect) + Step 3 (select)

**Pattern:**
- **Step 0:** Account connection/authentication flow. First visit = connect. Return visit = shows connected account with option to connect more.
- **Step 3:** Dropdown to select which connected account to use for this campaign. If only one, pre-selected.

**Current vs Target:**
| Platform | Step 0 (Connection) | Step 3 (Selection) |
|----------|--------------------|--------------------|
| Meta | FB Page + IG login (already here) | Keep as-is (Meta auth and selection in Step 0) |
| TikTok | **NEW: QR linking flow, BC_AUTH_TT connection** | Keep identity dropdown, remove connection flow |
| Snapchat | **NEW: Public Profile connection** | **NEW: Connected profile dropdown** |
| Google | N/A | N/A |
| DV360 | N/A | N/A |

**Affected files:**
- `components/tiktok/step-objective.tsx` -- add identity connection section (QR flow, ~500 lines extracted from step-creative)
- `components/tiktok/step-creative.tsx` -- replace connection flow with connected account dropdown
- `components/snapchat/step-objective.tsx` -- add Public Profile connection section
- `components/snapchat/step-creative.tsx` -- add connected profile dropdown
- `lib/tiktok/campaign-types.ts` -- identity fields remain in creative settings but connection state moves to objective
- `lib/snapchat/campaign-types.ts` -- add public profile connection fields to objective settings

### 3.3 Brand Safety -> Step 3 (Creative)

**Current vs Target:**
| Platform | Current Location | Target Location |
|----------|-----------------|-----------------|
| Meta | Not implemented | -- (not needed) |
| TikTok | Step 3 (Creative) | Step 3 (no change) |
| Google | Not implemented | -- (not needed) |
| Snapchat | Step 3 (Creative) | Step 3 (no change) |
| DV360 | Step 1 (Audience) | **Step 3 (Creative)** |

**Rationale:** Brand safety controls what content context your ads appear in, which is part of the creative/placement decision. Keeps it alongside placement configuration.

**Affected files:**
- `components/dv360/step-audience.tsx` -- remove content filter section
- `components/dv360/step-creative.tsx` -- add content filter section
- `lib/dv360/campaign-types.ts` -- move contentFilterType from audience to creative settings

### 3.4 Ad Scheduling -> REMOVE

**Decision:** Remove ad scheduling (dayparting) from all platforms and objectives entirely.

**Affected files:**
- `components/tiktok/step-budget.tsx` -- remove AdSchedulingCard usage
- `components/google/step-audience.tsx` -- remove ad schedule entries section
- `components/snapchat/step-budget.tsx` -- remove scheduling section
- `lib/tiktok/campaign-types.ts` -- remove schedule-related fields
- `lib/google/campaign-types.ts` -- remove adScheduleEntries and related types
- `lib/snapchat/campaign-types.ts` -- remove schedule-related fields
- `components/shared/ad-scheduling-card.tsx` -- DELETE file (no longer needed)

### 3.5 Google Network Settings -> Step 3 (Creative)

Google's network settings (Search Partners toggle, Display Network expansion, Demand Gen channel controls) currently live in Step 1 (Audience).

**Decision:** Move to Step 3 (Creative) to be consistent with placement being a creative-level decision.

**Affected files:**
- `components/google/step-audience.tsx` -- remove Search Partners, Content Network, Channel Controls sections
- `components/google/step-creative.tsx` -- add these sections
- `lib/google/campaign-types.ts` -- move network fields from audience to creative settings

---

## 4. Standardized Step Layout (Final)

```
STEP 0: OBJECTIVE & CAMPAIGN SETUP
  - Campaign Name
  - Objective Selection
  - Pixel / Conversion Tracking Setup
  - Catalog Toggle (if applicable)
  - Account Connection / Auth              <-- TikTok QR linking, Snapchat Public Profile, Meta FB+IG
  - App Configuration (if App objective)
  - Platform-specific setup (Merchant Center, Special Ad Categories, CBO, etc.)

STEP 1: AUDIENCE & TARGETING
  - Location Targeting (countries, cities, radius, map preview)
  - Demographics (age, gender, language)
  - Interest & Behavior Targeting
  - Custom Audiences (include/exclude)
  - Device Targeting
  - Salla Smart Features (exclude purchasers, lookalike)
  - Audience Expansion / Auto-targeting
  - Platform-specific targeting (keywords, topics, segments, etc.)

STEP 2: BUDGET & DELIVERY
  - Budget Type & Amount
  - Campaign Duration (dates)
  - Optimization Goal
  - Conversion Event (if applicable)
  - Bid Strategy & Targets
  - Attribution Windows (if applicable)
  - Delivery Pacing
  - Frequency Capping (if applicable)
  - Auto-Increase Budget
  - Performance Boost

STEP 3: CREATIVE & AD DESIGN
  - Connected Identity Selection            <-- Dropdown of connected accounts (TikTok, Snapchat)
  - Placement Configuration                 <-- Standardized here for ALL platforms
  - Brand Safety / Content Filtering        <-- Standardized here for ALL platforms
  - Ad Format Selection
  - Media Upload (images, videos)
  - Ad Copy (text, headlines, descriptions)
  - Call-to-Action
  - Landing Page / URL Configuration
  - Product Selection / Filtering (for catalog ads)
  - Lead Generation Form (if Lead objective)
  - Spark Ad / Influencer Config
  - Tracking URLs (3rd party)
  - Deep Links
  - Ad Extensions (Google Search only)
  - Ad Preview
  - Multiple Ads Management

STEP 4: REVIEW & LAUNCH
  - Campaign Summary (all sections)
  - Validation Checklist
  - API Payload Preview
  - Cost Summary
  - Coupon Code
  - Terms Agreement
  - Save as Draft
  - Launch Campaign
```

---

## 5. Refactoring Task List

### Phase 1: Critical Moves (HIGH priority)

| # | Task | Platform(s) | From | To | Effort | Files Affected |
|---|------|-------------|------|-----|--------|----------------|
| 1 | Move Placement from Step 0 to Step 3 | Meta | step-objective.tsx | step-creative.tsx | Medium | 3 files (+ campaign-types.ts) |
| 2 | Move Network/Channel Settings from Step 1 to Step 3 | Google | step-audience.tsx | step-creative.tsx | Medium | 3 files (+ campaign-types.ts) |
| 3 | Move Inventory Sources from Step 1 to Step 3 | DV360 | step-audience.tsx | step-creative.tsx | Medium | 3 files (+ campaign-types.ts) |
| 4 | Move TikTok Identity connection to Step 0 | TikTok | step-creative.tsx | step-objective.tsx | High | 4 files (large extraction ~500 lines) |
| 5 | Add Snapchat Public Profile connection to Step 0 | Snapchat | N/A | step-objective.tsx | Medium | 3 files |
| 6 | Add connected identity dropdown to Step 3 | TikTok, Snapchat | N/A | step-creative.tsx | Medium | 2 files |
| 7 | Update campaign-types.ts for all moved fields | All | -- | -- | Medium | 5 type files + 5 context files |
| 8 | Increment DRAFT_VERSION + add migration logic | All | -- | campaign-context.tsx | Medium | 5 context files |

### Phase 2: Standardization (MEDIUM priority)

| # | Task | Platform(s) | Details | Effort |
|---|------|-------------|---------|--------|
| 9 | Move DV360 Brand Safety from Step 1 to Step 3 | DV360 | Move contentFilterType section | Low |
| 10 | Create shared `PlacementConfigCard` | All | Props: mode (auto/manual), positions array, onChange | Medium |
| 11 | Create shared `BrandSafetyCard` | TikTok, Snap, DV360 | Props: levels array, value, onChange | Medium |
| 12 | Ensure Snapchat uses shared `AttributionWindowCard` | Snapchat | Replace inline conversion window | Low |
| 13 | Add Location Map Preview | TikTok, DV360 | Add LocationMapPreview to step-audience.tsx | Low |

### Phase 3: Cleanup (LOW priority)

| # | Task | Details | Effort |
|---|------|---------|--------|
| 14 | Remove Ad Scheduling from TikTok | Remove from step-budget.tsx + campaign-types.ts | Low |
| 15 | Remove Ad Scheduling from Google | Remove from step-audience.tsx + campaign-types.ts | Low |
| 16 | Remove Ad Scheduling from Snapchat | Remove from step-budget.tsx + campaign-types.ts | Low |
| 17 | Delete shared AdSchedulingCard component | Remove components/shared/ad-scheduling-card.tsx | Trivial |
| 18 | Add API Payload Preview to Snapchat | Add JSON export to step-review.tsx | Low |
| 19 | Create shared `AdStrengthBadge` | Consolidate Meta + Google ad strength indicators | Low |

---

## 6. Platform-Specific Feature Justifications

Features that MUST differ across platforms (documented exceptions, not inconsistencies):

| Feature | Platforms | Reason |
|---------|-----------|--------|
| Spark Ads / Influencer content | TikTok, Snapchat only | Platform-specific ad format |
| Ad Extensions (Sitelinks, Callouts) | Google Search only | Google Search exclusive |
| Product Group Partitioning | Google Shopping only | Google Shopping exclusive |
| Sponsored Chat Config | Snapchat only | Snapchat-exclusive format |
| Asset Automation / AI Max | Google only | Google AI features |
| Discover Tile | Snapchat Story only | Snapchat-exclusive format |
| Video Format (Bumper/Non-Skip) | DV360 only | YouTube ad format types |
| Merchant Center | Google only | Google product feed system |
| Special Ad Categories | Meta only | Meta regulatory requirement |
| Commercial/Non-Skippable Config | Snapchat only | Snap premium format |
| Music Track | TikTok only | TikTok creative requirement |
| AIGC Disclosure | TikTok only | AI content transparency |
| Campaign Budget Optimization | TikTok only | TikTok CBO feature |

---

## 7. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| TikTok identity extraction is large (~500 lines) | High | Extract to standalone component first, then move to Step 0 |
| Moving fields between settings objects breaks localStorage drafts | Medium | Increment DRAFT_VERSION in all campaign-context.tsx files; add migration logic |
| Placement move affects creative-specific logic | Medium | Placement config is mostly independent; just UI relocation + data model update |
| Google network settings may have dependencies in audience targeting | Low | Verify no cross-references between network settings and audience bid adjustments |
| Removing Ad Scheduling removes user-facing functionality | Medium | Confirm with product team that this is intended; no rollback needed if agreed |

---

## 8. Shared Component Status

### New shared components to create:
1. **`PlacementConfigCard`** -- Unified placement selector (auto/manual + platform-specific positions)
2. **`BrandSafetyCard`** -- Content filtering levels (platform-specific options via props)
3. **`AdStrengthBadge`** -- Consolidate Meta and Google ad strength indicators
4. **`ConnectedIdentitySelector`** -- Dropdown for selecting connected platform accounts

### Shared components to DELETE:
1. **`AdSchedulingCard`** -- No longer needed after removing scheduling from all platforms

### Well-shared components (no action needed):
LocationSelector, LocationReachCard, LocationMapPreview, DemographicsCard, InterestTargetingCard, CustomAudiencesCard, DeviceTargetingCard, BudgetDurationCard, BidStrategyCard, CostSummaryCard, OptimizationGoalCard, ConversionEventCard, AttributionWindowCard, FrequencyCapCard, DeliveryPacingCard, DeliveryCheckCard, ConfigCheckCard, PerformanceBoostCard, SallaSmartFeaturesCard, AudienceReadinessChecklist, TargetingSummaryCard, EstimatedResultsCard, CouponCodeCard, UploadZone, ProductPickerDialog, MediaLibrarySheet

---

## 9. Summary

**Total changes:** 19 refactoring tasks across 3 phases
**Platforms affected:** All 5 (Meta, TikTok, Google, Snapchat, DV360)
**New shared components:** 4
**Deleted components:** 1
**Features removed:** Ad Scheduling (all platforms)
**Biggest move:** TikTok Identity from Step 3 -> Step 0 (~500 lines)
**Goal:** Every feature lives in the same step across all platforms, with documented exceptions only for platform-exclusive features.
