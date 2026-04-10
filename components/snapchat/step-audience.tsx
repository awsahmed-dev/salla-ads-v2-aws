"use client";

import { useState } from "react";
import { useCampaign } from "@/lib/snapchat/campaign-context";
import { SMART_TARGETING_INCOMPATIBLE_GOALS } from "@/lib/snapchat/campaign-types";
import { cn } from "@/lib/utils";
import { getCityById, getCountryByCode, REGIONS } from "@/lib/locations";
import { LocationSelector } from "@/components/shared/location-selector";
import { LocationReachCard } from "@/components/shared/location-reach-card";
import { DeliveryCheckCard } from "@/components/shared/delivery-check-card";
import { DemographicsCard } from "@/components/shared/demographics-card";
import { SallaSmartFeaturesCard } from "@/components/shared/salla-smart-features-card";
import { CustomAudiencesCard } from "@/components/shared/custom-audiences-card";
import { DeviceTargetingCard } from "@/components/shared/device-targeting-card";
import { InterestTargetingCard } from "@/components/shared/interest-targeting-card";
import { TargetingSummaryCard } from "@/components/shared/targeting-summary-card";
import { AudienceReadinessChecklist } from "@/components/shared/audience-readiness-checklist";
import { LocationMapPreview } from "@/components/shared/location-map-preview";
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
          {/* Step header: title + description (align with other platforms) */}
          <div className="mb-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Audience & targeting</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Define who sees your Snap Ads by location, age, language, and interests.
            </p>
          </div>

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
          />

          {/* ---- 5. Advanced Targeting (collapsible) ---- */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  showAdvanced && "rotate-180"
                )}
              />
              Advanced Settings
              <span className="ml-auto text-xs text-muted-foreground">Audiences, devices, expansion</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 flex flex-col gap-4">

                {/* Custom Audiences (unified) */}
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

                {/* Device Targeting (unified) */}
                <DeviceTargetingCard
                  value={aud.deviceOS}
                  onChange={(ids) =>
                    updateNested("audience", { deviceOS: ids })
                  }
                  accent="primary"
                />

                {/* Audience Expansion — maps to Snap API auto_expansion_options */}
                <SectionCard>
                  <div className="flex flex-col gap-0">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="size-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-semibold text-foreground">Audience Expansion</Label>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          Let Snapchat find more people similar to your targeting for better results
                        </p>
                      </div>
                      <InfoTip text="Snap's expansion algorithms find users similar to your targeting settings. Interest Expansion is managed in the Interest Targeting card above. All options map to the API's auto_expansion_options." />
                    </div>

                    <div className="space-y-0 divide-y divide-border rounded-lg border border-border">
                      {/* Custom Audience Expansion */}
                      <div className="flex items-center gap-3 px-3 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">Custom Audience Expansion</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            Find users similar to your custom audience segments
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

                      {/* Smart Targeting */}
                      <div className={cn(
                        "flex items-center gap-3 px-3 py-3 transition-opacity",
                        (!aud.interestExpansion || !aud.customAudienceExpansion) && "opacity-50"
                      )}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium text-foreground">Smart Targeting</p>
                            <span className="rounded bg-amber-100 px-1 py-px text-[8px] font-bold uppercase text-amber-700">Recommended</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            Expand beyond gender and age limits to maximize conversions. Requires both expansion options enabled.
                          </p>
                          {smartTargetingBlocked && (
                            <p className="mt-1 text-[10px] text-amber-600 font-medium">
                              Not available for your current optimization goal (awareness/engagement goals).
                            </p>
                          )}
                          {aud.smartTargeting && aud.interestExpansion && aud.customAudienceExpansion && !smartTargetingBlocked && (
                            <p className="mt-1 text-[10px] text-primary font-medium">
                              Active — Snap will optimize across demographics for best performance
                            </p>
                          )}
                        </div>
                        <Switch
                          checked={aud.smartTargeting && !smartTargetingBlocked}
                          disabled={!aud.interestExpansion || !aud.customAudienceExpansion || smartTargetingBlocked}
                          onCheckedChange={(v) =>
                            updateNested("audience", { smartTargeting: v })
                          }
                        />
                      </div>
                    </div>

                    {/* Status summary */}
                    {(aud.interestExpansion || aud.customAudienceExpansion || aud.smartTargeting) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {aud.interestExpansion && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            <Sparkles className="size-2.5" /> Interest
                          </span>
                        )}
                        {aud.customAudienceExpansion && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            <Sparkles className="size-2.5" /> Custom Audience
                          </span>
                        )}
                        {aud.smartTargeting && aud.interestExpansion && aud.customAudienceExpansion && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            <Sparkles className="size-2.5" /> Smart Targeting
                          </span>
                        )}
                      </div>
                    )}
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
          <div className="lg:sticky lg:top-20 flex flex-col gap-4">

            {/* ---- Map Preview ---- */}
            <LocationMapPreview
              countryCodes={aud.countries}
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
            />

            {/* ---- Reach in selected locations (shared, location-only) ---- */}
            <LocationReachCard
              countryCount={aud.countries.length}
              countries={aud.countries}
              cityCount={aud.cities.length}
              objective={campaign.objective.objective}
              accent="primary"
            />

            {/* ---- Delivery Eligibility (shared) ---- */}
            <DeliveryCheckCard
              issues={(() => {
                const issues: { message: string }[] = [];
                if (aud.countries.length === 0) issues.push({ message: "No country selected" });
                if (aud.genders.length === 0) issues.push({ message: "No gender selected" });
                if (aud.countries.length > 1 && aud.languages.length === 0) issues.push({ message: "Multi-country requires language" });
                if (aud.ageMin >= aud.ageMax) issues.push({ message: "Invalid age range" });
                return issues;
              })()}
              cityCount={aud.cities.length}
              accent="primary"
            />

            <AudienceReadinessChecklist checks={readinessChecks} accent="primary" />

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
