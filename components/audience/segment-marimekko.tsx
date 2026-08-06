"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Info, Sparkles, AlertTriangle, Rocket, TrendingUp } from "lucide-react";
import { SEGMENTS, type MarimekkoData, type SegmentKey, type SegmentMeta } from "@/lib/audience/rfdm";
import { SallaTip } from "@/components/audience/salla-tip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  data: MarimekkoData;
  /** Click handler — segment cell clicked. Opens the side panel. */
  onCellClick?: (segment: SegmentKey, count: number) => void;
  /** "Create campaign" handler — invoked from the hover-card action
   *  button, bypassing the side panel and jumping straight into the
   *  campaign creation flow with the segment pre-selected. */
  onCreateCampaign?: (segment: SegmentKey, count: number) => void;
  /** Optional fixed total for percentage calc (so figures match merchant scale, not just sample) */
  scaleTotal?: number;
  /** Compact = smaller chart */
  height?: number;
  /**
   * "default" — uses the per-segment colors from SEGMENTS map
   * "teal"    — Salla monochrome teal palette (priority drives darkness),
   *             matches the Figma design.
   */
  palette?: "default" | "teal";
}

/* Salla teal monochrome palette — keyed by segment.
   Lower priority number (more valuable / more urgent) → darker teal. */
const TEAL_PALETTE: Record<SegmentKey, string> = {
  champions:        "#003a47",
  loyal:            "#0d6e7b",
  active:           "#2d8a96",
  previously_loyal: "#3a7d89",
  explorers:        "#4ba0ac",
  needs_attention:  "#5a98a4",
  new:              "#6ba8b3",
  almost_lost:      "#7eb1bb",
  promising:        "#8db8c0",
  at_risk:          "#a3c1c7",
  dormant:          "#c5d6da",
  never_purchased:  "#b8c5c8",
};

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

/* ────────────────────────────────────────────────────────────────
 * Priority meta — drives the "Urgent / High / Medium / Low" pill
 * inside the hover card. Sourced from SegmentMeta.priority.
 * ──────────────────────────────────────────────────────────────── */
function priorityMeta(priority: number): { label: string; className: string; icon: React.ReactNode } {
  if (priority <= 1) return { label: "Urgent",  className: "bg-red-100 text-red-700",     icon: <AlertTriangle className="size-3" /> };
  if (priority <= 3) return { label: "High",    className: "bg-amber-100 text-amber-700", icon: <TrendingUp className="size-3" /> };
  if (priority <= 5) return { label: "Medium",  className: "bg-blue-100 text-blue-700",   icon: <Sparkles className="size-3" /> };
  return { label: "Low", className: "bg-muted text-muted-foreground", icon: <Info className="size-3" /> };
}

/* ────────────────────────────────────────────────────────────────
 * Issue detection — surfaces the top 2 things the merchant should
 * know about this segment before acting. Runs on the hovered
 * segment's current count + metadata.
 * ──────────────────────────────────────────────────────────────── */
function detectIssues(meta: SegmentMeta, count: number, total: number): { text: string; tone: "warn" | "info" | "critical" }[] {
  const issues: { text: string; tone: "warn" | "info" | "critical" }[] = [];
  const pct = total > 0 ? (count / total) * 100 : 0;

  // 1. Priority-urgent segments always flag as time-sensitive.
  if (meta.priority === 1 && count > 0) {
    issues.push({
      text: "High-value segment losing momentum — every day matters",
      tone: "critical",
    });
  }

  // 2. Too small to run a meaningful campaign. Ad platforms typically
  //    need 1,000+ matched users for reliable delivery.
  if (count > 0 && count < 1_000) {
    issues.push({
      text: `Below the 1,000-user threshold most ad platforms need for reliable delivery (currently ${formatNum(count)})`,
      tone: "warn",
    });
  }

  // 3. Empty segment.
  if (count === 0) {
    issues.push({
      text: "No customers currently match this segment",
      tone: "warn",
    });
  }

  // 4. Very large segment — budget spread warning.
  if (pct > 30) {
    issues.push({
      text: `Very large segment (${pct.toFixed(0)}% of your base) — narrow with a channel or interest filter to control cost`,
      tone: "info",
    });
  }

  // 5. Segment-specific playbook nudges.
  if (meta.key === "cart_abandoners" as string) {
    // no-op placeholder — pattern for future segment-specific flags
  }
  if (meta.key === "never_purchased" && pct > 20) {
    issues.push({
      text: "Biggest acquisition pool — first-purchase offer typically doubles conversion rate",
      tone: "info",
    });
  }

  return issues.slice(0, 2);
}

