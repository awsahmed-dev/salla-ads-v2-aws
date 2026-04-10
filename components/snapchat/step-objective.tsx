"use client";

import { useState, useEffect, useRef } from "react";
import { useCampaign } from "@/lib/snapchat/campaign-context";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import { StepZeroHeader } from "@/components/shared/step-zero-header";

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
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  useEffect(() => {
    if (!obj.campaignName && obj.objective === "SALES") return;
    setAutoSaveState("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setAutoSaveState("saved"), 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [obj.campaignName, obj.objective, obj.catalogEnabled, obj.pixelMode, obj.pixelId]);

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
          <StepZeroHeader
            platform="snapchat"
            title="Create Snapchat Campaign"
            subtitle="Salla Ads"
            saveState={autoSaveState}
          />

          <div className="flex-1 overflow-y-auto">
            <div className={cn("mx-auto w-full max-w-3xl px-6 py-8", WIZARD_FOOTER_PADDING_BOTTOM)}>

              {/* ---- Campaign Goal ---- */}
              <div className="mb-6">
                <h2 className="text-base font-bold text-foreground">Choose your goal</h2>
                <p className="mt-1 text-xs text-muted-foreground">
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
                {OBJECTIVES.map((o) => {
                  const selected = obj.objective === o.value;
                  const funnel = FUNNEL_LABELS[o.funnelStage];
                  const OIcon = o.icon;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      disabled={o.disabled}
                      onClick={() => !o.disabled && handleObjectiveChange(o.value)}
                      className={cn(
                        "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all duration-200",
                        o.disabled
                          ? "cursor-not-allowed border-border bg-muted/50 opacity-60"
                          : selected
                            ? "border-primary bg-primary/[0.04] shadow-sm shadow-primary/10"
                            : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                      )}
                    >
                      {/* Top badges */}
                      {o.recommended && (
                        <div className="absolute -top-2.5 right-3">
                          <Badge className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
                            Recommended
                          </Badge>
                        </div>
                      )}
                      {!o.recommended && (o.badge || o.disabledReason) && (
                        <div className="absolute -top-2.5 right-3">
                          <Badge variant={o.disabled ? "outline" : "secondary"} className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            !o.disabled && "bg-emerald-100 text-emerald-700"
                          )}>
                            {o.disabledReason || o.badge}
                          </Badge>
                        </div>
                      )}

                      {/* Icon + checkmark */}
                      <div className="mb-3 flex items-center justify-between">
                        <div className={cn(
                          "flex size-10 items-center justify-center rounded-xl transition-colors",
                          o.disabled
                            ? "bg-muted text-muted-foreground"
                            : selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <OIcon className="size-5" />
                        </div>
                        {selected && <CheckCircle2 className="size-5 text-primary" />}
                      </div>

                      {/* Title */}
                      <p className={cn(
                        "text-sm font-semibold transition-colors",
                        o.disabled ? "text-muted-foreground" : selected ? "text-primary" : "text-foreground"
                      )}>
                        {o.label}
                      </p>

                      {/* Description */}
                      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
                        {o.desc}
                      </p>

                      {/* KPIs (always visible, compact) */}
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
                    <p className="text-[10px] text-muted-foreground">Ad formats</p>
                    <p className="mt-0.5 text-[11px] font-medium text-foreground">{currentConfig.allowedFormats.length} available</p>
                  </div>
                </div>
              </div>

              {/* ---- Step 2: Campaign Setup ---- */}
              <div className="mb-6">
                <h2 className="text-base font-bold text-foreground">Campaign Setup</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Name your campaign and configure tracking.
                </p>
              </div>

              {/* Campaign Name */}
              <div className="mb-4 rounded-xl border border-border bg-card p-5">
                <Label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  Campaign Name
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. Summer Collection - Snap Sales"
                  value={obj.campaignName}
                  onChange={(e) => updateNested("objective", { campaignName: e.target.value.slice(0, 375) })}
                  className="h-11 text-sm"
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    A descriptive name helps you identify this campaign in your dashboard.
                  </p>
                  <span className={cn(
                    "text-[11px] tabular-nums",
                    obj.campaignName.length > 350 ? "text-amber-600" : "text-muted-foreground"
                  )}>
                    {obj.campaignName.length}/375
                  </span>
                </div>
              </div>

              {/* Catalog Toggle */}
              {currentConfig.catalogAvailable && (
                <div className="mb-4 rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Tag className="size-4 text-primary" />
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
                          <p className="text-[10px] text-muted-foreground">Auto-synced product catalog</p>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                          <CheckCircle2 className="size-3" /> Connected
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Snapchat Connection (Pixel + Public Profile merged) ── */}
              {currentConfig.pixelRequirement !== "none" && (
                <div className="mb-4 rounded-xl border border-border bg-card p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Scan className="size-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">Snap Pixel</p>
                        <Badge variant={currentConfig.pixelRequirement === "required" ? "secondary" : "outline"} className="rounded-full px-1.5 py-0 text-[10px]">
                          {currentConfig.pixelRequirement === "required" ? "Required" : "Optional"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        Tracks visitor actions on your store to measure and optimize results.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Salla managed (recommended, shown first) */}
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
                        <Badge className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
                          Recommended
                        </Badge>
                      </div>
                      <div className="mb-2.5 flex items-center justify-between">
                        <div className={cn(
                          "flex size-8 items-center justify-center rounded-lg transition-colors",
                          obj.pixelMode === "salla_managed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <Zap className="size-4" />
                        </div>
                        {obj.pixelMode === "salla_managed" && <CheckCircle2 className="size-4 text-primary" />}
                      </div>
                      <p className={cn("text-xs font-semibold", obj.pixelMode === "salla_managed" ? "text-primary" : "text-foreground")}>
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
                        "group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all",
                        obj.pixelMode === "existing"
                          ? "border-primary bg-primary/[0.04] shadow-sm"
                          : "border-border bg-background hover:border-primary/40"
                      )}
                    >
                      <div className="mb-2.5 flex items-center justify-between">
                        <div className={cn(
                          "flex size-8 items-center justify-center rounded-lg transition-colors",
                          obj.pixelMode === "existing" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <Link2 className="size-4" />
                        </div>
                        {obj.pixelMode === "existing" && <CheckCircle2 className="size-4 text-primary" />}
                      </div>
                      <p className={cn("text-xs font-semibold", obj.pixelMode === "existing" ? "text-primary" : "text-foreground")}>
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
                              "rounded-full px-2 py-0 text-[9px] font-medium",
                              connectedPixel.status === "ACTIVE"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            )}
                          >
                            {connectedPixel.status === "ACTIVE" ? "Active" : connectedPixel.status === "PENDING" ? "Pending" : "Inactive"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
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
                <div className="mb-4 rounded-xl border border-border bg-card p-5">
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
                        <p className="mt-1 text-[10px] text-muted-foreground">The numeric ID from your App Store listing URL.</p>
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
                        <p className="mt-1 text-[10px] text-muted-foreground">The package name from your Google Play listing.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ---- Snapchat Public Profile (simplified) ---- */}
              <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
                <div className="px-6 py-5">
                  <h3 className="text-base font-bold text-foreground">Snapchat Public Profile</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your public profile appears on all your ads. It&apos;s auto-detected from your Salla account.
                  </p>
                </div>
                {snapProfile ? (
                  <div className="border-t border-border px-6 py-4">
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
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{snapProfile.profileId}</p>
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
                              <Badge variant="outline" className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2 py-0 text-[10px] font-medium text-emerald-700">
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
                    );
                  })()
                )}
              </div>

            </div>
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
    </TooltipProvider>
  );
}
