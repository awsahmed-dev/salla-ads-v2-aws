"use client";

import { useState } from "react";
import { useMetaCampaign } from "@/lib/meta/campaign-context";
import { cn } from "@/lib/utils";
import { getCountryByCode, getCityById } from "@/lib/locations";
import { LocationSelector } from "@/components/shared/location-selector";
import { LocationReachCard } from "@/components/shared/location-reach-card";
import { DeliveryCheckCard } from "@/components/shared/delivery-check-card";
import { DemographicsCard } from "@/components/shared/demographics-card";
import { SallaSmartFeaturesCard } from "@/components/shared/salla-smart-features-card";
import { CustomAudiencesCard } from "@/components/shared/custom-audiences-card";
import { DeviceTargetingCard } from "@/components/shared/device-targeting-card";
import { LegacyInterestTargetingCard as InterestTargetingCard } from "@/components/shared/interest-targeting-card";
import { TargetingSummaryCard } from "@/components/shared/targeting-summary-card";
import { AudienceReadinessChecklist } from "@/components/shared/audience-readiness-checklist";
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

  /* Readiness checks */
  const readinessChecks = [
    { label: "At least 1 country selected", done: aud.countries.length > 0 },
    { label: "Language set", done: aud.languages.length > 0 },
    { label: "Age range configured", done: aud.ageMin >= 18 && aud.ageMax > aud.ageMin },
    { label: "Multi-country requires language", done: aud.countries.length <= 1 || aud.languages.length > 0 },
  ];
  const allReady = readinessChecks.every((c) => c.done);


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

          {/* ---- 5. Advanced Targeting (collapsible) ---- */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-[#1877F2]/40 hover:text-foreground"
            >
              <ChevronDown className={cn("size-4 transition-transform", showAdvanced && "rotate-180")} />
              Advanced Settings
              <span className="ml-auto text-xs text-muted-foreground">Custom Audiences, Devices, Expansion</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 flex flex-col gap-4">

                {/* Custom Audiences (unified) */}
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

                {/* Device Targeting (unified) */}
                <DeviceTargetingCard
                  value={aud.operatingSystems}
                  onChange={(ids) =>
                    updateNested("audience", { operatingSystems: ids })
                  }
                  accent="meta"
                />

                {/* Advantage+ Audience */}
                <SectionCard>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-[#1877F2]" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Advantage+ Audience</p>
                        <p className="text-xs text-muted-foreground">
                          Let Meta's AI expand your targeting beyond your settings to find better-converting audiences.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={aud.advantagePlusAudience}
                      onCheckedChange={(v) => updateNested("audience", { advantagePlusAudience: v })}
                    />
                  </div>
                  {aud.advantagePlusAudience && (
                    <div className="mt-3 flex items-start gap-2 rounded-md border border-[#1877F2]/20 bg-[#1877F2]/5 px-3 py-2">
                      <Sparkles className="mt-0.5 size-3 shrink-0 text-[#1877F2]" />
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        <span className="font-medium text-foreground">Advantage+ is enabled.</span> Meta may show ads beyond your selected countries, interests, and demographics to find people most likely to convert. Your targeting acts as a suggestion, not a hard constraint.
                      </p>
                    </div>
                  )}
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

            {/* Delivery Check (shared) */}
            <DeliveryCheckCard
              issues={(() => {
                const issues: { message: string }[] = [];
                if (aud.countries.length === 0) issues.push({ message: "No country selected" });
                if (aud.languages.length === 0) issues.push({ message: "No language set" });
                if (aud.countries.length > 1 && aud.languages.length === 0) issues.push({ message: "Multi-country requires language" });
                if (aud.ageMin >= aud.ageMax) issues.push({ message: "Invalid age range" });
                return issues;
              })()}
              cityCount={aud.cities.length}
              accent="meta"
            />

            <AudienceReadinessChecklist checks={readinessChecks} accent="meta" />

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
