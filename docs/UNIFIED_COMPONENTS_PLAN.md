# Unified Components Plan — Salla Ads (5 Platforms)

This document lists **100% common** patterns across all five ad platforms (Snapchat, TikTok, Google Ads, DV360, Meta) and the same 5-step flow (Objective → Audience → Budget → Creative → Review). Each item is a candidate for a **single shared component** used everywhere.

---

## 1. Layout & structure (already partially shared)

| Item | Current state | Recommendation |
|------|----------------|----------------|
| **Step 0 header** | ✅ Shared: `StepZeroHeader` | Already unified. |
| **Platform switcher** | Single component in `platform-switcher.tsx` | Keep as-is. |
| **Step indicator** | Shared: `components/shared/step-indicator.tsx` | Already unified; some platforms use platform-specific variants (e.g. `GoogleStepIndicator`) that could eventually wrap this with platform step labels. |
| **Step page shell** | Each step has its own wrapper (flex, max-w-3xl, padding). | **Unify:** e.g. `<StepPageLayout title="..." description="...">` so every step uses the same hero (h1 + description) + content area + max-width. |

---

## 2. Form layout primitives (duplicated in many files)

These are **copy-pasted** across Snapchat, TikTok, Google, DV360, and Meta with the same or nearly the same JSX.

### 2.1 SectionCard

- **What:** Wrapper: `rounded-xl border border-border bg-card p-5 shadow-sm` (or `p-6`).
- **Where:** Defined **locally** in:  
  `snapchat/step-budget`, `step-creative`, `step-review`, `step-audience`;  
  `tiktok/step-budget`, `step-creative`, `step-audience` (and used in review);  
  `google/step-audience`, `step-budget`, `step-creative`, `step-review`;  
  `dv360/step-budget`, `step-audience`, `step-creative`, `step-review`;  
  `meta/step-budget`, `step-audience`, `step-creative`, `step-review`.
- **Common API:** `children`, optional `className`.
- **Unify:** Single `SectionCard` in e.g. `components/shared/section-card.tsx`. Use everywhere.

### 2.2 InfoTip

- **What:** Tooltip trigger (Info icon) + TooltipContent with helper text.
- **Where:** Same files as SectionCard, plus `tiktok/roas-input.tsx`. Same pattern: `<Tooltip><TooltipTrigger><Info className="..." /></TooltipTrigger><TooltipContent>{text}</TooltipContent></Tooltip>`.
- **Common API:** `text: string` (and optionally `className` for the icon).
- **Unify:** Single `InfoTip` in e.g. `components/shared/info-tip.tsx`. Use everywhere.

### 2.3 SectionTitle (with optional badge)

- **What:** Row: icon + label + optional badge (e.g. “Insertion Order”). Used in DV360 and conceptually similar to “section header with icon” elsewhere.
- **Where:** DV360 uses `SectionTitle`; other platforms have similar “icon + title + InfoTip” rows.
- **Unify:** One `SectionTitle` component: `icon`, `title`, optional `badge`, optional `infoTip`. Use in all steps that need a section heading with icon.

---

## 3. Objective step (Step 0)

### 3.1 Campaign name field

- **What:** Required “Campaign Name” input with:
  - Label “Campaign Name” + required asterisk + InfoTip (platform-specific tooltip text).
  - Single-line input, optional `maxLength` (e.g. 512, 375, 200 per platform).
  - Helper text (“Give your campaign a descriptive name…”).
  - Character count: `{value.length}/{maxLength}` (and optional warning when near limit, e.g. >480).
- **Where:** All five `step-objective.tsx` files. Structure is the same; only placeholder, tooltip, maxLength and helper copy differ.
- **Unify:** `<CampaignNameField value={...} onChange={...} maxLength={512} placeholder="..." tooltipText="..." helperText="..." />`. One shared component; platforms pass platform-specific copy and limits.

---

## 4. Audience step (Step 1)

### 4.1 Age range selector (min–max)

