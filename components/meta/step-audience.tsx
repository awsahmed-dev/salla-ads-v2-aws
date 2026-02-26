"use client";

import { useState } from "react";
import { useMetaCampaign } from "@/lib/meta/campaign-context";
import { META_OBJECTIVE_CONFIGS } from "@/lib/meta/campaign-types";
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
import { InfoTip } from "@/components/shared/info-tip";
import { minMaxToAgeBands, ageBandsToMinMax, SUPPORTED_LANGUAGES } from "@/lib/demographics";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Target,
  ChevronDown,
  Store,
  X,
  Sparkles,
  Search,
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

const BEHAVIORS = [
  { id: "BEHAV_1", label: "Engaged Shoppers" },
  { id: "BEHAV_2", label: "Frequent Travelers" },
  { id: "BEHAV_3", label: "Small Business Owners" },
  { id: "BEHAV_4", label: "Technology Early Adopters" },
  { id: "BEHAV_5", label: "Mobile Payment Users" },
  { id: "BEHAV_6", label: "Anniversary within 30 days" },
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
  const [behaviorSearch, setBehaviorSearch] = useState("");

  const toggleInArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  /* Readiness checks */
  const readinessChecks = [
    { label: "At least 1 country selected", done: aud.countries.length > 0 },
    { label: "Language set", done: aud.languages.length > 0 },
    { label: "Age range configured", done: aud.ageMin >= 18 && aud.ageMax > aud.ageMin },
    { label: "Multi-country requires language", done: aud.countries.length <= 1 || aud.languages.length > 0 },
  ];
  const allReady = readinessChecks.every((c) => c.done);
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
              Define who sees your ads on Facebook and Instagram by location, demographics, and interests.
            </p>
          </div>

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
              tooltipText="Choose countries and/or cities where your ads will be shown on Facebook and Instagram. Maps to API geo_locations.countries and geo_locations.cities."
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
            headerTooltip="Define who sees your ads by gender, age, and language. Maps to API genders, age_min, age_max, locales."
          />

          {/* ---- 3. Interest Targeting (unified) ---- */}
          <InterestTargetingCard
            options={INTERESTS}
            value={aud.interests}
            onChange={(ids) => updateNested("audience", { interests: ids })}
            accent="meta"
            title="Interest Targeting"
            infoTipText="Maps to API flexible_spec.interests. Select interests to narrow your audience."
            apiBadge="flexible_spec"
          />

          {/* ---- 4. Salla Smart Features (shared) —— before Behavior so "my store" settings come first ---- */}
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

          {/* ---- 5. Behavior Targeting (Meta-specific) ---- */}
          <SectionCard>
            <div className="mb-3 flex items-center gap-2">
              <Target className="size-4 text-[#1877F2]" />
              <Label className="text-sm font-semibold text-foreground">Behavior Targeting</Label>
              <InfoTip text="Maps to API flexible_spec.behaviors. Target people based on purchase behavior, device usage, travel, and more." />
              <Badge variant="secondary" className="ml-auto rounded-full px-1.5 py-0 text-[10px]">
                behaviors
              </Badge>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Optional -- target users by real-world purchase and activity data unique to Meta.
            </p>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search behaviors..."
                value={behaviorSearch}
                onChange={(e) => setBehaviorSearch(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>

            {aud.behaviors.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {aud.behaviors.map((id) => (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="cursor-pointer gap-1 text-xs"
                    onClick={() =>
                      updateNested("audience", { behaviors: aud.behaviors.filter((x) => x !== id) })
                    }
                  >
                    {BEHAVIORS.find((b) => b.id === id)?.label}
                    <X className="size-2.5" />
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {BEHAVIORS
                .filter((b) => !behaviorSearch || b.label.toLowerCase().includes(behaviorSearch.toLowerCase()))
                .map((behavior) => {
                  const selected = aud.behaviors.includes(behavior.id);
                  return (
                    <button
                      key={behavior.id}
                      type="button"
                      onClick={() =>
                        updateNested("audience", {
                          behaviors: toggleInArray(aud.behaviors, behavior.id),
                        })
                      }
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        selected
                          ? "border-[#1877F2] bg-[#1877F2] text-white"
                          : "border-border bg-background text-foreground hover:border-[#1877F2]/40"
                      )}
                    >
                      {behavior.label}
                    </button>
                  );
                })}
            </div>

            {aud.behaviors.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {aud.behaviors.length} behavior{aud.behaviors.length !== 1 ? "s" : ""} selected.{" "}
                <button
                  type="button"
                  onClick={() => updateNested("audience", { behaviors: [] })}
                  className="text-[#1877F2] underline"
                >
                  Clear all
                </button>
              </p>
            )}
          </SectionCard>

          {/* ---- 6. Advanced Targeting (collapsible) ---- */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-[#1877F2]/40 hover:text-foreground"
            >
              <ChevronDown className={cn("size-4 transition-transform", showAdvanced && "rotate-180")} />
              Advanced Settings
              <span className="ml-auto text-xs text-muted-foreground">Custom audiences, devices, Advantage+</span>
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
                  infoTipText="Include or exclude specific groups. Maps to API custom_audiences and excluded_custom_audiences."
                />

                {/* Device Targeting (unified) */}
                <DeviceTargetingCard
                  value={aud.operatingSystems}
                  onChange={(ids) =>
                    updateNested("audience", { operatingSystems: ids })
                  }
                  accent="meta"
                  infoTipText="Choose which devices to target. Maps to API user_os. Both selected is recommended for maximum reach."
                  apiBadge="user_os"
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

            {/* Reach in selected locations (shared, location-only) */}
            <LocationReachCard
              countryCount={aud.countries.length}
              countries={aud.countries}
              cityCount={aud.cities.length}
              accent="meta"
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
                { label: "Behaviors", value: aud.behaviors.length > 0 ? `${aud.behaviors.length} selected` : "None" },
                { label: "Devices", value: aud.operatingSystems.length === 2 ? "All" : aud.operatingSystems.join(", ") || "None" },
                { label: "Advantage+", value: aud.advantagePlusAudience ? "On" : "Off" },
                ...(aud.excludeRecentPurchasers ? [{ label: "Exclude Buyers", value: `${aud.excludeRecentPurchasersDays}d` }] : []),
                ...(aud.autoTargetingEnabled ? [{ label: "Lookalike", value: aud.sallaAudienceCategory || "All buyers" }] : []),
              ]}
            />

            {/* Salla Tip (Meta-specific) */}
            <div className="rounded-xl border border-[#1877F2]/20 bg-[#1877F2]/5 p-4">
              <div className="flex items-start gap-2">
                <Store className="mt-0.5 size-4 shrink-0 text-[#1877F2]" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Salla Tip</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    For Sales campaigns, start with <span className="font-medium text-foreground">Engaged Shoppers</span> behavior + <span className="font-medium text-foreground">Online Shopping</span> interest in your primary country. Enable Advantage+ to let Meta find more converters.
                  </p>
                </div>
              </div>
            </div>
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
