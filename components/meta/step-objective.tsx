"use client";

import { useState } from "react";
import { useMetaCampaign } from "@/lib/meta/campaign-context";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  Info,
  Tag,
  CheckCircle2,
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
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  META_OBJECTIVE_CONFIGS,
  type MetaObjective,
  type MetaSpecialAdCategory,
  type MetaConversionLocation,
} from "@/lib/meta/campaign-types";

/* ------------------------------------------------------------------ */
/*  Campaign objectives (Meta OUTCOME-based)                           */
/* ------------------------------------------------------------------ */

const CAMPAIGN_OBJECTIVES: {
  value: MetaObjective;
  label: string;
  desc: string;
  icon: React.ElementType;
  active: boolean;
  funnelStage: "awareness" | "consideration" | "conversion";
  bestFor: string;
  kpis: string[];
}[] = [
  {
    value: "OUTCOME_SALES",
    label: "Sales",
    desc: "Drive purchases on your website or from your catalog.",
    icon: ShoppingBag,
    active: true,
    funnelStage: "conversion",
    bestFor: "E-commerce stores wanting direct purchases",
    kpis: ["Purchases", "ROAS", "Add to Cart"],
  },
  {
    value: "OUTCOME_TRAFFIC",
    label: "Traffic",
    desc: "Send more people to your website or landing page.",
    icon: MousePointerClick,
    active: true,
    funnelStage: "consideration",
    bestFor: "Driving visitors to your website",
    kpis: ["Link Clicks", "CTR", "Landing Page Views"],
  },
  {
    value: "OUTCOME_AWARENESS",
    label: "Awareness",
    desc: "Maximize reach and brand recognition.",
    icon: Eye,
    active: true,
    funnelStage: "awareness",
    bestFor: "Brand launches and maximum reach",
    kpis: ["Reach", "Impressions", "Ad Recall"],
  },
  {
    value: "OUTCOME_ENGAGEMENT",
    label: "Engagement",
    desc: "Get video views, post interactions, or messages.",
    icon: Play,
    active: true,
    funnelStage: "awareness",
    bestFor: "Video views, post interactions, messages",
    kpis: ["ThruPlay", "Engagement", "Messages"],
  },
  {
    value: "OUTCOME_LEADS",
    label: "Leads",
    desc: "Collect leads via Instant Forms, Messenger, or your site.",
    icon: Users,
    active: true,
    funnelStage: "conversion",
    bestFor: "Collecting leads via forms or messaging",
    kpis: ["Leads", "Cost per Lead", "Form Submissions"],
  },
  {
    value: "OUTCOME_APP_PROMOTION",
    label: "App Promotion",
    desc: "Drive app installs and in-app events.",
    icon: Smartphone,
    active: true,
    funnelStage: "conversion",
    bestFor: "Growing mobile app installs",
    kpis: ["Installs", "In-App Events", "CPI"],
  },
];

const FUNNEL_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  awareness: { label: "Awareness", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Eye },
  consideration: { label: "Consideration", color: "text-amber-600 bg-amber-50 border-amber-200", icon: MousePointerClick },
  conversion: { label: "Conversion", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: TrendingUp },
};

/* ------------------------------------------------------------------ */
/*  Facebook & Instagram placement options                             */
/* ------------------------------------------------------------------ */



