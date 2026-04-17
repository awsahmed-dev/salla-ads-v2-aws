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
import { minMaxToAgeBands, ageBandsToMinMax, SUPPORTED_LANGUAGES } from "@/lib/demographics";
import { Switch } from "@/components/ui/switch";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  Sparkles,
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
          <InterestTargetingCard
            options={INTERESTS}
            value={aud.interests}
            onChange={(ids) => updateNested("audience", { interests: ids })}
            accent="meta"
            title="Interest Targeting"
          />

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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-[#1877F2]" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Advantage+ Audience</p>
                        <p className="text-xs text-muted-foreground">
                          Let Meta's AI expand beyond your targeting to find better-converting audiences.
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
