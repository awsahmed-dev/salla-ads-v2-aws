"use client";

import { useState } from "react";
import { useDV360Campaign } from "@/lib/dv360/campaign-context";
import { DV360_OBJECTIVE_CONFIGS, type DV360AgeRange, type DV360Gender, type DV360ParentalStatus, type DV360HouseholdIncome, type DV360InventorySource, type DV360DeviceType, type DV360FrequencyTimeUnit } from "@/lib/dv360/campaign-types";
import { cn } from "@/lib/utils";
import { getCountryByCode, getCityById } from "@/lib/locations";
import { LocationSelector } from "@/components/shared/location-selector";
import { LocationReachCard } from "@/components/shared/location-reach-card";
import { LocationMapPreview } from "@/components/shared/location-map-preview";
import { DeliveryCheckCard } from "@/components/shared/delivery-check-card";
import { DemographicsCard } from "@/components/shared/demographics-card";
import { SallaSmartFeaturesCard } from "@/components/shared/salla-smart-features-card";
import { LegacyInterestTargetingCard as InterestTargetingCard } from "@/components/shared/interest-targeting-card";
import { TargetingSummaryCard } from "@/components/shared/targeting-summary-card";
import { AudienceReadinessChecklist } from "@/components/shared/audience-readiness-checklist";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
import { SUPPORTED_LANGUAGES } from "@/lib/demographics";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MapPin,
  Users,
  Target,
  Globe,
  ShieldCheck,
  X,
  Plus,
  Tag,
  Heart,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  Tv,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Radio,
  PlayCircle,
} from "lucide-react";

/* ================================================================== */
/*  Static data                                                       */
/* ================================================================== */

const PARENTAL_OPTIONS: { value: DV360ParentalStatus; label: string }[] = [
  { value: "PARENT", label: "Parent" },
  { value: "NOT_A_PARENT", label: "Not a parent" },
  { value: "UNKNOWN", label: "Unknown" },
];

const INCOME_OPTIONS: { value: DV360HouseholdIncome; label: string }[] = [
  { value: "TOP_10", label: "Top 10%" },
  { value: "11_20", label: "11-20%" },
  { value: "21_30", label: "21-30%" },
  { value: "31_40", label: "31-40%" },
  { value: "41_50", label: "41-50%" },
  { value: "LOWER_50", label: "Lower 50%" },
  { value: "UNKNOWN", label: "Unknown" },
];

const INVENTORY_OPTIONS: { value: DV360InventorySource; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "YOUTUBE", label: "YouTube", desc: "In-stream, in-feed, Shorts, and masthead placements", icon: <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.76 31.76 0 0 0 0 12a31.76 31.76 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.76 31.76 0 0 0 24 12a31.76 31.76 0 0 0-.5-5.81ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" /></svg> },
  { value: "GOOGLE_TV", label: "Google TV", desc: "Connected TV ads on Google TV devices", icon: <Tv className="size-4" /> },
  { value: "VIDEO_PARTNERS", label: "Video Partners", desc: "Premium video sites and apps in Google's network", icon: <Globe className="size-4" /> },
];

const DEVICE_OPTIONS: { value: DV360DeviceType; label: string; icon: React.ReactNode }[] = [
  { value: "DESKTOP", label: "Desktop", icon: <Monitor className="size-4" /> },
  { value: "MOBILE", label: "Mobile", icon: <Smartphone className="size-4" /> },
  { value: "TABLET", label: "Tablet", icon: <Tablet className="size-4" /> },
  { value: "CONNECTED_TV", label: "Connected TV", icon: <Tv className="size-4" /> },
];

const IN_MARKET_SEGMENTS = [
  { id: "IM_1", label: "Apparel & Accessories" },
  { id: "IM_2", label: "Beauty & Personal Care" },
  { id: "IM_3", label: "Consumer Electronics" },
  { id: "IM_4", label: "Home & Garden" },
  { id: "IM_5", label: "Food & Groceries" },
  { id: "IM_6", label: "Sports & Fitness" },
  { id: "IM_7", label: "Baby & Children Products" },
  { id: "IM_8", label: "Jewelry & Watches" },
  { id: "IM_9", label: "Health & Wellness" },
  { id: "IM_10", label: "Automotive" },
];

const AFFINITY_SEGMENTS = [
  { id: "AF_1", label: "Shoppers / Value Shoppers" },
  { id: "AF_2", label: "Fashionistas" },
  { id: "AF_3", label: "Beauty Mavens" },
  { id: "AF_4", label: "Tech Enthusiasts" },
  { id: "AF_5", label: "Cooking Enthusiasts" },
  { id: "AF_6", label: "Health & Fitness Buffs" },
  { id: "AF_7", label: "Home Decor Enthusiasts" },
  { id: "AF_8", label: "Social Media Enthusiasts" },
  { id: "AF_9", label: "Luxury Shoppers" },
  { id: "AF_10", label: "Family-Focused" },
];

