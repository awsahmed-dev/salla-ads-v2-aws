"use client";

import { useState } from "react";
import { useTikTokCampaign } from "@/lib/tiktok/campaign-context";
import { cn } from "@/lib/utils";
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
  Info,
  Sparkles,
} from "lucide-react";
import { getCountryByCode, getCityById } from "@/lib/locations";
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
import { minMaxToAgeBands, ageBandsToMinMax, SUPPORTED_LANGUAGES } from "@/lib/demographics";
import { OBJECTIVE_CONFIGS } from "@/lib/tiktok/campaign-types";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const INTERESTS = [
  { id: "TT_1", label: "Fashion & Apparel" },
  { id: "TT_2", label: "Beauty & Personal Care" },
  { id: "TT_3", label: "Electronics & Tech" },
  { id: "TT_4", label: "Food & Beverage" },
  { id: "TT_5", label: "Fitness & Sports" },
  { id: "TT_6", label: "Gaming" },
  { id: "TT_7", label: "Travel" },
  { id: "TT_8", label: "Automotive" },
  { id: "TT_9", label: "Home Improvement" },
  { id: "TT_10", label: "Entertainment" },
  { id: "TT_11", label: "Shopping" },
  { id: "TT_12", label: "Parenting" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TikTokStepAudience() {
  const { campaign, setStep, updateNested } = useTikTokCampaign();
  const aud = campaign.audience;
  const objectiveConfig = OBJECTIVE_CONFIGS[campaign.objective.objective] ?? OBJECTIVE_CONFIGS.PRODUCT_SALES;
  const isReach = campaign.objective.objective === "REACH";
  const isTraffic = campaign.objective.objective === "TRAFFIC";
  const isVideoViews = campaign.objective.objective === "VIDEO_VIEWS";
  const isLeadGen = campaign.objective.objective === "LEAD_GENERATION";
  const isAppPromo = campaign.objective.objective === "APP_PROMOTION";
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  /* Readiness checklist */
  const hasLocation = (aud.locationIds?.length ?? 0) > 0 || (aud.cities?.length ?? 0) > 0;
  const readinessChecks = [
    { label: "At least 1 location (country or city) selected", done: hasLocation },
    { label: "Language set", done: aud.languages.length > 0 },
    { label: "Age range configured", done: aud.ageMin >= 18 && aud.ageMax > aud.ageMin },
    {
      label: "Multi-country requires language",
      done: aud.locationIds.length <= 1 || aud.languages.length > 0,
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
              Define who sees your TikTok ads by location, age, language, and interests.
            </p>
          </div>

          {/* Objective-specific audience guidance */}
          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">
                {isReach ? "Reach tip" : isTraffic ? "Traffic tip" : isVideoViews ? "Video Views tip" : isLeadGen ? "Lead Gen tip" : isAppPromo ? "App Install tip" : "Sales tip"}:
              </span>{" "}
              {isReach
                ? "Use broad targeting (wide age range, all genders) to maximize unique reach. Narrow interests limit your audience and increase CPM."
                : isTraffic
                  ? "Balance reach and relevance. Too narrow wastes budget; too broad brings low-intent visitors. Start broad, then refine based on click-through data."
                  : isVideoViews
                    ? "Broader audiences work well for video views since TikTok optimizes for engagement. Focus on age and language rather than niche interests."
                    : isLeadGen
                      ? "Target users likely to fill out forms. Narrower demographics (age, interests) improve lead quality even if volume is lower."
                      : isAppPromo
                        ? "Device targeting matters most here. TikTok auto-targets the matching app store, but you can exclude older OS versions for better install rates."
                        : "Narrower targeting improves ROAS for Sales campaigns. Use interests and demographics to reach high-intent shoppers rather than maximizing reach."}
            </p>
          </div>

          {/* ---- 1. Location (shared component — same UX as all platforms; maps to locationIds + cities) ---- */}
          <SectionCard>
            <LocationSelector
              value={{
                countryCodes: aud.locationIds,
                cities: (aud.cities ?? [])
                  .map((id) => getCityById(id))
                  .filter((c): c is NonNullable<typeof c> => c != null)
                  .map((c) => ({ id: c.id, name: c.name, countryCode: c.countryCode, lat: c.lat, lng: c.lng, radiusKm: c.radiusKm })),
              }}
              onChange={(next) =>
                updateNested("audience", {
                  locationIds: next.countryCodes,
                  cities: next.cities.map((c) => c.id),
                })
              }
              enableCityTargeting
              enableRadiusPerCity={false}
              accent="primary"
              label="Location"
              tooltipText="Choose countries and/or cities where your ads will be shown. Maps to TikTok location_ids."
            />
          </SectionCard>

          {/* ---- 2. Demographics (shared: English/Arabic, Male/Female, age bands) ---- */}
          <DemographicsCard
            languageCodes={aud.languages}
            onLanguagesChange={(codes) => updateNested("audience", { languages: codes })}
            genderIds={aud.gender === "GENDER_UNLIMITED" ? ["MALE", "FEMALE"] : aud.gender === "GENDER_MALE" ? ["MALE"] : ["FEMALE"]}
            onGendersChange={(ids) => {
              const gender = ids.length === 2 ? "GENDER_UNLIMITED" : ids[0] === "MALE" ? "GENDER_MALE" : "GENDER_FEMALE";
              updateNested("audience", { gender: gender as typeof aud.gender });
            }}
            ageBandValues={minMaxToAgeBands(aud.ageMin, aud.ageMax)}
            onAgeBandsChange={(bands) => {
              const { ageMin, ageMax } = ageBandsToMinMax(bands);
              updateNested("audience", { ageMin, ageMax });
            }}
            accent="primary"
            languageRequired={aud.locationIds.length > 1}
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
            lookalikeEnabled={aud.autoTargetingEnabled}
            onLookalikeEnabledChange={(v) =>
              updateNested("audience", { autoTargetingEnabled: v })
            }
            sallaAudienceCategory={aud.sallaAudienceCategory || ""}
            onSallaAudienceCategoryChange={(v) =>
              updateNested("audience", { sallaAudienceCategory: v })
            }
            accent="primary"
            showExcludePurchasers={!isReach && !isVideoViews && !isLeadGen && !isAppPromo}
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
                  includeIds={aud.customAudienceIds}
                  onIncludeIdsChange={(ids) =>
                    updateNested("audience", { customAudienceIds: ids })
                  }
                  excludeIds={aud.excludedAudienceIds}
                  onExcludeIdsChange={(ids) =>
                    updateNested("audience", { excludedAudienceIds: ids })
                  }
                  accent="primary"
                />

                {/* Device Targeting (unified) */}
                <DeviceTargetingCard
                  value={aud.operatingSystems}
                  onChange={(ids) =>
                    updateNested("audience", { operatingSystems: ids })
                  }
                  accent="primary"
                  footer={
                    isAppPromo ? (
                      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
                        <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground">App Install campaigns</span> will automatically target users on <span className="font-medium text-foreground">{campaign.objective.appSettings.appPlatform === "IOS" ? "iOS" : "Android"}</span> based on your app platform. You can still select both platforms, but installs will only come from the matching store.
                        </p>
                      </div>
                    ) : undefined
                  }
                />

                {/* Audience Expansion */}
                <SectionCard>
                  <div className="flex flex-col gap-4">
                    <div>
                      <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Sparkles className="size-4 text-primary" />
                        Audience Expansion
<InfoTip text={isReach
  ? "Automatically expand your targeting to reach more unique users beyond your settings. Highly recommended for Reach campaigns."
  : isVideoViews
  ? "Automatically expand your audience to find more users who are likely to watch your video content."
  : isLeadGen
  ? "Automatically expand your audience to find more users likely to submit your lead form. Recommended for Lead Gen campaigns."
  : isAppPromo
  ? "Automatically expand your audience to find more users likely to install your app. Recommended for App Install campaigns."
  : isTraffic
  ? "Automatically find similar users beyond your targeting settings to drive more traffic to your site."
                  : "Automatically find similar users beyond your targeting settings for better performance. Recommended for Sales campaigns."
              } />
                      </Label>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-foreground">Interest Expansion</p>
                            <p className="text-xs text-muted-foreground">
                              Let TikTok find users with similar interests beyond your selections.
                            </p>
                          </div>
                          <Switch
                            checked={aud.autoTargetingEnabled}
                            onCheckedChange={(v) =>
                              updateNested("audience", { autoTargetingEnabled: v })
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
              countryCount={aud.locationIds.length}
              countries={aud.locationIds}
              cityCount={(aud.cities ?? []).length}
              accent="primary"
            />

            {/* ---- Delivery Eligibility (shared) ---- */}
            <DeliveryCheckCard
              issues={(() => {
                const issues: { message: string }[] = [];
                if (!hasLocation) issues.push({ message: "No location selected (select at least one country or city)" });
                if (aud.locationIds.length > 1 && aud.languages.length === 0) issues.push({ message: "Multi-country requires language" });
                if (aud.ageMin >= aud.ageMax) issues.push({ message: "Invalid age range" });
                return issues;
              })()}
              cityCount={(aud.cities ?? []).length}
              accent="primary"
            />

            <AudienceReadinessChecklist checks={readinessChecks} accent="primary" />

            {/* ---- Targeting Summary (shared) ---- */}
            <TargetingSummaryCard
              title="Targeting Summary"
              accent="primary"
              rows={[
                {
                  label: "Location",
                  value: (
                    <>
                      {aud.locationIds.length > 0
                        ? aud.locationIds.map((c) => getCountryByCode(c)?.name ?? c).join(", ")
                        : "None"}
                      {(aud.cities ?? []).length > 0 && (
                        <span className="text-muted-foreground"> + {(aud.cities ?? []).length} cities</span>
                      )}
                    </>
                  ),
                },
                { label: "Gender", value: aud.gender === "GENDER_UNLIMITED" ? "All" : aud.gender === "GENDER_MALE" ? "Male" : "Female" },
                { label: "Age", value: `${aud.ageMin} - ${aud.ageMax === 55 ? "55+" : aud.ageMax}` },
                { label: "Languages", value: aud.languages.length > 0 ? aud.languages.map((l) => SUPPORTED_LANGUAGES.find((x) => x.code === l)?.label || l).join(", ") : "All" },
                { label: "Interests", value: aud.interests.length > 0 ? `${aud.interests.length} selected` : "All" },
                { label: "Devices", value: aud.operatingSystems.length === 2 ? "All" : aud.operatingSystems.join(", ") || "All" },
                ...(aud.excludeRecentPurchasers ? [{ label: "Exclude buyers", value: `Last ${aud.excludeRecentPurchasersDays}d`, highlight: true }] : []),
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
