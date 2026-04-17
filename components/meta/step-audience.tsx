"use client";

import { useState } from "react";
import { useMetaCampaign } from "@/lib/meta/campaign-context";
import { cn } from "@/lib/utils";
import { getCountryByCode, getCityById } from "@/lib/locations";
import { LocationSelector } from "@/components/shared/location-selector";
import { LocationReachCard } from "@/components/shared/location-reach-card";
import { DemographicsCard } from "@/components/shared/demographics-card";
import { SallaSmartFeaturesCard } from "@/components/shared/salla-smart-features-card";
import { CustomAudiencesCard } from "@/components/shared/custom-audiences-card";
import { DeviceTargetingCard } from "@/components/shared/device-targeting-card";
import { LegacyInterestTargetingCard as InterestTargetingCard } from "@/components/shared/interest-targeting-card";
import { TargetingSummaryCard } from "@/components/shared/targeting-summary-card";
import { CampaignReadinessCard } from "@/components/shared/campaign-readiness-card";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { SectionCard } from "@/components/shared/section-card";
import {
  LearnMoreSheet,
  LearnMoreTrigger,
  SheetSection,
  SheetDecisionCard,
  useLearnMore,
} from "@/components/shared/learn-more-sheet";
import { minMaxToAgeBands, ageBandsToMinMax, SUPPORTED_LANGUAGES } from "@/lib/demographics";
import { Switch } from "@/components/ui/switch";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  Globe,
  MapPin,
  Target,
  Sparkles,
  Users,
  Search,
  Layers,
  Info,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const INTERESTS = [
  { id: "META_1", label: "Fashion & Apparel" },
  { id: "META_2", label: "Beauty & Personal Care" },
  { id: "META_3", label: "Electronics & Tech" },
  { id: "META_4", label: "Food & Dining" },
  { id: "META_5", label: "Fitness & Sports" },
  { id: "META_6", label: "Gaming" },
  { id: "META_7", label: "Travel" },
  { id: "META_8", label: "Automotive" },
  { id: "META_9", label: "Home & Garden" },
  { id: "META_10", label: "Entertainment" },
  { id: "META_11", label: "Online Shopping" },
  { id: "META_12", label: "Parenting" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MetaStepAudience() {
  const { campaign, setStep, updateNested } = useMetaCampaign();
  const aud = campaign.audience;
  const isSales = campaign.objective.objective === "OUTCOME_SALES";

  const [showAdvanced, setShowAdvanced] = useState(false);

  /* Learn-more sheet hooks */
  const locationLearnMore = useLearnMore();
  const interestLearnMore = useLearnMore();
  const advantagePlusLearnMore = useLearnMore();
  const customAudiencesLearnMore = useLearnMore();

  /* Readiness checks (actionable suggestions matching Snapchat pattern) */
  const readinessChecks = [
    { label: "Define a clear geographic location for the campaign.", done: aud.countries.length > 0 },
    { label: "Select an appropriate age range for the target audience.", done: aud.ageMin >= 18 && aud.ageMax > aud.ageMin },
    { label: "Exclude recent buyers to acquire new customers.", done: aud.excludeRecentPurchasers },
    { label: "Use lookalike audiences to reach new customers.", done: aud.autoTargetingEnabled },
    { label: "Use custom audiences for targeting or exclusion.", done: aud.customAudienceIds.length > 0 || aud.excludedAudienceIds.length > 0 },
  ];
  const allReady = aud.countries.length > 0 && aud.ageMin < aud.ageMax;


  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ============================================================ */}
        {/* LEFT COLUMN                                                   */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">
          {/* ---- 1. Location (shared component — Meta: countries + cities, maps to geo_locations.countries & .cities) ---- */}
          <SectionCard>
            <div className="mb-2 flex justify-end">
              <LearnMoreTrigger {...locationLearnMore.triggerProps} />
            </div>
            <LocationSelector
              value={{
                countryCodes: aud.countries,
                regions: [],
                cities: aud.cities
                  .map((id) => getCityById(id))
                  .filter((c): c is NonNullable<typeof c> => c != null)
                  .map((c) => ({
                    id: c.id,
                    name: c.name,
                    countryCode: c.countryCode,
                    lat: c.lat,
                    lng: c.lng,
                    radiusKm: aud.cityRadii?.[c.id] ?? c.radiusKm,
                  })),
              }}
              onChange={(next) =>
                updateNested("audience", {
                  countries: next.countryCodes,
                  cities: next.cities.map((c) => c.id),
                  cityRadii: Object.fromEntries(next.cities.map((c) => [c.id, c.radiusKm])),
                })
              }
              enableCityTargeting
              enableRadiusPerCity
              accent="meta"
              label="Location"
            />
          </SectionCard>

          {/* ---- 2. Demographics (shared: English/Arabic, Male/Female, age bands) ---- */}
          <DemographicsCard
            languageCodes={aud.languages}
            onLanguagesChange={(codes) => updateNested("audience", { languages: codes })}
            genderIds={aud.gender === "ALL" ? ["MALE", "FEMALE"] : aud.gender === "MALE" ? ["MALE"] : ["FEMALE"]}
            onGendersChange={(ids) => {
              const gender = ids.length === 2 ? "ALL" : ids[0] === "MALE" ? "MALE" : "FEMALE";
              updateNested("audience", { gender: gender as typeof aud.gender });
            }}
            ageBandValues={minMaxToAgeBands(aud.ageMin, aud.ageMax)}
            onAgeBandsChange={(bands) => {
              const { ageMin, ageMax } = ageBandsToMinMax(bands);
              updateNested("audience", { ageMin, ageMax });
            }}
            accent="meta"
            languageRequired={aud.countries.length > 1}
          />

          {/* ---- 3. Interest Targeting (unified) ---- */}
          <div>
            <div className="mb-1.5 flex justify-end">
              <LearnMoreTrigger {...interestLearnMore.triggerProps} />
            </div>
            <InterestTargetingCard
              options={INTERESTS}
              value={aud.interests}
              onChange={(ids) => updateNested("audience", { interests: ids })}
              accent="meta"
              title="Interest Targeting"
            />
          </div>

          {/* ---- 4. Salla Smart Features (shared) ---- */}
          <SallaSmartFeaturesCard
            excludeRecentPurchasers={aud.excludeRecentPurchasers}
            onExcludeRecentPurchasersChange={(v) =>
              updateNested("audience", { excludeRecentPurchasers: v })
            }
            excludeRecentPurchasersDays={aud.excludeRecentPurchasersDays}
            onExcludeRecentPurchasersDaysChange={(days) =>
              updateNested("audience", { excludeRecentPurchasersDays: days })
            }
            lookalikeEnabled={aud.autoTargetingEnabled}
            onLookalikeEnabledChange={(v) =>
              updateNested("audience", { autoTargetingEnabled: v })
            }
            sallaAudienceCategory={aud.sallaAudienceCategory || ""}
            onSallaAudienceCategoryChange={(v) =>
              updateNested("audience", { sallaAudienceCategory: v })
            }
            accent="meta"
            showExcludePurchasers={isSales}
          />

          {/* ---- 5. Advanced Settings (collapsible — matches Snapchat pattern) ---- */}
          <div className={cn(
            "rounded-2xl transition-colors",
            showAdvanced ? "bg-muted/50 p-2" : ""
          )}>
            <button
              type="button"
              aria-expanded={showAdvanced}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                "flex w-full items-center justify-between px-4 pb-3 pt-4 sm:px-6 sm:pt-5 text-left transition-colors rounded-2xl",
                !showAdvanced && "border border-border bg-card hover:bg-muted/30"
              )}
            >
              <div>
                <span className="text-base font-bold text-foreground">Advanced Settings</span>
                <p className="mt-1 text-xs text-muted-foreground">Custom Audiences, Devices, Expansion</p>
              </div>
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
            </button>

            {showAdvanced && (
              <div className="mt-2 flex flex-col gap-4">

                {/* Custom Audiences (unified) */}
                <div className="overflow-hidden rounded-xl bg-card">
                  <CustomAudiencesCard
                    includeIds={aud.customAudienceIds}
                    onIncludeIdsChange={(ids) =>
                      updateNested("audience", { customAudienceIds: ids })
                    }
                    excludeIds={aud.excludedAudienceIds}
                    onExcludeIdsChange={(ids) =>
                      updateNested("audience", { excludedAudienceIds: ids })
                    }
                    accent="meta"
                    learnMoreTrigger={<LearnMoreTrigger {...customAudiencesLearnMore.triggerProps} />}
                  />
                </div>

                {/* Device Targeting (unified) */}
                <div className="overflow-hidden rounded-xl bg-card">
                  <DeviceTargetingCard
                    value={aud.operatingSystems}
                    onChange={(ids) =>
                      updateNested("audience", { operatingSystems: ids })
                    }
                    accent="meta"
                  />
                </div>

                {/* Advantage+ Audience */}
                <SectionCard>
                  <div className="mb-2 flex justify-end">
                    <LearnMoreTrigger {...advantagePlusLearnMore.triggerProps} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-[#1877F2]" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Advantage+ Audience</p>
                        <p className="text-xs text-muted-foreground">
                          Let Meta&apos;s AI expand beyond your targeting to find better-converting audiences.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={aud.advantagePlusAudience}
                      onCheckedChange={(v) => updateNested("audience", { advantagePlusAudience: v })}
                    />
                  </div>
                </SectionCard>
              </div>
            )}
          </div>

        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN                                                  */}
        {/* ============================================================ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="sticky top-20 flex flex-col gap-4">

            {/* Map + Audience Estimate (merged) */}
            <LocationReachCard
              countryCount={aud.countries.length}
              countries={aud.countries}
              cityCount={aud.cities.length}
              cities={(aud.cities ?? [])
                .map((id) => getCityById(id))
                .filter((c): c is NonNullable<typeof c> => c != null)
                .map((c) => ({
                  id: c.id,
                  name: c.name,
                  countryCode: c.countryCode,
                  lat: c.lat,
                  lng: c.lng,
                  radiusKm: aud.cityRadii?.[c.id] ?? 0,
                }))}
            />

            {/* Campaign Readiness (shared — matches Snapchat pattern) */}
            <CampaignReadinessCard checks={readinessChecks} />

            {/* Targeting Summary (shared) */}
            <TargetingSummaryCard
              title="Targeting Summary"
              accent="meta"
              rows={[
                { label: "Countries", value: aud.countries.length > 0 ? aud.countries.map((c) => getCountryByCode(c)?.name ?? c).join(", ") : "None" },
                { label: "Gender", value: aud.gender === "ALL" ? "All" : aud.gender === "MALE" ? "Male" : "Female" },
                { label: "Age", value: `${aud.ageMin} - ${aud.ageMax === 65 ? "65+" : aud.ageMax}` },
                { label: "Languages", value: aud.languages.length > 0 ? aud.languages.map((l) => SUPPORTED_LANGUAGES.find((x) => x.code === l)?.label || l).join(", ") : "All" },
                { label: "Interests", value: aud.interests.length > 0 ? `${aud.interests.length} selected` : "Broad (all)" },
                { label: "Devices", value: aud.operatingSystems.length === 2 ? "All" : aud.operatingSystems.join(", ") || "None" },
                { label: "Advantage+", value: aud.advantagePlusAudience ? "On" : "Off" },
                ...(aud.excludeRecentPurchasers ? [{ label: "Exclude Buyers", value: `${aud.excludeRecentPurchasersDays}d` }] : []),
                ...(aud.autoTargetingEnabled ? [{ label: "Lookalike", value: aud.sallaAudienceCategory || "All buyers" }] : []),
              ]}
            />

          </div>
        </div>
      </div>

      {/* ── Learn More Sheets ── */}

      {/* 1. Location Targeting */}
      <LearnMoreSheet
        open={locationLearnMore.open}
        onOpenChange={locationLearnMore.setOpen}
        title="Location Targeting"
        description="Choose where your ads are shown. Location targeting determines who sees your ads based on their geographic location."
        icon={<Globe />}
        proTip="Start with country-level targeting (e.g., Saudi Arabia). Narrow to specific cities only if your business serves a limited area or if you want to test regional performance."
      >
        <SheetSection icon={<Globe />} title="Country vs City Targeting">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Country-level targeting"
              description="Reaches all users in the selected country. Best for e-commerce businesses that ship nationwide or digital products with no geographic limits. Maximizes your potential audience."
              highlighted
            />
            <SheetDecisionCard
              title="City-level targeting"
              description="Focuses on specific cities and their surrounding area. Best for local businesses, city-specific promotions, or testing performance in specific regions before scaling."
            />
          </div>
        </SheetSection>
        <SheetSection icon={<MapPin />} title="GCC Market Context">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Saudi Arabia is the <span className="font-semibold text-foreground">largest e-commerce market in the GCC</span>, with typical audience sizes of 15-25 million on Meta. The UAE, Kuwait, and Bahrain offer smaller but high-spending audiences. For most Salla merchants, starting with Saudi Arabia provides the best balance of reach and relevance.
          </p>
        </SheetSection>
        <SheetSection icon={<Target />} title="City Radius">
          <p className="text-xs leading-relaxed text-muted-foreground">
            When targeting specific cities, the radius controls how far beyond the city center your ads reach. A <span className="font-semibold text-foreground">smaller radius</span> (10-15 km) is ideal for businesses with a physical location. A <span className="font-semibold text-foreground">larger radius</span> (25-50 km) captures suburban areas and nearby towns. Expand the radius if your audience estimate is too small.
          </p>
        </SheetSection>
      </LearnMoreSheet>

      {/* 2. Interest Targeting */}
      <LearnMoreSheet
        open={interestLearnMore.open}
        onOpenChange={interestLearnMore.setOpen}
        title="Interest Targeting"
        description="Interest targeting shows your ads to people who have demonstrated interest in topics related to your product or business."
        icon={<Search />}
        proTip="For Salla merchants, start with 3-5 broad interests related to your product category. Add more specific interests only after you see which audiences convert best."
      >
        <SheetSection icon={<Search />} title="How It Works">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Meta analyzes user behavior &mdash; pages liked, content engaged with, ads clicked &mdash; to categorize people by their interests. When you select interests, Meta shows your ad to people who have demonstrated affinity for those topics. This is <span className="font-semibold text-foreground">behavior-based</span>, not just demographic.
          </p>
        </SheetSection>
        <SheetSection icon={<Layers />} title="Broad vs Narrow">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Fewer interests = wider audience"
              description="Selecting just 1-2 broad interests (e.g., 'Online Shopping') gives Meta's algorithm more room to find buyers. Best for new campaigns where you're still learning what works."
              highlighted
            />
            <SheetDecisionCard
              title="More interests = smaller, focused audience"
              description="Stacking 5+ specific interests (e.g., 'Abayas', 'Modest Fashion', 'Saudi Designers') narrows your audience to highly relevant users. Best when you know exactly who your buyer is."
            />
          </div>
        </SheetSection>
        <SheetSection icon={<Sparkles />} title="Interest Expansion">
          <p className="text-xs leading-relaxed text-muted-foreground">
            When Advantage+ Audience is enabled, Meta may show your ad to people <span className="font-semibold text-foreground">beyond your selected interests</span> if its algorithm predicts they are likely to convert. Your selected interests act as a starting signal, not a hard boundary. This typically improves performance for conversion-optimized campaigns.
          </p>
        </SheetSection>
      </LearnMoreSheet>

      {/* 3. Advantage+ Audience */}
      <LearnMoreSheet
        open={advantagePlusLearnMore.open}
        onOpenChange={advantagePlusLearnMore.setOpen}
        title="Advantage+ Audience"
        description="Advantage+ Audience uses Meta's AI to automatically expand beyond your defined targeting to find people most likely to convert."
        icon={<Sparkles />}
        proTip="Enable Advantage+ Audience for most campaigns. Meta's algorithm is very good at finding buyers within a broad pool — often better than manual interest stacking."
      >
        <SheetSection icon={<Zap />} title="What It Does">
          <p className="text-xs leading-relaxed text-muted-foreground">
            When enabled, Meta treats your selected locations, demographics, and interests as <span className="font-semibold text-foreground">suggestions rather than hard constraints</span>. Its AI analyzes conversion patterns from your pixel data and similar advertisers to find additional high-value users you may have missed with manual targeting.
          </p>
        </SheetSection>
        <SheetSection icon={<Target />} title="When to Use">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Enable for most campaigns"
              description="New campaigns, broad goals (awareness, traffic), scaling phases, or when you want Meta's algorithm to optimize delivery. Works best with conversion-optimized campaigns and sufficient pixel data."
              highlighted
            />
            <SheetDecisionCard
              title="Disable for niche targeting"
              description="Very specific niche audiences, retargeting campaigns with custom audiences, or when you need strict control over exactly who sees the ad (e.g., geo-restricted offers)."
            />
          </div>
        </SheetSection>
        <SheetSection icon={<Info />} title="How It Differs from Manual">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Without Advantage+, Meta only shows ads to users who match <span className="font-semibold text-foreground">all</span> your targeting criteria. With it enabled, Meta can explore beyond those criteria while still prioritizing your defined audience. Think of it as giving the algorithm permission to find opportunities you might not have anticipated.
          </p>
        </SheetSection>
      </LearnMoreSheet>

      {/* 4. Custom Audiences */}
      <LearnMoreSheet
        open={customAudiencesLearnMore.open}
        onOpenChange={customAudiencesLearnMore.setOpen}
        title="Custom Audiences"
        description="Custom Audiences let you target or exclude specific groups of people who have already interacted with your business."
        icon={<Users />}
        proTip="If you have an existing customer list, create a lookalike audience — it's one of the most effective targeting strategies for e-commerce."
      >
        <SheetSection icon={<Users />} title="What Are Custom Audiences?">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Custom Audiences are groups of people who have already engaged with your business &mdash; website visitors, app users, email subscribers, or past purchasers. Because these users already know your brand, they convert at <span className="font-semibold text-foreground">2-3x the rate</span> of cold audiences.
          </p>
        </SheetSection>
        <SheetSection icon={<Target />} title="Include vs Exclude">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Include — Retargeting"
              description="Show ads to people who visited your store, added to cart, or engaged with previous ads. These warm audiences are your highest-converting segment."
              highlighted
            />
            <SheetDecisionCard
              title="Exclude — Suppression"
              description="Prevent specific groups from seeing your ads. Most common: exclude recent purchasers to focus budget on acquiring new customers instead of re-showing ads to people who already bought."
            />
          </div>
        </SheetSection>
        <SheetSection icon={<Search />} title="Lookalike Audiences">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Meta can analyze your custom audience and find new people who <span className="font-semibold text-foreground">share similar characteristics and behaviors</span>. A 1% lookalike targets the closest matches (highest quality, smallest reach). A 5-10% lookalike casts a wider net. For most Salla merchants, a 1-3% lookalike based on purchasers delivers the best results.
          </p>
        </SheetSection>
      </LearnMoreSheet>

      <WizardStepFooter
        onPrevious={() => setStep(0)}
        onNext={() => setStep(2)}
        previousLabel="Previous"
        nextLabel="Next"
        nextDisabled={!allReady}
        accent="meta"
      />
    </TooltipProvider>
  );
}