- **What:** Two dropdowns: “Age Range” with “From [min] to [max]”. Options typically 18–65 (or 55) with “65+” / “55+” for the last.
- **Where:** Snapchat, TikTok, Google, Meta use the same pattern (two `<Select>`s with “to” between). DV360 uses multi-select chips for age bands instead of min/max.
- **Common (4/5):** Same UI: two selects, same “to” label, same “65+” / “55+” display. Only option list and state shape differ (e.g. `ageMin`/`ageMax` vs array).
- **Unify:** `<AgeRangeSelect min={ageMin} max={ageMax} onMinChange={...} onMaxChange={...} maxAge={65} />` (or 55 for TikTok). DV360 can keep its own chip-based control or use a variant that outputs the same conceptual range.

### 4.2 Gender selector

- **What:** “Gender” with options: All / Male / Female (or multi-select Male + Female). Styling: pill/button group, selected = primary style, optional checkmark.
- **Where:** All five audience steps. Snapchat/TikTok/Google/Meta use very similar button groups (All, Male, Female); DV360 uses chips. Same semantics.
- **Unify:** `<GenderSelect value={...} onChange={...} mode="single" | "multi" />` with shared styling. Platforms pass their value type and map to/from API enums.

### 4.3 Location / country selector ✅ UNIFIED

- **Unified:** `LocationSelector` + `lib/locations.ts` used in all five platforms (Snapchat: city+radius; others: country-only). Data: single source in `lib/locations.ts`.
- **What:** “Locations” or “Countries”: user picks one or more countries (e.g. Saudi Arabia, UAE). Often a list of checkboxes or a multi-select.
- **Where:** All five audience steps. Data (country list, codes) can differ; UI pattern (multi-select or checkbox list) is the same.
- **Unify:** `<CountrySelector selected={...} onChange={...} countryList={...} />` so one component handles display and selection; platforms pass their list and state.

### 4.4 Language selector

- **What:** “Languages” or “Language”: one or more languages (e.g. Arabic, English).
- **Where:** Snapchat, TikTok, Google, Meta (and optionally DV360). Same pattern: multi-select or checkbox list.
- **Unify:** `<LanguageSelector selected={...} onChange={...} options={...} />`.

---

## 5. Budget step (Step 2)

### 5.1 Date range (start date + end date)

- **What:** “Start Date” and “End Date” with two `<Input type="date">`. Validation: start ≥ today; end ≥ start. Optional “end date optional” (e.g. ongoing). When start changes and start > end, auto-adjust end (e.g. +7 or +14 days).
- **Where:** Snapchat, TikTok, Google, Meta, DV360 — same pattern. Only minor differences: label wording, “End Date optional” behavior, and default offset (7 vs 14 days).
- **Unify:** `<DateRangeField startDate={...} endDate={...} onStartChange={...} onEndChange={...} endDateOptional={false} defaultEndOffsetDays={14} />`. One component; platforms pass props.

### 5.2 Duration summary

- **What:** Text like “X days” or “From {start} to {end} (Y days)” in a small muted box below the date fields.
- **Where:** Snapchat, TikTok, Google, Meta (and similarly DV360). Same idea: show computed duration.
- **Unify:** `<DurationSummary startDate={...} endDate={...} />` (and optionally total budget if needed). Single component.

### 5.3 Daily / total amount input (currency)

- **What:** “Daily budget” or “Amount” input: numeric, with currency (SAR). Often with min/max and helper text.
- **Where:** All five budget steps. Same UX: label, number input, “SAR” suffix or prefix.
- **Unify:** `<BudgetAmountInput value={...} onChange={...} currency="SAR" min={...} max={...} label="Daily budget" />`. Reuse everywhere.

### 5.4 Payment method selector

- **What:** “Payment method”: Prepaid / Pay as you go / Monthly invoicing (or similar). Usually three options (cards or buttons).
- **Where:** Snapchat, TikTok, Meta (and similar in Google/DV360). Same three options and same structure.
- **Unify:** `<PaymentMethodSelect value={...} onChange={...} />` with options: prepaid, pay_as_you_go, monthly_invoicing. Shared component.

---

