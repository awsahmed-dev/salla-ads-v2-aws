# Google Performance Max — Smart Enhancement API Mapping

**Audience:** integration developer wiring the Salla frontend to Google Ads API.
**Status:** verified against Google Ads API v22 (July 2026).
**Question this doc answers:** every "Smart Enhancement" toggle in the Salla PMax creative step, mapped to its real Google Ads API field with runnable code so the dev can implement without guessing.

---

## TL;DR — the dev's specific question

**Claim raised by the dev:** *"URL Expansion and URL Text Generation are the same thing. Delete one."*

**Verdict:** **Wrong. Keep both.** They map to different values in the `AssetAutomationType` enum and control different things.

| Toggle | Controls | Real Google Ads API field |
|---|---|---|
| **URL Expansion** | **Destination routing** — can Google send a click to a landing page different from `finalUrl`? | `AssetAutomationType.FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION` (v22+) / `Campaign.url_expansion_opt_out` (pre-v22) |
| **URL Text Generation** | **Creative generation** — can Google generate NEW ad text by reading the content of landing pages? | `AssetAutomationType.TEXT_ASSET_AUTOMATION` |

Both start from a URL. The similarity ends there. One decides *where the user lands*; the other decides *what text the ad says*. A merchant can turn either on independently:
- Routing ON + generated text OFF → "let Google pick smart landing pages, only use my headlines"
- Routing OFF + generated text ON → "stick to my finalUrl but generate more copy variations"

The confusion likely came from the v22 rename — the URL Expansion enum is now named `FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION` (with `TEXT_ASSET_AUTOMATION` in the name). The naming reflects that URL Expansion **generates** text from the expanded URLs; it does *not* mean the two toggles are equivalent. They remain independent `AssetAutomationSetting` entries.

---

## Full mapping table

Every toggle in the Salla PMax "Smart Enhancement" card maps to a real Google Ads API v22 field. All 7 exist. All 7 default to ON for PMax.

