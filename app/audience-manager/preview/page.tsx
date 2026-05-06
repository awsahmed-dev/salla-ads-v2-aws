"use client";

/**
 * Audience Manager · Tips & Notes Reference
 *
 * Two tabs on one page:
 *
 *  - Information: every tip / note / banner / label as text — current vs.
 *    proposed — plus a few inline live previews of the recommendation card.
 *
 *  - Preview: a table of every health scenario × source category. Click any
 *    row to open the real AudienceDetailSheet rendered with a synthetic
 *    audience that triggers exactly that case, so you see the full UI:
 *    header pills, action buttons, recommendation card, banners, lookalike
 *    education, platform match, etc.
 *
 * No mockups — every preview uses the live components.
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Heart,
  Activity,
  ShieldAlert,
  AlertTriangle,
  PauseCircle,
  GraduationCap,
  Info,
  Lightbulb,
  Crown,
  Database,
  Target,
  ShoppingCart,
  Share2,
  Cloud,
  Wand2,
  Shield,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  computePlatformMatches,
  deriveHealthHint,
  type Audience,
  type AudienceSource,
  type AudienceStatus,
  type SegmentKey,
} from "@/lib/audience/rfdm";
import { AudienceDetailSheet } from "@/components/audience/audience-detail-sheet";

/* ────────────────────────────────────────────────────────── */
/*  Generic table primitives (shared by both tabs)             */
/* ────────────────────────────────────────────────────────── */

function Section({
  title,
  n,
  children,
  summary,
}: {
  title: string;
  n: number;
  summary?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Section {n}</p>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {summary && <p className="mt-1 text-sm text-muted-foreground">{summary}</p>}
      </header>
      {children}
    </section>
  );
}

