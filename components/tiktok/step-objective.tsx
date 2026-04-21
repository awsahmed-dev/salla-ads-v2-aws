"use client";

import { useState, useEffect } from "react";
import { useTikTokCampaign } from "@/lib/tiktok/campaign-context";
import { cn } from "@/lib/utils";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";

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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Sparkles,
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

export function TikTokStepObjective({ onCancel }: { onCancel?: () => void }) {
  const { campaign, setStep, updateNested, adAccountStatus } = useTikTokCampaign();
  const catalogReady = adAccountStatus === null ? null : (adAccountStatus.exists && adAccountStatus.catalogSynced);
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
  const [showHowToConnect, setShowHowToConnect] = useState(false);
  const [showPixelHelp, setShowPixelHelp] = useState(false);
  const [objectiveSheetOpen, setObjectiveSheetOpen] = useState(false);

  const handleCatalogToggle = (enabled: boolean) => {
    updateNested("objective", {
      catalogEnabled: enabled,
      promotionType: enabled ? "CATALOG" : "WEBSITE",
      // Reset catalog fields when disabling
      ...(!enabled && {
        shoppingAdsType: "VIDEO_SHOPPING_ADS" as const,
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
        shoppingAdsType: "VIDEO_SHOPPING_ADS" as const,
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

                  {/* Funnel stage badge — reflects the selected objective's stage */}
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

              {/* Objective Grid */}
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
                            ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                            : "border-border bg-white hover:border-[#a4ffe5] hover:shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                        !o.active
                          ? "bg-muted text-muted-foreground"
                          : selected
                            ? "bg-[#004956] text-white"
                            : "bg-[#f4f4f4] text-muted-foreground group-hover:bg-[#e6fff9] group-hover:text-[#004956]"
                      )}>
                        <OIcon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-sm font-bold", !o.active ? "text-muted-foreground" : selected ? "text-[#004956]" : "text-foreground")}>{o.label}</span>
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
                    className="shrink-0 text-xs font-bold text-[#004956] underline decoration-[#a4ffe5] decoration-2 underline-offset-2 hover:decoration-[#004956]"
                  >
                    Learn more
                  </button>
                </div>
              </div>

              {/* Objective Details Sheet */}
              <Sheet open={objectiveSheetOpen} onOpenChange={setObjectiveSheetOpen}>
                <SheetContent side="right" className="flex w-full flex-col sm:max-w-[420px] bg-white p-0">
                  <div className="bg-[#004956] px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
                        <selectedObj.icon className="size-6 text-white" />
                      </div>
                      <div>
                        <SheetTitle className="text-lg font-bold text-white">{selectedObj.label}</SheetTitle>
                        <Badge className="mt-1 rounded-full border-0 bg-[#a4ffe5] px-2 py-0.5 text-xs font-medium text-[#004956]">
                          {FUNNEL_LABELS[selectedObj.funnelStage].label}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-white/70">{selectedObj.desc}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="mx-6 mt-6 flex h-[180px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#004956] to-[#006d7a]">
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
                          <p className="text-lg font-bold text-[#004956]">{config.allowedAdFormats?.length ?? 4}</p>
                          <p className="text-xs font-medium text-muted-foreground">Ad Formats</p>
                        </div>
                        <div className="rounded-xl bg-[#f4f4f4] p-4 text-center">
                          <p className="text-lg font-bold text-[#004956]">SAR 150</p>
                          <p className="text-xs font-medium text-muted-foreground">Min Budget/day</p>
                        </div>
                        <div className="rounded-xl bg-[#f4f4f4] p-4 text-center">
                          <p className="text-lg font-bold text-[#004956]">7+</p>
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
                            <span key={kpi} className="rounded-full border border-[#a4ffe5] bg-[#e6fff9] px-4 py-1.5 text-xs font-medium text-[#004956]">{kpi}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Step-by-step guide</p>
                        <div className="space-y-4">
                          {[
                            { title: "Set up tracking", desc: "Connect your TikTok Pixel or use Salla's automatic tracking." },
                            { title: "Define your audience", desc: "Choose locations, demographics, and interests." },
                            { title: "Set budget & schedule", desc: "Set daily budget and campaign duration." },
                            { title: "Create your ad", desc: "Upload creatives. TikTok recommends 3-5 variations." },
                            { title: "Launch & optimize", desc: "Review, launch, and monitor after 3-5 days." },
                          ].map((s, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#004956] text-xs font-bold text-white">{i + 1}</div>
                              <div>
                                <p className="text-sm font-bold text-foreground">{s.title}</p>
                                <p className="text-xs text-muted-foreground">{s.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#e6fff9] p-4">
                        <div className="mb-1 flex items-center gap-2">
                          <Sparkles className="size-3.5 text-[#004956]" />
                          <p className="text-xs font-bold text-[#004956]">Pro Tip</p>
                        </div>
                        <p className="text-xs leading-relaxed text-[#004956]/80">
                          {selectedObj.funnelStage === "conversion"
                            ? "Start broad and let TikTok's algorithm find your best customers. Narrow down after the learning phase."
                            : selectedObj.funnelStage === "consideration"
                              ? "Use video creatives — they drive 2x more engagement than static images on TikTok."
                              : "Maximize reach by using broad targeting and keeping your audience interests wide."}
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
                          const input = document.querySelector('input[placeholder*="TikTok"]') as HTMLInputElement;
                          if (input) { input.scrollIntoView({ behavior: 'smooth', block: 'center' }); input.focus(); }
                        }, 300);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#004956] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#003a44]"
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
                      const autoName = `${selectedObj.label} - TikTok - ${date}`;
                      updateNested("objective", { campaignName: autoName });
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-[#004956] hover:underline"
                  >
                    <Sparkles className="size-3" />
                    Auto-generate
                  </button>
                </div>
                <div className="relative">
                  <Input
                    placeholder="e.g. Summer Collection - TikTok Sales"
                    value={obj.campaignName}
                    onChange={(e) =>
                      updateNested("objective", { campaignName: e.target.value.slice(0, 512) })
                    }
                    className="h-10 pr-14 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {obj.campaignName.length}/512
                  </span>
                </div>
              </div>

              {/* ── Salla Product Catalog ── */}
              {config.catalogAvailable && (
              <div>
                <div className="border-t border-border px-4 sm:px-8 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e6fff9]">
                        <Tag className="size-5 text-[#004956]" />
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
                    {/* Loading state while checking ad account */}
                    {catalogReady === null ? (
                      <div className="flex size-9 items-center justify-center">
                        <span className="size-4 animate-spin rounded-full border-2 border-[#a4ffe5] border-t-transparent" />
                      </div>
                    ) : (
                      <Switch
                        checked={obj.catalogEnabled}
                        onCheckedChange={handleCatalogToggle}
                        disabled={!catalogReady}
                      />
                    )}
                  </div>

                  {/* New advertiser: ad account not initialized yet */}
                  {catalogReady === false && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                            Catalog Sales not available yet
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                            Your TikTok ad account is being set up. To activate Catalog Sales, you need to create and launch your first campaign with any objective (e.g., Traffic or Reach). This initializes your ad account and syncs your product catalog automatically.
                          </p>
                          <div className="mt-3 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                              <span className="flex size-5 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800 dark:bg-amber-800 dark:text-amber-200">1</span>
                              Create a campaign with Traffic, Reach, or any other objective
                            </div>
                            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                              <span className="flex size-5 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800 dark:bg-amber-800 dark:text-amber-200">2</span>
                              Your ad account and catalog will sync automatically
                            </div>
                            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                              <span className="flex size-5 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800 dark:bg-amber-800 dark:text-amber-200">3</span>
                              Come back and enable Catalog Sales for future campaigns
                            </div>
                          </div>
                          <p className="mt-3 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            You can still create a Sales campaign without the catalog — just keep this toggle off and set up your ads manually.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Catalog ready and enabled */}
                  {catalogReady && obj.catalogEnabled && (
                    <div className="mt-4 border-t border-border pt-4">
                      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Connected Catalog
                      </Label>
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-[#e6fff9]">
                          <Store className="size-4 text-[#004956]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">My Salla Store</p>
                          <p className="text-xs text-muted-foreground">Auto-synced from your Salla product catalog</p>
                        </div>
                        <Badge variant="outline" className="gap-1 rounded-full px-2 text-xs">
                          <CheckCircle2 className="size-2.5 text-[#004956]" />
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

              {/* ── TikTok Pixel (required for Sales) ── */}
              {needsPixel && (
              <div className="border-t border-border px-4 sm:px-8 py-5">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e6fff9]">
                    <Scan className="size-5 text-[#004956]" />
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
                        ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                        : "border-border bg-background hover:border-[#a4ffe5]"
                    )}
                  >
                    <div className="absolute -top-2.5 right-3">
                      <Badge className="rounded-full bg-[#004956] px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                        Recommended
                      </Badge>
                    </div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className={cn(
                        "flex size-9 items-center justify-center rounded-lg transition-colors",
                        obj.pixelMode === "salla_managed"
                          ? "bg-[#004956] text-white"
                          : "bg-muted text-muted-foreground group-hover:bg-[#e6fff9] group-hover:text-[#004956]"
                      )}>
                        <ShieldCheck className="size-4" />
                      </div>
                      {obj.pixelMode === "salla_managed" && (
                        <CheckCircle2 className="size-4 text-[#004956]" />
                      )}
                    </div>
                    <p className={cn(
                      "text-sm font-semibold",
                      obj.pixelMode === "salla_managed" ? "text-[#004956]" : "text-foreground"
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
                        ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                        : "border-border bg-background hover:border-[#a4ffe5]"
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className={cn(
                        "flex size-9 items-center justify-center rounded-lg transition-colors",
                        obj.pixelMode === "existing"
                          ? "bg-[#004956] text-white"
                          : "bg-muted text-muted-foreground group-hover:bg-[#e6fff9] group-hover:text-[#004956]"
                      )}>
                        <Link2 className="size-4" />
                      </div>
                      {obj.pixelMode === "existing" && (
                        <CheckCircle2 className="size-4 text-[#004956]" />
                      )}
                    </div>
                    <p className={cn(
                      "text-sm font-semibold",
                      obj.pixelMode === "existing" ? "text-[#004956]" : "text-foreground"
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
                  <div className="mt-4 rounded-lg border border-[#a4ffe5] bg-[#e6fff9] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e6fff9]">
                        <ShieldCheck className="size-4 text-[#004956]" />
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
                              <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-[#004956]" />
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
                            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-[#a4ffe5] hover:text-[#004956]"
                          >
                            <CircleHelp className="size-3" />
                            How does this work?
                          </button>
                        </div>

                        {/* Salla BC ID — copyable */}
                        <div className="rounded-lg border border-[#a4ffe5] bg-[#e6fff9] px-4 py-3">
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
                            { step: 1, text: "Open your TikTok Business Center", icon: <ExternalLink className="size-3 text-[#004956]" /> },
                            { step: 2, text: "Go to Assets → Pixels → select your Pixel", icon: <Scan className="size-3 text-[#004956]" /> },
                            { step: 3, text: "Click Partners → Add Partner → paste Salla's BC ID above", icon: <ArrowLeftRight className="size-3 text-[#004956]" /> },
                            { step: 4, text: "Confirm sharing — Salla will auto-detect and link it", icon: <CheckCircle2 className="size-3 text-[#004956]" /> },
                          ].map((s) => (
                            <div key={s.step} className="flex items-start gap-2.5">
                              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e6fff9]">
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

              {/* ---- App Promotion Section ---- */}
              {isAppPromo && (
                <AppPromotionSection />
              )}

              {/* ── TikTok Account Connection ── */}
              <div className="border-t border-border bg-muted/30 px-4 sm:px-8 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">TikTok Account</p>
              </div>

              <div className="px-4 sm:px-8 py-5">
                <div className="mb-1 flex items-center gap-2">
                  <User className="size-4 text-[#004956]" />
                  <p className="text-sm font-semibold text-foreground">TikTok Identity</p>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs font-normal">Required</Badge>
                  <InfoTip text="Connect your TikTok account so your ads show your real profile. This improves ad performance by up to 30% and enables Spark Ads. Salla connects via Business Center QR code." />
                </div>
                <p className="mb-5 text-xs text-muted-foreground">
                  Link your TikTok account to show your real profile on ads and unlock Spark Ads.
                </p>

                <div className="flex flex-col gap-4">
                  {/* ---- Ad Account (auto-managed by Salla) ---- */}
                  <div className="flex items-center gap-3 rounded-lg border border-[#a4ffe5] bg-[#e6fff9] px-4 py-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#e6fff9]">
                      <CheckCircle2 className="size-4 text-[#004956]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">Salla Ad Account</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Managed by Salla. Advertiser ID auto-detected from your store connection.
                      </p>
                    </div>
                    <Badge variant="outline" className="gap-1 rounded-full px-2 text-[10px]">
                      <CheckCircle2 className="size-2.5 text-[#004956]" />
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
                          <Badge variant="outline" className="gap-1 rounded-full border-[#a4ffe5] px-2 text-[10px]">
                            <CheckCircle2 className="size-2.5 text-[#004956]" />
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
                            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-[#a4ffe5] hover:text-[#004956]"
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
                        <div className="flex items-start gap-2 rounded-md border border-[#a4ffe5] bg-[#e6fff9] px-3 py-2.5">
                          <Info className="mt-0.5 size-3 shrink-0 text-[#004956]" />
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
                            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-[#a4ffe5] hover:text-[#004956]"
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
                                        <div className="size-6 animate-spin rounded-full border-2 border-[#a4ffe5] border-t-transparent" />
                                        <span className="text-[10px] font-medium text-[#004956]">Confirming...</span>
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
                                { step: 1, text: "Open the TikTok app on your phone", icon: <Smartphone className="size-3 text-[#004956]" /> },
                                { step: 2, text: "Tap your Profile, then the menu at the top right", icon: <User className="size-3 text-[#004956]" /> },
                                { step: 3, text: "Go to Settings and privacy, then QR code scanner", icon: <Globe className="size-3 text-[#004956]" /> },
                                { step: 4, text: "Point your camera at this QR code and approve", icon: <CheckCircle2 className="size-3 text-[#004956]" /> },
                              ].map((s) => (
                                <div key={s.step} className="flex items-start gap-2.5">
                                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e6fff9]">
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
                                className="text-[10px] font-medium text-[#004956] hover:underline"
                              >
                                Simulate successful scan (demo)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ---- How to Connect: Slide-in Sheet ---- */}
                  <Sheet open={showHowToConnect} onOpenChange={setShowHowToConnect}>
                    <SheetContent side="right" className="flex w-full flex-col gap-0 border-l p-0 sm:max-w-md">
                      {/* Fixed header */}
                      <div className="border-b border-border px-6 py-5">
                        <SheetHeader>
                          <SheetTitle className="flex items-center gap-2.5 text-base">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-[#e6fff9]">
                              <Smartphone className="size-4 text-[#004956]" />
                            </div>
                            How to connect your TikTok account
                          </SheetTitle>
                        </SheetHeader>
                      </div>

                      {/* Scrollable content */}
                      <div className="flex-1 overflow-y-auto px-6 py-5">
                        <div className="flex flex-col gap-6">
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
                          <div>
                            <p className="mb-3 text-sm font-semibold text-foreground">Step-by-step guide</p>
                            <div className="flex flex-col gap-4">
                              {[
                                { step: 1, title: "Enter your TikTok display name", desc: "This is the name shown at the top of your TikTok profile (e.g. \"My Salla Store\") — not your @handle." },
                                { step: 2, title: "Click \"Generate QR Code\"", desc: "A unique QR code will appear — this is your connection link." },
                                { step: 3, title: "Open TikTok on your phone", desc: "Go to your Profile page in the TikTok app." },
                                { step: 4, title: "Open the QR scanner", desc: "Tap the menu at the top right, then Settings and privacy, then QR code. Or tap the QR icon next to your username." },
                                { step: 5, title: "Scan & approve", desc: "Point your camera at the QR code on this screen. TikTok will ask you to approve the connection from Salla — tap \"Confirm\"." },
                              ].map((s) => (
                                <div key={s.step} className="flex items-start gap-3">
                                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#004956] text-[11px] font-bold text-white">
                                    {s.step}
                                  </div>
                                  <div className="pt-0.5">
                                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* FAQ */}
                          <div className="rounded-xl border border-border bg-muted/20 p-4">
                            <p className="mb-3 text-sm font-semibold text-foreground">Common questions</p>
                            <div className="flex flex-col gap-3">
                              <div>
                                <p className="text-xs font-medium text-foreground">Do I need a TikTok Business Account?</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Yes — you can switch to a Business Account for free in TikTok Settings, Manage account, Switch to Business Account.</p>
                              </div>
                              <div className="border-t border-border pt-3">
                                <p className="text-xs font-medium text-foreground">What happens after I connect?</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Your TikTok profile name and avatar will appear on your ads. You can also promote your organic posts as Spark Ads.</p>
                              </div>
                              <div className="border-t border-border pt-3">
                                <p className="text-xs font-medium text-foreground">Can I disconnect later?</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Yes — you can disconnect anytime from this page or from TikTok&apos;s Business Center settings.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fixed footer */}
                      <div className="border-t border-border px-6 py-4">
                        <Button onClick={() => setShowHowToConnect(false)} className="w-full">
                          Got it
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* ---- How to Share Pixel: Slide-in Sheet ---- */}
                  <Sheet open={showPixelHelp} onOpenChange={setShowPixelHelp}>
                    <SheetContent side="right" className="flex w-full flex-col gap-0 border-l p-0 sm:max-w-md">
                      {/* Fixed header */}
                      <div className="border-b border-border px-6 py-5">
                        <SheetHeader>
                          <SheetTitle className="flex items-center gap-2.5 text-base">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-[#e6fff9]">
                              <Scan className="size-4 text-[#004956]" />
                            </div>
                            How to share your TikTok Pixel
                          </SheetTitle>
                        </SheetHeader>
                      </div>

                      {/* Scrollable content */}
                      <div className="flex-1 overflow-y-auto px-6 py-5">
                        <div className="flex flex-col gap-6">
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
                          <div>
                            <p className="mb-3 text-sm font-semibold text-foreground">Step-by-step guide</p>
                            <div className="flex flex-col gap-4">
                              {[
                                { step: 1, title: "Open your TikTok Business Center", desc: "Go to business.tiktok.com and log in. If you don't have a Business Center, you can create one for free." },
                                { step: 2, title: "Navigate to your Pixel", desc: "Go to Assets → Pixels in the left sidebar. Select the pixel you want to share." },
                                { step: 3, title: "Add Salla as a Partner", desc: "Click on \"Partners\" tab → \"Add Partner\" → paste Salla's Business Center ID: BC_SALLA_001" },
                                { step: 4, title: "Confirm the sharing", desc: "Review the permissions and click \"Confirm\". Salla will receive access to your pixel." },
                                { step: 5, title: "Enter your Pixel ID here", desc: "Come back to this page and enter your Pixel ID. Click \"Verify\" — we'll confirm it's connected." },
                              ].map((s) => (
                                <div key={s.step} className="flex items-start gap-3">
                                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#004956] text-[11px] font-bold text-white">
                                    {s.step}
                                  </div>
                                  <div className="pt-0.5">
                                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* FAQ */}
                          <div className="rounded-xl border border-border bg-muted/20 p-4">
                            <p className="mb-3 text-sm font-semibold text-foreground">Common questions</p>
                            <div className="flex flex-col gap-3">
                              <div>
                                <p className="text-xs font-medium text-foreground">Do I need a TikTok Business Center?</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Yes — you need a Business Center to share pixels. You can create one for free at business.tiktok.com.</p>
                              </div>
                              <div className="border-t border-border pt-3">
                                <p className="text-xs font-medium text-foreground">Will Salla see my ad spend?</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">No — sharing a pixel only gives Salla access to the pixel events (purchases, page views). Your ad spend and campaign data remain private in your Business Center.</p>
                              </div>
                              <div className="border-t border-border pt-3">
                                <p className="text-xs font-medium text-foreground">Can I revoke access later?</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Yes — you can remove Salla as a partner anytime from your Business Center settings. The pixel will be disconnected.</p>
                              </div>
                              <div className="border-t border-border pt-3">
                                <p className="text-xs font-medium text-foreground">Why not just enter the Pixel ID?</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">TikTok requires Business Center-level sharing for security. A Pixel ID alone doesn&apos;t grant access — the partner sharing flow ensures both parties consent.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fixed footer */}
                      <div className="border-t border-border px-6 py-4">
                        <Button onClick={() => setShowPixelHelp(false)} className="w-full">
                          Got it
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Advertiser ID (read-only) */}
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-[10px] text-muted-foreground">Advertiser ID</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{identity.identityId || "Auto-detected from connection"}</span>
                  </div>
                </div>
              </div>

              {/* ── Traffic Pixel (optional) ── */}
              {isTraffic && (
                <div className="border-t border-border px-4 sm:px-8 py-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e6fff9]">
                      <Scan className="size-5 text-[#004956]" />
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
                          ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                          : "border-border bg-background hover:border-[#a4ffe5]"
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className={cn(
                          "flex size-9 items-center justify-center rounded-lg transition-colors",
                          obj.pixelMode === "none"
                            ? "bg-[#004956] text-white"
                            : "bg-muted text-muted-foreground group-hover:bg-[#e6fff9] group-hover:text-[#004956]"
                        )}>
                          <MousePointerClick className="size-4" />
                        </div>
                        {obj.pixelMode === "none" && (
                          <CheckCircle2 className="size-4 text-[#004956]" />
                        )}
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        obj.pixelMode === "none" ? "text-[#004956]" : "text-foreground"
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
                          ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                          : "border-border bg-background hover:border-[#a4ffe5]"
                      )}
                    >
                      <div className="absolute -top-2.5 right-3">
                        <Badge className="rounded-full bg-[#004956] px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                          Recommended
                        </Badge>
                      </div>
                      <div className="mb-3 flex items-center justify-between">
                        <div className={cn(
                          "flex size-9 items-center justify-center rounded-lg transition-colors",
                          obj.pixelMode === "salla_managed"
                            ? "bg-[#004956] text-white"
                            : "bg-muted text-muted-foreground group-hover:bg-[#e6fff9] group-hover:text-[#004956]"
                        )}>
                          <ShieldCheck className="size-4" />
                        </div>
                        {obj.pixelMode === "salla_managed" && (
                          <CheckCircle2 className="size-4 text-[#004956]" />
                        )}
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        obj.pixelMode === "salla_managed" ? "text-[#004956]" : "text-foreground"
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
                          ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                          : "border-border bg-background hover:border-[#a4ffe5]"
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className={cn(
                          "flex size-9 items-center justify-center rounded-lg transition-colors",
                          obj.pixelMode === "existing"
                            ? "bg-[#004956] text-white"
                            : "bg-muted text-muted-foreground group-hover:bg-[#e6fff9] group-hover:text-[#004956]"
                        )}>
                          <Link2 className="size-4" />
                        </div>
                        {obj.pixelMode === "existing" && (
                          <CheckCircle2 className="size-4 text-[#004956]" />
                        )}
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        obj.pixelMode === "existing" ? "text-[#004956]" : "text-foreground"
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
                    <div className="mt-4 rounded-lg border border-[#a4ffe5] bg-[#e6fff9] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e6fff9]">
                          <ShieldCheck className="size-4 text-[#004956]" />
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
                                <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-[#004956]" />
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
                              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-[#a4ffe5] hover:text-[#004956]"
                            >
                              <CircleHelp className="size-3" />
                              How?
                            </button>
                          </div>

                          <div className="rounded-lg border border-[#a4ffe5] bg-[#e6fff9] px-4 py-3">
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
    <>
      {/* App Promotion Info */}
      <div className="border-t border-border px-4 sm:px-8 py-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e6fff9]">
            <Smartphone className="size-4 text-[#004956]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">App Promotion</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              Drive app installs from TikTok. Users tap your ad and are directed to the App Store or Google Play.
            </p>
          </div>
        </div>
      </div>

      {/* App Details Form */}
      <div className="border-t border-border px-4 sm:px-8 py-5">
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
                        ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                        : "border-border bg-card hover:border-[#a4ffe5]"
                    )}
                  >
                    <div className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      selected ? "bg-[#004956] text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <Smartphone className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{platform.label}</p>
                      <p className="text-xs text-muted-foreground">{platform.desc}</p>
                    </div>
                    {selected && <CheckCircle2 className="ml-auto size-4 text-[#004956]" />}
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
    </>
  );
}