/* ================================================================== */
/*  Helpers                                                           */
/* ================================================================== */

/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */

export function DV360StepAudience() {
  const { campaign, setStep, updateNested } = useDV360Campaign();
  const audience = campaign.audience;
  const obj = campaign.objective;
  const config = DV360_OBJECTIVE_CONFIGS[obj.objective];
  const isAwareness = obj.objective === "AWARENESS";
  const isConsideration = obj.objective === "CONSIDERATION";
  const isConversion = obj.objective === "CONVERSION";
  const isPerformance = obj.objective === "PERFORMANCE";

  const [showDemographics, setShowDemographics] = useState(true);
  const [showInterests, setShowInterests] = useState(true);
  const [showKeywords, setShowKeywords] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newExcludeKeyword, setNewExcludeKeyword] = useState("");
  /* Helpers */
  const toggleArrayItem = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const addKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed || audience.keywords.includes(trimmed)) return;
    updateNested("audience", { keywords: [...audience.keywords, trimmed] });
    setNewKeyword("");
  };

  const addExcludeKeyword = () => {
    const trimmed = newExcludeKeyword.trim();
    if (!trimmed || audience.excludeKeywords.includes(trimmed)) return;
    updateNested("audience", { excludeKeywords: [...audience.excludeKeywords, trimmed] });
    setNewExcludeKeyword("");
  };

  const countryCount = audience.geoTargets.filter((g) => g.type === "country").length;
  const readinessChecks = [
    { label: "At least 1 location selected", done: audience.geoTargets.length > 0 },
    { label: "Language set", done: audience.languages.length > 0 },
    { label: "Age range configured", done: audience.ageRanges.length > 0 },
    { label: "Gender selected", done: audience.genders.length > 0 },
    {
      label: "Multi-country requires language",
      done: countryCount <= 1 || audience.languages.length > 0,
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex gap-8", WIZARD_FOOTER_PADDING_BOTTOM)}>
        {/* ============ MAIN CONTENT ============ */}
        <div className="min-w-0 flex-1">
          {/* Step header: title + description (align with other platforms) */}
          <div className="mb-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {config.label}: {isAwareness ? "Audience & Reach" : isConsideration ? "Audience & Interests" : isConversion ? "Audience & Conversions" : isPerformance ? "Audience & Signals" : "Audience & Targeting"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Define who sees your YouTube ads by location, demographics, and interests. Maps to DV360 targeting on the Line Item.
            </p>
          </div>

          <div className="flex flex-col gap-5">

            {/* ---- 1. Geographic Targeting (shared LocationSelector — countries + cities, maps to TARGETING_TYPE_GEO_REGION) ---- */}
            <SectionCard>
              <LocationSelector
                value={{
                  countryCodes: audience.geoTargets.filter((g) => g.type === "country").map((g) => g.id),
                  regions: [],
                  cities: audience.geoTargets
                    .filter((g) => g.type === "city")
                    .map((g) => {
                      const c = getCityById(g.id);
                      return c
                        ? {
                            id: c.id,
                            name: c.name,
                            countryCode: c.countryCode,
                            lat: c.lat,
                            lng: c.lng,
                            radiusKm: g.radiusKm ?? c.radiusKm,
                          }
                        : null;
                    })
                    .filter((c): c is NonNullable<typeof c> => c != null),
                }}
                onChange={(next) => {
                  updateNested("audience", {
                    geoTargets: [
                      ...next.countryCodes.map((code) => ({
                        id: code,
                        name: getCountryByCode(code)?.name ?? code,
                        type: "country" as const,
                      })),
                      ...next.cities.map((c) => ({
                        id: c.id,
                        name: c.name,
                        type: "city" as const,
                        radiusKm: c.radiusKm,
                      })),
                    ],
                  });
                }}
                enableCityTargeting
                enableRadiusPerCity
                accent="dv360"
                label="Geographic Targeting"
                tooltipText="Maps to TARGETING_TYPE_GEO_REGION. Choose countries and/or cities where your ads will be shown."
              />

              {/* ---- Map Preview ---- */}
              <LocationMapPreview
                countryCodes={audience.geoTargets.filter((g) => g.type === "country").map((g) => g.id)}
                cities={audience.geoTargets
                  .filter((g) => g.type === "city")
                  .map((g) => {
                    const meta = getCityById(g.id);
                    return {
                      id: g.id,
                      name: g.name,
                      countryCode: meta?.countryCode ?? "",
                      lat: meta?.lat ?? 0,
                      lng: meta?.lng ?? 0,
                      radiusKm: g.radiusKm ?? 0,
                    };
                  })}
              />
            </SectionCard>

            {/* ---- 2. Demographics (shared: English/Arabic, Male/Female, age bands) ---- */}
            <DemographicsCard
              languageCodes={audience.languages.map((l) => l.id)}
              onLanguagesChange={(codes) =>
                updateNested("audience", {
                  languages: codes.map((code) => ({
                    id: code,
                    name: SUPPORTED_LANGUAGES.find((x) => x.code === code)?.label ?? code,
                  })),
                })
              }
              genderIds={audience.genders.filter((g) => g === "MALE" || g === "FEMALE")}
              onGendersChange={(ids) => updateNested("audience", { genders: ids as ("MALE" | "FEMALE")[] })}
              ageBandValues={audience.ageRanges.filter((v) => v !== "UNKNOWN")}
              onAgeBandsChange={(bands) => updateNested("audience", { ageRanges: bands as typeof audience.ageRanges })}
              accent="dv360"
              languageRequired={audience.geoTargets.filter((g) => g.type === "country").length > 1}
              headerTooltip="Define who sees your ads by gender, age, and language. Maps to TARGETING_TYPE_LANGUAGE, TARGETING_TYPE_GENDER, TARGETING_TYPE_AGE_RANGE."
            />

            {/* ---- 3. Salla Smart Features (shared) —— right after Demographics to match other platforms ---- */}
            <SallaSmartFeaturesCard
              excludeRecentPurchasers={audience.excludeRecentPurchasers}
              onExcludeRecentPurchasersChange={(v) =>
                updateNested("audience", { excludeRecentPurchasers: v })
              }
              excludeRecentPurchasersDays={audience.excludeRecentPurchasersDays}
              onExcludeRecentPurchasersDaysChange={(days) =>
                updateNested("audience", { excludeRecentPurchasersDays: days })
              }
              lookalikeEnabled={audience.sallaLookalikeEnabled}
              onLookalikeEnabledChange={(v) =>
                updateNested("audience", { sallaLookalikeEnabled: v })
              }
              sallaAudienceCategory={audience.sallaAudienceCategory}
              onSallaAudienceCategoryChange={(v) =>
                updateNested("audience", { sallaAudienceCategory: v })
              }
              accent="dv360"
            />

            {/* ---- 4. Additional targeting (DV360): Parental status, Household income ---- */}
            <SectionCard>
              <button type="button" onClick={() => setShowDemographics(!showDemographics)} className="mb-3 flex w-full items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-600/10">
                  <Target className="size-4 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <Label className="text-sm font-semibold text-foreground">Additional targeting</Label>
                  <p className="text-[11px] text-muted-foreground">Parental status, household income (DV360)</p>
                </div>
                {showDemographics ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
              </button>

              {showDemographics && (
                <div className="flex flex-col gap-4">
                  <div>
                    <Label className="mb-2 text-xs font-semibold text-foreground">Parental Status <InfoTip text="Maps to TARGETING_TYPE_PARENTAL_STATUS." /></Label>
                    <div className="flex flex-wrap gap-1.5">
                      {PARENTAL_OPTIONS.map((p) => {
                        const isSelected = audience.parentalStatuses.includes(p.value);
                        return (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => updateNested("audience", { parentalStatuses: toggleArrayItem(audience.parentalStatuses, p.value) })}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                              isSelected ? "border-red-600 bg-red-600/10 text-red-600" : "border-border bg-background text-foreground hover:border-red-400"
                            )}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 text-xs font-semibold text-foreground">Household Income <InfoTip text="Maps to TARGETING_TYPE_HOUSEHOLD_INCOME. Available in select markets." /></Label>
                    <div className="flex flex-wrap gap-1.5">
                      {INCOME_OPTIONS.map((inc) => {
                        const isSelected = audience.householdIncomes.includes(inc.value);
                        return (
                          <button
                            key={inc.value}
                            type="button"
                            onClick={() => updateNested("audience", { householdIncomes: toggleArrayItem(audience.householdIncomes, inc.value) })}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                              isSelected ? "border-red-600 bg-red-600/10 text-red-600" : "border-border bg-background text-foreground hover:border-red-400"
                            )}
                          >
                            {inc.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ---- 5. Audience Segments (Interests) ---- */}
            <SectionCard>
              <button type="button" onClick={() => setShowInterests(!showInterests)} className="mb-3 flex w-full items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-600/10">
                  <Heart className="size-4 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <Label className="text-sm font-semibold text-foreground">Audience Segments</Label>
                  <p className="text-[11px] text-muted-foreground">In-Market, Affinity, and Custom audiences</p>
                </div>
                <Badge variant="secondary" className="rounded-full text-[10px]">{audience.interests.length} selected</Badge>
                {showInterests ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
              </button>

              {showInterests && (
                <div className="flex flex-col gap-4">
                  {/* In-Market (unified) */}
                  <InterestTargetingCard
                    options={IN_MARKET_SEGMENTS}
                    value={audience.interests.filter((i) => i.type === "IN_MARKET").map((i) => i.id)}
                    onChange={(ids) =>
                      updateNested("audience", {
                        interests: [
                          ...audience.interests.filter((i) => i.type !== "IN_MARKET"),
                          ...ids.map((id) => ({
                            id,
                            name: IN_MARKET_SEGMENTS.find((s) => s.id === id)!.label,
                            type: "IN_MARKET" as const,
                          })),
                        ],
                      })
                    }
                    sectionLabel="In-Market Audiences"
                    accent="dv360"
                    searchPlaceholder="Search in-market..."
                    showClearAll={false}
                  />

                  {/* Affinity (unified) */}
                  <InterestTargetingCard
                    options={AFFINITY_SEGMENTS}
                    value={audience.interests.filter((i) => i.type === "AFFINITY").map((i) => i.id)}
                    onChange={(ids) =>
                      updateNested("audience", {
                        interests: [
                          ...audience.interests.filter((i) => i.type !== "AFFINITY"),
                          ...ids.map((id) => ({
                            id,
                            name: AFFINITY_SEGMENTS.find((s) => s.id === id)!.label,
                            type: "AFFINITY" as const,
                          })),
                        ],
                      })
                    }
                    sectionLabel="Affinity Audiences"
                    accent="dv360"
                    searchPlaceholder="Search affinity..."
                    showClearAll={false}
                  />
                </div>
              )}
            </SectionCard>

            {/* ---- 6. Keyword Targeting ---- */}
            <SectionCard>
              <button type="button" onClick={() => setShowKeywords(!showKeywords)} className="mb-3 flex w-full items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-600/10">
                  <Target className="size-4 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <Label className="text-sm font-semibold text-foreground">Keyword Targeting</Label>
                  <p className="text-[11px] text-muted-foreground">Target/exclude based on video content keywords</p>
                </div>
                <Badge variant="secondary" className="rounded-full text-[10px]">{audience.keywords.length + audience.excludeKeywords.length}</Badge>
                {showKeywords ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
              </button>

              {showKeywords && (
                <div className="flex flex-col gap-4">
                  {/* Positive keywords */}
                  <div>
                    <Label className="mb-1.5 text-xs font-semibold text-foreground">
                      Target Keywords <InfoTip text="Show ads alongside YouTube videos matching these keywords. Maps to TARGETING_TYPE_KEYWORD." />
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                        placeholder="Add keyword..."
                        className="h-8 flex-1 text-xs"
                      />
                      <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={addKeyword}>
                        <Plus className="size-3" />
                      </Button>
                    </div>
                    {audience.keywords.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {audience.keywords.map((kw, i) => (
                          <Badge key={i} variant="secondary" className="gap-1 rounded-full px-2 py-0.5 text-[10px]">
                            {kw}
                            <button type="button" onClick={() => updateNested("audience", { keywords: audience.keywords.filter((_, idx) => idx !== i) })}>
                              <X className="size-2.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Negative keywords */}
                  <div>
                    <Label className="mb-1.5 text-xs font-semibold text-foreground">
                      <ShieldCheck className="mr-1 inline size-3 text-red-600" />
                      Exclude Keywords <InfoTip text="Prevent ads from showing alongside videos matching these keywords. Maps to TARGETING_TYPE_NEGATIVE_KEYWORD_LIST." />
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newExcludeKeyword}
                        onChange={(e) => setNewExcludeKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExcludeKeyword())}
                        placeholder="Add excluded keyword..."
                        className="h-8 flex-1 text-xs"
                      />
                      <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={addExcludeKeyword}>
                        <Plus className="size-3" />
                      </Button>
                    </div>
                    {audience.excludeKeywords.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {audience.excludeKeywords.map((kw, i) => (
                          <Badge key={i} variant="secondary" className="gap-1 rounded-full border-red-200 bg-red-50 px-2 py-0.5 text-[10px] text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
                            {kw}
                            <button type="button" onClick={() => updateNested("audience", { excludeKeywords: audience.excludeKeywords.filter((_, idx) => idx !== i) })}>
                              <X className="size-2.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </SectionCard>


            {/* ---- 8. Device Targeting ---- */}
            <SectionCard>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-600/10">
                  <Monitor className="size-4 text-red-600" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">Device Targeting</Label>
                  <p className="text-[11px] text-muted-foreground">Maps to <code className="rounded bg-muted px-1 text-[10px]">TARGETING_TYPE_DEVICE_TYPE</code></p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {DEVICE_OPTIONS.map((dev) => {
                  const isSelected = audience.deviceTypes.includes(dev.value);
                  return (
                    <button
                      key={dev.value}
                      type="button"
                      onClick={() => updateNested("audience", { deviceTypes: toggleArrayItem(audience.deviceTypes, dev.value) as DV360DeviceType[] })}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all",
                        isSelected ? "border-red-600 bg-red-600/[0.04]" : "border-border bg-background hover:border-red-400"
                      )}
                    >
                      <div className={cn("text-foreground", isSelected && "text-red-600")}>{dev.icon}</div>
                      <span className={cn("text-[10px] font-medium", isSelected ? "text-red-600" : "text-foreground")}>{dev.label}</span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* ---- Target Frequency (Awareness only) ---- */}
            {isAwareness && (
              <SectionCard className="border-red-200/50 bg-red-50/30 dark:border-red-800/30 dark:bg-red-950/10">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-red-600/10">
                    <Eye className="size-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-foreground">Target Frequency</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Set how often each user sees your ad. Maps to <code className="rounded bg-muted px-1 text-[10px]">youtubeAndPartnersSettings.targetFrequency</code>
                    </p>
                  </div>
                  <Switch
                    checked={audience.targetFrequency.enabled}
                    onCheckedChange={(checked) => updateNested("audience", { targetFrequency: { ...audience.targetFrequency, enabled: checked } })}
                  />
                </div>

                {audience.targetFrequency.enabled && (
                  <div className="flex items-center gap-3">
                    <Label className="shrink-0 text-xs text-foreground">Show ad</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={audience.targetFrequency.maxImpressions}
                      onChange={(e) => updateNested("audience", { targetFrequency: { ...audience.targetFrequency, maxImpressions: parseInt(e.target.value) || 1 } })}
                      className="h-8 w-20 text-center text-xs"
                    />
                    <Label className="shrink-0 text-xs text-foreground">times per</Label>
                    <Select
                      value={audience.targetFrequency.timeUnit}
                      onValueChange={(v) => updateNested("audience", { targetFrequency: { ...audience.targetFrequency, timeUnit: v as DV360FrequencyTimeUnit } })}
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TIME_UNIT_DAYS">Day</SelectItem>
                        <SelectItem value="TIME_UNIT_WEEKS">Week</SelectItem>
                        <SelectItem value="TIME_UNIT_MONTHS">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </SectionCard>
            )}

            {/* ---- Consideration: View Engagement Optimization ---- */}
            {isConsideration && (
              <SectionCard className="border-blue-200/50 bg-blue-50/30 dark:border-blue-800/30 dark:bg-blue-950/10">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <PlayCircle className="size-4 text-blue-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">View Engagement Optimization</Label>
                    <p className="text-[11px] text-muted-foreground">
                      DV360 optimizes delivery towards users most likely to watch and engage with your video ads.
                    </p>
                  </div>
                  <InfoTip text="For Consideration campaigns, DV360 uses view-through rate (VTR) and video completion signals to identify high-engagement users. This maps to the youtubeAndPartnersSettings with LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_VIEW." />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "View-Through Rate (VTR)", desc: "Optimize towards users who watch at least 30 seconds or the full ad (whichever is shorter)", active: true },
                    { label: "Video Completion Rate", desc: "Target users most likely to watch your entire video ad to completion", active: true },
                    { label: "In-Feed Discovery", desc: "Show ads in YouTube search results and home feed to users browsing for content", active: audience.inventorySources.includes("YOUTUBE") },
                    { label: "Shorts Engagement", desc: "Reach users in the YouTube Shorts feed with vertical video ads", active: audience.inventorySources.includes("YOUTUBE") },
                  ].map((item) => (
                    <div key={item.label} className={cn("rounded-lg border px-3 py-2.5", item.active ? "border-blue-200 bg-background dark:border-blue-800/40" : "border-border bg-muted/50 opacity-60")}>
                      <div className="flex items-center gap-1.5">
                        <div className={cn("size-1.5 rounded-full", item.active ? "bg-blue-500" : "bg-muted-foreground/30")} />
                        <p className="text-[11px] font-semibold text-foreground">{item.label}</p>
                      </div>
                      <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-[10px] text-muted-foreground">
                  <span className="font-semibold text-blue-600">Tip:</span> Combine In-Market audiences with In-Feed placement to reach users actively researching products similar to yours. This drives consideration at the moment of intent.
                </p>
              </SectionCard>
            )}

            {/* ---- Consideration: Custom Intent Audiences ---- */}
            {isConsideration && (
              <SectionCard>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Target className="size-4 text-purple-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Custom Intent Keywords</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Reach people who recently searched for these terms on Google. Maps to <code className="rounded bg-muted px-1 text-[10px]">TARGETING_TYPE_KEYWORD</code> with custom intent.
                    </p>
                  </div>
                  <InfoTip text="Custom intent audiences target users based on their recent Google search activity. For Consideration campaigns, these help reach users in the research phase -- before they've decided what to buy." />
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newKeyword.trim()) {
                        e.preventDefault();
                        if (!audience.keywords.includes(newKeyword.trim())) {
                          updateNested("audience", { keywords: [...audience.keywords, newKeyword.trim()] });
                        }
                        setNewKeyword("");
                      }
                    }}
                    placeholder="e.g., best wireless headphones, organic skincare"
                    className="h-8 flex-1 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px]"
                    onClick={() => {
                      if (newKeyword.trim() && !audience.keywords.includes(newKeyword.trim())) {
                        updateNested("audience", { keywords: [...audience.keywords, newKeyword.trim()] });
                        setNewKeyword("");
                      }
                    }}
                  >
                    <Plus className="mr-1 size-3" /> Add
                  </Button>
                </div>

                {audience.keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {audience.keywords.map((kw, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1 rounded-full px-2 py-0.5 text-[10px]">
                        {kw}
                        <button type="button" onClick={() => updateNested("audience", { keywords: audience.keywords.filter((_: string, i: number) => i !== idx) })}>
                          <X className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-3 rounded-lg bg-purple-50/50 px-3 py-2 dark:bg-purple-950/10">
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-semibold text-purple-600">Best practice:</span> Add 10-15 keywords related to your product category. DV360 will find users who searched for these terms in the last 7 days and serve your video ads to them in YouTube.
                  </p>
                </div>
              </SectionCard>
            )}

            {/* ---- Conversion: Action Optimization ---- */}
            {isConversion && (
              <SectionCard className="border-emerald-200/50 bg-emerald-50/30 dark:border-emerald-800/30 dark:bg-emerald-950/10">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Target className="size-4 text-emerald-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Conversion Optimization</Label>
                    <p className="text-[11px] text-muted-foreground">
                      DV360 optimizes delivery towards users most likely to complete your desired action (purchase, sign-up, lead).
                    </p>
                  </div>
                  <InfoTip text="For Conversion campaigns, DV360 uses Floodlight conversion signals and machine learning to identify high-intent users. This maps to LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_ACTION with Maximize Conversions or Target CPA bidding." />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Maximize Conversions", desc: "DV360 AI automatically bids to get the most conversions within your budget", active: true },
                    { label: "Target CPA Bidding", desc: "Set a target cost-per-action and DV360 optimizes bids to achieve it", active: true },
                    { label: "Floodlight Signals", desc: "Uses your Floodlight activity data to find users with similar conversion patterns", active: true },
                    { label: "Cross-Device Tracking", desc: "Track conversions across devices when users see ads on mobile but convert on desktop", active: true },
                  ].map((item) => (
                    <div key={item.label} className={cn("rounded-lg border px-3 py-2.5", item.active ? "border-emerald-200 bg-background dark:border-emerald-800/40" : "border-border bg-muted/50 opacity-60")}>
                      <div className="flex items-center gap-1.5">
                        <div className={cn("size-1.5 rounded-full", item.active ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                        <p className="text-[11px] font-semibold text-foreground">{item.label}</p>
                      </div>
                      <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-[10px] text-muted-foreground">
                  <span className="font-semibold text-emerald-600">Tip:</span> Combine In-Market audiences with Optimized Targeting enabled to let DV360 find users most likely to convert. Ensure your Floodlight tag is firing on the conversion page for best results.
                </p>
              </SectionCard>
            )}

            {/* ---- Conversion: Custom Intent Audiences ---- */}
            {isConversion && (
              <SectionCard>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Tag className="size-4 text-amber-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Custom Intent Keywords</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Reach people who recently searched for these terms on Google. Maps to <code className="rounded bg-muted px-1 text-[10px]">TARGETING_TYPE_KEYWORD</code> with custom intent.
                    </p>
                  </div>
                  <InfoTip text="Custom intent audiences target users based on their recent Google search activity. For Conversion campaigns, focus on high-intent, purchase-ready keywords like 'buy [product]' or '[product] price'." />
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newKeyword.trim()) {
                        e.preventDefault();
                        if (!audience.keywords.includes(newKeyword.trim())) {
                          updateNested("audience", { keywords: [...audience.keywords, newKeyword.trim()] });
                        }
                        setNewKeyword("");
                      }
                    }}
                    placeholder="e.g., buy perfume online, best abaya price"
                    className="h-8 flex-1 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px]"
                    onClick={() => {
                      if (newKeyword.trim() && !audience.keywords.includes(newKeyword.trim())) {
                        updateNested("audience", { keywords: [...audience.keywords, newKeyword.trim()] });
                        setNewKeyword("");
                      }
                    }}
                  >
                    <Plus className="mr-1 size-3" /> Add
                  </Button>
                </div>

                {audience.keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {audience.keywords.map((kw, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1 rounded-full px-2 py-0.5 text-[10px]">
                        {kw}
                        <button type="button" onClick={() => updateNested("audience", { keywords: audience.keywords.filter((_: string, i: number) => i !== idx) })}>
                          <X className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-3 rounded-lg bg-amber-50/50 px-3 py-2 dark:bg-amber-950/10">
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-semibold text-amber-600">Best practice:</span> Use high-intent, purchase-ready keywords like "buy [product]", "[product] price", "[product] delivery". DV360 will find users who searched for these terms and are ready to convert.
                  </p>
                </div>
              </SectionCard>
            )}

            {/* ---- Performance: AI Signal Optimization ---- */}
            {isPerformance && (
              <SectionCard className="border-orange-200/50 bg-orange-50/30 dark:border-orange-800/30 dark:bg-orange-950/10">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Sparkles className="size-4 text-orange-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">AI Signal Optimization</Label>
                    <p className="text-[11px] text-muted-foreground">
                      DV360 uses all available signals to find the highest-value converters across YouTube.
                    </p>
                  </div>
                  <InfoTip text="Performance campaigns use LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_SIMPLE which gives DV360 full AI control. Your audience selections serve as signals -- DV360 will expand beyond them automatically to find users with the highest conversion probability." />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Floodlight Signals", desc: "Conversion data from your Floodlight tag feeds the AI to find similar high-value users", active: true },
                    { label: "Multi-Format AI", desc: "DV360 tests all formats (In-Stream, Bumper, Shorts, In-Feed) and allocates budget to the best performers", active: true },
                    { label: "Cross-Device Graph", desc: "Track and optimize across mobile, desktop, tablet, and CTV for full-funnel attribution", active: true },
                    { label: "Audience Expansion", desc: "Your targeting acts as a signal -- AI automatically expands to find lookalikes with high purchase intent", active: true },
                  ].map((item) => (
                    <div key={item.label} className={cn("rounded-lg border px-3 py-2.5", item.active ? "border-orange-200 bg-background dark:border-orange-800/40" : "border-border bg-muted/50 opacity-60")}>
                      <div className="flex items-center gap-1.5">
                        <div className={cn("size-1.5 rounded-full", item.active ? "bg-orange-500" : "bg-muted-foreground/30")} />
                        <p className="text-[11px] font-semibold text-foreground">{item.label}</p>
                      </div>
                      <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-[10px] text-muted-foreground">
                  <span className="font-semibold text-orange-600">Key difference:</span> Unlike Conversion campaigns where you control the format, Performance gives DV360 full autonomy to choose the best format, placement, and bid for each impression. Provide diverse video assets for best results.
                </p>
              </SectionCard>
            )}

            {/* ---- Performance: Audience Signals ---- */}
            {isPerformance && (
              <SectionCard>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Target className="size-4 text-orange-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Audience Signals (Keywords)</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Add keyword signals to guide DV360 AI towards your ideal customer. These serve as <span className="font-medium">hints</span>, not strict targeting.
                    </p>
                  </div>
                  <InfoTip text="For Performance campaigns, keywords and interests act as signals for the AI. DV360 will use them as starting points but will expand far beyond them to maximize conversions. Add broad category terms and competitor brand names for best results." />
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newKeyword.trim()) {
                        e.preventDefault();
                        if (!audience.keywords.includes(newKeyword.trim())) {
                          updateNested("audience", { keywords: [...audience.keywords, newKeyword.trim()] });
                        }
                        setNewKeyword("");
                      }
                    }}
                    placeholder="e.g., online shopping, fashion brands, electronics deals"
                    className="h-8 flex-1 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px]"
                    onClick={() => {
                      if (newKeyword.trim() && !audience.keywords.includes(newKeyword.trim())) {
                        updateNested("audience", { keywords: [...audience.keywords, newKeyword.trim()] });
                        setNewKeyword("");
                      }
                    }}
                  >
                    <Plus className="mr-1 size-3" /> Add
                  </Button>
                </div>

                {audience.keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {audience.keywords.map((kw, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1 rounded-full px-2 py-0.5 text-[10px]">
                        {kw}
                        <button type="button" onClick={() => updateNested("audience", { keywords: audience.keywords.filter((_: string, i: number) => i !== idx) })}>
                          <X className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-3 rounded-lg bg-orange-50/50 px-3 py-2 dark:bg-orange-950/10">
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-semibold text-orange-600">Best practice:</span> Add broad signals like product categories, competitor names, and related interests. The AI will learn from your Floodlight data which signals matter most and optimize automatically.
                  </p>
                </div>
              </SectionCard>
            )}

            {/* ---- Optimized Targeting ---- */}
            <SectionCard>
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-600/10">
                  <Sparkles className="size-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-foreground">Optimized Targeting</Label>
                  <p className="text-[11px] text-muted-foreground">
                    {isConsideration
                      ? "Let DV360 AI expand beyond your selected audiences to find users most likely to engage with your video."
                      : isConversion
                        ? "Let DV360 AI expand beyond your selected audiences to find users most likely to convert. Strongly recommended for Conversion campaigns."
                        : isPerformance
                          ? "Always on for Performance. DV360 AI uses your audience as signals and expands aggressively to maximize conversions and ROAS."
                          : "Let DV360 AI expand beyond your selected audiences to find more conversions."} Maps to <code className="rounded bg-muted px-1 text-[10px]">targetingExpansion</code>.
                  </p>
                </div>
                <Switch
                  checked={audience.optimizedTargeting}
                  onCheckedChange={(checked) => updateNested("audience", { optimizedTargeting: checked })}
                />
              </div>
            </SectionCard>

          </div>
        </div>

        {/* ============ RIGHT SIDEBAR ============ */}
        <aside className="hidden w-[280px] shrink-0 flex-col gap-4 lg:flex">
          <div className="sticky top-20 flex flex-col gap-4">
            <LocationReachCard
              countryCount={audience.geoTargets.filter((g) => g.type === "country").length}
              countries={audience.geoTargets.filter((g) => g.type === "country").map((g) => g.id)}
              cityCount={audience.geoTargets.filter((g) => g.type === "city").length}
              accent="dv360"
            />

            <DeliveryCheckCard
              issues={(() => {
                const issues: { message: string }[] = [];
                if (audience.geoTargets.length === 0) issues.push({ message: "No location selected" });
                if (audience.languages.length === 0) issues.push({ message: "No language set" });
                if (audience.ageRanges.length === 0) issues.push({ message: "No age range selected" });
                if (audience.genders.length === 0) issues.push({ message: "No gender selected" });
                if (countryCount > 1 && audience.languages.length === 0) issues.push({ message: "Multi-country requires language" });
                return issues;
              })()}
              cityCount={audience.geoTargets.filter((g) => g.type === "city").length}
              accent="dv360"
            />

            <AudienceReadinessChecklist checks={readinessChecks} accent="dv360" />

            <TargetingSummaryCard
              title="Targeting Summary"
              accent="dv360"
              rows={[
                { label: "Locations", value: audience.geoTargets.length > 0 ? audience.geoTargets.map((g) => g.name).join(", ") : "Worldwide" },
                { label: "Languages", value: audience.languages.map((l) => l.name).join(", ") || "All" },
                { label: "Age Ranges", value: audience.ageRanges.length === 7 ? "All ages" : `${audience.ageRanges.length} selected` },
                { label: "Genders", value: audience.genders.length === 3 ? "All" : audience.genders.join(", ") },
                { label: "Interests", value: audience.interests.length ? String(audience.interests.length) : "None" },
                { label: "Keywords", value: audience.keywords.length + audience.excludeKeywords.length ? String(audience.keywords.length + audience.excludeKeywords.length) : "None" },
                { label: "Devices", value: audience.deviceTypes.length === 4 ? "All devices" : `${audience.deviceTypes.length} selected` },
                { label: "Optimized Targeting", value: audience.optimizedTargeting ? "On" : "Off", highlight: audience.optimizedTargeting },
                ...(isAwareness && audience.targetFrequency.enabled
                  ? [{ label: "Target Frequency", value: `${audience.targetFrequency.maxImpressions}x / ${audience.targetFrequency.timeUnit.replace("TIME_UNIT_", "").toLowerCase()}`, highlight: true }]
                  : []),
              ]}
            />
          </div>
        </aside>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(0)}
        onNext={() => setStep(2)}
        previousLabel="Back to Objective"
        nextLabel="Next"
        accent="dv360"
      />
    </TooltipProvider>
  );
}
