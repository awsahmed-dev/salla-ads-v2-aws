"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users,
  Sparkles,
  Wand2,
  TrendingUp,
  TrendingDown,
  Upload,
  Plus,
  ChevronRight,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Zap,
  Grid3x3,
  Brain,
  Cloud,
  Shield,
  RefreshCw,
  Target,
  Heart,
  UserPlus,
  Info,
  Moon,
  Ghost,
  Flame,
  CreditCard,
  CheckCircle2,
  Share2,
  Send,
  Ban,
  Calendar,
  CalendarClock,
  ShoppingCart,
} from "lucide-react";
import {
  generateMockCustomers,
  computeSegmentStats,
  buildMarimekkoData,
  generateMockAudiences,
  MERCHANT_PROFILES,
  SEGMENTS,
  type Audience,
  type MerchantProfile,
  type SegmentKey,
  type SegmentMeta,
  type ChatResult,
} from "@/lib/audience/rfdm";
import { AudienceLibrary } from "@/components/audience/audience-library";
import { AudienceDetailSheet } from "@/components/audience/audience-detail-sheet";
import { AIChatSheet } from "@/components/audience/ai-chat-sheet";
import { SegmentMarimekko } from "@/components/audience/segment-marimekko";
import { SallaTip } from "@/components/audience/salla-tip";
import { ComfyAudienceManager } from "@/components/audience/comfy-view";
import { FigmaAudienceManager, type FigmaInsight } from "@/components/audience/figma-view";
import { getNextSeasons, type UpcomingSeason } from "@/lib/audience/seasons";

const SEGMENT_ICONS: Record<SegmentKey, React.ComponentType<{ className?: string }>> = {
  champions: Crown,
  loyal: Heart,
  active: Zap,
  explorers: Target,
  new: UserPlus,
  promising: Sparkles,
  needs_attention: Info,
  almost_lost: AlertTriangle,
  at_risk: AlertTriangle,
  previously_loyal: Flame,
  dormant: Moon,
  never_purchased: Ghost,
};

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

function formatSar(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B SAR";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M SAR";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k SAR";
  return n.toLocaleString() + " SAR";
}

/* ────────────────────────────────────────────────────────── */
/*  KPI card (scale-aware)                                     */
/* ────────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sublabel,
  trend,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  sublabel?: string;
  trend?: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-shadow hover:shadow-sm",
        accent
          ? "border-[#a4ffe5] bg-gradient-to-br from-[#e6fff9] to-white"
          : "border-border bg-white"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={cn("size-3.5", accent ? "text-[#004956]" : "text-muted-foreground")} />
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-xl font-bold tabular-nums text-foreground">{value}</span>
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
            )}
          >
            {trend >= 0 ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      {sublabel && <p className="mt-0.5 text-[11px] text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Merchant tier switcher (demo aid)                          */
/* ────────────────────────────────────────────────────────── */

/**
 * View-density switcher: Detailed (current dense layout) vs.
 * Comfy (single-page, fewer cards/actions).
 */
function ViewSwitcher({
  value,
  onChange,
}: {
  value: "detailed" | "comfy" | "figma";
  onChange: (v: "detailed" | "comfy" | "figma") => void;
}) {
  const options: Array<{ id: "detailed" | "comfy" | "figma"; title: string }> = [
    { id: "detailed", title: "Full layout — filters, AI Studio, all 4 tabs" },
    { id: "comfy",    title: "Simpler layout — top actions + segments only" },
    { id: "figma",    title: "Figma layout — side header / tabs split, teal RFDM palette" },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          title={o.title}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-medium capitalize transition-all",
            value === o.id ? "bg-[#004956] text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.id}
        </button>
      ))}
    </div>
  );
}

