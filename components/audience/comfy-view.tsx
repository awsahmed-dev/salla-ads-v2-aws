"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Crown,
  Heart,
  Zap,
  Target,
  UserPlus,
  Sparkles,
  Info,
  AlertTriangle,
  Moon,
  Ghost,
  Flame,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Wand2,
  Send,
  Share2,
  Ban,
  TrendingUp,
} from "lucide-react";
import {
  SEGMENTS,
  type Audience,
  type MerchantProfile,
  type SegmentKey,
  type MarimekkoData,
} from "@/lib/audience/rfdm";
import { SegmentMarimekko } from "@/components/audience/segment-marimekko";
import { SallaTip } from "@/components/audience/salla-tip";

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
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B SAR";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M SAR";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k SAR";
  return n.toLocaleString() + " SAR";
}

/* ────────────────────────────────────────────────────────── */

export interface ComfyInsight {
  id: string;
  urgency: "urgent" | "opportunity" | "info";
  headline: string;
  why: string;
  target?: Audience;
}

interface Props {
  audiences: Audience[];
  marimekko: MarimekkoData;
  profile: MerchantProfile;
  insights: ComfyInsight[];
  totalLtv: number;
  topOpportunity: { name: string; sublabel: string } | null;
  onSelectAudience: (a: Audience) => void;
  onOpenChat: () => void;
  /** One-click "Create campaign" from the segment hover-card action.
   *  Bypasses the side panel and jumps straight into campaign creation
   *  with the segment pre-selected. */
  onCreateCampaign?: (segment: string, count: number) => void;
}

/* ────────────────────────────────────────────────────────── */

