"use client";

import { useState, useEffect, useRef } from "react";
import { useTikTokCampaign } from "@/lib/tiktok/campaign-context";
import { cn } from "@/lib/utils";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { StepZeroHeader } from "@/components/shared/step-zero-header";
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
  ShoppingBag,
  Info,
  Tag,
  CheckCircle2,
  ArrowRight,
  Scan,
  Plus,
  Link2,
  ShieldCheck,
  AlertCircle,
  Radio,
  Store,
  Eye,
  MousePointerClick,
  Play,
  Users,
  Smartphone,
  Lock,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import {
  OBJECTIVE_CONFIGS,
  type AppPlatform,
} from "@/lib/tiktok/campaign-types";

/* ------------------------------------------------------------------ */
/*  Campaign objectives                                                */
/* ------------------------------------------------------------------ */

const CAMPAIGN_OBJECTIVES: {
  value: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  active: boolean;
  funnelStage: "awareness" | "consideration" | "conversion";
  bestFor: string;
  kpis: string[];
}[] = [
  {
    value: "PRODUCT_SALES",
    label: "Product Sales",
    desc: "Drive purchases on your website or app through TikTok ads.",
    icon: ShoppingBag,
    active: true,
    funnelStage: "conversion",
    bestFor: "E-commerce stores wanting direct sales",
    kpis: ["Purchases", "Add to Cart", "ROAS"],
  },
  {
    value: "REACH",
    label: "Reach",
    desc: "Show your ads to the maximum number of people.",
    icon: Eye,
    active: true,
    funnelStage: "awareness",
    bestFor: "Brand launches and maximum visibility",
    kpis: ["Impressions", "Reach", "CPM"],
  },
  {
    value: "TRAFFIC",
    label: "Traffic",
    desc: "Send more people to your website or app.",
    icon: MousePointerClick,
    active: true,
    funnelStage: "consideration",
    bestFor: "Driving visitors to landing pages",
    kpis: ["Clicks", "CTR", "Landing Page Views"],
  },
  {
    value: "VIDEO_VIEWS",
    label: "Video Views",
    desc: "Get more people to watch your video content.",
    icon: Play,
    active: true,
    funnelStage: "awareness",
    bestFor: "Video content promotion and storytelling",
    kpis: ["Video Views", "VTR", "CPV"],
  },
  {
    value: "LEAD_GENERATION",
    label: "Lead Generation",
    desc: "Collect leads with in-app forms or drive to your website.",
    icon: Users,
    active: true,
    funnelStage: "conversion",
    bestFor: "Collecting emails, phone numbers, sign-ups",
    kpis: ["Form Submissions", "Cost per Lead"],
  },
  {
    value: "APP_PROMOTION",
    label: "App Promotion",
    desc: "Drive app installs and grow your mobile user base.",
    icon: Smartphone,
    active: true,
    funnelStage: "conversion",
    bestFor: "Growing mobile app user base",
    kpis: ["Installs", "In-App Events", "CPI"],
  },
];