const SPECIAL_AD_OPTIONS: { value: MetaSpecialAdCategory; label: string; desc: string }[] = [
  { value: "NONE", label: "None", desc: "Standard ad campaign" },
  { value: "HOUSING", label: "Housing", desc: "Ads related to housing, real estate, or rentals" },
  { value: "EMPLOYMENT", label: "Employment", desc: "Ads for job listings or employment opportunities" },
  { value: "CREDIT", label: "Credit", desc: "Ads for credit cards, loans, or financial services" },
  { value: "ISSUES_ELECTIONS_POLITICS", label: "Social Issues / Elections", desc: "Ads about social issues, elections, or politics" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MetaStepObjective({ onCancel }: { onCancel?: () => void }) {
  const { campaign, setStep, updateNested } = useMetaCampaign();
  const obj = campaign.objective;
  const [objectiveSheetOpen, setObjectiveSheetOpen] = useState(false);

  const config = META_OBJECTIVE_CONFIGS[obj.objective] ?? META_OBJECTIVE_CONFIGS.OUTCOME_SALES;
  const selectedObj = CAMPAIGN_OBJECTIVES.find((o) => o.value === obj.objective)!;
  const isAppPromo = obj.objective === "OUTCOME_APP_PROMOTION";
  const needsPixel = config.pixelRequirement === "required";
  const optionalPixel = config.pixelRequirement === "optional";

  const handleObjectiveChange = (value: MetaObjective) => {
    if (value === obj.objective) return;
    const newConfig = META_OBJECTIVE_CONFIGS[value];
    if (!newConfig) return;

    updateNested("objective", {
      objective: value,
      ...(newConfig.pixelRequirement === "none" && {
        pixelMode: "none" as const,
        pixelId: "",
        pixelName: "",
      }),
      ...(!newConfig.catalogAvailable && {
        catalogEnabled: false,
        catalogId: "",
      }),
      conversionLocation: newConfig.conversionLocations[0] ?? ("WEBSITE" as MetaConversionLocation),
    });

    // Reset budget goal to match new objective default
    updateNested("budget", {
      optimizationGoal: newConfig.defaultGoal,
      billingEvent: "IMPRESSIONS" as const,
      bidStrategy: "LOWEST_COST_WITHOUT_CAP" as const,
      bidAmount: 0,
    });
  };

  const handleCatalogToggle = (enabled: boolean) => {
    updateNested("objective", {
      catalogEnabled: enabled,
      ...(!enabled && { catalogId: "" }),
    });
  };



  const canProceed =
    obj.campaignName.trim().length > 0 &&
    (needsPixel ? obj.pixelMode !== "none" : true) &&
    (isAppPromo ? !!obj.appSettings.appStoreUrl.trim() : true);

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
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{o.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Detail bar */}
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
                            <p className="text-lg font-bold text-[#004956]">{config.allowedAdFormats?.length ?? 3}</p>
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
                              { title: "Set up tracking", desc: "Connect your Meta Pixel or use Salla's automatic tracking." },
                              { title: "Define your audience", desc: "Choose locations, demographics, and interests." },
                              { title: "Set budget & schedule", desc: "Set daily budget and campaign duration." },
                              { title: "Create your ad", desc: "Upload creatives. Meta recommends 3-5 variations." },
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
                              ? "Start broad and let Meta's algorithm find your best customers. Narrow down after the learning phase."
                              : selectedObj.funnelStage === "consideration"
                                ? "Use video creatives — they drive 2x more engagement than static images on Facebook and Instagram."
                                : "Maximize reach by using Advantage+ placement and keeping your audience broad."}
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
                            const input = document.querySelector('input[placeholder*="Meta"]') as HTMLInputElement;
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

                {/* Campaign Setup section label */}
                <div className="border-t border-border bg-muted/30 px-4 sm:px-8 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Campaign Setup</p>
                </div>

                {/* ---- Campaign Name ---- */}
                <div className="px-4 sm:px-8 pt-4 pb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">
                      Campaign Name <span className="text-red-500">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                        const autoName = `${selectedObj.label} - Meta - ${date}`;
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
                      placeholder="e.g. Summer Collection - Meta Sales Campaign"
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

              {/* ---- Salla Product Catalog (only for Sales) ---- */}
              {config.catalogAvailable && (
                <div className="border-t border-border px-4 sm:px-8 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#1877F2]/10">
                        <Tag className="size-5 text-[#1877F2]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Salla Product Catalog
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          Show personalized product ads from your Salla catalog across Facebook and Instagram.
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
                        <div className="flex size-8 items-center justify-center rounded-lg bg-[#1877F2]/10">
                          <Store className="size-4 text-[#1877F2]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">My Salla Store</p>
                          <p className="text-xs text-muted-foreground">Auto-synced to Meta Commerce Manager</p>
                        </div>
                        <Badge variant="outline" className="gap-1 rounded-full px-2 text-xs">
                          <CheckCircle2 className="size-2.5 text-[#1877F2]" />
                          Connected
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Your products sync automatically to your Meta product catalog. No manual setup needed.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ---- Meta Pixel (required for Sales, optional for Traffic) ---- */}
              {(needsPixel || optionalPixel) && (
                <div className="border-t border-border px-4 sm:px-8 py-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#1877F2]/10">
                      <Scan className="size-5 text-[#1877F2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          Meta Pixel
                        </p>
                        <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs">
                          {needsPixel ? "Required" : "Optional"}
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-3.5 cursor-help text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            {needsPixel
                              ? "Meta Pixel is required for conversion tracking and Sales campaigns. It tracks purchase events on your website."
                              : "Adding a pixel enables Landing Page View optimization and provides better audience insights for Traffic campaigns."
                            }
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {needsPixel
                          ? "Required for purchase tracking. Meta Pixel fires conversion events to optimize delivery."
                          : "While not required, adding a pixel unlocks Landing Page View optimization for higher-quality traffic."
                        }
                      </p>
                    </div>
                  </div>

                  {/* Pixel options */}
                  <div className={cn("grid gap-3", optionalPixel ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
                    {/* Skip -- only for optional */}
                    {optionalPixel && (
                      <button
                        type="button"
                        onClick={() => updateNested("objective", { pixelMode: "none" as const, pixelId: "", pixelName: "" })}
                        className={cn(
                          "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                          obj.pixelMode === "none"
                            ? "border-[#1877F2] bg-[#1877F2]/[0.04] shadow-sm"
                            : "border-border bg-background hover:border-[#1877F2]/40"
                        )}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className={cn(
                            "flex size-9 items-center justify-center rounded-lg transition-colors",
                            obj.pixelMode === "none"
                              ? "bg-[#1877F2] text-white"
                              : "bg-muted text-muted-foreground group-hover:bg-[#1877F2]/10 group-hover:text-[#1877F2]"
                          )}>
                            <MousePointerClick className="size-4" />
                          </div>
                          {obj.pixelMode === "none" && (
                            <CheckCircle2 className="size-4 text-[#1877F2]" />
                          )}
                        </div>
                        <p className={cn(
                          "text-sm font-semibold",
                          obj.pixelMode === "none" ? "text-[#1877F2]" : "text-foreground"
                        )}>
                          Skip Pixel
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          Optimize for clicks only. No pixel setup needed.
                        </p>
                      </button>
                    )}

                    {/* Connect Existing Pixel */}
                    <button
                      type="button"
                      onClick={() => updateNested("objective", { pixelMode: "existing" as const })}
                      className={cn(
                        "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                        obj.pixelMode === "existing"
                          ? "border-[#1877F2] bg-[#1877F2]/[0.04] shadow-sm"
                          : "border-border bg-background hover:border-[#1877F2]/40"
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className={cn(
                          "flex size-9 items-center justify-center rounded-lg transition-colors",
                          obj.pixelMode === "existing"
                            ? "bg-[#1877F2] text-white"
                            : "bg-muted text-muted-foreground group-hover:bg-[#1877F2]/10 group-hover:text-[#1877F2]"
                        )}>
                          <Link2 className="size-4" />
                        </div>
                        {obj.pixelMode === "existing" && (
                          <CheckCircle2 className="size-4 text-[#1877F2]" />
                        )}
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        obj.pixelMode === "existing" ? "text-[#1877F2]" : "text-foreground"
                      )}>
                        Connect Existing
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Use a Meta Pixel already installed on your store.
                      </p>
                    </button>

                    {/* Create with Salla */}
                    <button
                      type="button"
                      onClick={() => updateNested("objective", { pixelMode: "salla_managed" as const })}
                      className={cn(
                        "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                        obj.pixelMode === "salla_managed"
                          ? "border-[#1877F2] bg-[#1877F2]/[0.04] shadow-sm"
                          : "border-border bg-background hover:border-[#1877F2]/40"
                      )}
                    >
                      <div className="absolute -top-2.5 right-3">
                        <Badge className="rounded-full bg-[#1877F2] px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                          Recommended
                        </Badge>
                      </div>
                      <div className="mb-3 flex items-center justify-between">
                        <div className={cn(
                          "flex size-9 items-center justify-center rounded-lg transition-colors",
                          obj.pixelMode === "salla_managed"
                            ? "bg-[#1877F2] text-white"
                            : "bg-muted text-muted-foreground group-hover:bg-[#1877F2]/10 group-hover:text-[#1877F2]"
                        )}>
                          <Plus className="size-4" />
                        </div>
                        {obj.pixelMode === "salla_managed" && (
                          <CheckCircle2 className="size-4 text-[#1877F2]" />
                        )}
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        obj.pixelMode === "salla_managed" ? "text-[#1877F2]" : "text-foreground"
                      )}>
                        Create New (Salla)
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Salla auto-creates and installs a Meta Pixel on your store.
                      </p>
                    </button>
                  </div>

                  {/* Existing pixel input */}
                  {obj.pixelMode === "existing" && (
                    <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
                      <Label className="mb-1.5 block text-xs font-medium text-foreground">
                        Pixel ID
                      </Label>
                      <Input
                        placeholder="e.g. 123456789012345"
                        value={obj.pixelId}
                        onChange={(e) =>
                          updateNested("objective", { pixelId: e.target.value })
                        }
                        className="h-10 font-mono text-xs"
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {"Find your Pixel ID in Meta Events Manager > Data Sources."}
                      </p>
                    </div>
                  )}

                  {/* Salla managed pixel */}
                  {obj.pixelMode === "salla_managed" && (
                    <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#1877F2]/20 bg-[#1877F2]/5 p-4">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#1877F2]" />
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          Salla will set up your Meta Pixel automatically
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          A Conversions API (CAPI) pixel will be created and installed on your Salla store for server-side event tracking.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isAppPromo && (
                <AppPromotionSection />
              )}

              {/* ---- Special Ad Categories ---- */}
              <div className="border-t border-border px-4 sm:px-8 py-5">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <AlertCircle className="size-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        Special Ad Categories
                      </p>
                      <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                        Meta Policy
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      If your ad is related to housing, employment, credit, or social/political issues, you must declare it. This is required by Meta and may limit targeting options.
                    </p>
                  </div>
                </div>

                <Select
                  value={obj.specialAdCategories[0] ?? "NONE"}
                  onValueChange={(val) =>
                    updateNested("objective", {
                      specialAdCategories: [val as MetaSpecialAdCategory],
                    })
                  }
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIAL_AD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div>
                          <span className="font-medium">{opt.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{opt.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {obj.specialAdCategories[0] && obj.specialAdCategories[0] !== "NONE" && (
                  <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950">
                    <AlertCircle className="mt-0.5 size-3 shrink-0 text-amber-600" />
                    <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
                      Declaring a special ad category will limit some targeting options (age, gender, location radius) to comply with Meta{"'"}s non-discrimination policies.
                    </p>
                  </div>
                )}
              </div>

              {/* ---- Facebook Page & Instagram Account (required by API) ---- */}
              <div className="border-t border-border px-4 sm:px-8 py-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#1877F2]/10">
                    <Store className="size-5 text-[#1877F2]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Ad Identity</p>
                    <p className="text-xs text-muted-foreground">
                      Required: your Facebook Page and Instagram account appear as the ad publisher.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Facebook Page */}
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <svg viewBox="0 0 24 24" className="size-3 text-[#1877F2]" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
                      </svg>
                      Facebook Page
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Your Store Page"
                      value={obj.facebookPageName}
                      onChange={(e) => updateNested("objective", { facebookPageName: e.target.value })}
                      className="h-9 text-sm"
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      The page that will appear as your ad publisher.
                    </p>
                  </div>

                  {/* Instagram Account */}
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <svg viewBox="0 0 24 24" className="size-3" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
                      </svg>
                      Instagram Account
                      <Badge variant="secondary" className="ml-0.5 rounded-full px-1 py-0 text-[9px]">Optional</Badge>
                    </Label>
                    <Input
                      placeholder="@yourstore"
                      value={obj.instagramAccountName}
                      onChange={(e) => updateNested("objective", { instagramAccountName: e.target.value })}
                      className="h-9 text-sm"
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      If blank, your Facebook Page is used for Instagram placements.
                    </p>
                  </div>
                </div>
              </div>

              </div>{/* close merged card */}
            </div>
          </div>
          <WizardStepFooter
            previousLabel="Cancel"
            onPrevious={onCancel ?? (() => {})}
            onNext={() => setStep(1)}
            nextLabel="Next"
            nextDisabled={!canProceed}
            accent="meta"
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ================================================================ */
/* App Promotion Section                                            */
/* ================================================================ */

function AppPromotionSection() {
  const { campaign, updateNested } = useMetaCampaign();
  const app = campaign.objective.appSettings;

  const updateApp = (updates: Partial<typeof app>) => {
    updateNested("objective", {
      appSettings: { ...app, ...updates },
    });
  };

  return (
    <>
      {/* App Settings */}
      <div className="border-t border-border px-4 sm:px-8 py-5">
        <Label className="mb-4 block text-sm font-semibold text-foreground">App Settings</Label>

        <div className="space-y-4">
          {/* Platform */}
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">App Platform</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["ANDROID", "IOS"] as const).map((plat) => (
                <button
                  key={plat}
                  type="button"
                  onClick={() => updateApp({ appPlatform: plat })}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border-2 p-3 text-left transition-all",
                    app.appPlatform === plat
                      ? "border-[#1877F2] bg-[#1877F2]/[0.04]"
                      : "border-border hover:border-[#1877F2]/40"
                  )}
                >
                  <div className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    app.appPlatform === plat ? "bg-[#1877F2] text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <Smartphone className="size-4" />
                  </div>
                  <div>
                    <p className={cn("text-xs font-semibold", app.appPlatform === plat ? "text-[#1877F2]" : "text-foreground")}>
                      {plat === "ANDROID" ? "Android" : "iOS"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {plat === "ANDROID" ? "Google Play Store" : "Apple App Store"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* App ID */}
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Application ID <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. com.example.app or 123456789"
              value={app.appId}
              onChange={(e) => updateApp({ appId: e.target.value })}
              className="h-10 font-mono text-xs"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Your app ID as registered in Meta Business Settings.
            </p>
          </div>

          {/* App Store URL */}
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              App Store URL <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder={app.appPlatform === "IOS" ? "https://apps.apple.com/app/..." : "https://play.google.com/store/apps/details?id=..."}
              value={app.appStoreUrl}
              onChange={(e) => updateApp({ appStoreUrl: e.target.value })}
              className="h-10 text-xs"
            />
          </div>
        </div>
      </div>
    </>
  );
}