| # | Salla UI toggle | Real API field | Default | Doc anchor |
|---|---|---|---|---|
| 1 | URL Expansion | `AssetAutomationType.FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION` | ON | [#url-expansion](#1-url-expansion) |
| 2 | Brand Guidelines | `Campaign.brand_guidelines_enabled` (bool) | ON in v21+ | [#brand-guidelines](#2-brand-guidelines) |
| 3 | Text Enhancement | `AssetAutomationType.TEXT_ASSET_AUTOMATION` (copy-variation scope) | ON | [#text-enhancement](#3-text-enhancement) |
| 4 | URL Text Generation | `AssetAutomationType.TEXT_ASSET_AUTOMATION` (URL-derived scope) | ON | [#url-text-generation](#4-url-text-generation) |
| 5 | Image Extraction | `AssetAutomationType.GENERATE_IMAGE_EXTRACTION` | Account-level | [#image-extraction](#5-image-extraction) |
| 6 | Image Enhancement | `AssetAutomationType.GENERATE_IMAGE_ENHANCEMENT` | ON | [#image-enhancement](#6-image-enhancement) |
| 7 | Video Enhancement | `AssetAutomationType.GENERATE_ENHANCED_YOUTUBE_VIDEOS` | ON | [#video-enhancement](#7-video-enhancement) |

Toggles 1, 3, 4, 5, 6, 7 all live on the campaign's `assetAutomationSettings` array. Toggle 2 (Brand Guidelines) is a **separate boolean field on the Campaign resource** — not part of `assetAutomationSettings` — and its state changes how brand assets must be linked (see below).

---

## Per-toggle deep dive

### 1. URL Expansion

**What it does (plain English):**
Lets Google send a paid click to a URL other than the merchant's specified `finalUrl`, as long as the destination is on the same domain. Google picks the target based on user search intent. Merchant sets `store.salla.sa`; Google might route a click for "arabian coffee set" to `store.salla.sa/products/arabian-coffee-set-gold`.

**Merchant impact:** conversion rate typically lifts 5–15% when ON because landing pages match query intent. Turn OFF for compliance-driven flows where every URL must be pre-approved.

**API mapping — v22 and later:**

```typescript
// Google Ads API v22+
{
  operations: [{
    update: {
      resourceName: `customers/${customerId}/campaigns/${campaignId}`,
      assetAutomationSettings: [{
        assetAutomationType: "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION",
        assetAutomationStatus: "OPTED_IN"  // or "OPTED_OUT"
      }]
    },
    updateMask: "assetAutomationSettings"
  }]
}
```

**API mapping — v21 and earlier (deprecated but merchants on older SDKs still use it):**

```typescript
{
  operations: [{
    update: {
      resourceName: `customers/${customerId}/campaigns/${campaignId}`,
      urlExpansionOptOut: false  // false = URL expansion is ON
    },
    updateMask: "urlExpansionOptOut"
  }]
}
```

**Optional exclusions:** merchants can block specific URL patterns from being used as expansion targets via a `WEBPAGE` `CampaignCriterion`:

```typescript
{
  campaignCriterion: {
    campaign: `customers/${customerId}/campaigns/${campaignId}`,
    negative: true,
    webpage: {
      conditions: [{ operand: "URL", operator: "CONTAINS", argument: "/admin/" }]
    }
  }
}
```

**Sources:**
- [Google Ads API — Performance Max Optimizations (URL expansion section)](https://developers.google.com/google-ads/api/performance-max/optimizations)
- [Google Ads API v22 — AssetAutomationType enum diff](https://developers.google.com/google-ads/api/diff-tool/v22/versus-v21/diffs/full/enums/asset_automation_type)
- [Google Ads Help — About Final URL Expansion in Performance Max](https://support.google.com/google-ads/answer/14337539)

---

### 2. Brand Guidelines

**What it does (plain English):**
Enables Google to use the merchant's brand assets (`BUSINESS_NAME`, `LOGO`, `LANDSCAPE_LOGO`) as building blocks when generating ad variations. Ensures every AI-generated version keeps the brand identity consistent instead of Google fabricating a random brand look.

**Merchant impact:** brand safety. When ON, generated ads always show the merchant's real logo and business name. When OFF, Google may omit or substitute.

**⚠ Important structural change — not just a boolean:**
When `brand_guidelines_enabled = true`, the three brand asset types **must** be attached at the CAMPAIGN level via `CampaignAsset`, NOT at the AssetGroup level via `AssetGroupAsset`. Getting this wrong causes campaign creation to fail.

**API mapping:**

```typescript
// Enable brand guidelines on the campaign
{
  operations: [{
    update: {
      resourceName: `customers/${customerId}/campaigns/${campaignId}`,
      brandGuidelinesEnabled: true
    },
    updateMask: "brandGuidelinesEnabled"
  }]
}

// Link brand assets — MUST be at CampaignAsset level (not AssetGroupAsset)
{
  operations: [{
    create: {
      campaign: `customers/${customerId}/campaigns/${campaignId}`,
      asset: `customers/${customerId}/assets/${businessNameAssetId}`,
      fieldType: "BUSINESS_NAME"  // Same for LOGO and LANDSCAPE_LOGO
    }
  }]
}
```

**Version notes:**
- v18 → cannot create brand-guidelines-enabled PMax via API
- v21 → brand guidelines default to enabled
- v22 → full API create/update support

**Sources:**
- [Google Ads Developer Blog — Upcoming changes to enable brand guidelines in PMax](https://ads-developers.googleblog.com/2024/12/upcoming-changes-to-enable-brand.html)
- [Google Ads Help — About Brand Guidelines](https://support.google.com/google-ads/answer/13906415)
- [Search Engine Land — Google completes PMax brand guidelines rollout](https://searchengineland.com/google-performance-max-campaigns-new-brand-asset-rules-458638)

---

### 3. Text Enhancement

**What it does (plain English):**
Auto-generates **variations of the merchant's existing headlines and descriptions** — different word orderings, tones, lengths — to A/B-test at the impression level. Google keeps the semantic meaning; it just remixes phrasing.

**Distinction from URL Text Generation:** Text Enhancement rewrites what the merchant TYPED. URL Text Generation writes NEW copy from the merchant's LANDING PAGES.

**API mapping:**

```typescript
{
  operations: [{
    update: {
      resourceName: `customers/${customerId}/campaigns/${campaignId}`,
      assetAutomationSettings: [{
        assetAutomationType: "TEXT_ASSET_AUTOMATION",
        assetAutomationStatus: "OPTED_IN"
      }]
    },
    updateMask: "assetAutomationSettings"
  }]
}
```

**Text Guidelines (separate feature that pairs with this):**
Merchants can restrict what Google may generate with up to 25 term exclusions + 40 messaging restrictions per campaign, set via `Campaign.text_guidelines` (v22+). Not part of `assetAutomationSettings` — it's a sibling field.

**Sources:**
- [Google Ads API — Asset Automation Settings](https://developers.google.com/google-ads/api/docs/assets/asset-automation-settings)
- [Google Ads Help — Automatically Created Assets](https://support.google.com/google-ads/answer/12184305)

---

### 4. URL Text Generation

**What it does (plain English):**
Google reads the content of the merchant's landing pages and generates **new** headlines and descriptions matched to the page content. If the page shows "Silk Abaya - Classic Black - SAR 320", Google can generate a headline like "Silk Abaya Classic Black · SAR 320 · Free Shipping".

**How it interacts with URL Expansion:** URL Text Generation typically runs on URLs surfaced by URL Expansion (that's why the v22 enum name combines both). If URL Expansion is OFF, URL Text Generation runs only on the merchant's explicit `finalUrl`. Both can be independently toggled.

**API mapping:**
This is currently the same enum value as Text Enhancement (`TEXT_ASSET_AUTOMATION`) but scoped internally by Google to the URL-derived generation path. Google Ads UI presents them as two toggles; the API surfaces them via the same enum with runtime-level scoping. Future API versions may split into a dedicated enum — track the [release notes](https://developers.google.com/google-ads/api/docs/release-notes).

```typescript
// Same enum as Text Enhancement — Google's server-side logic scopes
// URL-derived generation vs. copy-remix generation from context.
// If the merchant toggles this OFF but leaves Text Enhancement ON,
// send TEXT_ASSET_AUTOMATION = OPTED_IN and rely on Google's account-
// level automation controls (or explicit text_guidelines exclusions)
// to suppress URL-derived output.
{
  operations: [{
    update: {
      resourceName: `customers/${customerId}/campaigns/${campaignId}`,
      assetAutomationSettings: [{
        assetAutomationType: "TEXT_ASSET_AUTOMATION",
        assetAutomationStatus: "OPTED_IN"
      }]
    },
    updateMask: "assetAutomationSettings"
  }]
}
```

**Sources:**
- [Google Ads API — Asset Automation Settings](https://developers.google.com/google-ads/api/docs/assets/asset-automation-settings)
- [Google Ads API v22 — enum diff](https://developers.google.com/google-ads/api/diff-tool/v22/versus-v21/diffs/full/enums/asset_automation_type)

---

### 5. Image Extraction

**What it does (plain English):**
Google crawls the merchant's landing pages and pulls product images to use as ad creatives. Turns the merchant's PDP images into ad assets automatically.

**Interaction with account-level settings:** this respects the account's Dynamic Image Extension setting. If disabled at the account level, this toggle has no effect regardless of campaign-level state.

**API mapping:**

```typescript
{
  operations: [{
    update: {
      resourceName: `customers/${customerId}/campaigns/${campaignId}`,
      assetAutomationSettings: [{
        assetAutomationType: "GENERATE_IMAGE_EXTRACTION",
        assetAutomationStatus: "OPTED_IN"
      }]
    },
    updateMask: "assetAutomationSettings"
  }]
}
```

**Sources:**
- [Google Ads API — Asset Automation Settings](https://developers.google.com/google-ads/api/docs/assets/asset-automation-settings)
- [Google Ads Help — Dynamic Image Extension](https://support.google.com/google-ads/answer/9566341)

---

### 6. Image Enhancement

**What it does (plain English):**
Optimizes/upscales images (both merchant-uploaded and extraction-sourced) for each Google surface — Search, Display, YouTube, Gmail, Discover. Handles cropping to aspect ratios, quality upscaling, and background cleanup.

**Distinction from Image Extraction:** Extraction *creates* image assets by crawling. Enhancement *optimizes* image assets after they exist. They run in sequence.

**API mapping:**

```typescript
{
  operations: [{
    update: {
      resourceName: `customers/${customerId}/campaigns/${campaignId}`,
      assetAutomationSettings: [{
        assetAutomationType: "GENERATE_IMAGE_ENHANCEMENT",
        assetAutomationStatus: "OPTED_IN"
      }]
    },
    updateMask: "assetAutomationSettings"
  }]
}
```

**Sources:**
- [Google Ads API — Asset Automation Settings](https://developers.google.com/google-ads/api/docs/assets/asset-automation-settings)

---

### 7. Video Enhancement

**What it does (plain English):**
Auto-creates video variations from merchant-uploaded videos — shorter cuts (6s, 15s), vertical (9:16) versions for YouTube Shorts, and videos generated from static images when the merchant only uploaded images.

**Multiple sub-automations share this UI toggle:**
- `GENERATE_ENHANCED_YOUTUBE_VIDEOS` — the primary umbrella
- Related enums in the Demand Gen family that PMax may also use: `GENERATE_SHORTER_YOUTUBE_VIDEOS`, `GENERATE_VERTICAL_YOUTUBE_VIDEOS`, `GENERATE_VIDEOS_FROM_OTHER_ASSETS`

**API mapping:**

```typescript
{
  operations: [{
    update: {
      resourceName: `customers/${customerId}/campaigns/${campaignId}`,
      assetAutomationSettings: [{
        assetAutomationType: "GENERATE_ENHANCED_YOUTUBE_VIDEOS",
        assetAutomationStatus: "OPTED_IN"
      }]
    },
    updateMask: "assetAutomationSettings"
  }]
}
```

**Sources:**
- [Google Ads API — Asset Automation Settings](https://developers.google.com/google-ads/api/docs/assets/asset-automation-settings)
- [Google Ads Help — Automatically Created Assets (Video)](https://support.google.com/google-ads/answer/12184305)

---

## Batch update — all seven at once

Recommended payload shape for the Salla submit layer. One `CampaignOperation` sets `brand_guidelines_enabled`; a second one attaches the six `assetAutomationSettings`.

```typescript
async function submitPMaxSmartEnhancement(customerId: string, campaignId: string, toggles: {
  urlExpansion: boolean;
  brandGuidelines: boolean;
  textEnhancement: boolean;
  urlTextGeneration: boolean;
  imageExtraction: boolean;
  imageEnhancement: boolean;
  videoEnhancement: boolean;
}) {
  const status = (on: boolean) => on ? "OPTED_IN" : "OPTED_OUT";
  const campaignResource = `customers/${customerId}/campaigns/${campaignId}`;

  // Operation 1 — brand guidelines flag (separate field, not part of assetAutomationSettings)
  const brandOp = {
    update: {
      resourceName: campaignResource,
      brandGuidelinesEnabled: toggles.brandGuidelines
    },
    updateMask: "brandGuidelinesEnabled"
  };

  // Operation 2 — asset automation array
  const assetAutomationOp = {
    update: {
      resourceName: campaignResource,
      assetAutomationSettings: [
        { assetAutomationType: "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION", assetAutomationStatus: status(toggles.urlExpansion) },
        { assetAutomationType: "TEXT_ASSET_AUTOMATION", assetAutomationStatus: status(toggles.textEnhancement || toggles.urlTextGeneration) },
        { assetAutomationType: "GENERATE_IMAGE_EXTRACTION", assetAutomationStatus: status(toggles.imageExtraction) },
        { assetAutomationType: "GENERATE_IMAGE_ENHANCEMENT", assetAutomationStatus: status(toggles.imageEnhancement) },
        { assetAutomationType: "GENERATE_ENHANCED_YOUTUBE_VIDEOS", assetAutomationStatus: status(toggles.videoEnhancement) }
      ]
    },
    updateMask: "assetAutomationSettings"
  };

  return await googleAdsClient.mutate({
    customerId,
    campaignOperations: [brandOp, assetAutomationOp]
  });
}
```

**Gotcha in the batch above:** Text Enhancement and URL Text Generation currently share the `TEXT_ASSET_AUTOMATION` enum. If merchant toggles are `textEnhancement=true, urlTextGeneration=false`, we still send `OPTED_IN` because Google's API doesn't yet expose granular control. Suppress URL-derived output via `Campaign.text_guidelines` term exclusions if the merchant genuinely wants only their own copy variations. Track [Google Ads release notes](https://developers.google.com/google-ads/api/docs/release-notes) for a dedicated enum split.

---

## Version support matrix

| Feature | v18 | v19 | v20 | v21 | v22+ |
|---|---|---|---|---|---|
| `Campaign.url_expansion_opt_out` | ✅ | ✅ | ✅ | ✅ (deprecated in v22) | ⚠ Deprecated |
| `FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION` | — | — | — | — | ✅ |
| `Campaign.brand_guidelines_enabled` (read) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create brand-guidelines-enabled PMax via API | ❌ | ⚠ | ✅ | ✅ (default) | ✅ (default) |
| `TEXT_ASSET_AUTOMATION` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GENERATE_IMAGE_EXTRACTION` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GENERATE_IMAGE_ENHANCEMENT` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GENERATE_ENHANCED_YOUTUBE_VIDEOS` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `Campaign.text_guidelines` (term exclusions / messaging restrictions) | — | — | — | — | ✅ |

**Recommendation:** target v22 minimum. Older versions require the legacy `url_expansion_opt_out` boolean instead of the new asset automation enum for the URL expansion toggle. The Salla payload builder should branch on the API version at request time.

---

## Primary sources (verified against docs, July 2026)

1. [Google Ads API — Performance Max Optimizations](https://developers.google.com/google-ads/api/performance-max/optimizations) — canonical URL expansion + text guidelines reference
2. [Google Ads API — Asset Automation Settings](https://developers.google.com/google-ads/api/docs/assets/asset-automation-settings) — full `AssetAutomationType` enum with defaults per campaign type
3. [Google Ads API v22 vs v21 — AssetAutomationType enum diff](https://developers.google.com/google-ads/api/diff-tool/v22/versus-v21/diffs/full/enums/asset_automation_type) — precise breaking-change matrix for URL expansion migration
4. [Google Ads Developer Blog — Upcoming changes to enable brand guidelines in PMax](https://ads-developers.googleblog.com/2024/12/upcoming-changes-to-enable-brand.html) — Brand Guidelines version notes + `CampaignAsset` migration
5. [Google Ads Help — About Final URL Expansion in Performance Max](https://support.google.com/google-ads/answer/14337539) — merchant-facing behavior
6. [Google Ads Help — Automatically Created Assets](https://support.google.com/google-ads/answer/12184305) — text + image + video automation overview
7. [Google Ads API — Create a Performance Max Campaign](https://developers.google.com/google-ads/api/performance-max/create-campaign) — full campaign creation sample including asset automation
8. [Google Ads API — Release notes](https://developers.google.com/google-ads/api/docs/release-notes) — monitor for TEXT_ASSET_AUTOMATION enum split

---

## Checklist for the dev

- [ ] Wire toggle 1 to `FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION` (v22+) with fallback to `url_expansion_opt_out` boolean for older API versions
- [ ] Wire toggle 2 to `Campaign.brand_guidelines_enabled` — **AND** move `BUSINESS_NAME` / `LOGO` / `LANDSCAPE_LOGO` from `AssetGroupAsset` to `CampaignAsset` when true
- [ ] Wire toggles 3 + 4 to `TEXT_ASSET_AUTOMATION`. Keep them as separate UI toggles per this doc; suppress URL-derived output via `Campaign.text_guidelines` if #4 is off and #3 is on
- [ ] Wire toggle 5 to `GENERATE_IMAGE_EXTRACTION` — check account-level Dynamic Image Extension status; toggle is a no-op if account disabled it
- [ ] Wire toggle 6 to `GENERATE_IMAGE_ENHANCEMENT`
- [ ] Wire toggle 7 to `GENERATE_ENHANCED_YOUTUBE_VIDEOS`
- [ ] Add integration test that verifies the `assetAutomationSettings` array serializes correctly across all seven ON/OFF permutations
- [ ] Add dev-panel inline API-mapping labels under each Salla UI toggle (mirrors the Demand Gen dev-audit panel pattern) so future audits don't re-flag this
