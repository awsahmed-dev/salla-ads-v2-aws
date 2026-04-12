"use client";

import { useState } from "react";
import { useCampaign } from "@/lib/snapchat/campaign-context";
import { SMART_TARGETING_INCOMPATIBLE_GOALS } from "@/lib/snapchat/campaign-types";
import { cn } from "@/lib/utils";
import { getCityById, getCountryByCode, REGIONS } from "@/lib/locations";
import { LocationSelector } from "@/components/shared/location-selector";
import { LocationReachCard } from "@/components/shared/location-reach-card";
import { DemographicsCard } from "@/components/shared/demographics-card";
import { SallaSmartFeaturesCard } from "@/components/shared/salla-smart-features-card";
import { CustomAudiencesCard } from "@/components/shared/custom-audiences-card";
import { DeviceTargetingCard } from "@/components/shared/device-targeting-card";
import { InterestTargetingCard } from "@/components/shared/interest-targeting-card";
import { TargetingSummaryCard } from "@/components/shared/targeting-summary-card";
import { CampaignReadinessCard } from "@/components/shared/campaign-readiness-card";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
import { minMaxToAgeBands, ageBandsToMinMax, SUPPORTED_LANGUAGES } from "@/lib/demographics";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

import { SNAP_INTEREST_GROUPS, getInterestById } from "@/lib/interest-targeting";


