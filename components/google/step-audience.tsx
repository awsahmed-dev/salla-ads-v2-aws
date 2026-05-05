"use client";

import { useState, useMemo } from "react";
import { useGoogleCampaign } from "@/lib/google/campaign-context";
import { OBJECTIVE_CONFIGS, type SearchKeyword, type KeywordMatchType, type AudienceTargetingMode, type SearchDeviceType } from "@/lib/google/campaign-types";
import { cn } from "@/lib/utils";
import { getCountryByCode, getCityById } from "@/lib/locations";
import { LocationSelector } from "@/components/shared/location-selector";
import { LocationMapPreview } from "@/components/shared/location-map-preview";
import { LocationReachCard } from "@/components/shared/location-reach-card";
import { DeliveryCheckCard } from "@/components/shared/delivery-check-card";
import { DemographicsCard } from "@/components/shared/demographics-card";
import { SallaSmartFeaturesCard } from "@/components/shared/salla-smart-features-card";
import { DeviceTargetingCard } from "@/components/shared/device-targeting-card";
import { TargetingSummaryCard, type TargetingSummaryRow } from "@/components/shared/targeting-summary-card";
import { AudienceReadinessChecklist } from "@/components/shared/audience-readiness-checklist";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { LegacyInterestTargetingCard as InterestTargetingCard } from "@/components/shared/interest-targeting-card";
import { SectionCard } from "@/components/shared/section-card";
import { ObjectiveExplainer } from "@/components/shared/objective-explainer";
import { InfoTip } from "@/components/shared/info-tip";
import { minMaxToAgeBands, ageBandsToMinMax, SUPPORTED_LANGUAGES } from "@/lib/demographics";
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
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  Tag,
  Link2,
  ShoppingBag,
  Heart,
  Eye,
  UserPlus,
  Store,
  Smartphone,
  TrendingUp,
  Monitor,
  Tablet,
  Radio,
  DollarSign,
  Info,
  Loader2,
} from "lucide-react";
import { generateKeywords, generateNegativeKeywords, getStoreSnapshot, type GeneratedKeyword } from "@/lib/google/search-ai-generator";

/* ================================================================== */
/*  Static data                                                       */
/* ================================================================== */

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

const REMARKETING_AUDIENCES = [
  { id: "rm_1", name: "All Website Visitors (30d)" },
  { id: "rm_2", name: "Purchasers (90d)" },
  { id: "rm_3", name: "Cart Abandoners" },
  { id: "rm_4", name: "Email Subscribers" },
  { id: "rm_5", name: "High-Value Customers (Top 20%)" },
  { id: "rm_6", name: "Product Page Viewers" },
];

const REMARKETING_AUDIENCE_META: Record<
  string,
  { intent: "High intent" | "Mid intent" | "Broad"; freshness: string; starter?: boolean }
> = {
  rm_1: { intent: "Broad", freshness: "30d" },
  rm_2: { intent: "High intent", freshness: "90d", starter: true },
  rm_3: { intent: "High intent", freshness: "30d", starter: true },
  rm_4: { intent: "Mid intent", freshness: "90d" },
  rm_5: { intent: "High intent", freshness: "90d" },
  rm_6: { intent: "Mid intent", freshness: "30d" },
};

/** Google Display Network topic categories.
 *  Maps to AdGroupCriterion.topic (TopicInfo). */
const DISPLAY_TOPICS = [
  { id: "/Arts & Entertainment", label: "Arts & Entertainment" },
  { id: "/Autos & Vehicles", label: "Autos & Vehicles" },
  { id: "/Beauty & Fitness", label: "Beauty & Fitness" },
  { id: "/Books & Literature", label: "Books & Literature" },
  { id: "/Business & Industrial", label: "Business & Industrial" },
  { id: "/Computers & Electronics", label: "Computers & Electronics" },
  { id: "/Finance", label: "Finance" },
  { id: "/Food & Drink", label: "Food & Drink" },
  { id: "/Games", label: "Games" },
  { id: "/Health", label: "Health" },
  { id: "/Hobbies & Leisure", label: "Hobbies & Leisure" },
  { id: "/Home & Garden", label: "Home & Garden" },
  { id: "/Internet & Telecom", label: "Internet & Telecom" },
  { id: "/Jobs & Education", label: "Jobs & Education" },
  { id: "/News", label: "News" },
  { id: "/Online Communities", label: "Online Communities" },
  { id: "/People & Society", label: "People & Society" },
  { id: "/Pets & Animals", label: "Pets & Animals" },
  { id: "/Real Estate", label: "Real Estate" },
  { id: "/Shopping", label: "Shopping" },
  { id: "/Sports", label: "Sports" },
  { id: "/Travel", label: "Travel" },
];

const HOUSEHOLD_INCOME_TIERS = [
  { id: "TOP_10", label: "Top 10%" },
  { id: "11_20", label: "11-20%" },
  { id: "21_30", label: "21-30%" },
  { id: "31_40", label: "31-40%" },
  { id: "41_50", label: "41-50%" },
  { id: "LOWER_50", label: "Lower 50%" },
];

const PARENTAL_STATUS_OPTIONS = [
  { id: "PARENT", label: "Parent" },
  { id: "NOT_A_PARENT", label: "Not a parent" },
  { id: "UNDETERMINED", label: "Unknown" },
];

/* ================================================================== */
/*  Helpers                                                           */
/* ================================================================== */

function TagPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
      {label}
      <button type="button" onClick={onRemove} className="rounded-full p-0.5 hover:bg-primary/10">
        <X className="size-3" />
      </button>
    </span>
  );
}


function isGenericSiteDomain(input: string): boolean {
  const normalized = input.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  const domain = normalized.split("/")[0] ?? "";
  const blocked = ["google.com", "youtube.com", "facebook.com", "instagram.com", "tiktok.com", "x.com", "twitter.com"];
  return blocked.some((d) => domain === d || domain.endsWith(`.${d}`));
}

/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */

export function GoogleStepAudience() {
  const { campaign, setStep, updateNested } = useGoogleCampaign();
  const aud = campaign.audience;
  const objConfig = OBJECTIVE_CONFIGS[campaign.objective.objective] ?? OBJECTIVE_CONFIGS.PERFORMANCE_MAX;
  const isPMax = campaign.objective.objective === "PERFORMANCE_MAX";
  const isShopping = campaign.objective.objective === "SHOPPING";
  const isDemandGen = campaign.objective.objective === "DEMAND_GEN";
  const isSearch = campaign.objective.objective === "SEARCH";
  const isDisplay = campaign.objective.objective === "DISPLAY";
  const isApp = campaign.objective.objective === "APP";

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [negKeywordInput, setNegKeywordInput] = useState("");
  const [searchKeywordInput, setSearchKeywordInput] = useState("");
  const [searchKeywordMatchType, setSearchKeywordMatchType] = useState<"BROAD" | "PHRASE" | "EXACT">("BROAD");
  const [searchNegKeywordInput, setSearchNegKeywordInput] = useState("");
  const [displayContentKeywordInput, setDisplayContentKeywordInput] = useState("");
  const [displayPlacementInput, setDisplayPlacementInput] = useState("");
  const [displayExcludedPlacementInput, setDisplayExcludedPlacementInput] = useState("");
  const [lookalikeInput, setLookalikeInput] = useState("");
  const [customerMatchInput, setCustomerMatchInput] = useState("");
  const [themeInput, setThemeInput] = useState("");
  const [customKeywordInput, setCustomKeywordInput] = useState("");
  const [customUrlInput, setCustomUrlInput] = useState("");

  /* --- AI keyword generator state --- */
  const [aiKeywords, setAiKeywords] = useState<GeneratedKeyword[]>([]);
  const [aiKeywordsLoading, setAiKeywordsLoading] = useState(false);
  const [aiNegatives, setAiNegatives] = useState<string[]>([]);

  const handleGenerateKeywords = async () => {
    setAiKeywordsLoading(true);
    try {
      const snapshot = await getStoreSnapshot();
      const keywords = generateKeywords(snapshot);
      const negatives = generateNegativeKeywords();
      setAiKeywords(keywords);
      setAiNegatives(negatives);
    } catch { /* fail silently */ }
    setAiKeywordsLoading(false);
  };

  const toggleInArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  /* --- Display content targeting (operates on first ad group for audience step) --- */
  const activeDisplayAdGroup = isDisplay ? campaign.creative.displayAdGroups[0] : null;
  const displayContentKeywords = activeDisplayAdGroup?.contentKeywords ?? [];
  const displayTopics = activeDisplayAdGroup?.topics ?? [];
  const displayPlacements = activeDisplayAdGroup?.placements ?? [];
  const displayExcludedPlacements = activeDisplayAdGroup?.excludedPlacements ?? [];

  const updateDisplayAdGroup = (patch: Partial<{ contentKeywords: string[]; topics: string[]; placements: string[]; excludedPlacements: string[] }>) => {
    if (!isDisplay) return;
    const groups = [...campaign.creative.displayAdGroups];
    groups[0] = { ...groups[0], ...patch };
    updateNested("creative", { displayAdGroups: groups });
  };

  const addDisplayContentKeyword = () => {
    const val = displayContentKeywordInput.trim();
    if (!val || displayContentKeywords.includes(val)) return;
    updateDisplayAdGroup({ contentKeywords: [...displayContentKeywords, val] });
    setDisplayContentKeywordInput("");
  };
  const addDisplayPlacement = () => {
    const val = displayPlacementInput.trim();
    if (!val || displayPlacements.includes(val)) return;
    updateDisplayAdGroup({ placements: [...displayPlacements, val] });
    setDisplayPlacementInput("");
  };
  const addDisplayExcludedPlacement = () => {
    const val = displayExcludedPlacementInput.trim();
    if (!val || displayExcludedPlacements.includes(val)) return;
    updateDisplayAdGroup({ excludedPlacements: [...displayExcludedPlacements, val] });
    setDisplayExcludedPlacementInput("");
  };

  /* --- Search keyword handling --- */
  const activeSearchAdGroup = isSearch ? campaign.creative.searchAdGroups[0] : null;
  const searchKeywords = activeSearchAdGroup?.keywords ?? [];
  const searchNegKeywords = activeSearchAdGroup?.negativeKeywords ?? [];

  const updateSearchAdGroupKeywords = (keywords: SearchKeyword[]) => {
    if (!isSearch) return;
    const groups = [...campaign.creative.searchAdGroups];
    groups[0] = { ...groups[0], keywords };
    updateNested("creative", { searchAdGroups: groups });
  };
  const updateSearchAdGroupNegKeywords = (negativeKeywords: SearchKeyword[]) => {
    if (!isSearch) return;
    const groups = [...campaign.creative.searchAdGroups];
    groups[0] = { ...groups[0], negativeKeywords };
    updateNested("creative", { searchAdGroups: groups });
  };

  const addSearchKeyword = () => {
    const val = searchKeywordInput.trim();
    if (!val || searchKeywords.some((k) => k.text === val && k.matchType === searchKeywordMatchType)) return;
    const newKw: SearchKeyword = { id: `kw-${Date.now()}`, text: val, matchType: searchKeywordMatchType };
    updateSearchAdGroupKeywords([...searchKeywords, newKw]);
    setSearchKeywordInput("");
  };
  const addSearchNegKeyword = () => {
    const val = searchNegKeywordInput.trim();
    if (!val || searchNegKeywords.some((k) => k.text === val)) return;
    const newKw: SearchKeyword = { id: `nkw-${Date.now()}`, text: val, matchType: "BROAD" };
    updateSearchAdGroupNegKeywords([...searchNegKeywords, newKw]);
    setSearchNegKeywordInput("");
  };

  const formatKeywordDisplay = (kw: SearchKeyword) => {
    switch (kw.matchType) {
      case "EXACT": return `[${kw.text}]`;
      case "PHRASE": return `"${kw.text}"`;
      default: return kw.text;
    }
  };
  const matchTypeColor = (mt: KeywordMatchType) => {
    switch (mt) {
      case "EXACT": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "PHRASE": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  /* Search theme handling */
  const addSearchTheme = () => {
    const val = themeInput.trim();
    if (!val || aud.searchThemes.length >= 25 || aud.searchThemes.includes(val)) return;
    updateNested("audience", { searchThemes: [...aud.searchThemes, val] });
    setThemeInput("");
  };
  const addCustomKeyword = () => {
    const val = customKeywordInput.trim();
    if (!val || aud.customSegmentKeywords.includes(val)) return;
    updateNested("audience", { customSegmentKeywords: [...aud.customSegmentKeywords, val] });
    setCustomKeywordInput("");
  };
  const addNegativeKeyword = () => {
    const val = negKeywordInput.trim();
    if (!val || aud.negativeKeywords.includes(val)) return;
    updateNested("audience", { negativeKeywords: [...aud.negativeKeywords, val] });
    setNegKeywordInput("");
  };
  const addCustomUrl = () => {
    const val = customUrlInput.trim();
    if (!val || aud.customSegmentUrls.includes(val)) return;
    updateNested("audience", { customSegmentUrls: [...aud.customSegmentUrls, val] });
    setCustomUrlInput("");
  };

  /* Signal strength */
  const signalCount =
    aud.searchThemes.length +
    aud.customSegmentKeywords.length +
    aud.customSegmentUrls.length +
    aud.inMarketSegments.length +
    aud.affinitySegments.length +
    aud.audienceSignals.length;
  const signalStrength =
    signalCount >= 10 ? "Excellent" :
    signalCount >= 5 ? "Good" :
    signalCount >= 1 ? "Fair" : "None";
  const signalColor =
    signalStrength === "Excellent" ? "text-emerald-600" :
    signalStrength === "Good" ? "text-primary" :
    signalStrength === "Fair" ? "text-amber-600" : "text-muted-foreground";
  const signalBarColor =
    signalStrength === "Excellent" ? "bg-emerald-500" :
    signalStrength === "Good" ? "bg-primary" :
    signalStrength === "Fair" ? "bg-amber-500" : "bg-muted";
  const signalBarWidth =
    signalCount >= 10 ? 100 :
    signalCount >= 5 ? 70 :
    signalCount >= 1 ? 35 : 5;
  const hasGenericSiteHint = aud.customSegmentUrls.some(isGenericSiteDomain);
  const selectedCities = useMemo(
    () =>
      (aud.cityIds ?? [])
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
    [aud.cityIds, aud.cityRadii]
  );

  const hasLocation = (aud.locationIds?.length ?? 0) > 0 || (aud.cityIds?.length ?? 0) > 0;
  const deliveryIssues = useMemo(() => {
    const issues: { message: string }[] = [];
    if (!hasLocation) issues.push({ message: "No location selected" });
    if (aud.languages.length === 0) issues.push({ message: "No language set" });
    if (aud.ageMin >= aud.ageMax) issues.push({ message: "Invalid age range" });
    if (isSearch && searchKeywords.length === 0) issues.push({ message: "Add at least one keyword for Search campaigns" });
    if (isApp && !campaign.objective.appSettings.appId.trim()) issues.push({ message: "App ID is required for App campaigns" });
    return issues;
  }, [
    hasLocation,
    aud.languages.length,
    aud.ageMin,
    aud.ageMax,
    isSearch,
    searchKeywords.length,
    isApp,
    campaign.objective.appSettings.appId,
  ]);
  const canProceed = deliveryIssues.length === 0;

  const bestPracticeChecks = useMemo(() => {
    const base: { label: string; done: boolean }[] = [];

    if (isPMax) {
      base.push({ label: "Add 3+ audience signals", done: signalCount >= 3 });
      base.push({ label: "Add 5-15 search themes", done: aud.searchThemes.length >= 5 && aud.searchThemes.length <= 15 });
      base.push({ label: "Select 1+ first-party audience list", done: aud.audienceSignals.length > 0 });
      return base;
    }

    if (isSearch) {
      const matchTypesUsed = new Set(searchKeywords.map((k) => k.matchType)).size;
      base.push({ label: "Add 10+ keywords", done: searchKeywords.length >= 10 });
      base.push({ label: "Use 2+ keyword match types", done: matchTypesUsed >= 2 });
      base.push({ label: "Add negative keywords", done: searchNegKeywords.length > 0 });
      return base;
    }

    if (isDisplay) {
      const hasContentTargeting =
        displayContentKeywords.length > 0 ||
        displayTopics.length > 0 ||
        displayPlacements.length > 0 ||
        aud.inMarketSegments.length > 0 ||
        aud.affinitySegments.length > 0;
      base.push({ label: "Add content targeting or audience segments", done: hasContentTargeting });
      if (displayContentKeywords.length > 0 || displayTopics.length > 0 || displayPlacements.length > 0) {
        base.push({ label: "Add 10+ content keywords (if using keyword targeting)", done: displayContentKeywords.length >= 10 });
      }
      return base;
    }

    if (isDemandGen) {
      base.push({ label: "Add in-market or affinity audiences", done: aud.inMarketSegments.length + aud.affinitySegments.length > 0 });
      base.push({ label: "Select 1+ first-party audience list", done: aud.audienceSignals.length > 0 });
      return base;
    }

    if (isShopping) {
      base.push({ label: "Add negative keywords", done: aud.negativeKeywords.length > 0 });
      base.push({ label: "Add audience signals (in-market, affinity, or your data)", done: aud.inMarketSegments.length + aud.affinitySegments.length + aud.audienceSignals.length > 0 });
      return base;
    }

    if (isApp) {
      base.push({ label: "Keep locations broad for scale", done: (aud.cityIds?.length ?? 0) === 0 });
      base.push({ label: "Set at least one language", done: aud.languages.length > 0 });
      return base;
    }

    return base;
  }, [
    signalCount,
    aud.searchThemes.length,
    aud.audienceSignals.length,
    aud.inMarketSegments.length,
    aud.affinitySegments.length,
    isSearch,
    isDisplay,
    isDemandGen,
    isShopping,
    isPMax,
    isApp,
    searchKeywords.length,
    searchNegKeywords.length,
    displayContentKeywords.length,
    displayTopics.length,
    displayPlacements.length,
    aud.negativeKeywords.length,
    aud.cityIds?.length,
    aud.languages.length,
  ]);

  const targetingSummaryRows: TargetingSummaryRow[] = useMemo(() => {
    const base: TargetingSummaryRow[] = [
      {
        label: "Location",
        value: (
          <>
            {aud.locationIds.length > 0 ? aud.locationIds.map((c) => getCountryByCode(c)?.name ?? c).join(", ") : "None"}
            {(aud.cityIds ?? []).length > 0 && <span className="text-muted-foreground"> + {(aud.cityIds ?? []).length} cities</span>}
          </>
        ),
      },
      { label: "Gender", value: aud.genders.length === 0 || aud.genders.includes("UNDETERMINED") ? "All" : aud.genders.join(", ") },
      { label: "Age", value: `${aud.ageMin} - ${aud.ageMax === 65 ? "65+" : aud.ageMax}` },
      { label: "Languages", value: aud.languages.length > 0 ? aud.languages.map((l) => SUPPORTED_LANGUAGES.find((x) => x.code === l)?.label || l).join(", ") : "None" },
    ];
    if (isApp) {
      return [
        ...base,
        { label: "App Store", value: campaign.objective.appSettings.appStore === "GOOGLE_APP_STORE" ? "Google Play" : "Apple" },
        { label: "App ID", value: campaign.objective.appSettings.appId || "Not set" },
        { label: "Goal", value: campaign.objective.appSettings.biddingStrategyGoalType === "OPTIMIZE_INSTALLS_TARGET_INSTALL_COST" ? "Installs" : campaign.objective.appSettings.biddingStrategyGoalType === "OPTIMIZE_RETURN_ON_ADVERTISING_SPEND" ? "ROAS" : "In-App Actions" },
        { label: "Targeting", value: "Automated (AI)" },
      ];
    }
    if (isPMax) {
      return [
        ...base,
        { label: "Search themes", value: String(aud.searchThemes.length) },
        { label: "Custom segments", value: String(aud.customSegmentKeywords.length + aud.customSegmentUrls.length) },
        { label: "Device delivery", value: "Auto (Google AI)" },
      ];
    }
    if (isSearch) {
      return [
        ...base,
        { label: "Keywords", value: String(searchKeywords.length) },
        { label: "Negative keywords", value: String(searchNegKeywords.length) },
        { label: "Audience mode", value: aud.audienceTargetingMode === "OBSERVATION" ? "Observation" : "Targeting" },
        { label: "RLSA lists", value: String(aud.audienceSignals.length) },
        { label: "Audience segments", value: String(aud.inMarketSegments.length + aud.affinitySegments.length) },
      ];
    }
    if (isDisplay) {
      return [
        ...base,
        { label: "Content keywords", value: String(displayContentKeywords.length) },
        { label: "Topics", value: String(displayTopics.length) },
        { label: "Placements", value: String(displayPlacements.length) },
        { label: "Excluded", value: String(displayExcludedPlacements.length) },
        { label: "Optimized targeting", value: aud.optimizedTargeting ? "On" : "Off" },
        { label: "Audience segments", value: String(aud.inMarketSegments.length + aud.affinitySegments.length) },
        { label: "Remarketing", value: String(aud.audienceSignals.length) },
      ];
    }
    return [
      ...base,
      { label: "Interests", value: String(aud.inMarketSegments.length + aud.affinitySegments.length) },
      { label: "Remarketing", value: String(aud.audienceSignals.length) },
    ];
  }, [aud, campaign.objective.appSettings, isApp, isPMax, isSearch, isDisplay, searchKeywords.length, searchNegKeywords.length, displayContentKeywords.length, displayTopics.length, displayPlacements.length, displayExcludedPlacements.length]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ============================================================ */}
        {/* LEFT COLUMN                                                   */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">

          {/* ---- 1. Location (shared component — same UX as all platforms; maps to locationIds + cityIds) ---- */}
          <SectionCard>
            <LocationSelector
              value={{
                countryCodes: aud.locationIds,
                regions: [],
                cities: selectedCities,
              }}
              onChange={(next) =>
                updateNested("audience", {
                  locationIds: next.countryCodes,
                  cityIds: next.cities.map((c) => c.id),
                  cityRadii: Object.fromEntries(next.cities.map((c) => [c.id, c.radiusKm])),
                })
              }
              enableCityTargeting
              enableRadiusPerCity
              accent="primary"
              label="Location"
              tooltipText="Choose where ads can run. Start broad (country-level), then narrow to priority cities only if needed."
            />

            {/* Location method (Google-specific) */}
            <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
              <Label className="mb-1.5 block text-xs font-medium text-foreground">Location targeting method</Label>
              <div className="flex gap-2">
                {(["PRESENCE", "PRESENCE_OR_INTEREST"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => updateNested("audience", { locationTargetingMethod: method })}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs transition-all",
                      aud.locationTargetingMethod === method
                        ? "border-primary bg-primary/5 font-medium text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {method === "PRESENCE" ? "People in this location" : "People in or interested in"}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Simple rule: start with <strong>People in this location</strong>. Use <strong>People in or interested in</strong> only when you want broader reach.
              </p>
            </div>

            {/* Excluded (negative) locations */}
            {aud.excludedLocationIds.length > 0 && (
              <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <Label className="mb-1.5 block text-xs font-medium text-destructive">Excluded locations</Label>
                <div className="flex flex-wrap gap-1.5">
                  {aud.excludedLocationIds.map((loc) => (
                    <Badge key={loc} variant="outline" className="gap-1 border-destructive/30 text-destructive">
                      {loc}
                      <button type="button" className="ml-0.5 text-destructive/60 hover:text-destructive" onClick={() => updateNested("audience", { excludedLocationIds: aud.excludedLocationIds.filter((l) => l !== loc) })}>
                        &times;
                      </button>
                    </Badge>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground">Ads will not show to people in these locations. Maps to negative CampaignCriterion.</p>
              </div>
            )}
          </SectionCard>

          {/* ---- APP: automated targeting notice ---- */}
          {isApp && (
            <SectionCard>
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                <Sparkles className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Automated targeting for App campaigns</p>
                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                    Google App campaigns automatically target users across Search, Play, YouTube, Discover, and Display Network. You cannot manually set demographics, keywords, or audience targeting. Google optimizes based on your app listing, ad assets, and campaign goal.
                  </p>
                  <p className="mt-2 text-xs text-blue-600 dark:text-blue-500">
                    Only location and language targeting are available for App campaigns.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ---- 2. Demographics (shared: English/Arabic, Male/Female, age bands) ---- */}
          {!isApp && <DemographicsCard
            languageCodes={aud.languages}
            onLanguagesChange={(codes) => updateNested("audience", { languages: codes })}
            genderIds={aud.genders.length === 0 || (aud.genders.includes("MALE") && aud.genders.includes("FEMALE")) ? ["MALE", "FEMALE"] : aud.genders.includes("MALE") ? ["MALE"] : ["FEMALE"]}
            onGendersChange={(ids) => {
              const genders = ids.length === 2 ? [] : ids as ("MALE" | "FEMALE")[];
              updateNested("audience", { genders });
            }}
            ageBandValues={minMaxToAgeBands(aud.ageMin, aud.ageMax)}
            onAgeBandsChange={(bands) => {
              const { ageMin, ageMax } = ageBandsToMinMax(bands);
              updateNested("audience", { ageMin, ageMax });
            }}
            accent="primary"
            languageRequired={aud.locationIds.length > 1}
            headerTooltip={isPMax
              ? "Use demographics as guidance, not hard limits. PMax can still expand if it predicts better conversions."
              : "Set language, age, and gender to keep targeting relevant for your offer."
            }
          />}

          {!isApp && (<>

          {/* ---- 2b. Keywords (Search only) ---- */}
          {isSearch && (
            <SectionCard>
              <div className="mb-1 flex items-center gap-2">
                <Search className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Keywords</Label>
                <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">Search</Badge>
                <InfoTip text="Keywords trigger your ads when people search these terms on Google. Start with 10-20 keywords per category. Use Broad match for reach, Phrase for relevance, and Exact for precision." />
              </div>
              <p className="mb-3 mt-2 text-xs text-muted-foreground">
                Add what customers type before buying. Start with 10-20 relevant keywords per ad group.
              </p>

              {/* Keyword input with match type */}
              <div className="mb-3 flex gap-2">
                <div className="flex flex-1 gap-1.5">
                  <Select value={searchKeywordMatchType} onValueChange={(v) => setSearchKeywordMatchType(v as KeywordMatchType)}>
                    <SelectTrigger className="h-9 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BROAD">Broad</SelectItem>
                      <SelectItem value="PHRASE">Phrase</SelectItem>
                      <SelectItem value="EXACT">Exact</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder='e.g. buy perfume online, "oud fragrance", [mens watches]'
                    value={searchKeywordInput}
                    onChange={(e) => setSearchKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSearchKeyword())}
                    className="h-9 flex-1 text-sm"
                  />
                </div>
                <Button size="sm" variant="outline" className="h-9 gap-1 text-xs" disabled={!searchKeywordInput.trim()} onClick={addSearchKeyword}>
                  <Plus className="size-3" /> Add
                </Button>
              </div>

              {/* Keyword pills */}
              {searchKeywords.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {searchKeywords.map((kw) => (
                    <span key={kw.id} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", matchTypeColor(kw.matchType))}>
                      <span className="font-mono text-[10px]">{formatKeywordDisplay(kw)}</span>
                      <button type="button" onClick={() => updateSearchAdGroupKeywords(searchKeywords.filter((k) => k.id !== kw.id))} className="rounded-full p-0.5 hover:bg-black/10">
                        <X className="size-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{searchKeywords.length} keyword{searchKeywords.length !== 1 ? "s" : ""} added</span>
                <span>Press Enter to add</span>
              </div>

              {/* Match type legend */}
              <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-semibold text-foreground">Match Type Guide</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <Badge className="mt-0.5 shrink-0 rounded bg-amber-100 px-1.5 py-0 text-[9px] font-bold text-amber-700 hover:bg-amber-100">Broad</Badge>
                    <p className="text-[11px] text-muted-foreground">Widest reach. Shows for related searches, synonyms, and variations. <span className="font-medium text-foreground">Example: shoes</span> matches "buy sneakers online"</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="mt-0.5 shrink-0 rounded bg-blue-100 px-1.5 py-0 text-[9px] font-bold text-blue-700 hover:bg-blue-100">Phrase</Badge>
                    <p className="text-[11px] text-muted-foreground">Medium reach. Shows when the meaning of your keyword is included. <span className="font-medium text-foreground">Example: "running shoes"</span> matches "best running shoes for men"</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="mt-0.5 shrink-0 rounded bg-emerald-100 px-1.5 py-0 text-[9px] font-bold text-emerald-700 hover:bg-emerald-100">Exact</Badge>
                    <p className="text-[11px] text-muted-foreground">Narrowest reach. Shows only for the exact term or close variants. <span className="font-medium text-foreground">Example: [red shoes]</span> matches "red shoes" and "shoes red"</p>
                  </div>
                </div>
              </div>

              {/* AI Keyword Generator */}
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Smart Keywords from Store Data</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    onClick={handleGenerateKeywords}
                    disabled={aiKeywordsLoading}
                  >
                    {aiKeywordsLoading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                    {aiKeywords.length > 0 ? "Regenerate" : "Generate Keywords"}
                  </Button>
                </div>

                {aiKeywords.length > 0 ? (
                  <div className="space-y-3">
                    {/* Group keywords by group */}
                    {Object.entries(
                      aiKeywords.reduce((acc, kw) => {
                        (acc[kw.group] = acc[kw.group] || []).push(kw);
                        return acc;
                      }, {} as Record<string, GeneratedKeyword[]>)
                    ).map(([group, kws]) => (
                      <div key={group}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-muted-foreground">{group}</span>
                          <button
                            type="button"
                            className="text-[10px] font-medium text-primary hover:underline"
                            onClick={() => {
                              const existingTexts = new Set(searchKeywords.map(k => k.text.toLowerCase()));
                              const newKws = kws.filter(k => !existingTexts.has(k.text.toLowerCase()));
                              if (newKws.length > 0) {
                                updateSearchAdGroupKeywords([
                                  ...searchKeywords,
                                  ...newKws.map(k => ({ id: `kw-${Date.now()}-${k.text}`, text: k.text, matchType: k.matchType } as SearchKeyword)),
                                ]);
                              }
                            }}
                          >
                            + Add all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {kws.map((kw) => {
                            const isAdded = searchKeywords.some(k => k.text.toLowerCase() === kw.text.toLowerCase());
                            return (
                              <button
                                key={kw.text}
                                type="button"
                                disabled={isAdded}
                                onClick={() => {
                                  if (!isAdded) {
                                    const newKw: SearchKeyword = { id: `kw-${Date.now()}-${kw.text}`, text: kw.text, matchType: kw.matchType };
                                    updateSearchAdGroupKeywords([...searchKeywords, newKw]);
                                  }
                                }}
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-all",
                                  isAdded
                                    ? "border-primary/30 bg-primary/10 text-primary"
                                    : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
                                )}
                              >
                                {!isAdded && <span className="text-muted-foreground">+</span>}
                                {isAdded && <CheckCircle2 className="size-3 text-primary" />}
                                {kw.text}
                                <Badge variant="outline" className="ml-0.5 h-3.5 px-1 text-[9px]">
                                  {kw.matchType === "BROAD" ? "Broad" : kw.matchType === "PHRASE" ? "Phrase" : "Exact"}
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Click &quot;Generate Keywords&quot; to get AI-powered keyword suggestions based on your store&apos;s products, categories, and brand.
                  </p>
                )}
              </div>

              {/* Negative Keywords for Search */}
              <div className="mt-5 border-t border-border pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <Label className="text-xs font-semibold text-foreground">Negative Keywords</Label>
                  <InfoTip text="Prevent your ads from showing on irrelevant searches. For e-commerce, always exclude: free, used, cheap, DIY, tutorial, repair, jobs." />
                </div>
                <div className="mb-2 flex gap-2">
                  <Input
                    placeholder="e.g. free, used, cheap"
                    value={searchNegKeywordInput}
                    onChange={(e) => setSearchNegKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSearchNegKeyword())}
                    className="h-8 flex-1 text-xs"
                  />
                  <Button size="sm" variant="outline" className="h-8 gap-1 text-[10px]" disabled={!searchNegKeywordInput.trim()} onClick={addSearchNegKeyword}>
                    <Plus className="size-3" /> Add
                  </Button>
                </div>
                {searchNegKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {searchNegKeywords.map((kw) => (
                      <span key={kw.id} className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        {kw.text}
                        <button type="button" onClick={() => updateSearchAdGroupNegKeywords(searchNegKeywords.filter((k) => k.id !== kw.id))} className="rounded-full p-0.5 hover:bg-red-100">
                          <X className="size-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground">{searchNegKeywords.length} negative keyword{searchNegKeywords.length !== 1 ? "s" : ""} added.</p>

                {aiNegatives.length > 0 && (
                  <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <ShieldCheck className="size-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-medium text-foreground">Suggested Negative Keywords</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {aiNegatives.map((neg) => {
                        const isAdded = searchNegKeywords.some(n => n.text.toLowerCase() === neg.toLowerCase());
                        return (
                          <button
                            key={neg}
                            type="button"
                            disabled={isAdded}
                            onClick={() => {
                              if (!isAdded) {
                                const newKw: SearchKeyword = { id: `nkw-${Date.now()}-${neg}`, text: neg, matchType: "BROAD" };
                                updateSearchAdGroupNegKeywords([...searchNegKeywords, newKw]);
                              }
                            }}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-all",
                              isAdded
                                ? "border-destructive/30 bg-destructive/10 text-destructive"
                                : "border-border bg-background text-muted-foreground hover:border-destructive/40"
                            )}
                          >
                            {isAdded ? "✓" : "+"} {neg}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* ---- 3. Interests (In-Market & Affinity) -- hidden for Shopping and App ---- */}
          {!isShopping && !isApp && <SectionCard>
            <div className="mb-1 flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <Label className="text-sm font-semibold text-foreground">Audience Interests</Label>
              <InfoTip text={isPMax
                ? "Audience signals help Google AI learn faster, but they do not strictly limit delivery."
                : isSearch
                  ? "Add segments in Observation mode to measure audience performance and adjust bids without restricting reach."
                  : "Reach people by interests and purchase intent. Keep segments focused on your category."
              } />
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              {isPMax
                ? "Optional — select segments to guide Google's AI toward your best audiences. It can still expand beyond them."
                : isSearch
                  ? "Optional — add audiences on top of your keywords. Ads show broadly while you collect optimization data."
                  : "Optional — leave empty to keep broad interest reach."
              }
            </p>

            {isPMax && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#a4ffe5]/40 bg-[#e6fff9]/40 px-4 py-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-[#004956]" />
                <div className="text-[11px] leading-relaxed text-[#004956]/80 space-y-1">
                  <p><span className="font-semibold text-[#004956]">In-Market</span> — people actively comparing or ready to buy.</p>
                  <p><span className="font-semibold text-[#004956]">Affinity</span> — people with longer-term related interests.</p>
                  <p className="text-muted-foreground pt-0.5">Start with 3–6 In-Market segments. Add Affinity only for broader reach.</p>
                </div>
              </div>
            )}

            {/* Audience mode selector (Search only) */}
            {isSearch && (
              <div className="mb-4 rounded-lg border border-border bg-muted/20 p-3">
                <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Radio className="size-3 text-primary" />
                  Audience Mode
                  <InfoTip text="Observation keeps reach broad and lets you optimize by audience. Targeting limits delivery to selected audiences only." />
                </Label>
                <ObjectiveExplainer
                  className="mb-2"
                  highlight={
                    <>
                      <span className="font-semibold text-primary">Simple rule:</span> start with <strong>Observation</strong>. Use{" "}
                      <strong>Targeting</strong> only when you want ads to show to selected audiences only.
                    </>
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "OBSERVATION" as AudienceTargetingMode, label: "Observation", desc: "Your ads show to everyone searching your keywords. Audience data is collected for optimization. Best for most stores." },
                    { value: "TARGETING" as AudienceTargetingMode, label: "Targeting", desc: "Ads ONLY show to people in your selected audiences who also search your keywords. Significantly reduces reach." },
                  ]).map((mode) => {
                    const isSelected = aud.audienceTargetingMode === mode.value;
                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => updateNested("audience", { audienceTargetingMode: mode.value })}
                        className={cn(
                          "rounded-lg border-2 p-3 text-left transition-all",
                          isSelected ? "border-primary bg-primary/[0.04] shadow-sm" : "border-border bg-background hover:border-primary/40"
                        )}
                      >
                        <p className={cn("text-xs font-semibold", isSelected ? "text-primary" : "text-foreground")}>{mode.label}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{mode.desc}</p>
                      </button>
                    );
                  })}
                </div>
                {aud.audienceTargetingMode === "TARGETING" && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                    <AlertCircle className="size-3 shrink-0 text-amber-600" />
                    <p className="text-[11px] text-amber-700">Targeting mode will only show ads to users in your selected audience segments. This significantly reduces reach for Search campaigns.</p>
                  </div>
                )}
                {aud.audienceTargetingMode === "OBSERVATION" && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Best for most stores: keep Observation and apply bid adjustments after you collect data.
                  </p>
                )}
              </div>
            )}

            {/* In-Market */}
            <div className="mb-3">
              <InterestTargetingCard
                options={IN_MARKET_SEGMENTS}
                value={aud.inMarketSegments}
                onChange={(ids) =>
                  updateNested("audience", { inMarketSegments: ids })
                }
                sectionLabel="In-Market"
                accent="primary"
                searchPlaceholder="Search in-market segments..."
                showClearAll={false}
              />
            </div>

            {/* Affinity */}
            <div>
              <InterestTargetingCard
                options={AFFINITY_SEGMENTS}
                value={aud.affinitySegments}
                onChange={(ids) =>
                  updateNested("audience", { affinitySegments: ids })
                }
                sectionLabel="Affinity"
                accent="primary"
                searchPlaceholder="Search affinity segments..."
                showClearAll={false}
              />
            </div>

            {isPMax && (
              <p className="mt-3 text-[10px] text-muted-foreground/60">
                Sample segment list — full Google audience catalog will be connected at launch.
              </p>
            )}

            {(aud.inMarketSegments.length > 0 || aud.affinitySegments.length > 0) && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">
                  {aud.inMarketSegments.length + aud.affinitySegments.length} segment{(aud.inMarketSegments.length + aud.affinitySegments.length) !== 1 ? "s" : ""} selected.{" "}
                  <button type="button" onClick={() => updateNested("audience", { inMarketSegments: [], affinitySegments: [] })} className="text-primary underline">Clear all</button>
                </p>
                {isPMax && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    These are <span className="font-semibold">signals</span>, not strict limits. Google can expand beyond them to find more converters.
                  </p>
                )}
                {isPMax && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Data source: internal seed list (prototype).
                  </p>
                )}

                {/* Bid adjustment for Search (Observation mode) */}
                {isSearch && aud.audienceTargetingMode === "OBSERVATION" && (
                  <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
                    <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <DollarSign className="size-3 text-primary" />
                      Audience Bid Adjustments
                      <InfoTip text="Adjust bids by audience performance. Start small (+10% to +20%), then scale winners after data comes in." />
                    </Label>
                    <div className="flex flex-col gap-2">
                      {[...aud.inMarketSegments, ...aud.affinitySegments].map((segId) => {
                        const seg = IN_MARKET_SEGMENTS.find((s) => s.id === segId) || AFFINITY_SEGMENTS.find((s) => s.id === segId);
                        if (!seg) return null;
                        const adj = aud.audienceBidAdjustments[segId] ?? 0;
                        return (
                          <div key={segId} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
                            <span className="text-xs text-foreground truncate">{seg.label}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateNested("audience", { audienceBidAdjustments: { ...aud.audienceBidAdjustments, [segId]: Math.max(-90, adj - 10) } })}
                                className="flex size-6 items-center justify-center rounded border border-border text-xs hover:bg-muted"
                              >-</button>
                              <span className={cn("w-12 text-center text-xs font-bold", adj > 0 ? "text-emerald-600" : adj < 0 ? "text-red-600" : "text-muted-foreground")}>
                                {adj > 0 ? `+${adj}%` : `${adj}%`}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateNested("audience", { audienceBidAdjustments: { ...aud.audienceBidAdjustments, [segId]: Math.min(900, adj + 10) } })}
                                className="flex size-6 items-center justify-center rounded border border-border text-xs hover:bg-muted"
                              >+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">Range: -90% to +900%. 0% means no adjustment.</p>
                  </div>
                )}
              </div>
            )}
          </SectionCard>}

          {/* ---- 3a. PMax audience signals (moved from advanced to main flow) ---- */}
          {isPMax && (
            <>
              <SectionCard>
                <div className="mb-1 flex items-center gap-2">
                  <Search className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Search Themes</Label>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">Broad reach</Badge>
                  <InfoTip text="Search themes help PMax find the right audience across all channels. Add up to 25 phrases your ideal customer would search." />
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Broad keywords that describe your products or category. Google uses these to find relevant audiences across Search, Display, YouTube, and more.
                </p>
                <div className="flex gap-2">
                  <Input placeholder="e.g. buy abayas online" value={themeInput} onChange={(e) => setThemeInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSearchTheme())} className="h-9 flex-1 text-sm" />
                  <Button size="sm" variant="outline" className="h-9 gap-1 text-xs" disabled={!themeInput.trim() || aud.searchThemes.length >= 25} onClick={addSearchTheme}><Plus className="size-3" /> Add</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 gap-1 text-xs text-primary"
                    onClick={async () => {
                      try {
                        const { getStoreSnapshot, generateSearchThemes } = await import("@/lib/google/search-ai-generator");
                        const snapshot = await getStoreSnapshot();
                        const themes = generateSearchThemes(snapshot);
                        const existing = new Set(aud.searchThemes.map(t => t.toLowerCase()));
                        const newThemes = themes.filter(t => !existing.has(t.toLowerCase()));
                        updateNested("audience", { searchThemes: [...aud.searchThemes, ...newThemes].slice(0, 25) });
                      } catch { /* silent */ }
                    }}
                  >
                    <Sparkles className="size-3" /> Auto-fill
                  </Button>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{aud.searchThemes.length}/25 themes</p>
                {aud.searchThemes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {aud.searchThemes.map((t) => (
                      <TagPill key={t} label={t} onRemove={() => updateNested("audience", { searchThemes: aud.searchThemes.filter((s) => s !== t) })} />
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard>
                <div className="mb-1 flex items-center gap-2">
                  <Target className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Custom Segments</Label>
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">High intent</Badge>
                  <InfoTip text="Add intent phrases and similar sites to guide who PMax should learn from first. Google can still expand beyond them." />
                </div>
                <p className="mb-4 text-xs text-muted-foreground">
                  Specific phrases people search right before buying, and competitor sites they visit. Stronger targeting signal than Search Themes.
                </p>
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#a4ffe5]/40 bg-[#e6fff9]/40 px-4 py-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-[#004956]" />
                  <div className="text-[11px] leading-relaxed text-[#004956]/80 space-y-1">
                    <p><span className="font-semibold text-[#004956]">Search phrases</span> — terms people search right before buying (stronger intent).</p>
                    <p><span className="font-semibold text-[#004956]">Similar sites</span> — competitor or category domains for broader discovery.</p>
                    <p className="text-muted-foreground pt-0.5">Start with phrases first. Add 3–5 sites only if you need more reach.</p>
                  </div>
                </div>

                <div className="mb-4">
                  <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Tag className="size-3 text-muted-foreground" /> People searching these phrases
                  </Label>
                  <div className="flex gap-2">
                    <Input placeholder="e.g. buy oud fragrance" value={customKeywordInput} onChange={(e) => setCustomKeywordInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomKeyword())} className="h-9 flex-1 text-sm" />
                    <Button size="sm" variant="outline" className="h-9 gap-1 text-xs" disabled={!customKeywordInput.trim()} onClick={addCustomKeyword}><Plus className="size-3" /> Add</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-xs text-primary"
                      onClick={async () => {
                        try {
                          const { getStoreSnapshot, generateCustomSegmentKeywords } = await import("@/lib/google/search-ai-generator");
                          const snapshot = await getStoreSnapshot();
                          const keywords = generateCustomSegmentKeywords(snapshot);
                          const existing = new Set(aud.customSegmentKeywords.map(k => k.toLowerCase()));
                          const newKws = keywords.filter(k => !existing.has(k.toLowerCase()));
                          updateNested("audience", { customSegmentKeywords: [...aud.customSegmentKeywords, ...newKws] });
                        } catch { /* silent */ }
                      }}
                    >
                      <Sparkles className="size-3" /> Auto-fill from Store
                    </Button>
                  </div>
                  {aud.customSegmentKeywords.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {aud.customSegmentKeywords.map((k) => (
                        <TagPill key={k} label={k} onRemove={() => updateNested("audience", { customSegmentKeywords: aud.customSegmentKeywords.filter((s) => s !== k) })} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Link2 className="size-3 text-muted-foreground" /> People visiting similar sites
                  </Label>
                  <div className="flex gap-2">
                    <Input placeholder="e.g. competitor.com" value={customUrlInput} onChange={(e) => setCustomUrlInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomUrl())} className="h-9 flex-1 text-sm" />
                    <Button size="sm" variant="outline" className="h-9 gap-1 text-xs" disabled={!customUrlInput.trim()} onClick={addCustomUrl}><Plus className="size-3" /> Add</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-xs text-primary"
                      onClick={async () => {
                        try {
                          const { getStoreSnapshot, generateCustomSegmentUrls } = await import("@/lib/google/search-ai-generator");
                          const snapshot = await getStoreSnapshot();
                          const urls = generateCustomSegmentUrls(snapshot);
                          const existing = new Set(aud.customSegmentUrls.map(u => u.toLowerCase()));
                          const newUrls = urls.filter(u => !existing.has(u.toLowerCase()));
                          updateNested("audience", { customSegmentUrls: [...aud.customSegmentUrls, ...newUrls] });
                        } catch { /* silent */ }
                      }}
                    >
                      <Sparkles className="size-3" /> Auto-fill
                    </Button>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Use competitor/category domains. Avoid generic sites (for example: google.com, youtube.com).
                  </p>
                  {aud.customSegmentUrls.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {aud.customSegmentUrls.map((u) => (
                        <TagPill key={u} label={u} onRemove={() => updateNested("audience", { customSegmentUrls: aud.customSegmentUrls.filter((s) => s !== u) })} />
                      ))}
                    </div>
                  )}
                  {hasGenericSiteHint && (
                    <p className="mt-1 text-[10px] text-amber-700">
                      Some domains are too generic. Keep only category-relevant sites for better signal quality.
                    </p>
                  )}
                </div>
              </SectionCard>

              <SectionCard>
                <div className="mb-1 flex items-center gap-2">
                  <UserPlus className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Your Data (Remarketing)</Label>
                  <InfoTip text="Use your own customer lists as high-quality signals so PMax can find similar converters sooner." />
                </div>
                <p className="mb-4 text-xs text-muted-foreground">
                  Optional — select lists to signal your best converters. PMax expands beyond them automatically.
                </p>
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#a4ffe5]/40 bg-[#e6fff9]/40 px-4 py-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-[#004956]" />
                  <p className="text-[11px] leading-relaxed text-[#004956]/80">
                    Start with <span className="font-semibold text-[#004956]">Purchasers</span> + <span className="font-semibold text-[#004956]">Cart Abandoners</span> for the highest signal quality. Add more lists once conversion volume grows.
                  </p>
                </div>
                <InterestTargetingCard
                  options={REMARKETING_AUDIENCES.map((rm) => ({ id: rm.id, label: rm.name }))}
                  value={aud.audienceSignals}
                  onChange={(ids) => updateNested("audience", { audienceSignals: ids })}
                  sectionLabel="Audience lists"
                  searchPlaceholder="Search audience lists..."
                  accent="primary"
                  showClearAll={false}
                />
                <p className="mt-2 text-[10px] text-muted-foreground/60">
                  PMax treats these lists as signals to guide learning, not strict delivery limits.
                </p>
              </SectionCard>
            </>
          )}

          {/* ---- 3b. Negative Keywords (Shopping only) ---- */}
          {isShopping && (
            <SectionCard>
              <div className="mb-3 flex items-center gap-2">
                <Search className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Negative Keywords</Label>
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">Shopping</Badge>
                <InfoTip text="Exclude irrelevant Shopping queries to reduce wasted spend and improve traffic quality." />
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Add terms where your products should not appear (for example: free, used, DIY, repair).
              </p>
              <div className="mb-3 flex gap-2">
                <Input
                  placeholder="e.g. free, used, cheap, wholesale"
                  value={negKeywordInput}
                  onChange={(e) => setNegKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNegativeKeyword())}
                  className="h-9 flex-1 text-sm"
                />
                <Button size="sm" variant="outline" className="h-9 gap-1 text-xs" disabled={!negKeywordInput.trim()} onClick={addNegativeKeyword}>
                  <Plus className="size-3" /> Add
                </Button>
              </div>
              {aud.negativeKeywords.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {aud.negativeKeywords.map((k) => (
                    <TagPill key={k} label={k} onRemove={() => updateNested("audience", { negativeKeywords: aud.negativeKeywords.filter((s) => s !== k) })} />
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                {aud.negativeKeywords.length} negative keyword{aud.negativeKeywords.length !== 1 ? "s" : ""} added. Press Enter to add.
              </p>

              {/* Suggested negatives */}
              <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-foreground">Suggested negatives for Shopping</p>
                </div>
                <p className="mb-2 text-[10px] text-muted-foreground">Click to add. These prevent your Shopping ads from showing on low-intent or irrelevant searches, reducing wasted spend by 20-40%.</p>
                <div className="flex flex-wrap gap-1.5">
                  {["free", "used", "cheap", "wholesale", "DIY", "repair", "tutorial", "how to", "review", "compare", "alternative", "download", "pdf", "jobs", "career", "sample"].map((kw) => {
                    const alreadyAdded = aud.negativeKeywords.includes(kw);
                    return (
                      <button
                        key={kw}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => updateNested("audience", { negativeKeywords: [...aud.negativeKeywords, kw] })}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                          alreadyAdded
                            ? "border-primary/20 bg-primary/5 text-primary/50"
                            : "border-border bg-background text-foreground hover:border-primary/40"
                        )}
                      >
                        {alreadyAdded ? <CheckCircle2 className="mr-1 inline size-3" /> : <Plus className="mr-1 inline size-3" />}
                        {kw}
                      </button>
                    );
                  })}
                </div>
              </div>
            </SectionCard>
          )}

          {/* ---- 3c. Lookalike Segments (Demand Gen) ---- */}
          {isDemandGen && (
            <SectionCard>
              <div className="mb-3 flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Lookalike Segments</Label>
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">Demand Gen</Badge>
                <InfoTip text="Find new users similar to your best customers. Strong source lists usually improve quality." />
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Build lookalikes from your best first-party audiences to scale reach without losing relevance.
              </p>

              {/* Lookalike source segments */}
              <div className="mb-3">
                <Label className="mb-1.5 text-xs font-semibold text-foreground">Source Segments</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. All purchasers, High-value customers"
                    value={lookalikeInput}
                    onChange={(e) => setLookalikeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && lookalikeInput.trim()) {
                        e.preventDefault();
                        updateNested("audience", { lookalikeSegments: [...aud.lookalikeSegments, lookalikeInput.trim()] });
                        setLookalikeInput("");
                      }
                    }}
                    className="h-9 flex-1 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1 text-xs"
                    disabled={!lookalikeInput.trim()}
                    onClick={() => {
                      updateNested("audience", { lookalikeSegments: [...aud.lookalikeSegments, lookalikeInput.trim()] });
                      setLookalikeInput("");
                    }}
                  >
                    <Plus className="size-3" /> Add
                  </Button>
                </div>
                {aud.lookalikeSegments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {aud.lookalikeSegments.map((s) => (
                      <TagPill key={s} label={s} onRemove={() => updateNested("audience", { lookalikeSegments: aud.lookalikeSegments.filter((x) => x !== s) })} />
                    ))}
                  </div>
                )}
              </div>

              {/* Suggested sources from Salla */}
              <div className="mb-4 rounded-lg border border-border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium text-foreground">Salla Suggested Sources:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["All Purchasers (90 days)", "Repeat Buyers", "Cart Abandoners", "High-Value Customers (Top 20%)"].map((seg) => {
                    const added = aud.lookalikeSegments.includes(seg);
                    return (
                      <button
                        key={seg}
                        type="button"
                        disabled={added}
                        onClick={() => updateNested("audience", { lookalikeSegments: [...aud.lookalikeSegments, seg] })}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                          added ? "border-primary/20 bg-primary/5 text-primary/50" : "border-border bg-background text-foreground hover:border-primary/40"
                        )}
                      >
                        {added ? <CheckCircle2 className="mr-1 inline size-3" /> : <Plus className="mr-1 inline size-3" />}
                        {seg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expansion level */}
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  Expansion Level
                  <InfoTip text="Narrow = highest similarity, lower reach. Broad = wider reach, lower similarity. Start with Balanced." />
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "NARROW" as const, label: "Narrow", desc: "Most similar, smaller reach" },
                    { value: "BALANCED" as const, label: "Balanced", desc: "Recommended balance" },
                    { value: "BROAD" as const, label: "Broad", desc: "Wider reach, less precise" },
                  ]).map((lvl) => {
                    const isSelected = aud.lookalikeExpansion === lvl.value;
                    return (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => updateNested("audience", { lookalikeExpansion: lvl.value })}
                        className={cn(
                          "rounded-xl border-2 p-3 text-left transition-all",
                          isSelected ? "border-primary bg-primary/[0.04] shadow-sm" : "border-border bg-background hover:border-primary/40"
                        )}
                      >
                        <p className={cn("text-xs font-semibold", isSelected ? "text-primary" : "text-foreground")}>{lvl.label}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{lvl.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </SectionCard>
          )}

          {/* ---- 3d. Customer Match (Demand Gen) ---- */}
          {isDemandGen && (
            <SectionCard>
              <div className="mb-3 flex items-center gap-2">
                <UserPlus className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Customer Match Lists</Label>
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">Demand Gen</Badge>
                <InfoTip text="Use first-party customer lists (for example buyers, VIPs, subscribers) to improve targeting quality and seed lookalikes." />
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Add high-quality customer lists from Salla to retarget existing buyers and build stronger expansion audiences.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Newsletter subscribers, VIP customers"
                  value={customerMatchInput}
                  onChange={(e) => setCustomerMatchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customerMatchInput.trim()) {
                      e.preventDefault();
                      updateNested("audience", { customerMatchLists: [...aud.customerMatchLists, customerMatchInput.trim()] });
                      setCustomerMatchInput("");
                    }
                  }}
                  className="h-9 flex-1 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1 text-xs"
                  disabled={!customerMatchInput.trim()}
                  onClick={() => {
                    updateNested("audience", { customerMatchLists: [...aud.customerMatchLists, customerMatchInput.trim()] });
                    setCustomerMatchInput("");
                  }}
                >
                  <Plus className="size-3" /> Add
                </Button>
              </div>
              {aud.customerMatchLists.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {aud.customerMatchLists.map((s) => (
                    <TagPill key={s} label={s} onRemove={() => updateNested("audience", { customerMatchLists: aud.customerMatchLists.filter((x) => x !== s) })} />
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2">
                <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-primary">Salla tip:</span>{" "}
                  Customer Match + lookalike segments is a strong Demand Gen setup. Start with your top 20% buyers to find similar high-value shoppers.
                </p>
              </div>
            </SectionCard>
          )}

          {/* ---- 3e. Remarketing / RLSA (Search -- promoted to main) ---- */}
          {isSearch && (
            <SectionCard>
              <div className="mb-3 flex items-center gap-2">
                <UserPlus className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Remarketing Lists (RLSA)</Label>
                <Badge className="rounded-full bg-primary/10 px-1.5 py-0 text-[10px] text-primary">Recommended</Badge>
                <InfoTip text="RLSA lets you adjust bids for people who already visited your store and are searching again. High impact for Search efficiency." />
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Layer remarketing on top of keywords. In Observation mode, reach stays broad while you bid more for returning high-intent users.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {REMARKETING_AUDIENCES.map((rm) => {
                  const selected = aud.audienceSignals.includes(rm.id);
                  return (
                    <label
                      key={rm.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all",
                        selected ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
                      )}
                    >
                      <Checkbox checked={selected} onCheckedChange={() => updateNested("audience", { audienceSignals: toggleInArray(aud.audienceSignals, rm.id) })} />
                      <span className={cn("text-xs font-medium", selected ? "text-primary" : "text-foreground")}>{rm.name}</span>
                    </label>
                  );
                })}
              </div>
              {aud.audienceSignals.length > 0 && aud.audienceTargetingMode === "OBSERVATION" && (
                <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
                  <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <DollarSign className="size-3 text-primary" />
                    RLSA Bid Adjustments
                    <InfoTip text="Raise bids for strong audiences (for example cart abandoners), lower bids for weak audiences. Start gradually and review weekly." />
                  </Label>
                  <div className="flex flex-col gap-2">
                    {aud.audienceSignals.map((sigId) => {
                      const rm = REMARKETING_AUDIENCES.find((r) => r.id === sigId);
                      if (!rm) return null;
                      const adj = aud.audienceBidAdjustments[sigId] ?? 0;
                      return (
                        <div key={sigId} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
                          <span className="text-xs text-foreground truncate">{rm.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateNested("audience", { audienceBidAdjustments: { ...aud.audienceBidAdjustments, [sigId]: Math.max(-90, adj - 10) } })}
                              className="flex size-6 items-center justify-center rounded border border-border text-xs hover:bg-muted"
                            >-</button>
                            <span className={cn("w-12 text-center text-xs font-bold", adj > 0 ? "text-emerald-600" : adj < 0 ? "text-red-600" : "text-muted-foreground")}>
                              {adj > 0 ? `+${adj}%` : `${adj}%`}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateNested("audience", { audienceBidAdjustments: { ...aud.audienceBidAdjustments, [sigId]: Math.min(900, adj + 10) } })}
                              className="flex size-6 items-center justify-center rounded border border-border text-xs hover:bg-muted"
                            >+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2">
                <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-primary">Best practice:</span>{" "}
                  Add "Cart Abandoners" and "Product Page Viewers" with +30-50% bid adjustment. Past visitors convert 2-3x better when they re-search your keywords.
                </p>
              </div>
            </SectionCard>
          )}

          {/* ---- 3f. Display content targeting note (actual UI is in Step 3) ---- */}
          {isDisplay && (
            <SectionCard>
              <div className="mb-3 flex items-center gap-2">
                <Target className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Content Targeting</Label>
                <Badge className="rounded-full bg-primary/10 px-1.5 py-0 text-[10px] text-primary">Display</Badge>
                <InfoTip text="Content targeting (keywords, topics, placements) is configured in the Ad Design step alongside your Display ad creative." />
              </div>

              {/* Redirect note */}
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                <div className="flex items-start gap-2.5">
                  <Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Configured in Ad Design (Step 3)</p>
                    <p className="mt-0.5 text-[11px] text-blue-700 dark:text-blue-400">
                      Content targeting (contextual keywords, topics, and placements) is set per ad group in the Ad Design step. You&apos;ll configure where your Display ads appear alongside your ad creative.
                    </p>
                  </div>
                </div>
              </div>

              {/* Optimized Targeting — stays here (campaign-level) */}
              <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 size-4 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Optimized Targeting</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Let Google expand beyond your targeting to find users who are likely to convert. Recommended for Display campaigns.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={aud.optimizedTargeting}
                    onCheckedChange={(v) => updateNested("audience", { optimizedTargeting: v })}
                    className="mt-0.5"
                  />
                </div>
              </div>
            </SectionCard>
          )}


          {/* ---- 4. Salla Smart Features (shared; hidden for App) ---- */}
          {!isApp && (
          <>
          <SallaSmartFeaturesCard
            excludeRecentPurchasers={aud.excludeRecentConverters}
            onExcludeRecentPurchasersChange={(v) =>
              updateNested("audience", { excludeRecentConverters: v })
            }
            excludeRecentPurchasersDays={aud.excludeRecentConvertersDays}
            onExcludeRecentPurchasersDaysChange={(days) =>
              updateNested("audience", { excludeRecentConvertersDays: days })
            }
            lookalikeEnabled={aud.optimizedTargeting}
            onLookalikeEnabledChange={(v) =>
              updateNested("audience", { optimizedTargeting: v })
            }
            sallaAudienceCategory={aud.sallaAudienceCategory ?? ""}
            onSallaAudienceCategoryChange={(v) =>
              updateNested("audience", { sallaAudienceCategory: v })
            }
            accent="primary"
            showLookalike={!isSearch}
          />

          </>)}

          {/* ---- 5. Advanced Settings (collapsible, hidden for PMax) ---- */}
          {!isPMax && (<div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <ChevronDown className={cn("size-4 transition-transform", showAdvanced && "rotate-180")} />
              Advanced Settings
              <span className="ml-auto text-xs text-muted-foreground">{
                isShopping ? "Remarketing, device targeting" :
                isSearch ? "Device bid adjustments, demographics" :
                "Remarketing and device targeting"
              }</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 flex flex-col gap-4">

                {/* Remarketing (hidden for Search -- promoted to main card above) */}
                {!isSearch && !isPMax && <SectionCard>
                  <div className="mb-3 flex items-center gap-2">
                    <UserPlus className="size-4 text-primary" />
                    <Label className="text-sm font-semibold text-foreground">Your Data (Remarketing)</Label>
                    {isPMax && <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">Optional signal</Badge>}
                    <InfoTip text={isPMax
                      ? "Use your first-party data as signals. Maps to AssetGroupSignal.audience."
                      : "Retarget people who have interacted with your store."
                    } />
                  </div>
                  {isPMax ? (
                    <ObjectiveExplainer
                      className="mb-3"
                      highlight={
                        <>
                          <span className="font-semibold text-primary">Simple setup:</span> start with <strong>Purchasers</strong> + <strong>Cart Abandoners</strong> if your budget is limited.
                        </>
                      }
                      secondary="Use 2-3 high-intent lists at launch, then expand once conversion volume is stable."
                    />
                  ) : (
                    <p className="mb-3 text-xs text-muted-foreground">
                      Select audiences to retarget with your ads.
                    </p>
                  )}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {REMARKETING_AUDIENCES.map((rm) => {
                      const selected = aud.audienceSignals.includes(rm.id);
                      const meta = REMARKETING_AUDIENCE_META[rm.id];
                      return (
                        <label
                          key={rm.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all",
                            selected ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
                          )}
                        >
                          <Checkbox checked={selected} onCheckedChange={() => updateNested("audience", { audienceSignals: toggleInArray(aud.audienceSignals, rm.id) })} />
                          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                            <span className={cn("truncate text-xs font-medium", selected ? "text-primary" : "text-foreground")}>{rm.name}</span>
                            {meta && (
                              <span className="flex shrink-0 items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-full px-1.5 py-0 text-[9px]",
                                    meta.intent === "High intent" ? "border-emerald-300 text-emerald-700" :
                                      meta.intent === "Mid intent" ? "border-amber-300 text-amber-700" :
                                        "border-border text-muted-foreground"
                                  )}
                                >
                                  {meta.intent}
                                </Badge>
                                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">{meta.freshness}</Badge>
                                {meta.starter && <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">Starter</Badge>}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {isPMax && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      PMax treats these lists as signals to guide learning, not strict delivery limits.
                    </p>
                  )}
                </SectionCard>}

                {/* Device Targeting (Search: Desktop/Mobile/Tablet with bid adjustments) */}
                {isSearch ? (
                  <SectionCard>
                    <div className="mb-3 flex items-center gap-2">
                      <Smartphone className="size-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">Device Bid Adjustments</Label>
                      <InfoTip text="Tune bids by device performance. Use small changes first, and avoid large swings without enough data." />
                    </div>
                    <p className="mb-3 text-xs text-muted-foreground">
                      0% keeps default bids. Increase top-performing devices; reduce weak ones.
                    </p>
                    <div className="flex flex-col gap-2">
                      {([
                        { type: "DESKTOP" as SearchDeviceType, label: "Desktop", icon: Monitor },
                        { type: "MOBILE" as SearchDeviceType, label: "Mobile", icon: Smartphone },
                        { type: "TABLET" as SearchDeviceType, label: "Tablet", icon: Tablet },
                      ]).map((device) => {
                        const adj = aud.searchDeviceBidAdjustments[device.type] ?? 0;
                        const DeviceIcon = device.icon;
                        return (
                          <div key={device.type} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <DeviceIcon className="size-4 text-muted-foreground" />
                              <span className="text-xs font-medium text-foreground">{device.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateNested("audience", { searchDeviceBidAdjustments: { ...aud.searchDeviceBidAdjustments, [device.type]: Math.max(-100, adj - 10) } })}
                                className="flex size-6 items-center justify-center rounded border border-border text-xs hover:bg-muted"
                              >-</button>
                              <span className={cn("w-14 text-center text-xs font-bold", adj > 0 ? "text-emerald-600" : adj < 0 ? "text-red-600" : "text-muted-foreground")}>
                                {adj === -100 ? "OFF" : adj > 0 ? `+${adj}%` : `${adj}%`}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateNested("audience", { searchDeviceBidAdjustments: { ...aud.searchDeviceBidAdjustments, [device.type]: Math.min(900, adj + 10) } })}
                                className="flex size-6 items-center justify-center rounded border border-border text-xs hover:bg-muted"
                              >+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">-100% disables the device. Range: -100% to +900%.</p>
                  </SectionCard>
                ) : !isPMax ? (
                  /* Non-Search: OS-level Device Targeting (unified) */
                  <DeviceTargetingCard
                    value={aud.operatingSystems ?? []}
                    onChange={(ids) =>
                      updateNested("audience", { operatingSystems: ids })
                    }
                    accent="primary"
                    infoTipText="Choose which devices to target. Both selected is recommended."
                  />
                ) : null}

                {/* Household Income & Parental Status (Search) */}
                {isSearch && (
                  <SectionCard>
                    <div className="mb-3 flex items-center gap-2">
                      <Users className="size-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">Advanced Demographics</Label>
                      <InfoTip text="Optional filters for Search only. Use after baseline performance is stable to avoid over-restricting reach." />
                    </div>

                    {/* Household Income */}
                    <div className="mb-4">
                      <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <DollarSign className="size-3 text-primary" />
                        Household Income
                      </Label>
                      <p className="mb-2 text-[11px] text-muted-foreground">Use this only if your product clearly matches specific income tiers.</p>
                      <div className="flex flex-wrap gap-1.5">
                        {HOUSEHOLD_INCOME_TIERS.map((tier) => {
                          const selected = aud.householdIncome.includes(tier.id);
                          return (
                            <button
                              key={tier.id}
                              type="button"
                              onClick={() => updateNested("audience", { householdIncome: toggleInArray(aud.householdIncome, tier.id) })}
                              className={cn(
                                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background text-foreground hover:border-primary/40"
                              )}
                            >
                              {tier.label}
                            </button>
                          );
                        })}
                      </div>
                      {aud.householdIncome.length === 0 && (
                        <p className="mt-1 text-[10px] text-muted-foreground">None selected. All income levels are targeted.</p>
                      )}
                    </div>

                    {/* Parental Status */}
                    <div>
                      <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        Parental Status
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {PARENTAL_STATUS_OPTIONS.map((opt) => {
                          const selected = aud.parentalStatus.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => updateNested("audience", { parentalStatus: toggleInArray(aud.parentalStatus, opt.id) })}
                              className={cn(
                                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background text-foreground hover:border-primary/40"
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      {aud.parentalStatus.length === 0 && (
                        <p className="mt-1 text-[10px] text-muted-foreground">None selected. All parental statuses are targeted.</p>
                      )}
                    </div>
                  </SectionCard>
                )}
              </div>
            )}
          </div>)}
          </>)}

        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN                                                  */}
        {/* ============================================================ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="sticky top-20 flex flex-col gap-4">

            {/* Map + Audience Estimate (merged) */}
            <LocationReachCard
              countryCount={aud.locationIds.length}
              countries={aud.locationIds}
              cityCount={(aud.cityIds ?? []).length}
              cities={selectedCities}
            />

            {/* Delivery Check (shared) */}
            <DeliveryCheckCard
              issues={deliveryIssues}
              cityCount={(aud.cityIds ?? []).length}
              accent="primary"
            />

            <AudienceReadinessChecklist
              checks={bestPracticeChecks}
              title="Best-practice checklist"
              accent="primary"
              successMessage="Best-practice checks look good for launch."
            />

            {/* Targeting Summary (shared) */}
            <TargetingSummaryCard
              title="Targeting Summary"
              accent="primary"
              rows={targetingSummaryRows}
            />

            {/* Map is now inside LocationReachCard above */}

            {/* ---- Campaign-type specific cards (after summary) ---- */}

            {/* Product Inventory (Shopping) */}
            {isShopping && (
              <SectionCard className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ShoppingBag className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Product Inventory</Label>
                  <Badge className="rounded-full bg-primary px-2 py-0 text-xs text-primary-foreground">Salla</Badge>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/30 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-foreground">1,247</p>
                    <p className="text-[11px] text-muted-foreground">Active Products</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-foreground">12</p>
                    <p className="text-[11px] text-muted-foreground">Categories</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
                    <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                    <span className="text-xs text-emerald-700">Feed synced to Merchant Center</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
                    <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                    <span className="text-xs text-emerald-700">1,198 products approved</span>
                  </div>
                  {aud.negativeKeywords.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
                      <Search className="size-3 shrink-0 text-primary" />
                      <span className="text-xs text-primary">{aud.negativeKeywords.length} negative keyword{aud.negativeKeywords.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Audience Reach (Demand Gen) */}
            {isDemandGen && (
              <SectionCard className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Eye className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Audience Reach</Label>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/30 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-foreground">2.4M</p>
                    <p className="text-[11px] text-muted-foreground">Est. Weekly Reach</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-foreground">6</p>
                    <p className="text-[11px] text-muted-foreground">Channels Active</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {aud.lookalikeSegments.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
                      <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                      <span className="text-xs text-emerald-700">{aud.lookalikeSegments.length} lookalike segment{aud.lookalikeSegments.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {aud.customerMatchLists.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
                      <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                      <span className="text-xs text-emerald-700">{aud.customerMatchLists.length} customer match list{aud.customerMatchLists.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
                    <Target className="size-3 shrink-0 text-primary" />
                    <span className="text-xs text-primary">Optimized targeting: {aud.optimizedTargeting ? "On" : "Off"}</span>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Demand Gen reaches users across YouTube, Discover, and Gmail. Add lookalike segments for better scaling.
                </p>
              </SectionCard>
            )}

            {/* Keyword Summary (Search) */}
            {isSearch && (
              <SectionCard className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Search className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Keyword Summary</Label>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/30 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-foreground">{searchKeywords.length}</p>
                    <p className="text-[11px] text-muted-foreground">Keywords</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-foreground">{searchNegKeywords.length}</p>
                    <p className="text-[11px] text-muted-foreground">Negatives</p>
                  </div>
                </div>
                {searchKeywords.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {(["BROAD", "PHRASE", "EXACT"] as const).map((mt) => {
                      const count = searchKeywords.filter((k) => k.matchType === mt).length;
                      if (count === 0) return null;
                      const label = mt === "BROAD" ? "Broad" : mt === "PHRASE" ? "Phrase" : "Exact";
                      return (
                        <div key={mt} className="flex items-center justify-between rounded-lg border border-border bg-background px-2.5 py-1.5">
                          <span className="text-xs text-muted-foreground">{label}</span>
                          <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
                {searchKeywords.length === 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                    <AlertCircle className="size-3 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-700">Add keywords to start.</p>
                  </div>
                )}
                {searchKeywords.length > 0 && searchKeywords.length < 10 && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-2.5 py-1.5">
                    <TrendingUp className="mt-0.5 size-3 shrink-0 text-primary" />
                    <p className="text-[10px] text-muted-foreground">
                      <span className="font-medium text-primary">Tip:</span> Google recommends 10-20 keywords per ad group for optimal coverage.
                    </p>
                  </div>
                )}
              </SectionCard>
            )}

            {/* Signal Strength (PMax) */}
            {isPMax && (
              <SectionCard className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Signal Strength</Label>
                  <Badge variant="secondary" className="rounded-full text-[10px]">PMax</Badge>
                </div>
                <div className="mb-2">
                  <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full transition-all", signalBarColor)} style={{ width: `${signalBarWidth}%` }} />
                  </div>
                  <p className={cn("text-xs font-medium", signalColor)}>{signalStrength}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {signalCount} signal{signalCount !== 1 ? "s" : ""} added. Internal guidance score: more quality signals usually help PMax learn faster.
                </p>
              </SectionCard>
            )}
          </div>
        </div>

      </div>
      <WizardStepFooter
        onPrevious={() => setStep(0)}
        onNext={() => setStep(2)}
        nextLabel="Next"
        nextDisabled={!canProceed}
        accent="primary"
      />
    </TooltipProvider>
  );
}
