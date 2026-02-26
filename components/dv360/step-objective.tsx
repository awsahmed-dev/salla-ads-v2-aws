"use client";

import { useState, useEffect, useRef } from "react";
import { useDV360Campaign } from "@/lib/dv360/campaign-context";
import { DV360_OBJECTIVE_CONFIGS, type DV360Objective } from "@/lib/dv360/campaign-types";
import { cn } from "@/lib/utils";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { StepZeroHeader } from "@/components/shared/step-zero-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CheckCircle2,
  ArrowRight,
  Eye,
  PlayCircle,
  MousePointerClick,
  TrendingUp,
  Lock,
  Globe,
  Target,
  AlertCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Campaign objectives (DV360 YouTube & Partners)                     */
/* ------------------------------------------------------------------ */

const CAMPAIGN_OBJECTIVES: {
  value: DV360Objective;
  label: string;
  desc: string;
  icon: React.ElementType;
  active: boolean;
  channels: string;
  funnelStage: "awareness" | "consideration" | "conversion";
  bestFor: string;
  kpis: string[];
}[] = [
  {
    value: "AWARENESS",
    label: "Awareness",
    desc: "Maximize reach and brand recall on YouTube.",
    icon: Eye,
    active: true,
    channels: "YouTube, Google TV, Video Partners",
    funnelStage: "awareness",
    bestFor: "Maximizing reach and brand recall",
    kpis: ["Impressions", "Reach", "CPM"],
  },
  {
    value: "CONSIDERATION",
    label: "Consideration",
    desc: "Drive video views and audience engagement.",
    icon: PlayCircle,
    active: true,
    channels: "YouTube In-Stream, In-Feed, Shorts",
    funnelStage: "consideration",
    bestFor: "Driving video views and engagement",
    kpis: ["Video Views", "VTR", "CPV"],
  },
  {
    value: "CONVERSION",
    label: "Conversion",
    desc: "Drive online actions with YouTube video ads.",
    icon: MousePointerClick,
    active: true,
    channels: "YouTube In-Stream, In-Feed, Shorts",
    funnelStage: "conversion",
    bestFor: "Driving website purchases and sign-ups",
    kpis: ["Conversions", "CPA", "ROAS"],
  },
  {
    value: "PERFORMANCE",
    label: "Performance",
    desc: "Maximize conversions with automated YouTube ads.",
    icon: TrendingUp,
    active: true,
    channels: "All YouTube placements (AI-optimized)",
    funnelStage: "conversion",
    bestFor: "AI-optimized maximum conversions",
    kpis: ["Conversions", "ROAS", "Revenue"],
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

export function DV360StepObjective() {
  const { campaign, setStep, updateNested } = useDV360Campaign();
  const obj = campaign.objective;
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const config = DV360_OBJECTIVE_CONFIGS[obj.objective];
  const needsConversionTracking = config.conversionTrackingRequired;

  // Auto-save indicator
  useEffect(() => {
    if (!obj.campaignName) return;
    setAutoSaveState("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setAutoSaveState("saved"), 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [obj.campaignName, obj.objective]);

  const handleObjectiveChange = (value: DV360Objective) => {
    if (value === obj.objective) return;
    const newConfig = DV360_OBJECTIVE_CONFIGS[value];
    if (!newConfig) return;

    updateNested("objective", { objective: value });
    updateNested("budget", {
      biddingStrategy: newConfig.defaultBiddingStrategy,
      performanceGoalType: newConfig.defaultPerformanceGoal,
      targetCpm: null,
      targetCpv: null,
      targetCpa: null,
      targetRoas: null,
    });
  };

  const selectedObj = CAMPAIGN_OBJECTIVES.find((o) => o.value === obj.objective);
  const funnel = selectedObj ? FUNNEL_LABELS[selectedObj.funnelStage] : null;

  const canProceed =
    obj.campaignName.trim().length > 0 &&
    (needsConversionTracking ? !!obj.floodlightActivityId.trim() : true);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen bg-background">

        {/* ============================================================ */}
        {/*  MAIN CONTENT                                                */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col">

          <StepZeroHeader
            platform="dv360"
            title="Create YouTube Ads Campaign"
            subtitle="Salla Ads — DV360"
            saveState={autoSaveState}
          />

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className={cn("mx-auto w-full max-w-3xl px-6 py-8", WIZARD_FOOTER_PADDING_BOTTOM)}>

              {/* Step 1: Choose your goal */}
              <div className="mb-8">
                <div className="mb-1 flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">1</span>
                  <h2 className="text-lg font-bold text-foreground">Choose your goal</h2>
                </div>
                <p className="ml-9 text-sm text-muted-foreground">
                  Select the objective that best matches your YouTube marketing goal.
                </p>
              </div>

              {/* Funnel guide bar */}
              <div className="mb-8 flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
                {(["awareness", "consideration", "conversion"] as const).map((stage, i) => {
                  const f = FUNNEL_LABELS[stage];
                  const FIcon = f.icon;
                  const isActive = selectedObj?.funnelStage === stage;
                  return (
                    <div key={stage} className="flex items-center gap-2">
                      {i > 0 && <ArrowRight className="size-3.5 text-muted-foreground/40" />}
                      <span className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                        isActive ? f.color : "border-transparent bg-muted/40 text-muted-foreground"
                      )}>
                        <FIcon className="size-3" />
                        {f.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ---- Campaign Objective Cards ---- */}
              <div className="mb-8">
                <div className="grid grid-cols-2 gap-2.5">
                  {CAMPAIGN_OBJECTIVES.map((o) => {
                    const OIcon = o.icon;
                    const isActive = o.active;
                    const isSelected = o.value === obj.objective;
                    return (
                      <button
                        type="button"
                        key={o.value}
                        disabled={!isActive}
                        onClick={() => isActive && handleObjectiveChange(o.value)}
                        className={cn(
                          "relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all",
                          !isActive
                            ? "cursor-default border-border bg-muted/30"
                            : isSelected
                              ? "border-red-600 bg-red-600/[0.04] shadow-sm shadow-red-600/10"
                              : "cursor-pointer border-border bg-card hover:border-red-400/40"
                        )}
                      >
                        {!isActive && (
                          <div className="absolute -top-2 right-2">
                            <Badge variant="outline" className="gap-1 rounded-full bg-background px-1.5 py-0 text-[10px] font-medium text-muted-foreground">
                              <Lock className="size-2.5" />
                              Coming Soon
                            </Badge>
                          </div>
                        )}

                        <div className="mb-2.5 flex w-full items-center justify-between">
                          <div className={cn(
                            "flex size-9 items-center justify-center rounded-lg transition-colors",
                            !isActive
                              ? "bg-muted text-muted-foreground/50"
                              : isSelected
                                ? "bg-red-600 text-white"
                                : "bg-muted text-muted-foreground"
                          )}>
                            <OIcon className="size-5" />
                          </div>
                          {isSelected && isActive && (
                            <CheckCircle2 className="size-4 text-red-600" />
                          )}
                        </div>

                        <p className={cn(
                          "text-sm font-semibold",
                          !isActive ? "text-muted-foreground/60" : isSelected ? "text-red-600" : "text-foreground"
                        )}>
                          {o.label}
                        </p>
                        <p className={cn(
                          "mt-0.5 line-clamp-2 text-[11px] leading-relaxed",
                          !isActive ? "text-muted-foreground/40" : "text-muted-foreground"
                        )}>
                          {o.desc}
                        </p>

                        <p className={cn(
                          "mt-1.5 text-[10px] leading-snug",
                          !isActive ? "text-muted-foreground/30" : "text-muted-foreground/70"
                        )}>
                          {o.channels}
                        </p>

                        {isActive && (
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {o.kpis.map((kpi) => (
                              <span key={kpi} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {kpi}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ---- Selected Objective Summary ---- */}
              {selectedObj && funnel && (
                <div className="mb-8 rounded-xl border border-border bg-card p-5">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-red-600/10 text-red-600">
                      <selectedObj.icon className="size-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{config.description}</p>
                    </div>
                    <span className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium", funnel.color)}>
                      <funnel.icon className="size-3" />
                      {funnel.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Best for</p>
                      <p className="text-xs text-foreground">{selectedObj.bestFor}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Key metrics</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedObj.kpis.map((k) => (
                          <span key={k} className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">{k}</span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Line item type</p>
                      <p className="text-xs text-foreground">{config.lineItemType.replace("LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_", "")}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Campaign setup */}
              <div className="mb-6">
                <div className="mb-1 flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">2</span>
                  <h2 className="text-lg font-bold text-foreground">Campaign setup</h2>
                </div>
                <p className="ml-9 text-sm text-muted-foreground">Name your campaign and configure tracking.</p>
              </div>

              {/* ---- Campaign Name ---- */}
              <div className="mb-6 rounded-xl border border-border bg-card p-6">
                <Label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  Campaign Name
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={obj.campaignName}
                  onChange={(e) => updateNested("objective", { campaignName: e.target.value })}
                  placeholder="e.g., Ramadan 2026 YouTube Reach Campaign"
                  className="h-10"
                  maxLength={200}
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Give your campaign a descriptive name.</p>
                  <span className={cn("text-xs tabular-nums", obj.campaignName.length > 180 ? "text-amber-600" : "text-muted-foreground")}>
                    {obj.campaignName.length}/200
                  </span>
                </div>
              </div>

              {/* ---- YouTube Channel (optional) ---- */}
              <div className="mb-6 rounded-xl border border-border bg-card p-6">
                <Label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Globe className="size-3.5 text-red-600" />
                  YouTube Channel URL
                  <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-[9px]">Optional</Badge>
                </Label>
                <Input
                  value={obj.youtubeChannelUrl}
                  onChange={(e) => updateNested("objective", { youtubeChannelUrl: e.target.value })}
                  placeholder="https://youtube.com/@yourchannel"
                  className="h-10 font-mono text-xs"
                />
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  Link your channel for organic + paid synergy and audience insights.
                </p>
              </div>

              {/* ---- Conversion Tracking (Conversion/Performance only) ---- */}
              {needsConversionTracking && (
                <div className="mb-6 rounded-xl border border-amber-300/50 bg-amber-50/50 p-6 dark:border-amber-800/50 dark:bg-amber-950/10">
                  <Label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Target className="size-3.5 text-amber-600" />
                    Conversion Tracking
                    <span className="text-destructive">*</span>
                  </Label>
                  <p className="mb-3 text-xs text-muted-foreground">
                    A Floodlight activity is required for conversion-based YouTube campaigns to track purchases and sign-ups.
                  </p>
                  <Input
                    value={obj.floodlightActivityId}
                    onChange={(e) => updateNested("objective", { floodlightActivityId: e.target.value })}
                    placeholder="Floodlight Activity ID (e.g., 12345678)"
                    className="h-10 font-mono text-xs"
                  />
                </div>
              )}

              {/* ---- Awareness Objective Info ---- */}
              {obj.objective === "AWARENESS" && (
                <div className="mb-6 rounded-xl border border-red-300/40 bg-red-50/40 p-6 dark:border-red-800/40 dark:bg-red-950/10">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                      <Eye className="size-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Awareness Campaign Features</p>
                      <p className="text-[10px] text-muted-foreground">Optimized for maximum reach, impressions, and brand recall</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Target CPM", desc: "DV360 auto-bids to reach the most unique users at your target cost per 1,000 impressions" },
                      { label: "Frequency Control", desc: "Set target frequency to control how many times each viewer sees your ad per week" },
                      { label: "Multi-Format Reach", desc: "Combine Skippable, Non-Skippable, and Bumper ads to maximize unique reach" },
                    ].map((f) => (
                      <div key={f.label} className="rounded-lg border border-red-200/50 bg-background px-3 py-2.5 dark:border-red-800/30">
                        <p className="text-[11px] font-semibold text-foreground">{f.label}</p>
                        <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                    DV360 will use <code className="rounded bg-red-100 px-1 text-[9px] dark:bg-red-900/30">LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_REACH</code> line items with Target CPM or Maximize Lift bidding to deliver maximum brand exposure within your budget.
                  </p>
                </div>
              )}

              {/* ---- Consideration Objective Info ---- */}
              {obj.objective === "CONSIDERATION" && (
                <div className="mb-6 rounded-xl border border-blue-300/40 bg-blue-50/40 p-6 dark:border-blue-800/40 dark:bg-blue-950/10">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <PlayCircle className="size-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Consideration Campaign Features</p>
                      <p className="text-[10px] text-muted-foreground">Optimized for video views and audience engagement</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "CPV Bidding", desc: "Pay only when viewers watch 30s or interact with your ad" },
                      { label: "View-Through Rate", desc: "Optimize towards users most likely to watch your video" },
                      { label: "In-Feed + Shorts", desc: "Appear in YouTube search, home feed, and Shorts" },
                    ].map((f) => (
                      <div key={f.label} className="rounded-lg border border-blue-200/50 bg-background px-3 py-2.5 dark:border-blue-800/30">
                        <p className="text-[11px] font-semibold text-foreground">{f.label}</p>
                        <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                    DV360 will use <code className="rounded bg-blue-100 px-1 text-[9px] dark:bg-blue-900/30">LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_VIEW</code> line items with Manual CPV or Target CPM bidding to maximize video views within your budget.
                  </p>
                </div>
              )}

              {/* ---- Conversion Objective Info ---- */}
              {obj.objective === "CONVERSION" && (
                <div className="mb-6 rounded-xl border border-emerald-300/40 bg-emerald-50/40 p-6 dark:border-emerald-800/40 dark:bg-emerald-950/10">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <MousePointerClick className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Conversion Campaign Features</p>
                      <p className="text-[10px] text-muted-foreground">Optimized for online actions like purchases, sign-ups, and leads</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Smart Bidding", desc: "Maximize Conversions or Target CPA automatically bids to drive the most actions" },
                      { label: "Floodlight Tracking", desc: "Track purchases, leads, and sign-ups through DV360 Floodlight activities" },
                      { label: "Action Ads", desc: "In-Stream and In-Feed formats with prominent CTAs to drive clicks" },
                    ].map((f) => (
                      <div key={f.label} className="rounded-lg border border-emerald-200/50 bg-background px-3 py-2.5 dark:border-emerald-800/30">
                        <p className="text-[11px] font-semibold text-foreground">{f.label}</p>
                        <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-100/50 px-3 py-2 dark:bg-emerald-900/20">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Floodlight required:</span> DV360 uses Floodlight activities to track conversions. Make sure your Floodlight tag is installed on your Salla store before launching. Maps to <code className="rounded bg-emerald-100 px-1 text-[9px] dark:bg-emerald-900/30">LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_ACTION</code>.
                    </p>
                  </div>
                </div>
              )}

              {/* ---- Performance Objective Info ---- */}
              {obj.objective === "PERFORMANCE" && (
                <div className="mb-6 rounded-xl border border-orange-300/40 bg-orange-50/40 p-6 dark:border-orange-800/40 dark:bg-orange-950/10">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <TrendingUp className="size-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Performance Campaign Features</p>
                      <p className="text-[10px] text-muted-foreground">Fully automated, AI-optimized across all YouTube placements</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "AI Multi-Format", desc: "DV360 automatically selects the best format (In-Stream, Bumper, Shorts, In-Feed) per user" },
                      { label: "Target ROAS", desc: "Optimize for return on ad spend -- set a target ROAS and DV360 maximizes revenue" },
                      { label: "Full Automation", desc: "AI handles placements, bidding, and format mix to maximize conversions at scale" },
                    ].map((f) => (
                      <div key={f.label} className="rounded-lg border border-orange-200/50 bg-background px-3 py-2.5 dark:border-orange-800/30">
                        <p className="text-[11px] font-semibold text-foreground">{f.label}</p>
                        <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-orange-100/50 px-3 py-2 dark:bg-orange-900/20">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-orange-600" />
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-orange-700 dark:text-orange-400">Simple line items:</span> Performance uses <code className="rounded bg-orange-100 px-1 text-[9px] dark:bg-orange-900/30">LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_SIMPLE</code> which gives DV360 full control over ad delivery. Provide multiple video assets and let the AI optimize the format mix. Floodlight tracking required.
                    </p>
                  </div>
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
        accent="dv360"
      />
    </TooltipProvider>
  );
}
