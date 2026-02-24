"use client";

import { useState, useEffect, useRef } from "react";
import { useGoogleCampaign } from "@/lib/google/campaign-context";
import { OBJECTIVE_CONFIGS, type AppStore, type AppCampaignGoalType } from "@/lib/google/campaign-types";
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
  Info,
  CheckCircle2,
  ArrowRight,
  Zap,
  ShoppingCart,
  Sparkles,
  Search,
  LayoutGrid,
  Smartphone,
  Link2,
  Plus,
  ShieldCheck,
  AlertCircle,
  Radio,
  Store,
  Lock,
  Scan,
  Target,
  TrendingUp,
  Eye,
  MousePointerClick,
  DollarSign,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Campaign objectives (Google Ads API AdvertisingChannelType)         */
/* ------------------------------------------------------------------ */

const CAMPAIGN_OBJECTIVES: {
  value: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  active: boolean;
  channels?: string;
  funnelStage: "awareness" | "consideration" | "conversion";
  bestFor: string;
  kpis: string[];
}[] = [
  {
    value: "PERFORMANCE_MAX",
    label: "Performance Max",
    desc: "AI-powered campaigns across all Google channels.",
    icon: Zap,
    active: true,
    channels: "Search, Display, YouTube, Discover, Gmail, Maps",
    funnelStage: "conversion",
    bestFor: "AI-powered all-channel optimization",
    kpis: ["Conversions", "ROAS", "Revenue"],
  },
  {
    value: "SHOPPING",
    label: "Shopping",
    desc: "Showcase products with rich product listings.",
    icon: ShoppingCart,
    active: true,
    channels: "Google Shopping, Search, Partner Sites",
    funnelStage: "conversion",
    bestFor: "Product listing ads in Google Shopping",
    kpis: ["Purchases", "ROAS", "Click-Through"],
  },
  {
    value: "DEMAND_GEN",
    label: "Demand Gen",
    desc: "Engage audiences with visually rich ads.",
    icon: Sparkles,
    active: true,
    channels: "YouTube, Discover, Gmail, Display",
    funnelStage: "consideration",
    bestFor: "Visual storytelling on YouTube and Discover",
    kpis: ["Engagement", "Views", "Clicks"],
  },
  {
    value: "SEARCH",
    label: "Search",
    desc: "Reach people actively searching on Google.",
    icon: Search,
    active: true,
    channels: "Google Search, Search Partners",
    funnelStage: "consideration",
    bestFor: "Reaching people actively searching",
    kpis: ["Clicks", "CTR", "Conversions"],
  },
  {
    value: "DISPLAY",
    label: "Display",
    desc: "Show visual ads across millions of websites.",
    icon: LayoutGrid,
    active: true,
    channels: "Google Display Network (3M+ sites)",
    funnelStage: "awareness",
    bestFor: "Brand awareness across millions of sites",
    kpis: ["Impressions", "Reach", "Clicks"],
  },
  {
    value: "APP",
    label: "App",
    desc: "Drive app installs and in-app actions.",
    icon: Smartphone,
    active: true,
    channels: "Search, Play, YouTube, Discover, Display",
    funnelStage: "conversion",
    bestFor: "Growing mobile app installs and actions",
    kpis: ["Installs", "In-App Actions", "CPI"],
  },
];