/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StepAudience() {
  const { campaign, setStep, updateNested } = useCampaign();
  const aud = campaign.audience;

  // Snap API: Smart Targeting not available for awareness/engagement goals
  const smartTargetingBlocked = SMART_TARGETING_INCOMPATIBLE_GOALS.includes(campaign.budget.optimizationGoal);

  const [showAdvanced, setShowAdvanced] = useState(false);

  /* Readiness checklist */
  const readinessChecks = [
    { label: "At least 1 country selected", done: aud.countries.length > 0 },
    { label: "Language set", done: aud.languages.length > 0 },
    { label: "Age range configured", done: aud.ageMin >= 18 && aud.ageMax > aud.ageMin },
    { label: "Gender selected", done: aud.genders.length > 0 },
    {
      label: "Multi-country requires language",
      done: aud.countries.length <= 1 || aud.languages.length > 0,
    },
  ];
  const readinessPassed = readinessChecks.filter((c) => c.done).length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ============================================================ */}
        {/* LEFT COLUMN                                                   */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">
          {/* ---- 1. Location (unified shared component) ---- */}
          <SectionCard>
            <LocationSelector
              value={{
                countryCodes: aud.countries,
                cities: aud.cities.map((c) => {
                  const meta = getCityById(c.id);
                  return {
                    id: c.id,
                    name: c.name,
                    countryCode: meta?.countryCode ?? "",
                    lat: c.lat,
                    lng: c.lng,
                    radiusKm: c.radius / 1000,
                  };
                }),
                regions: aud.regions ?? [],
              }}
              onChange={(next) => {
                updateNested("audience", {
                  countries: next.countryCodes,
                  cities: next.cities.map((c) => ({
                    id: c.id,
                    name: c.name,
                    lat: c.lat,
                    lng: c.lng,
                    radius: Math.round(c.radiusKm * 1000),
                  })),
                  regions: next.regions ?? [],
                });
              }}
              enableCityTargeting
              enableRadiusPerCity
              accent="primary"
              label="Location (select type)"
            />
          </SectionCard>

          {/* ---- 2. Demographics (shared: English/Arabic, Male/Female, age bands) ---- */}
          <DemographicsCard
            languageCodes={aud.languages}
            onLanguagesChange={(codes) => updateNested("audience", { languages: codes })}
            genderIds={aud.genders}
            onGendersChange={(ids) => updateNested("audience", { genders: ids })}
            ageBandValues={minMaxToAgeBands(aud.ageMin, aud.ageMax)}
            onAgeBandsChange={(bands) => {
              const { ageMin, ageMax } = ageBandsToMinMax(bands);
              updateNested("audience", { ageMin, ageMax });
            }}
            accent="primary"
            languageRequired={aud.countries.length > 1}
          />

          {/* ---- 3. Interest Targeting (Snap SLC with groups) ---- */}
          <InterestTargetingCard
            groups={SNAP_INTEREST_GROUPS}
            includeIds={aud.interests}
            excludeIds={aud.interestsExclude ?? []}
            onIncludeChange={(ids) => updateNested("audience", { interests: ids })}
            onExcludeChange={(ids) => updateNested("audience", { interestsExclude: ids })}
            interestExpansion={aud.interestExpansion}
            onInterestExpansionChange={(v) => updateNested("audience", { interestExpansion: v })}
            accent="primary"
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
            lookalikeEnabled={aud.sallaAudienceEnabled}
            onLookalikeEnabledChange={(v) =>
              updateNested("audience", { sallaAudienceEnabled: v })
            }
            sallaAudienceCategory={aud.sallaAudienceCategory}
            onSallaAudienceCategoryChange={(v) =>
              updateNested("audience", { sallaAudienceCategory: v })
            }
            accent="primary"
            smartTargetingEnabled={aud.smartTargeting && !smartTargetingBlocked}
            onSmartTargetingChange={(v) => updateNested("audience", { smartTargeting: v })}
            smartTargetingDisabled={!aud.interestExpansion || !aud.customAudienceExpansion || smartTargetingBlocked}
          />

          {/* ---- 5. Advanced Settings (collapsible) ---- */}
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

                {/* Custom Audiences */}
                <div className="overflow-hidden rounded-xl bg-card">
                  <CustomAudiencesCard
                    includeIds={aud.customAudiencesInclude}
                    onIncludeIdsChange={(ids) =>
                      updateNested("audience", { customAudiencesInclude: ids })
                    }
                    excludeIds={aud.customAudiencesExclude}
                    onExcludeIdsChange={(ids) =>
                      updateNested("audience", { customAudiencesExclude: ids })
                    }
                    accent="primary"
                  />

                  {/* Custom Audience Expansion — inside same card */}
                  <div className="h-px bg-border/40" />
                  <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
                    <div>
                      <p className="text-sm font-medium text-foreground">Custom Audience Expansion</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Find users similar to your custom audience segments.
                      </p>
                    </div>
                    <Switch
                      checked={aud.customAudienceExpansion}
                      onCheckedChange={(v) => {
                        const update: Record<string, unknown> = { customAudienceExpansion: v };
                        if (!v && aud.smartTargeting) update.smartTargeting = false;
                        updateNested("audience", update);
                      }}
                    />
                  </div>
                </div>

                {/* Device Targeting */}
                <DeviceTargetingCard
                  value={aud.deviceOS}
                  onChange={(ids) =>
                    updateNested("audience", { deviceOS: ids })
                  }
                  accent="primary"
                />
              </div>
            )}
          </div>

        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN                                                  */}
        {/* ============================================================ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-20 flex flex-col gap-4">

            {/* ---- Map + Audience Estimate (merged) ---- */}
            <LocationReachCard
              countryCount={aud.countries.length}
              countries={aud.countries}
              cityCount={aud.cities.length}
              cities={aud.cities.map((c) => {
                const meta = getCityById(c.id);
                return {
                  id: c.id,
                  name: c.name,
                  countryCode: meta?.countryCode ?? "",
                  lat: c.lat,
                  lng: c.lng,
                  radiusKm: c.radius / 1000,
                };
              })}
              objective={campaign.objective.objective}
            />

            {/* ---- Campaign Readiness ---- */}
            <CampaignReadinessCard
              checks={[
                { label: "Define a clear geographic location for the campaign.", done: aud.countries.length > 0 },
                { label: "Select an appropriate age range for the target audience.", done: aud.ageMin < aud.ageMax },
                { label: "Exclude recent buyers to acquire new customers.", done: aud.excludeRecentPurchasers },
                { label: "Use lookalike audiences to reach new customers.", done: aud.sallaAudienceEnabled },
                { label: "Use custom audiences for targeting or exclusion.", done: aud.customAudiencesInclude.length > 0 || aud.customAudiencesExclude.length > 0 },
              ]}
            />

            {/* ---- Targeting Summary (shared) ---- */}
            <TargetingSummaryCard
              title="Targeting Summary"
              accent="primary"
              rows={[
                { label: "Countries", value: aud.countries.length > 0 ? aud.countries.map((c) => getCountryByCode(c)?.name ?? c).join(", ") : "None" },
                ...((aud.regions ?? []).length > 0 ? [{ label: "Regions", value: (aud.regions ?? []).map((r) => REGIONS.find((reg) => reg.id === r)?.name ?? r).join(", ") }] : []),
                ...(aud.cities.length > 0 ? [{ label: "Cities", value: aud.cities.map((c) => c.name).join(", ") }] : []),
                { label: "Gender", value: aud.genders.length === 2 ? "All" : aud.genders.length === 1 ? aud.genders[0] : "None" },
                { label: "Age", value: `${aud.ageMin} - ${aud.ageMax === 55 ? "55+" : aud.ageMax}` },
                { label: "Languages", value: aud.languages.length > 0 ? aud.languages.map((l) => SUPPORTED_LANGUAGES.find((x) => x.code === l)?.label || l).join(", ") : "All" },
                { label: "Interests", value: aud.interests.length > 0
                  ? aud.interests.slice(0, 3).map((id) => getInterestById(id)?.label ?? id).join(", ") + (aud.interests.length > 3 ? ` +${aud.interests.length - 3}` : "")
                  : "All"
                },
                ...((aud.interestsExclude ?? []).length > 0 ? [{ label: "Excluded interests", value: `${(aud.interestsExclude ?? []).length} excluded`, highlight: true }] : []),
                { label: "Devices", value: aud.deviceOS.length === 2 ? "All" : aud.deviceOS.join(", ") || "All" },
                ...(aud.excludeRecentPurchasers ? [{ label: "Exclude buyers", value: `Last ${aud.excludeRecentPurchasersDays}d`, highlight: true }] : []),
                ...(aud.sallaAudienceEnabled && aud.sallaAudienceCategory ? [{ label: "Lookalike", value: aud.sallaAudienceCategory, highlight: true }] : []),
              ]}
            />

          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(0)}
        onNext={() => setStep(2)}
        nextLabel="Next"
        nextDisabled={readinessPassed < readinessChecks.length}
        accent="primary"
      />
    </TooltipProvider>
  );
}