function BigKpi({
  label,
  value,
  sublabel,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        accent
          ? "border-[#a4ffe5] bg-gradient-to-br from-[#e6fff9] to-white"
          : "border-border bg-white"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", accent ? "text-[#004956]" : "text-muted-foreground")} />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */

function CompactInsight({
  insight,
  onOpen,
}: {
  insight: ComfyInsight;
  onOpen: (a: Audience) => void;
}) {
  const aud = insight.target;
  const hint = aud?.healthHint;
  const action =
    hint?.objective === "LOOKALIKE" ? { label: "Build Lookalike", icon: Share2 }
    : hint?.objective === "SUPPRESS" ? { label: "Use as Exclusion", icon: Ban }
    : { label: "Sync to platforms", icon: Send };
  const tone = {
    urgent:      { border: "border-amber-200",   pillBg: "bg-amber-100 text-amber-700",   pillLabel: "Urgent" },
    opportunity: { border: "border-[#a4ffe5]",   pillBg: "bg-[#a4ffe5] text-[#004956]",   pillLabel: "Opportunity" },
    info:        { border: "border-violet-200",  pillBg: "bg-violet-100 text-violet-700", pillLabel: "Heads up" },
  }[insight.urgency];

  return (
    <button
      type="button"
      onClick={() => aud && onOpen(aud)}
      className={cn(
        "group flex flex-col gap-2 rounded-2xl border bg-white p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
        tone.border
      )}
    >
      <span className={cn("inline-flex w-fit rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide", tone.pillBg)}>
        {tone.pillLabel}
      </span>
      <p className="text-sm font-bold leading-snug text-foreground">{insight.headline}</p>
      <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">{insight.why}</p>
      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#004956]">
          <action.icon className="size-3" />
          {action.label}
        </span>
        <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Comfy segment card — minimal: icon, name, count, hint pip   */
/* ────────────────────────────────────────────────────────── */

function ComfySegmentCard({
  audience,
  onOpen,
}: {
  audience: Audience;
  onOpen: (a: Audience) => void;
}) {
  const meta = audience.rfdmKey ? SEGMENTS[audience.rfdmKey] : null;
  const Icon = audience.rfdmKey ? SEGMENT_ICONS[audience.rfdmKey] ?? Users : Users;
  const needsAttention = audience.healthHint?.level === "needs_campaign";
  const isHealthy = audience.healthHint?.level === "healthy";

  return (
    <button
      type="button"
      onClick={() => onOpen(audience)}
      className="group flex flex-col gap-2 rounded-2xl border border-border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#a4ffe5] hover:shadow-md"
    >
      <div className="flex items-start gap-2.5">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: meta?.color ?? "#94a3b8" }}
        >
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{audience.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {audience.size > 0 ? `${((audience.size / 1) * 100 / 1).toFixed(0) /* placeholder, replaced below */}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{formatNumber(audience.size)}</p>
          <p className="text-[10px] font-medium uppercase text-muted-foreground">customers</p>
        </div>
        {audience.growth30d !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              audience.growth30d >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
            )}
          >
            {audience.growth30d >= 0 ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
            {Math.abs(audience.growth30d).toFixed(1)}%
          </span>
        )}
      </div>
      {/* One status line — comfy = single signal, not 4 */}
      {needsAttention ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
          <AlertTriangle className="size-3" />
          Needs a campaign
        </span>
      ) : isHealthy ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
          <Heart className="size-3" />
          Healthy
        </span>
      ) : (
        <span className="text-[10px] text-muted-foreground">{meta?.tagline.slice(0, 64) ?? ""}</span>
      )}
    </button>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Main view                                                  */
/* ────────────────────────────────────────────────────────── */

export function ComfyAudienceManager({
  audiences,
  marimekko,
  profile,
  insights,
  totalLtv,
  topOpportunity,
  onSelectAudience,
  onOpenChat,
  onCreateCampaign,
}: Props) {
  const rfdmAudiences = audiences.filter((a) => a.source === "rfdm");
  const otherCount = audiences.length - rfdmAudiences.length;
  const top3 = insights.slice(0, 3);

  const [showOther, setShowOther] = useState(false);

  return (
    <div className="space-y-5">
      {/* 2-card KPI row — comfy = headline numbers only */}
      <div className="grid gap-3 sm:grid-cols-2">
        <BigKpi
          label="Total customers"
          value={formatNumber(profile.totalCustomers)}
          sublabel={`${profile.monthlyOrders.toLocaleString()} orders / month · ${(profile.neverPurchasedShare * 100).toFixed(0)}% never purchased`}
          icon={Users}
        />
        <BigKpi
          label="Biggest opportunity"
          value={topOpportunity?.name ?? "—"}
          sublabel={topOpportunity?.sublabel ?? ""}
          icon={Crown}
          accent
        />
      </div>

      {/* Top 3 actionable insights — compact */}
      {top3.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="size-4 text-violet-500" />
            <h2 className="text-sm font-bold text-foreground">Your top 3 actions this week</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {top3.map((i) => (
              <CompactInsight key={i.id} insight={i} onOpen={onSelectAudience} />
            ))}
          </div>
        </div>
      )}

      {/* Hero chart */}
      <SegmentMarimekko
        data={marimekko}
        scaleTotal={profile.totalCustomers}
        height={400}
        onCellClick={(segment) => {
          const aud = audiences.find((a) => a.rfdmKey === segment);
          if (aud) onSelectAudience(aud);
        }}
        onCreateCampaign={onCreateCampaign}
      />

      {/* Segments grid — 12 RFDM segments, simple cards */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Your customer segments</h2>
          <Button size="sm" variant="ghost" onClick={onOpenChat} className="h-7 gap-1 text-xs text-violet-600 hover:bg-violet-50">
            <Wand2 className="size-3" />
            Build with AI
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rfdmAudiences.map((a) => (
            <ComfySegmentCard key={a.id} audience={a} onOpen={onSelectAudience} />
          ))}
        </div>
      </div>

      {/* Other lists — collapsed by default */}
      {otherCount > 0 && (
        <div className="rounded-2xl border border-border bg-white">
          <button
            type="button"
            onClick={() => setShowOther((v) => !v)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">Other lists</span>
              <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
                {otherCount}
              </Badge>
              <span className="hidden text-[11px] text-muted-foreground sm:inline">
                · website events, ad engagement, lookalikes, custom lists, AI chat, exclusions
              </span>
            </div>
            <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", showOther && "rotate-90")} />
          </button>
          {showOther && (
            <div className="border-t border-border">
              <div className="divide-y divide-border">
                {audiences
                  .filter((a) => a.source !== "rfdm")
                  .slice(0, 12)
                  .map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onSelectAudience(a)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{a.description}</p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground">{formatNumber(a.size)}</span>
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </button>
                  ))}
              </div>
              {otherCount > 12 && (
                <p className="border-t border-border bg-muted/20 px-4 py-2 text-center text-[11px] text-muted-foreground">
                  Showing 12 of {otherCount} · switch to <strong>Detailed</strong> view to see all
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Single tip explaining the comfy view */}
      <SallaTip>
        This is the <strong>Comfy</strong> view — your top numbers, top actions, and 12 segment cards. Switch to <strong>Detailed</strong> in the header for filters, platform-match dots, AI Studio, and the full library.
      </SallaTip>
    </div>
  );
}