## 6. Creative step (Step 3)

### 6.1 Media upload zone

- **What:** Drag-and-drop or click to upload image/video; preview; clear; optional aspect-ratio/specs text.
- **Where:** Already shared: `components/shared/upload-zone.tsx`. Used by Snapchat and TikTok (and can be used by others).
- **Status:** ✅ Keep and reuse for all platforms that need a single file upload.

### 6.2 Product / catalog picker

- **What:** Dialog to select products from Salla catalog (e.g. for collection/catalog ads).
- **Where:** Already shared: `components/shared/product-picker.tsx`. Used by Snapchat, TikTok, etc.
- **Status:** ✅ Keep and reuse for all catalog-based creatives.

### 6.3 Ad / creative card (list item)

- **What:** In “Ad creatives” or “Ad groups”, each ad is shown as a card: thumbnail, name, format, status, edit/delete. Structure is similar across platforms; only fields differ.
- **Where:** All five step-creative (and step-review) surfaces. Pattern: bordered card, image preview, title, metadata row, actions.
- **Unify:** `<CreativeCard name={...} format={...} thumbnailUrl={...} onEdit={...} onDelete={...} status={...} />` (or a minimal version). Platforms pass platform-specific labels and actions.

---

## 7. Review step (Step 4)

### 7.1 ReviewRow (label + value + optional warn)

- **What:** One row: left = label (muted), right = value (foreground). Optional `warn` to style both in amber.
- **Where:** Defined **locally** in all five `step-review.tsx` files. Same signature: `label`, `value`, `warn?`. Same layout: flex, justify-between, py-1.
- **Unify:** Single `ReviewRow` in e.g. `components/shared/review-row.tsx`. Use in every review step.

### 7.2 SectionHeader (icon + title + “Edit” button)

- **What:** In review, each section (Objective, Audience, Budget, Creative) has a header: icon + title + “Edit” button that calls `setStep(stepIndex)`.
- **Where:** All five step-review files. Same pattern; only icon and title and step index differ.
- **Unify:** `<ReviewSectionHeader icon={...} title="..." step={0} onEdit={() => setStep(0)} />`. One component; platforms pass icon, title, and step index.

### 7.3 Pre-launch checklist (list of checks)

- **What:** List of validation items: label, ok (boolean), optional detail. Green check vs warning. Used to show “Campaign ready” / “Fix N issues”.
- **Where:** Snapchat, TikTok, Meta (and similar in Google/DV360). Same idea: array of `{ id, label, ok, detail? }`, render as list with icons.
- **Unify:** `<Checklist items={[...]} />` with optional `detail` and link to step. Shared component.

### 7.4 Launch success state

- **What:** After “Launch” / “Submit”: success screen with icon (e.g. Rocket), “Campaign Submitted!”, short message, summary cards (e.g. Total Budget, Ad count, Countries), and “Create Another Campaign” button.
- **Where:** All five review steps. Same structure; only copy and reset behavior differ.
- **Unify:** `<LaunchSuccess campaignName={...} totalBudget={...} adCount={...} countryCount={...} onReset={...} platform="meta" />` (or copy per platform). One layout component; platforms pass data and handler.

### 7.5 Submit / Launch button and loading state

- **What:** Primary button “Launch campaign” / “Submit for review” with loading state and optional terms checkbox.
- **Where:** All five review steps. Same pattern: disabled until checks pass (and maybe terms accepted), loading spinner on submit.
- **Unify:** `<LaunchButton loading={...} disabled={...} onLaunch={...} termsCheckbox={...} />` (or a slim version that only handles loading + disabled + onClick). Shared for consistency.

---

## 8. Navigation (all steps)

### 8.1 Step footer (Back + Continue / Cancel + Continue)

- **What:** Bottom of each step: “Back” (or “Cancel”) on the left; “Continue to [Next Step]” (or “Launch”) on the right. Sometimes “Cancel” discards and goes home; “Back” goes to previous step.
- **Where:** All step-objective, step-audience, step-budget, step-creative. Same layout; only labels and handlers differ.
- **Unify:** `<StepFooter onBack={...} onNext={...} nextLabel="Continue to Audience" backLabel="Back" />` (or variant with cancel). Optional `nextDisabled`. One component used in every step.

