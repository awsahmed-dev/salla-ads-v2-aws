"use client";

import { useState, useMemo } from "react";
import { useGoogleCampaign } from "@/lib/google/campaign-context";
import { OBJECTIVE_CONFIGS } from "@/lib/google/campaign-types";
import { buildGoogleCampaignPayloadV23 } from "@/lib/google/payload-v23";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
import { CouponCodeCard } from "@/components/shared/coupon-code-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  AlertCircle,
  Rocket,
  ChevronDown,
  Zap,
  Users,
  DollarSign,
  Layers,
  Wallet,
  Tag,
  PartyPopper,
  Pencil,
  Plus,
  Globe,
  Calendar,
  Target,
  CreditCard,
  Copy,
  Save,
  Code2,
  ArrowLeft,
  ShieldCheck,
  ShoppingCart,
  Store,
  FolderTree,
  Search,
  Type,
  FileText,
  ExternalLink,
  Lock,
  CircleDollarSign,
  Smartphone,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function ReviewRow({ label, value, warn }: { label: string; value: React.ReactNode; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className={cn("text-xs", warn ? "text-amber-600" : "text-muted-foreground")}>{label}</span>
      <span className={cn("text-right text-xs font-medium", warn ? "text-amber-600" : "text-foreground")}>{value}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, step, setStep }: {
  icon: React.ElementType;
  title: string;
  step: number;
  setStep: (s: number) => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
      </div>
      <button
        type="button"
        onClick={() => setStep(step)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
      >
        <Pencil className="size-3" />
        Edit
      </button>
    </div>
  );
}

/* Country code to name */
const COUNTRY_MAP: Record<string, string> = {
  SA: "Saudi Arabia", AE: "UAE", KW: "Kuwait", BH: "Bahrain",
  OM: "Oman", QA: "Qatar", EG: "Egypt", JO: "Jordan", IQ: "Iraq",
};

const BIDDING_LABELS: Record<string, string> = {
  MAXIMIZE_CONVERSIONS: "Maximize Conversions",
  MAXIMIZE_CONVERSION_VALUE: "Maximize Conversion Value",
  TARGET_CPA: "Target CPA",
  TARGET_CPC: "Target CPC",
  TARGET_ROAS: "Target ROAS",
  MANUAL_CPC: "Manual CPC",
};

const CONVERSION_LABELS: Record<string, string> = {
  PURCHASE: "Purchase",
  ADD_TO_CART: "Add to Cart",
  BEGIN_CHECKOUT: "Begin Checkout",
  SIGN_UP: "Sign Up",
  PAGE_VIEW: "Page View",
  LEAD: "Lead",
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function GoogleStepReview() {
  const { campaign, setStep, reset } = useGoogleCampaign();
  const { objective, audience, budget, creative } = campaign;
  const objConfig = OBJECTIVE_CONFIGS[objective.objective] ?? OBJECTIVE_CONFIGS.PERFORMANCE_MAX;
  const isShopping = objective.objective === "SHOPPING";
  const isPMax = objective.objective === "PERFORMANCE_MAX";
  const isRetailPMax = isPMax && objective.feedEnabled;
  const isDemandGen = objective.objective === "DEMAND_GEN";
  const isSearch = objective.objective === "SEARCH";
  const isDisplay = objective.objective === "DISPLAY";
  const isApp = objective.objective === "APP";
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showLaunchConfirm, setShowLaunchConfirm] = useState(false);
  const [savedAsDraft, setSavedAsDraft] = useState(false);
  const [showApiJson, setShowApiJson] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "credit">("wallet");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");

  const isCreditEligible = true;
  const walletBalance = 1200;
  const creditLimit = 5000;
  const creditUsed = 1800;
  const creditAvailable = creditLimit - creditUsed;

  /* ---- Computed ---- */
  const durationDays = useMemo(() => {
    if (budget.startDate && budget.endDate) {
      return Math.max(1, Math.ceil((new Date(budget.endDate).getTime() - new Date(budget.startDate).getTime()) / 86400000));
    }
    return 30;
  }, [budget.startDate, budget.endDate]);

  const totalBudget = budget.amount * durationDays + (budget.performanceBoost ? 149 : 0);
  const dailyAmount = budget.amount;
  const autoIncrease = budget.autoIncrease ?? { enabled: false, pct: 20, intervalDays: 7, maxDailyBudget: budget.amount * 3 };
  const autoIncreaseAvailable = !budget.endDateOptional;
  const projectedTotalSpend = useMemo(() => {
    if (!autoIncrease.enabled || !autoIncreaseAvailable) return dailyAmount * durationDays;
    let total = 0;
    let currentDaily = dailyAmount;
    for (let d = 1; d <= durationDays; d++) {
      total += Math.min(currentDaily, autoIncrease.maxDailyBudget);
      const stepIndex = Math.floor(d / autoIncrease.intervalDays);
      if (d % autoIncrease.intervalDays === 0 && d < durationDays) {
        currentDaily = Math.round(dailyAmount * Math.pow(1 + autoIncrease.pct / 100, stepIndex));
      }
    }
    return total;
  }, [dailyAmount, durationDays, autoIncrease, autoIncreaseAvailable]);
  const totalBudgetBase = projectedTotalSpend;
  const boostAmount = budget.performanceBoost ? 149 : 0;
  const couponDiscount = appliedCouponCode ? 50 : 0;
  const preVat = totalBudgetBase + boostAmount - couponDiscount;
  const vat = Math.round(preVat * 0.15);
  const totalWithVat = preVat + vat;
  const walletInsufficient = paymentMethod === "wallet" && totalWithVat > walletBalance;
  const creditInsufficient = paymentMethod === "credit" && totalWithVat > creditAvailable;
  const fundsInsufficient = walletInsufficient || creditInsufficient;
  const shortfall = paymentMethod === "wallet"
    ? Math.max(0, totalWithVat - walletBalance)
    : Math.max(0, totalWithVat - creditAvailable);
  const firstGroup = creative.assetGroups?.[0];
  const filledHeadlines = firstGroup?.headlines?.filter((h: { text?: string }) => (h.text ?? "").trim().length > 0).length ?? 0;
  const filledDescriptions = firstGroup?.descriptions?.filter((d: { text?: string }) => (d.text ?? "").trim().length > 0).length ?? 0;
  const retailListingMode = creative.retailListingMode ?? "ALL";
  const retailListingValues = creative.retailListingValues ?? [];
  const retailListingSummary =
    retailListingMode === "ALL"
      ? "All products"
      : `${retailListingMode === "CATEGORY" ? "Categories" : retailListingMode === "BRAND" ? "Brands" : "Custom labels"}: ${
          retailListingValues.length > 0 ? retailListingValues.length : "All other"
        }`;

  /* ---- Validation ---- */
  const checks = useMemo(() => {
    const list: { id: string; label: string; ok: boolean; detail?: string; step?: number }[] = [];

    list.push({
      id: "name",
      label: "Campaign name set",
      ok: !!objective.campaignName.trim(),
      detail: objective.campaignName || "Missing",
      step: 0,
    });

    list.push({
      id: "conversion",
      label: "Conversion tracking configured",
      ok: objective.tagMode !== "none",
      detail: objective.tagMode === "salla_managed" ? "Salla Managed" : objective.conversionId ? "Connected" : "Not set",
      step: 0,
    });

    list.push({
      id: "location",
      label: "Target location selected",
      ok: audience.locationIds.length > 0,
      detail: audience.locationIds.map((c: string) => COUNTRY_MAP[c] || c).join(", ") || "None",
      step: 1,
    });

    list.push({
      id: "budget",
      label: "Budget set",
      ok:
        objective.objective === "DEMAND_GEN" && budget.demandGenBudgetMode === "TOTAL"
          ? budget.demandGenTotalAmount >= 100
          : budget.amount >= 10,
      detail:
        objective.objective === "DEMAND_GEN" && budget.demandGenBudgetMode === "TOTAL"
          ? `SAR ${budget.demandGenTotalAmount} total`
          : `SAR ${budget.amount}/day`,
      step: 2,
    });

    if (isShopping) {
      list.push({
        id: "merchant_center",
        label: "Merchant Center connected",
        ok: objective.merchantCenterConnected || !!objective.merchantCenterId,
        detail: objective.merchantCenterConnected || objective.merchantCenterId ? "Connected" : "Missing",
        step: 0,
      });
      list.push({
        id: "shopping_priority",
        label: "Campaign priority configured",
        ok: [0, 1, 2].includes(objective.shoppingSettings?.campaignPriority),
        detail: `Priority: ${objective.shoppingSettings?.campaignPriority ?? "not set"}`,
        step: 0,
      });
      list.push({
        id: "shopping_product_groups",
        label: "Product groups configured",
        ok: !!creative.productGroupRoot,
        detail: creative.productGroupRoot ? (creative.productGroupRoot.type === "SUBDIVISION" ? `${creative.productGroupRoot.children.length} groups` : "All products") : "Missing",
        step: 3,
      });
      list.push({
        id: "shopping_negative_kw",
        label: "Negative keywords added (recommended)",
        ok: (creative.negativeKeywords?.length ?? 0) > 0 || (audience.negativeKeywords?.length ?? 0) > 0,
        detail: `${(creative.negativeKeywords?.length ?? 0) + (audience.negativeKeywords?.length ?? 0)} keywords`,
        step: 1,
      });
    }

    if (isSearch) {
      const searchGroup = creative.searchAdGroups?.[0];
      const searchAd = searchGroup?.ads?.[0];
      const searchHeadlines = searchAd?.headlines?.filter((h: { text?: string }) => h.text?.trim()).length ?? 0;
      const searchDescriptions = searchAd?.descriptions?.filter((d: { text?: string }) => d.text?.trim()).length ?? 0;
      list.push({
        id: "search_ad_group",
        label: "Min 1 ad group with min 1 keyword",
        ok: (creative.searchAdGroups?.length ?? 0) >= 1 && (searchGroup?.keywords?.length ?? 0) >= 1,
        detail: `${creative.searchAdGroups?.length ?? 0} ad groups, ${searchGroup?.keywords?.length ?? 0} keywords`,
        step: 3,
      });
      list.push({
        id: "assets",
        label: "RSA has min 3 headlines, 2 descriptions",
        ok: searchHeadlines >= 3 && searchDescriptions >= 2,
        detail: `${searchHeadlines} headlines, ${searchDescriptions} descriptions`,
        step: 3,
      });
      list.push({
        id: "search_final_url",
        label: "Final URL set per RSA",
        ok: !!searchAd?.finalUrl?.trim(),
        detail: searchAd?.finalUrl?.trim() || "Missing",
        step: 3,
      });
    } else if (isApp) {
      const appAd = creative.appAds?.[0];
      const appHeadlines = appAd?.headlines?.filter((h: { text?: string }) => h.text?.trim()).length ?? 0;
      const appDescriptions = appAd?.descriptions?.filter((d: { text?: string }) => d.text?.trim()).length ?? 0;
      list.push({
        id: "app_id",
        label: "App ID set",
        ok: !!objective.appSettings?.appId?.trim(),
        detail: objective.appSettings?.appId?.trim() || "Missing",
        step: 0,
      });
      list.push({
        id: "app_store",
        label: "App store selected",
        ok: !!objective.appSettings?.appStore,
        detail: objective.appSettings?.appStore === "GOOGLE_APP_STORE" ? "Google Play" : objective.appSettings?.appStore === "APPLE_APP_STORE" ? "Apple App Store" : "Not selected",
        step: 0,
      });
      list.push({
        id: "app_mandatory_text",
        label: "Mandatory ad text filled",
        ok: !!appAd?.mandatoryAdText?.trim(),
        detail: appAd?.mandatoryAdText?.trim() ? "Set" : "Missing",
        step: 3,
      });
      list.push({
        id: "assets",
        label: "App ad has minimum assets",
        ok: appHeadlines >= 1 && appDescriptions >= 1,
        detail: `${appHeadlines} headlines, ${appDescriptions} descriptions`,
        step: 3,
      });
    } else if (isDisplay) {
      const displayGroup = creative.displayAdGroups?.[0];
      const displayAd = displayGroup?.ads?.[0];
      const dHeadlines = displayAd?.headlines?.filter((h: { text?: string }) => h.text?.trim()).length ?? 0;
      const dDescriptions = displayAd?.descriptions?.filter((d: { text?: string }) => d.text?.trim()).length ?? 0;
      const dLandscapeImages = displayAd?.images?.filter((i: { url?: string }) => i.url?.trim()).length ?? 0;
      const dSquareImages = displayAd?.squareImages?.filter((i: { url?: string }) => i.url?.trim()).length ?? 0;

      list.push({
        id: "display_ad_group",
        label: "Min 1 ad group",
        ok: (creative.displayAdGroups?.length ?? 0) >= 1,
        detail: `${creative.displayAdGroups?.length ?? 0} ad groups`,
        step: 3,
      });
      list.push({
        id: "display_long_headline",
        label: "Long headline set",
        ok: !!displayAd?.longHeadline?.trim(),
        detail: displayAd?.longHeadline?.trim() ? "Set" : "Missing",
        step: 3,
      });
      list.push({
        id: "display_text_assets",
        label: "Min 1 headline + 1 description",
        ok: dHeadlines >= 1 && dDescriptions >= 1,
        detail: `${dHeadlines} headlines, ${dDescriptions} descriptions`,
        step: 3,
      });
      list.push({
        id: "display_images",
        label: "Min 1 image (landscape or square)",
        ok: dLandscapeImages >= 1 || dSquareImages >= 1,
        detail: `${dLandscapeImages} landscape, ${dSquareImages} square`,
        step: 3,
      });
      list.push({
        id: "display_business_name",
        label: "Business name set",
        ok: !!displayAd?.businessName?.trim(),
        detail: displayAd?.businessName?.trim() || "Missing",
        step: 3,
      });
      list.push({
        id: "display_final_url",
        label: "Final URL set",
        ok: !!displayAd?.finalUrl?.trim(),
        detail: displayAd?.finalUrl?.trim() || "Missing",
        step: 3,
      });
      list.push({
        id: "display_targeting",
        label: "Content targeting configured (recommended)",
        ok: (displayGroup?.contentKeywords?.length ?? 0) > 0 || (displayGroup?.topics?.length ?? 0) > 0 || (displayGroup?.placements?.length ?? 0) > 0,
        detail: `${displayGroup?.contentKeywords?.length ?? 0} keywords, ${displayGroup?.topics?.length ?? 0} topics, ${displayGroup?.placements?.length ?? 0} placements`,
        step: 3,
      });
    } else if (isDemandGen) {
      const dgAdGroups = creative.demandGenAdGroups ?? [];
      const dgFirstGroup = dgAdGroups[0];
      const dgFirstAd = dgFirstGroup?.ads?.[0];
      const dgAdsCount = dgAdGroups.reduce((sum: number, ag: { ads?: unknown[] }) => sum + (ag.ads?.length ?? 0), 0);
      const dgHeadlines = dgFirstAd?.headlines?.filter((h: { text?: string }) => (h.text ?? "").trim().length > 0).length ?? 0;
      const dgDescriptions = dgFirstAd?.descriptions?.filter((d: { text?: string }) => (d.text ?? "").trim().length > 0).length ?? 0;

      list.push({
        id: "dg_ad_group",
        label: "Min 1 ad group with min 1 ad",
        ok: dgAdGroups.length >= 1 && dgAdsCount >= 1,
        detail: `${dgAdGroups.length} ad groups, ${dgAdsCount} ads`,
        step: 3,
      });
      list.push({
        id: "dg_business_name",
        label: "Business name set (max 25 chars)",
        ok: !!dgFirstAd?.businessName?.trim() && (dgFirstAd?.businessName?.length ?? 0) <= 25,
        detail: dgFirstAd?.businessName?.trim()
          ? `${dgFirstAd.businessName} (${dgFirstAd.businessName.length} chars)`
          : "Missing",
        step: 3,
      });
      list.push({
        id: "dg_headlines",
        label: "Headlines filled (max 40 chars each)",
        ok: dgHeadlines >= 1,
        detail: `${dgHeadlines} headlines`,
        step: 3,
      });
      list.push({
        id: "dg_descriptions",
        label: "Descriptions filled",
        ok: dgDescriptions >= 1,
        detail: `${dgDescriptions} descriptions`,
        step: 3,
      });
      if (dgFirstAd?.adType === "MULTI_ASSET") {
        list.push({
          id: "dg_images",
          label: "Min 1 image per multi-asset ad",
          ok: (dgFirstAd?.images?.length ?? 0) >= 1,
          detail: `${dgFirstAd?.images?.length ?? 0} images`,
          step: 3,
        });
      }
      if (dgFirstAd?.adType === "CAROUSEL") {
        const filledCards = dgFirstAd?.carouselCards?.filter((c: { headline?: string; cardUrl?: string }) => c.headline?.trim() && c.cardUrl?.trim()).length ?? 0;
        list.push({
          id: "dg_carousel_cards",
          label: "Min 2 carousel cards with headlines + URLs",
          ok: filledCards >= 2,
          detail: `${filledCards} complete cards`,
          step: 3,
        });
      }
      list.push({
        id: "dg_logo",
        label: "Logo set per ad",
        ok: (dgFirstAd?.logos?.length ?? 0) >= 1,
        detail: `${dgFirstAd?.logos?.length ?? 0} logos`,
        step: 3,
      });
    } else if (!isShopping) {
      /* ---- PMax (and other non-Shopping objectives that use asset groups) ---- */
      const assetGroups = creative.assetGroups ?? [];
      const agCount = assetGroups.length;

      list.push({
        id: "pmax_asset_groups",
        label: "At least 1 asset group",
        ok: agCount >= 1,
        detail: `${agCount} asset groups`,
        step: 3,
      });

      list.push({
        id: "assets",
        label: "Asset group has min 3 headlines, 1 long headline, 2 descriptions",
        ok:
          filledHeadlines >= 3 &&
          filledDescriptions >= 2 &&
          (firstGroup?.longHeadlines?.filter((h: { text?: string }) => (h.text ?? "").trim().length > 0).length ?? 0) >= 1,
        detail: `${filledHeadlines} headlines, ${firstGroup?.longHeadlines?.filter((h: { text?: string }) => (h.text ?? "").trim().length > 0).length ?? 0} long headlines, ${filledDescriptions} descriptions`,
        step: 3,
      });

      list.push({
        id: "pmax_images",
        label: "Min 1 landscape image + 1 square image + 1 logo",
        ok:
          (firstGroup?.images?.filter((i: { url?: string }) => i.url?.trim()).length ?? 0) >= 1 &&
          (firstGroup?.logos?.filter((l: { url?: string }) => l.url?.trim()).length ?? 0) >= 1,
        detail: `${firstGroup?.images?.filter((i: { url?: string }) => i.url?.trim()).length ?? 0} images, ${firstGroup?.logos?.filter((l: { url?: string }) => l.url?.trim()).length ?? 0} logos`,
        step: 3,
      });

      list.push({
        id: "pmax_business_name",
        label: "Business name set",
        ok: !!firstGroup?.businessName?.trim(),
        detail: firstGroup?.businessName?.trim() || "Missing",
        step: 3,
      });

      list.push({
        id: "pmax_final_url",
        label: "Final URL set",
        ok: !!firstGroup?.finalUrl?.trim(),
        detail: firstGroup?.finalUrl?.trim() || "Missing",
        step: 3,
      });

      if (isRetailPMax) {
        list.push({
          id: "listing_groups",
          label: "Listing groups configured",
          ok: !!creative.productGroupRoot,
          detail: retailListingSummary,
          step: 3,
        });
      }
    }

    if (isSearch) {
      const hasFinalUrlAutomation = budget.assetAutomationSettings.some(
        (entry) =>
          entry.type === "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION" &&
          entry.status === "OPTED_IN"
      );
      list.push({
        id: "ai_max_compat",
        label: "AI Max compatibility",
        ok: !hasFinalUrlAutomation || budget.aiMaxSettings.enableAiMax,
        detail:
          !hasFinalUrlAutomation || budget.aiMaxSettings.enableAiMax
            ? "Compatible"
            : "Enable AI Max or disable final URL text automation",
        step: 2,
      });
    }

    return list;
  }, [objective, audience, budget, creative, filledHeadlines, filledDescriptions, isSearch, isApp, isPMax, isRetailPMax, isDisplay, isDemandGen, isShopping, firstGroup, retailListingSummary]);

  const allPassed = checks.every((c) => c.ok);
  const passedCount = checks.filter((c) => c.ok).length;
  const criticalFails = checks.filter((c) => !c.ok);

  const warnObjective = criticalFails.some((c) => c.step === 0);
  const warnAudience = criticalFails.some((c) => c.step === 1);
  const warnBudget = criticalFails.some((c) => c.step === 2);
  const warnCreative = criticalFails.some((c) => c.step === 3);

  const locationLabel = audience.locationIds.map((c: string) => COUNTRY_MAP[c] || c).join(", ") || "None";
  const languageLabel =
    audience.languages?.length > 0
      ? audience.languages.map((l: string) => (l === "ar" ? "Arabic" : l === "en" ? "English" : l)).join(", ")
      : "All languages";
  const scheduleLabel = budget.startDate
    ? budget.endDate
      ? `${budget.startDate} → ${budget.endDate}`
      : `${budget.startDate} (ongoing)`
    : "Not set";
  const conversionGoalLabel = CONVERSION_LABELS[budget.conversionGoal] || budget.conversionGoal;
  const objectiveChips = [
    objConfig.label,
    objective.campaignName || "Unnamed",
    objective.tagMode === "none" ? "Tracking missing" : "Tracking ready",
    isPMax ? (objective.feedEnabled ? "Retail PMax" : "Standard PMax") : undefined,
  ].filter(Boolean);
  const audienceChips = [
    audience.locationIds.length ? `${audience.locationIds.length} locations` : "No locations",
    languageLabel,
    isSearch
      ? `${(audience.inMarketSegments?.length ?? 0) + (audience.affinitySegments?.length ?? 0)} segments`
      : `${audience.searchThemes?.length ?? 0} search themes`,
    !isSearch ? (audience.optimizedTargeting ? "Optimized on" : "Optimized off") : undefined,
  ].filter(Boolean);
  const budgetChips = [
    objective.objective === "DEMAND_GEN" && budget.demandGenBudgetMode === "TOTAL"
      ? `SAR ${budget.demandGenTotalAmount} total`
      : `SAR ${budget.amount}/day`,
    BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy,
    conversionGoalLabel ? `Goal: ${conversionGoalLabel}` : undefined,
    scheduleLabel,
  ].filter(Boolean);
  const creativeChips = isPMax
    ? [
        `${filledHeadlines} headlines`,
        `${filledDescriptions} descriptions`,
        `${firstGroup?.images?.length ?? 0} images`,
        `${firstGroup?.logos?.length ?? 0} logos`,
        `${firstGroup?.videos?.length ?? 0} videos`,
        isRetailPMax ? retailListingSummary : undefined,
      ].filter(Boolean)
    : [
        isSearch
          ? `${creative.searchAdGroups?.length ?? 0} ad groups`
          : isDisplay
            ? `${creative.displayAdGroups?.length ?? 0} groups`
            : isDemandGen
              ? `${creative.demandGenAdGroups?.length ?? 0} groups`
              : isApp
                ? `${creative.appAds?.length ?? 0} ads`
                : "Creative",
      ];
  const assetAutomationSummary = (() => {
    const entries = budget.assetAutomationSettings ?? [];
    const offCount = entries.filter((e: { status: string }) => e.status === "OPTED_OUT").length;
    return offCount > 0 ? `${offCount} disabled` : "All on";
  })();

  const pmaxSections = [
    {
      id: 0,
      title: "Objective & Tracking",
      step: 0,
      warn: warnObjective,
      chips: objectiveChips,
      rows: (
        <>
          <ReviewRow label="Campaign Type" value={objConfig.label} />
          <ReviewRow label="Campaign Name" value={objective.campaignName || "Not set"} warn={!objective.campaignName} />
          <ReviewRow
            label="Conversion Tracking"
            value={
              objective.tagMode === "salla_managed"
                ? "Salla Managed (Auto)"
                : objective.conversionId
                  ? `ID: ${objective.conversionId}`
                  : "Not configured"
            }
            warn={objective.tagMode === "none"}
          />
          <ReviewRow label="PMax Mode" value={objective.feedEnabled ? "Retail (Catalog)" : "Standard"} />
          <ReviewRow
            label="Merchant Center"
            value={objective.merchantCenterConnected || objective.merchantCenterId ? (objective.merchantCenterId ? `ID: ${objective.merchantCenterId}` : "Connected") : "Not connected"}
            warn={objective.feedEnabled && !(objective.merchantCenterConnected || objective.merchantCenterId)}
          />
        </>
      ),
    },
    {
      id: 1,
      title: "Audience Signals",
      step: 1,
      warn: warnAudience,
      chips: audienceChips,
      rows: (
        <>
          <ReviewRow label="Locations" value={locationLabel} warn={audience.locationIds.length === 0} />
          <ReviewRow label="Languages" value={languageLabel} />
          <ReviewRow
            label="Search Themes"
            value={
              audience.searchThemes?.length > 0
                ? `${audience.searchThemes.length} theme${audience.searchThemes.length !== 1 ? "s" : ""}`
                : "None"
            }
          />
          <ReviewRow
            label="Custom Segments"
            value={
              ((audience.customSegmentKeywords?.length ?? 0) + (audience.customSegmentUrls?.length ?? 0)) > 0
                ? `${audience.customSegmentKeywords?.length ?? 0} keywords, ${audience.customSegmentUrls?.length ?? 0} URLs`
                : "None"
            }
          />
          <ReviewRow label="Optimized Targeting" value={audience.optimizedTargeting ? "Enabled" : "Disabled"} />
        </>
      ),
    },
    {
      id: 2,
      title: "Budget & Bidding",
      step: 2,
      warn: warnBudget,
      chips: budgetChips,
      rows: (
        <>
          <ReviewRow label="Daily Budget" value={`SAR ${budget.amount}`} />
          <ReviewRow label="Bidding Strategy" value={BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy} />
          {budget.biddingStrategy === "TARGET_CPA" && (
            <ReviewRow label="Target CPA" value={`SAR ${budget.targetCpa}`} />
          )}
          {budget.biddingStrategy === "TARGET_ROAS" && (
            <ReviewRow label="Target ROAS" value={`${budget.targetRoas}%`} />
          )}
          <ReviewRow label="Conversion Goal" value={conversionGoalLabel} />
          <ReviewRow label="Schedule" value={scheduleLabel} />
          <ReviewRow label="URL Expansion" value={budget.urlExpansionOptOut ? "Disabled" : "Enabled"} />
          <ReviewRow label="Brand Guidelines" value={budget.brandGuidelinesEnabled ? "Enabled" : "Disabled"} />
          <ReviewRow label="Asset Automation" value={assetAutomationSummary} />
          <ReviewRow label="Salla Performance Boost" value={budget.performanceBoost ? "SAR 149/mo" : "Off"} />
        </>
      ),
    },
    {
      id: 3,
      title: "Creative & Assets",
      step: 3,
      warn: warnCreative,
      chips: creativeChips,
      rows: (
        <>
          <ReviewRow label="Asset Groups" value={`${creative.assetGroups?.length ?? 0} group${(creative.assetGroups?.length ?? 0) !== 1 ? "s" : ""}`} />
          {firstGroup && (
            <>
              <ReviewRow label="Final URL" value={firstGroup.finalUrl || "Not set"} warn={!firstGroup.finalUrl} />
              {isRetailPMax && (
                <ReviewRow label="Listing Groups" value={retailListingSummary} />
              )}
              <ReviewRow label="Headlines" value={`${filledHeadlines} filled`} warn={filledHeadlines < 3} />
              <ReviewRow label="Long Headlines" value={`${firstGroup.longHeadlines?.filter((h: { text?: string }) => (h.text ?? "").trim()).length ?? 0} filled`} />
              <ReviewRow label="Descriptions" value={`${filledDescriptions} filled`} warn={filledDescriptions < 2} />
              <ReviewRow label="Images" value={`${firstGroup.images?.length ?? 0} uploaded`} />
              <ReviewRow label="Logos" value={`${firstGroup.logos?.length ?? 0} uploaded`} />
              <ReviewRow label="Videos" value={`${firstGroup.videos?.length ?? 0} linked`} />
              <ReviewRow label="Business Name" value={firstGroup.businessName || "Not set"} />
              <ReviewRow label="CTA" value={firstGroup.callToAction === "AUTOMATED" ? "Automated" : firstGroup.callToAction ?? "Not set"} />
            </>
          )}
        </>
      ),
    },
  ];

  const searchSections = (() => {
    const searchGroup = creative.searchAdGroups?.[0];
    const searchAd = searchGroup?.ads?.[0];
    const searchHeadlineCount = searchAd?.headlines?.filter((h: { text?: string }) => h.text?.trim()).length ?? 0;
    const searchDescCount = searchAd?.descriptions?.filter((d: { text?: string }) => d.text?.trim()).length ?? 0;

    const aiAutomationRows = (() => {
      const automationEntries = budget.assetAutomationSettings ?? [];
      const getStatus = (type: string) => {
        const entry = automationEntries.find((e: { type: string }) => e.type === type);
        return entry?.status ?? "OPTED_IN";
      };
      const types = ["TEXT_ASSET_AUTOMATION", "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION", "GENERATE_IMAGE_ENHANCEMENT"];
      const labels: Record<string, string> = {
        TEXT_ASSET_AUTOMATION: "Text Generation",
        FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION: "URL Text Generation",
        GENERATE_IMAGE_ENHANCEMENT: "Image Enhancement",
      };
      return { types, labels, getStatus };
    })();

    return [
      {
        id: 0,
        title: "Objective & Tracking",
        step: 0,
        warn: warnObjective,
        chips: objectiveChips,
        rows: (
          <>
            <ReviewRow label="Campaign Type" value={objConfig.label} />
            <ReviewRow label="Campaign Name" value={objective.campaignName || "Not set"} warn={!objective.campaignName} />
            <ReviewRow
              label="Conversion Tracking"
              value={
                objective.tagMode === "salla_managed"
                  ? "Salla Managed (Auto)"
                  : objective.conversionId
                    ? `ID: ${objective.conversionId}`
                    : "Not configured"
              }
              warn={objective.tagMode === "none"}
            />
            {(objective.merchantCenterConnected || objective.merchantCenterId) && (
              <ReviewRow label="Merchant Center" value={objective.merchantCenterId ? `ID: ${objective.merchantCenterId}` : "Connected"} />
            )}
          </>
        ),
      },
      {
        id: 1,
        title: "Audience & Targeting",
        step: 1,
        warn: warnAudience,
        chips: audienceChips,
        rows: (
          <>
            <ReviewRow label="Locations" value={locationLabel} warn={audience.locationIds.length === 0} />
            <ReviewRow label="Languages" value={languageLabel} />
            <ReviewRow label="Audience Mode" value={audience.audienceTargetingMode === "TARGETING" ? "Targeting (restricted)" : "Observation (recommended)"} />
            <ReviewRow label="Audience Segments" value={
              (audience.inMarketSegments?.length ?? 0) + (audience.affinitySegments?.length ?? 0) > 0
                ? `${(audience.inMarketSegments?.length ?? 0) + (audience.affinitySegments?.length ?? 0)} segments`
                : "None"
            } />
            <ReviewRow label="RLSA Lists" value={
              audience.audienceSignals?.length > 0
                ? `${audience.audienceSignals.length} list${audience.audienceSignals.length !== 1 ? "s" : ""}`
                : "None"
            } />
            <ReviewRow label="Search Partners" value={audience.searchPartners !== false ? "Enabled" : "Disabled"} />
            <ReviewRow label="Ad Schedule" value={
              audience.adScheduleEntries?.length > 0
                ? `${audience.adScheduleEntries.length} entr${audience.adScheduleEntries.length !== 1 ? "ies" : "y"}`
                : "24/7 (all day)"
            } />
            {audience.householdIncome?.length > 0 && (
              <ReviewRow label="Household Income" value={`${audience.householdIncome.length} tier${audience.householdIncome.length !== 1 ? "s" : ""}`} />
            )}
            {audience.parentalStatus?.length > 0 && (
              <ReviewRow label="Parental Status" value={audience.parentalStatus.join(", ")} />
            )}
          </>
        ),
      },
      {
        id: 2,
        title: "Budget & Bidding",
        step: 2,
        warn: warnBudget,
        chips: budgetChips,
        rows: (
          <>
            <ReviewRow label="Daily Budget" value={`SAR ${budget.amount}`} />
            <ReviewRow label="Bidding Strategy" value={BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy} />
            {budget.biddingStrategy === "TARGET_CPA" && (
              <ReviewRow label="Target CPA" value={`SAR ${budget.targetCpa}`} />
            )}
            {budget.biddingStrategy === "TARGET_ROAS" && (
              <ReviewRow label="Target ROAS" value={`${budget.targetRoas}%`} />
            )}
            <ReviewRow label="Conversion Goal" value={conversionGoalLabel} />
            <ReviewRow label="Schedule" value={
              budget.endDate && !budget.endDateOptional
                ? `${budget.startDate ?? "Today"} to ${budget.endDate}`
                : `${budget.startDate ?? "Today"} (No end date)`
            } />
            <ReviewRow label="URL Expansion" value={budget.urlExpansionOptOut ? "Disabled" : "Enabled"} />
            <ReviewRow label="Salla Performance Boost" value={budget.performanceBoost ? "SAR 149/mo" : "Off"} />
          </>
        ),
      },
      {
        id: 4,
        title: "AI Features",
        step: 2,
        warn: false,
        chips: [
          assetAutomationSummary,
          budget.aiMaxSettings?.enableAiMax ? "AI Max on" : "AI Max off",
        ],
        rows: (
          <>
            <p className="mb-1 text-[10px] font-semibold text-muted-foreground">Campaign Asset Automation</p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {aiAutomationRows.types.map((type) => {
                const isOn = aiAutomationRows.getStatus(type) === "OPTED_IN";
                return (
                  <Badge key={type} variant="secondary" className={cn("rounded-full px-2 py-0.5 text-[9px]", isOn ? "border-primary/30 bg-primary/10 text-primary" : "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400")}>
                    {isOn ? "ON" : "OFF"}: {aiAutomationRows.labels[type] ?? type}
                  </Badge>
                );
              })}
            </div>
            <div className="border-t border-border pt-2">
              <ReviewRow label="AI Max for Search" value={budget.aiMaxSettings?.enableAiMax ? "Enabled" : "Disabled"} />
              {budget.aiMaxSettings?.enableAiMax && (
                <>
                  {budget.aiMaxSettings.brandInclusions?.length > 0 && (
                    <ReviewRow label="Brand Inclusions" value={budget.aiMaxSettings.brandInclusions.join(", ")} />
                  )}
                  {budget.aiMaxSettings.brandExclusions?.length > 0 && (
                    <ReviewRow label="Brand Exclusions" value={budget.aiMaxSettings.brandExclusions.join(", ")} />
                  )}
                  {budget.aiMaxSettings.urlInclusions?.length > 0 && (
                    <ReviewRow label="URL Restrictions" value={budget.aiMaxSettings.urlInclusions.join(", ")} />
                  )}
                </>
              )}
            </div>
          </>
        ),
      },
      {
        id: 3,
        title: "Search Ads",
        step: 3,
        warn: warnCreative,
        chips: creativeChips,
        rows: (
          <>
            <ReviewRow label="Ad Groups" value={`${creative.searchAdGroups?.length ?? 0}`} />
            {(creative.searchAdGroups ?? []).map((ag: { id: string; name: string; keywords: { text: string; matchType: string }[]; negativeKeywords: { text: string }[]; ads: { id: string; name: string; headlines: { text: string }[]; descriptions: { text: string }[]; finalUrl: string; displayPath1: string; displayPath2: string }[] }, gi: number) => (
              <div key={ag.id} className={cn("mt-2 rounded-lg border border-border p-3", gi > 0 && "mt-2")}>
                <p className="mb-1.5 text-xs font-semibold text-foreground">{ag.name || `Ad Group ${gi + 1}`}</p>
                <ReviewRow label="Keywords" value={`${ag.keywords?.length ?? 0} (${["BROAD", "PHRASE", "EXACT"].map((mt) => {
                  const c = ag.keywords?.filter((k: { matchType: string }) => k.matchType === mt).length ?? 0;
                  return c > 0 ? `${c} ${mt.toLowerCase()}` : null;
                }).filter(Boolean).join(", ") || "none"})`} />
                <ReviewRow label="Negative Keywords" value={`${ag.negativeKeywords?.length ?? 0}`} />
                <ReviewRow label="RSA Ads" value={`${ag.ads?.length ?? 0}`} />
                {(ag.ads ?? []).map((ad, ai: number) => {
                  const hCount = ad.headlines?.filter((h) => h.text?.trim()).length ?? 0;
                  const dCount = ad.descriptions?.filter((d) => d.text?.trim()).length ?? 0;
                  return (
                    <div key={ad.id} className="ml-2 mt-1 border-l-2 border-primary/20 pl-2">
                      <p className="text-[11px] font-medium text-foreground">{ad.name || `RSA ${ai + 1}`}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {hCount}/15 headlines, {dCount}/4 descriptions
                        {ad.finalUrl ? ` | ${ad.finalUrl}` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
            {/* Extensions summary */}
            {(creative.sitelinkExtensions?.length > 0 || creative.calloutExtensions?.length > 0 || creative.structuredSnippetExtensions?.length > 0) && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1 text-xs font-semibold text-foreground">Ad Extensions</p>
                {creative.sitelinkExtensions?.length > 0 && (
                  <ReviewRow label="Sitelinks" value={`${creative.sitelinkExtensions.length}`} />
                )}
                {creative.calloutExtensions?.length > 0 && (
                  <ReviewRow label="Callouts" value={creative.calloutExtensions.map((c: { text: string }) => c.text).filter(Boolean).join(", ") || `${creative.calloutExtensions.length}`} />
                )}
                {creative.structuredSnippetExtensions?.length > 0 && (
                  <ReviewRow label="Structured Snippets" value={`${creative.structuredSnippetExtensions.length}`} />
                )}
              </div>
            )}
          </>
        ),
      },
    ];
  })();

  const shoppingSections = useMemo(() => {
    const sections = [];

    // 1. Objective & Merchant Center
    sections.push({
      id: 0,
      title: "Objective & Merchant Center",
      step: 0,
      warn: warnObjective || (!objective.merchantCenterConnected && !objective.merchantCenterId),
      chips: [objConfig.label, objective.campaignName].filter(Boolean),
      rows: (
        <>
          <ReviewRow label="Campaign Type" value="Shopping" />
          <ReviewRow label="Campaign Name" value={objective.campaignName || "Not set"} warn={!objective.campaignName} />
          <ReviewRow label="Conversion Tracking" value={objective.tagMode === "salla_managed" ? "Salla Managed (Auto)" : objective.conversionId ? `ID: ${objective.conversionId}` : "Not configured"} warn={objective.tagMode === "none"} />
          <ReviewRow label="Merchant Center" value={objective.merchantCenterConnected || objective.merchantCenterId ? "Connected" : "Not connected"} warn={!objective.merchantCenterConnected && !objective.merchantCenterId} />
          <ReviewRow label="Campaign Priority" value={objective.shoppingSettings?.campaignPriority === 2 ? "High" : objective.shoppingSettings?.campaignPriority === 1 ? "Medium" : "Low"} />
          {objective.shoppingSettings?.feedLabel && <ReviewRow label="Feed Label" value={objective.shoppingSettings.feedLabel} />}
          <ReviewRow label="Local Inventory" value={objective.shoppingSettings?.enableLocal ? "Enabled" : "Disabled"} />
        </>
      ),
    });

    // 2. Audience & Targeting
    sections.push({
      id: 1,
      title: "Audience & Targeting",
      step: 1,
      warn: warnAudience,
      chips: [
        audience.locationIds.map((c: string) => COUNTRY_MAP[c] || c).join(", ") || "No locations",
        audience.languages?.length > 0 ? audience.languages.map((l: string) => l === "ar" ? "Arabic" : l === "en" ? "English" : l).join(", ") : "All",
      ],
      rows: (
        <>
          <ReviewRow label="Locations" value={audience.locationIds.map((c: string) => COUNTRY_MAP[c] || c).join(", ") || "None"} warn={audience.locationIds.length === 0} />
          <ReviewRow label="Languages" value={audience.languages?.length > 0 ? audience.languages.map((l: string) => l === "ar" ? "Arabic" : l === "en" ? "English" : l).join(", ") : "All"} />
          <ReviewRow label="Negative Keywords" value={(audience.negativeKeywords?.length ?? 0) > 0 ? `${audience.negativeKeywords.length} keywords` : "None"} />
          <ReviewRow label="Optimized Targeting" value={audience.optimizedTargeting ? "Enabled" : "Disabled"} />
        </>
      ),
    });

    // 3. Budget & Bidding
    sections.push({
      id: 2,
      title: "Budget & Bidding",
      step: 2,
      warn: warnBudget,
      chips: [`SAR ${budget.amount}/day`, BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy, `Goal: ${CONVERSION_LABELS[budget.conversionGoal] || budget.conversionGoal}`],
      rows: (
        <>
          <ReviewRow label="Daily Budget" value={`SAR ${budget.amount}`} />
          <ReviewRow label="Bidding Strategy" value={BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy} />
          {budget.biddingStrategy === "TARGET_ROAS" && <ReviewRow label="Target ROAS" value={`${budget.targetRoas}%`} />}
          {budget.biddingStrategy === "TARGET_CPA" && <ReviewRow label="Target CPA" value={`SAR ${budget.targetCpa}`} />}
          <ReviewRow label="Conversion Goal" value={CONVERSION_LABELS[budget.conversionGoal] || budget.conversionGoal} />
          <ReviewRow label="Schedule" value={budget.endDate && !budget.endDateOptional ? `${budget.startDate ?? "Today"} to ${budget.endDate}` : `${budget.startDate ?? "Today"} (No end date)`} />
          <ReviewRow label="Performance Boost" value={budget.performanceBoost ? "SAR 149/mo" : "Off"} />
        </>
      ),
    });

    // 4. Product Groups
    sections.push({
      id: 3,
      title: "Product Groups",
      step: 3,
      warn: warnCreative || !creative.productGroupRoot,
      chips: [
        creative.productGroupRoot
          ? (creative.productGroupRoot.type === "SUBDIVISION"
            ? `${creative.productGroupRoot.children.length} groups`
            : "All products")
          : "Not configured",
      ],
      rows: (
        <>
          <ReviewRow label="Ad Type" value="Shopping Product Ads (auto-generated from feed)" />
          <ReviewRow label="Product Source" value="Merchant Center Feed (synced from Salla)" />
          <ReviewRow label="Product Groups" value={
            creative.productGroupRoot
              ? (creative.productGroupRoot.type === "SUBDIVISION"
                ? (() => {
                    const included = creative.productGroupRoot.children.filter((c: { type: string; dimensionValue?: string }) => c.type === "UNIT_INCLUDED" && c.dimensionValue).length;
                    const excluded = creative.productGroupRoot.children.filter((c: { type: string }) => c.type === "UNIT_EXCLUDED").length;
                    return `${included} included, ${excluded} excluded`;
                  })()
                : "All products (no subdivision)")
              : "Not configured"
          } warn={!creative.productGroupRoot} />
          <ReviewRow label="Negative Keywords" value={
            (creative.negativeKeywords?.length ?? 0) + (audience.negativeKeywords?.length ?? 0) > 0
              ? `${(creative.negativeKeywords?.length ?? 0) + (audience.negativeKeywords?.length ?? 0)} keywords`
              : "None (recommended to add)"
          } />
        </>
      ),
    });

    return sections;
  }, [objective, audience, budget, creative, objConfig, warnObjective, warnAudience, warnBudget, warnCreative]);

  const displaySections = useMemo(() => {
    const sections: { id: number; title: string; step: number; warn: boolean; chips: string[]; rows: React.ReactNode }[] = [];

    // 1. Objective & Tracking
    sections.push({
      id: 0,
      title: "Objective & Tracking",
      step: 0,
      warn: warnObjective,
      chips: ["Display", objective.campaignName || "Unnamed", objective.tagMode === "none" ? "Tracking missing" : "Tracking ready"],
      rows: (
        <>
          <ReviewRow label="Campaign Type" value="Display" />
          <ReviewRow label="Campaign Name" value={objective.campaignName || "Not set"} warn={!objective.campaignName} />
          <ReviewRow
            label="Conversion Tracking"
            value={
              objective.tagMode === "salla_managed"
                ? "Salla Managed (Auto)"
                : objective.conversionId
                  ? `ID: ${objective.conversionId}`
                  : "Not configured"
            }
            warn={objective.tagMode === "none"}
          />
        </>
      ),
    });

    // 2. Audience & Targeting
    const contentKeywordsCount = creative.displayAdGroups?.reduce((sum: number, g: { contentKeywords?: unknown[] }) => sum + (g.contentKeywords?.length ?? 0), 0) ?? 0;
    const topicsCount = creative.displayAdGroups?.reduce((sum: number, g: { topics?: unknown[] }) => sum + (g.topics?.length ?? 0), 0) ?? 0;
    const placementsCount = creative.displayAdGroups?.reduce((sum: number, g: { placements?: unknown[] }) => sum + (g.placements?.length ?? 0), 0) ?? 0;

    sections.push({
      id: 1,
      title: "Audience & Targeting",
      step: 1,
      warn: warnAudience,
      chips: [
        locationLabel || "No locations",
        languageLabel,
        audience.optimizedTargeting ? "Optimized on" : "Optimized off",
        `${contentKeywordsCount} keywords, ${topicsCount} topics, ${placementsCount} placements`,
      ],
      rows: (
        <>
          <ReviewRow label="Locations" value={locationLabel} warn={audience.locationIds.length === 0} />
          <ReviewRow label="Languages" value={languageLabel} />
          <ReviewRow label="Optimized Targeting" value={audience.optimizedTargeting ? "Enabled" : "Disabled"} />
          <ReviewRow label="Content Targeting" value={
            contentKeywordsCount + topicsCount + placementsCount > 0
              ? `${contentKeywordsCount} keywords, ${topicsCount} topics, ${placementsCount} placements`
              : "None configured"
          } warn={contentKeywordsCount + topicsCount + placementsCount === 0} />
        </>
      ),
    });

    // 3. Budget & Bidding
    sections.push({
      id: 2,
      title: "Budget & Bidding",
      step: 2,
      warn: warnBudget,
      chips: [
        `SAR ${budget.amount}/day`,
        BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy,
        `Goal: ${CONVERSION_LABELS[budget.conversionGoal] || budget.conversionGoal}`,
        scheduleLabel,
      ],
      rows: (
        <>
          <ReviewRow label="Daily Budget" value={`SAR ${budget.amount}`} />
          <ReviewRow label="Bidding Strategy" value={BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy} />
          {budget.biddingStrategy === "TARGET_CPA" && <ReviewRow label="Target CPA" value={`SAR ${budget.targetCpa}`} />}
          {budget.biddingStrategy === "TARGET_ROAS" && <ReviewRow label="Target ROAS" value={`${budget.targetRoas}%`} />}
          <ReviewRow label="Conversion Goal" value={CONVERSION_LABELS[budget.conversionGoal] || budget.conversionGoal} />
          <ReviewRow label="Schedule" value={
            budget.endDate && !budget.endDateOptional
              ? `${budget.startDate ?? "Today"} to ${budget.endDate}`
              : `${budget.startDate ?? "Today"} (No end date)`
          } />
          <ReviewRow label="Performance Boost" value={budget.performanceBoost ? "SAR 149/mo" : "Off"} />
        </>
      ),
    });

    // 4. Display Ads
    sections.push({
      id: 3,
      title: "Display Ads",
      step: 3,
      warn: warnCreative,
      chips: [`${creative.displayAdGroups?.length ?? 0} ad groups`],
      rows: (
        <>
          <ReviewRow label="Ad Groups" value={`${creative.displayAdGroups?.length ?? 0}`} />
          {(creative.displayAdGroups ?? []).map((ag: { id: string; name: string; contentKeywords?: unknown[]; topics?: unknown[]; placements?: unknown[]; excludedPlacements?: unknown[]; ads?: { id: string; name: string; headlines?: { text?: string }[]; descriptions?: { text?: string }[]; longHeadline?: string; images?: unknown[]; squareImages?: unknown[]; logos?: unknown[]; squareLogos?: unknown[]; businessName?: string; finalUrl?: string }[] }, gi: number) => (
            <div key={ag.id} className={cn("mt-2 rounded-lg border border-border p-3", gi > 0 && "mt-2")}>
              <p className="mb-1.5 text-xs font-semibold text-foreground">{ag.name || `Ad Group ${gi + 1}`}</p>
              <ReviewRow label="RDA Ads" value={`${ag.ads?.length ?? 0}`} />
              {(ag.ads ?? []).map((ad, ai: number) => {
                const hCount = ad.headlines?.filter((h) => h.text?.trim()).length ?? 0;
                const dCount = ad.descriptions?.filter((d) => d.text?.trim()).length ?? 0;
                const imgCount = (ad.images?.length ?? 0) + (ad.squareImages?.length ?? 0);
                return (
                  <div key={ad.id} className="ml-2 mt-1 border-l-2 border-primary/20 pl-2">
                    <p className="text-[11px] font-medium text-foreground">{ad.name || `RDA ${ai + 1}`}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {hCount}/5 headlines, {dCount}/5 descriptions
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {imgCount} images | Business: {ad.businessName?.trim() || "missing"}
                    </p>
                    {ad.finalUrl && (
                      <p className="text-[10px] text-muted-foreground">{ad.finalUrl}</p>
                    )}
                  </div>
                );
              })}
              <div className="mt-2 border-t border-border/60 pt-1.5">
                <p className="text-[10px] text-muted-foreground">
                  Content: {ag.contentKeywords?.length ?? 0} keywords, {ag.topics?.length ?? 0} topics, {ag.placements?.length ?? 0} placements
                </p>
              </div>
            </div>
          ))}
        </>
      ),
    });

    return sections;
  }, [objective, audience, budget, creative, warnObjective, warnAudience, warnBudget, warnCreative, locationLabel, languageLabel, scheduleLabel]);

  const demandGenSections = useMemo(() => {
    const dgAdGroups = creative.demandGenAdGroups ?? [];
    const dgFirstGroup = dgAdGroups[0];
    const dgFirstAd = dgFirstGroup?.ads?.[0];

    const sections: { id: number; title: string; step: number; warn: boolean; chips: string[]; rows: React.ReactNode }[] = [];

    // 1. Objective & Tracking
    sections.push({
      id: 0,
      title: "Objective & Tracking",
      step: 0,
      warn: warnObjective,
      chips: ["Demand Gen", objective.campaignName || "Unnamed", objective.tagMode === "none" ? "Tracking missing" : "Tracking ready"],
      rows: (
        <>
          <ReviewRow label="Campaign Type" value="Demand Gen" />
          <ReviewRow label="Campaign Name" value={objective.campaignName || "Not set"} warn={!objective.campaignName} />
          <ReviewRow
            label="Conversion Tracking"
            value={
              objective.tagMode === "salla_managed"
                ? "Salla Managed (Auto)"
                : objective.conversionId
                  ? `ID: ${objective.conversionId}`
                  : "Not configured"
            }
            warn={objective.tagMode === "none"}
          />
        </>
      ),
    });

    // 2. Audience & Targeting
    sections.push({
      id: 1,
      title: "Audience & Targeting",
      step: 1,
      warn: warnAudience,
      chips: [
        locationLabel || "No locations",
        languageLabel,
        audience.lookalikeSegments?.length > 0 ? `${audience.lookalikeSegments.length} lookalike` : undefined,
        audience.customerMatchLists?.length > 0 ? `${audience.customerMatchLists.length} customer match` : undefined,
        audience.optimizedTargeting ? "Optimized on" : "Optimized off",
      ].filter(Boolean) as string[],
      rows: (
        <>
          <ReviewRow label="Locations" value={locationLabel} warn={audience.locationIds.length === 0} />
          <ReviewRow label="Languages" value={languageLabel} />
          <ReviewRow label="Lookalike Segments" value={
            audience.lookalikeSegments?.length > 0
              ? `${audience.lookalikeSegments.length} segment${audience.lookalikeSegments.length !== 1 ? "s" : ""} (${audience.lookalikeExpansion ?? "NARROW"})`
              : "None"
          } />
          <ReviewRow label="Customer Match" value={
            audience.customerMatchLists?.length > 0
              ? `${audience.customerMatchLists.length} list${audience.customerMatchLists.length !== 1 ? "s" : ""}`
              : "None"
          } />
          <ReviewRow label="Optimized Targeting" value={audience.optimizedTargeting ? "Enabled" : "Disabled"} />
        </>
      ),
    });

    // 3. Budget & Bidding
    sections.push({
      id: 2,
      title: "Budget & Bidding",
      step: 2,
      warn: warnBudget,
      chips: [
        budget.demandGenBudgetMode === "TOTAL"
          ? `SAR ${budget.demandGenTotalAmount} total`
          : `SAR ${budget.amount}/day`,
        BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy,
        `Goal: ${CONVERSION_LABELS[budget.conversionGoal] || budget.conversionGoal}`,
        scheduleLabel,
      ],
      rows: (
        <>
          <ReviewRow label="Budget Mode" value={budget.demandGenBudgetMode === "TOTAL" ? "Total Budget" : "Daily Budget"} />
          <ReviewRow label="Amount" value={
            budget.demandGenBudgetMode === "TOTAL"
              ? `SAR ${budget.demandGenTotalAmount}`
              : `SAR ${budget.amount}/day`
          } />
          <ReviewRow label="Bidding Strategy" value={BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy} />
          {budget.biddingStrategy === "TARGET_CPA" && <ReviewRow label="Target CPA" value={`SAR ${budget.targetCpa}`} />}
          {budget.biddingStrategy === "TARGET_ROAS" && <ReviewRow label="Target ROAS" value={`${budget.targetRoas}%`} />}
          <ReviewRow label="Conversion Goal" value={CONVERSION_LABELS[budget.conversionGoal] || budget.conversionGoal} />
          <ReviewRow label="Schedule" value={
            budget.endDate && !budget.endDateOptional
              ? `${budget.startDate ?? "Today"} to ${budget.endDate}`
              : `${budget.startDate ?? "Today"} (No end date)`
          } />
          <ReviewRow label="Performance Boost" value={budget.performanceBoost ? "SAR 149/mo" : "Off"} />
        </>
      ),
    });

    // 4. Demand Gen Ads
    const dgAdsCount = dgAdGroups.reduce((sum: number, ag: { ads?: unknown[] }) => sum + (ag.ads?.length ?? 0), 0);
    sections.push({
      id: 3,
      title: "Demand Gen Ads",
      step: 3,
      warn: warnCreative,
      chips: [`${dgAdGroups.length} ad groups`, `${dgAdsCount} ads`],
      rows: (
        <>
          <ReviewRow label="Ad Groups" value={`${dgAdGroups.length}`} />
          {dgAdGroups.map((ag, gi: number) => (
            <div key={ag.id} className={cn("mt-2 rounded-lg border border-border p-3", gi > 0 && "mt-2")}>
              <p className="mb-1.5 text-xs font-semibold text-foreground">{ag.name || `Ad Group ${gi + 1}`}</p>
              <ReviewRow label="Channels" value={
                Object.entries(ag.channelControls ?? {})
                  .filter(([, v]) => v)
                  .map(([k]) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s: string) => s.toUpperCase()))
                  .join(", ") || "None"
              } />
              <ReviewRow label="Ads" value={`${ag.ads.length}`} />
              {ag.ads.map((ad, ai: number) => {
                const hCount = ad.headlines?.filter((h) => h.text?.trim()).length ?? 0;
                const dCount = ad.descriptions?.filter((d) => d.text?.trim()).length ?? 0;
                const formatLabel = ad.adType === "MULTI_ASSET" ? "Multi-Asset" : ad.adType === "CAROUSEL" ? "Carousel" : "Video Responsive";
                return (
                  <div key={ad.id} className="ml-2 mt-1 border-l-2 border-primary/20 pl-2">
                    <p className="text-[11px] font-medium text-foreground">{ad.name || `Ad ${ai + 1}`}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatLabel} | {hCount} headlines, {dCount} descriptions
                      {ad.adType === "MULTI_ASSET" && ` | ${ad.images?.length ?? 0} images`}
                      {ad.adType === "CAROUSEL" && ` | ${ad.carouselCards?.filter((c) => c.headline?.trim()).length ?? 0} cards`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Business: {ad.businessName?.trim() || "missing"}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </>
      ),
    });

    return sections;
  }, [objective, audience, budget, creative, warnObjective, warnAudience, warnBudget, warnCreative, locationLabel, languageLabel, scheduleLabel]);

  const reviewSections = isSearch ? searchSections : isShopping ? shoppingSections : isDisplay ? displaySections : isDemandGen ? demandGenSections : pmaxSections;

  /* ---- API JSON ---- */
  const apiJson = useMemo(
    () => buildGoogleCampaignPayloadV23(campaign),
    [campaign]
  );

  const jsonString = JSON.stringify(apiJson, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => {
      setLaunching(false);
      setLaunched(true);
      setShowLaunchConfirm(false);
    }, 2500);
  };
  const handleSaveDraft = () => {
    setSavedAsDraft(true);
    setTimeout(() => setSavedAsDraft(false), 3000);
  };

  /* ---- Launched state ---- */
  if (launched) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-20 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="size-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Campaign Launched!</h2>
        <p className="text-sm text-muted-foreground">
          Your Google Ads Performance Max campaign <span className="font-semibold text-foreground">{objective.campaignName}</span> has been submitted for review.
          Google typically reviews ads within 1-2 business days.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => { reset(); setLaunched(false); }}>Create Another Campaign</Button>
          <Button className="gap-1.5" onClick={() => setShowApiJson(true)}>
            <Code2 className="size-3.5" /> View API Response
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      {(isPMax || isSearch || isShopping || isDisplay || isDemandGen) && (
        <div className={cn("flex flex-col gap-6 lg:flex-row lg:items-start", WIZARD_FOOTER_PADDING_BOTTOM)}>
          {/* ============ LEFT COLUMN ============ */}
          <div className="flex flex-1 flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Review & Launch</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Review your {objConfig.label} campaign settings below. Expand any section to see details or edit.
              </p>
            </div>

            {criticalFails.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-800">
                    {criticalFails.length} {criticalFails.length === 1 ? "issue needs" : "issues need"} attention before launching
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {criticalFails.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => c.step !== undefined && setStep(c.step)}
                        className="rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-100"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Wins Optimization Tips */}
            {isSearch && (() => {
              const searchGroup = campaign.creative.searchAdGroups[0];
              const headlineCount = searchGroup?.ads[0]?.headlines?.filter((h: { text: string }) => h.text.trim()).length ?? 0;
              const negCount = searchGroup?.negativeKeywords?.length ?? 0;
              const sitelinkCount = campaign.creative.sitelinkExtensions.length;
              const calloutCount = campaign.creative.calloutExtensions.length;
              const aiMaxOn = campaign.budget.aiMaxSettings.enableAiMax;
              const tips = [
                headlineCount < 10 && { text: `Add ${10 - headlineCount} more headlines (you have ${headlineCount}/15 — Google recommends 10+)`, step: 3 },
                negCount === 0 && { text: `Add negative keywords (0 added — prevents wasted spend on irrelevant searches)`, step: 1 },
                !aiMaxOn && { text: `Enable AI Max for Search (auto-expands keyword reach with Google AI)`, step: 2 },
                sitelinkCount === 0 && { text: `Add sitelinks (0/6 — boosts CTR by up to 15%)`, step: 3 },
                calloutCount === 0 && { text: `Add callouts (0/10 — highlights key benefits like "Free Shipping")`, step: 3 },
              ].filter(Boolean) as { text: string; step: number }[];
              if (tips.length === 0) return null;
              return (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                  <div className="mb-2.5 flex items-center gap-2">
                    <Zap className="size-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Quick wins before launch</p>
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px] text-blue-600">{tips.length} suggestions</Badge>
                  </div>
                  <div className="space-y-2">
                    {tips.map((tip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setStep(tip.step)}
                        className="flex w-full items-start gap-2 rounded-lg border border-blue-100 bg-white/70 p-2.5 text-left transition-colors hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
                      >
                        <div className="mt-0.5 size-4 shrink-0 rounded-full border border-blue-300" />
                        <p className="text-[11px] text-blue-800 dark:text-blue-300">{tip.text}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {isShopping && (() => {
              const negCount = (creative.negativeKeywords?.length ?? 0) + (audience.negativeKeywords?.length ?? 0);
              const hasProductGroups = creative.productGroupRoot?.type === "SUBDIVISION";
              const tips = [
                negCount === 0 && { text: "Add negative keywords to reduce wasted spend on irrelevant searches (saves 20-40% budget)", step: 1 },
                !hasProductGroups && { text: "Subdivide product groups by category or brand for granular bid control", step: 3 },
              ].filter(Boolean) as { text: string; step: number }[];
              if (tips.length === 0) return null;
              return (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                  <div className="mb-2.5 flex items-center gap-2">
                    <Zap className="size-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Quick wins before launch</p>
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px] text-blue-600">{tips.length} suggestions</Badge>
                  </div>
                  <div className="space-y-2">
                    {tips.map((tip, i) => (
                      <button key={i} type="button" onClick={() => setStep(tip.step)} className="flex w-full items-start gap-2 rounded-lg border border-blue-100 bg-white/70 p-2.5 text-left transition-colors hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                        <div className="mt-0.5 size-4 shrink-0 rounded-full border border-blue-300" />
                        <p className="text-[11px] text-blue-800 dark:text-blue-300">{tip.text}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {isDisplay && (() => {
              const displayGroup = creative.displayAdGroups?.[0];
              const displayAd = displayGroup?.ads?.[0];
              const hCount = displayAd?.headlines?.filter((h: { text?: string }) => h.text?.trim()).length ?? 0;
              const imgCount = (displayAd?.images?.length ?? 0) + (displayAd?.squareImages?.length ?? 0);
              const hasTargeting = (displayGroup?.contentKeywords?.length ?? 0) + (displayGroup?.topics?.length ?? 0) + (displayGroup?.placements?.length ?? 0) > 0;
              const tips = [
                hCount < 5 && { text: `Add ${5 - hCount} more headlines (you have ${hCount}/5 — Google tests combinations)`, step: 3 },
                imgCount === 0 && { text: "Add images (at least 1 landscape + 1 square required)", step: 3 },
                !hasTargeting && { text: "Add content targeting (keywords, topics, or placements) for relevant reach", step: 3 },
                !displayAd?.businessName?.trim() && { text: "Set your business name (shown in all ad formats)", step: 3 },
              ].filter(Boolean) as { text: string; step: number }[];
              if (tips.length === 0) return null;
              return (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                  <div className="mb-2.5 flex items-center gap-2">
                    <Zap className="size-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Quick wins before launch</p>
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px] text-blue-600">{tips.length} suggestions</Badge>
                  </div>
                  <div className="space-y-2">
                    {tips.map((tip, i) => (
                      <button key={i} type="button" onClick={() => setStep(tip.step)} className="flex w-full items-start gap-2 rounded-lg border border-blue-100 bg-white/70 p-2.5 text-left transition-colors hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                        <div className="mt-0.5 size-4 shrink-0 rounded-full border border-blue-300" />
                        <p className="text-[11px] text-blue-800 dark:text-blue-300">{tip.text}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {isDemandGen && (() => {
              const dgGroup = creative.demandGenAdGroups?.[0];
              const dgAd = dgGroup?.ads?.[0];
              const channels = Object.values(dgGroup?.channelControls ?? {}).filter(Boolean).length;
              const tips = [
                channels < 3 && { text: "Enable more channels (YouTube + Discover + Gmail) for broader reach", step: 3 },
                !dgAd?.businessName?.trim() && { text: "Set your business name (required for all Demand Gen formats)", step: 3 },
              ].filter(Boolean) as { text: string; step: number }[];
              if (tips.length === 0) return null;
              return (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                  <div className="mb-2.5 flex items-center gap-2">
                    <Zap className="size-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Quick wins before launch</p>
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px] text-blue-600">{tips.length} suggestions</Badge>
                  </div>
                  <div className="space-y-2">
                    {tips.map((tip, i) => (
                      <button key={i} type="button" onClick={() => setStep(tip.step)} className="flex w-full items-start gap-2 rounded-lg border border-blue-100 bg-white/70 p-2.5 text-left transition-colors hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:bg-blue-950/50">
                        <div className="mt-0.5 size-4 shrink-0 rounded-full border border-blue-300" />
                        <p className="text-[11px] text-blue-800 dark:text-blue-300">{tip.text}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-col gap-2.5">
              {reviewSections.map((s) => {
                const isOpen = expandedSection === s.id;
                return (
                  <div key={s.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
                      onClick={() => setExpandedSection(isOpen ? null : s.id)}
                    >
                      <div className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        s.warn ? "bg-amber-100 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {s.warn ? <AlertCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{s.title}</p>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          {s.chips.map((chip, ci) => (
                            <span key={ci} className="text-[11px] text-muted-foreground">
                              {ci > 0 && <span className="mx-1 text-border">·</span>}
                              {chip}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setStep(s.step); }}
                          className="rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                        >
                          <Pencil className="size-3" />
                        </button>
                        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-border px-4 pb-3 pt-1">
                        <div className="flex flex-col divide-y divide-border/60">
                          {s.rows}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border"
                />
                <label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground">
                  I agree to the <span className="font-medium text-primary">Google Ads Terms of Service</span>,{" "}
                  <span className="font-medium text-primary">Salla Advertising Agreement</span>, and confirm that I have authority to manage advertising for this account.
                  I understand that Google may review my ads and assets before serving them.
                </label>
              </div>
            </div>
          </div>

          {/* ============ RIGHT COLUMN ============ */}
          <div className="w-full lg:w-[320px] lg:shrink-0">
            <div className="lg:sticky lg:top-20 flex flex-col gap-3">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Total hero */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total cost (incl. VAT)</p>
                    <p className="text-2xl font-bold tabular-nums text-foreground">
                      {totalWithVat.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">SAR</span>
                    </p>
                  </div>
                  {allPassed && !fundsInsufficient && (
                    <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50">
                      <CheckCircle2 className="size-5 text-emerald-600" />
                    </div>
                  )}
                  {fundsInsufficient && (
                    <div className="flex size-10 items-center justify-center rounded-full bg-amber-50">
                      <AlertCircle className="size-5 text-amber-600" />
                    </div>
                  )}
                </div>

                {/* Cost breakdown (compact) */}
                <div className="border-t border-border px-5 py-3">
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {autoIncrease.enabled && autoIncreaseAvailable
                          ? `${dailyAmount.toLocaleString()} SAR/day × ${durationDays} days (auto-increase)`
                          : `${dailyAmount.toLocaleString()} SAR/day × ${durationDays} days`}
                      </span>
                      <span className="tabular-nums text-foreground">{totalBudgetBase.toLocaleString()}</span>
                    </div>
                    {boostAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Performance Boost</span>
                        <span className="text-foreground">+{boostAmount}</span>
                      </div>
                    )}
                    {appliedCouponCode && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Coupon ({appliedCouponCode})</span>
                        <span>-{couponDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VAT (15%)</span>
                      <span className="tabular-nums text-foreground">{vat.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment method */}
                <div className="border-t border-border px-5 py-3">
                  <p className="mb-2 text-xs font-semibold text-foreground">Pay with</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("wallet")}
                      className={cn(
                        "flex flex-1 flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 transition-all",
                        paymentMethod === "wallet" ? "border-primary bg-primary/[0.04]" : "border-border hover:border-primary/30"
                      )}
                    >
                      <Wallet className={cn("size-5", paymentMethod === "wallet" ? "text-primary" : "text-muted-foreground")} />
                      <p className={cn("text-[11px] font-semibold", paymentMethod === "wallet" ? "text-primary" : "text-foreground")}>Store Wallet</p>
                      <p className={cn("text-[10px] font-bold tabular-nums", walletBalance >= totalWithVat ? "text-emerald-600" : "text-amber-600")}>
                        {walletBalance.toLocaleString()} SAR
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => isCreditEligible && setPaymentMethod("credit")}
                      disabled={!isCreditEligible}
                      className={cn(
                        "flex flex-1 flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 transition-all",
                        !isCreditEligible
                          ? "cursor-not-allowed border-border opacity-50"
                          : paymentMethod === "credit" ? "border-primary bg-primary/[0.04]" : "border-border hover:border-primary/30"
                      )}
                    >
                      <FileText className={cn("size-5", paymentMethod === "credit" ? "text-primary" : "text-muted-foreground")} />
                      <div className="flex items-center gap-1">
                        <p className={cn("text-[11px] font-semibold", paymentMethod === "credit" ? "text-primary" : "text-foreground")}>Monthly Credit</p>
                        {!isCreditEligible && <Lock className="size-2.5 text-muted-foreground" />}
                      </div>
                      <p className={cn("text-[10px] font-bold tabular-nums", creditAvailable >= totalWithVat ? "text-emerald-600" : "text-amber-600")}>
                        {creditAvailable.toLocaleString()} SAR
                      </p>
                    </button>
                  </div>

                  {fundsInsufficient && (
                    <div className="mt-2 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-[11px] font-medium text-amber-800">Need {shortfall.toLocaleString()} SAR more</p>
                      <Button size="sm" variant="outline" className="h-6 gap-1 border-amber-300 px-2 text-[10px] text-amber-700 hover:bg-amber-100" onClick={() => setTopUpOpen(true)}>
                        <Plus className="size-2.5" /> Top Up
                      </Button>
                    </div>
                  )}
                </div>

                {/* Coupon */}
                <div className="border-t border-border px-5 py-3">
                  <CouponCodeCard
                    appliedCode={appliedCouponCode}
                    appliedDiscount={appliedCouponCode ? couponDiscount : undefined}
                    onApply={(code) => setAppliedCouponCode(code)}
                    onRemove={() => setAppliedCouponCode(null)}
                  />
                </div>

                {/* Launch + Draft */}
                <div className="border-t border-border px-5 py-4">
                  <Button
                    className="w-full gap-2 text-sm"
                    size="lg"
                    onClick={handleLaunch}
                    disabled={!allPassed || launching || fundsInsufficient || !agreedToTerms}
                  >
                    {launching ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Rocket className="size-4" />
                        Launch Campaign
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Save className="size-3" />
                    {savedAsDraft ? "Draft Saved!" : "Save Draft"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {!isPMax && !isSearch && !isShopping && !isDisplay && !isDemandGen && (
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>
        {/* ============================================================ */}
        {/* LEFT COLUMN                                                   */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">
              <div>
                <h2 className="text-base font-bold text-foreground">Review & Launch</h2>
                <p className="text-xs text-muted-foreground">
                  Review your {objConfig.label} campaign settings and launch when ready.
                </p>
              </div>
            </div>

            {/* Readiness checks */}
            <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Launch Readiness</Label>
                </div>
                <Badge variant={allPassed ? "default" : "secondary"} className="rounded-full text-[10px]">
                  {passedCount}/{checks.length} passed
                </Badge>
              </div>
              <div className="flex flex-col gap-1.5">
                {checks.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5 rounded-lg bg-muted/20 px-3 py-2">
                    {c.ok
                      ? <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      : <AlertCircle className="size-4 shrink-0 text-amber-500" />
                    }
                    <span className="flex-1 text-sm text-foreground">{c.label}</span>
                    <span className="text-xs text-muted-foreground">{c.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Sections */}
            <div className="flex flex-col gap-4">

              {/* ---- Objective ---- */}
              <SectionCard>
                <SectionHeader icon={Zap} title="Objective" step={0} setStep={setStep} />
                <ReviewRow label="Campaign Type" value={objConfig.label} />
                <ReviewRow label="Campaign Name" value={objective.campaignName || "Not set"} warn={!objective.campaignName} />
                <ReviewRow label="Conversion Tracking" value={
                  objective.tagMode === "salla_managed"
                    ? "Salla Managed (Auto)"
                    : objective.conversionId
                      ? `ID: ${objective.conversionId}`
                      : "Not configured"
                } warn={objective.tagMode === "none"} />
                {(objective.merchantCenterConnected || objective.merchantCenterId) && (
                  <ReviewRow label="Merchant Center" value={objective.merchantCenterId ? `ID: ${objective.merchantCenterId}` : "Connected"} />
                )}
                {isShopping && (
                  <>
                    <ReviewRow label="Campaign Priority" value={
                      objective.shoppingSettings?.campaignPriority === 2 ? "High" :
                      objective.shoppingSettings?.campaignPriority === 1 ? "Medium" : "Low"
                    } />
                    {objective.shoppingSettings?.feedLabel && (
                      <ReviewRow label="Feed Label" value={objective.shoppingSettings.feedLabel} />
                    )}
                    <ReviewRow label="Local Inventory" value={objective.shoppingSettings?.enableLocal ? "Enabled" : "Disabled"} />
                  </>
                )}
              </SectionCard>

              {/* ---- Audience ---- */}
              <SectionCard>
                <SectionHeader icon={Users} title="Audience Signals" step={1} setStep={setStep} />
                <ReviewRow label="Locations" value={audience.locationIds.map((c: string) => COUNTRY_MAP[c] || c).join(", ") || "None"} warn={audience.locationIds.length === 0} />
                <ReviewRow label="Languages" value={
                  audience.languages?.length > 0
                    ? audience.languages.map((l: string) => l === "ar" ? "Arabic" : l === "en" ? "English" : l).join(", ")
                    : "All languages"
                } />

                {/* Non-search / non-shopping fields */}
                {!isShopping && (
                  <>
                    <ReviewRow label="Search Themes" value={
                      audience.searchThemes?.length > 0
                        ? `${audience.searchThemes.length} theme${audience.searchThemes.length !== 1 ? "s" : ""}`
                        : "None"
                    } />
                    <ReviewRow label="Custom Segments" value={
                      ((audience.customSegmentKeywords?.length ?? 0) + (audience.customSegmentUrls?.length ?? 0)) > 0
                        ? `${audience.customSegmentKeywords?.length ?? 0} keywords, ${audience.customSegmentUrls?.length ?? 0} URLs`
                        : "None"
                    } />
                  </>
                )}
                {isShopping && (
                  <ReviewRow label="Negative Keywords" value={
                    audience.negativeKeywords?.length > 0
                      ? `${audience.negativeKeywords.length} keyword${audience.negativeKeywords.length !== 1 ? "s" : ""}`
                      : "None"
                  } />
                )}
                <ReviewRow label="Optimized Targeting" value={audience.optimizedTargeting ? "Enabled" : "Disabled"} />
              </SectionCard>

              {/* ---- Budget & Bidding ---- */}
              <SectionCard>
                <SectionHeader icon={DollarSign} title="Budget & Bidding" step={2} setStep={setStep} />
                <ReviewRow label="Daily Budget" value={`SAR ${budget.amount}`} />
                <ReviewRow label="Bidding Strategy" value={BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy} />
                {budget.biddingStrategy === "TARGET_CPA" && (
                  <ReviewRow label="Target CPA" value={`SAR ${budget.targetCpa}`} />
                )}
                {budget.biddingStrategy === "TARGET_ROAS" && (
                  <ReviewRow label="Target ROAS" value={`${budget.targetRoas}%`} />
                )}
                <ReviewRow label="Conversion Goal" value={CONVERSION_LABELS[budget.conversionGoal] || budget.conversionGoal} />
                <ReviewRow label="Schedule" value={
                  budget.endDate && !budget.endDateOptional
                    ? `${budget.startDate ?? "Today"} to ${budget.endDate}`
                    : `${budget.startDate ?? "Today"} (No end date)`
                } />
                <ReviewRow label="URL Expansion" value={budget.urlExpansionOptOut ? "Disabled" : "Enabled"} />
                <ReviewRow label="Salla Performance Boost" value={budget.performanceBoost ? "SAR 149/mo" : "Off"} />
              </SectionCard>

              {/* ---- AI Features (Demand Gen) ---- */}
              {isDemandGen && (
                <SectionCard className="border-primary/20 bg-primary/[0.02]">
                  <SectionHeader icon={Sparkles} title="AI Features" step={2} setStep={setStep} />

                  {/* Demand Gen ad-level automation */}
                  {isDemandGen && (
                    <>
                      <p className="mb-1 text-[10px] font-semibold text-muted-foreground">Ad Creative Automation</p>
                      {(() => {
                        const firstAd = creative.demandGenAdGroups?.[0]?.ads?.[0];
                        const auto = firstAd?.adAssetAutomation ?? {};
                        const items = [
                          { key: "GENERATE_DESIGN_VERSIONS_FOR_IMAGES", label: "Image Versions" },
                          { key: "GENERATE_SHORTER_YOUTUBE_VIDEOS", label: "Short Videos" },
                          { key: "GENERATE_VERTICAL_YOUTUBE_VIDEOS", label: "Vertical Videos" },
                          { key: "GENERATE_VIDEOS_FROM_OTHER_ASSETS", label: "Videos from Images" },
                        ];
                        return (
                          <div className="flex flex-wrap gap-1.5">
                            {items.map(({ key, label }) => {
                              const isOn = (auto[key as keyof typeof auto] ?? "OPTED_IN") === "OPTED_IN";
                              return (
                                <Badge key={key} variant="secondary" className={cn("rounded-full px-2 py-0.5 text-[9px]", isOn ? "border-primary/30 bg-primary/10 text-primary" : "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400")}>
                                  {isOn ? "ON" : "OFF"}: {label}
                                </Badge>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </SectionCard>
              )}

              {/* ---- Creative / Assets ---- */}
              {isApp ? (
                <SectionCard>
                  <SectionHeader icon={Smartphone} title="App Ads" step={3} setStep={setStep} />
                  <ReviewRow label="App Store" value={objective.appSettings?.appStore === "GOOGLE_APP_STORE" ? "Google Play" : "Apple App Store"} />
                  <ReviewRow label="App ID" value={objective.appSettings?.appId || "Not set"} />
                  {objective.appSettings?.appName && <ReviewRow label="App Name" value={objective.appSettings.appName} />}
                  <ReviewRow label="Campaign Goal" value={
                    objective.appSettings?.biddingStrategyGoalType === "OPTIMIZE_INSTALLS_TARGET_INSTALL_COST" ? "App Installs (Target CPI)" :
                    objective.appSettings?.biddingStrategyGoalType === "OPTIMIZE_IN_APP_CONVERSIONS_TARGET_INSTALL_COST" ? "In-App Actions (Install Cost)" :
                    objective.appSettings?.biddingStrategyGoalType === "OPTIMIZE_IN_APP_CONVERSIONS_TARGET_CONVERSION_COST" ? "In-App Actions (Target CPA)" :
                    "ROAS"
                  } />
                  <ReviewRow label="App Ads" value={`${creative.appAds?.length ?? 0}`} />
                  {(creative.appAds ?? []).map((ad: { id: string; name: string; mandatoryAdText: string; headlines: { text: string }[]; descriptions: { text: string }[]; images: unknown[]; youtubeVideos: string[] }, ai: number) => (
                    <div key={ad.id} className="ml-2 mt-2 border-l-2 border-primary/20 pl-2">
                      <p className="text-[11px] font-medium text-foreground">{ad.name || `App Ad ${ai + 1}`}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Mandatory text: {ad.mandatoryAdText?.trim() ? `"${ad.mandatoryAdText.slice(0, 40)}${ad.mandatoryAdText.length > 40 ? "..." : ""}"` : "missing"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {ad.headlines?.filter((h) => h.text?.trim()).length ?? 0}/5 headlines, {ad.descriptions?.filter((d) => d.text?.trim()).length ?? 0}/5 descriptions
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {ad.images?.length ?? 0} images, {ad.youtubeVideos?.filter(Boolean).length ?? 0} videos
                      </p>
                    </div>
                  ))}
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-1 text-xs font-semibold text-foreground">Targeting</p>
                    <ReviewRow label="Method" value="Automated (Google AI)" />
                    <ReviewRow label="Networks" value="Search, Play, YouTube, Discover, Display" />
                  </div>
                </SectionCard>
              ) : isDisplay ? (
                <SectionCard>
                  <SectionHeader icon={Layers} title="Display Ads" step={3} setStep={setStep} />
                  <ReviewRow label="Ad Groups" value={`${creative.displayAdGroups?.length ?? 0}`} />
                  {(creative.displayAdGroups ?? []).map((ag, gi: number) => (
                    <div key={ag.id} className={cn("mt-3 rounded-lg border border-border p-3", gi > 0 && "mt-2")}>
                      <p className="mb-1.5 text-xs font-semibold text-foreground">{ag.name || `Ad Group ${gi + 1}`}</p>
                      <ReviewRow label="Content Keywords" value={`${ag.contentKeywords?.length ?? 0}`} />
                      <ReviewRow label="Topics" value={`${ag.topics?.length ?? 0}`} />
                      <ReviewRow label="Placements" value={`${ag.placements?.length ?? 0}`} />
                      {(ag.excludedPlacements?.length ?? 0) > 0 && (
                        <ReviewRow label="Excluded Placements" value={`${ag.excludedPlacements.length}`} />
                      )}
                      <ReviewRow label="RDA Ads" value={`${ag.ads?.length ?? 0}`} />
                      {(ag.ads ?? []).map((ad, ai: number) => {
                        const hCount = ad.headlines?.filter((h) => h.text?.trim()).length ?? 0;
                        const dCount = ad.descriptions?.filter((d) => d.text?.trim()).length ?? 0;
                        return (
                          <div key={ad.id} className="ml-2 mt-1 border-l-2 border-primary/20 pl-2">
                            <p className="text-[11px] font-medium text-foreground">{ad.name || `RDA ${ai + 1}`}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {hCount}/5 headlines, {dCount}/5 descriptions, long headline: {ad.longHeadline?.trim() ? "set" : "missing"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {ad.images?.length ?? 0} landscape, {ad.squareImages?.length ?? 0} square, {(ad.logos?.length ?? 0) + (ad.squareLogos?.length ?? 0)} logos
                              {ad.finalUrl ? ` | ${ad.finalUrl}` : ""}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-1 text-xs font-semibold text-foreground">Audience</p>
                    <ReviewRow label="Optimized Targeting" value={audience.optimizedTargeting ? "Enabled" : "Disabled"} />
                    {audience.inMarketSegments?.length > 0 && (
                      <ReviewRow label="In-Market Segments" value={`${audience.inMarketSegments.length}`} />
                    )}
                    {audience.affinitySegments?.length > 0 && (
                      <ReviewRow label="Affinity Segments" value={`${audience.affinitySegments.length}`} />
                    )}
                    {audience.audienceSignals?.length > 0 && (
                      <ReviewRow label="Remarketing Lists" value={`${audience.audienceSignals.length}`} />
                    )}
                  </div>
                </SectionCard>
              ) : isShopping ? (
                <SectionCard>
                  <SectionHeader icon={FolderTree} title="Product Groups" step={3} setStep={setStep} />
                  <ReviewRow label="Ad Type" value="Shopping Product Ads (auto-generated from feed)" />
                  <ReviewRow label="Product Source" value="Merchant Center Feed (synced from Salla)" />
                  <ReviewRow label="Active Products" value="1,198 approved" />
                  <ReviewRow label="Product Groups" value={
                    creative.productGroupRoot?.type === "SUBDIVISION"
                      ? `${creative.productGroupRoot.children.filter((c: { type: string }) => c.type === "UNIT_INCLUDED").length} included, ${creative.productGroupRoot.children.filter((c: { type: string }) => c.type === "UNIT_EXCLUDED").length} excluded`
                      : "All products (no subdivision)"
                  } />
                  <ReviewRow label="Negative Keywords" value={
                    creative.negativeKeywords?.length > 0
                      ? `${creative.negativeKeywords.length} keyword${creative.negativeKeywords.length !== 1 ? "s" : ""}`
                      : audience.negativeKeywords?.length > 0
                        ? `${audience.negativeKeywords.length} keyword${audience.negativeKeywords.length !== 1 ? "s" : ""}`
                        : "None"
                  } />
                </SectionCard>
              ) : isDemandGen ? (
                <SectionCard>
                  <SectionHeader icon={Layers} title="Demand Gen Ad Groups" step={3} setStep={setStep} />
                  <ReviewRow label="Ad Groups" value={`${creative.demandGenAdGroups?.length ?? 0}`} />
                  <ReviewRow label="Total Ads" value={`${(creative.demandGenAdGroups ?? []).reduce((sum: number, g: { ads: unknown[] }) => sum + g.ads.length, 0)}`} />
                  {(creative.demandGenAdGroups ?? []).map((ag, gi: number) => (
                    <div key={ag.id} className={cn("mt-3 rounded-lg border border-border p-3", gi > 0 && "mt-2")}>
                      <p className="mb-1.5 text-xs font-semibold text-foreground">{ag.name || `Ad Group ${gi + 1}`}</p>
                      <ReviewRow label="Channels" value={
                        Object.entries(ag.channelControls ?? {})
                          .filter(([, v]) => v)
                          .map(([k]) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s: string) => s.toUpperCase()))
                          .join(", ") || "None"
                      } />
                      <ReviewRow label="Ads" value={`${ag.ads.length}`} />
                      {ag.ads.map((ad: { id: string; name: string; adType: string; headlines: { text: string }[]; descriptions: { text: string }[] }, ai: number) => (
                        <div key={ad.id} className="ml-2 mt-1 border-l-2 border-primary/20 pl-2">
                          <p className="text-[11px] font-medium text-foreground">{ad.name || `Ad ${ai + 1}`}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {ad.adType === "MULTI_ASSET" ? "Multi-Asset" : ad.adType === "CAROUSEL" ? "Carousel" : "Video Responsive"}{" "}
                            | {ad.headlines?.filter((h) => h.text?.trim()).length ?? 0} headlines,{" "}
                            {ad.descriptions?.filter((d) => d.text?.trim()).length ?? 0} descriptions
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                  {audience.lookalikeSegments?.length > 0 && (
                    <ReviewRow label="Lookalike Segments" value={`${audience.lookalikeSegments.length} segment${audience.lookalikeSegments.length !== 1 ? "s" : ""} (${audience.lookalikeExpansion})`} />
                  )}
                  {audience.customerMatchLists?.length > 0 && (
                    <ReviewRow label="Customer Match" value={`${audience.customerMatchLists.length} list${audience.customerMatchLists.length !== 1 ? "s" : ""}`} />
                  )}
                </SectionCard>
              ) : (
                <SectionCard>
                  <SectionHeader icon={Layers} title="Asset Group" step={3} setStep={setStep} />
                  <ReviewRow label="Asset Groups" value={`${creative.assetGroups?.length ?? 0} group${(creative.assetGroups?.length ?? 0) !== 1 ? "s" : ""}`} />
                  {firstGroup && (
                    <>
                      <ReviewRow label="Group Name" value={firstGroup.name || "Unnamed"} />
                      <ReviewRow label="Final URL" value={firstGroup.finalUrl || "Not set"} warn={!firstGroup.finalUrl} />
                      {isRetailPMax && (
                        <ReviewRow label="Listing Groups" value={retailListingSummary} />
                      )}
                      <ReviewRow label="Headlines" value={`${filledHeadlines} filled`} warn={filledHeadlines < 3} />
                      <ReviewRow label="Long Headlines" value={`${firstGroup.longHeadlines?.filter((h: { text?: string }) => (h.text ?? "").trim()).length ?? 0} filled`} />
                      <ReviewRow label="Descriptions" value={`${filledDescriptions} filled`} warn={filledDescriptions < 2} />
                      <ReviewRow label="Images" value={`${firstGroup.images?.length ?? 0} uploaded`} />
                      <ReviewRow label="Logos" value={`${firstGroup.logos?.length ?? 0} uploaded`} />
                      <ReviewRow label="Videos" value={`${firstGroup.videos?.length ?? 0} linked`} />
                      <ReviewRow label="Business Name" value={firstGroup.businessName || "Not set"} />
                      <ReviewRow label="CTA" value={firstGroup.callToAction === "AUTOMATED" ? "Automated" : firstGroup.callToAction ?? "Not set"} />
                    </>
                  )}
                </SectionCard>
              )}

              {/* ---- Cost Summary ---- */}
              <SectionCard className="border-primary/30 bg-primary/[0.02]">
                <div className="mb-4 flex items-center gap-2">
                  <Wallet className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Cost Summary</Label>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily budget</span>
                    <span className="font-medium text-foreground">SAR {budget.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated duration</span>
                    <span className="font-medium text-foreground">{durationDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated ad spend</span>
                    <span className="font-medium text-foreground">SAR {(budget.amount * durationDays).toLocaleString()}</span>
                  </div>
                  {budget.performanceBoost && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salla Performance Boost</span>
                      <span className="font-medium text-primary">SAR 149</span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between border-t border-border pt-2">
                    <span className="font-semibold text-foreground">Total estimated cost</span>
                    <span className="font-bold text-primary">SAR {totalBudget.toLocaleString()}</span>
                  </div>
                </div>

                {/* Coupon */}
                <div className="mt-4 flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Promo code"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="h-9 pl-9 text-sm"
                      disabled={couponApplied}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!coupon.trim() || couponApplied}
                    onClick={() => setCouponApplied(true)}
                  >
                    {couponApplied ? "Applied" : "Apply"}
                  </Button>
                </div>
              </SectionCard>

              {/* ---- API JSON toggle ---- */}
              <SectionCard>
                <button
                  type="button"
                  onClick={() => setShowApiJson(!showApiJson)}
                  className="flex w-full items-center gap-2 text-left"
                >
                  <Code2 className="size-4 text-primary" />
                  <span className="flex-1 text-sm font-semibold text-foreground">
                    Google Ads API Payload
                  </span>
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {showApiJson ? "Hide" : "Show"}
                  </Badge>
                </button>
                {showApiJson && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">
                        Payload structure for Google Ads API v23
                      </p>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleCopyJson}>
                        <Copy className="size-3" />
                        {jsonCopied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/30 p-4 text-xs leading-relaxed text-foreground">
                      {jsonString}
                    </pre>
                  </div>
                )}
              </SectionCard>

              {/* ---- Terms & Launch ---- */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-border"
                  />
                  <label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground">
                    I agree to the <span className="font-medium text-primary">Google Ads Terms of Service</span>,{" "}
                    <span className="font-medium text-primary">Salla Advertising Agreement</span>, and confirm that I have authority to manage advertising for this account.
                    I understand that Google may review my ads and assets before serving them.
                  </label>
                </div>
              </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN                                                  */}
        {/* ============================================================ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="sticky top-6 flex flex-col gap-4">

            {/* Campaign card */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                <p className="text-xs font-bold text-foreground">{objective.campaignName || "Untitled"}</p>
              </div>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium text-foreground">{objConfig.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily budget</span>
                  <span className="font-medium text-foreground">SAR {budget.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bidding</span>
                  <span className="font-medium text-foreground">{BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isApp ? "App Ads" : isDisplay ? "Display Ad Groups" : isSearch ? "Ad Groups" : isShopping ? "Product Groups" : isDemandGen ? "Ad Format" : "Asset Groups"}
                  </span>
                  <span className="font-medium text-foreground">
                    {isApp ? `${creative.appAds?.length ?? 0} ads` : isDisplay ? `${creative.displayAdGroups?.length ?? 0} groups` : isSearch ? `${creative.searchAdGroups?.length ?? 0} groups` : isShopping ? "Feed-based" : isDemandGen ? (
                      objective.demandGenAdType === "MULTI_ASSET" ? "Multi-Asset" :
                      objective.demandGenAdType === "CAROUSEL" ? "Carousel" : "Video Responsive"
                    ) : (creative.assetGroups?.length ?? 0)}
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* Google Channels */}
            <SectionCard className="p-4">
              <p className="mb-3 text-xs font-bold text-foreground">
                {isApp ? "App Channels" : isDisplay ? "Display Channels" : isSearch ? "Search Channels" : isShopping ? "Shopping Channels" : isDemandGen ? "Demand Gen Channels" : "PMax Channels"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(isApp
                  ? ["Google Search", "Google Play", "YouTube", "Discover", "Display Network"]
                  : isDisplay
                  ? ["Google Display Network", "YouTube", "Gmail", "Partner Sites"]
                  : isSearch
                  ? ["Google Search", "Search Partners"]
                  : isShopping
                  ? ["Google Shopping", "Search", "Partner Sites", ...(objective.shoppingSettings?.enableLocal ? ["Local"] : [])]
                  : isDemandGen
                    ? Object.entries(objective.demandGenChannels ?? {})
                        .filter(([, v]) => v)
                        .map(([k]) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()))
                    : ["Search", "Display", "YouTube", "Discover", "Gmail", "Maps"]
                ).map((ch) => (
                  <Badge key={ch} variant="secondary" className="rounded-full text-[10px]">{ch}</Badge>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {isApp
                  ? "App ads are automatically served across Google Search, Play Store, YouTube, Discover, and the Display Network to maximize installs and in-app actions."
                  : isDisplay
                  ? "Display ads appear across 3M+ websites and apps on the Google Display Network, YouTube, and Gmail."
                  : isSearch
                  ? "Search ads appear at the top and bottom of Google Search results when users search for your keywords."
                  : isShopping
                  ? "Shopping ads appear as product listings on Google Shopping, Search results, and partner sites."
                  : isDemandGen
                    ? "Demand Gen ads appear across YouTube, Discover, Gmail, and optionally Display to drive awareness and conversions."
                    : "Performance Max automatically serves ads across all Google channels to maximize results."
                }
              </p>
            </SectionCard>

            {/* Pre-launch check */}
            <SectionCard className="p-4">
              <p className="mb-3 text-xs font-bold text-foreground">Launch Checklist</p>
              <div className="flex flex-col gap-2 text-[11px]">
                {checks.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    {c.ok
                      ? <CheckCircle2 className="size-3 text-emerald-500" />
                      : <AlertCircle className="size-3 text-amber-500" />
                    }
                    <span className={cn(c.ok ? "text-muted-foreground" : "text-amber-600")}>{c.label}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Google tips */}
            <SectionCard className="p-4">
              <p className="text-xs font-semibold text-foreground">
                {isSearch ? "Search Tips" : isShopping ? "Shopping Tips" : isDemandGen ? "Demand Gen Tips" : "Google Ads Tips"}
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-xs leading-relaxed text-muted-foreground">
                {isSearch ? (
                  <>
                    <li>- Add 15 unique headlines for best ad combinations</li>
                    <li>- Use all 4 descriptions for maximum reach</li>
                    <li>- Include keywords in headlines for relevance</li>
                    <li>- Add sitelinks and callouts to improve CTR</li>
                  </>
                ) : isShopping ? (
                  <>
                    <li>- Shopping campaigns need 1-2 weeks to learn — avoid changes during this period</li>
                    <li>- Optimize product titles and images in your Salla store for better click-through rates</li>
                    <li>- Use negative keywords to prevent wasted spend on irrelevant searches</li>
                    <li>- Subdivide product groups to bid more on high-margin items</li>
                  </>
                ) : isDemandGen ? (
                  <>
                    <li>- Demand Gen needs 2-3 weeks to fully optimize</li>
                    <li>- Use lifestyle images with products in context</li>
                    <li>- Video ads on Shorts get 2-3x more engagement</li>
                    <li>- Add lookalike audiences for best targeting</li>
                  </>
                ) : (
                  <>
                    <li>- PMax campaigns need 1-2 weeks to optimize</li>
                    <li>- Keep URL expansion ON for broader reach</li>
                    <li>- Add at least 15 headlines for best performance</li>
                  </>
                )}
                <li>- Google reviews ads within 1-2 business days</li>
              </ul>
            </SectionCard>
          </div>
        </div>
      </div>
      )}

      {/* Launch Confirmation Dialog */}
      <Dialog open={showLaunchConfirm} onOpenChange={setShowLaunchConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Launch Campaign?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You are about to launch <span className="font-semibold text-foreground">{objective.campaignName}</span> as a <span className="font-semibold text-foreground">{objConfig.label}</span> campaign with a daily budget of <span className="font-semibold text-foreground">SAR {budget.amount}</span>.
          </p>
          <p className="text-xs text-muted-foreground">
            Google will review your ads and assets. Delivery usually starts within 24-48 hours after approval.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowLaunchConfirm(false)}>Cancel</Button>
            <Button size="sm" className="gap-1.5" onClick={handleLaunch} disabled={launching}>
              {launching ? (
                <>
                  <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Launching...
                </>
              ) : (
                <>
                  <Rocket className="size-3.5" />
                  Confirm Launch
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <WizardStepFooter
        onPrevious={() => setStep(3)}
        onNext={() => setShowLaunchConfirm(true)}
        previousLabel="Previous"
        nextLabel="Launch Campaign"
        nextDisabled={!allPassed || !agreedToTerms || launching}
        nextLoading={launching}
        nextIcon={<Rocket className="size-4" />}
        secondaryAction={{
          label: savedAsDraft ? "Draft Saved" : "Save Draft",
          onClick: handleSaveDraft,
          disabled: savedAsDraft,
        }}
      />
      {(isPMax || isSearch || isShopping || isDisplay || isDemandGen) && (
        <Sheet open={topUpOpen} onOpenChange={setTopUpOpen}>
          <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <CircleDollarSign className="size-5 text-primary" />
                Top Up {paymentMethod === "wallet" ? "Store Wallet" : "Credit"}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">{paymentMethod === "wallet" ? "Current balance" : "Available credit"}</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
                  {(paymentMethod === "wallet" ? walletBalance : creditAvailable).toLocaleString()} <span className="text-sm font-medium text-muted-foreground">SAR</span>
                </p>
                <div className="mt-3 h-px bg-border" />
                <div className="mt-3 flex justify-between text-xs">
                  <span className="text-muted-foreground">Campaign cost</span>
                  <span className="font-semibold text-foreground">{totalWithVat.toLocaleString()} SAR</span>
                </div>
                <div className="mt-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">Shortfall</span>
                  <span className="font-semibold text-amber-600">{shortfall.toLocaleString()} SAR</span>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold text-foreground">Quick top-up</p>
                <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 2000, 3000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(String(amt))}
                      className={cn(
                        "rounded-lg border py-2 text-center text-xs font-medium transition-all",
                        topUpAmount === String(amt) ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40"
                      )}
                    >
                      {amt.toLocaleString()} SAR
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold text-foreground">Custom amount</p>
                <div className="relative">
                  <Input
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="Enter amount"
                    className="h-10 pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">SAR</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <Button className="w-full gap-2">
                <Plus className="size-4" />
                Top Up {topUpAmount ? `${Number(topUpAmount).toLocaleString()} SAR` : ""}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </TooltipProvider>
  );
}
