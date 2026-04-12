"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "@/lib/snapchat/campaign-context";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ShoppingBag,
  Globe,
  Smartphone,
  Sparkles,
  Tag,
  Megaphone,
  ClipboardList,
  CheckCircle2,
  Scan,
  Link2,
  ShieldCheck,
  AlertCircle,
  Store,
  TrendingUp,
  Zap,
  Eye,
  MousePointerClick,
  ArrowRight,
  User,
} from "lucide-react";
import { OBJECTIVE_CONFIGS, type CampaignObjective, type AppPlatform, makeDefaultLeadForm, makeDefaultAppSettings } from "@/lib/snapchat/campaign-types";
import { getSnapPixel, getSnapPublicProfile, type SnapPixelInfo, type SnapPublicProfile } from "@/lib/salla/store-api";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";


/* ------------------------------------------------------------------ */
/*  Objectives data                                                   */
/* ------------------------------------------------------------------ */

const OBJECTIVES: {
  value: CampaignObjective;
  label: string;
  desc: string;
  icon: React.ElementType;
  recommended?: boolean;
  bestFor: string;
  funnelStage: "awareness" | "consideration" | "conversion";
  kpis: string[];
  badge?: string;
  disabled?: boolean;
  disabledReason?: string;
}[] = [
  {
    value: "SALES",
    label: "Sales",
    desc: "Drive purchases on your online store with conversion-optimized ads",
    icon: ShoppingBag,
    recommended: true,
    bestFor: "E-commerce stores wanting direct sales",
    funnelStage: "conversion",
    kpis: ["Purchases", "Add to Cart", "ROAS"],
  },
  {
    value: "WEBSITE_VISITS",
    label: "Website Traffic",
    desc: "Send users to your website to explore products and content",
    icon: Globe,
    bestFor: "Driving traffic to landing pages or product pages",
    funnelStage: "consideration",
    kpis: ["Swipe Ups", "Page Views", "CTR"],
  },
  {
    value: "ENGAGEMENT",
    label: "Engagement",
    desc: "Increase interaction with your content and grow brand presence",
    icon: Sparkles,
    bestFor: "Building brand awareness and content views",
    funnelStage: "awareness",
    kpis: ["Impressions", "Story Opens", "Video Views"],
  },
  {
    value: "APP_PROMOTION",
    label: "App Installs",
    desc: "Promote your mobile app and drive installs from Snapchat users",
    icon: Smartphone,
    bestFor: "Mobile apps looking to grow their user base",
    funnelStage: "conversion",
    kpis: ["Installs", "In-App Purchases", "Cost per Install"],
    badge: "New",
  },
  {
    value: "SPONSORED_CHAT",
    label: "Sponsored Ads",
    desc: "Full-screen ads in the Chat Feed for maximum visibility",
    icon: Megaphone,
    bestFor: "Brand launches and announcements",
    funnelStage: "awareness",
    kpis: ["Impressions", "Reach", "Swipe Ups"],
    badge: "New",
  },
  {
    value: "LEADS",
    label: "Lead Generation",
    desc: "Collect customer info directly on Snapchat with instant forms",
    icon: ClipboardList,
    bestFor: "Collecting emails, phone numbers, or sign-ups",
    funnelStage: "conversion",
    kpis: ["Form Submissions", "Cost per Lead"],
    badge: "New",
  },
];

