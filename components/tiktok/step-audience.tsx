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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Info,
  Sparkles,
  Search,
  ShoppingCart,
  X,
  Plus,
  AlertCircle,
  Users,
  Target,
} from "lucide-react";
import { getCountryByCode, getCityById } from "@/lib/locations";
import { LocationSelector } from "@/components/shared/location-selector";
import { LocationReachCard } from "@/components/shared/location-reach-card";
import { LocationMapPreview } from "@/components/shared/location-map-preview";
import { DeliveryCheckCard } from "@/components/shared/delivery-check-card";
import { DemographicsCard } from "@/components/shared/demographics-card";
import { SallaSmartFeaturesCard } from "@/components/shared/salla-smart-features-card";
import { CustomAudiencesCard } from "@/components/shared/custom-audiences-card";
import { DeviceTargetingCard } from "@/components/shared/device-targeting-card";
import { LegacyInterestTargetingCard as InterestTargetingCard } from "@/components/shared/interest-targeting-card";
import { AudienceSignalsPicker } from "@/components/tiktok/audience-signals-picker";
import { SearchKeywordsTable } from "@/components/tiktok/search-keywords-table";
import { TargetingSummaryCard } from "@/components/shared/targeting-summary-card";
import { AudienceReadinessChecklist } from "@/components/shared/audience-readiness-checklist";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { minMaxToAgeBands, ageBandsToMinMax, SUPPORTED_LANGUAGES } from "@/lib/demographics";
import { OBJECTIVE_CONFIGS } from "@/lib/tiktok/campaign-types";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
import {
  LearnMoreTrigger,
  LearnMoreSheet,
  SheetSection,
  SheetDecisionCard,
  useLearnMore,
} from "@/components/shared/learn-more-sheet";

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
  const [interestKeywordInput, setInterestKeywordInput] = useState("");
  const [purchaseIntentInput, setPurchaseIntentInput] = useState("");
  const sallaSmartLearnMore = useLearnMore();
  const customAudiencesLearnMore = useLearnMore();
  const keywordsLearnMore = useLearnMore();
  const isSales = campaign.objective.objective === "PRODUCT_SALES";
  // Smart+ targeting mode — when AUTO, hide everything except Location and
  // Language. TikTok's upgraded Smart+ uses your conversion signal + the
  // baseline location/language as the only inputs and finds the audience
  // itself. Custom = full manual controls (the classic flow).
  const sp = campaign.objective.smartPlus;
  // Search Ads mode replaces interest signals with merchant-typed keywords.
  // Demographics / Interests / Custom audiences all hide when ON because
  // Search targeting is intent-based, not demographic-based.
  const searchAdsOn = campaign.objective.searchAdsEnabled === true && isSales;

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
          {/* Smart+ status note — implicit ON for Sales / Lead Gen / App Promo.
              No toggle. Every field below shows by default with AI-recommended
              chips inline. This mirrors TikTok's 2026 unified experience. */}
          {sp.enabled && (isSales || isAppPromo || isLeadGen) && (
            <SectionCard>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#004956]">
                  <Sparkles className="size-4 text-[#a4ffe5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground">Audience targeting</p>
                    <Badge className="rounded-full bg-[#e6fff9] px-2 py-0 text-[10px] font-bold text-[#004956] hover:bg-[#e6fff9]">Smart+</Badge>
                    {searchAdsOn && (
                      <Badge className="rounded-full bg-amber-100 px-2 py-0 text-[10px] font-bold text-amber-800 hover:bg-amber-100">Search Ads mode</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {searchAdsOn
                      ? "Search Ads is on — targeting is driven by keywords below, not by interests or demographics. Smart+ still optimizes delivery within your keyword pool."
                      : "Smart+ optimizes delivery using your signals below. Every field has an AI-recommended default — fill what matters, leave the rest for TikTok to figure out."}
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ---- 1. Location (shared component — same UX as all platforms; maps to locationIds + cities) ---- */}
          <SectionCard>
            <LocationSelector
              value={{
                countryCodes: aud.locationIds,
                regions: [],
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

          {/* ---- Search Ads · keyword table (replaces interests + demographics when ON) ---- */}
          {searchAdsOn && (
            <SearchKeywordsTable
              keywords={campaign.objective.searchKeywords ?? []}
              onChange={(next) => updateNested("objective", { searchKeywords: next })}
            />
          )}

          {/* ---- 2. Demographics (always shown for non-Search; hidden in Search Ads mode) ---- */}
          {!searchAdsOn && (
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
          )}

          {/* ---- 3. Audience signals — unified picker. Replaces the old
              free-text Interest Keywords + Purchase Intent inputs and the
              separate Interest Categories card. Sources from TikTok's
              predefined catalog (mock today, real API later). Hidden in
              Search Ads mode — keywords replace interests there. ---- */}
          {!searchAdsOn && (
          <>
          <AudienceSignalsPicker
            interestCategoryIds={aud.interests}
            interestKeywordIds={aud.interestKeywordIds}
            shoppingIntentIds={aud.purchaseIntentKeywordIds}
            onChange={(next) => updateNested("audience", {
              interests: next.interestCategoryIds,
              interestKeywordIds: next.interestKeywordIds,
              purchaseIntentKeywordIds: next.shoppingIntentIds,
            })}
            storeCategory="FASHION" /* TODO: derive from Salla store profile when wired */
          />


          {/* ---- 6. Salla Smart Features (shared) ---- */}
          <SallaSmartFeaturesCard
            learnMoreTrigger={<LearnMoreTrigger {...sallaSmartLearnMore.triggerProps} />}
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
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-6 pb-3 pt-5 text-left transition-colors",
                  showAdvanced ? "bg-muted/50" : "border border-border bg-card hover:bg-muted/30"
                )}
              >
                <div>
                  <span className="text-base font-bold text-foreground">Advanced Settings</span>
                  <p className="mt-1 text-xs text-muted-foreground">Custom Audiences, Devices, Expansion</p>
                </div>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className={cn("flex flex-col gap-4 rounded-b-2xl px-2 pb-2", showAdvanced && "bg-muted/50")}>

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
                  learnMoreTrigger={<LearnMoreTrigger {...customAudiencesLearnMore.triggerProps} />}
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
                      <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5]/40 bg-[#e6fff9]/50 px-3 py-2.5">
                        <Info className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                        <p className="text-xs leading-relaxed text-[#004956]/80">
                          <span className="font-medium text-[#004956]">App Install campaigns</span> will automatically target users on <span className="font-medium text-[#004956]">{campaign.objective.appSettings.appPlatform === "APP_IOS" ? "iOS" : "Android"}</span> based on your app platform. You can still select both platforms, but installs will only come from the matching store.
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
                        <Sparkles className="size-4 text-[#004956]" />
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
            </CollapsibleContent>
          </Collapsible>
          </>
          )}

        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN                                                  */}
        {/* ============================================================ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="sticky top-20 flex flex-col gap-4">

            {/* ---- Map + Audience Estimate (merged) ---- */}
            <LocationReachCard
              countryCount={aud.locationIds.length}
              countries={aud.locationIds}
              cityCount={(aud.cities ?? []).length}
              cities={(aud.cities ?? [])
                .map((id) => getCityById(id))
                .filter((c): c is NonNullable<typeof c> => c != null)
                .map((c) => ({
                  id: c.id,
                  name: c.name,
                  countryCode: c.countryCode,
                  lat: c.lat,
                  lng: c.lng,
                  radiusKm: 0,
                }))}
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
                { label: "Interests", value: aud.interests.length > 0 ? `${aud.interests.length} categories` : "All" },
                ...(aud.interestKeywordIds.length > 0 ? [{ label: "Interest Keywords", value: `${aud.interestKeywordIds.length} keywords` }] : []),
                ...(aud.purchaseIntentKeywordIds.length > 0 ? [{ label: "Purchase Intent", value: `${aud.purchaseIntentKeywordIds.length} keywords`, highlight: true }] : []),
                { label: "Devices", value: aud.operatingSystems.length === 2 ? "All" : aud.operatingSystems.join(", ") || "All" },
                ...(aud.excludeRecentPurchasers ? [{ label: "Exclude buyers", value: `Last ${aud.excludeRecentPurchasersDays}d`, highlight: true }] : []),
              ]}
            />

          </div>
        </div>
      </div>
      {/* ── Learn More Sheet ── */}
      <LearnMoreSheet
        open={sallaSmartLearnMore.open}
        onOpenChange={sallaSmartLearnMore.setOpen}
        title="Salla Smart Features"
        description="Salla-exclusive targeting features powered by real purchase data from your store. These features work alongside TikTok's native targeting to improve your results."
        icon={<Sparkles />}
        proTip="Enable both Exclude Recent Buyers and Lookalike Audiences together for the best results — you'll reach new customers who look like your best existing ones."
      >
        <SheetSection icon={<ShoppingCart />} title="Exclude Recent Buyers">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Automatically suppresses users who have already purchased from your store within the selected timeframe (7, 14, or 30 days). This prevents wasting ad spend on customers who just bought and focuses your budget entirely on <span className="font-semibold text-foreground">new customer acquisition</span>.
          </p>
        </SheetSection>
        <SheetSection icon={<Search />} title="Lookalike Audiences">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Uses Salla&apos;s aggregated purchase data to build an audience of users who share behavioral patterns with your existing customers. Select the product category closest to your store to get the most relevant lookalike match. This works alongside TikTok&apos;s native targeting — not as a replacement.
          </p>
        </SheetSection>
        <SheetSection icon={<Info />} title="Smart Targeting">
          <p className="text-xs leading-relaxed text-muted-foreground">
            When enabled, Smart Targeting allows TikTok to expand beyond your configured age and gender settings to find additional high-converting users. This is recommended for most campaigns — it gives the algorithm more room to optimize while still respecting your other targeting choices.
          </p>
        </SheetSection>
      </LearnMoreSheet>

      <LearnMoreSheet
        open={customAudiencesLearnMore.open}
        onOpenChange={customAudiencesLearnMore.setOpen}
        title="Custom Audiences"
        description="Custom Audiences let you target or exclude specific groups of users based on their past interactions with your business."
        icon={<Users />}
        proTip="Use Include for retargeting past visitors, and Exclude to suppress recent buyers — this prevents wasting budget on users who already converted."
      >
        <SheetSection icon={<Target />} title="Include vs Exclude">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Include — Retargeting"
              description="Show ads to users who have already interacted with your business (website visitors, app users, customer lists). These audiences convert at 2-3× the rate of cold traffic."
              highlighted
            />
            <SheetDecisionCard
              title="Exclude — Suppression"
              description="Prevent specific groups from seeing your ads. Common use: exclude recent purchasers so you don't waste budget on customers who just bought."
            />
          </div>
        </SheetSection>
        <SheetSection icon={<Info />} title="Best practices">
          <p className="text-xs leading-relaxed text-muted-foreground">
            For maximum impact, use Include and Exclude together: <span className="font-semibold text-foreground">include</span> website visitors from the last 30 days (warm leads) and <span className="font-semibold text-foreground">exclude</span> anyone who purchased in the last 7 days (already converted). This focuses your budget on users most likely to convert next.
          </p>
        </SheetSection>
      </LearnMoreSheet>

      <LearnMoreSheet
        open={keywordsLearnMore.open}
        onOpenChange={keywordsLearnMore.setOpen}
        title="Keyword Targeting"
        description="TikTok offers two types of keyword targeting that cannot be used together. Choose the one that matches your campaign goal."
        icon={<Search />}
        proTip="For e-commerce campaigns, Purchase Intent Keywords typically outperform Interest Keywords because they target users actively shopping, not just browsing."
      >
        <SheetSection icon={<Search />} title="Interest Keywords">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Target users based on topics and products they&apos;re <span className="font-semibold text-foreground">interested in</span> on TikTok. These are broader — they capture users who engage with content related to your keywords (e.g., &quot;skincare routine&quot;, &quot;running shoes&quot;). Available for all campaign objectives.
          </p>
        </SheetSection>
        <SheetSection icon={<ShoppingCart />} title="Purchase Intent Keywords">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Target users who are <span className="font-semibold text-foreground">actively searching for or engaging with</span> specific product categories on TikTok. These are higher intent — the user is closer to making a purchase decision. Only available for Product Sales and App Promotion campaigns.
          </p>
        </SheetSection>
        <SheetSection icon={<AlertCircle />} title="Important: mutual exclusivity">
          <p className="text-xs leading-relaxed text-muted-foreground">
            TikTok&apos;s API does not allow both keyword types on the same ad group. Adding Interest Keywords will automatically clear any Purchase Intent Keywords, and vice versa. Choose one approach per ad group.
          </p>
        </SheetSection>
      </LearnMoreSheet>

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
