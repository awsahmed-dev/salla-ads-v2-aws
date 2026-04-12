"use client";

import { useState, useMemo } from "react";
import { useCampaign } from "@/lib/snapchat/campaign-context";
import { OBJECTIVE_CONFIGS } from "@/lib/snapchat/campaign-types";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { CouponCodeCard } from "@/components/shared/coupon-code-card";
import {
  CheckCircle2,
  AlertCircle,
  Rocket,
  DollarSign,
  ImagePlus,
  Wallet,
  Pencil,
  Copy,
  ChevronDown,
  FileText,
  Lock,
  Image as ImageIcon,
  Save,
  Plus,
  ArrowUpRight,
  CircleDollarSign,
  Target,
  Globe,
  Clock,
  Eye,
  BarChart3,
  ArrowRight,
  Sparkles,
  Bell,
  Code2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Label maps                                                        */
/* ------------------------------------------------------------------ */

const COUNTRY_MAP: Record<string, string> = {
  SA: "Saudi Arabia", AE: "UAE", KW: "Kuwait", BH: "Bahrain",
  OM: "Oman", QA: "Qatar", EG: "Egypt", JO: "Jordan", IQ: "Iraq",
};

const GOAL_LABELS: Record<string, string> = {
  PIXEL_PURCHASE: "Purchases", PIXEL_ADD_TO_CART: "Add to Cart", PIXEL_PAGE_VIEW: "Page Views",
  PIXEL_SIGNUP: "Sign Ups", SWIPES: "Swipe Ups", LANDING_PAGE_VIEW: "Landing Page Views",
  IMPRESSIONS: "Impressions", STORY_OPENS: "Story Opens", VIDEO_VIEWS: "Video Views (2s)",
  VIDEO_VIEWS_15_SEC: "Video Views (15s)", LEAD_FORM_SUBMISSIONS: "Form Submissions",
  USES: "Lens/Filter Uses", APP_INSTALLS: "App Installs", APP_PURCHASE: "In-App Purchases",
  APP_SIGNUP: "In-App Sign Ups", APP_ADD_TO_CART: "In-App Add to Cart", APP_REENGAGE_PURCHASE: "Re-engage Purchases",
};

const BID_LABELS: Record<string, string> = {
  AUTO_BID: "Auto Bid", TARGET_COST: "Target Cost", LOWEST_COST_WITH_MAX_BID: "Max Bid",
};

const AD_TYPE_LABELS: Record<string, string> = {
  WEB_VIEW: "Single Image/Video", COLLECTION: "Collection Ad", COMPOSITE: "Story Ad",
  DYNAMIC: "Dynamic Product Ad", APP_INSTALL: "App Install Ad", LEAD_GENERATION: "Lead Generation",
  SNAP_AD: "Snap Ad", DEEP_LINK: "Deep Link Ad",
};

const FORMAT_LABELS: Record<string, string> = {
  SINGLE: "Single Image/Video", COLLECTION: "Collection Ad", STORY: "Story Ad", DYNAMIC: "Dynamic Product Ad",
};
const DEST_LABELS: Record<string, string> = {
  WEBSITE: "Website", DEEP_LINK: "Deep Link", APP_INSTALL: "App Install", NO_CTA: "No CTA", LEAD_FORM: "Lead Form",
};

/* ------------------------------------------------------------------ */
/*  Compact review row                                                */
/* ------------------------------------------------------------------ */

function Row({ label, value, warn }: { label: string; value: React.ReactNode; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className={cn("text-xs", warn ? "text-amber-600" : "text-muted-foreground")}>{label}</span>
      <span className={cn("text-right text-xs font-medium", warn ? "text-amber-600" : "text-foreground")}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function StepReview() {
  const { campaign, setStep, reset } = useCampaign();
  const { objective, audience, budget, creative: rawCreative } = campaign;
  const defaultSponsored = { chatMessage: "", autoResponseMessage: "", autoResponseEnabled: false, wallpaperUrl: "" };
  const creative = {
    ...rawCreative,
    sponsoredAdConfig: { ...defaultSponsored, ...(rawCreative.sponsoredAdConfig ?? {}) },
  };

  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [launched, setLaunched] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [showApiJson, setShowApiJson] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [savedAsDraft, setSavedAsDraft] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "credit">("wallet");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const isCreditEligible = true;
  const walletBalance = 1200;
  const creditLimit = 5000;
  const creditUsed = 1800;
  const creditAvailable = creditLimit - creditUsed;

  const objConfig = OBJECTIVE_CONFIGS[objective.objective];

  const durationDays = useMemo(() => {
    if (budget.startDate && budget.endDate) {
      return Math.max(1, Math.ceil((new Date(budget.endDate).getTime() - new Date(budget.startDate).getTime()) / 86400000));
    }
    return 14;
  }, [budget.startDate, budget.endDate]);

  const dailyAmount = budget.amount;
  const autoIncrease = budget.autoIncrease ?? { enabled: false, pct: 20, intervalDays: 7, maxDailyBudget: budget.amount * 3 };
  const autoIncreaseAvailable = budget.type === "daily" && !budget.endDateOptional;
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
  const totalBudgetBase = budget.type === "daily" ? projectedTotalSpend : budget.amount;
  const totalBudget = totalBudgetBase + (budget.performanceBoost ? 149 : 0);
  const totalCreatives = creative.ads.reduce((sum, ad) => sum + ad.assets.length, 0);

  /* ---- Validation ---- */
  const checks = useMemo(() => {
    const list: { id: string; label: string; ok: boolean; step?: number }[] = [];
    list.push({ id: "name", label: "Campaign name", ok: !!objective.campaignName.trim(), step: 0 });
    list.push({ id: "country", label: "Target country", ok: audience.countries.length > 0, step: 1 });
    list.push({ id: "gender", label: "Gender targeting", ok: audience.genders.length > 0, step: 1 });
    // Snap API: max 500 circles for point-radius targeting, min 96m radius
    if (audience.cities.length > 500) {
      list.push({ id: "circles_max", label: "Location circles ≤ 500", ok: false, step: 1 });
    }
    if (audience.cities.some((c) => c.radius < 96)) {
      list.push({ id: "circles_min_radius", label: "Location radius ≥ 96 meters", ok: false, step: 1 });
    }
    if (audience.countries.length > 1) list.push({ id: "language", label: "Language", ok: audience.languages.length > 0, step: 1 });
    if (objConfig.pixelRequirement === "required") {
      list.push({ id: "pixel", label: "Snap Pixel", ok: objective.pixelMode !== "none" && (objective.pixelMode === "salla_managed" || !!objective.pixelId), step: 0 });
    }
    list.push({ id: "profile", label: "Brand profile", ok: !!creative.publicProfileId, step: 3 });
    if (objective.objective === "LEADS") {
      const lf = creative.leadForm;
      const ft = lf?.form_fields?.map((f) => f.type) ?? [];
      list.push({ id: "lead_form", label: "Lead form fields", ok: ft.includes("FIRST_NAME") && ft.includes("LAST_NAME") && (ft.includes("EMAIL") || ft.includes("PHONE_NUMBER")), step: 3 });
      list.push({ id: "lead_privacy", label: "Privacy policy URL", ok: !!lf?.privacy_policy_url?.startsWith("https://"), step: 3 });
      // Snap API: ADDRESS and POSTAL_CODE cannot both be included
      if (ft.includes("ADDRESS") && ft.includes("POSTAL_CODE")) {
        list.push({ id: "lead_addr_zip", label: "Lead form: ADDRESS and POSTAL_CODE cannot both be included", ok: false, step: 3 });
      }
      // Snap API: form title max 25 chars
      if (lf && lf.title.length > 25) {
        list.push({ id: "lead_title_len", label: "Lead form title ≤ 25 characters", ok: false, step: 3 });
      }
      // Snap API: form description max 180 chars
      if (lf && lf.description.length > 180) {
        list.push({ id: "lead_desc_len", label: "Lead form description ≤ 180 characters", ok: false, step: 3 });
      }
    }
    if (objective.objective === "APP_PROMOTION") {
      const app = objective.appSettings;
      list.push({ id: "app_name", label: "App name", ok: !!app?.appName?.trim(), step: 0 });
    }
    list.push({ id: "ads", label: "At least one ad", ok: creative.ads.length > 0, step: 3 });
    const missingMedia = creative.ads.filter((a) => (a.adFormat ?? "SINGLE") !== "DYNAMIC" && !((a.adFormat ?? "SINGLE") === "COLLECTION" && a.dynamicCollectionEnabled) && a.assets.length === 0);
    if (missingMedia.length > 0) list.push({ id: "ad_creative", label: "All ads have creatives", ok: false, step: 3 });
    else if (creative.ads.length > 0) list.push({ id: "ad_creative", label: "All ads have creatives", ok: true });
    const missingPS = creative.ads.filter((a) => (a.adFormat ?? "SINGLE") === "DYNAMIC" && !a.dynamicTemplateConfig?.productSetId);
    if (missingPS.length > 0) list.push({ id: "dynamic_ps", label: "Dynamic ads product set", ok: false, step: 3 });
    const budgetMinOk = budget.type === "daily" ? dailyAmount >= 20 : budget.amount >= 100;
    const budgetLabel = budget.type === "daily" ? "Budget ≥ 20 SAR/day" : "Budget ≥ 100 SAR (lifetime)";
    list.push({ id: "budget", label: budgetLabel, ok: budgetMinOk, step: 2 });
    list.push({ id: "dates", label: "Schedule dates", ok: !!budget.startDate, step: 2 });
    if (budget.bidStrategy !== "AUTO_BID") list.push({ id: "bid", label: "Bid amount", ok: budget.bidAmount > 0, step: 2 });
    // Snap API: ACCELERATED pacing requires LOWEST_COST_WITH_MAX_BID + bid_micro > 0
    if (budget.pacingType === "ACCELERATED") {
      list.push({ id: "accel_bid", label: "Accelerated pacing: Max Bid strategy with bid amount", ok: budget.bidStrategy === "LOWEST_COST_WITH_MAX_BID" && budget.bidAmount > 0, step: 2 });
    }
    if (budget.frequencyCapEnabled && creative.ads.length > 1) {
      const adFormats = new Set(creative.ads.map((a) => a.adFormat ?? "SINGLE"));
      list.push({ id: "freq_cap_format", label: "Frequency cap: same ad format", ok: adFormats.size === 1, step: 3 });
    }
    // Snap API: Commercials cannot mix with non-commercials in the same ad squad
    if (creative.ads.length > 1) {
      const hasCommercial = creative.ads.some((a) => a.commercialConfig?.enabled);
      const hasNonCommercial = creative.ads.some((a) => !a.commercialConfig?.enabled);
      if (hasCommercial && hasNonCommercial) {
        list.push({ id: "mix_commercial", label: "Commercials cannot mix with non-commercial ads", ok: false, step: 3 });
      }
      // Dynamic ads cannot mix with non-dynamic in same ad squad
      const hasDynamic = creative.ads.some((a) => (a.adFormat ?? "SINGLE") === "DYNAMIC");
      const hasNonDynamic = creative.ads.some((a) => (a.adFormat ?? "SINGLE") !== "DYNAMIC");
      if (hasDynamic && hasNonDynamic) {
        list.push({ id: "mix_dynamic", label: "Dynamic ads cannot mix with standard ads", ok: false, step: 3 });
      }
    }
    if (objective.catalogEnabled) {
      list.push({
        id: "catalog_dynamic",
        label: "Catalog: all ads are Dynamic",
        ok: creative.ads.length === 0 || creative.ads.every((a) => (a.adFormat ?? "SINGLE") === "DYNAMIC"),
        step: 3,
      });
    }
    return list;
  }, [objective, audience, budget, creative, dailyAmount, objConfig]);

  const criticalFails = checks.filter((c) => !c.ok);
  const allPassed = criticalFails.length === 0;

  /* ---- Cost ---- */
  const subtotal = totalBudgetBase;
  const boostAmount = budget.performanceBoost ? 149 : 0;
  const couponDiscount = appliedCouponCode ? 50 : 0;
  const preVat = subtotal + boostAmount - couponDiscount;
  const vat = Math.round(preVat * 0.15);
  const totalWithVat = preVat + vat;

  const walletInsufficient = paymentMethod === "wallet" && totalWithVat > walletBalance;
  const creditInsufficient = paymentMethod === "credit" && totalWithVat > creditAvailable;
  const fundsInsufficient = walletInsufficient || creditInsufficient;
  const shortfall = paymentMethod === "wallet" ? Math.max(0, totalWithVat - walletBalance) : Math.max(0, totalWithVat - creditAvailable);

  /* ---- Handlers ---- */
  const handleLaunch = () => {
    if (!allPassed || fundsInsufficient) return;
    setLaunching(true);
    setTimeout(() => { setLaunching(false); setLaunched(true); }, 2500);
  };
  const handleSaveDraft = () => { setSavedAsDraft(true); setTimeout(() => setSavedAsDraft(false), 3000); };

  /* ---- Section data (for the compact review cards) ---- */
  const sections = [
    {
      id: 0,
      icon: Target,
      title: "Campaign",
      chips: [objConfig.label, objective.pixelMode === "salla_managed" ? "Salla Pixel" : null, objective.catalogEnabled ? "Catalog" : null].filter(Boolean) as string[],
      warn: !objective.campaignName.trim() || (objConfig.pixelRequirement === "required" && !objective.pixelId && objective.pixelMode !== "salla_managed"),
      step: 0,
      rows: (
        <>
          <Row label="Name" value={objective.campaignName || "Not set"} warn={!objective.campaignName} />
          <Row label="Objective" value={objConfig.label} />
          {objConfig.catalogAvailable && <Row label="Catalog" value={objective.catalogEnabled ? "Enabled" : "Off"} />}
          {objConfig.pixelRequirement !== "none" && (
            <Row label="Pixel" value={objective.pixelMode === "salla_managed" ? "Salla Managed" : objective.pixelId ? `...${objective.pixelId.slice(-8)}` : "Not set"} warn={objConfig.pixelRequirement === "required" && !objective.pixelId && objective.pixelMode !== "salla_managed"} />
          )}
        </>
      ),
    },
    {
      id: 1,
      icon: Globe,
      title: "Audience",
      chips: [
        audience.countries.length > 0 ? audience.countries.map((c) => COUNTRY_MAP[c] || c).join(", ") : "No country",
        audience.genders.length === 2 ? "All" : audience.genders[0] === "MALE" ? "Male" : "Female",
        `${audience.ageMin}-${audience.ageMax}+`,
      ],
      warn: audience.countries.length === 0,
      step: 1,
      rows: (
        <>
          <Row label="Countries" value={audience.countries.map((c) => COUNTRY_MAP[c] || c).join(", ") || "None"} warn={audience.countries.length === 0} />
          <Row label="Gender" value={audience.genders.length === 2 ? "All" : audience.genders[0] === "MALE" ? "Male" : "Female"} />
          <Row label="Age" value={`${audience.ageMin} - ${audience.ageMax}+`} />
          <Row label="Languages" value={audience.languages.length > 0 ? audience.languages.map((l) => l === "ar" ? "Arabic" : "English").join(", ") : "All"} />
          {audience.interests.length > 0 && <Row label="Interests" value={`${audience.interests.length} selected`} />}
        </>
      ),
    },
    {
      id: 2,
      icon: DollarSign,
      title: "Budget",
      chips: [`${dailyAmount} SAR/day`, `${durationDays} days`, BID_LABELS[budget.bidStrategy] || budget.bidStrategy],
      warn: dailyAmount < 20 || !budget.startDate,
      step: 2,
      rows: (
        <>
          <Row label="Daily" value={`${budget.amount.toLocaleString()} SAR`} />
          <Row label="Duration" value={`${durationDays} days`} />
          <Row label="Total" value={`${totalBudget.toLocaleString()} SAR`} />
          <Row label="Goal" value={GOAL_LABELS[budget.optimizationGoal] || budget.optimizationGoal} />
          <Row label="Bid" value={BID_LABELS[budget.bidStrategy]} />
          <Row label="Schedule" value={budget.startDate ? new Date(budget.startDate).toLocaleDateString("en-SA", { month: "short", day: "numeric" }) + (budget.endDate ? ` → ${new Date(budget.endDate).toLocaleDateString("en-SA", { month: "short", day: "numeric" })}` : " (ongoing)") : "Not set"} warn={!budget.startDate} />
        </>
      ),
    },
    {
      id: 3,
      icon: ImagePlus,
      title: "Creatives",
      chips: [`${creative.ads.length} ads`, `${totalCreatives} creatives`, creative.placement === "AUTOMATIC" ? "Auto placement" : `Custom`],
      warn: creative.ads.length === 0 || !!criticalFails.find((c) => c.step === 3),
      step: 3,
      rows: (
        <>
          <Row label="Profile" value={creative.publicProfileId ? `...${creative.publicProfileId.slice(-8)}` : "Not set"} warn={!creative.publicProfileId} />
          <Row label="Placement" value={creative.placement === "AUTOMATIC" ? "Automatic" : `Custom (${creative.customPositions.length})`} />
          {creative.ads.map((ad, i) => (
            <div key={ad.id} className="flex items-center gap-2.5 py-1.5">
              <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                {ad.assets[0]?.url ? (
                  ad.assets[0].mediaType === "VIDEO"
                    ? <video src={ad.assets[0].url} className="size-full object-cover" muted />
                    // eslint-disable-next-line @next/next/no-img-element
                    : <img src={ad.assets[0].url} alt="" className="size-full object-cover" />
                ) : (
                  <ImageIcon className="size-3.5 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{ad.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {FORMAT_LABELS[ad.adFormat ?? "SINGLE"] || AD_TYPE_LABELS[ad.adType] || ad.adType}{ad.adFormat === "SINGLE" ? ` · ${DEST_LABELS[ad.adDestination ?? "WEBSITE"] || ""}` : ""} · {(ad.adFormat ?? "SINGLE") === "DYNAMIC" ? (ad.dynamicTemplateConfig?.productSetName || "No product set") : `${ad.assets.length} creative${ad.assets.length !== 1 ? "s" : ""}`}{ad.isInfluencer ? " · Influencer" : ""}
                </p>
              </div>
            </div>
          ))}
          {creative.ads.length === 0 && (
            <p className="py-2 text-xs text-amber-600">No ads created yet.</p>
          )}
        </>
      ),
    },
  ];

  /* ---- Success ---- */
  if (launched) {
    const campaignId = `SC-${Date.now().toString(36).toUpperCase().slice(-8)}`;
    const startFormatted = budget.startDate
      ? new Date(budget.startDate).toLocaleDateString("en-SA", { month: "short", day: "numeric", year: "numeric" })
      : "Today";
    const endFormatted = budget.endDate
      ? new Date(budget.endDate).toLocaleDateString("en-SA", { month: "short", day: "numeric", year: "numeric" })
      : null;
    const countriesLabel = audience.countries.map((c) => COUNTRY_MAP[c] || c).join(", ") || "—";

    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 py-8">

        {/* Hero */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-50">
              <Rocket className="size-9 text-emerald-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm">
              <CheckCircle2 className="size-4 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Campaign Submitted!</h2>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              &quot;{objective.campaignName || "Untitled"}&quot; is now under review by Snapchat.
            </p>
          </div>
        </div>

        {/* Status timeline */}
        <div className="w-full rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            {[
              { label: "Submitted", icon: CheckCircle2, active: true, done: true },
              { label: "Under Review", icon: Eye, active: true, done: false },
              { label: "Live", icon: Sparkles, active: false, done: false },
            ].map((step, i) => (
              <div key={step.label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "flex size-9 items-center justify-center rounded-full",
                    step.done ? "bg-emerald-500 text-white" : step.active ? "border-2 border-amber-400 bg-amber-50 text-amber-600" : "border-2 border-border bg-muted text-muted-foreground"
                  )}>
                    <step.icon className="size-4" />
                  </div>
                  <span className={cn("text-[11px] font-medium", step.done ? "text-emerald-600" : step.active ? "text-amber-600" : "text-muted-foreground")}>
                    {step.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={cn("mx-2 h-0.5 flex-1 rounded-full", step.done ? "bg-emerald-400" : "bg-border")} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
            <Clock className="size-3.5 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-700">
              Snapchat typically reviews ads within <span className="font-semibold">2-24 hours</span>. You&apos;ll be notified once approved.
            </p>
          </div>
        </div>

        {/* Campaign summary card */}
        <div className="w-full rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Campaign Summary</span>
            </div>
            <div className="flex items-center gap-1.5">
              <code className="rounded bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{campaignId}</code>
              <button type="button" onClick={() => navigator.clipboard.writeText(campaignId)} className="rounded p-1 text-muted-foreground hover:bg-muted"><Copy className="size-3" /></button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            {[
              { label: "Objective", value: objConfig.label, icon: Target },
              { label: "Budget", value: `${totalBudget.toLocaleString()} SAR`, icon: DollarSign },
              { label: "Duration", value: `${durationDays} days`, icon: Clock },
              { label: "Ads", value: `${creative.ads.length} ads · ${totalCreatives} creatives`, icon: ImagePlus },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1 bg-card px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <stat.icon className="size-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{stat.label}</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border px-5 py-3">
            <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-6 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Targeting</span>
                <span className="font-medium text-foreground">{countriesLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schedule</span>
                <span className="font-medium text-foreground">{startFormatted}{endFormatted ? ` → ${endFormatted}` : " (ongoing)"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bid Strategy</span>
                <span className="font-medium text-foreground">{BID_LABELS[budget.bidStrategy] || budget.bidStrategy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span className="font-medium text-foreground">{paymentMethod === "wallet" ? "Store Wallet" : "Monthly Credit"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* What's next */}
        <div className="w-full rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">What happens next?</p>
          <div className="flex flex-col gap-3">
            {[
              { icon: Eye, title: "Ad Review", desc: "Snapchat checks your ads for policy compliance. Most ads are approved within a few hours." },
              { icon: Bell, title: "Get Notified", desc: "You'll receive an email and in-app notification once your campaign is approved and starts delivering." },
              { icon: BarChart3, title: "Track Performance", desc: "Monitor impressions, clicks, and conversions in real-time from your campaign dashboard." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button className="gap-2 sm:px-6" size="lg">
            <BarChart3 className="size-4" />
            Go to Campaign Dashboard
          </Button>
          <Button variant="outline" onClick={reset} className="gap-2 sm:px-6" size="lg">
            <Plus className="size-4" />
            Create Another Campaign
          </Button>
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /*  Main review page                                                  */
  /* ================================================================== */
  return (
    <>
    <div className={cn("flex flex-col gap-6 lg:flex-row lg:items-start", WIZARD_FOOTER_PADDING_BOTTOM)}>

      {/* ============ LEFT COLUMN ============ */}
      <div className="flex flex-1 flex-col gap-4">

        {/* Page header */}
        <div>
          <h2 className="text-lg font-bold text-foreground">Review & Launch</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Review your campaign settings below. Expand any section to see details or edit.
          </p>
        </div>

        {/* Issues banner (only if issues exist) */}
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

        {/* Section cards */}
        <div className="flex flex-col gap-2.5">
          {sections.map((s) => {
            const isOpen = expandedSection === s.id;
            return (
              <div key={s.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Header - always visible */}
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

                {/* Detail rows */}
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
      </div>

      {/* ============ RIGHT COLUMN (sticky) ============ */}
      <div className="w-full lg:w-[320px] lg:shrink-0">
        <div className="lg:sticky lg:top-20 flex flex-col gap-3">

          {/* ---- Cost + Payment Card ---- */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">

            {/* Total hero */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs text-muted-foreground">Total cost (incl. VAT)</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{totalWithVat.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">SAR</span></p>
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
                    {budget.type === "daily"
                      ? autoIncrease.enabled && autoIncreaseAvailable
                        ? `${dailyAmount.toLocaleString()} SAR/day × ${durationDays} days (auto-increase)`
                        : `${dailyAmount.toLocaleString()} SAR/day × ${durationDays} days`
                      : "Lifetime budget"}
                  </span>
                  <span className="tabular-nums text-foreground">{subtotal.toLocaleString()}</span>
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
                {/* Wallet option */}
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
                  <p className={cn("text-[11px] font-bold tabular-nums", walletBalance >= totalWithVat ? "text-emerald-600" : "text-amber-600")}>
                    {walletBalance.toLocaleString()} SAR
                  </p>
                </button>

                {/* Credit option */}
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
                  <p className={cn("text-[11px] font-bold tabular-nums", creditAvailable >= totalWithVat ? "text-emerald-600" : "text-amber-600")}>
                    {creditAvailable.toLocaleString()} SAR
                  </p>
                </button>
              </div>

              {/* Insufficient warning */}
              {fundsInsufficient && (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-[11px] font-medium text-amber-800">Need {shortfall.toLocaleString()} SAR more</p>
                  <Button size="sm" variant="outline" className="h-6 gap-1 border-amber-300 px-2 text-[11px] text-amber-700 hover:bg-amber-100" onClick={() => setTopUpOpen(true)}>
                    <Plus className="size-2.5" /> Top Up
                  </Button>
                </div>
              )}
            </div>

            {/* API JSON */}
            <div className="border-t border-border px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Snap API Payload</Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiJson(!showApiJson)}
                  className="text-xs"
                >
                  {showApiJson ? "Hide" : "Show JSON"}
                </Button>
              </div>
              {showApiJson && (() => {
                const apiJson = {
                  campaign: {
                    name: objective.campaignName,
                    objective: objective.objective,
                    status: "PAUSED",
                    ...(objective.pixelMode !== "none" && { pixel_id: objective.pixelId }),
                  },
                  ad_squad: {
                    name: `${objective.campaignName} - Ad Squad`,
                    optimization_goal: budget.optimizationGoal,
                    bid_strategy: budget.bidStrategy,
                    ...(budget.bidAmount > 0 && { bid_micro: budget.bidAmount * 1_000_000 }),
                    daily_budget_micro: budget.type === "daily" ? budget.amount * 1_000_000 : undefined,
                    lifetime_budget_micro: budget.type === "lifetime" ? budget.amount * 1_000_000 : undefined,
                    start_time: budget.startDate,
                    end_time: budget.endDate || undefined,
                    targeting: {
                      geos: audience.countries.map((c: string) => ({ country_code: c })),
                      demographics: [{ age_groups: [`${audience.ageMin}-${audience.ageMax}`], genders: audience.genders }],
                      ...(audience.languages.length > 0 && { languages: { values: audience.languages } }),
                      ...(audience.interests.length > 0 && { interests: audience.interests }),
                      devices: audience.deviceOS,
                    },
                    placement_v2: {
                      config: creative.placement,
                      ...(creative.placement === "CUSTOM" && { platforms: creative.customPositions }),
                    },
                    ...(budget.conversionWindow && { conversion_window: budget.conversionWindow }),
                    pacing_type: budget.pacingType,
                    billing_event: "IMPRESSION",
                  },
                  creatives: creative.ads.map((ad: any, i: number) => ({
                    name: ad.name || `Creative ${i + 1}`,
                    type: ad.creativeType,
                    format: ad.format,
                    ...(ad.assets?.[0] && { top_snap_media_id: `<upload:${ad.assets[0].name}>` }),
                    headline: ad.assets?.[0]?.headline,
                    brand_name: ad.assets?.[0]?.brandName,
                    call_to_action: ad.assets?.[0]?.callToAction,
                    shareable: ad.assets?.[0]?.shareable,
                  })),
                };
                return (
                  <div className="relative mt-3">
                    <pre className="max-h-[300px] overflow-auto rounded-lg bg-muted p-4 text-xs leading-relaxed text-foreground">
                      {JSON.stringify(apiJson, null, 2)}
                    </pre>
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-md border bg-background p-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(apiJson, null, 2));
                        setJsonCopied(true);
                        setTimeout(() => setJsonCopied(false), 2000);
                      }}
                    >
                      {jsonCopied ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                );
              })()}
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
                disabled={!allPassed || launching || fundsInsufficient}
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

    {/* Bottom footer */}
    <WizardStepFooter
      onPrevious={() => setStep(3)}
      onNext={handleLaunch}
      previousLabel="Previous"
      nextLabel="Launch Campaign"
      nextDisabled={!allPassed || fundsInsufficient}
      nextLoading={launching}
      nextIcon={<Rocket className="size-4" />}
      accent="primary"
    />

    {/* Top Up Slider */}
    <Sheet open={topUpOpen} onOpenChange={setTopUpOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {/* Branded header */}
        <div className="bg-[#004956] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <CircleDollarSign className="size-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-white">
                Top Up {paymentMethod === "wallet" ? "Store Wallet" : "Credit"}
              </SheetTitle>
              <p className="mt-0.5 text-xs text-white/70">
                Add funds to cover your campaign budget
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="rounded-xl border border-[#a4ffe5]/40 bg-[#e6fff9] p-4">
            <p className="text-xs text-[#004956]/70">{paymentMethod === "wallet" ? "Current balance" : "Available credit"}</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-[#004956]">
              {(paymentMethod === "wallet" ? walletBalance : creditAvailable).toLocaleString()} <span className="text-sm font-medium text-[#004956]/60">SAR</span>
            </p>
            <div className="mt-3 h-px bg-[#a4ffe5]/60" />
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-[#004956]/70">Campaign cost</span>
              <span className="font-semibold text-[#004956]">{totalWithVat.toLocaleString()} SAR</span>
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-[#004956]/70">Shortfall</span>
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
                    "rounded-xl border py-2.5 text-center text-xs font-semibold transition-all",
                    topUpAmount === String(amt)
                      ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956] shadow-sm"
                      : "border-border text-foreground hover:border-[#a4ffe5] hover:bg-[#e6fff9]/50"
                  )}
                >
                  {amt.toLocaleString()} SAR
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Label className="text-xs">Custom amount</Label>
            <div className="relative mt-1.5">
              <Input
                type="number"
                placeholder="Enter amount"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="pr-12"
                min={1}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">SAR</span>
            </div>
            {topUpAmount && Number(topUpAmount) > 0 && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                New balance: <span className="font-semibold text-emerald-600">{((paymentMethod === "wallet" ? walletBalance : creditAvailable) + Number(topUpAmount)).toLocaleString()} SAR</span>
              </p>
            )}
          </div>

          {shortfall > 0 && (
            <button
              type="button"
              onClick={() => setTopUpAmount(String(shortfall))}
              className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-[#a4ffe5] bg-[#e6fff9]/50 px-3 py-2.5 text-left transition-colors hover:bg-[#e6fff9]"
            >
              <ArrowUpRight className="size-3.5 text-[#004956]" />
              <span className="text-[11px] text-muted-foreground">
                Minimum: <span className="font-semibold text-[#004956]">{shortfall.toLocaleString()} SAR</span>
              </span>
            </button>
          )}
        </div>

        <div className="border-t border-border bg-white px-5 py-4">
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-colors",
              !topUpAmount || Number(topUpAmount) <= 0
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : "bg-[#004956] text-white hover:bg-[#003a44]"
            )}
            disabled={!topUpAmount || Number(topUpAmount) <= 0}
            onClick={() => { setTopUpOpen(false); setTopUpAmount(""); }}
          >
            <Wallet className="size-4" />
            Top Up {topUpAmount ? `${Number(topUpAmount).toLocaleString()} SAR` : ""}
          </button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">You will be redirected to complete the payment</p>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
