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
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  ShoppingBag,
  Tag,
  CheckCircle2,
  Store,
  Eye,
  MousePointerClick,
  Play,
  Users,
  Smartphone,
  TrendingUp,
  Sparkles,
  ArrowRight,
  LogIn,
  ExternalLink,
  Shield,
} from "lucide-react";
import {
  META_OBJECTIVE_CONFIGS,
  type MetaObjective,
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
/*  Facebook & Instagram SVG icons                                     */
/* ------------------------------------------------------------------ */

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
    </svg>
  );
}

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

  /* ---- Meta connection state (simulated — backend will populate via OAuth) ---- */
  const isMetaConnected = !!obj.facebookPageName;

  const handleObjectiveChange = (value: MetaObjective) => {
    if (value === obj.objective) return;
    const newConfig = META_OBJECTIVE_CONFIGS[value];
    if (!newConfig) return;

    updateNested("objective", {
      objective: value,
      ...(!newConfig.catalogAvailable && {
        catalogEnabled: false,
        catalogId: "",
      }),
      conversionLocation: (value === "OUTCOME_APP_PROMOTION" ? "APP"
        : newConfig.conversionLocations[0] ?? "WEBSITE") as MetaConversionLocation,
    });

    // Reset budget goal to match new objective default
    updateNested("budget", {
      optimizationGoal: newConfig.defaultGoal,
      billingEvent: "IMPRESSIONS" as const,
      bidStrategy: "LOWEST_COST_WITHOUT_CAP" as const,
      bidAmount: 0,
      ...(value === "OUTCOME_SALES" && { conversionEvent: "PURCHASE" as const }),
    });
  };

  const handleCatalogToggle = (enabled: boolean) => {
    updateNested("objective", {
      catalogEnabled: enabled,
      ...(!enabled && { catalogId: "" }),
    });
  };

  /* Simulated Meta OAuth login — in production, this opens the Meta OAuth popup */
  const handleMetaLogin = (provider: "facebook" | "instagram") => {
    // Simulate: backend OAuth flow will return connected assets
    // For now, set mock connected data so the UI shows the connected state
    updateNested("objective", {
      facebookPageId: "mock_page_123",
      facebookPageName: "My Salla Store",
      instagramAccountId: provider === "instagram" ? "mock_ig_456" : obj.instagramAccountId,
      instagramAccountName: provider === "instagram" ? "@mysallastore" : obj.instagramAccountName,
      pixelMode: "existing" as const,
      pixelId: "123456789012345",
      pixelName: "Salla Store Pixel",
    });
  };

  const handleDisconnect = () => {
    updateNested("objective", {
      facebookPageId: "",
      facebookPageName: "",
      instagramAccountId: "",
      instagramAccountName: "",
      pixelMode: "none" as const,
      pixelId: "",
      pixelName: "",
    });
  };

  const canProceed =
    obj.campaignName.trim().length > 0 &&
    isMetaConnected &&
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
                              { title: "Connect your Meta account", desc: "Login with Facebook or Instagram to link your ad account." },
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

                {/* ---- Meta Account Connection ---- */}
                <div className="border-t border-border px-4 sm:px-8 py-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#1877F2]/10">
                      <LogIn className="size-5 text-[#1877F2]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Connect Meta Account <span className="text-red-500">*</span>
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Login with your Facebook or Instagram account to connect your Business Manager, Ad Account, Pixel, and Pages.
                      </p>
                    </div>
                  </div>

                  {!isMetaConnected ? (
                    /* ── Not connected: show login buttons ── */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {/* Login with Facebook */}
                        <button
                          type="button"
                          onClick={() => handleMetaLogin("facebook")}
                          className="group flex items-center gap-3 rounded-xl border-2 border-border bg-white px-5 py-4 text-left transition-all hover:border-[#1877F2] hover:shadow-md"
                        >
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#1877F2]">
                            <FacebookIcon className="size-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground group-hover:text-[#1877F2]">Login with Facebook</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">Connect your Facebook Pages & Ad Account</p>
                          </div>
                          <ExternalLink className="size-4 text-muted-foreground group-hover:text-[#1877F2]" />
                        </button>

                        {/* Login with Instagram */}
                        <button
                          type="button"
                          onClick={() => handleMetaLogin("instagram")}
                          className="group flex items-center gap-3 rounded-xl border-2 border-border bg-white px-5 py-4 text-left transition-all hover:border-[#E4405F] hover:shadow-md"
                        >
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#833AB4] via-[#E4405F] to-[#FCAF45]">
                            <InstagramIcon className="size-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground group-hover:text-[#E4405F]">Login with Instagram</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">Connect your Instagram Business Account</p>
                          </div>
                          <ExternalLink className="size-4 text-muted-foreground group-hover:text-[#E4405F]" />
                        </button>
                      </div>

                      <div className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2.5">
                        <Shield className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                          You&apos;ll be redirected to Meta to authorize access. Salla will request permission to manage your ads, view your pages, and access your pixel data.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* ── Connected: show connected assets ── */
                    <div className="space-y-3">
                      {/* Connected status banner */}
                      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
                        <CheckCircle2 className="size-5 text-emerald-600" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground">Meta Account Connected</p>
                          <p className="text-[10px] text-muted-foreground">Your Business Manager, Ad Account, and Pixel are linked.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleDisconnect}
                          className="rounded-lg px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          Disconnect
                        </button>
                      </div>

                      {/* Connected pages */}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {/* Facebook Page */}
                        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-[#1877F2]/10">
                            <FacebookIcon className="size-3.5 text-[#1877F2]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-muted-foreground">Facebook Page</p>
                            <p className="truncate text-xs font-semibold text-foreground">{obj.facebookPageName}</p>
                          </div>
                          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                        </div>

                        {/* Instagram Account */}
                        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-[#E4405F]/10">
                            <InstagramIcon className="size-3.5 text-[#E4405F]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-muted-foreground">Instagram Account</p>
                            <p className="truncate text-xs font-semibold text-foreground">
                              {obj.instagramAccountName || obj.facebookPageName}
                            </p>
                          </div>
                          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                        </div>
                      </div>

                      {/* Pixel info */}
                      {obj.pixelId && (
                        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-2.5">
                          <div className="flex size-6 items-center justify-center rounded bg-[#1877F2]/10">
                            <div className="size-2.5 rounded-sm bg-[#1877F2]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-muted-foreground">Meta Pixel</p>
                            <p className="text-xs font-medium text-foreground">{obj.pixelName || obj.pixelId}</p>
                          </div>
                          <CheckCircle2 className="size-3 text-emerald-500" />
                        </div>
                      )}
                    </div>
                  )}
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

              {isAppPromo && (
                <AppPromotionSection />
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