function Tbl({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function Thead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-border bg-muted/30 text-left">
        {cols.map((c) => (
          <th key={c} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Row({ cells }: { cells: React.ReactNode[] }) {
  return (
    <tr className="border-b border-border align-top last:border-b-0 hover:bg-muted/10">
      {cells.map((c, i) => (
        <td
          key={i}
          className={cn(
            "px-3 py-3 leading-snug",
            i === 0 ? "font-semibold text-foreground" : "text-foreground/90"
          )}
        >
          {c}
        </td>
      ))}
    </tr>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Inline live components used in the Information tab        */
/* ────────────────────────────────────────────────────────── */

function RecCard({
  level,
  reason,
  action,
  target,
}: {
  level: "perfect" | "good" | "warning" | "danger";
  reason: string;
  action: string;
  target: string;
}) {
  const tone = {
    perfect: { bg: "from-emerald-50 to-white", border: "border-emerald-200", icon: CheckCircle2, iconColor: "text-emerald-600", label: "Performing well", labelBg: "bg-emerald-100 text-emerald-700" },
    good:    { bg: "from-teal-50 to-white",    border: "border-teal-200",    icon: Heart,        iconColor: "text-teal-600",    label: "Ready to use",   labelBg: "bg-teal-100 text-teal-700" },
    warning: { bg: "from-amber-50 to-white",   border: "border-amber-200",   icon: Activity,     iconColor: "text-amber-600",   label: "Needs attention", labelBg: "bg-amber-100 text-amber-700" },
    danger:  { bg: "from-red-50 to-white",     border: "border-red-200",     icon: ShieldAlert,  iconColor: "text-red-600",     label: "Won't activate", labelBg: "bg-red-100 text-red-700" },
  }[level];
  const Icon = tone.icon;
  return (
    <div className={cn("rounded-xl border bg-gradient-to-br p-3.5", tone.border, tone.bg)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("size-3.5 shrink-0", tone.iconColor)} />
        <span className={cn("inline-flex rounded-full px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide", tone.labelBg)}>
          {tone.label}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] font-bold leading-snug text-foreground">{reason}</p>
      <p className="mt-1 text-[11px] leading-snug text-foreground/80">{action}</p>
      <p className="mt-2 text-[10px] italic text-muted-foreground">→ {target}</p>
    </div>
  );
}

function TooSmallBanner() {
  return (
    <div className="rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-white p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-red-900">This list won't activate on any ad platform yet</h3>
          <p className="mt-1 text-[11px] leading-snug text-red-800">
            You have <strong>690</strong> customers in this list. Every ad platform — Meta, Google, Snap, TikTok, YouTube — requires a minimum of <strong>1,000</strong> matched customers before it will deliver ads to an audience. Until then, we hold the list locally.
          </p>
          <div className="mt-3">
            <div className="mb-1 flex items-baseline justify-between text-[10px] font-semibold text-red-700">
              <span>690 now</span>
              <span>310 more needed</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-red-100">
              <div className="h-full rounded-full bg-red-500" style={{ width: "69%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchPaused() {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <PauseCircle className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-bold text-muted-foreground">Platform Match · paused</h3>
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">
        We pause platform matching for lists below 1,000 to avoid showing misleading numbers. The full 5-platform breakdown — Meta, Google, Snap, TikTok, YouTube — will reappear automatically the moment this list crosses the threshold.
      </p>
    </div>
  );
}

function LookalikeEdu() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#a4ffe5] bg-[#e6fff9]/60 p-3">
      <GraduationCap className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
      <p className="text-[11px] leading-snug text-foreground/80">
        <strong>About Lookalikes</strong> — A Lookalike finds <em>new people</em> on Meta who behave like the customers in this list. Important: those new people don't enter your store as the same segment. They start as <strong>New customers</strong> and progress through RFDM as they buy. Use Lookalikes to find prospects who could grow into this segment over time — not to instantly clone it.
      </p>
    </div>
  );
}

function MatchRateTip() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#a4ffe5] bg-[#e6fff9]/70 p-3">
      <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
      <p className="text-[11px] leading-snug text-foreground/80">
        <strong className="text-[#004956]">Salla Tip:</strong> Match rate measures how many of your customers each ad platform can identify by email or phone. <strong>60% or higher is healthy.</strong> If yours is lower, the fix is to collect both email <em>and</em> phone at checkout — every 1% improvement here lifts your match rate by roughly 1% across all platforms, which makes retargeting cheaper.
      </p>
    </div>
  );
}

const SOURCE_PILLS: Array<{ label: string; icon: typeof Crown; bg: string }> = [
  { label: "RFDM",          icon: Crown,        bg: "bg-emerald-50 text-emerald-700" },
  { label: "Store Segment", icon: Database,     bg: "bg-emerald-50 text-emerald-700" },
  { label: "Website Event", icon: Target,       bg: "bg-blue-50 text-blue-700" },
  { label: "Ad Engagement", icon: ShoppingCart, bg: "bg-amber-50 text-amber-700" },
  { label: "Lookalike",     icon: Share2,       bg: "bg-teal-50 text-teal-700" },
  { label: "Custom List",   icon: Cloud,        bg: "bg-slate-100 text-slate-700" },
  { label: "AI Chat",       icon: Wand2,        bg: "bg-violet-50 text-violet-700" },
  { label: "Blocklist",     icon: Shield,       bg: "bg-red-50 text-red-700" },
];

/* ────────────────────────────────────────────────────────── */
/*  Preview tab — synthetic audiences for every scenario       */
/* ────────────────────────────────────────────────────────── */

interface ScenarioRow {
  id: string;
  group: "RFDM" | "Cohort source" | "Cumulative source" | "Special";
  scenario: string;
  /** Trigger explanation — what condition fires */
  trigger: string;
  /** Pill level */
  level: "perfect" | "good" | "warning" | "danger";
  audience: Audience;
}

function makeAudience(opts: {
  id: string;
  source: AudienceSource;
  size: number;
  growth30d: number;
  status?: AudienceStatus;
  rfdmKey?: SegmentKey;
  name: string;
  description: string;
  originPlatform?: Audience["originPlatform"];
}): Audience {
  const seed = opts.id.length * 7 + 13;
  const status: AudienceStatus = opts.status ?? "ready";
  const built: Audience = {
    id: opts.id,
    name: opts.name,
    description: opts.description,
    source: opts.source,
    size: opts.size,
    status,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - (status === "stale" ? 18 : 1) * 86400000).toISOString(),
    growth30d: opts.growth30d,
    sparkline: Array.from({ length: 12 }, () => opts.size),
    platformMatches: computePlatformMatches(opts.size, seed),
    useCases: ["retarget"],
    tags: [opts.source.replace(/_/g, "-")],
    rfdmKey: opts.rfdmKey,
    originPlatform: opts.originPlatform,
  };
  built.healthHint = deriveHealthHint(built);
  return built;
}

const SCENARIOS: ScenarioRow[] = [
  // ── RFDM (cohort) — 5 cases
  {
    id: "rfdm_perfect",
    group: "RFDM",
    scenario: "Perfect · Champions growing",
    trigger: "size ≥ 5k AND growth ≥ 5%",
    level: "perfect",
    audience: makeAudience({
      id: "demo_rfdm_perfect",
      source: "rfdm",
      rfdmKey: "champions",
      size: 24_500,
      growth30d: 8.2,
      name: "Champions",
      description: "Low avg_days_from_last_order, high total_orders, high total_spending.",
    }),
  },
  {
    id: "rfdm_good",
    group: "RFDM",
    scenario: "Good · Active steady",
    trigger: "size ≥ 5k AND growth between -10% and +5%",
    level: "good",
    audience: makeAudience({
      id: "demo_rfdm_good",
      source: "rfdm",
      rfdmKey: "active",
      size: 11_200,
      growth30d: 1.8,
      name: "Active",
      description: "Bought recently — avg_days_from_last_order under 200.",
    }),
  },
  {
    id: "rfdm_warning_small",
    group: "RFDM",
    scenario: "Warning · Promising small",
    trigger: "size between 1k and 5k",
    level: "warning",
    audience: makeAudience({
      id: "demo_rfdm_small",
      source: "rfdm",
      rfdmKey: "promising",
      size: 3_500,
      growth30d: 5.0,
      name: "Promising",
      description: "Recent buyer with low total_spending — not yet committed.",
    }),
  },
  {
    id: "rfdm_warning_slipping",
    group: "RFDM",
    scenario: "Warning · At Risk slipping",
    trigger: "cohort source AND growth ≤ -10%",
    level: "warning",
    audience: makeAudience({
      id: "demo_rfdm_slipping",
      source: "rfdm",
      rfdmKey: "at_risk",
      size: 8_400,
      growth30d: -14.2,
      name: "At Risk",
      description: "Previously valuable buyers, no order in 60+ days.",
    }),
  },
  {
    id: "rfdm_danger",
    group: "RFDM",
    scenario: "Danger · Champions too small",
    trigger: "size < 1,000",
    level: "danger",
    audience: makeAudience({
      id: "demo_rfdm_danger",
      source: "rfdm",
      rfdmKey: "champions",
      size: 690,
      growth30d: 6.6,
      name: "Champions",
      description: "Low avg_days_from_last_order, high total_orders, high total_spending.",
    }),
  },

  // ── Cohort sources (Store / Website Event / Ad Engagement) — 4 cases
  {
    id: "cohort_perfect",
    group: "Cohort source",
    scenario: "Perfect · Store Segment",
    trigger: "size ≥ 5k AND growth ≥ 5%",
    level: "perfect",
    audience: makeAudience({
      id: "demo_cohort_perfect",
      source: "salla_segment",
      size: 11_400,
      growth30d: 6.2,
      name: "High AOV buyers (≥ 500 SAR)",
      description: "Average order value in the top quintile.",
    }),
  },
  {
    id: "cohort_good",
    group: "Cohort source",
    scenario: "Good · Website Event steady",
    trigger: "size ≥ 5k AND growth between -10% and +5%",
    level: "good",
    audience: makeAudience({
      id: "demo_cohort_good",
      source: "website_event",
      size: 8_200,
      growth30d: 1.4,
      name: "Website visitors — 30 days",
      description: "Anyone who loaded any page in the last 30 days.",
    }),
  },
  {
    id: "cohort_warning_stale",
    group: "Cohort source",
    scenario: "Warning · Ad Engagement stale",
    trigger: "status = stale (14d+ since refresh)",
    level: "warning",
    audience: makeAudience({
      id: "demo_cohort_stale",
      source: "ad_engagement",
      size: 7_100,
      growth30d: 2.1,
      status: "stale",
      originPlatform: "meta",
      name: "Meta — Video 75% viewers",
      description: "Watched 75%+ of your videos.",
    }),
  },
  {
    id: "cohort_danger",
    group: "Cohort source",
    scenario: "Danger · Cart abandoners too small",
    trigger: "size < 1,000",
    level: "danger",
    audience: makeAudience({
      id: "demo_cohort_danger",
      source: "website_event",
      size: 800,
      growth30d: 1.5,
      name: "Cart abandoners — 7 days",
      description: "Hot retargeting pool from your pixel.",
    }),
  },

  // ── Cumulative sources (Lookalike / Custom List / AI Chat) — 3 cases
  // Cumulative don't have a "good" middle state — they're either large enough
  // to be perfect, or below 5k and warning, or below 1k and danger.
  {
    id: "cumul_perfect",
    group: "Cumulative source",
    scenario: "Perfect · Lookalike 1%",
    trigger: "cumulative AND size ≥ 5k",
    level: "perfect",
    audience: makeAudience({
      id: "demo_cumul_perfect",
      source: "lookalike",
      size: 60_000,
      growth30d: 0,
      name: "Lookalike 1% — Champions (Meta KSA)",
      description: "Top 1% similar users in Saudi Arabia.",
    }),
  },
  {
    id: "cumul_warning",
    group: "Cumulative source",
    scenario: "Warning · Custom List small",
    trigger: "size between 1k and 5k",
    level: "warning",
    audience: makeAudience({
      id: "demo_cumul_warning",
      source: "custom_list",
      size: 2_340,
      growth30d: 0,
      name: "Event attendees — Ramadan Expo",
      description: "Offline event opt-ins.",
    }),
  },
  {
    id: "cumul_danger",
    group: "Cumulative source",
    scenario: "Danger · Custom List too small",
    trigger: "size < 1,000",
    level: "danger",
    audience: makeAudience({
      id: "demo_cumul_danger",
      source: "custom_list",
      size: 124,
      growth30d: 0,
      name: "VIP wholesale buyers",
      description: "Manually uploaded CSV — B2B partners.",
    }),
  },

  // ── Special cases
  {
    id: "blocklist",
    group: "Special",
    scenario: "Blocklist · ready as exclusion",
    trigger: "source = blocklist (action becomes 'Use as Exclusion')",
    level: "perfect",
    audience: makeAudience({
      id: "demo_blocklist",
      source: "blocklist",
      size: 5_400,
      growth30d: 0,
      name: "Blocklist — Refund requesters",
      description: "Customers flagged for fraud or chargebacks.",
    }),
  },
  {
    id: "sync_error",
    group: "Special",
    scenario: "Sync error",
    trigger: "status = error",
    level: "danger",
    audience: makeAudience({
      id: "demo_sync_error",
      source: "lookalike",
      size: 8_400,
      growth30d: 0,
      status: "error",
      name: "Lookalike 3% — High-CLV forecast",
      description: "Broader reach lookalike — sync hit an error.",
    }),
  },
];

const LEVEL_PILL: Record<ScenarioRow["level"], { label: string; cls: string }> = {
  perfect: { label: "Perfect", cls: "bg-emerald-100 text-emerald-700" },
  good:    { label: "Good",    cls: "bg-teal-100 text-teal-700" },
  warning: { label: "Warning", cls: "bg-amber-100 text-amber-700" },
  danger:  { label: "Danger",  cls: "bg-red-100 text-red-700" },
};

const GROUP_BADGE: Record<ScenarioRow["group"], string> = {
  RFDM:                "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Cohort source":     "bg-blue-50 text-blue-700 border-blue-200",
  "Cumulative source": "bg-teal-50 text-teal-700 border-teal-200",
  Special:             "bg-violet-50 text-violet-700 border-violet-200",
};

function ScenarioTable({ onOpen }: { onOpen: (a: Audience) => void }) {
  // Group by group key for visual sectioning
  const groups: Record<ScenarioRow["group"], ScenarioRow[]> = {
    RFDM: [],
    "Cohort source": [],
    "Cumulative source": [],
    Special: [],
  };
  SCENARIOS.forEach((s) => groups[s.group].push(s));

  return (
    <div className="space-y-6">
      {(Object.keys(groups) as Array<ScenarioRow["group"]>).map((g) => {
        const rows = groups[g];
        if (rows.length === 0) return null;
        return (
          <div key={g} className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", GROUP_BADGE[g])}>
                  {g}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {g === "RFDM" && "Cohort — recomputed every 2 weeks. All 4 levels possible + 'slipping' warning."}
                  {g === "Cohort source" && "Store Segment / Website Event / Ad Engagement. Same level rules as RFDM."}
                  {g === "Cumulative source" && "Lookalike / Custom List / AI Chat. Only grow — no 'good' middle state, no 'slipping' warning."}
                  {g === "Special" && "Source-specific UX — Blocklist swaps the action to 'Use as Exclusion'; sync errors trigger the danger banner."}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">{rows.length} scenarios</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Scenario</th>
                  <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Source</th>
                  <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Size</th>
                  <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-muted-foreground">30d</th>
                  <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Trigger</th>
                  <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Level</th>
                  <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Open</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const a = r.audience;
                  const pill = LEVEL_PILL[r.level];
                  const sourceShort = (
                    a.source === "rfdm"          ? "RFDM"
                  : a.source === "salla_segment" ? "Store Segment"
                  : a.source === "website_event" ? "Website Event"
                  : a.source === "ad_engagement" ? `Ad Engagement (${a.originPlatform})`
                  : a.source === "lookalike"     ? "Lookalike"
                  : a.source === "custom_list"   ? "Custom List"
                  : a.source === "ai_chat"       ? "AI Chat"
                  : a.source === "blocklist"     ? "Blocklist"
                  : a.source);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onOpen(a)}
                      className="cursor-pointer border-b border-border align-top transition-colors hover:bg-muted/30 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{r.scenario}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{a.name}</p>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-foreground/80">{sourceShort}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground">
                        {a.size >= 1_000_000 ? (a.size / 1_000_000).toFixed(1) + "M"
                         : a.size >= 1_000 ? (a.size / 1_000).toFixed(1) + "k"
                         : a.size.toLocaleString()}
                      </td>
                      <td className={cn(
                        "px-4 py-3 text-right tabular-nums text-[11px] font-semibold",
                        a.growth30d > 0 ? "text-emerald-600" : a.growth30d < 0 ? "text-red-500" : "text-muted-foreground"
                      )}>
                        {a.growth30d === 0 ? "—" : (a.growth30d > 0 ? "+" : "") + a.growth30d.toFixed(1) + "%"}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground">{r.trigger}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", pill.cls)}>
                          {pill.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Information tab content (everything from before)           */
/* ────────────────────────────────────────────────────────── */

function InformationTab() {
  return (
    <div className="space-y-12">
      {/* ── Section 1: Recommendation Card — visual ── */}
      <Section
        n={1}
        title="Recommendation card · 4 levels"
        summary="The headline guidance on every audience detail. Same template, different tone per level. Below: live render of all four states using the proposed text."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <RecCard
            level="perfect"
            reason="Large, growing week-over-week, and well-identified on ad platforms. This is exactly what a healthy segment looks like — keep using it."
            action="Use it as targeting in your next campaign. Build a Lookalike on Meta or Snap to find similar new customers and expand your reach beyond this list."
            target="Aim to keep size above 5,000 and match rate above 60% so this list stays in the green."
          />
          <RecCard
            level="good"
            reason="This list is healthy enough to use as targeting today. No urgent action needed — just keep an eye on it monthly."
            action="Use it as targeting in your next campaign in Ad Management. Refresh it about once a month so the customer data stays current."
            target="Set a calendar reminder to revisit this monthly — small fluctuations in size are normal and don't need action."
          />
          <RecCard
            level="warning"
            reason="Between 1,000 and 5,000 customers — it will run, but reach is narrow and CPM tends to climb. Growing past 5,000 gives much steadier delivery."
            action="Activate it now while it's still active, or focus on growing the audience past 5,000. Building a Lookalike from this list also turns it into a much bigger reach pool."
            target="A list above 5,000 customers gives you steadier delivery and lower CPM on most platforms. That's the threshold to aim for."
          />
          <RecCard
            level="danger"
            reason="Only 690 customers — ad platforms need at least 1,000 to deliver. This list is on hold until it grows."
            action="Three options: build a Lookalike from this list (Meta accepts seeds from 100 customers), widen the segment filters to include more people, or wait — the list grows automatically as new customers match the criteria."
            target="1,000 matched customers is the universal minimum across Meta, Google, Snap, TikTok, and YouTube. Below that, no platform will activate the list."
          />
        </div>
      </Section>

      {/* ── Section 2: Health Reasons table ── */}
      <Section
        n={2}
        title="Health system · reasons (per signal trigger)"
        summary="Which reason fires depends on which signal tripped first. Cohort sources (RFDM, Store, Website Event, Ad Engagement) can fire 'slipping'. Cumulative sources (Lookalike, Custom List, AI Chat, Blocklist) only grow."
      >
        <Tbl>
          <Thead cols={["Trigger", "Level", "Current", "Proposed (medium length)"]} />
          <tbody>
            {[
              ["too_small", "danger", "Below 1,000 — won't activate on ad platforms.", "Only {size} customers — ad platforms need at least 1,000 to deliver. This list is on hold until it grows."],
              ["sync_error", "danger", "Sync error — needs fixing.", "Auto-sync hit an error and stopped pushing this list to platforms. Check your connected accounts, then it will resume on the next cycle."],
              ["stale", "warning", "Hasn't refreshed in 14+ days.", "This list hasn't pulled fresh data in over 14 days. The next auto-sync will catch it up — usually within a few hours."],
              ["small (1k–5k)", "warning", "Small audience — limited delivery.", "Between 1,000 and 5,000 customers — it will run, but reach is narrow and CPM tends to climb. Growing past 5,000 gives much steadier delivery."],
              ["slipping (cohort)", "warning", "Customers are leaving this segment.", "This segment shrunk {growth30d}% in the last 30 days — customers are aging out faster than new ones replace them. Worth acting on this week."],
              ["perfect_cohort", "perfect", "Strong list — growing with high match rate.", "Large, growing week-over-week, and well-identified on ad platforms. This is exactly what a healthy segment looks like — keep using it."],
              ["perfect_cumulative", "perfect", "Strong list — large and high match rate.", "Large and well-identified on ad platforms. Ready for any retargeting or acquisition campaign you want to run."],
              ["good", "good", "Healthy list, ready to activate.", "This list is healthy enough to use as targeting today. No urgent action needed — just keep an eye on it monthly."],
            ].map((r, i) => (
              <Row key={i} cells={[<code key="t" className="text-[11px] font-mono text-violet-700">{r[0]}</code>, <span key="l" className="text-[11px] uppercase">{r[1]}</span>, r[2], r[3]]} />
            ))}
          </tbody>
        </Tbl>
      </Section>

      {/* ── Section 3: Actions & Targets table ── */}
      <Section
        n={3}
        title="Health system · actions & benchmarks (per level)"
        summary="Universal — same wording for every audience at the same level. The only thing that changes is the reason above."
      >
        <Tbl>
          <Thead cols={["Level", "Current action", "Proposed action", "Proposed benchmark"]} />
          <tbody>
            {[
              ["Perfect",
                "Use it as targeting in Ad Management. Build a Lookalike to expand reach.",
                "Use it as targeting in your next campaign. Build a Lookalike on Meta or Snap to find similar new customers and expand your reach beyond this list.",
                "Aim to keep size above 5,000 and match rate above 60% so this list stays in the green."],
              ["Good",
                "Use it as targeting in Ad Management.",
                "Use it as targeting in your next campaign in Ad Management. Refresh it about once a month so the customer data stays current.",
                "Set a calendar reminder to revisit this monthly — small fluctuations in size are normal and don't need action."],
              ["Warning",
                "Activate now or grow it. Build a Lookalike to extend reach.",
                "Activate it now while it's still active, or focus on growing the audience past 5,000. Building a Lookalike from this list also turns it into a much bigger reach pool.",
                "A list above 5,000 customers gives you steadier delivery and lower CPM on most platforms. That's the threshold to aim for."],
              ["Danger",
                "Build a Lookalike (Meta accepts 100+), widen the filters, or wait for growth.",
                "Three options: build a Lookalike from this list (Meta accepts seeds from 100 customers), widen the segment filters to include more people, or wait — the list grows automatically as new customers match the criteria.",
                "1,000 matched customers is the universal minimum across Meta, Google, Snap, TikTok, and YouTube. Below that, no platform will activate the list."],
            ].map((r, i) => (
              <Row key={i} cells={r} />
            ))}
          </tbody>
        </Tbl>
      </Section>

      {/* ── Section 4: Banners — visual previews ── */}
      <Section
        n={4}
        title="Banners & status notes (live previews)"
        summary="The five 'something's wrong' / 'something's paused' visual elements rendered using the proposed text."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Too-small banner (full)</p>
            <TooSmallBanner />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Platform Match · paused</p>
            <MatchPaused />
            <p className="mt-3 text-[11px] font-semibold uppercase text-muted-foreground">Stale note</p>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <p className="text-[11px] leading-snug text-foreground/80">
                  <strong>Note:</strong> This list hasn't refreshed in over 14 days. The next auto-sync (usually within a few hours) will pull the latest customers from your store and update size and match rates.
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase text-muted-foreground">Header status badges</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                <AlertTriangle className="size-2.5" /> Won't activate
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                <Info className="size-2.5" /> Stale
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 5: Captions table ── */}
      <Section
        n={5}
        title="Auto-sync captions & paused panel"
        summary="The one-liner that sits under the action row, plus the panel that replaces Platform Match when the list is too small."
      >
        <Tbl>
          <Thead cols={["Where", "Current", "Proposed (medium length)"]} />
          <tbody>
            <Row cells={["Auto-sync caption (healthy)", "Auto-synced to your connected platforms. Last refreshed {time}.", "This list is auto-synced to every connected ad platform — no manual action needed. Last refresh: {time}."]} />
            <Row cells={["Auto-sync caption (too-small)", "Holding locally — won't push to ad platforms until this passes 1,000 customers.", "Holding locally for now. Auto-sync to ad platforms will resume the moment this list grows past 1,000 customers."]} />
            <Row cells={["Stale note", "This list hasn't been refreshed in a while. The next auto-sync will pull the latest customers from your store data.", "This list hasn't refreshed in over 14 days. The next auto-sync (usually within a few hours) will pull the latest customers from your store and update size and match rates."]} />
            <Row cells={["Platform Match · paused", "We won't compute or push platform matches for this list until it has at least 1,000 customers. The 5-platform breakdown reappears here automatically once it grows past the threshold.", "We pause platform matching for lists below 1,000 to avoid showing misleading numbers. The full 5-platform breakdown — Meta, Google, Snap, TikTok, YouTube — will reappear automatically the moment this list crosses the threshold."]} />
          </tbody>
        </Tbl>
      </Section>

      {/* ── Section 6: Educational tips — visuals + table ── */}
      <Section
        n={6}
        title="Educational tips"
        summary="The two contextual lessons we teach the merchant. Below: live previews using proposed text."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Lookalike education tip</p>
            <LookalikeEdu />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Match rate tip (Salla Tip)</p>
            <MatchRateTip />
          </div>
        </div>
        <div className="mt-4">
          <Tbl>
            <Thead cols={["Where", "Current", "Proposed"]} />
            <tbody>
              <Row cells={["Lookalike education", "About lookalikes: finds similar new buyers, doesn't replicate this list. New people enter as 'New' and grow through RFDM.", "About Lookalikes — A Lookalike finds new people on Meta who behave like the customers in this list. Important: those new people don't enter your store as the same segment. They start as New customers and progress through RFDM as they buy. Use Lookalikes to find prospects who could grow into this segment over time — not to instantly clone it."]} />
              <Row cells={["Match rate tip", "60%+ is healthy. Low rates = collect more emails/phones at checkout.", "Match rate measures how many of your customers each ad platform can identify by email or phone. 60% or higher is healthy. If yours is lower, the fix is to collect both email and phone at checkout — every 1% improvement here lifts your match rate by roughly 1% across all platforms, which makes retargeting cheaper."]} />
              <Row cells={["AI rationale prefix", '"Why this audience" → {reason}', "This audience was built from your real store data. Here's exactly what it filters on:"]} />
            </tbody>
          </Tbl>
        </div>
      </Section>

      {/* ── Section 7: Page surface tips ── */}
      <Section
        n={7}
        title="Page surface tips & section headers"
        summary="Subtitle, tab descriptions, view-specific notes — the connective tissue between the dense sections."
      >
        <Tbl>
          <Thead cols={["Where", "Current", "Proposed"]} />
          <tbody>
            <Row cells={["Page subtitle", "Prepare audiences here — sync, build lookalikes, manage exclusions. Launch campaigns in Ad Management → Create Ad.", "Prepare and manage every audience your store can target with — RFDM segments, store segments, pixel events, lookalikes, and more. To launch a campaign using any of these, head to Ad Management → Create Ad."]} />
            <Row cells={["'Recommended this week' tooltip", "Top 3 picks combining your real store data and the Saudi calendar.", "The top 3 audience actions for this week, picked by combining your real store data with upcoming KSA seasonal events (Eid, White Friday, Ramadan, etc.)."]} />
            <Row cells={["Library tab description", "All your audiences in one place — segments, predictions, imports, lists. Filter by source and platform readiness.", "Every audience you have, in one searchable list. Filter by source (RFDM, store, pixel, ad engagement, lookalike, custom, AI, blocklist) or by platform readiness."]} />
            <Row cells={["RFDM Explorer description", "Visual breakdown of your customer base by Recency × Frequency × Monetary × Diversity.", "A visual breakdown of your customer base across the RFDM scoring grid — Recency × Frequency × Monetary, with Diversity surfaced as the Explorers segment. Click any block to open that segment."]} />
            <Row cells={["AI Studio description", "Audiences you built by describing them in plain language. Smart pre-built suggestions are on the AI team's roadmap.", "Audiences you build by describing them in plain language — 'VIP customers in UAE who bought 3 months ago' becomes a real filter. Pre-built smart segments are on the AI team's roadmap."]} />
            <Row cells={["Channel Sync description", "Per-platform audience match status across Meta, Google, Snap, TikTok, and YouTube.", "The match-rate scorecard for every platform you've connected. Sync runs automatically every hour — this view is read-only."]} />
            <Row cells={["Marimekko reading guide", "Read this chart left-to-right and bottom-to-top. Right side = customers who bought recently. Top = customers who buy often and spend more. The big colored blocks on the top-right (Champions, Loyal, Active) are your most valuable customers.", "Read the chart from bottom-left (low value) to top-right (high value). The right side shows customers who bought recently; the top shows customers who buy often and spend a lot. The biggest, darkest blocks on the top-right — Champions, Loyal, Active — are your most valuable customers. The grey strip on the far left is 'Never Purchased' — people in your DB who haven't bought yet."]} />
            <Row cells={["Comfy view bottom note", "This is the Comfy view — your top numbers, top actions, and 12 segment cards. Switch to Detailed in the header for filters, platform-match dots, AI Studio, and the full library.", "You're in Comfy view — top numbers, the 3 most useful actions, and the 12 RFDM segment cards. Switch to Detailed in the header to see filters, per-platform match dots, AI Studio, and the full unified library."]} />
            <Row cells={["Figma view RFDM teal note", "Salla teal palette — darker shades are the most valuable / most urgent segments. The leftmost strip is Never purchased (no R/F/M score, sits outside the matrix). Click any block to open that segment's details.", "This is the Salla teal palette — darker shades are the most valuable or most urgent segments. The grey strip on the left is Never Purchased customers (no Recency/Frequency/Monetary score yet, so they sit outside the matrix). Click any block to open that segment in the side drawer."]} />
            <Row cells={["Channel sync per-platform caption", "Auto-syncs every hour", "Audiences sync to this platform automatically every hour — no manual push needed."]} />
          </tbody>
        </Tbl>
      </Section>

      {/* ── Section 8: KPI tooltips ── */}
      <Section
        n={8}
        title="KPI tooltips · top-strip metrics"
        summary="The three info-icon tooltips on the metric strip at the top of every view."
      >
        <Tbl>
          <Thead cols={["Metric", "Current tooltip", "Proposed (medium length)"]} />
          <tbody>
            <Row cells={["Customers", "Everyone in your store database, including buyers, account holders, and newsletter subscribers. The reach ceiling for any campaign.", "Every customer in your Salla store database — buyers, account holders, newsletter subscribers, abandoned-cart visitors. This is the absolute reach ceiling for any campaign you run."]} />
            <Row cells={["Cart abandoners", "Customers who added items to cart in the last 7 days but didn't check out. Your hottest retargeting pool — a quick reminder usually closes the sale.", "Customers who added something to cart in the last 7 days but didn't complete checkout. This is the hottest retargeting pool you have — a simple reminder ad or coupon usually closes the sale."]} />
            <Row cells={["Never purchased", "Customers in your DB who never placed an order (newsletter sign-ups, account creators, leads). Your biggest acquisition opportunity.", "Customers in your database who have never placed an order — newsletter sign-ups, account creators, abandoned-cart visitors, leads. This is your biggest pure-acquisition opportunity."]} />
          </tbody>
        </Tbl>
      </Section>

      {/* ── Section 9: Source labels — visuals + table ── */}
      <Section
        n={9}
        title="Source labels · the 8 audience types"
        summary="The pill that appears at the top of every audience detail and as a column in the library."
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {SOURCE_PILLS.map((p) => (
            <span key={p.label} className={cn("inline-flex items-center gap-1 rounded-full border-transparent px-2 py-0.5 text-[11px] font-semibold", p.bg)}>
              <p.icon className="size-3" />
              {p.label}
            </span>
          ))}
        </div>
        <Tbl>
          <Thead cols={["Source", "Current label", "Proposed (with context)"]} />
          <tbody>
            <Row cells={["RFDM", "RFDM Segment", "RFDM Segment — recomputed by Salla every 2 weeks"]} />
            <Row cells={["Store Segment", "Store Segment", "Store Segment — built by you in Salla store admin"]} />
            <Row cells={["Website Event", "Website Event", "Website Event — Salla pixel firing on your site"]} />
            <Row cells={["Ad Engagement", "Ad Engagement · {platform}", "Ad Engagement on {platform} — locked to this platform's data"]} />
            <Row cells={["Lookalike", "Lookalike", "Lookalike — similar new customers found by the platform"]} />
            <Row cells={["Custom List", "Custom List", "Custom List — uploaded by you, synced to all platforms"]} />
            <Row cells={["AI Chat", "AI · Chat-generated", "AI Chat — built by describing what you wanted in plain language"]} />
            <Row cells={["Blocklist", "Blocklist / Exclusion", "Blocklist — used as exclusion on every campaign"]} />
          </tbody>
        </Tbl>
      </Section>

      {/* ── Section 10: Recap ── */}
      <Section
        n={10}
        title="Top 5 priorities to apply first"
        summary="Where the current text is weakest and the lift would be biggest."
      >
        <Tbl>
          <Thead cols={["#", "What", "Why"]} />
          <tbody>
            <Row cells={["1", "Match rate tip", "Currently the weakest — doesn't explain why match rates matter or what action lifts them."]} />
            <Row cells={["2", "Lookalike education", "Needs to keep the 'they don't enter as Champions' lesson but flow as a sentence, not a fragment."]} />
            <Row cells={["3", "Health reasons (all 8)", "Every line should be a full sentence with the why baked in — not just a label."]} />
            <Row cells={["4", "Auto-sync caption (healthy)", "Needs to mention 'no manual action needed' so merchants stop hunting for a sync button."]} />
            <Row cells={["5", "Too-small banner body", "Needs the explicit 'Until then, we hold the list locally' so merchants understand what is happening, not just what isn't."]} />
          </tbody>
        </Tbl>
      </Section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Page                                                        */
/* ────────────────────────────────────────────────────────── */

export default function AudienceTipsReferencePage() {
  const [tab, setTab] = useState<"information" | "preview">("information");
  const [detail, setDetail] = useState<Audience | null>(null);

  return (
    <div className="min-h-screen bg-[#f8fafb] pb-24">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {/* Page header */}
        <header>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#004956]">Reference</p>
          <h1 className="mt-1 text-3xl font-bold text-[#004956]">Audience Manager · Tips & Notes</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Two views, one page: <strong>Information</strong> shows every tip text current vs. proposed.
            <strong> Preview</strong> lists every health scenario in a table — click any row to open the live detail drawer with that exact case.
          </p>
        </header>

        {/* Tab switcher */}
        <div className="flex w-fit items-center gap-0.5 rounded-full border border-border bg-white p-0.5">
          {(["information", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-all",
                tab === t ? "bg-[#004956] text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
          <span className="px-2 text-[10px] text-muted-foreground">
            {tab === "information" ? "10 sections of tip text" : `${SCENARIOS.length} clickable scenarios`}
          </span>
        </div>

        {/* Tab content */}
        {tab === "information" ? (
          <InformationTab />
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-[#a4ffe5] bg-[#e6fff9]/60 p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                <p className="text-[11px] leading-snug text-foreground/85">
                  <strong className="text-[#004956]">How to use this:</strong> click any row to open the live detail drawer rendered with a synthetic audience in exactly that state. You'll see the header pills, action buttons, recommendation card, banners, lookalike education, platform match panel — exactly as a merchant would see them.
                </p>
              </div>
            </div>
            <ScenarioTable onOpen={setDetail} />
          </div>
        )}
      </div>

      {/* Live detail drawer (used by Preview tab) */}
      <AudienceDetailSheet
        audience={detail}
        open={!!detail}
        onOpenChange={(v) => !v && setDetail(null)}
        onLookalikeCreated={() => {}}
        onExclusionToggled={() => {}}
        onCreateCampaign={() => {}}
      />
    </div>
  );
}