const FUNNEL_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  awareness: { label: "Awareness", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Eye },
  consideration: { label: "Consideration", color: "text-amber-600 bg-amber-50 border-amber-200", icon: MousePointerClick },
  conversion: { label: "Conversion", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: TrendingUp },
};

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TikTokStepObjective() {
  const { campaign, setStep, updateNested } = useTikTokCampaign();
  const obj = campaign.objective;
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save indicator
  useEffect(() => {
    if (!obj.campaignName && obj.promotionType === "WEBSITE") return;
    setAutoSaveState("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setAutoSaveState("saved"), 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [obj.campaignName, obj.promotionType, obj.catalogEnabled, obj.pixelMode, obj.pixelId]);

  const handleCatalogToggle = (enabled: boolean) => {
    updateNested("objective", {
      catalogEnabled: enabled,
      promotionType: enabled ? "CATALOG" : "WEBSITE",
      // Reset catalog fields when disabling
      ...(!enabled && {
        shoppingAdsType: "VIDEO_SHOPPING" as const,
        productSelectionMode: "ALL" as const,
        productSetId: "",
        specificProductIds: [],
        dynamicFormat: false,
      }),
    });
  };

  const config = OBJECTIVE_CONFIGS[obj.objective] ?? OBJECTIVE_CONFIGS.PRODUCT_SALES;
  const selectedObj = CAMPAIGN_OBJECTIVES.find((o) => o.value === obj.objective)!;
  const isReach = obj.objective === "REACH";
  const isTraffic = obj.objective === "TRAFFIC";
  const isVideoViews = obj.objective === "VIDEO_VIEWS";
  const isLeadGen = obj.objective === "LEAD_GENERATION";
  const isAppPromo = obj.objective === "APP_PROMOTION";
  const needsPixel = config.pixelRequirement === "required";


  const handleObjectiveChange = (value: string) => {
    if (value === obj.objective) return;
    const newConfig = OBJECTIVE_CONFIGS[value];
    if (!newConfig) return;

    const leavingLeadGen = obj.objective === "LEAD_GENERATION" && value !== "LEAD_GENERATION";
    const leavingAppPromo = obj.objective === "APP_PROMOTION" && value !== "APP_PROMOTION";

    updateNested("objective", {
      objective: value as typeof obj.objective,
      // Reset pixel for non-pixel objectives
      ...(newConfig.pixelRequirement === "none" && {
        pixelMode: "none" as const,
        pixelId: "",
        pixelName: "",
      }),
      // Reset catalog for non-catalog objectives
      ...(!newConfig.catalogAvailable && {
        catalogEnabled: false,
        promotionType: "WEBSITE" as const,
        catalogId: "",
        shoppingAdsType: "VIDEO_SHOPPING" as const,
        productSelectionMode: "ALL" as const,
        productSetId: "",
        specificProductIds: [],
        dynamicFormat: false,
      }),
      // Reset Lead Gen form config when leaving Lead Generation
      ...(leavingLeadGen && {
        leadOptimizationLocation: "INSTANT_FORM" as const,
        instantForm: {
          formName: "",
          formTemplate: "SIMPLE_SIGNUP" as const,
          formType: "MORE_VOLUME" as const,
          bannerImageUrl: "",
          headline: "",
          description: "",
          questions: [],
          personalInfoFields: ["NAME", "EMAIL", "PHONE_NUMBER"],
          companyName: "",
          privacyPolicyUrl: "",
          thankYouHeadline: "Thank you for your interest!",
          thankYouDescription: "We will get back to you shortly.",
          thankYouButtonText: "Visit Website",
          thankYouUrl: "",
        },
      }),
      // Reset App Promo settings when leaving App Promotion
      ...(leavingAppPromo && {
        appSettings: {
          appId: "",
          appName: "",
          appPlatform: "ANDROID" as const,
          appDownloadUrl: "",
          appPromotionType: "APP_INSTALL" as const,
        },
      }),
    });

    // Also reset budget goal to match new objective default
    updateNested("budget", {
      optimizationGoal: newConfig.defaultGoal,
      billingEvent: newConfig.defaultGoal === "REACH" ? "CPM" as const
        : newConfig.defaultGoal === "CLICK" ? "CPC" as const
        : (newConfig.defaultGoal === "VIDEO_VIEW" || newConfig.defaultGoal === "FOCUSED_VIEW") ? "CPV" as const
        : newConfig.defaultGoal === "LEAD_GENERATION" ? "OCPM" as const
        : newConfig.defaultGoal === "INSTALL" ? "OCPM" as const
        : newConfig.defaultGoal === "IN_APP_EVENT" ? "OCPM" as const
        : "OCPM" as const,
      bidType: "BID_TYPE_NO_BID" as const,
      bidAmount: 0,
      ...(newConfig.defaultGoal === "REACH" && {
        frequencyCap: { frequency: 3, schedule: 7 as const },
      }),
    });

    // Remove ads whose format is incompatible with the new objective
    const allowed = new Set(newConfig.allowedAdFormats);
    const currentAds = campaign.creative.ads ?? [];
    const compatibleAds = currentAds.filter((ad) => allowed.has(ad.adFormat));
    if (compatibleAds.length !== currentAds.length) {
      updateNested("creative", { ads: compatibleAds });
    }
  };

  const canProceed =
    obj.campaignName.trim().length > 0 &&
    (needsPixel
      ? (obj.pixelMode === "salla_managed" || (obj.pixelMode === "existing" && !!obj.pixelId.trim()))
      : true) &&
    (isAppPromo ? (!!obj.appSettings.appDownloadUrl.trim() && !!obj.appSettings.appId.trim()) : true);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen bg-background">

        {/* ============================================================ */}
        {/*  MAIN CONTENT                                                */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col">

          <StepZeroHeader
            platform="tiktok"
            title="Create TikTok Campaign"
            subtitle="Salla Ads"
            saveState={autoSaveState}
          />

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className={cn("mx-auto w-full max-w-3xl px-6 py-8", WIZARD_FOOTER_PADDING_BOTTOM)}>

              {/* ---- Step 1: Campaign Goal ---- */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                  <h2 className="text-lg font-bold text-foreground">Choose your goal</h2>
                </div>
                <p className="ml-9 text-sm text-muted-foreground">
                  What do you want to achieve? We&apos;ll optimize your ads for the best results.
                </p>
              </div>

              {/* Funnel guide (compact) */}
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-2.5">
                {(["awareness", "consideration", "conversion"] as const).map((stage, i) => {
                  const f = FUNNEL_LABELS[stage];
                  const FIcon = f.icon;
                  const isActive = selectedObj.funnelStage === stage;
                  return (
                    <div key={stage} className="flex items-center gap-2">
                      {i > 0 && <ArrowRight className="size-3 text-border" />}
                      <div className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                        isActive ? f.color : "border-transparent text-muted-foreground"
                      )}>
                        <FIcon className="size-3" />
                        {f.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Objective Cards */}
              <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CAMPAIGN_OBJECTIVES.map((o) => {
                  const selected = obj.objective === o.value;
                  const OIcon = o.icon;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      disabled={!o.active}
                      onClick={() => o.active && handleObjectiveChange(o.value)}
                      className={cn(
                        "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all duration-200",
                        !o.active
                          ? "cursor-not-allowed border-border bg-muted/50 opacity-60"
                          : selected
                            ? "border-primary bg-primary/[0.04] shadow-sm shadow-primary/10"
                            : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                      )}
                    >
                      {/* Coming Soon badge */}
                      {!o.active && (
                        <div className="absolute -top-2 right-2">
                          <Badge variant="outline" className="gap-1 rounded-full bg-background px-1.5 py-0 text-[10px] font-medium text-muted-foreground">
                            <Lock className="size-2.5" />
                            Coming Soon
                          </Badge>
                        </div>
                      )}

                      {/* Icon + checkmark */}
                      <div className="mb-3 flex items-center justify-between">
                        <div className={cn(
                          "flex size-10 items-center justify-center rounded-xl transition-colors",
                          !o.active
                            ? "bg-muted text-muted-foreground"
                            : selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <OIcon className="size-5" />
                        </div>
                        {selected && o.active && <CheckCircle2 className="size-5 text-primary" />}
                      </div>

                      {/* Title */}
                      <p className={cn(
                        "text-sm font-semibold transition-colors",
                        !o.active ? "text-muted-foreground" : selected ? "text-primary" : "text-foreground"
                      )}>
                        {o.label}
                      </p>

                      {/* Description */}
                      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
                        {o.desc}
                      </p>

                      {/* KPIs */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {o.kpis.map((kpi) => (
                          <span key={kpi} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {kpi}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ---- Selected Objective Summary ---- */}
              <div className="mb-8 rounded-xl border border-primary/20 bg-primary/[0.02] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-primary/10">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <selectedObj.icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{config.label}</p>
                    <p className="text-[11px] text-muted-foreground">{config.description}</p>
                  </div>
                  <Badge variant="outline" className={cn("rounded-full border text-[10px] font-semibold", FUNNEL_LABELS[selectedObj.funnelStage].color)}>
                    {FUNNEL_LABELS[selectedObj.funnelStage].label}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 divide-x divide-primary/10 px-1 py-3">
                  <div className="px-4 text-center">
                    <p className="text-[10px] text-muted-foreground">Best for</p>
                    <p className="mt-0.5 text-[11px] font-medium text-foreground">{selectedObj.bestFor}</p>
                  </div>
                  <div className="px-4 text-center">
                    <p className="text-[10px] text-muted-foreground">Key metrics</p>
                    <p className="mt-0.5 text-[11px] font-medium text-foreground">{selectedObj.kpis.join(", ")}</p>
                  </div>
                  <div className="px-4 text-center">
                    <p className="text-[10px] text-muted-foreground">Ad formats</p>
                    <p className="mt-0.5 text-[11px] font-medium text-foreground">{config.allowedAdFormats.length} available</p>
                  </div>
                </div>
              </div>

              {/* ---- Step 2: Campaign Setup ---- */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                  <h2 className="text-lg font-bold text-foreground">Campaign setup</h2>
                </div>
                <p className="ml-9 text-sm text-muted-foreground">Name your campaign and configure tracking.</p>
              </div>

              {/* ---- Campaign Name ---- */}
              <div className="mb-6 rounded-xl border border-border bg-card p-6">
                <Label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  Campaign Name
                  <span className="text-destructive">*</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 cursor-help text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      This name is for your reference and appears in your Salla dashboard.
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  placeholder="e.g. Summer Collection - TikTok Sales"
                  value={obj.campaignName}
                  onChange={(e) =>
                    updateNested("objective", { campaignName: e.target.value.slice(0, 512) })
                  }
                  className="h-11 text-sm"
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Give your campaign a descriptive name to easily identify it later in your dashboard.
                  </p>
                  <span className={cn(
                    "text-xs tabular-nums",
                    obj.campaignName.length > 480 ? "text-amber-600" : "text-muted-foreground"
                  )}>
                    {obj.campaignName.length}/512
                  </span>
                </div>
              </div>

              {/* ---- Campaign Budget Optimization (CBO) ---- */}
              <div className="mb-6 rounded-xl border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <TrendingUp className="size-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          Campaign Budget Optimization
                        </p>
                        <Badge variant="outline" className="rounded-full px-2 text-[10px] font-medium">
                          CBO
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Let TikTok automatically distribute your campaign budget across ad groups to maximize overall results.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={obj.budgetOptimizeOn}
                    onCheckedChange={(checked) =>
                      updateNested("objective", { budgetOptimizeOn: checked })
                    }
                  />
                </div>
                {obj.budgetOptimizeOn && (
                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/[0.03] px-4 py-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">How it works:</span> TikTok
                      will automatically allocate more budget to higher-performing ad groups
                      and reduce spend on underperformers. All ad groups must share the same
                      optimization goal. Recommended for campaigns with 3+ ad groups.
                    </p>
                  </div>
                )}
              </div>

              {/* ---- Salla Product Catalog (only for catalog-capable objectives) ---- */}
              {config.catalogAvailable && (
              <div className="mb-6 flex flex-col gap-4">
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Tag className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Salla Product Catalog
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          Show personalized product ads based on your Salla catalog and visitor behavior.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={obj.catalogEnabled}
                      onCheckedChange={handleCatalogToggle}
                    />
                  </div>

                    {obj.catalogEnabled && (
                      <div className="mt-4 border-t border-border pt-4">
                        <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Connected Catalog
                        </Label>
                        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                            <Store className="size-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">My Salla Store</p>
                            <p className="text-xs text-muted-foreground">Auto-synced from your Salla product catalog</p>
                          </div>
                          <Badge variant="outline" className="gap-1 rounded-full px-2 text-xs">
                            <CheckCircle2 className="size-2.5 text-primary" />
                            Connected
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Your products are automatically synced. No manual setup needed.
                        </p>
                      </div>
                    )}
                </div>
              </div>
              )}

              {/* ---- TikTok Pixel (required for Sales, not needed for Reach) ---- */}
              {needsPixel && (
              <div className="mb-6 rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Scan className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        TikTok Pixel
                      </p>
                      <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs">
                        Required
                      </Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-3.5 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          A small piece of code on your store that tracks customer actions like purchases and page views.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Tracks visitor actions on your store so we can measure and optimize your results.
                    </p>
                  </div>
                </div>

                {/* Pixel options -- card style (same as Snap) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Option 1: Connect Existing Pixel */}
                  <button
                    type="button"
                    onClick={() => updateNested("objective", { pixelMode: "existing" })}
                    className={cn(
                      "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                      obj.pixelMode === "existing"
                        ? "border-primary bg-primary/[0.04] shadow-sm"
                        : "border-border bg-background hover:border-primary/40"
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className={cn(
                        "flex size-9 items-center justify-center rounded-lg transition-colors",
                        obj.pixelMode === "existing"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                        <Link2 className="size-4" />
                      </div>
                      {obj.pixelMode === "existing" && (
                        <CheckCircle2 className="size-4 text-primary" />
                      )}
                    </div>
                    <p className={cn(
                      "text-sm font-semibold",
                      obj.pixelMode === "existing" ? "text-primary" : "text-foreground"
                    )}>
                      Connect Existing Pixel
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Use a TikTok Pixel you already have set up in your TikTok Ads account.
                    </p>
                  </button>

                  {/* Option 2: Create with Salla */}
                  <button
                    type="button"
                    onClick={() => updateNested("objective", { pixelMode: "salla_managed" })}
                    className={cn(
                      "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                      obj.pixelMode === "salla_managed"
                        ? "border-primary bg-primary/[0.04] shadow-sm"
                        : "border-border bg-background hover:border-primary/40"
                    )}
                  >
                    {/* Recommended badge */}
                    <div className="absolute -top-2.5 right-3">
                      <Badge className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
                        Recommended
                      </Badge>
                    </div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className={cn(
                        "flex size-9 items-center justify-center rounded-lg transition-colors",
                        obj.pixelMode === "salla_managed"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                        <Plus className="size-4" />
                      </div>
                      {obj.pixelMode === "salla_managed" && (
                        <CheckCircle2 className="size-4 text-primary" />
                      )}
                    </div>
                    <p className={cn(
                      "text-sm font-semibold",
                      obj.pixelMode === "salla_managed" ? "text-primary" : "text-foreground"
                    )}>
                      Create New Pixel (Salla)
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Salla will create and install a TikTok Pixel on your store automatically.
                    </p>
                  </button>
                </div>

                {/* Existing pixel -- input */}
                {obj.pixelMode === "existing" && (
                  <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
                    <Label className="mb-1.5 block text-xs font-medium text-foreground">
                      Pixel ID
                    </Label>
                    <Input
                      placeholder="e.g. CP1A2B3C4D5E6F7G8H"
                      value={obj.pixelId}
                      onChange={(e) =>
                        updateNested("objective", { pixelId: e.target.value })
                      }
                      className="h-10 font-mono text-xs"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      You can find your Pixel ID in your TikTok Ads Manager under Events.
                    </p>

                    {obj.pixelId && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
                        <p className="text-xs text-emerald-700">
                          Pixel will be verified before your campaign goes live.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Salla managed pixel */}
                {obj.pixelMode === "salla_managed" && (
                  <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <ShieldCheck className="size-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Salla will handle everything</p>
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {[
                            "Create and set up a TikTok tracking pixel for your store",
                            "Automatically install it on your Salla store",
                            "Track purchases, add-to-cart, and page views",
                            "Verify everything works before your campaign goes live",
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                      <Radio className="size-3.5 text-primary" />
                      <p className="text-xs font-medium text-primary">
                        Pixel will be created when you launch the campaign
                      </p>
                    </div>
                  </div>
                )}

                {/* Warning if no pixel selected */}
                {obj.pixelMode === "none" && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-700">
                      A TikTok Pixel is required for Sales campaigns. Select an option above to continue.
                    </p>
                  </div>
                )}
              </div>
              )}

              {/* ---- Reach Objective Info ---- */}
              {isReach && (
                <div className="mb-6 rounded-xl border border-border bg-card p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Eye className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Reach Campaign</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Maximize the number of unique people who see your ad. TikTok will optimize delivery to show your ad to as many people as possible within your budget.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      {
                        title: "No pixel required",
                        desc: "Reach campaigns don't need conversion tracking. You pay for impressions (CPM), not actions.",
                      },
                      {
                        title: "Frequency control",
                        desc: "Set how many times each person sees your ad to avoid ad fatigue and maximize unique reach.",
                      },
                      {
                        title: "All ad formats supported",
                        desc: "Use Single Video, Single Image, Carousel, or Spark Ads to reach your audience.",
                      },
                      {
                        title: "Brand awareness focused",
                        desc: "Best for product launches, brand awareness, and reaching new audiences at scale.",
                      },
                    ].map((item) => (
                      <div key={item.title} className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-xs font-medium text-foreground">{item.title}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- Traffic Objective Info ---- */}
              {isTraffic && (
                <div className="mb-6 rounded-xl border border-border bg-card p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MousePointerClick className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Traffic Campaign</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Drive more visitors to your website or landing page. TikTok will optimize delivery to send the most people to your destination URL within your budget.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      {
                        title: "Pixel is optional",
                        desc: "A pixel is not required but recommended for Landing Page View optimization and better audience insights.",
                      },
                      {
                        title: "Two optimization goals",
                        desc: "Choose between Clicks (maximize link clicks, CPC billing) or Landing Page View (higher-quality traffic, oCPM billing).",
                      },
                      {
                        title: "All ad formats supported",
                        desc: "Use Single Video, Single Image, Carousel, or Spark Ads to drive traffic to your site.",
                      },
                      {
                        title: "Website promotion",
                        desc: "Best for driving visitors to product pages, blog posts, promotions, or any landing page on your store.",
                      },
                    ].map((item) => (
                      <div key={item.title} className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-xs font-medium text-foreground">{item.title}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- Video Views Objective Info ---- */}
              {isVideoViews && (
                <div className="mb-6 rounded-xl border border-border bg-card p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Play className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Video Views Campaign</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Get more people to watch your video content. TikTok will optimize delivery to show your videos to users most likely to watch them, billed by CPV (cost per view).
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      {
                        title: "No pixel required",
                        desc: "Video Views campaigns optimize for views, not website actions. You pay per video view (CPV), not conversions.",
                      },
                      {
                        title: "Two optimization goals",
                        desc: "Choose Video View (2-second views for broad reach) or Focused View (6-second views for higher engagement).",
                      },
                      {
                        title: "Video formats only",
                        desc: "Use Single Video or Spark Ads. Image and carousel formats are not supported for Video Views campaigns.",
                      },
                      {
                        title: "Brand & content promotion",
                        desc: "Best for brand storytelling, product demos, content creators, and building video engagement at scale.",
                      },
                    ].map((item) => (
                      <div key={item.title} className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-xs font-medium text-foreground">{item.title}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- Lead Generation Section ---- */}
              {isLeadGen && (
                <LeadGenerationSection />
              )}

              {/* ---- App Promotion Section ---- */}
              {isAppPromo && (
                <AppPromotionSection />
              )}

              {/* ---- Traffic Pixel (optional) ---- */}
              {isTraffic && (
                <div className="mb-6 rounded-xl border border-border bg-card p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Scan className="size-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          TikTok Pixel
                        </p>
                        <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs">
                          Optional
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-3.5 cursor-help text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            Adding a pixel enables Landing Page View optimization and provides better audience insights for your Traffic campaign.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        While not required, adding a pixel unlocks Landing Page View optimization for higher-quality traffic.
                      </p>
                    </div>
                  </div>

                  {/* Pixel options */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Option: No Pixel */}
                    <button
                      type="button"
                      onClick={() => updateNested("objective", { pixelMode: "none" as const, pixelId: "", pixelName: "" })}
                      className={cn(
                        "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                        obj.pixelMode === "none"
                          ? "border-primary bg-primary/[0.04] shadow-sm"
                          : "border-border bg-background hover:border-primary/40"
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className={cn(
                          "flex size-9 items-center justify-center rounded-lg transition-colors",
                          obj.pixelMode === "none"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <MousePointerClick className="size-4" />
                        </div>
                        {obj.pixelMode === "none" && (
                          <CheckCircle2 className="size-4 text-primary" />
                        )}
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        obj.pixelMode === "none" ? "text-primary" : "text-foreground"
                      )}>
                        Skip Pixel
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Optimize for clicks only. No pixel setup needed.
                      </p>
                    </button>

                    {/* Option: Connect Existing Pixel */}
                    <button
                      type="button"
                      onClick={() => updateNested("objective", { pixelMode: "existing" as const })}
                      className={cn(
                        "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                        obj.pixelMode === "existing"
                          ? "border-primary bg-primary/[0.04] shadow-sm"
                          : "border-border bg-background hover:border-primary/40"
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className={cn(
                          "flex size-9 items-center justify-center rounded-lg transition-colors",
                          obj.pixelMode === "existing"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <Link2 className="size-4" />
                        </div>
                        {obj.pixelMode === "existing" && (
                          <CheckCircle2 className="size-4 text-primary" />
                        )}
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        obj.pixelMode === "existing" ? "text-primary" : "text-foreground"
                      )}>
                        Connect Existing
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Use a TikTok Pixel to unlock Landing Page View optimization.
                      </p>
                    </button>

                    {/* Option: Create with Salla */}
                    <button
                      type="button"
                      onClick={() => updateNested("objective", { pixelMode: "salla_managed" as const })}
                      className={cn(
                        "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                        obj.pixelMode === "salla_managed"
                          ? "border-primary bg-primary/[0.04] shadow-sm"
                          : "border-border bg-background hover:border-primary/40"
                      )}
                    >
                      <div className="absolute -top-2.5 right-3">
                        <Badge className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
                          Recommended
                        </Badge>
                      </div>
                      <div className="mb-3 flex items-center justify-between">
                        <div className={cn(
                          "flex size-9 items-center justify-center rounded-lg transition-colors",
                          obj.pixelMode === "salla_managed"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <Plus className="size-4" />
                        </div>
                        {obj.pixelMode === "salla_managed" && (
                          <CheckCircle2 className="size-4 text-primary" />
                        )}
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        obj.pixelMode === "salla_managed" ? "text-primary" : "text-foreground"
                      )}>
                        Create New (Salla)
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Salla auto-creates and installs a pixel on your store.
                      </p>
                    </button>
                  </div>

                  {/* Existing pixel -- input */}
                  {obj.pixelMode === "existing" && (
                    <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
                      <Label className="mb-1.5 block text-xs font-medium text-foreground">
                        Pixel ID
                      </Label>
                      <Input
                        placeholder="e.g. CP1A2B3C4D5E6F7G8H"
                        value={obj.pixelId}
                        onChange={(e) =>
                          updateNested("objective", { pixelId: e.target.value })
                        }
                        className="h-10 font-mono text-xs"
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        You can find your Pixel ID in your TikTok Ads Manager under Events.
                      </p>
                    </div>
                  )}

                  {/* Salla managed pixel */}
                  {obj.pixelMode === "salla_managed" && (
                    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <ShieldCheck className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Salla will handle everything</p>
                          <ul className="mt-2 flex flex-col gap-1.5">
                            {[
                              "Create and set up a TikTok tracking pixel for your store",
                              "Automatically install it on your Salla store",
                              "Enable Landing Page View tracking for higher-quality traffic",
                              "Verify everything works before your campaign goes live",
                            ].map((item) => (
                              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-primary" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hint when no pixel */}
                  {obj.pixelMode === "none" && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
                      <Info className="size-3.5 shrink-0 text-blue-600" />
                      <p className="text-xs text-blue-700">
                        Without a pixel, you can only optimize for Clicks (CPC). Add a pixel to unlock Landing Page View optimization for higher-quality traffic.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
      <WizardStepFooter
        hidePrevious
        onPrevious={() => {}}
        onNext={() => setStep(1)}
        nextLabel="Next"
        nextDisabled={!canProceed}
        secondaryAction={{
          label: "Discard draft",
          onClick: () => {
            if (window.confirm("Discard this campaign draft? All unsaved changes will be lost.")) {
              window.location.href = "/";
            }
          },
        }}
      />
    </TooltipProvider>
  );
}

/* ================================================================ */
/* Lead Generation Section -- Info Panel & Location Picker          */
/* ================================================================ */

function AppPromotionSection() {
  const { campaign, updateNested } = useTikTokCampaign();
  const app = campaign.objective.appSettings;

  const updateApp = (updates: Partial<typeof app>) => {
    updateNested("objective", {
      appSettings: { ...app, ...updates },
    });
  };

  return (
    <div className="mb-6 space-y-6">
      {/* Info Panel */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Smartphone className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">App Promotion Campaign</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Drive app installs from TikTok. Users tap your ad and are directed to the App Store or Google Play to download your app.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { title: "SDK tracking (no pixel)", desc: "App installs are tracked via TikTok SDK or MMP integration. No website pixel needed." },
            { title: "App Store & Google Play", desc: "Supports both iOS and Android apps. Users are directed to the correct store automatically." },
            { title: "Multiple optimization goals", desc: "Optimize for installs, in-app events (AEO), or clicks depending on your campaign stage." },
            { title: "Video + Image + Spark Ads", desc: "Use Single Video, Single Image, or Spark Ads to promote your app. Carousel is not supported." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-foreground">{item.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* App Details Form */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h4 className="mb-1 text-sm font-semibold text-foreground">App Details</h4>
        <p className="mb-4 text-xs text-muted-foreground">
          Enter your app information. Your app must be registered in TikTok Events Manager.
        </p>
        <div className="space-y-4">
          {/* App Platform */}
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">App Platform</Label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "ANDROID" as AppPlatform, label: "Android", desc: "Google Play Store" },
                { value: "IOS" as AppPlatform, label: "iOS", desc: "Apple App Store" },
              ]).map((platform) => {
                const selected = app.appPlatform === platform.value;
                return (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => updateApp({ appPlatform: platform.value })}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
                      selected
                        ? "border-primary bg-primary/[0.03] shadow-sm"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      <Smartphone className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{platform.label}</p>
                      <p className="text-xs text-muted-foreground">{platform.desc}</p>
                    </div>
                    {selected && <CheckCircle2 className="ml-auto size-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* App Download URL */}
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              App Download URL <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder={app.appPlatform === "IOS"
                ? "https://apps.apple.com/app/your-app/id123456789"
                : "https://play.google.com/store/apps/details?id=com.example.app"
              }
              value={app.appDownloadUrl}
              onChange={(e) => updateApp({ appDownloadUrl: e.target.value })}
              className="h-10 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The direct link to your app in the {app.appPlatform === "IOS" ? "Apple App Store" : "Google Play Store"}.
            </p>
          </div>

          {/* App Name */}
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">App Name</Label>
            <Input
              placeholder="e.g. My Salla Store"
              value={app.appName}
              onChange={(e) => updateApp({ appName: e.target.value })}
              className="h-10 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Display name for your reference. Not sent to TikTok API.
            </p>
          </div>

          {/* TikTok App ID */}
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              TikTok App ID <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. 1234567890"
              value={app.appId}
              onChange={(e) => updateApp({ appId: e.target.value })}
              className="h-10 font-mono text-xs"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Found in TikTok Events Manager under your registered app. Required for the API <code className="rounded bg-muted px-1 text-[10px]">app_id</code> field.
            </p>
          </div>
        </div>

        {/* Hint */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-700">
            Your app must be registered in <span className="font-semibold">TikTok Events Manager</span> with the TikTok SDK or an MMP (AppsFlyer, Adjust, etc.) integrated before creating this campaign.
          </p>
        </div>
      </div>
    </div>
  );
}

function LeadGenerationSection() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardList className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Lead Generation Campaign</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Collect customer information through TikTok Instant Forms or your website. Users submit their details with auto-filled fields for higher conversion rates.
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { title: "No pixel required", desc: "Instant Form leads are tracked natively by TikTok. No pixel or website tracking code needed." },
          { title: "Auto-filled fields", desc: "Name, email, and phone are pre-filled from user profiles, reducing friction and increasing form completions." },
          { title: "All ad formats supported", desc: "Use Single Video, Single Image, Carousel, or Spark Ads to promote your lead form." },
          { title: "CRM integration ready", desc: "Download leads from TikTok Ads Manager or auto-sync with your CRM via webhooks or Zapier." },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium text-foreground">{item.title}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
        <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Your lead collection method and Instant Form will be configured in the <span className="font-medium text-foreground">Ad Design</span> step alongside your ad creative.
        </p>
      </div>
    </div>
  );
}