function TierSwitcher({
  value,
  onChange,
}: {
  value: MerchantProfile["tier"];
  onChange: (v: MerchantProfile["tier"]) => void;
}) {
  const options: Array<{ tier: MerchantProfile["tier"]; label: string; sub: string }> = [
    { tier: "starter",    label: "Starter",    sub: "< 1k customers" },
    { tier: "growing",    label: "Growing",    sub: "60k customers" },
    { tier: "enterprise", label: "Enterprise", sub: "2.4M customers" },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.tier}
          type="button"
          onClick={() => onChange(o.tier)}
          title={o.sub}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-medium transition-all",
            value === o.tier
              ? "bg-[#004956] text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Page                                                        */
/* ────────────────────────────────────────────────────────── */

export default function AudienceManagerPage() {
  const [tier, setTier] = useState<MerchantProfile["tier"]>("growing");
  const [viewMode, setViewMode] = useState<"detailed" | "comfy" | "figma">("detailed");
  const profile = MERCHANT_PROFILES[tier];

  // In-memory sample of buying customers — used for the Marimekko + segment stats.
  // All audience sizes & chart scaling map this to the merchant's real total.
  const customers = useMemo(() => generateMockCustomers(1200), []);
  const stats = useMemo(() => computeSegmentStats(customers), [customers]);
  const marimekko = useMemo(
    () => buildMarimekkoData(customers, Math.round(profile.totalCustomers * profile.neverPurchasedShare)),
    [customers, profile.totalCustomers, profile.neverPurchasedShare]
  );

  const [audiences, setAudiences] = useState<Audience[]>(() => generateMockAudiences(profile));
  // Regenerate when tier changes
  useMemo(() => {
    setAudiences(generateMockAudiences(MERCHANT_PROFILES[tier]));
  }, [tier]);

  const [detail, setDetail] = useState<Audience | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPrefill, setChatPrefill] = useState("");
  const [commandInput, setCommandInput] = useState("");

  const totalLtv = useMemo(() => customers.reduce((a, c) => a + c.totalSpend, 0), [customers]);
  // Scale LTV to merchant tier
  const scaledLtv = Math.round((totalLtv / customers.length) * profile.totalCustomers);
  const activePct = customers.filter((c) => c.r >= 4).length / customers.length;
  const activeCount = Math.round(profile.totalCustomers * activePct);

  const topOpportunity = (Object.values(stats) as (typeof stats)[SegmentKey][]).reduce(
    (best, s) => (s.count * s.avgLtv > (best?.count ?? 0) * (best?.avgLtv ?? 0) ? s : best),
    null as (typeof stats)[SegmentKey] | null
  );

  const connectedCount = audiences.reduce(
    (a, aud) => a + aud.platformMatches.filter((m) => m.status === "synced").length,
    0
  );

  // AI Studio is now just chat-built audiences — Smart Combinations and Patterns
  // were moved to the AI team's roadmap.
  const aiChat = audiences.filter((a) => a.source === "ai_chat");

  const findAud = (needle: string) => audiences.find((a) => a.name.includes(needle));
  const atRisk = audiences.find((a) => a.rfdmKey === "at_risk");
  const previouslyLoyal = audiences.find((a) => a.rfdmKey === "previously_loyal");
  const explorers = audiences.find((a) => a.rfdmKey === "explorers");
  const champions = audiences.find((a) => a.rfdmKey === "champions");
  const neverPurchased = audiences.find((a) => a.rfdmKey === "never_purchased");
  const cartAbandon = findAud("Cart Abandoners");
  // Specifically the hot 7-day pool for the top-of-page metric
  const cartAbandon7d = audiences.find((a) => a.name.includes("Cart abandoners") && a.name.includes("7"))
    ?? audiences.find((a) => a.name.toLowerCase().includes("cart abandoners"));

  /**
   * Actionable insights — each is a real audience the merchant can launch a
   * campaign for right now. The action label & platforms come from the
   * audience's healthHint, so they stay grounded in actual data.
   */
  type Insight = {
    id: string;
    urgency: "urgent" | "opportunity" | "info";
    headline: string;
    why: string;
    target?: Audience;
  };

  const insights: Insight[] = [
    atRisk && {
      id: "i1",
      urgency: "urgent" as const,
      headline: `${formatNumber((atRisk?.size ?? 0) + (previouslyLoyal?.size ?? 0))} customers are slipping away`,
      why: `At Risk + Previously Loyal — they spent before but stopped ordering. Win-back has the highest expected ROAS.`,
      target: atRisk,
    },
    cartAbandon && {
      id: "i2",
      urgency: "urgent" as const,
      headline: `${formatNumber(cartAbandon.size)} cart abandoners — hot pool`,
      why: `Pixel-tracked add-to-cart in the last 7 days with no purchase. Short-form video converts these strongest in the GCC.`,
      target: cartAbandon,
    },
    explorers && explorers.size >= 1000 && {
      id: "i3",
      urgency: "opportunity" as const,
      headline: `${formatNumber(explorers.size)} Explorers — your best lookalike seed`,
      why: `Customers who buy across 4+ categories. Use them when you launch a new product line — they convert 2× better.`,
      target: explorers,
    },
    neverPurchased && {
      id: "i4",
      urgency: "opportunity" as const,
      headline: `${formatNumber(neverPurchased.size)} customers in your DB never bought`,
      why: `${(profile.neverPurchasedShare * 100).toFixed(0)}% of your customer DB. Biggest acquisition opportunity — start with a welcome offer.`,
      target: neverPurchased,
    },
    champions && champions.growth30d < 0 && {
      id: "i5",
      urgency: "urgent" as const,
      headline: `Champions shrunk ${Math.abs(champions.growth30d).toFixed(1)}% — protect them`,
      why: `Your top customers are slipping. A loyalty campaign + lookalike on Meta keeps the segment growing.`,
      target: champions,
    },
  ].filter(Boolean) as Insight[];

  /* ──────────────────────────────────────────────────────────────── */
  /*  Seasonal recommendations — Saudi calendar + real prep windows  */
  /* ──────────────────────────────────────────────────────────────── */
  const upcomingSeasons = useMemo<UpcomingSeason[]>(() => getNextSeasons(), []);

  /** Promote up-to-2 in-prep-window seasons to actionable recommendation cards. */
  type SeasonalRec = {
    id: string;
    headline: string;
    why: string;
    daysAway: number;
    prefillPrompt: string;
    seasonName: string;
  };
  const seasonalRecs: SeasonalRec[] = upcomingSeasons
    .filter((s) => s.isInPrepWindow)
    .slice(0, 2)
    .map((s) => ({
      id: `season_${s.event.name}`,
      headline: `${s.event.name} in ${s.daysAway} days — build your "${s.event.suggestion.listName}" list`,
      why: s.event.suggestion.rationale,
      daysAway: s.daysAway,
      prefillPrompt: `Customers who bought during last year's ${s.event.name} window`,
      seasonName: s.event.name,
    }));

  /* ──────────────────────────────────────────────────────────────── */
  /*  Top-of-page metrics — useful, not redundant                    */
  /*    1. Total customers (size)                                    */
  /*    2. Active buyers in 30d (audience scaling signal)            */
  /*    3. Lists ready to use (audiences passing platform minimums)  */
  /* ──────────────────────────────────────────────────────────────── */
  const listsReady = audiences.filter(
    (a) => a.status === "ready" && a.size >= 1000
  ).length;

  const nextSeason = upcomingSeasons[0];

  function handleCommandSubmit() {
    if (!commandInput.trim()) {
      setChatOpen(true);
      return;
    }
    setChatPrefill(commandInput);
    setChatOpen(true);
    setCommandInput("");
  }

  /**
   * Real audience-API callbacks fired from the detail sheet.
   * None of these create campaigns — each is a real, single platform API
   * call (lookalike create / audience push / exclusion toggle / CSV export).
   * Campaign creation lives in Ad Management; the audience manager only
   * prepares audiences for it.
   */
  function handleLookalikeCreated(sourceId: string, newId: string, mode: string, platform: string) {
    const seed = audiences.find((a) => a.id === sourceId);
    if (!seed) return;
    const lal: Audience = {
      ...seed,
      id: newId,
      name: `Lookalike ${mode} — ${seed.name} (${platform})`,
      description: `Built from ${seed.name} on ${platform}. Spec: lookalike_spec mode=${mode}, country=SA.`,
      source: "lookalike",
      rfdmKey: undefined,
      tags: ["lookalike", platform],
      growth30d: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // size is auto-estimated by the platform; we show "pending"
      size: 0,
      status: "syncing",
      useCases: ["acquire", "lookalike"],
    };
    setAudiences((prev) => [lal, ...prev]);
  }

  /**
   * Navigate to /ad-management with the audience pre-selected.
   * The campaign wizard reads `?audience=<id>` and pre-fills targeting.
   * (For now this just logs + closes the drawer — wiring to the actual route
   * is a small follow-up in /ad-management.)
   */
  function handleCreateCampaignFromAudience(audience: Audience) {
    // eslint-disable-next-line no-console
    console.log("[audience-manager] create-campaign with audience:", audience.id, audience.healthHint?.objective);
    setDetail(null);
    // router.push(`/ad-management?audience=${audience.id}`);
  }

  /**
   * Wired to SegmentMarimekko's hover-card "Create campaign" button.
   * Merchant hovers a segment → clicks the button in the popover →
   * we look up the corresponding Audience by rfdmKey and route into
   * the campaign builder with it pre-selected. Bypasses the side
   * panel entirely, saving two clicks vs. the old flow.
   */
  function handleCreateCampaignFromSegment(segment: string, _count: number) {
    const aud = audiences.find((a) => a.rfdmKey === segment);
    if (aud) {
      handleCreateCampaignFromAudience(aud);
    } else {
      // eslint-disable-next-line no-console
      console.log("[audience-manager] create-campaign for segment (no matching audience yet):", segment);
    }
  }

  function handleExclusionToggled(audienceId: string, enabled: boolean) {
    setAudiences((prev) =>
      prev.map((a) =>
        a.id === audienceId
          ? { ...a, tags: Array.from(new Set([...(enabled ? [...a.tags, "exclusion-active"] : a.tags.filter((t) => t !== "exclusion-active"))])) }
          : a
      )
    );
  }

  function handleSaveFromChat(args: { name: string; prompt: string; result: ChatResult }) {
    const id = `chat_user_${Date.now()}`;
    const newAudience: Audience = {
      id,
      name: args.name,
      description: `Generated from chat · "${args.prompt}"`,
      source: "ai_chat",
      size: args.result.matched,
      status: args.result.matched < 1000 ? "too_small" : "ready",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      growth30d: 0,
      sparkline: [],
      platformMatches: [],
      useCases: ["retarget"],
      tags: ["ai", "chat", "custom"],
      prompt: args.prompt,
      aiRationale: args.result.rationale,
    };
    // Compute platform matches
    const freshWithMatches = generateMockAudiences(profile)[0]; // reuse helper? too heavy
    // Just hand-craft matches for the new one
    const sz = newAudience.size;
    newAudience.platformMatches = [
      { platform: "meta", matched: Math.round(sz * 0.72), matchRate: 0.72, status: "synced", lastSyncedAt: new Date().toISOString(), minRequired: 1000 },
      { platform: "google", matched: Math.round(sz * 0.64), matchRate: 0.64, status: "synced", lastSyncedAt: new Date().toISOString(), minRequired: 1000 },
      { platform: "snapchat", matched: Math.round(sz * 0.51), matchRate: 0.51, status: "syncing", minRequired: 1000 },
      { platform: "tiktok", matched: Math.round(sz * 0.58), matchRate: 0.58, status: "synced", lastSyncedAt: new Date().toISOString(), minRequired: 1000 },
      { platform: "dv360", matched: Math.round(sz * 0.61), matchRate: 0.61, status: "synced", lastSyncedAt: new Date().toISOString(), minRequired: 1000 },
    ];
    newAudience.sparkline = Array.from({ length: 12 }, () => sz);
    setAudiences((prev) => [newAudience, ...prev]);
    setDetail(newAudience);
  }

  return (
    <div className="min-h-screen bg-[#f8fafb] pb-16">
      {/* Page header */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-14">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#004956]">Audience Manager</h1>
                <Badge className="rounded-full bg-[#e6fff9] text-[#004956] hover:bg-[#e6fff9]">
                  <Sparkles className="mr-1 size-3" />
                  RFDM · Predictive · Generative
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Prepare audiences here — sync, build lookalikes, manage exclusions. Launch campaigns in <strong className="text-[#004956]">Ad Management → Create Ad</strong>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ViewSwitcher value={viewMode} onChange={setViewMode} />
              <span className="h-5 w-px bg-border" aria-hidden />
              <TierSwitcher value={tier} onChange={setTier} />
              {/* One primary action — the rest moved into the AI Studio tab. */}
              {viewMode === "detailed" && (
                <Button
                  size="sm"
                  onClick={() => setChatOpen(true)}
                  className="gap-1.5 bg-[#004956] text-white hover:bg-[#003e4a]"
                >
                  <Plus className="size-3.5" />
                  Build audience
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-5 sm:px-6 lg:px-14">
        {viewMode === "figma" ? (
          (() => {
            // Same combined+ranked pipeline as the Detailed view, mapped to FigmaInsight shape
            const combined: FigmaInsight[] = [];
            seasonalRecs.forEach((rec) => combined.push({
              id: rec.id,
              urgency: "seasonal",
              source: `${rec.daysAway}d to ${rec.seasonName}`,
              headline: rec.headline,
              why: rec.why,
              actionLabel: "Build with AI",
              ActionIcon: Wand2,
              onClick: () => { setChatPrefill(rec.prefillPrompt); setChatOpen(true); },
            }));
            insights.forEach((insight) => {
              const aud = insight.target;
              const hint = aud?.healthHint;
              const action = hint?.objective === "LOOKALIKE" ? { label: "Build Lookalike", icon: Share2 }
                           : hint?.objective === "SUPPRESS"  ? { label: "Use as Exclusion", icon: Ban }
                           : { label: "Open list", icon: ChevronRight };
              combined.push({
                id: insight.id,
                urgency: insight.urgency,
                source: aud?.source === "rfdm" ? "from RFDM"
                      : aud?.source === "salla_segment" ? "from Salla store"
                      : aud?.source === "website_event" ? "from website pixel"
                      : aud?.source === "ad_engagement" ? "from ad engagement"
                      : aud?.source === "lookalike" ? "from lookalike"
                      : "from your data",
                headline: insight.headline,
                why: insight.why,
                actionLabel: action.label,
                ActionIcon: action.icon,
                onClick: () => aud && setDetail(aud),
              });
            });
            // Stable rank: seasonal → urgent → opportunity → info
            const rankOf = (u: FigmaInsight["urgency"]) =>
              u === "seasonal" ? 0 : u === "urgent" ? 1 : u === "opportunity" ? 2 : 3;
            const ranked = combined.sort((a, b) => rankOf(a.urgency) - rankOf(b.urgency));
            return (
              <FigmaAudienceManager
                audiences={audiences}
                marimekko={marimekko}
                profile={profile}
                insights={ranked}
                customersTotal={profile.totalCustomers}
                cartAbandoners={cartAbandon7d}
                neverPurchased={neverPurchased}
                nextSeason={nextSeason}
                aiChat={aiChat}
                onSelectAudience={setDetail}
                onOpenChat={() => setChatOpen(true)}
                onCreateCampaign={handleCreateCampaignFromSegment}
              />
            );
          })()
        ) : viewMode === "comfy" ? (
          <ComfyAudienceManager
            audiences={audiences}
            marimekko={marimekko}
            profile={profile}
            insights={insights}
            totalLtv={scaledLtv}
            topOpportunity={
              topOpportunity
                ? {
                    name: SEGMENTS[topOpportunity.key].name,
                    sublabel: `${formatNumber(Math.round((topOpportunity.count / customers.length) * profile.totalCustomers))} customers · ${formatSar(topOpportunity.count * topOpportunity.avgLtv)} potential`,
                  }
                : null
            }
            onSelectAudience={setDetail}
            onOpenChat={() => setChatOpen(true)}
            onCreateCampaign={handleCreateCampaignFromSegment}
          />
        ) : (
        <>
        {/* ─────────────────────────────────────────────────────────────
           Merged panel: 3 useful metrics + top 3 recommendations.
           Designed to fit above the fold on a typical laptop, so the
           tabs below stay glanceable without scrolling.
        ───────────────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-white">
          {/* Slim metric strip — three concrete pools mapped to the funnel.
              Each metric clickable → opens its underlying audience.
              Each label has an info icon (hover for plain-language description). */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-border px-4 py-2.5">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              {/* 1. Total customers — anchor */}
              <div
                className="group flex items-baseline gap-1.5"
                title="Customers — Everyone in your store database, including buyers, account holders, and newsletter subscribers. The reach ceiling for any campaign."
              >
                <span className="flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Customers
                  <Info className="size-2.5 opacity-50 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="text-base font-bold tabular-nums text-foreground">{formatNumber(profile.totalCustomers)}</span>
              </div>

              {/* 2. Cart abandoners — about-to-buy retargeting pool */}
              <button
                type="button"
                onClick={() => cartAbandon7d && setDetail(cartAbandon7d)}
                title="Cart abandoners — Customers who added items to cart in the last 7 days but didn't check out. Your hottest retargeting pool — a quick reminder usually closes the sale."
                className="group flex items-baseline gap-1.5 rounded-md transition-colors hover:bg-muted/40 hover:px-1 hover:-mx-1"
              >
                <span className="flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Cart abandoners
                  <Info className="size-2.5 opacity-50 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="text-base font-bold tabular-nums text-foreground">
                  {cartAbandon7d ? formatNumber(cartAbandon7d.size) : "—"}
                </span>
              </button>

              {/* 3. Never purchased — yet-to-convert acquisition pool */}
              <button
                type="button"
                onClick={() => neverPurchased && setDetail(neverPurchased)}
                title="Never purchased — Customers in your DB who never placed an order (newsletter sign-ups, account creators, leads). Your biggest acquisition opportunity."
                className="group flex items-baseline gap-1.5 rounded-md transition-colors hover:bg-muted/40 hover:px-1 hover:-mx-1"
              >
                <span className="flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Never purchased
                  <Info className="size-2.5 opacity-50 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="text-base font-bold tabular-nums text-foreground">
                  {neverPurchased ? formatNumber(neverPurchased.size) : "—"}
                </span>
              </button>
            </div>
            {nextSeason && (
              <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                <CalendarClock className="size-3" />
                {nextSeason.event.name} in {nextSeason.daysAway}d
              </div>
            )}
          </div>

          {/* Recommendations — top 3 only, fixed 3-col grid (no scroll) */}
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="size-3.5 text-violet-500" />
              <h2
                className="text-xs font-bold text-foreground"
                title="Top 3 picks combining your real store data and the Saudi calendar"
              >
                Recommended this week
              </h2>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Combine seasonal + data-driven, rank by urgency, take top 3 */}
              {(() => {
                type Rec = {
                  key: string;
                  rank: number;
                  pillLabel: string;
                  pillBg: string;
                  border: string;
                  source: string;
                  headline: string;
                  why: string;
                  actionLabel: string;
                  ActionIcon: React.ComponentType<{ className?: string }>;
                  onClick: () => void;
                };
                const recs: Rec[] = [];
                seasonalRecs.forEach((rec) => recs.push({
                  key: rec.id,
                  rank: 0, // seasonal always first
                  pillLabel: "Seasonal",
                  pillBg: "bg-amber-100 text-amber-700",
                  border: "border-amber-200",
                  source: `${rec.daysAway}d to ${rec.seasonName}`,
                  headline: rec.headline,
                  why: rec.why,
                  actionLabel: "Build with AI",
                  ActionIcon: Wand2,
                  onClick: () => { setChatPrefill(rec.prefillPrompt); setChatOpen(true); },
                }));
                insights.forEach((insight) => {
                  const aud = insight.target;
                  const hint = aud?.healthHint;
                  const tone = {
                    urgent:      { rank: 1, pillLabel: "Urgent",      pillBg: "bg-red-100 text-red-700",         border: "border-red-200" },
                    opportunity: { rank: 2, pillLabel: "Opportunity", pillBg: "bg-[#a4ffe5] text-[#004956]",     border: "border-[#a4ffe5]" },
                    info:        { rank: 3, pillLabel: "Heads up",   pillBg: "bg-violet-100 text-violet-700",   border: "border-violet-200" },
                  }[insight.urgency];
                  const action = hint?.objective === "LOOKALIKE" ? { label: "Build Lookalike", icon: Share2 }
                               : hint?.objective === "SUPPRESS"  ? { label: "Use as Exclusion", icon: Ban }
                               : { label: "Open list", icon: ChevronRight };
                  recs.push({
                    key: insight.id,
                    rank: tone.rank,
                    pillLabel: tone.pillLabel,
                    pillBg: tone.pillBg,
                    border: tone.border,
                    source: aud?.source === "rfdm" ? "from RFDM"
                          : aud?.source === "pixel" ? "from pixel"
                          : aud?.source === "conversion" ? "from conversions"
                          : "from your data",
                    headline: insight.headline,
                    why: insight.why,
                    actionLabel: action.label,
                    ActionIcon: action.icon,
                    onClick: () => aud && setDetail(aud),
                  });
                });
                return recs.sort((a, b) => a.rank - b.rank).slice(0, 3).map((rec) => (
                  <button
                    key={rec.key}
                    type="button"
                    onClick={rec.onClick}
                    className={cn(
                      "group flex flex-col gap-1.5 rounded-xl border bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
                      rec.border
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn("inline-flex rounded-full px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide", rec.pillBg)}>
                        {rec.pillLabel}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {rec.source}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[13px] font-bold leading-snug text-foreground">{rec.headline}</p>
                    <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">{rec.why}</p>
                    <div className="mt-auto flex items-center gap-1 pt-0.5 text-[11px] font-semibold text-[#004956]">
                      <rec.ActionIcon className="size-3" />
                      {rec.actionLabel}
                      <ChevronRight className="size-3" />
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="library" className="space-y-4">
          <TabsList className="h-10 w-fit rounded-xl bg-white p-1 shadow-sm">
            <TabsTrigger
              value="library"
              className="gap-1.5 rounded-lg text-sm data-[state=active]:bg-[#e6fff9] data-[state=active]:text-[#004956]"
            >
              <Target className="size-3.5" />
              Library
              <Badge className="h-4 rounded-full bg-muted/40 px-1.5 text-[9px] text-muted-foreground">
                {audiences.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="rfdm"
              className="gap-1.5 rounded-lg text-sm data-[state=active]:bg-[#e6fff9] data-[state=active]:text-[#004956]"
            >
              <Grid3x3 className="size-3.5" />
              RFDM Explorer
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="gap-1.5 rounded-lg text-sm data-[state=active]:bg-[#e6fff9] data-[state=active]:text-[#004956]"
            >
              <Brain className="size-3.5" />
              AI Studio
              <Badge className="h-4 rounded-full bg-violet-100 px-1.5 text-[9px] text-violet-700">
                {aiChat.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="channels"
              className="gap-1.5 rounded-lg text-sm data-[state=active]:bg-[#e6fff9] data-[state=active]:text-[#004956]"
            >
              <Cloud className="size-3.5" />
              Channel Sync
            </TabsTrigger>
          </TabsList>

          {/* LIBRARY */}
          <TabsContent value="library" className="mt-0">
            <AudienceLibrary
              audiences={audiences}
              onSelectAudience={setDetail}
              merchantTier={tier}
            />
          </TabsContent>

          {/* RFDM EXPLORER */}
          <TabsContent value="rfdm" className="mt-0 space-y-4">
            {/* The Marimekko chart — same shape as the data team's plot */}
            <SegmentMarimekko
              data={marimekko}
              scaleTotal={profile.totalCustomers}
              onCellClick={(segment) => {
                const aud = audiences.find((a) => a.rfdmKey === segment);
                if (aud) setDetail(aud);
              }}
              onCreateCampaign={handleCreateCampaignFromSegment}
            />

            {/* Schema explainer + competitor delta */}
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#a4ffe5] bg-gradient-to-br from-[#e6fff9] to-white p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-[#004956]" />
                  <div>
                    <p className="text-sm font-bold text-[#004956]">RFDM vs. RFM (and Shopify)</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-[#004956]/85">
                      Shopify Audiences only ships <strong>lookalike-style segments</strong> for Meta and Google.
                      Klaviyo and Mailchimp segment by RFM but stop there. We add <strong>D = Diversity</strong>
                      (number of distinct categories per buyer), which is the cleanest split between narrow loyalists
                      and cross-category households — two audiences that need different creative and different lookalike seeds.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Built on real fields</p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Every segment is derived from columns the data team already exposes:
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {["customers", "customers_pct", "avg_days_from_last_order", "total_orders", "total_spending", "country", "payment_method"].map((f) => (
                    <span key={f} className="rounded-full border border-border bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* All 12 segments as cards/list */}
            <div>
              <h3 className="mb-2 text-sm font-bold text-foreground">All Salla segments ({audiences.filter((a) => a.source === "rfdm").length})</h3>
              <AudienceLibrary
                audiences={audiences.filter((a) => a.source === "rfdm")}
                onSelectAudience={setDetail}
                merchantTier={tier}
              />
            </div>
          </TabsContent>

          {/* AI STUDIO */}
          <TabsContent value="ai" className="mt-0 space-y-5">
            {/* AI explainer — grounded, no imaginary ML */}
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-purple-50/40 p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Brain className="size-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-foreground">AI Studio</h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Audiences derived from <strong className="text-foreground">real fields</strong> in your store data — segment, total_spending, avg_days_from_last_order, total_orders, country, payment.
                    <strong className="text-foreground"> Smart Combinations</strong> filter your RFDM segments by these fields.
                    <strong className="text-foreground"> Patterns</strong> surface recurring behaviors we noticed in your order history.
                    <strong className="text-foreground"> Chat</strong> lets you describe an audience in plain language.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setChatOpen(true)}
                  className="shrink-0 gap-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
                >
                  <Wand2 className="size-3.5" />
                  Build with chat
                </Button>
              </div>
              <SallaTip className="mt-3 bg-white/60">
                Describe an audience in plain language — AI builds the filter, shows the size, you save it. Smart pre-built suggestions are on the AI team's roadmap.
              </SallaTip>
            </div>

            {/* AI command bar — moved here from page top so it lives where building happens */}
            <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-[#e6fff9] p-1.5">
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Wand2 className="size-3.5" />
                </div>
                <Input
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCommandSubmit(); }}
                  placeholder='Describe an audience — e.g. "VIP customers in UAE who bought 3 months ago"'
                  className="h-9 flex-1 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                />
                <Button
                  size="sm"
                  onClick={handleCommandSubmit}
                  className="h-7 gap-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
                >
                  Generate
                  <ChevronRight className="size-3" />
                </Button>
              </div>
            </div>

            {/* One unified AI library — only chat-built audiences for now */}
            {aiChat.length === 0 ? (
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/30 p-8 text-center transition-colors hover:border-violet-400 hover:bg-violet-50"
              >
                <Wand2 className="size-5 text-violet-500" />
                <div>
                  <p className="text-sm font-semibold text-foreground">No chat audiences yet</p>
                  <p className="text-[11px] text-muted-foreground">Use the bar above to describe one</p>
                </div>
              </button>
            ) : (
              <AudienceLibrary
                audiences={aiChat}
                onSelectAudience={setDetail}
                merchantTier={tier}
              />
            )}
          </TabsContent>

          {/* CHANNEL SYNC — connection status only. Sync runs automatically in the background. */}
          <TabsContent value="channels" className="mt-0 space-y-4">
            <SallaTip>
              Audiences <strong>sync automatically</strong> to every connected platform — you don't need to do anything. This page only shows which platforms are connected.
            </SallaTip>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {([
                { id: "meta",     name: "Meta",            color: "#1877F2", bgColor: "#E7F0FE" },
                { id: "google",   name: "Google Ads",      color: "#4285F4", bgColor: "#E8F0FE" },
                { id: "snapchat", name: "Snapchat",        color: "#F5B700", bgColor: "#FFFBEB" },
                { id: "tiktok",   name: "TikTok",          color: "#000",    bgColor: "#F4F4F5" },
                { id: "dv360",    name: "YouTube / DV360", color: "#DC2626", bgColor: "#FEF2F2" },
              ] as const).map((plat) => {
                const platMatches = audiences.flatMap((a) => a.platformMatches.filter((m) => m.platform === plat.id));
                const synced = platMatches.filter((m) => m.status === "synced").length;
                const isConnected = platMatches.some((m) => m.status !== "not_connected");
                return (
                  <div key={plat.id} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                      style={{ backgroundColor: plat.bgColor, color: plat.color }}
                    >
                      {plat.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{plat.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {isConnected ? `${synced} of ${audiences.length} audiences live` : "Not connected"}
                      </p>
                    </div>
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle2 className="size-2.5" />
                        Auto-syncing
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs">
                        Connect
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>

      {/* Sheets */}
      <AudienceDetailSheet
        audience={detail}
        open={!!detail}
        onOpenChange={(v) => !v && setDetail(null)}
        onLookalikeCreated={handleLookalikeCreated}
        onExclusionToggled={handleExclusionToggled}
        onCreateCampaign={handleCreateCampaignFromAudience}
      />
      <AIChatSheet
        open={chatOpen}
        onOpenChange={(v) => {
          setChatOpen(v);
          if (!v) setChatPrefill("");
        }}
        customers={customers}
        totalCustomers={profile.totalCustomers}
        onSave={handleSaveFromChat}
        initialPrompt={chatPrefill}
      />
    </div>
  );
}
