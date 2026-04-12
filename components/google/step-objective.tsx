"use client";

import { useState, useEffect } from "react";
import { useGoogleCampaign } from "@/lib/google/campaign-context";
import { OBJECTIVE_CONFIGS, APP_GOAL_MMP_REQUIRED, type AppStore, type AppCampaignGoalType } from "@/lib/google/campaign-types";
import { generateCampaignName } from "@/lib/google/search-ai-generator";
import { getStoreInfo, getCategories } from "@/lib/salla/store-api";
import { cn } from "@/lib/utils";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Info,
  CheckCircle2,
  Zap,
  ShoppingCart,
  Sparkles,
  Search,
  LayoutGrid,
  Smartphone,
  Plus,
  ShieldCheck,
  AlertCircle,
  Store,
  Lock,
  Scan,
  Target,
  TrendingUp,
  Eye,
  MousePointerClick,
  DollarSign,
  ArrowRight,
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

export function GoogleStepObjective({ onCancel }: { onCancel?: () => void }) {
  const { campaign, setStep, updateNested } = useGoogleCampaign();
  const [objectiveSheetOpen, setObjectiveSheetOpen] = useState(false);
  const obj = campaign.objective;
  const config = OBJECTIVE_CONFIGS[obj.objective] ?? OBJECTIVE_CONFIGS.PERFORMANCE_MAX;
  const selectedObj = CAMPAIGN_OBJECTIVES.find((o) => o.value === obj.objective)!;
  const needsConversionTag = config.conversionTrackingRequired;
  const needsMerchantCenter = config.merchantCenterRequired;
  const isPMax = obj.objective === "PERFORMANCE_MAX";
  const supportsCatalogMode = isPMax;
  const requiresCatalogConnection =
    obj.objective === "SHOPPING" || (isPMax && obj.feedEnabled);

  // Auto-fill campaign name from store data on mount (skip if draft recovery)
  useEffect(() => {
    if (obj.campaignName.trim()) return;
    (async () => {
      try {
        const [store, categories] = await Promise.all([getStoreInfo(), getCategories()]);
        const name = generateCampaignName(store, categories);
        updateNested("objective", { campaignName: name });
      } catch {
        /* silently fail — merchant can type manually */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleObjectiveChange = (value: string) => {
    if (value === obj.objective) return;
    const newConfig = OBJECTIVE_CONFIGS[value];
    if (!newConfig) return;

    const supportsCatalogOnNextObjective = value === "PERFORMANCE_MAX" || value === "SHOPPING";
    updateNested("objective", {
      objective: value as typeof obj.objective,
      // Reset tag for non-tracking objectives, auto-enable for tracking objectives
      tagMode: newConfig.conversionTrackingRequired ? "salla_managed" as const : "none" as const,
      // Reset catalog/merchant center only when objective doesn't support catalog mode
      ...(!supportsCatalogOnNextObjective && {
        merchantCenterConnected: false,
        merchantCenterId: "",
        feedEnabled: false,
        feedId: "",
      }),
      ...(value === "SHOPPING" && { feedEnabled: true }),
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
    (needsConversionTag ? obj.tagMode === "salla_managed" : true) &&
    (requiresCatalogConnection ? obj.merchantCenterConnected : true) &&
    (!isApp || !!obj.appSettings?.appId?.trim());

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen bg-background">

        {/* ============================================================ */}
        {/*  MAIN CONTENT                                                */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col">

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className={cn("mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8", WIZARD_FOOTER_PADDING_BOTTOM)}>

              {/* ── Single merged card ── */}
              <div className="overflow-hidden rounded-2xl bg-card">
                {/* Header */}
                <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-6">
                  <h2 className="text-xl font-bold text-foreground">What&apos;s your campaign goal?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pick one — we&apos;ll optimize everything for the best results.
                  </p>
                  {/* Funnel stage badge */}
                  {(() => {
                    const f = FUNNEL_LABELS[selectedObj.funnelStage];
                    const FIcon = f.icon;
                    return (
                      <div className={cn("mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", f.color)}>
                        <FIcon className="size-3.5" />
                        {f.label}
                      </div>
                    );
                  })()}
                </div>

              {/* Objective Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4 sm:px-8 pb-6 sm:pb-8">
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
                        "group relative flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                        !o.active
                          ? "cursor-not-allowed opacity-40 border-border"
                          : selected
                            ? "border-primary bg-primary/[0.04] shadow-sm"
                            : "border-border bg-white hover:border-primary/40 hover:shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                        !o.active
                          ? "bg-muted text-muted-foreground"
                          : selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-[#f4f4f4] text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                        <OIcon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-sm font-bold", !o.active ? "text-muted-foreground" : selected ? "text-primary" : "text-foreground")}>{o.label}</span>
                          {!o.active && (
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Soon</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{o.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected objective detail bar */}
              <div className="border-t border-border bg-[#f4f4f4] px-4 sm:px-8 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">{selectedObj.label}</span> — {selectedObj.kpis.join(", ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setObjectiveSheetOpen(true)}
                    className="shrink-0 text-xs font-bold text-primary underline decoration-primary/30 decoration-2 underline-offset-2 hover:decoration-primary"
                  >
                    Learn more
                  </button>
                </div>
              </div>

              {/* Objective Details Sheet */}
              <Sheet open={objectiveSheetOpen} onOpenChange={setObjectiveSheetOpen}>
                <SheetContent side="right" className="flex w-full flex-col sm:max-w-[420px] bg-white p-0">
                  <div className="bg-primary px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
                        <selectedObj.icon className="size-6 text-white" />
                      </div>
                      <div>
                        <SheetTitle className="text-lg font-bold text-white">{selectedObj.label}</SheetTitle>
                        <Badge className="mt-1 rounded-full border-0 bg-primary-foreground/20 px-2 py-0.5 text-xs font-medium text-white">
                          {FUNNEL_LABELS[selectedObj.funnelStage].label}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-white/70">{selectedObj.desc}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="mx-6 mt-6 flex h-[180px] items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80">
                      <div className="text-center">
                        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-white/20">
                          <svg viewBox="0 0 24 24" className="ml-0.5 size-5 text-white" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                        <p className="text-sm font-bold text-white">Tutorial Video</p>
                        <p className="text-xs text-white/60">45 seconds — how to set up your campaign</p>
                      </div>
                    </div>
                    <div className="space-y-6 px-6 py-6">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-[#f4f4f4] p-4 text-center">
                          <p className="text-lg font-bold text-primary">{config.allowedAdFormats?.length ?? 3}</p>
                          <p className="text-xs font-medium text-muted-foreground">Ad Formats</p>
                        </div>
                        <div className="rounded-xl bg-[#f4f4f4] p-4 text-center">
                          <p className="text-lg font-bold text-primary">SAR 150</p>
                          <p className="text-xs font-medium text-muted-foreground">Min Budget/day</p>
                        </div>
                        <div className="rounded-xl bg-[#f4f4f4] p-4 text-center">
                          <p className="text-lg font-bold text-primary">7+</p>
                          <p className="text-xs font-medium text-muted-foreground">Days Recommended</p>
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Best for</p>
                        <p className="text-sm font-bold text-foreground">{selectedObj.bestFor}</p>
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Key Metrics</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedObj.kpis.map((kpi) => (
                            <span key={kpi} className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">{kpi}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Step-by-step guide</p>
                        <div className="space-y-4">
                          {[
                            { title: "Set up tracking", desc: "Connect your Google Ads conversion tag or use Salla's automatic tracking." },
                            { title: "Define your audience", desc: "Choose locations, demographics, and interests." },
                            { title: "Set budget & schedule", desc: "Set daily budget and campaign duration." },
                            { title: "Create your ad", desc: "Upload creatives. Google recommends multiple asset variations." },
                            { title: "Launch & optimize", desc: "Review, launch, and monitor after 3-5 days." },
                          ].map((s, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</div>
                              <div>
                                <p className="text-sm font-bold text-foreground">{s.title}</p>
                                <p className="text-xs text-muted-foreground">{s.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl bg-primary/5 p-4">
                        <div className="mb-1 flex items-center gap-2">
                          <Sparkles className="size-3.5 text-primary" />
                          <p className="text-xs font-bold text-primary">Pro Tip</p>
                        </div>
                        <p className="text-xs leading-relaxed text-primary/80">
                          {selectedObj.funnelStage === "conversion"
                            ? "Start broad and let Google's algorithm find your best customers. Narrow down after the learning phase."
                            : selectedObj.funnelStage === "consideration"
                              ? "Use video creatives — they drive 2x more engagement than static images."
                              : "Maximize reach by using Automatic placement and keeping your audience broad."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border p-6">
                    <button
                      type="button"
                      onClick={() => {
                        setObjectiveSheetOpen(false);
                        setTimeout(() => {
                          const input = document.querySelector('input[placeholder*="Google"]') as HTMLInputElement;
                          if (input) { input.scrollIntoView({ behavior: 'smooth', block: 'center' }); input.focus(); }
                        }, 300);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <ArrowRight className="size-4" />
                      Start Campaign
                    </button>
                    <p className="mt-2 text-center text-xs text-muted-foreground">You can change your objective at any time before launching.</p>
                  </div>
                </SheetContent>
              </Sheet>

              {/* ── Campaign Setup ── */}
              <div className="border-t border-border bg-muted/30 px-4 sm:px-8 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Campaign Setup</p>
              </div>

              {/* Campaign Name */}
              <div className="px-4 sm:px-8 pt-4 pb-6">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">
                    Campaign Name <span className="text-red-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                      const autoName = `${selectedObj.label} - Google Ads - ${date}`;
                      updateNested("objective", { campaignName: autoName });
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <Sparkles className="size-3" />
                    Auto-generate
                  </button>
                </div>
                <div className="relative">
                  <Input
                    placeholder="e.g. Summer Collection - Performance Max"
                    value={obj.campaignName}
                    onChange={(e) =>
                      updateNested("objective", { campaignName: e.target.value.slice(0, 512) })
                    }
                    className="h-11 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {obj.campaignName.length}/512
                  </span>
                </div>
              </div>

              {/* ---- App Campaign Setup (APP only) —— in Step 0 so campaign type is defined before audience ---- */}
              {isApp && (
                <div className="border-t border-border px-4 sm:px-8 py-5">
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
                    {/* MMP warning banner */}
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div>
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">No MMP integration detected</p>
                          <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                            Without an MMP (AppsFlyer, Adjust, or Firebase), only install-optimized campaigns are available. In-app conversion and ROAS goals require MMP integration.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {([
                        { value: "OPTIMIZE_INSTALLS_TARGET_INSTALL_COST" as AppCampaignGoalType, label: "App Installs (Target CPI)", desc: "Maximize installs at target cost-per-install", icon: Plus },
                        { value: "OPTIMIZE_INSTALLS_WITHOUT_TARGET_INSTALL_COST" as AppCampaignGoalType, label: "App Installs (Auto)", desc: "Maximize installs without a target CPI", icon: Zap },
                        { value: "OPTIMIZE_PRE_REGISTRATION_CONVERSION_VOLUME" as AppCampaignGoalType, label: "Pre-Registration", desc: "Maximize pre-registrations on Google Play", icon: Scan },
                        { value: "OPTIMIZE_IN_APP_CONVERSIONS_TARGET_INSTALL_COST" as AppCampaignGoalType, label: "In-App Actions (Install Cost)", desc: "Drive actions, bid on install cost", icon: Target },
                        { value: "OPTIMIZE_IN_APP_CONVERSIONS_TARGET_CONVERSION_COST" as AppCampaignGoalType, label: "In-App Actions (CPA)", desc: "Drive actions at target CPA", icon: TrendingUp },
                        { value: "OPTIMIZE_IN_APP_CONVERSIONS_WITHOUT_TARGET_CPA" as AppCampaignGoalType, label: "In-App Actions (No CPA)", desc: "Scale in-app conversions without a fixed CPA target", icon: Zap },
                        { value: "OPTIMIZE_RETURN_ON_ADVERTISING_SPEND" as AppCampaignGoalType, label: "ROAS", desc: "Maximize return on ad spend", icon: DollarSign },
                        { value: "OPTIMIZE_TOTAL_VALUE_WITHOUT_TARGET_ROAS" as AppCampaignGoalType, label: "Value (No ROAS)", desc: "Scale total conversion value without fixed ROAS", icon: TrendingUp },
                      ]).map((goal) => {
                        const needsMmp = APP_GOAL_MMP_REQUIRED[goal.value];
                        const isDisabled = needsMmp; // Disabled until MMP is connected
                        return (
                        <label
                          key={goal.value}
                          className={cn(
                            "flex items-start gap-2.5 rounded-lg border p-3 transition-all",
                            isDisabled
                              ? "cursor-not-allowed border-border bg-muted/50 opacity-60"
                              : "cursor-pointer",
                            !isDisabled && obj.appSettings.biddingStrategyGoalType === goal.value
                              ? "border-primary bg-primary/5"
                              : !isDisabled ? "border-border bg-background hover:border-primary/40" : ""
                          )}
                        >
                          <input
                            type="radio"
                            name="appGoal"
                            disabled={isDisabled}
                            checked={obj.appSettings.biddingStrategyGoalType === goal.value}
                            onChange={() => !isDisabled && updateNested("objective", { appSettings: { ...obj.appSettings, biddingStrategyGoalType: goal.value } })}
                            className="sr-only"
                          />
                          <div className={cn("mt-0.5 flex size-6 items-center justify-center rounded", !isDisabled && obj.appSettings.biddingStrategyGoalType === goal.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                            {isDisabled ? <Lock className="size-3.5" /> : <goal.icon className="size-3.5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className={cn("text-[11px] font-semibold", !isDisabled && obj.appSettings.biddingStrategyGoalType === goal.value ? "text-primary" : "text-foreground")}>{goal.label}</p>
                              {needsMmp && <Badge variant="outline" className="h-4 px-1 text-[9px] font-medium text-amber-600">Requires MMP</Badge>}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{goal.desc}</p>
                          </div>
                        </label>
                        );
                      })}
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

              {/* ---- PMax Retail Catalog Mode (optional) ---- */}
              {supportsCatalogMode && (
                <div className="border-t border-border px-4 sm:px-8 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Store className="size-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            Retail catalog mode (PMax)
                          </p>
                          <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                            Optional
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          Enable this to run feed-driven Retail Performance Max using Merchant Center products (similar to catalog sales flows).
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={obj.feedEnabled}
                      onCheckedChange={(checked) =>
                        updateNested("objective", {
                          feedEnabled: checked,
                          ...(!checked && {
                            merchantCenterConnected: false,
                            merchantCenterId: "",
                            feedId: "",
                          }),
                        })
                      }
                    />
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Off: standard PMax. On: Retail PMax with product feed signals.
                  </p>
                </div>
              )}

              {/* ---- Merchant Center Connection (Shopping / PMax with feed) ---- */}
              {requiresCatalogConnection && (
                <div className="border-t border-border px-4 sm:px-8 py-5">
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
                          Connect your Google Merchant Center account to sync your product catalog. Salla automatically manages your product feed — prices, stock, and images stay in sync.
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
                        Merchant Center is required for {obj.objective === "SHOPPING" ? "Shopping" : "Retail PMax"} when catalog mode is active.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ---- Shopping Campaign Settings ---- */}
              {obj.objective === "SHOPPING" && obj.merchantCenterConnected && (
                <div className="border-t border-border px-4 sm:px-8 py-5">
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
                        { value: 0, label: "Low", desc: "Default priority. Use when this is your only Shopping campaign for these products." },
                        { value: 1, label: "Medium", desc: "Use when running multiple Shopping campaigns. Medium priority bids before Low." },
                        { value: 2, label: "High", desc: "Bids first before Medium and Low campaigns. Use for flash sales, promotions, or high-margin products." },
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
                          Filter which products from your Merchant Center feed this campaign advertises. Leave empty to include all products. Use labels like &apos;bestsellers&apos; or &apos;clearance&apos; to segment.
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
                      Filters products by label from your Merchant Center feed. Leave empty to include all products.
                    </p>
                  </div>

                  {/* Enable Local Inventory */}
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Store className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Enable Local Inventory Ads</p>
                        <p className="text-[11px] text-muted-foreground">
                          Enable to show local product availability for customers near your physical stores. Only relevant if you have physical retail locations.
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

              {/* ---- Google Ads Conversion Tracking (auto-managed by Salla) ---- */}
              {needsConversionTag && (
                <div className="border-t border-border px-4 sm:px-8 py-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <ShieldCheck className="size-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          Conversion Tracking
                        </p>
                        <Badge className="rounded-full bg-primary/10 px-1.5 py-0 text-xs font-medium text-primary">
                          Auto
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Salla automatically sets up and manages Google Ads conversion tracking on your store.
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {[
                          "Purchase tracking",
                          "Add-to-cart events",
                          "Global site tag (gtag.js)",
                          "Pre-launch verification",
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-1.5">
                            <CheckCircle2 className="size-3 shrink-0 text-primary" />
                            <span className="text-xs text-muted-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>{/* close merged card */}

            </div>
          </div>
          <WizardStepFooter
            previousLabel="Cancel"
            onPrevious={onCancel ?? (() => {})}
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
        </div>
      </div>
    </TooltipProvider>
  );
}