/* ────────────────────────────────────────────────────────────────
 * SegmentHoverCard — floating panel shown on cell / legend hover.
 * Contains the segment definition, priority, computed issues, the
 * strategist recommendation, and a "Create campaign" action button.
 *
 * Uses Radix HoverCard so the popover portals into <body> (never
 * clipped by chart overflow) and handles the mouse-into-card
 * transition without dismissing.
 * ──────────────────────────────────────────────────────────────── */
function SegmentHoverCard({
  meta,
  count,
  total,
  onCreateCampaign,
  onOpenDetails,
  children,
}: {
  meta: SegmentMeta;
  count: number;
  total: number;
  onCreateCampaign?: (segment: SegmentKey, count: number) => void;
  onOpenDetails?: (segment: SegmentKey, count: number) => void;
  children: React.ReactNode;
}) {
  const prio = priorityMeta(meta.priority);
  const issues = detectIssues(meta, count, total);
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";

  return (
    <HoverCard openDelay={150} closeDelay={80}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="center"
        sideOffset={8}
        className="w-72 rounded-2xl border border-border bg-white p-0 shadow-xl"
      >
        {/* Header — segment name + priority pill */}
        <div className="flex items-start justify-between gap-2 px-3.5 pt-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              <p className="truncate text-sm font-bold text-foreground">{meta.name}</p>
            </div>
            <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
              {meta.tagline}
            </p>
          </div>
          <Badge
            className={cn(
              "shrink-0 gap-1 rounded-full px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide",
              prio.className
            )}
          >
            {prio.icon}
            {prio.label}
          </Badge>
        </div>

        {/* Metric strip */}
        <div className="mx-3.5 mt-2.5 flex items-baseline justify-between rounded-lg bg-muted/30 px-2.5 py-1.5">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
              Customers
            </p>
            <p className="text-sm font-bold tabular-nums text-foreground">{formatNum(count)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
              Of base
            </p>
            <p className="text-sm font-bold tabular-nums text-foreground">{pct}%</p>
          </div>
        </div>

        {/* Issues — top 2, only rendered when there are any */}
        {issues.length > 0 && (
          <div className="mx-3.5 mt-2.5 flex flex-col gap-1">
            {issues.map((issue, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] leading-snug",
                  issue.tone === "critical" && "border-red-200 bg-red-50 text-red-800",
                  issue.tone === "warn" && "border-amber-200 bg-amber-50 text-amber-800",
                  issue.tone === "info" && "border-blue-200 bg-blue-50 text-blue-800"
                )}
              >
                {issue.tone === "critical" ? (
                  <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                ) : issue.tone === "warn" ? (
                  <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                ) : (
                  <Info className="mt-0.5 size-3 shrink-0" />
                )}
                <span className="flex-1">{issue.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recommendation — the strategist's next-best-action for this segment */}
        <div className="mx-3.5 mt-2.5 rounded-lg border border-[#a4ffe5]/50 bg-[#e6fff9]/30 px-2.5 py-1.5">
          <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-[#004956]">
            <Sparkles className="size-2.5" />
            Salla recommendation
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-[#004956]/90">
            {meta.recommendation}
          </p>
        </div>

        {/* Actions — Create campaign (primary) + Open details (secondary) */}
        <div className="mt-3 flex gap-2 border-t border-border bg-muted/20 px-3.5 py-2.5">
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCreateCampaign?.(meta.key, count);
            }}
            className="h-7 flex-1 gap-1 text-[11px]"
            disabled={count === 0}
          >
            <Rocket className="size-3" />
            Create campaign
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails?.(meta.key, count);
            }}
            className="h-7 gap-1 text-[11px]"
          >
            Details
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

/**
 * Marimekko-style customer segments chart matching the dev team's
 * `Customer Segments (R × FMD Score)` plot — but interactive.
 *
 *   - 5 columns by R-score; column widths proportional to R-band totals
 *   - Within each column, 5 rows by FM-score; row heights proportional
 *   - Each cell colored by its segment label
 *   - "Never Purchased" sits as a separate strip at the bottom-left
 *   - Hover reveals a floating card with the segment definition,
 *     issues, recommendation, and a "Create campaign" action button
 *   - Click drills into the segment (opens the side panel)
 */
export function SegmentMarimekko({ data, onCellClick, onCreateCampaign, scaleTotal, height = 460, palette = "default" }: Props) {
  const [hover, setHover] = useState<{ segment: SegmentKey } | null>(null);
  const colorFor = (key: SegmentKey) => (palette === "teal" ? TEAL_PALETTE[key] : SEGMENTS[key].color);

  const total = scaleTotal ?? data.total;
  const buyers = total - (scaleTotal
    ? Math.round((data.neverPurchased / Math.max(data.total, 1)) * scaleTotal)
    : data.neverPurchased);
  const neverPurchased = total - buyers;

  // Per-column totals (only over buying customers)
  const colTotals = [1, 2, 3, 4, 5].map((r) =>
    data.cells.filter((c) => c.r === r).reduce((a, c) => a + c.count, 0)
  );
  const buyersInChart = colTotals.reduce((a, b) => a + b, 0);

  // Track unique segments present for legend
  const legendSegments = Array.from(new Set(data.cells.map((c) => c.segment)));
  // Always include never_purchased at the end of the legend
  if (!legendSegments.includes("never_purchased")) legendSegments.push("never_purchased");

  // Scale a sample count to the merchant total
  const scale = (n: number) => Math.round((n / Math.max(buyersInChart, 1)) * buyers);

  // Min weights so empty cells stay visible enough to read labels
  const MIN_COL_WEIGHT = 0.04; // 4%
  const MIN_ROW_WEIGHT = 0.05; // 5%

  const colWeights = colTotals.map((t) => Math.max(t / Math.max(buyersInChart, 1), MIN_COL_WEIGHT));
  const colSum = colWeights.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Customer Segments — R × FMD Score</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Each block sized by customer count. Recency on the X axis, Frequency + Monetary on the Y axis.{" "}
            <strong>Hover any block for the segment story and a one-click campaign action.</strong>{" "}
            Click to open the full side panel.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/20 px-2 py-1">
          <Info className="size-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">
            {formatNum(total)} customers · {formatNum(neverPurchased)} never purchased
          </span>
        </div>
      </div>

      <div className="flex gap-3" style={{ height }}>
        {/* Y-axis label */}
        <div className="flex w-6 flex-col items-center justify-center pb-7">
          <span
            className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Frequency + Monetary (FMD)
          </span>
        </div>

        {/* Y-axis ticks */}
        <div className="flex flex-col justify-between pb-7 pt-0 text-right">
          {[5, 4, 3, 2, 1].map((n) => (
            <span key={n} className="text-[10px] font-semibold tabular-nums text-muted-foreground">
              {n}
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 gap-[2px]">
            {[1, 2, 3, 4, 5].map((r, ri) => {
              const cells = data.cells
                .filter((c) => c.r === r)
                .sort((a, b) => b.fm - a.fm); // FM=5 on top
              const colTotal = Math.max(colTotals[ri], 1);
              const colWeight = colWeights[ri] / colSum;

              return (
                <div
                  key={r}
                  className="flex flex-col gap-[2px]"
                  style={{ flex: colWeight }}
                >
                  {cells.map((cell) => {
                    const meta = SEGMENTS[cell.segment];
                    const rowWeight = Math.max(cell.count / colTotal, MIN_ROW_WEIGHT);
                    const scaled = scale(cell.count);
                    const pct = total > 0 ? ((scaled / total) * 100).toFixed(1) : "0.0";
                    const isHover = hover?.segment === cell.segment;
                    return (
                      <SegmentHoverCard
                        key={`${cell.r}-${cell.fm}`}
                        meta={meta}
                        count={scaled}
                        total={total}
                        onCreateCampaign={onCreateCampaign}
                        onOpenDetails={onCellClick}
                      >
                        <button
                          type="button"
                          onMouseEnter={() => setHover({ segment: cell.segment })}
                          onMouseLeave={() => setHover(null)}
                          onClick={() => onCellClick?.(cell.segment, scaled)}
                          className={cn(
                            "group relative flex flex-col items-center justify-center overflow-hidden rounded-md p-1 text-center transition-all",
                            "hover:z-10 hover:scale-[1.02] hover:shadow-md",
                            cell.count === 0 && "opacity-50"
                          )}
                          style={{
                            flex: rowWeight,
                            backgroundColor: colorFor(cell.segment),
                            outline: isHover ? `2px solid ${colorFor(cell.segment)}` : undefined,
                            outlineOffset: isHover ? 2 : 0,
                          }}
                        >
                          <span className="line-clamp-1 text-[10px] font-bold leading-tight text-white drop-shadow-sm sm:text-xs">
                            {meta.name}
                          </span>
                          <span className="text-[9px] font-medium tabular-nums text-white/90">
                            {formatNum(scaled)} ({pct}%)
                          </span>
                        </button>
                      </SegmentHoverCard>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {/* X-axis ticks */}
          <div className="mt-1 flex gap-[2px]">
            {[1, 2, 3, 4, 5].map((n, ni) => (
              <div
                key={n}
                className="flex justify-center"
                style={{ flex: colWeights[ni] / colSum }}
              >
                <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{n}</span>
              </div>
            ))}
          </div>
          {/* X-axis label */}
          <div className="mt-0.5 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Recency (R Score)
          </div>
        </div>

        {/* Never Purchased side strip */}
        <div className="flex w-12 flex-col items-stretch pb-7">
          <SegmentHoverCard
            meta={SEGMENTS.never_purchased}
            count={neverPurchased}
            total={total}
            onCreateCampaign={onCreateCampaign}
            onOpenDetails={onCellClick}
          >
            <button
              type="button"
              onClick={() => onCellClick?.("never_purchased", neverPurchased)}
              onMouseEnter={() => setHover({ segment: "never_purchased" })}
              onMouseLeave={() => setHover(null)}
              className="group flex flex-1 flex-col items-center justify-end overflow-hidden rounded-md p-1 transition-all hover:scale-[1.02] hover:shadow-md"
              style={{ backgroundColor: colorFor("never_purchased") }}
            >
              <span
                className={cn(
                  "whitespace-nowrap text-[9px] font-bold leading-tight",
                  palette === "teal" ? "text-white" : "text-slate-700"
                )}
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                Never Purchased
              </span>
              <span className={cn("mt-1 text-[9px] font-semibold tabular-nums", palette === "teal" ? "text-white" : "text-slate-700")}>
                {formatNum(neverPurchased)}
              </span>
              <span className="text-[9px] tabular-nums text-slate-500">
                {((neverPurchased / total) * 100).toFixed(1)}%
              </span>
            </button>
          </SegmentHoverCard>
        </div>

        {/* Legend */}
        <div className="hidden w-48 shrink-0 flex-col gap-1 overflow-y-auto pr-1 pb-7 lg:flex">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Segments</p>
          {legendSegments.map((key) => {
            const meta = SEGMENTS[key];
            const segCount = key === "never_purchased"
              ? neverPurchased
              : scale(data.cells.filter((c) => c.segment === key).reduce((a, c) => a + c.count, 0));
            const segPct = total > 0 ? ((segCount / total) * 100).toFixed(1) : "0.0";
            const isHover = hover?.segment === key;
            return (
              <SegmentHoverCard
                key={key}
                meta={meta}
                count={segCount}
                total={total}
                onCreateCampaign={onCreateCampaign}
                onOpenDetails={onCellClick}
              >
                <button
                  type="button"
                  onClick={() => onCellClick?.(key, segCount)}
                  onMouseEnter={() => setHover({ segment: key })}
                  onMouseLeave={() => setHover(null)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors",
                    isHover ? "bg-muted/40" : "hover:bg-muted/30"
                  )}
                >
                  <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: colorFor(key) }} />
                  <span className="flex-1 truncate text-[11px] font-medium text-foreground">{meta.name}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {formatNum(segCount)} <span className="opacity-60">·</span> {segPct}%
                  </span>
                </button>
              </SegmentHoverCard>
            );
          })}
        </div>
      </div>

      {/* Reading guide — small but high-impact for non-specialists */}
      <SallaTip className="mt-3">
        Read left-to-right, bottom-to-top. <strong>Right</strong> = bought recently. <strong>Top</strong> = buys often + spends more.{" "}
        Hover any block for the full segment story with a one-click <strong>Create campaign</strong> action.
      </SallaTip>
    </div>
  );
}