const FUNNEL_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  awareness: { label: "Awareness", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Eye },
  consideration: { label: "Consideration", color: "text-amber-600 bg-amber-50 border-amber-200", icon: MousePointerClick },
  conversion: { label: "Conversion", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: TrendingUp },
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function StepObjective({ onCancel }: { onCancel?: () => void }) {
  const { campaign, setStep, updateNested } = useCampaign();
  const obj = campaign.objective;
  const selectedObj = OBJECTIVES.find((o) => o.value === obj.objective)!;
  const [objectiveSheetOpen, setObjectiveSheetOpen] = useState(false);
  const [connectedPixel, setConnectedPixel] = useState<SnapPixelInfo | null>(null);
  const [snapProfile, setSnapProfile] = useState<SnapPublicProfile | null>(null);

  // Load connected Snap Pixel from Salla
  useEffect(() => {
    getSnapPixel().then(setConnectedPixel);
  }, []);

  // Load Snap Public Profile from Salla
  useEffect(() => {
    getSnapPublicProfile().then((profile) => {
      setSnapProfile(profile);
      if (profile && !campaign.creative.publicProfileId) {
        updateNested("creative", { publicProfileId: profile.profileId });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleObjectiveChange = (value: CampaignObjective) => {
    const config = OBJECTIVE_CONFIGS[value];
    updateNested("objective", {
      objective: value,
      ...(config.pixelRequirement === "none" && { pixelMode: "none" as const, pixelId: "", pixelName: "" }),
      ...(!config.catalogAvailable && { catalogEnabled: false, catalogSource: "" }),
    });
    const currentBid = campaign.budget.bidStrategy;
    const bidStrategyReset = config.allowedBidStrategies.includes(currentBid) ? currentBid : "AUTO_BID";
    updateNested("budget", { optimizationGoal: config.defaultGoal, bidStrategy: bidStrategyReset });
    if (value === "LEADS" && !campaign.creative.leadForm) {
      updateNested("creative", { leadForm: makeDefaultLeadForm() });
    } else if (value !== "LEADS") {
      updateNested("creative", { leadForm: undefined });
    }
    if (value === "APP_PROMOTION" && !campaign.objective.appSettings) {
      updateNested("objective", { appSettings: makeDefaultAppSettings() });
    } else if (value !== "APP_PROMOTION") {
      updateNested("objective", { appSettings: undefined });
    }
    // Snap API enforces CHAT_FEED placement for Sponsored Chat ads (Nov 2025).
    // CHAT_FEED cannot be the sole placement — must be combined with at least one other position.
    if (value === "SPONSORED_CHAT") {
      updateNested("creative", {
        placement: "CUSTOM" as const,
        customPositions: ["CHAT_FEED", "INTERSTITIAL_CONTENT"],
      });
    } else if (campaign.objective.objective === "SPONSORED_CHAT") {
      // Switching away from SPONSORED_CHAT — reset to automatic placement
      updateNested("creative", { placement: "AUTOMATIC" as const, customPositions: ["INTERSTITIAL_USER", "INTERSTITIAL_CONTENT", "INTERSTITIAL_SPOTLIGHT", "FEED", "INSTREAM", "PUBLIC_STORIES_INSTREAM", "CAMERA"] });
    }
  };

  const currentConfig = OBJECTIVE_CONFIGS[obj.objective];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen bg-background">
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className={cn("mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8", WIZARD_FOOTER_PADDING_BOTTOM)}>

              {/* ── Goal Selection ── */}
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

                {/* 3x2 Objective Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4 sm:px-8 pb-6 sm:pb-8">
                  {OBJECTIVES.map((o) => {
                    const selected = obj.objective === o.value;
                    const OIcon = o.icon;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        disabled={o.disabled}
                        onClick={() => !o.disabled && handleObjectiveChange(o.value)}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                          o.disabled
                            ? "cursor-not-allowed opacity-40 border-border"
                            : selected
                              ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                              : "border-border bg-white hover:border-[#a4ffe5] hover:shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                          selected ? "bg-[#004956] text-white" : "bg-[#f4f4f4] text-muted-foreground group-hover:bg-[#e6fff9] group-hover:text-[#004956]"
                        )}>
                          <OIcon className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("text-sm font-bold", selected ? "text-[#004956]" : "text-foreground")}>{o.label}</span>
                            {o.recommended && (
                              <span className="rounded-full bg-[#a4ffe5] px-1.5 py-0.5 text-[11px] font-bold uppercase text-[#004956]">Best</span>
                            )}
                            {!o.recommended && o.badge && (
                              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold uppercase text-emerald-700">{o.badge}</span>
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
                  {/* Header */}
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
                    <SheetDescription className="mt-3 text-sm text-white/70">
                      {selectedObj.desc}
                    </SheetDescription>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Tutorial Video Placeholder */}
                    <div className="mx-6 mt-6 flex h-[180px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#004956] to-[#006d7a]">
                      <div className="text-center">
                        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-white/20">
                          <svg viewBox="0 0 24 24" className="ml-0.5 size-5 text-white" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-white">Tutorial Video</p>
                        <p className="text-xs text-white/60">45 seconds — how to set up your campaign</p>
                      </div>
                    </div>

                    <div className="space-y-6 px-6 py-6">
                      {/* Quick Stats Row */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-[#f4f4f4] p-4 text-center">
                          <p className="text-lg font-bold text-[#004956]">{currentConfig.allowedFormats.length}</p>
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

                      {/* Best for */}
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Best for</p>
                        <p className="text-sm font-bold text-foreground">{selectedObj.bestFor}</p>
                      </div>

                      {/* Key Metrics */}
                      <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Key Metrics</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedObj.kpis.map((kpi) => (
                            <span key={kpi} className="rounded-full border border-[#a4ffe5] bg-[#e6fff9] px-4 py-1.5 text-xs font-medium text-[#004956]">{kpi}</span>
                          ))}
                        </div>
                      </div>

                      {/* Step-by-step guide */}
                      <div>
                        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Step-by-step guide</p>
                        <div className="space-y-4">
                          {[
                            { title: "Set up tracking", desc: "Connect your Snap Pixel or use Salla's automatic pixel." },
                            { title: "Define your audience", desc: "Choose locations, demographics, and interests." },
                            { title: "Set budget & schedule", desc: "Set daily budget and campaign duration." },
                            { title: "Create your ad", desc: "Upload creatives. Snap recommends 3-5 variations." },
                            { title: "Launch & optimize", desc: "Review, launch, and monitor after 3-5 days." },
                          ].map((s, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#004956] text-xs font-bold text-white">
                                {i + 1}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">{s.title}</p>
                                <p className="text-xs text-muted-foreground">{s.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pro tip */}
                      <div className="rounded-xl bg-[#e6fff9] p-4">
                        <div className="mb-1 flex items-center gap-2">
                          <Sparkles className="size-3.5 text-[#004956]" />
                          <p className="text-xs font-bold text-[#004956]">Pro Tip</p>
                        </div>
                        <p className="text-xs leading-relaxed text-[#004956]/80">
                          {selectedObj.funnelStage === "conversion"
                            ? "Start broad and let Snapchat's algorithm find your best customers. Narrow down after the learning phase."
                            : selectedObj.funnelStage === "consideration"
                              ? "Use video creatives — they drive 2x more engagement than static images."
                              : "Maximize reach by selecting Automatic placement and keeping your audience broad."
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer — Start Campaign CTA */}
                  <div className="border-t border-border p-6">
                    <button
                      type="button"
                      onClick={() => {
                        setObjectiveSheetOpen(false);
                        // Scroll to campaign name
                        setTimeout(() => {
                          const input = document.querySelector('input[placeholder*="Summer"]') as HTMLInputElement;
                          if (input) { input.scrollIntoView({ behavior: 'smooth', block: 'center' }); input.focus(); }
                        }, 300);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#004956] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#003a44]"
                    >
                      <ArrowRight className="size-4" />
                      Start Campaign
                    </button>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      You can change your objective at any time before launching.
                    </p>
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
                        const autoName = `${selectedObj.label} - Snapchat - ${date}`;
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
                      placeholder="e.g. Summer Collection - Snap Sales"
                      value={obj.campaignName}
                      onChange={(e) => updateNested("objective", { campaignName: e.target.value.slice(0, 375) })}
                      className="h-10 pr-14 text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {obj.campaignName.length}/375
                    </span>
                  </div>
                </div>

              {/* Catalog Toggle */}
              {currentConfig.catalogAvailable && (
                <div className="border-t border-border px-4 sm:px-8 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e6fff9]">
                        <Tag className="size-4 text-[#004956]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Product Catalog</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                          All ads in this campaign will be auto-generated from your product catalog (Dynamic Product Ads).
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={obj.catalogEnabled}
                      onCheckedChange={(checked) => {
                        updateNested("objective", { catalogEnabled: checked });
                        if (checked) {
                          const nonDynamic = campaign.creative.ads.filter((a) => (a.adFormat ?? "SINGLE") !== "DYNAMIC");
                          if (nonDynamic.length > 0) {
                            updateNested("creative", { ads: campaign.creative.ads.filter((a) => (a.adFormat ?? "SINGLE") === "DYNAMIC") });
                          }
                        }
                      }}
                    />
                  </div>
                  {obj.catalogEnabled && (
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                        <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
                          <Store className="size-3.5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">My Salla Store</p>
                          <p className="text-xs text-muted-foreground">Auto-synced product catalog</p>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="size-3" /> Connected
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pixel section inside same card */}
              {currentConfig.pixelRequirement !== "none" && (
                <div className="border-t border-border px-4 sm:px-8 py-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e6fff9]">
                      <Scan className="size-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">Snap Pixel</p>
                        <Badge variant={currentConfig.pixelRequirement === "required" ? "secondary" : "outline"} className="rounded-full px-1.5 py-0 text-xs">
                          {currentConfig.pixelRequirement === "required" ? "Required" : "Optional"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        Tracks visitor actions on your store to measure and optimize results.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Salla managed (recommended) */}
                    <button
                      type="button"
                      onClick={() => updateNested("objective", { pixelMode: "salla_managed" })}
                      className={cn(
                        "group relative flex flex-col rounded-xl border p-4 text-left transition-all",
                        obj.pixelMode === "salla_managed"
                          ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                          : "border-border bg-white hover:border-[#a4ffe5]"
                      )}
                    >
                      <div className="absolute -top-2.5 right-3">
                        <Badge className="rounded-full bg-[#004956] px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                          Recommended
                        </Badge>
                      </div>
                      <div className="mb-2.5 flex items-center justify-between">
                        <div className={cn(
                          "flex size-8 items-center justify-center rounded-lg transition-colors",
                          obj.pixelMode === "salla_managed" ? "bg-[#004956] text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <Zap className="size-4" />
                        </div>
                        {obj.pixelMode === "salla_managed" && <CheckCircle2 className="size-4 text-[#004956]" />}
                      </div>
                      <p className={cn("text-xs font-semibold", obj.pixelMode === "salla_managed" ? "text-[#004956]" : "text-foreground")}>
                        Automatic (Salla)
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        We create and install a pixel on your store — zero setup needed.
                      </p>
                    </button>

                    {/* Connect existing */}
                    <button
                      type="button"
                      onClick={() => {
                        if (connectedPixel) {
                          updateNested("objective", {
                            pixelMode: "existing",
                            pixelId: connectedPixel.pixelId,
                            pixelName: connectedPixel.name,
                          });
                        } else {
                          updateNested("objective", { pixelMode: "existing" });
                        }
                      }}
                      className={cn(
                        "group relative flex flex-col rounded-xl border p-4 text-left transition-all",
                        obj.pixelMode === "existing"
                          ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                          : "border-border bg-white hover:border-[#a4ffe5]"
                      )}
                    >
                      <div className="mb-2.5 flex items-center justify-between">
                        <div className={cn(
                          "flex size-8 items-center justify-center rounded-lg transition-colors",
                          obj.pixelMode === "existing" ? "bg-[#004956] text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <Link2 className="size-4" />
                        </div>
                        {obj.pixelMode === "existing" && <CheckCircle2 className="size-4 text-[#004956]" />}
                      </div>
                      <p className={cn("text-xs font-semibold", obj.pixelMode === "existing" ? "text-[#004956]" : "text-foreground")}>
                        Connect Existing
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        Use a Snap Pixel from your Snapchat Ads Manager account.
                      </p>
                    </button>
                  </div>

                  {/* Existing pixel — authenticated state (connected via Salla) */}
                  {obj.pixelMode === "existing" && connectedPixel && (
                    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Scan className="size-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{connectedPixel.name}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{connectedPixel.domain}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-2 py-0 text-[11px] font-medium",
                              connectedPixel.status === "ACTIVE"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            )}
                          >
                            {connectedPixel.status === "ACTIVE" ? "Active" : connectedPixel.status === "PENDING" ? "Pending" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Last event {(() => {
                              const mins = Math.round((Date.now() - new Date(connectedPixel.lastEventAt).getTime()) / 60000);
                              return mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
                        <p className="text-xs text-emerald-700">Pixel connected and tracking events on your store.</p>
                      </div>
                    </div>
                  )}

                  {/* Existing pixel — not authenticated (no Snap account connected) */}
                  {obj.pixelMode === "existing" && !connectedPixel && (
                    <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
                      <Label className="mb-1.5 block text-xs font-medium text-foreground">Pixel ID</Label>
                      <Input
                        placeholder="e.g. abc12345-1234-1234-1234-abc123456789"
                        value={obj.pixelId}
                        onChange={(e) => updateNested("objective", { pixelId: e.target.value })}
                        className="h-10 font-mono text-xs"
                      />
                      {obj.pixelId && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                          <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
                          <p className="text-xs text-emerald-700">Pixel will be verified before your campaign goes live.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Salla managed detail */}
                  {obj.pixelMode === "salla_managed" && (
                    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">Salla handles everything</p>
                          <div className="mt-2 flex flex-col gap-1">
                            {[
                              "Creates and installs a tracking pixel automatically",
                              "Tracks purchases, add-to-cart, and page views",
                              "Verifies everything before your campaign goes live",
                            ].map((item) => (
                              <p key={item} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                                <CheckCircle2 className="mt-0.5 size-2.5 shrink-0 text-primary" />
                                {item}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No pixel warning */}
                  {obj.pixelMode === "none" && (
                    <div className={cn(
                      "mt-4 flex items-center gap-2 rounded-lg border px-3 py-2",
                      currentConfig.pixelRequirement === "required" ? "border-amber-200 bg-amber-50" : "border-border bg-muted/30"
                    )}>
                      <AlertCircle className={cn("size-3.5 shrink-0", currentConfig.pixelRequirement === "required" ? "text-amber-600" : "text-muted-foreground")} />
                      <p className={cn("text-[11px]", currentConfig.pixelRequirement === "required" ? "text-amber-700" : "text-muted-foreground")}>
                        {currentConfig.pixelRequirement === "required"
                          ? "A tracking pixel is required for this objective. Select an option above."
                          : "A pixel is optional but recommended for better performance tracking."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* App Configuration */}
              {obj.objective === "APP_PROMOTION" && obj.appSettings && (
                <div className="border-t border-border px-4 sm:px-8 py-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Smartphone className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">App Details</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        Tell us about your app so we can direct users to the right store.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* App Name */}
                    <div>
                      <Label className="mb-1.5 block text-xs font-medium text-foreground">
                        App Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. My Store App"
                        value={obj.appSettings.appName}
                        onChange={(e) => updateNested("objective", { appSettings: { ...obj.appSettings!, appName: e.target.value } })}
                        className="h-10 text-sm"
                      />
                    </div>

                    {/* Platform */}
                    <div>
                      <Label className="mb-1.5 block text-xs font-medium text-foreground">Platform</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["BOTH", "IOS", "ANDROID"] as AppPlatform[]).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => updateNested("objective", { appSettings: { ...obj.appSettings!, appPlatform: p } })}
                            className={cn(
                              "flex items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all",
                              obj.appSettings!.appPlatform === p
                                ? "border-primary bg-primary/[0.04] text-primary"
                                : "border-border text-muted-foreground hover:border-primary/40"
                            )}
                          >
                            {p === "BOTH" ? "Both" : p === "IOS" ? "iOS" : "Android"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* iOS ID */}
                    {(obj.appSettings.appPlatform === "IOS" || obj.appSettings.appPlatform === "BOTH") && (
                      <div>
                        <Label className="mb-1.5 block text-xs font-medium text-foreground">
                          iOS App Store ID <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="e.g. 447188370"
                          value={obj.appSettings.iosAppId}
                          onChange={(e) => updateNested("objective", { appSettings: { ...obj.appSettings!, iosAppId: e.target.value.replace(/\D/g, "") } })}
                          className="h-10 font-mono text-xs"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">The numeric ID from your App Store listing URL.</p>
                      </div>
                    )}

                    {/* Android package */}
                    {(obj.appSettings.appPlatform === "ANDROID" || obj.appSettings.appPlatform === "BOTH") && (
                      <div>
                        <Label className="mb-1.5 block text-xs font-medium text-foreground">
                          Android Package Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="e.g. com.example.myapp"
                          value={obj.appSettings.androidAppUrl}
                          onChange={(e) => updateNested("objective", { appSettings: { ...obj.appSettings!, androidAppUrl: e.target.value } })}
                          className="h-10 font-mono text-xs"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">The package name from your Google Play listing.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Public Profile inside same card */}
              <div className="border-t border-border px-4 sm:px-8 py-5">
                <p className="text-sm font-bold text-foreground">Snapchat Public Profile</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Auto-detected from your Salla account. Appears on all your ads.
                </p>
              </div>
                {snapProfile ? (
                  <div className="px-4 sm:px-8 pb-6 sm:pb-8">
                    <div className="flex items-center gap-3 rounded-lg border border-[#a4ffe5] bg-[#e6fff9] px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={snapProfile.avatarUrl}
                        alt={snapProfile.displayName}
                        className="size-9 rounded-lg object-cover"
                        crossOrigin="anonymous"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-bold text-[#004956]">
                          {snapProfile.displayName}
                          {snapProfile.displayNameAr && (
                            <span> - {snapProfile.displayNameAr}</span>
                          )}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{snapProfile.profileId}</p>
                      </div>
                      <CheckCircle2 className="size-5 shrink-0 text-[#004956]" />
                    </div>
                  </div>
                ) : (
                  /* ═══ Not authenticated: manual UUID entry ═══ */
                  (() => {
                    const profileId = campaign.creative.publicProfileId ?? "";
                    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId);
                    const hasValue = profileId.length > 0;
                    return (
                      <div className="px-4 sm:px-8 pb-6 sm:pb-8">
                      <div className="flex items-start gap-3.5">
                        <div className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
                          hasValue && isValidUUID ? "bg-emerald-100" : hasValue ? "bg-red-100" : "bg-primary/10"
                        )}>
                          {hasValue && isValidUUID
                            ? <CheckCircle2 className="size-5 text-emerald-600" />
                            : hasValue
                              ? <AlertCircle className="size-5 text-red-500" />
                              : <User className="size-5 text-primary" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-semibold text-foreground">Public Profile ID</Label>
                            {hasValue && isValidUUID && (
                              <Badge variant="outline" className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2 py-0 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="size-2.5" /> Set
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Your brand name and profile picture shown on every ad.
                          </p>
                          <div className="mt-3 flex flex-col gap-1">
                            <div className="relative">
                              <Input
                                placeholder="e.g. 72cf5c50-8343-48d3-a0a7-3ed45b75faaa"
                                value={profileId}
                                onChange={(e) => updateNested("creative", { publicProfileId: e.target.value.trim() })}
                                className={cn(
                                  "h-10 pr-8 font-mono text-xs transition-colors",
                                  hasValue && isValidUUID ? "border-emerald-300 focus-visible:ring-emerald-200" :
                                  hasValue ? "border-red-300 focus-visible:ring-red-200" : ""
                                )}
                              />
                              {hasValue && isValidUUID && (
                                <CheckCircle2 className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-emerald-500" />
                              )}
                              {hasValue && !isValidUUID && (
                                <AlertCircle className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-red-400" />
                              )}
                            </div>
                            {hasValue && !isValidUUID ? (
                              <p className="text-[11px] text-red-600">
                                This doesn&apos;t look like a valid Profile ID. It should be a UUID (e.g. 72cf5c50-8343-48d3-a0a7-3ed45b75faaa).
                              </p>
                            ) : (
                              <p className="text-[11px] text-muted-foreground">
                                Find it in <span className="font-medium text-foreground">Snapchat Ads Manager</span> &rarr; Public Profiles
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      </div>
                    );
                  })()
                )}
              </div>

            </div>
          </div>
          <WizardStepFooter
            previousLabel="Cancel"
            onPrevious={onCancel ?? (() => {})}
            onNext={() => setStep(1)}
            nextLabel="Next"
            nextDisabled={
              !obj.campaignName.trim() ||
              (currentConfig.pixelRequirement === "required" &&
                (obj.pixelMode === "none" || (obj.pixelMode === "existing" && !obj.pixelId.trim()))) ||
              (obj.objective === "APP_PROMOTION" && obj.appSettings != null && (
                !obj.appSettings.appName.trim() ||
                (obj.appSettings.appPlatform !== "ANDROID" && !obj.appSettings.iosAppId.trim()) ||
                (obj.appSettings.appPlatform !== "IOS" && !obj.appSettings.androidAppUrl.trim())
              ))
            }
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
