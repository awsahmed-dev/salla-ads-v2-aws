"use client";

import { useDV360Campaign } from "@/lib/dv360/campaign-context";
import { DV360_OBJECTIVE_CONFIGS, type DV360Objective } from "@/lib/dv360/campaign-types";
import { cn } from "@/lib/utils";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Eye,
  PlayCircle,
  MousePointerClick,
  TrendingUp,
  Globe,
  Target,
  AlertCircle,
  Sparkles,
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

export function DV360StepObjective({ onCancel }: { onCancel?: () => void }) {
  const { campaign, setStep, updateNested } = useDV360Campaign();
  const obj = campaign.objective;
  const config = DV360_OBJECTIVE_CONFIGS[obj.objective];
  const needsConversionTracking = config.conversionTrackingRequired;

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
                    const f = FUNNEL_LABELS[selectedObj!.funnelStage];
                    const FIcon = f.icon;
                    return (
                      <div className={cn("mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", f.color)}>
                        <FIcon className="size-3.5" />
                        {f.label}
                      </div>
                    );
                  })()}
                </div>

                {/* ---- Campaign Objective Cards ---- */}
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

                {/* ---- Detail bar ---- */}
                {selectedObj && (
                  <div className="border-t border-border bg-[#f4f4f4] px-4 sm:px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">{selectedObj.label}</span> — {selectedObj.kpis.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- Campaign Setup section label ---- */}
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
                        const autoName = `${selectedObj!.label} - YouTube - ${date}`;
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
                      value={obj.campaignName}
                      onChange={(e) => updateNested("objective", { campaignName: e.target.value })}
                      placeholder="e.g., Ramadan 2026 YouTube Reach Campaign"
                      className="h-10"
                      maxLength={200}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {obj.campaignName.length}/200
                    </span>
                  </div>
                </div>

                {/* ---- YouTube Channel (optional) ---- */}
                <div className="border-t border-border px-4 sm:px-8 py-5">
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
                  <div className="border-t border-border px-4 sm:px-8 py-5">
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
                  <div className="border-t border-border px-4 sm:px-8 py-5">
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
                  <div className="border-t border-border px-4 sm:px-8 py-5">
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
                  <div className="border-t border-border px-4 sm:px-8 py-5">
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
                  <div className="border-t border-border px-4 sm:px-8 py-5">
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

              </div>{/* close merged card */}

            </div>
          </div>
          <WizardStepFooter
            previousLabel="Cancel"
            onPrevious={onCancel ?? (() => {})}
            onNext={() => setStep(1)}
            nextLabel="Next"
            nextDisabled={!canProceed}
            accent="dv360"
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
