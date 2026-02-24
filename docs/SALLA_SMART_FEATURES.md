# Salla Smart Features

## Overview

**Salla Smart Features** is a shared audience section used on **all platforms** (Snapchat, Meta, TikTok, Google, DV360): Exclude Recent Purchasers (30/45/60 days) and Lookalike Audiences (Smart) with buyer category. Same content and UX everywhere; platform-specific state is mapped in each step-audience.

## Shared implementation

- **Component:** `components/shared/salla-smart-features-card.tsx`
- **Constants:** `lib/salla-smart-features.ts` — `PURCHASER_PRESETS` (30, 45, 60 days), `SALLA_CATEGORIES` (buyer categories).
- **Props:** `excludeRecentPurchasers`, `onExcludeRecentPurchasersChange`, `excludeRecentPurchasersDays`, `onExcludeRecentPurchasersDaysChange`, `lookalikeEnabled`, `onLookalikeEnabledChange`, `sallaAudienceCategory`, `onSallaAudienceCategoryChange`, `accent` (primary | meta | dv360), `showExcludePurchasers?`, `showLookalike?`.

## Features

1. **Exclude Recent Purchasers** (with “new” tag)
   - Toggle on/off.
   - When on: choose exclusion period — **30 Days**, **45 Days**, **60 Days** (rectangular buttons; selected = light green border/background).
   - Copy: “Exclude customers who made a purchase within the selected time period. This option is recommended when you want to expand your reach and focus on acquiring new customers.”

2. **Lookalike Audiences (Smart)** (with “new” tag)
   - Toggle on/off.
   - When on: dropdown with placeholder “Choose the audience that best matches your products.”
   - Copy: “Reach new potential customers who are similar to your existing customers using Salla Ads' smart algorithms.”

## UI/UX (Snapchat version)

- **Container:** Card with light green (emerald) border and soft green background; “Salla Smart Features” heading + “Powered by Salla” badge; Store icon in emerald.
- **Per feature:** Section with icon (Clock / Sparkles in emerald circle), title, description, and switch on the right. When expanded: clear “Exclusion period” / “Buyer category” label and controls; privacy note with icon for lookalike.
- **Accessibility:** `role="region"`, `aria-labelledby`, `aria-label` on switches, `id` on select for label association.

## Platform mapping

| Platform  | Exclude purchasers state              | Lookalike enabled state        | Category state              | Notes |
|-----------|----------------------------------------|---------------------------------|-----------------------------|-------|
| Snapchat  | `excludeRecentPurchasers`, `...Days`   | `sallaAudienceEnabled`          | `sallaAudienceCategory`      | Both sections shown. |
| Meta      | `excludeRecentPurchasers`, `...Days`   | `autoTargetingEnabled`          | `sallaAudienceCategory`      | `showExcludePurchasers={isSales}`. |
| TikTok    | `excludeRecentPurchasers`, `...Days`   | `autoTargetingEnabled`          | `sallaAudienceCategory`      | `showExcludePurchasers` when not Reach/VideoViews/LeadGen/AppPromo. |
| Google    | `excludeRecentConverters`, `...Days`   | `optimizedTargeting`            | `sallaAudienceCategory`      | Hidden when App. Lookalike hidden when Search (`showLookalike={!isSearch}`). |
| DV360     | `excludeRecentPurchasers`, `...Days`   | `sallaLookalikeEnabled`         | `sallaAudienceCategory`      | New audience fields; card after Additional targeting. |
