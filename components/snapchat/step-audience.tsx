"use client";

import { useState } from "react";
import { useCampaign } from "@/lib/snapchat/campaign-context";
import { cn } from "@/lib/utils";
import { getCityById, getCountryByCode } from "@/lib/locations";
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
  ShieldCheck,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const INTERESTS = [
  { id: "SLC_1", label: "Fashion & Apparel" },
  { id: "SLC_2", label: "Beauty & Skincare" },
  { id: "SLC_3", label: "Electronics & Tech" },
  { id: "SLC_4", label: "Food & Dining" },
  { id: "SLC_5", label: "Fitness & Wellness" },
  { id: "SLC_6", label: "Gaming" },
  { id: "SLC_7", label: "Travel" },
  { id: "SLC_8", label: "Automotive" },
  { id: "SLC_9", label: "Home & Living" },
  { id: "SLC_10", label: "Sports" },
  { id: "SLC_11", label: "Shopping" },
  { id: "SLC_12", label: "Kids & Parenting" },
];


/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StepAudience() {
  const { campaign, setStep, updateNested } = useCampaign();
  const aud = campaign.audience;

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

          {/* ---- 3. Interests (unified) ---- */}
          <InterestTargetingCard
            options={INTERESTS}
            value={aud.interests}
            onChange={(ids) => updateNested("audience", { interests: ids })}
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
              <span className="ml-auto text-xs text-muted-foreground">Custom audiences, devices, expansion</span>
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

                {/* Regulated Content + Audience Expansion */}
                <SectionCard>
                  <div className="flex flex-col gap-4">
                    {/* Regulated Content */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-primary" />
                        <div>
                          <Label className="text-sm font-semibold text-foreground">Regulated Content</Label>
                          <p className="text-xs text-muted-foreground">
                            Enable if your ads promote regulated products (e.g., alcohol, pharmaceuticals).
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={aud.regulatedContent}
                        onCheckedChange={(v) =>
                          updateNested("audience", { regulatedContent: v })
                        }
                      />
                    </div>

                    <div className="h-px bg-border" />

                    {/* Audience Expansion */}
                    <div>
                      <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Sparkles className="size-4 text-primary" />
                        Audience Expansion
                        <InfoTip text="Automatically find similar users beyond your targeting settings for better performance. Recommended for Sales campaigns." />
                      </Label>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-foreground">Interest Expansion</p>
                            <p className="text-xs text-muted-foreground">
                              Let Snapchat find users with similar interests beyond your selections.
                            </p>
                          </div>
                          <Switch
                            checked={aud.interestExpansion}
                            onCheckedChange={(v) =>
                              updateNested("audience", { interestExpansion: v })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-foreground">Custom Audience Expansion</p>
                            <p className="text-xs text-muted-foreground">
                              Find users similar to your custom audience segments.
                            </p>
                          </div>
                          <Switch
                            checked={aud.customAudienceExpansion}
                            onCheckedChange={(v) =>
                              updateNested("audience", {
                                customAudienceExpansion: v,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
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

            {/* ---- Reach in selected locations (shared, location-only) ---- */}
            <LocationReachCard
              countryCount={aud.countries.length}
              countries={aud.countries}
              cityCount={aud.cities.length}
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
                ...(aud.cities.length > 0 ? [{ label: "Cities", value: aud.cities.map((c) => c.name).join(", ") }] : []),
                { label: "Gender", value: aud.genders.length === 2 ? "All" : aud.genders.length === 1 ? aud.genders[0] : "None" },
                { label: "Age", value: `${aud.ageMin} - ${aud.ageMax === 55 ? "55+" : aud.ageMax}` },
                { label: "Languages", value: aud.languages.length > 0 ? aud.languages.map((l) => SUPPORTED_LANGUAGES.find((x) => x.code === l)?.label || l).join(", ") : "All" },
                { label: "Interests", value: aud.interests.length > 0 ? `${aud.interests.length} selected` : "All" },
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
        nextLabel="Next: Budget & Schedule"
        nextDisabled={readinessPassed < readinessChecks.length}
        accent="primary"
      />
    </TooltipProvider>
  );
}
