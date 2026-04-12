"use client";

import { useState } from "react";
import { useDV360Campaign } from "@/lib/dv360/campaign-context";
import { DV360_OBJECTIVE_CONFIGS, type DV360Objective } from "@/lib/dv360/campaign-types";
import { cn } from "@/lib/utils";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Eye,
  PlayCircle,
  MousePointerClick,
  TrendingUp,
  Globe,
  Target,
  Sparkles,
  ArrowRight,
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

  const [objectiveSheetOpen, setObjectiveSheetOpen] = useState(false);
  const selectedObj = CAMPAIGN_OBJECTIVES.find((o) => o.value === obj.objective)!;
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
                      <button
                        type="button"
                        onClick={() => setObjectiveSheetOpen(true)}
                        className="shrink-0 text-xs font-bold text-primary underline decoration-primary/30 decoration-2 underline-offset-2 hover:decoration-primary"
                      >
                        Learn more
                      </button>
                    </div>
                  </div>
                )}

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
                            <p className="text-lg font-bold text-primary">3</p>
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
                              { title: "Set up tracking", desc: "Connect your Floodlight tag or use Salla's automatic conversion tracking." },
                              { title: "Define your audience", desc: "Choose locations, demographics, and audience segments." },
                              { title: "Set budget & schedule", desc: "Set daily or campaign budget and flight dates." },
                              { title: "Create your ad", desc: "Upload video creatives for YouTube placements." },
                              { title: "Launch & optimize", desc: "Review, launch, and monitor performance after 3-5 days." },
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
                              ? "Start broad and let DV360's algorithm find your best customers. Narrow down after the learning phase."
                              : selectedObj.funnelStage === "consideration"
                                ? "Use video creatives — they drive 2x more engagement on YouTube."
                                : "Maximize reach by using broad targeting and bumper ads for maximum frequency."}
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
                            const input = document.querySelector('input[placeholder*="YouTube"]') as HTMLInputElement;
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