const FUNNEL_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  awareness: { label: "Awareness", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Eye },
  consideration: { label: "Consideration", color: "text-amber-600 bg-amber-50 border-amber-200", icon: MousePointerClick },
  conversion: { label: "Conversion", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: TrendingUp },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function GoogleStepObjective() {
  const { campaign, setStep, updateNested } = useGoogleCampaign();
  const obj = campaign.objective;
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const config = OBJECTIVE_CONFIGS[obj.objective] ?? OBJECTIVE_CONFIGS.PERFORMANCE_MAX;
  const selectedObj = CAMPAIGN_OBJECTIVES.find((o) => o.value === obj.objective)!;
  const needsConversionTag = config.conversionTrackingRequired;
  const needsMerchantCenter = config.merchantCenterRequired;

  // Auto-save indicator
  useEffect(() => {
    if (!obj.campaignName && obj.tagMode === "none") return;
    setAutoSaveState("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setAutoSaveState("saved"), 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [obj.campaignName, obj.tagMode, obj.conversionId, obj.objective]);

  const handleObjectiveChange = (value: string) => {
    if (value === obj.objective) return;
    const newConfig = OBJECTIVE_CONFIGS[value];
    if (!newConfig) return;

    updateNested("objective", {
      objective: value as typeof obj.objective,
      // Reset tag/conversion for non-tracking objectives
      ...(!newConfig.conversionTrackingRequired && {
        tagMode: "none" as const,
        conversionId: "",
        conversionLabel: "",
      }),
      // Reset Merchant Center for non-shopping objectives
      ...(!newConfig.merchantCenterRequired && {
        merchantCenterConnected: false,
        merchantCenterId: "",
        feedEnabled: false,
        feedId: "",
      }),
    });

    // Also reset budget bidding to match new objective default
    updateNested("budget", {
      biddingStrategy: newConfig.defaultBiddingStrategy,
      targetCpa: 0,
      maxCpcBid: 0,
    });
  };

  const isApp = obj.objective === "APP";
  const canProceed =
    obj.campaignName.trim().length > 0 &&
    (needsConversionTag ? (obj.tagMode !== "none" || !!obj.conversionId) : true) &&
    (needsMerchantCenter ? obj.merchantCenterConnected : true) &&
    (!isApp || !!obj.appSettings?.appId?.trim());

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen bg-background">

        {/* ============================================================ */}
        {/*  MAIN CONTENT                                                */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col">

          <StepZeroHeader
            platform="google"
            title="Create Google Ads Campaign"
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
                  <h2 className="text-lg font-bold text-foreground">Choose your campaign type</h2>
                </div>
                <p className="ml-9 text-sm text-muted-foreground">
                  Select the Google Ads campaign type that best fits your marketing goal.
                </p>
              </div>

              {/* Funnel guide */}
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
                  const isActive = o.active;
                  const isSelected = o.value === obj.objective;
                  const OIcon = o.icon;
                  return (
                    <button
                      type="button"
                      key={o.value}
                      disabled={!isActive}
                      onClick={() => isActive && handleObjectiveChange(o.value)}
                      className={cn(
                        "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all duration-200",
                        !isActive
                          ? "cursor-not-allowed border-border bg-muted/50 opacity-60"
                          : isSelected
                            ? "border-primary bg-primary/[0.04] shadow-sm shadow-primary/10"
                            : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                      )}
                    >
                      {/* Coming Soon badge */}
                      {!isActive && (
                        <div className="absolute -top-2.5 right-3">
                          <Badge variant="outline" className="gap-1 rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            <Lock className="size-2.5" />
                            Coming Soon
                          </Badge>
                        </div>
                      )}

                      {/* Icon + checkmark */}
                      <div className="mb-3 flex items-center justify-between">
                        <div className={cn(
                          "flex size-10 items-center justify-center rounded-xl transition-colors",
                          !isActive
                            ? "bg-muted text-muted-foreground"
                            : isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <OIcon className="size-5" />
                        </div>
                        {isSelected && isActive && <CheckCircle2 className="size-5 text-primary" />}
                      </div>

                      {/* Title */}
                      <p className={cn(
                        "text-sm font-semibold transition-colors",
                        !isActive ? "text-muted-foreground" : isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {o.label}
                      </p>

                      {/* Description */}
                      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
                        {o.desc}
                      </p>

                      {/* Channels */}
                      {o.channels && (
                        <p className={cn(
                          "mt-1.5 text-[10px] leading-snug",
                          !isActive ? "text-muted-foreground/30" : "text-muted-foreground/70"
                        )}>
                          {o.channels}
                        </p>
                      )}

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
                    <p className="text-sm font-semibold text-foreground">{selectedObj.label}</p>
                    <p className="text-[11px] text-muted-foreground">{selectedObj.desc}</p>
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
                    <p className="text-[10px] text-muted-foreground">Features</p>
                    <p className="mt-0.5 text-[11px] font-medium text-foreground">{getObjectiveFeatures(obj.objective).length} available</p>
                  </div>
                </div>
              </div>

              {/* ---- Step 2: Campaign setup ---- */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                  <h2 className="text-lg font-bold text-foreground">Campaign setup</h2>
                </div>
                <p className="ml-9 text-sm text-muted-foreground">
                  Name your campaign and configure tracking.
                </p>
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
                      This name is for your reference and appears in your Salla dashboard and Google Ads account.
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  placeholder="e.g. Summer Collection - Performance Max"
                  value={obj.campaignName}
                  onChange={(e) =>
                    updateNested("objective", { campaignName: e.target.value.slice(0, 512) })
                  }
                  className="h-11 text-sm"
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Give your campaign a descriptive name to easily identify it later.
                  </p>
                  <span className={cn(
                    "text-xs tabular-nums",
                    obj.campaignName.length > 480 ? "text-amber-600" : "text-muted-foreground"
                  )}>
                    {obj.campaignName.length}/512
                  </span>
                </div>
              </div>

              {/* ---- App Campaign Setup (APP only) —— in Step 0 so campaign type is defined before audience ---- */}
              {isApp && (
                <div className="mb-6 rounded-xl border border-border bg-card p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Smartphone className="size-4 text-primary" />
                    <Label className="text-sm font-semibold text-foreground">App campaign setup</Label>
                    <Badge className="rounded-full bg-primary/10 px-1.5 py-0 text-[10px] text-primary">Required</Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3.5 cursor-help text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        Configure your app details. App campaigns automatically target users across Search, Play, YouTube, Discover, and Display.
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* App Store */}
                  <div className="mb-4">
                    <Label className="mb-2 text-xs font-semibold text-foreground">App Store</Label>
                    <div className="flex gap-3">
                      {([
                        { value: "GOOGLE_APP_STORE" as AppStore, label: "Google Play", desc: "Android apps" },
                        { value: "APPLE_APP_STORE" as AppStore, label: "Apple App Store", desc: "iOS apps" },
                      ]).map((store) => (
                        <label
                          key={store.value}
                          className={cn(
                            "flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all",
                            obj.appSettings.appStore === store.value
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background hover:border-primary/40"
                          )}
                        >
                          <input
                            type="radio"
                            name="appStore"
                            checked={obj.appSettings.appStore === store.value}
                            onChange={() => updateNested("objective", { appSettings: { ...obj.appSettings, appStore: store.value } })}
                            className="sr-only"
                          />
                          <div className={cn("flex size-8 items-center justify-center rounded-lg", obj.appSettings.appStore === store.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                            <Smartphone className="size-4" />
                          </div>
                          <div>
                            <p className={cn("text-xs font-semibold", obj.appSettings.appStore === store.value ? "text-primary" : "text-foreground")}>{store.label}</p>
                            <p className="text-[10px] text-muted-foreground">{store.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* App ID */}
                  <div className="mb-4">
                    <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      {obj.appSettings.appStore === "GOOGLE_APP_STORE" ? "Package Name" : "App ID"}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-3.5 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          {obj.appSettings.appStore === "GOOGLE_APP_STORE"
                            ? "Your Android app package name (e.g., com.example.myapp). Found in your Play Store URL."
                            : "Your iOS app ID number (e.g., 123456789). Found in App Store Connect."}
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      value={obj.appSettings.appId}
                      onChange={(e) => updateNested("objective", { appSettings: { ...obj.appSettings, appId: e.target.value } })}
                      placeholder={obj.appSettings.appStore === "GOOGLE_APP_STORE" ? "com.example.myapp" : "123456789"}
                      className="h-9 font-mono text-sm"
                    />
                    {!obj.appSettings.appId.trim() && (
                      <p className="mt-1 text-[10px] text-red-500">App ID is required to continue.</p>
                    )}
                  </div>

                  {/* App Name (optional) */}
                  <div className="mb-5">
                    <Label className="mb-1.5 text-xs font-semibold text-foreground">App Name (optional)</Label>
                    <Input
                      value={obj.appSettings.appName}
                      onChange={(e) => updateNested("objective", { appSettings: { ...obj.appSettings, appName: e.target.value } })}
                      placeholder="My Store App"
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Campaign Goal */}
                  <div className="mb-4">
                    <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      Campaign goal
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-3.5 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          Determines how Google optimizes bidding. Maps to AppCampaignBiddingStrategyGoalType.
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {([
                        { value: "OPTIMIZE_INSTALLS_TARGET_INSTALL_COST" as AppCampaignGoalType, label: "App Installs", desc: "Maximize installs at target CPI", icon: Plus },
                        { value: "OPTIMIZE_IN_APP_CONVERSIONS_TARGET_INSTALL_COST" as AppCampaignGoalType, label: "In-App Actions (Install Cost)", desc: "Drive actions, bid on install cost", icon: Target },
                        { value: "OPTIMIZE_IN_APP_CONVERSIONS_TARGET_CONVERSION_COST" as AppCampaignGoalType, label: "In-App Actions (CPA)", desc: "Drive actions at target CPA", icon: TrendingUp },
                        { value: "OPTIMIZE_RETURN_ON_ADVERTISING_SPEND" as AppCampaignGoalType, label: "ROAS", desc: "Maximize return on ad spend", icon: DollarSign },
                      ]).map((goal) => (
                        <label
                          key={goal.value}
                          className={cn(
                            "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-all",
                            obj.appSettings.biddingStrategyGoalType === goal.value
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background hover:border-primary/40"
                          )}
                        >
                          <input
                            type="radio"
                            name="appGoal"
                            checked={obj.appSettings.biddingStrategyGoalType === goal.value}
                            onChange={() => updateNested("objective", { appSettings: { ...obj.appSettings, biddingStrategyGoalType: goal.value } })}
                            className="sr-only"
                          />
                          <div className={cn("mt-0.5 flex size-6 items-center justify-center rounded", obj.appSettings.biddingStrategyGoalType === goal.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                            <goal.icon className="size-3.5" />
                          </div>
                          <div>
                            <p className={cn("text-[11px] font-semibold", obj.appSettings.biddingStrategyGoalType === goal.value ? "text-primary" : "text-foreground")}>{goal.label}</p>
                            <p className="text-[10px] text-muted-foreground">{goal.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="mt-0.5 size-4 text-primary" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">Automated targeting</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          App campaigns use Google AI to automatically target users across Search, Google Play, YouTube, Discover, and the Display Network. You cannot manually set keywords or audience targeting — Google optimizes based on your app listing, ad assets, and campaign goal.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- Merchant Center Connection (Shopping / PMax with feed) ---- */}
              {needsMerchantCenter && (
                <div className="mb-6 rounded-xl border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Store className="size-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            Google Merchant Center
                          </p>
                          <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs">
                            Required
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          Connect your product feed to show product listings in Google Shopping and Search.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={obj.merchantCenterConnected}
                      onCheckedChange={(checked) => updateNested("objective", { merchantCenterConnected: checked })}
                    />
                  </div>

                  {obj.merchantCenterConnected && (
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                          <Store className="size-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">Salla Product Feed</p>
                          <p className="text-xs text-muted-foreground">Auto-synced from your Salla store to Merchant Center</p>
                        </div>
                        <Badge variant="outline" className="gap-1 rounded-full px-2 text-xs">
                          <CheckCircle2 className="size-2.5 text-primary" />
                          Connected
                        </Badge>
                      </div>
                    </div>
                  )}

                  {!obj.merchantCenterConnected && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                      <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
                      <p className="text-xs text-amber-700">
                        Merchant Center is required for Shopping campaigns. Enable the connection above to continue.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ---- Shopping Campaign Settings ---- */}
              {obj.objective === "SHOPPING" && obj.merchantCenterConnected && (
                <div className="mb-6 rounded-xl border border-border bg-card p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <ShoppingCart className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Shopping Settings</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Configure how your Shopping campaign interacts with your product feed and other campaigns.
                      </p>
                    </div>
                  </div>

                  {/* Campaign Priority */}
                  <div className="mb-5">
                    <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      Campaign Priority
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-3.5 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          When the same product appears in multiple Shopping campaigns, the campaign with higher priority bids first. Use High priority for sales or promotional campaigns.
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {([
                        { value: 0, label: "Low", desc: "Default. Catch-all for remaining products." },
                        { value: 1, label: "Medium", desc: "Standard campaigns with normal bidding." },
                        { value: 2, label: "High", desc: "Sales & promotions. Bids first." },
                      ] as const).map((p) => {
                        const isSelected = obj.shoppingSettings.campaignPriority === p.value;
                        return (
                          <button
                            type="button"
                            key={p.value}
                            onClick={() =>
                              updateNested("objective", {
                                shoppingSettings: { ...obj.shoppingSettings, campaignPriority: p.value },
                              })
                            }
                            className={cn(
                              "flex flex-col rounded-xl border-2 p-3 text-left transition-all",
                              isSelected
                                ? "border-primary bg-primary/[0.04] shadow-sm"
                                : "border-border bg-background hover:border-primary/40"
                            )}
                          >
                            <p className={cn(
                              "text-xs font-semibold",
                              isSelected ? "text-primary" : "text-foreground"
                            )}>
                              {p.label}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                              {p.desc}
                            </p>
                            {isSelected && (
                              <CheckCircle2 className="mt-2 size-3.5 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feed Label */}
                  <div className="mb-5">
                    <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      Feed Label
                      <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">Optional</Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-3.5 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          Filter your product feed to only include products with this label. Useful for running campaigns targeting specific product groups.
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      placeholder="e.g. summer_sale, electronics"
                      value={obj.shoppingSettings.feedLabel}
                      onChange={(e) =>
                        updateNested("objective", {
                          shoppingSettings: { ...obj.shoppingSettings, feedLabel: e.target.value },
                        })
                      }
                      className="h-10 text-xs"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Maps to <code className="rounded bg-muted px-1 text-[10px]">ShoppingSetting.feed_label</code>. Leave empty to include all products.
                    </p>
                  </div>

                  {/* Enable Local Inventory */}
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Store className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Enable Local Inventory Ads</p>
                        <p className="text-[11px] text-muted-foreground">
                          Show product availability for nearby shoppers using local inventory feeds.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={obj.shoppingSettings.enableLocal}
                      onCheckedChange={(checked) =>
                        updateNested("objective", {
                          shoppingSettings: { ...obj.shoppingSettings, enableLocal: checked },
                        })
                      }
                    />
                  </div>

                  {/* Salla Tip */}
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
                    <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-primary">Salla Tip:</span>{" "}
                      Use <strong>Low priority</strong> as your catch-all campaign and <strong>High priority</strong> for time-limited sales. This structure ensures promotional bids take precedence without wasting budget.
                    </p>
                  </div>
                </div>
              )}

              {/* ---- Google Ads Conversion Tag (required for conversion-based objectives) ---- */}
              {needsConversionTag && (
                <div className="mb-6 rounded-xl border border-border bg-card p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Scan className="size-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          Conversion Tracking
                        </p>
                        <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs">
                          Required
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-3.5 cursor-help text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            Google Ads conversion tracking measures customer actions like purchases and add-to-carts on your store.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Track visitor actions on your store to measure and optimize campaign performance.
                      </p>
                    </div>
                  </div>

                  {/* Tag options */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Option 1: Connect Existing Tag */}
                    <button
                      type="button"
                      onClick={() => updateNested("objective", { tagMode: "existing" })}
                      className={cn(
                        "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                        obj.tagMode === "existing"
                          ? "border-primary bg-primary/[0.04] shadow-sm"
                          : "border-border bg-background hover:border-primary/40"
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className={cn(
                          "flex size-9 items-center justify-center rounded-lg transition-colors",
                          obj.tagMode === "existing"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <Link2 className="size-4" />
                        </div>
                        {obj.tagMode === "existing" && (
                          <CheckCircle2 className="size-4 text-primary" />
                        )}
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        obj.tagMode === "existing" ? "text-primary" : "text-foreground"
                      )}>
                        Connect Existing Tag
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Use a Google Ads conversion tag you already have set up in your account.
                      </p>
                    </button>

                    {/* Option 2: Create with Salla */}
                    <button
                      type="button"
                      onClick={() => updateNested("objective", { tagMode: "salla_managed" })}
                      className={cn(
                        "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                        obj.tagMode === "salla_managed"
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
                          obj.tagMode === "salla_managed"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <Plus className="size-4" />
                        </div>
                        {obj.tagMode === "salla_managed" && (
                          <CheckCircle2 className="size-4 text-primary" />
                        )}
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        obj.tagMode === "salla_managed" ? "text-primary" : "text-foreground"
                      )}>
                        Create New Tag (Salla)
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Salla will create and install Google conversion tracking on your store automatically.
                      </p>
                    </button>
                  </div>

                  {/* Existing tag -- input */}
                  {obj.tagMode === "existing" && (
                    <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
                      <Label className="mb-1.5 block text-xs font-medium text-foreground">
                        Conversion ID
                      </Label>
                      <Input
                        placeholder="e.g. AW-123456789"
                        value={obj.conversionId}
                        onChange={(e) =>
                          updateNested("objective", { conversionId: e.target.value })
                        }
                        className="h-10 font-mono text-xs"
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {"Find your Conversion ID in Google Ads > Tools > Conversions."}
                      </p>

                      {obj.conversionId && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                          <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
                          <p className="text-xs text-emerald-700">
                            Conversion tag will be verified before your campaign goes live.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Salla managed tag */}
                  {obj.tagMode === "salla_managed" && (
                    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <ShieldCheck className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Salla will handle everything</p>
                          <ul className="mt-2 flex flex-col gap-1.5">
                            {[
                              "Create Google Ads conversion tracking for your store",
                              "Automatically install the global site tag (gtag.js)",
                              "Track purchases, add-to-cart, and page views",
                              "Verify everything works before campaign launch",
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
                          Conversion tag will be created when you launch the campaign
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Warning if no tag selected */}
                  {obj.tagMode === "none" && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                      <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
                      <p className="text-xs text-amber-700">
                        Conversion tracking is required for {config.label} campaigns. Select an option above to continue.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ---- Objective Feature Cards (info section) ---- */}
              <div className="mb-6 rounded-xl border border-border bg-card p-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    {obj.objective === "PERFORMANCE_MAX" && <Zap className="size-5 text-primary" />}
                    {obj.objective === "SHOPPING" && <ShoppingCart className="size-5 text-primary" />}
                    {obj.objective === "DEMAND_GEN" && <Sparkles className="size-5 text-primary" />}
                    {obj.objective === "SEARCH" && <Search className="size-5 text-primary" />}
                    {obj.objective === "DISPLAY" && <LayoutGrid className="size-5 text-primary" />}
                    {obj.objective === "APP" && <Smartphone className="size-5 text-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{config.label} Campaign</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {getObjectiveFeatures(obj.objective).map((item) => (
                    <div key={item.title} className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-xs font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
      <WizardStepFooter
        hidePrevious
        onPrevious={() => {}}
        onNext={() => setStep(1)}
        nextLabel="Next: Audience"
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getObjectiveFeatures(objective: string): { title: string; desc: string }[] {
  switch (objective) {
    case "PERFORMANCE_MAX":
      return [
        { title: "All Google channels", desc: "Your ads run across Search, Display, YouTube, Discover, Gmail, and Maps from a single campaign." },
        { title: "AI-powered optimization", desc: "Google's AI automatically finds the best-performing combination of your assets across all channels." },
        { title: "Asset groups", desc: "Provide headlines, descriptions, images, and videos. Google creates the best ad combinations automatically." },
        { title: "Audience signals", desc: "Provide audience hints to help Google's AI find your ideal customers faster." },
      ];
    case "SHOPPING":
      return [
        { title: "Product listings", desc: "Show your products with images, prices, and store name directly in Google Shopping results." },
        { title: "Merchant Center feed", desc: "Your Salla product catalog syncs to Google Merchant Center for real-time product data." },
        { title: "Smart bidding", desc: "Automatically bid to maximize conversions or target a specific return on ad spend." },
        { title: "Local inventory", desc: "Show product availability for nearby shoppers when using local inventory feeds." },
      ];
    case "DEMAND_GEN":
      return [
        { title: "Visual storytelling", desc: "Engage users with rich image and video ads on YouTube, Discover feed, and Gmail." },
        { title: "Lookalike audiences", desc: "Reach new users similar to your existing customers using Google's audience insights." },
        { title: "Multi-format ads", desc: "Create carousel, single image, and video ads that adapt to each placement automatically." },
        { title: "Full-funnel", desc: "Drive awareness and consideration with engaging creatives that lead to conversions." },
      ];
    case "SEARCH":
      return [
        { title: "Intent-based targeting", desc: "Reach people actively searching for your products and services on Google." },
        { title: "Keyword targeting", desc: "Choose specific keywords to trigger your ads when users search for those terms." },
        { title: "Responsive search ads", desc: "Provide multiple headlines and descriptions. Google tests combinations to find the best performers." },
        { title: "Ad extensions", desc: "Add sitelinks, callouts, and structured snippets to make your ads more prominent." },
      ];
    case "DISPLAY":
      return [
        { title: "Massive reach", desc: "Show visual ads across 3 million+ websites and apps in the Google Display Network." },
        { title: "Responsive display ads", desc: "Provide assets and Google automatically creates ads that fit any ad space." },
        { title: "Audience targeting", desc: "Target users by interests, demographics, or retarget visitors who have been to your store." },
        { title: "Brand awareness", desc: "Build awareness with visually engaging ads that appear alongside relevant content." },
      ];
    case "APP":
      return [
        { title: "Cross-channel promotion", desc: "Promote your app across Search, Play Store, YouTube, Discover, and Display Network." },
        { title: "Automated optimization", desc: "Google AI optimizes your bids, targeting, and ad creatives to drive app installs." },
        { title: "In-app actions", desc: "Optimize for specific in-app events like purchases, sign-ups, or level completions." },
        { title: "Simple setup", desc: "Just provide text, images, and a budget. Google creates and optimizes ads automatically." },
      ];
    default:
      return [];
  }
}

function getObjectiveHelp(objective: string): string {
  switch (objective) {
    case "PERFORMANCE_MAX":
      return "Performance Max is the best all-in-one campaign for Salla merchants. It uses Google AI to show your ads across all channels and automatically optimizes for conversions.";
    case "SHOPPING":
      return "Shopping campaigns are ideal for Salla stores with a product catalog. Your products appear with images and prices directly in Google Shopping results.";
    case "DEMAND_GEN":
      return "Demand Gen campaigns are great for building brand awareness with engaging visual ads on YouTube, Discover, and Gmail. Best for product launches and reaching new audiences.";
    case "SEARCH":
      return "Search campaigns let you target people actively looking for your products. Best when you know what keywords your customers use to find products like yours.";
    case "DISPLAY":
      return "Display campaigns show visual ads across millions of websites. Great for retargeting store visitors and building brand awareness at scale.";
    case "APP":
      return "App campaigns drive installs and engagement for your mobile app. Google automatically optimizes across all channels to maximize app downloads.";
    default:
      return "Select a campaign type to see recommendations for your Salla store.";
  }
}