---

## 9. Summary table: 100% common → shared component

| # | Component | Used in | Notes |
|---|-----------|--------|-------|
| 1 | **SectionCard** | All steps, all platforms | Replace ~20+ local definitions. |
| 2 | **InfoTip** | All steps, all platforms | Replace ~20+ local definitions. |
| 3 | **SectionTitle** | Budget/Creative/Audience (optional badge) | Unify with SectionCard + icon + badge. |
| 4 | **StepPageLayout** | All steps | Hero (h1 + description) + content area + max-width. |
| 5 | **CampaignNameField** | Step 0, all platforms | Single field; platform-specific props. |
| 6 | **AgeRangeSelect** | Step 1, Snap/TikTok/Google/Meta | Min/max dropdowns; DV360 can stay chips or use variant. |
| 7 | **GenderSelect** | Step 1, all platforms | Single/multi; shared styling. |
| 8 | **CountrySelector** | Step 1, all platforms | Multi-select; platform country list. |
| 9 | **LanguageSelector** | Step 1, 4–5 platforms | Multi-select. |
| 10 | **DateRangeField** | Step 2, all platforms | Start/end date + validation + optional end. |
| 11 | **DurationSummary** | Step 2, all platforms | “X days” from start/end. |
| 12 | **BudgetAmountInput** | Step 2, all platforms | Amount + SAR (or configurable currency). |
| 13 | **PaymentMethodSelect** | Step 2, all platforms | Prepaid / Pay as you go / Monthly. |
| 14 | **UploadZone** | Step 3 | ✅ Already shared. |
| 15 | **ProductPicker** | Step 3 | ✅ Already shared. |
| 16 | **CreativeCard** (minimal) | Step 3 + Review | Thumbnail + name + format + actions. |
| 17 | **ReviewRow** | Step 4, all platforms | Label + value + optional warn. |
| 18 | **ReviewSectionHeader** | Step 4, all platforms | Icon + title + Edit button. |
| 19 | **Checklist** | Step 4 | Pre-launch checks list. |
| 20 | **LaunchSuccess** | Step 4, all platforms | Success screen + summary cards + “Create Another”. |
| 21 | **StepFooter** | All steps | Back/Cancel + Next/Continue. |

---

## 10. Suggested implementation order

1. **SectionCard** and **InfoTip** — highest duplication; no business logic.
2. **ReviewRow** and **ReviewSectionHeader** — used in five identical review UIs.
3. **CampaignNameField** — one field, five copies.
4. **DateRangeField** and **DurationSummary** — same in all budget steps.
5. **StepFooter** — same on every step.
6. **StepPageLayout** — same hero + content on every step.
7. **AgeRangeSelect**, **GenderSelect**, **CountrySelector**, **LanguageSelector** — audience step.
8. **BudgetAmountInput**, **PaymentMethodSelect** — budget step.
9. **SectionTitle** — then refactor SectionCard + title rows to use it.
10. **Checklist**, **LaunchSuccess**, **CreativeCard** — review and creative polish.

---

## 11. Out of scope (platform- or objective-specific)

- **Objective cards** (e.g. Sales, Traffic, Reach) — different per platform and objective set; keep per platform.
- **Bidding strategy selects** — different options per platform; keep per platform.
- **Pixel/Catalog/Conversion** setup — different fields per platform; keep per platform.
- **Creative format–specific UIs** (e.g. carousel builder, lead form builder) — can share small primitives but not full flows in v1.
- **Google-only:** Search keywords, Demand Gen ad groups, Shopping product groups, etc. — stay in Google components.
- **Meta-only:** Placements, Advantage+, etc. — stay in Meta components.
- **DV360-only:** Line item type, Floodlight, etc. — stay in DV360 components.

---

*Document generated from codebase analysis. Use this as the single source of truth for “what can be a common component” across all five platforms and the same 5-step flow.*
