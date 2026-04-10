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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Store,
  Eye,
  MousePointerClick,
  Play,
  Users,
  Smartphone,
  Lock,
  ClipboardList,
  TrendingUp,
  User,
  Globe,
  CircleHelp,
  PlayCircle,
  ExternalLink,
  Copy,
  ArrowLeftRight,
} from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
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
  const cr = campaign.creative;
  const identity = cr.identity ?? {
    identityType: "BC_AUTH_TT" as const,
    identityId: "",
    displayName: "",
    avatarPreviewUrl: "",
    businessCenterId: "",
    tiktokUsername: "",
    linkStatus: "not_started" as const,
  };
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [showHowToConnect, setShowHowToConnect] = useState(false);
  const [showPixelHelp, setShowPixelHelp] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save indicator
  useEffect(() => {
    if (!obj.campaignName && obj.promotionType === "WEBSITE") return;
    setAutoSaveState("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setAutoSaveState("saved"), 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [obj.campaignName, obj.promotionType, obj.catalogEnabled, obj.pixelMode, obj.pixelId, obj.pixelLinkStatus]);

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
        pixelLinkStatus: "not_started" as const,
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
      ? (obj.pixelMode === "salla_managed" || (obj.pixelMode === "existing" && obj.pixelLinkStatus === "shared" && !!obj.pixelId.trim()))
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
                      <InfoTip text="A small piece of code on your store that tracks customer actions like purchases and page views." />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Tracks visitor actions on your store so we can measure and optimize your results.
                    </p>
                  </div>
                </div>

                {/* Pixel options */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Option 1: Use Salla Pixel */}
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
                        <ShieldCheck className="size-4" />
                      </div>
                      {obj.pixelMode === "salla_managed" && (
                        <CheckCircle2 className="size-4 text-primary" />
                      )}
                    </div>
                    <p className={cn(
                      "text-sm font-semibold",
                      obj.pixelMode === "salla_managed" ? "text-primary" : "text-foreground"
                    )}>
                      Use Salla Pixel
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Salla creates, installs, and manages the pixel on your store automatically.
                    </p>
                  </button>

                  {/* Option 2: Connect Your Pixel */}
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
                      Connect Your Pixel
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Share your existing TikTok Pixel with Salla via Business Center.
                    </p>
                  </button>
                </div>

                {/* ---- Salla managed pixel detail ---- */}
                {obj.pixelMode === "salla_managed" && (
                  <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <ShieldCheck className="size-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Salla handles everything automatically</p>
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
                  </div>
                )}

                {/* ---- Connect existing pixel — BC sharing flow ---- */}
                {obj.pixelMode === "existing" && (
                  <div className="mt-4 rounded-lg border border-border bg-muted/20 p-5">
                    {obj.pixelLinkStatus === "shared" && obj.pixelId ? (
                      /* ======== Connected State ======== */
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100">
                            <Scan className="size-5 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-foreground">{obj.pixelName || "Your Pixel"}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">ID: {obj.pixelId}</p>
                          </div>
                          <Badge variant="outline" className="gap-1 rounded-full border-emerald-300 px-2 text-[10px] text-emerald-700">
                            <CheckCircle2 className="size-2.5 text-emerald-600" />
                            Shared
                          </Badge>
                        </div>
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                          Your pixel has been shared with Salla&apos;s Business Center and linked to your ad account. All historical conversion data is preserved.
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            updateNested("objective", {
                              pixelLinkStatus: "not_started" as const,
                              pixelId: "",
                              pixelName: "",
                            })
                          }
                          className="self-start text-[10px] font-medium text-destructive hover:underline"
                        >
                          Disconnect &amp; use a different pixel
                        </button>
                      </div>
                    ) : (
                      /* ======== Sharing Instructions ======== */
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs font-semibold text-foreground">Share your Pixel with Salla</p>
                            <p className="text-[10px] text-muted-foreground">
                              Share your existing pixel from your TikTok Business Center to use it with your Salla campaigns.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPixelHelp(true)}
                            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                          >
                            <CircleHelp className="size-3" />
                            How does this work?
                          </button>
                        </div>

                        {/* Salla BC ID — copyable */}
                        <div className="rounded-lg border border-primary/20 bg-primary/[0.03] px-4 py-3">
                          <p className="mb-1.5 text-[10px] font-medium text-foreground">Salla Business Center ID</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground">
                              BC_SALLA_001
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 px-3 text-[10px]"
                              onClick={() => {
                                navigator.clipboard.writeText("BC_SALLA_001");
                              }}
                            >
                              <Copy className="size-3" />
                              Copy
                            </Button>
                          </div>
                          <p className="mt-1.5 text-[10px] text-muted-foreground">
                            Use this ID to add Salla as a partner in your TikTok Business Center.
                          </p>
                        </div>

                        {/* Step-by-step */}
                        <div className="flex flex-col gap-2.5">
                          {[
                            { step: 1, text: "Open your TikTok Business Center", icon: <ExternalLink className="size-3 text-primary" /> },
                            { step: 2, text: "Go to Assets → Pixels → select your Pixel", icon: <Scan className="size-3 text-primary" /> },
                            { step: 3, text: "Click Partners → Add Partner → paste Salla's BC ID above", icon: <ArrowLeftRight className="size-3 text-primary" /> },
                            { step: 4, text: "Confirm sharing — Salla will auto-detect and link it", icon: <CheckCircle2 className="size-3 text-primary" /> },
                          ].map((s) => (
                            <div key={s.step} className="flex items-start gap-2.5">
                              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                {s.icon}
                              </div>
                              <div>
                                <p className="text-[11px] font-medium text-foreground">Step {s.step}</p>
                                <p className="text-[10px] leading-relaxed text-muted-foreground">{s.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pixel ID input — for verification */}
                        <div className="border-t border-border pt-4">
                          <Label className="mb-1.5 block text-xs font-medium text-foreground">
                            Pixel ID <span className="font-normal text-muted-foreground">(after sharing)</span>
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g. CP1A2B3C4D5E6F7G8H"
                              value={obj.pixelId}
                              onChange={(e) =>
                                updateNested("objective", { pixelId: e.target.value })
                              }
                              className="h-10 flex-1 font-mono text-xs"
                            />
                            <Button
                              onClick={() => {
                                if (!obj.pixelId.trim()) return;
                                /* In production: call Salla backend to verify pixel is shared with our BC */
                                updateNested("objective", {
                                  pixelLinkStatus: "shared" as const,
                                  pixelName: "Merchant Pixel",
                                });
                              }}
                              disabled={!obj.pixelId.trim()}
                              className="h-10 gap-1.5 px-4"
                            >
                              <CheckCircle2 className="size-3.5" />
                              Verify
                            </Button>
                          </div>
                          <p className="mt-1.5 text-[10px] text-muted-foreground">
                            Enter your Pixel ID after you&apos;ve shared it with Salla. We&apos;ll verify it&apos;s connected to our Business Center.
                          </p>
                        </div>

                        {/* Why use your own pixel */}
                        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5">
                          <Info className="mt-0.5 size-3 shrink-0 text-blue-600" />
                          <p className="text-[10px] leading-relaxed text-blue-700">
                            <span className="font-medium">Why connect your own pixel?</span>{" "}
                            If you already have a pixel with historical data, sharing it preserves your conversion history and audience data for better campaign optimization.
                          </p>
                        </div>
                      </div>
                    )}
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

              {/* ---- TikTok Account Connection ---- */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {isAppPromo ? "4" : isLeadGen ? "4" : needsPixel ? "4" : "3"}
                  </span>
                  <h2 className="text-lg font-bold text-foreground">TikTok Account Connection</h2>
                </div>
                <p className="ml-9 text-sm text-muted-foreground">
                  Link your TikTok account so your ads show your real profile and unlock Spark Ads.
                </p>
              </div>

              <div className="mb-6 rounded-xl border border-border bg-card p-6">
                <div className="mb-1 flex items-center gap-2">
                  <User className="size-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">TikTok Identity</p>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs font-normal">Required</Badge>
                  <InfoTip text="Connect your TikTok account so your ads show your real profile. This improves ad performance by up to 30% and enables Spark Ads. Salla connects via Business Center QR code." />
                </div>
                <p className="mb-5 text-xs text-muted-foreground">
                  Link your TikTok account to show your real profile on ads and unlock Spark Ads.
                </p>

                <div className="flex flex-col gap-4">
                  {/* ---- Ad Account (auto-managed by Salla) ---- */}
                  <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/[0.02] px-4 py-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <CheckCircle2 className="size-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">Salla Ad Account</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Managed by Salla. Advertiser ID auto-detected from your store connection.
                      </p>
                    </div>
                    <Badge variant="outline" className="gap-1 rounded-full px-2 text-[10px]">
                      <CheckCircle2 className="size-2.5 text-primary" />
                      Connected
                    </Badge>
                  </div>

                  {/* ---- QR Code Linking Flow ---- */}
                  <div className="rounded-lg border border-border bg-muted/20 p-5">
                    {identity.linkStatus === "confirmed" && identity.tiktokUsername ? (
                      /* ======== Connected State ======== */
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-11 items-center justify-center rounded-full bg-foreground">
                            <svg viewBox="0 0 24 24" className="size-5 text-background" fill="currentColor">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.83 4.83 0 0 1-1-.15z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-foreground">{identity.tiktokUsername}</p>
                            <p className="text-[10px] text-muted-foreground">TikTok Account linked via Business Center</p>
                          </div>
                          <Badge variant="outline" className="gap-1 rounded-full border-primary/30 px-2 text-[10px]">
                            <CheckCircle2 className="size-2.5 text-primary" />
                            Linked
                          </Badge>
                        </div>
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                          Your ads will show your TikTok profile name and avatar. You can now use Spark Ads to promote your organic posts.
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            updateNested("creative", {
                              identity: { ...identity, linkStatus: "not_started", identityId: "", tiktokUsername: "", displayName: "" },
                            })
                          }
                          className="self-start text-[10px] font-medium text-destructive hover:underline"
                        >
                          Disconnect &amp; link a different account
                        </button>
                      </div>
                    ) : identity.linkStatus === "not_started" ? (
                      /* ======== Step 1: Enter Display Name ======== */
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs font-semibold text-foreground">Connect your TikTok account</p>
                            <p className="text-[10px] text-muted-foreground">
                              Enter your TikTok display name, then scan the QR code to link.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowHowToConnect(true)}
                            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                          >
                            <CircleHelp className="size-3" />
                            How does this work?
                          </button>
                        </div>

                        {/* Display name input */}
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs font-medium text-foreground">Your TikTok Display Name</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g. My Salla Store"
                              value={identity.displayName}
                              onChange={(e) =>
                                updateNested("creative", {
                                  identity: { ...identity, displayName: e.target.value.slice(0, 40) },
                                })
                              }
                              className="h-10 flex-1 text-sm"
                            />
                            <Button
                              onClick={() => {
                                if (!identity.displayName.trim()) return;
                                /* In production: call Salla backend -> TikTok BC API to generate QR code */
                                updateNested("creative", {
                                  identity: { ...identity, linkStatus: "qr_generated", tiktokUsername: identity.displayName.trim() },
                                });
                              }}
                              disabled={!identity.displayName.trim()}
                              className="h-10 gap-1.5 px-4"
                            >
                              <Smartphone className="size-3.5" />
                              Generate QR Code
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            This is the <span className="font-medium text-foreground">display name</span> shown at the top of your TikTok profile — not your @username. For example, if your profile shows &quot;My Salla Store&quot; above @mysallastore, enter &quot;My Salla Store&quot;.
                          </p>
                        </div>

                        {/* Why connect benefits */}
                        <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
                          <Info className="mt-0.5 size-3 shrink-0 text-primary" />
                          <p className="text-[10px] leading-relaxed text-muted-foreground">
                            <span className="font-medium text-foreground">Why connect?</span> Linking your TikTok account improves ad performance by up to 30% and unlocks Spark Ads — promoting your organic TikTok posts as paid ads for higher engagement and trust.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* ======== Step 2: QR Code Generated — Scan Now ======== */
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-foreground">Scan QR Code</p>
                              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">
                                {identity.displayName}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Open TikTok on your phone and scan this QR code to connect.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowHowToConnect(true)}
                            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                          >
                            <PlayCircle className="size-3" />
                            Watch how
                          </button>
                        </div>

                        <div className="flex gap-5">
                          {/* QR Code */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative flex size-40 items-center justify-center rounded-xl border-2 border-border bg-white shadow-sm">
                              {(identity.linkStatus === "qr_generated" || identity.linkStatus === "scanned") && (
                                <>
                                  <div className="grid size-32 grid-cols-7 grid-rows-7 gap-[2px] p-2">
                                    {Array.from({ length: 49 }).map((_, i) => (
                                      <div
                                        key={i}
                                        className={cn(
                                          "rounded-[1px]",
                                          [0,1,2,3,4,5,6,7,8,12,13,14,18,19,20,21,22,23,24,25,26,27,28,30,34,35,36,40,42,43,44,45,46,47,48].includes(i)
                                            ? "bg-foreground"
                                            : "bg-transparent"
                                        )}
                                      />
                                    ))}
                                  </div>
                                  {identity.linkStatus === "scanned" && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/90">
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        <span className="text-[10px] font-medium text-primary">Confirming...</span>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                              {identity.linkStatus === "expired" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateNested("creative", { identity: { ...identity, linkStatus: "qr_generated" } })
                                  }
                                  className="flex flex-col items-center gap-2 px-3 py-2"
                                >
                                  <AlertCircle className="size-6 text-amber-500" />
                                  <span className="text-[10px] font-medium text-amber-600">Expired — tap to refresh</span>
                                </button>
                              )}
                            </div>
                            <p className="text-[9px] text-muted-foreground">QR code expires in 5 minutes</p>
                          </div>

                          {/* Steps */}
                          <div className="flex flex-1 flex-col gap-3">
                            <div className="flex flex-col gap-3">
                              {[
                                { step: 1, text: "Open the TikTok app on your phone", icon: <Smartphone className="size-3 text-primary" /> },
                                { step: 2, text: "Tap your Profile, then the menu at the top right", icon: <User className="size-3 text-primary" /> },
                                { step: 3, text: "Go to Settings and privacy, then QR code scanner", icon: <Globe className="size-3 text-primary" /> },
                                { step: 4, text: "Point your camera at this QR code and approve", icon: <CheckCircle2 className="size-3 text-primary" /> },
                              ].map((s) => (
                                <div key={s.step} className="flex items-start gap-2.5">
                                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    {s.icon}
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-medium text-foreground">Step {s.step}</p>
                                    <p className="text-[10px] leading-relaxed text-muted-foreground">{s.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 border-t border-border pt-3">
                              <button
                                type="button"
                                onClick={() =>
                                  updateNested("creative", {
                                    identity: { ...identity, linkStatus: "not_started" },
                                  })
                                }
                                className="text-[10px] font-medium text-muted-foreground hover:text-foreground"
                              >
                                Back
                              </button>
                              <span className="text-[10px] text-muted-foreground/40">|</span>
                              {/* Simulate link for demo */}
                              <button
                                type="button"
                                onClick={() =>
                                  updateNested("creative", {
                                    identity: {
                                      ...identity,
                                      linkStatus: "confirmed",
                                      tiktokUsername: identity.displayName || "My Salla Store",
                                      identityId: "tt_mock_identity_001",
                                      businessCenterId: "bc_salla_001",
                                    },
                                  })
                                }
                                className="text-[10px] font-medium text-primary hover:underline"
                              >
                                Simulate successful scan (demo)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ---- How to Connect: Help Dialog ---- */}
                  <Dialog open={showHowToConnect} onOpenChange={setShowHowToConnect}>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Smartphone className="size-4 text-primary" />
                          How to connect your TikTok account
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-5">
                        {/* Video/GIF placeholder */}
                        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-foreground to-foreground/80">
                          <div className="flex flex-col items-center gap-3 text-background/80">
                            <div className="flex size-14 items-center justify-center rounded-full bg-background/20 backdrop-blur-sm">
                              <PlayCircle className="size-8 text-background" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-background">Tutorial Video</p>
                              <p className="text-xs text-background/60">30 seconds — how to scan and connect</p>
                            </div>
                          </div>
                          <div className="absolute bottom-3 right-3 opacity-30">
                            <svg viewBox="0 0 24 24" className="size-6 text-background" fill="currentColor">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.83 4.83 0 0 1-1-.15z"/>
                            </svg>
                          </div>
                        </div>

                        {/* Step-by-step text guide */}
                        <div className="flex flex-col gap-3">
                          <p className="text-xs font-semibold text-foreground">Step-by-step guide</p>
                          {[
                            { step: 1, title: "Enter your TikTok display name", desc: "This is the name shown at the top of your TikTok profile (e.g. \"My Salla Store\") — not your @handle." },
                            { step: 2, title: "Click \"Generate QR Code\"", desc: "A unique QR code will appear — this is your connection link." },
                            { step: 3, title: "Open TikTok on your phone", desc: "Go to your Profile page in the TikTok app." },
                            { step: 4, title: "Open the QR scanner", desc: "Tap the menu at the top right, then Settings and privacy, then QR code. Or tap the QR icon next to your username." },
                            { step: 5, title: "Scan & approve", desc: "Point your camera at the QR code on this screen. TikTok will ask you to approve the connection from Salla — tap \"Confirm\"." },
                          ].map((s) => (
                            <div key={s.step} className="flex items-start gap-3">
                              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {s.step}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground">{s.title}</p>
                                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{s.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* FAQ */}
                        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                          <p className="mb-2 text-xs font-semibold text-foreground">Common questions</p>
                          <div className="flex flex-col gap-2">
                            <div>
                              <p className="text-[11px] font-medium text-foreground">Do I need a TikTok Business Account?</p>
                              <p className="text-[10px] text-muted-foreground">Yes — you can switch to a Business Account for free in TikTok Settings, Manage account, Switch to Business Account.</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-foreground">What happens after I connect?</p>
                              <p className="text-[10px] text-muted-foreground">Your TikTok profile name and avatar will appear on your ads. You can also promote your organic posts as Spark Ads.</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-foreground">Can I disconnect later?</p>
                              <p className="text-[10px] text-muted-foreground">Yes — you can disconnect anytime from this page or from TikTok&apos;s Business Center settings.</p>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => setShowHowToConnect(false)}
                          className="w-full"
                        >
                          Got it
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* ---- How to Share Pixel: Help Dialog ---- */}
                  <Dialog open={showPixelHelp} onOpenChange={setShowPixelHelp}>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Scan className="size-4 text-primary" />
                          How to share your TikTok Pixel
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-5">
                        {/* Video/GIF placeholder */}
                        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-foreground to-foreground/80">
                          <div className="flex flex-col items-center gap-3 text-background/80">
                            <div className="flex size-14 items-center justify-center rounded-full bg-background/20 backdrop-blur-sm">
                              <PlayCircle className="size-8 text-background" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-background">Tutorial Video</p>
                              <p className="text-xs text-background/60">45 seconds — how to share your pixel</p>
                            </div>
                          </div>
                        </div>

                        {/* Step-by-step text guide */}
                        <div className="flex flex-col gap-3">
                          <p className="text-xs font-semibold text-foreground">Step-by-step guide</p>
                          {[
                            { step: 1, title: "Open your TikTok Business Center", desc: "Go to business.tiktok.com and log in. If you don't have a Business Center, you can create one for free." },
                            { step: 2, title: "Navigate to your Pixel", desc: "Go to Assets → Pixels in the left sidebar. Select the pixel you want to share." },
                            { step: 3, title: "Add Salla as a Partner", desc: "Click on \"Partners\" tab → \"Add Partner\" → paste Salla's Business Center ID: BC_SALLA_001" },
                            { step: 4, title: "Confirm the sharing", desc: "Review the permissions and click \"Confirm\". Salla will receive access to your pixel." },
                            { step: 5, title: "Enter your Pixel ID here", desc: "Come back to this page and enter your Pixel ID. Click \"Verify\" — we'll confirm it's connected." },
                          ].map((s) => (
                            <div key={s.step} className="flex items-start gap-3">
                              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {s.step}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground">{s.title}</p>
                                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{s.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* FAQ */}
                        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                          <p className="mb-2 text-xs font-semibold text-foreground">Common questions</p>
                          <div className="flex flex-col gap-2">
                            <div>
                              <p className="text-[11px] font-medium text-foreground">Do I need a TikTok Business Center?</p>
                              <p className="text-[10px] text-muted-foreground">Yes — you need a Business Center to share pixels. You can create one for free at business.tiktok.com.</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-foreground">Will Salla see my ad spend?</p>
                              <p className="text-[10px] text-muted-foreground">No — sharing a pixel only gives Salla access to the pixel events (purchases, page views). Your ad spend and campaign data remain private in your Business Center.</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-foreground">Can I revoke access later?</p>
                              <p className="text-[10px] text-muted-foreground">Yes — you can remove Salla as a partner anytime from your Business Center settings. The pixel will be disconnected.</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-foreground">Why not just enter the Pixel ID?</p>
                              <p className="text-[10px] text-muted-foreground">TikTok requires Business Center-level sharing for security. A Pixel ID alone doesn&apos;t grant access — the partner sharing flow ensures both parties consent.</p>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => setShowPixelHelp(false)}
                          className="w-full"
                        >
                          Got it
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Advertiser ID (read-only) */}
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-[10px] text-muted-foreground">Advertiser ID</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{identity.identityId || "Auto-detected from connection"}</span>
                  </div>
                </div>
              </div>

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
                        <InfoTip text="Adding a pixel enables Landing Page View optimization and provides better audience insights for your Traffic campaign." />
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        While not required, adding a pixel unlocks Landing Page View optimization for higher-quality traffic.
                      </p>
                    </div>
                  </div>

                  {/* Pixel options */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Option: Skip Pixel */}
                    <button
                      type="button"
                      onClick={() => updateNested("objective", { pixelMode: "none" as const, pixelId: "", pixelName: "", pixelLinkStatus: "not_started" as const })}
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

                    {/* Option: Use Salla Pixel */}
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
                          <ShieldCheck className="size-4" />
                        </div>
                        {obj.pixelMode === "salla_managed" && (
                          <CheckCircle2 className="size-4 text-primary" />
                        )}
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        obj.pixelMode === "salla_managed" ? "text-primary" : "text-foreground"
                      )}>
                        Use Salla Pixel
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Salla auto-creates and installs a pixel on your store.
                      </p>
                    </button>

                    {/* Option: Connect Your Pixel */}
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
                        Connect Your Pixel
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Share your existing pixel via Business Center.
                      </p>
                    </button>
                  </div>

                  {/* Salla managed pixel detail */}
                  {obj.pixelMode === "salla_managed" && (
                    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <ShieldCheck className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Salla handles everything automatically</p>
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

                  {/* Connect existing pixel — BC sharing flow (same as required section) */}
                  {obj.pixelMode === "existing" && (
                    <div className="mt-4 rounded-lg border border-border bg-muted/20 p-5">
                      {obj.pixelLinkStatus === "shared" && obj.pixelId ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100">
                              <Scan className="size-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-foreground">{obj.pixelName || "Your Pixel"}</p>
                              <p className="font-mono text-[10px] text-muted-foreground">ID: {obj.pixelId}</p>
                            </div>
                            <Badge variant="outline" className="gap-1 rounded-full border-emerald-300 px-2 text-[10px] text-emerald-700">
                              <CheckCircle2 className="size-2.5 text-emerald-600" />
                              Shared
                            </Badge>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateNested("objective", {
                                pixelLinkStatus: "not_started" as const,
                                pixelId: "",
                                pixelName: "",
                              })
                            }
                            className="self-start text-[10px] font-medium text-destructive hover:underline"
                          >
                            Disconnect &amp; use a different pixel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                              <p className="text-xs font-semibold text-foreground">Share your Pixel with Salla</p>
                              <p className="text-[10px] text-muted-foreground">
                                Share your existing pixel from your TikTok Business Center.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowPixelHelp(true)}
                              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <CircleHelp className="size-3" />
                              How?
                            </button>
                          </div>

                          <div className="rounded-lg border border-primary/20 bg-primary/[0.03] px-4 py-3">
                            <p className="mb-1.5 text-[10px] font-medium text-foreground">Salla Business Center ID</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground">
                                BC_SALLA_001
                              </code>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 px-3 text-[10px]"
                                onClick={() => { navigator.clipboard.writeText("BC_SALLA_001"); }}
                              >
                                <Copy className="size-3" />
                                Copy
                              </Button>
                            </div>
                          </div>

                          <div className="border-t border-border pt-4">
                            <Label className="mb-1.5 block text-xs font-medium text-foreground">
                              Pixel ID <span className="font-normal text-muted-foreground">(after sharing)</span>
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="e.g. CP1A2B3C4D5E6F7G8H"
                                value={obj.pixelId}
                                onChange={(e) =>
                                  updateNested("objective", { pixelId: e.target.value })
                                }
                                className="h-10 flex-1 font-mono text-xs"
                              />
                              <Button
                                onClick={() => {
                                  if (!obj.pixelId.trim()) return;
                                  updateNested("objective", {
                                    pixelLinkStatus: "shared" as const,
                                    pixelName: "Merchant Pixel",
                                  });
                                }}
                                disabled={!obj.pixelId.trim()}
                                className="h-10 gap-1.5 px-4"
                              >
                                <CheckCircle2 className="size-3.5" />
                                Verify
                              </Button>
                            </div>
                            <p className="mt-1.5 text-[10px] text-muted-foreground">
                              Enter your Pixel ID after sharing it with Salla.
                            </p>
                          </div>
                        </div>
                      )}
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
