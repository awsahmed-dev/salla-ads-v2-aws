"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ChevronRight,
  Wand2,
  Share2,
  Ban,
  CalendarClock,
  Info,
  Target,
  Grid3x3,
  Brain,
  Cloud,
  RefreshCw,
  Shield,
} from "lucide-react";
import {
  SEGMENTS,
  type Audience,
  type MerchantProfile,
  type SegmentKey,
  type MarimekkoData,
} from "@/lib/audience/rfdm";
import { SegmentMarimekko } from "@/components/audience/segment-marimekko";
import { AudienceLibrary } from "@/components/audience/audience-library";
import { SallaTip } from "@/components/audience/salla-tip";

/* ────────────────────────────────────────────────────────── */

export interface FigmaInsight {
  id: string;
  urgency: "urgent" | "opportunity" | "info" | "seasonal";
  source: string;
  headline: string;
  why: string;
  actionLabel: string;
  ActionIcon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

interface NextSeason {
  event: { name: string };
  daysAway: number;
}

interface Props {
  audiences: Audience[];
  marimekko: MarimekkoData;
  profile: MerchantProfile;
  insights: FigmaInsight[];
  customersTotal: number;
  cartAbandoners: Audience | undefined;
  neverPurchased: Audience | undefined;
  nextSeason: NextSeason | null;
  aiChat: Audience[];
  onSelectAudience: (a: Audience) => void;
  onOpenChat: () => void;
  /** One-click "Create campaign" from the RFM segment hover-card. */
  onCreateCampaign?: (segment: string, count: number) => void;
}

/* ────────────────────────────────────────────────────────── */

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

/* ────────────────────────────────────────────────────────── */

const TABS = [
  {
    id: "library",
    label: "Library",
    icon: Target,
    title: "Audience Library",
    description: "All your audiences in one place — segments, predictions, imports, lists. Filter by source and platform readiness.",
  },
  {
    id: "rfdm",
    label: "RFDM Explorer",
    icon: Grid3x3,
    title: "RFDM Explorer",
    description: "Visual breakdown of your customer base by Recency × Frequency × Monetary × Diversity.",
  },
  {
    id: "ai",
    label: "AI Studio",
    icon: Brain,
    title: "AI Studio",
    description: "Audiences you built by describing them in plain language. Smart pre-built suggestions are on the AI team's roadmap.",
  },
  {
    id: "channels",
    label: "Channel Sync",
    icon: Cloud,
    title: "Channel Sync",
    description: "Per-platform audience match status across Meta, Google, Snap, TikTok, and YouTube.",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ────────────────────────────────────────────────────────── */
/*  Insight card — same compact shape as Detailed view          */
/* ────────────────────────────────────────────────────────── */

function InsightCard({ insight }: { insight: FigmaInsight }) {
  const tone = {
    urgent:      { border: "border-red-200",     pillBg: "bg-red-100 text-red-700",         pillLabel: "Urgent" },
    opportunity: { border: "border-[#a4ffe5]",   pillBg: "bg-[#a4ffe5] text-[#004956]",     pillLabel: "Opportunity" },
    info:        { border: "border-violet-200",  pillBg: "bg-violet-100 text-violet-700",   pillLabel: "Heads up" },
    seasonal:    { border: "border-amber-200",   pillBg: "bg-amber-100 text-amber-700",     pillLabel: "Seasonal" },
  }[insight.urgency];

  return (
    <button
      type="button"
      onClick={insight.onClick}
      className={cn(
        "group flex flex-col gap-1.5 rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
        tone.border
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("inline-flex rounded-full px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide", tone.pillBg)}>
          {tone.pillLabel}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{insight.source}</span>
      </div>
      <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground">{insight.headline}</p>
      <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">{insight.why}</p>
      <div className="mt-auto flex items-center gap-1 pt-1 text-[11px] font-semibold text-[#004956]">
        <insight.ActionIcon className="size-3" />
        {insight.actionLabel}
        <ChevronRight className="size-3" />
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Main component                                              */
/* ────────────────────────────────────────────────────────── */

export function FigmaAudienceManager({
  audiences,
  marimekko,
  profile,
  insights,
  customersTotal,
  cartAbandoners,
  neverPurchased,
  nextSeason,
  aiChat,
  onSelectAudience,
  onOpenChat,
  onCreateCampaign,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("library");
  const top3 = insights.slice(0, 3);
  const activeMeta = TABS.find((t) => t.id === activeTab)!;

  // Per-platform match aggregates for the Channel Sync tab
  const platformAgg = (["meta", "google", "snapchat", "tiktok", "dv360"] as const).map((p) => {
    const matches = audiences.flatMap((a) => a.platformMatches.filter((m) => m.platform === p));
    const synced = matches.filter((m) => m.status === "synced").length;
    const totalMatched = matches.reduce((acc, m) => acc + m.matched, 0);
    const avgRate = matches.reduce((acc, m) => acc + m.matchRate, 0) / Math.max(1, matches.length);
    const meta: Record<string, { label: string; color: string; bg: string }> = {
      meta:     { label: "Meta",            color: "#1877F2", bg: "#E7F0FE" },
      google:   { label: "Google Ads",      color: "#4285F4", bg: "#E8F0FE" },
      snapchat: { label: "Snapchat",        color: "#F5B700", bg: "#FFFBEB" },
      tiktok:   { label: "TikTok",          color: "#000",    bg: "#F4F4F5" },
      dv360:    { label: "YouTube / DV360", color: "#DC2626", bg: "#FEF2F2" },
    };
    return { id: p, ...meta[p], synced, totalMatched, avgRate };
  });

  return (
    <div className="space-y-5">
      {/* Section title — Audience overview */}
      <div>
        <h2 className="text-lg font-bold text-foreground">Audience overview</h2>
        <p className="text-xs text-muted-foreground">
          Your audience pools at a glance — total reach, near-conversions, and untapped buyers.
        </p>
      </div>

      {/* Metrics + recommendations card */}
      <section className="rounded-2xl border border-border bg-white">
        {/* Slim metric strip */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-border px-4 py-2.5">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <div
              className="group flex items-baseline gap-1.5"
              title="Customers — Everyone in your store database, including buyers, account holders, and newsletter subscribers. The reach ceiling for any campaign."
            >
              <span className="flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Customers
                <Info className="size-2.5 opacity-50 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="text-base font-bold tabular-nums text-foreground">{formatNumber(customersTotal)}</span>
            </div>
            <button
              type="button"
              onClick={() => cartAbandoners && onSelectAudience(cartAbandoners)}
              title="Cart abandoners — Customers who added items to cart in the last 7 days but didn't check out. Your hottest retargeting pool."
              className="group flex items-baseline gap-1.5 rounded-md transition-colors hover:bg-muted/40 hover:px-1 hover:-mx-1"
            >
              <span className="flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Cart abandoners
                <Info className="size-2.5 opacity-50 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="text-base font-bold tabular-nums text-foreground">
                {cartAbandoners ? formatNumber(cartAbandoners.size) : "—"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => neverPurchased && onSelectAudience(neverPurchased)}
              title="Never purchased — Customers in your DB who never placed an order. Your biggest acquisition opportunity."
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

        {/* Recommendations */}
        <div className="px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="size-3.5 text-violet-500" />
            <h3 className="text-xs font-bold text-foreground">Recommended this week</h3>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {top3.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Section header with tabs on the side (the layout you moved) ── */}
      <section className="rounded-2xl border border-border bg-white">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground">{activeMeta.title}</h2>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{activeMeta.description}</p>
          </div>
          {/* Tabs — horizontal pill row, on the opposite side from the title */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-muted/30 p-1 lg:shrink-0">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-white text-[#004956] shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TabIcon className="size-3.5" />
                  {tab.label}
                  {tab.id === "library" && (
                    <Badge className="h-4 rounded-full bg-muted/40 px-1.5 text-[9px] text-muted-foreground">
                      {audiences.length}
                    </Badge>
                  )}
                  {tab.id === "ai" && (
                    <Badge className="h-4 rounded-full bg-violet-100 px-1.5 text-[9px] text-violet-700">
                      {aiChat.length}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content area */}
        <div className="p-5">
          {activeTab === "library" && (
            <AudienceLibrary
              audiences={audiences}
              onSelectAudience={onSelectAudience}
              merchantTier={profile.tier}
            />
          )}

          {activeTab === "rfdm" && (
            <div className="space-y-4">
              <SegmentMarimekko
                data={marimekko}
                scaleTotal={profile.totalCustomers}
                palette="teal"
                height={460}
                onCellClick={(segment) => {
                  const aud = audiences.find((a) => a.rfdmKey === segment);
                  if (aud) onSelectAudience(aud);
                }}
                onCreateCampaign={onCreateCampaign}
              />
              <SallaTip>
                <strong>Salla teal palette</strong> — darker shades are the most valuable / most urgent segments. The leftmost
                strip is <strong>Never purchased</strong> (no R/F/M score, sits outside the matrix).
                Click any block to open that segment's details.
              </SallaTip>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-purple-50/40 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Brain className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">AI Chat audiences</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    Describe an audience in plain language — AI builds the filter, shows the size, you save it.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={onOpenChat}
                  className="shrink-0 gap-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
                >
                  <Wand2 className="size-3.5" />
                  Build with chat
                </Button>
              </div>
              <AudienceLibrary
                audiences={aiChat}
                onSelectAudience={onSelectAudience}
                merchantTier={profile.tier}
              />
            </div>
          )}

          {activeTab === "channels" && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              {platformAgg.map((p) => (
                <div key={p.id} className="rounded-2xl border border-border bg-white p-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex size-9 items-center justify-center rounded-xl text-sm font-bold"
                      style={{ backgroundColor: p.bg, color: p.color }}
                    >
                      {p.label[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{p.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.synced}/{audiences.length} audiences synced
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] font-medium uppercase text-muted-foreground">Matched</span>
                      <span className="text-lg font-bold tabular-nums text-foreground">{formatNumber(p.totalMatched)}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] font-medium uppercase text-muted-foreground">Avg rate</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">{(p.avgRate * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all" style={{ width: `${p.avgRate * 100}%`, backgroundColor: p.color }} />
                  </div>
                  <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                    <RefreshCw className="size-3" />
                    Auto-syncs every hour
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
